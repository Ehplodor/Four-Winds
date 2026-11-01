// Intelligence Artificielle multi-niveaux :
// - 'novice'    : Apprenti (heuristique légère avec bruit élevé)
// - 'tactician' : Tacticien (évaluation complète des captures, éléments, synergies, coins et exposition)
// - 'master'    : Grand Maître (minimax sur 2 demi-coups : chaque coup est jugé sur la meilleure réplique adverse)
//
// Information cachée : sans la règle Main Ouverte, l'IA ne doit pas lire la main adverse.
// Le Grand Maître modélise alors la réplique adverse avec `opponentCandidates`, la liste des cartes que
// l'adversaire peut encore avoir d'après ce qui est public (son deck et les niveaux qu'il n'a pas encore joués).
// Sans cette liste, il retombe sur le Tacticien plutôt que de tricher.

import {
  legalMoves,
  play,
  neighbors,
  score,
  getEffectiveValue,
  getCardBonuses,
  DEFAULT_RULES,
} from './engine.js';
import { getCardsByDeck } from './cards.js';

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

// Cartes que l'adversaire peut encore avoir en main, d'après l'information publique :
// son deck, et les niveaux qu'il lui reste à jouer (une carte par niveau est distribuée, et chaque carte posée
// révèle son niveau, donc les niveaux restants sont connus). Les cartes déjà visibles sont exclues.
// En Mort Subite, la main mêle des cartes déjà vues : l'approximation reste prudente (elle surestime le choix adverse).
export function opponentCandidatesFor(state, opponent, deckId) {
  const visible = new Set(state.hands[1 - opponent].map((c) => c.id));
  for (const slot of state.board) if (slot) visible.add(slot.card.id);
  const levels = new Set(state.hands[opponent].map((c) => c.level));
  return getCardsByDeck(deckId).filter((c) => levels.has(c.level) && !visible.has(c.id));
}

export function chooseMove(state, rngOrOptions = Math.random, maybeDifficulty = 'tactician') {
  let rng = Math.random;
  let difficulty = maybeDifficulty;

  let opponentCandidates = null;
  if (typeof rngOrOptions === 'function') {
    rng = rngOrOptions;
  } else if (rngOrOptions && typeof rngOrOptions === 'object') {
    if (typeof rngOrOptions.rng === 'function') rng = rngOrOptions.rng;
    if (rngOrOptions.difficulty) difficulty = rngOrOptions.difficulty;
    if (Array.isArray(rngOrOptions.opponentCandidates)) opponentCandidates = rngOrOptions.opponentCandidates;
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

  // Niveau 3 : Grand Maître (minimax sur 2 demi-coups)
  const handHidden = !(state.rules || DEFAULT_RULES).open;
  if (difficulty === 'master' && (!handHidden || opponentCandidates?.length)) {
    const opponent = 1 - player;
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
        // Main cachée : on remplace la vraie main adverse par les cartes qu'elle peut encore contenir.
        const modeled = handHidden ? { ...next, hands: next.hands.map((h, i) => (i === opponent ? opponentCandidates : h)) } : next;
        const oppMoves = legalMoves(modeled);
        let worstForMe = Infinity;
        for (const om of oppMoves) {
          const { state: afterOpp } = play(modeled, om.handIndex, om.cell);
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
