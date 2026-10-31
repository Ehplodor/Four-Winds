// Intelligence Artificielle multi-niveaux :
// - 'novice'    : Apprenti (heuristique légère avec bruit élevé)
// - 'tactician' : Tacticien (évaluation complète des captures, éléments, synergies, coins et exposition)
// - 'master'    : Grand Maître (recherche Minimax Alpha-Bêta anticipant la meilleure réplique adverse)

import {
  legalMoves,
  play,
  neighbors,
  score,
  getEffectiveValue,
  getCardBonuses,
  DEFAULT_RULES,
} from './engine.js';

function exposurePenalty(state, cell, card, owner = null) {
  const rules = state.rules || DEFAULT_RULES;
  const resolvedOwner = owner !== null ? owner : state.board[cell]?.owner ?? state.turn;
  const ctx = {
    cell,
    owner: resolvedOwner,
    board: state.board,
    boardElements: state.boardElements,
    rules,
  };
  let penalty = 0;
  for (const n of neighbors(cell)) {
    if (!state.board[n.cell]) {
      const eff = getEffectiveValue(card, n.side, ctx);
      penalty += 10 - eff;
    }
  }
  return penalty;
}

function evaluateBoard(state, player) {
  const [s0, s1] = score(state);
  const myScore = player === 0 ? s0 : s1;
  const oppScore = player === 0 ? s1 : s0;
  let total = (myScore - oppScore) * 110;

  const rules = state.rules || DEFAULT_RULES;
  for (let c = 0; c < state.board.length; c++) {
    const slot = state.board[c];
    if (!slot) continue;
    const sign = slot.owner === player ? 1 : -1;
    // Bonus de sécurité (peu de côtés faibles exposés, en tenant compte de tous les bonus actifs)
    const exp = exposurePenalty(state, c, slot.card, slot.owner);
    total -= sign * exp * 2.2;
    // Valorisation des bonus actifs (case élémentaire + résonance élémentaire + cohésion de faction + trait)
    const bonuses = getCardBonuses(slot.card, {
      cell: c,
      owner: slot.owner,
      board: state.board,
      boardElements: state.boardElements,
      rules,
    });
    total += sign * bonuses.totalMod * 10;
  }
  return total;
}

export function chooseMove(state, rngOrOptions = Math.random, maybeDifficulty = 'tactician') {
  let rng = Math.random;
  let difficulty = maybeDifficulty;

  if (typeof rngOrOptions === 'function') {
    rng = rngOrOptions;
  } else if (rngOrOptions && typeof rngOrOptions === 'object') {
    if (typeof rngOrOptions.rng === 'function') rng = rngOrOptions.rng;
    if (rngOrOptions.difficulty) difficulty = rngOrOptions.difficulty;
  } else if (typeof rngOrOptions === 'string') {
    difficulty = rngOrOptions;
  }

  const moves = legalMoves(state);
  if (!moves.length) return null;

  const player = state.turn;

  // Niveau 1 : Novice (sensible aux captures directes mais peu regardant sur l'exposition)
  if (difficulty === 'novice') {
    let best = moves[0];
    let bestScore = -Infinity;
    for (const m of moves) {
      const card = state.hands[player][m.handIndex];
      const { state: next, captured } = play(state, m.handIndex, m.cell);
      const s = captured.length * 75 - exposurePenalty(next, m.cell, card, player) * 0.35 + rng() * 45;
      if (s > bestScore) {
        bestScore = s;
        best = m;
      }
    }
    return best;
  }

  // Niveau 3 : Grand Maître (Minimax profondeur 2)
  if (difficulty === 'master') {
    let bestMove = moves[0];
    let bestVal = -Infinity;

    for (const m of moves) {
      const card = state.hands[player][m.handIndex];
      const { state: next, captured, events, placedBonuses } = play(state, m.handIndex, m.cell);
      const immediateBonus =
        captured.length * 45 +
        (events.tags.length > 0 ? 25 : 0) +
        (placedBonuses?.totalMod || 0) * 12 -
        exposurePenalty(next, m.cell, card, player) * 1.2;

      let replyValue;
      if (next.over) {
        replyValue = evaluateBoard(next, player) * 2;
      } else {
        const oppMoves = legalMoves(next);
        let worstForMe = Infinity;
        for (const om of oppMoves) {
          const { state: afterOpp } = play(next, om.handIndex, om.cell);
          const val = evaluateBoard(afterOpp, player);
          if (val < worstForMe) worstForMe = val;
        }
        replyValue = worstForMe;
      }

      const totalScore = replyValue + immediateBonus + rng() * 1.5;
      if (totalScore > bestVal) {
        bestVal = totalScore;
        bestMove = m;
      }
    }
    return bestMove;
  }

  // Niveau 2 (par défaut) : Tacticien
  let best = null;
  let bestScore = -Infinity;
  for (const m of moves) {
    const card = state.hands[player][m.handIndex];
    const { state: next, captured, events, placedBonuses } = play(state, m.handIndex, m.cell);
    const totalBonusScore = (placedBonuses?.totalMod || 0) * 14;
    const comboBonus = events.tags.length * 18;
    const s =
      captured.length * 100 +
      comboBonus +
      totalBonusScore -
      exposurePenalty(next, m.cell, card, player) +
      rng() * 3;
    if (s > bestScore) {
      bestScore = s;
      best = m;
    }
  }
  return best;
}
