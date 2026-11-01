// Déroulement d'un match complet, de façon pure et déterministe :
// - la distribution et les cases élémentaires découlent uniquement de la graine (seed), ce qui garantit
//   que l'hôte, l'invité P2P et le destinataire d'un lien SMS voient exactement la même partie ;
// - la règle Mort Subite enchaîne de nouvelles manches tant qu'il y a égalité (MAX_ROUNDS au total).

import { createGame, play, winner, CELLS } from './engine.js';
import { dealHands } from './cards.js';
import { createSeededRng } from './rng.js';

export const MAX_ROUNDS = 5;
export const MAX_MATCH_MOVES = CELLS * MAX_ROUNDS;

export function createMatch({ seed, deck0, deck1, firstPlayer = 0, rules = {} }) {
  const rng = createSeededRng(seed);
  const hands = dealHands(rng, { deck0, deck1 });
  const game = createGame({ hands, firstPlayer, rules, rng });
  return {
    seed: seed >>> 0,
    decks: [deck0, deck1],
    firstPlayer,
    rules: game.rules,
    rng,
    game,
    round: 1,
    roundFirst: firstPlayer,
    moves: [],
  };
}

// Mort Subite : chaque joueur récupère les cartes de sa couleur (plateau + main) pour la manche suivante.
// L'ordre est rendu déterministe (niveau puis identifiant) pour que les index de main restent identiques partout.
export function suddenDeathHands(state) {
  const hands = [state.hands[0].slice(), state.hands[1].slice()];
  for (const slot of state.board) {
    if (slot) hands[slot.owner].push(slot.card);
  }
  const order = (a, b) => a.level - b.level || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
  return [hands[0].sort(order), hands[1].sort(order)];
}

export function needsSuddenDeath(state, round) {
  return Boolean(state.over && state.rules?.sudden && winner(state) === 'draw' && round < MAX_ROUNDS);
}

// Joue un coup dans le match. `roundOver` contient l'état final de la manche quand elle vient de se terminer
// (utile pour l'afficher avant de passer à la Mort Subite).
export function playMatchMove(match, handIndex, cell) {
  const result = play(match.game, handIndex, cell);
  const moves = [...match.moves, { handIndex, cell }];
  const roundOver = result.state.over ? result.state : null;

  if (roundOver && needsSuddenDeath(roundOver, match.round)) {
    const roundFirst = 1 - match.roundFirst;
    const game = createGame({
      hands: suddenDeathHands(roundOver),
      firstPlayer: roundFirst,
      rules: roundOver.rules,
      rng: match.rng,
    });
    return {
      match: { ...match, game, round: match.round + 1, roundFirst, moves },
      result,
      roundOver,
      suddenDeath: true,
    };
  }

  return { match: { ...match, game: result.state, moves }, result, roundOver, suddenDeath: false };
}

// Rejoue une liste de coups. Lève une exception si un coup est illégal.
export function replayMatch(params, moves = []) {
  if (moves.length > MAX_MATCH_MOVES) throw new Error('Trop de coups');
  let match = createMatch(params);
  let last = null;
  for (const m of moves) {
    last = playMatchMove(match, m.handIndex, m.cell);
    match = last.match;
  }
  return { match, last };
}
