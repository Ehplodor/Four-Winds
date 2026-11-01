// Moteur de règles pur (aucune dépendance au DOM), utilisable dans le navigateur et sous Node.
// Une carte a 4 valeurs [haut, droite, bas, gauche] de 1 à 10 (10 s'affiche « A »).
// Supporte les règles classiques ainsi que :
// - Élémentaire (bonus/malus de case +1 / -1)
// - Synergie (Résonance élémentaire alliée +1 & Cohésion de faction alliée +1)
// - Bonus intrinsèques de carte (bonus global ou sideBonuses directionnels)
// - Identique (Same), Mur Identique (Same Wall), Plus et Enchaînement en cascade dynamique (Combo).
// La Mort Subite (enchaînement de manches en cas d'égalité) est gérée au niveau du match, dans js/match.js.

import { ELEMENT_KEYS } from './cards.js';

export const SIZE = 3;
export const CELLS = SIZE * SIZE;

// side : index de la valeur de la carte posée ; opp : index de la valeur de la voisine qui lui fait face.
export const DIRS = [
  { dr: -1, dc: 0, side: 0, opp: 2 }, // haut
  { dr: 0, dc: 1, side: 1, opp: 3 },  // droite
  { dr: 1, dc: 0, side: 2, opp: 0 },  // bas
  { dr: 0, dc: -1, side: 3, opp: 1 }, // gauche
];

export const DEFAULT_RULES = {
  elemental: false,
  synergy: false,
  same: false,
  sameWall: false,
  plus: false,
  combo: true,
  open: false,
  sudden: false,
};

export function neighbors(cell) {
  const r = Math.floor(cell / SIZE);
  const c = cell % SIZE;
  const out = [];
  for (const d of DIRS) {
    const nr = r + d.dr;
    const nc = c + d.dc;
    if (nr >= 0 && nr < SIZE && nc >= 0 && nc < SIZE) out.push({ cell: nr * SIZE + nc, ...d });
  }
  return out;
}

// Génère une grille d'éléments aléatoires (2 à 4 cases élémentaires) pour la règle Élémentaire.
export function generateBoardElements(rng = Math.random, count = null) {
  const grid = Array(CELLS).fill(null);
  const num = count !== null ? count : 2 + Math.floor(rng() * 3); // 2, 3 ou 4 cases
  const indices = [0, 1, 2, 3, 4, 5, 6, 7, 8];
  for (let k = 0; k < num && indices.length > 0; k++) {
    const pick = Math.floor(rng() * indices.length);
    const cell = indices.splice(pick, 1)[0];
    const el = ELEMENT_KEYS[Math.floor(rng() * ELEMENT_KEYS.length)];
    grid[cell] = el;
  }
  return grid;
}

// Calcule le modificateur élémentaire de case (-1, 0 ou +1) d'une carte sur une case donnée.
export function getElementModifier(card, cellElement, rules) {
  if (!rules?.elemental || !cellElement) return 0;
  return card.element && card.element === cellElement ? 1 : -1;
}

/**
 * Calcule l'ensemble des bonus/malus actifs sur une carte donnée.
 * Prend en compte :
 * 1. Bonus/Malus de Case Élémentaire (+1 si même élément, -1 si élément discordant) [règle elemental]
 * 2. Bonus de Résonance Élémentaire Alliée (+1 si au moins 1 voisine alliée a le même élément) [règle synergy]
 * 3. Bonus de Cohésion de Faction (+1 si au moins 2 voisines alliées sont du même deck) [règle synergy]
 * 4. Bonus intrinsèques éventuels de la carte (card.bonus et card.sideBonuses)
 */
export function getCardBonuses(card, context = {}, maybeRules = null) {
  let cellElement = null;
  let cell = null;
  let owner = null;
  let board = null;
  let boardElements = null;
  let rules = maybeRules || DEFAULT_RULES;

  if (typeof context === 'string' || context === null) {
    cellElement = context;
  } else if (context && typeof context === 'object') {
    cell = context.cell ?? null;
    owner = context.owner ?? null;
    board = context.board ?? null;
    boardElements = context.boardElements ?? null;
    if (context.rules) rules = context.rules;
    cellElement =
      context.cellElement !== undefined
        ? context.cellElement
        : cell !== null && boardElements
        ? boardElements[cell]
        : null;
    if (owner === null && cell !== null && board && board[cell]) {
      owner = board[cell].owner;
    }
  }

  const reasons = [];

  // 1. Modificateur de case élémentaire
  const tileMod = getElementModifier(card, cellElement, rules);
  if (tileMod > 0) reasons.push('Case élémentaire (+1)');
  else if (tileMod < 0) reasons.push('Case élémentaire (-1)');

  // 2 & 3. Synergies de plateau (Résonance élémentaire & Cohésion de faction entre cartes alliées adjacentes)
  let resonanceMod = 0;
  let factionMod = 0;
  const synergyActive = Boolean(rules?.synergy || (rules?.elemental && rules?.synergy !== false));

  if (synergyActive && board && cell !== null && owner !== null && owner !== undefined) {
    let sameElemAllies = 0;
    let sameDeckAllies = 0;
    for (const n of neighbors(cell)) {
      const neighborSlot = board[n.cell];
      if (neighborSlot && neighborSlot.owner === owner) {
        if (card.element && neighborSlot.card.element === card.element) {
          sameElemAllies++;
        }
        if (card.deck && neighborSlot.card.deck === card.deck) {
          sameDeckAllies++;
        }
      }
    }
    if (sameElemAllies >= 1) {
      resonanceMod = 1;
      reasons.push('Résonance élémentaire (+1)');
    }
    if (sameDeckAllies >= 2) {
      factionMod = 1;
      reasons.push('Cohésion de faction (+1)');
    }
  }

  // 4. Bonus intrinsèques de la carte (attributs bonus / sideBonuses)
  const traitMod = Number(card?.bonus || 0);
  if (traitMod > 0) reasons.push(`Trait de carte (+${traitMod})`);
  else if (traitMod < 0) reasons.push(`Trait de carte (${traitMod})`);

  const sideMods = Array.isArray(card?.sideBonuses) ? card.sideBonuses : [0, 0, 0, 0];
  const totalMod = tileMod + resonanceMod + factionMod + traitMod;

  return {
    tileMod,
    resonanceMod,
    factionMod,
    traitMod,
    sideMods,
    totalMod,
    reasons,
  };
}

// Valeur effective d'un côté (bornée entre 1 et 10), prenant en compte tous les bonus actifs.
// Rétrocompatible avec getEffectiveValue(card, side, cellElement, rules)
// et supporte getEffectiveValue(card, side, { cell, owner, board, boardElements, rules }).
export function getEffectiveValue(card, side, contextOrCellElement = null, maybeRules = null) {
  const bonuses = getCardBonuses(card, contextOrCellElement, maybeRules);
  const sideBonus = bonuses.sideMods[side] || 0;
  const raw = card.values[side];
  return Math.max(1, Math.min(10, raw + bonuses.totalMod + sideBonus));
}

export function getEffectiveValues(card, contextOrCellElement = null, maybeRules = null) {
  return [0, 1, 2, 3].map((s) => getEffectiveValue(card, s, contextOrCellElement, maybeRules));
}

export function createGame({ hands, firstPlayer = 0, rules = {}, boardElements = null, rng = Math.random }) {
  if (!hands || hands.length !== 2) throw new Error('Il faut deux mains');
  const mergedRules = { ...DEFAULT_RULES, ...rules };
  const elements =
    boardElements !== null
      ? boardElements.slice()
      : mergedRules.elemental
      ? generateBoardElements(rng)
      : Array(CELLS).fill(null);

  return {
    board: Array(CELLS).fill(null), // { card, owner } | null
    hands: [hands[0].slice(), hands[1].slice()],
    turn: firstPlayer,
    over: false,
    rules: mergedRules,
    boardElements: elements,
  };
}

export function legalMoves(state) {
  if (state.over) return [];
  const moves = [];
  const hand = state.hands[state.turn];
  for (let h = 0; h < hand.length; h++) {
    for (let cell = 0; cell < CELLS; cell++) {
      if (!state.board[cell]) moves.push({ handIndex: h, cell });
    }
  }
  return moves;
}

// Helper interne pour obtenir la valeur effective d'une case occupée sur un plateau donné.
function cellSideValue(board, cell, side, boardElements, rules) {
  const slot = board[cell];
  if (!slot) return 0;
  return getEffectiveValue(slot.card, side, {
    cell,
    owner: slot.owner,
    board,
    boardElements,
    rules,
  });
}

// Joue la carte handIndex du joueur courant sur cell.
// Renvoie { state, captured, events, placedBonuses } où tous les bonus (case, résonance, faction, carte)
// sont pris en compte dans Identique, Plus, Capture directe et Combo en cascade.
export function play(state, handIndex, cell) {
  if (state.over) throw new Error('La partie est terminée');
  if (!Number.isInteger(cell) || cell < 0 || cell >= CELLS || state.board[cell]) throw new Error('Case invalide');
  const player = state.turn;
  const hand = state.hands[player];
  if (!Number.isInteger(handIndex) || handIndex < 0 || handIndex >= hand.length) throw new Error('Carte invalide');

  const rules = state.rules || DEFAULT_RULES;
  const boardElements = state.boardElements || Array(CELLS).fill(null);

  const card = hand[handIndex];
  const board = state.board.slice();
  board[cell] = { card, owner: player };

  // Snapshot du plateau juste après la pose (avant retournement) pour évaluer Identique et Plus équitablement
  const placedBoard = board.slice();

  const capturedSet = new Set();
  const events = {
    direct: [],
    same: [],
    plus: [],
    combo: [],
    tags: [],
  };

  const adj = neighbors(cell).filter((n) => Boolean(placedBoard[n.cell]));

  // 1. Règle « Identique » (Same) avec prise en compte de tous les bonus sur placedBoard.
  // Avec « Mur Identique » (Same Wall), chaque bord du plateau compte comme une valeur A (10) :
  // un côté à A contre un bord compte comme une égalité (mais il n'y a rien à capturer).
  if (rules.same) {
    const matches = adj.filter((n) => {
      const myVal = cellSideValue(placedBoard, cell, n.side, boardElements, rules);
      const oppVal = cellSideValue(placedBoard, n.cell, n.opp, boardElements, rules);
      return myVal === oppVal;
    });
    let wallMatches = 0;
    if (rules.sameWall) {
      const inside = new Set(neighbors(cell).map((n) => n.side));
      for (const d of DIRS) {
        if (!inside.has(d.side) && cellSideValue(placedBoard, cell, d.side, boardElements, rules) === 10) wallMatches++;
      }
    }
    const enemyMatches = matches.filter((n) => placedBoard[n.cell].owner !== player);
    if (matches.length + wallMatches >= 2 && enemyMatches.length >= 1) {
      events.tags.push('IDENTIQUE !');
      for (const n of enemyMatches) {
        board[n.cell] = { card: board[n.cell].card, owner: player };
        capturedSet.add(n.cell);
        events.same.push(n.cell);
      }
    }
  }

  // 2. Règle « Plus » avec prise en compte de tous les bonus sur placedBoard
  if (rules.plus && adj.length >= 2) {
    const bySum = new Map();
    for (const n of adj) {
      const myVal = cellSideValue(placedBoard, cell, n.side, boardElements, rules);
      const oppVal = cellSideValue(placedBoard, n.cell, n.opp, boardElements, rules);
      const sum = myVal + oppVal;
      if (!bySum.has(sum)) bySum.set(sum, []);
      bySum.get(sum).push(n);
    }
    const plusEnemies = [];
    for (const group of bySum.values()) {
      if (group.length >= 2) {
        for (const n of group) {
          if (placedBoard[n.cell].owner !== player) plusEnemies.push(n.cell);
        }
      }
    }
    if (plusEnemies.length >= 1) {
      events.tags.push('PLUS !');
      for (const cIdx of plusEnemies) {
        board[cIdx] = { card: board[cIdx].card, owner: player };
        capturedSet.add(cIdx);
        if (!events.plus.includes(cIdx)) events.plus.push(cIdx);
      }
    }
  }

  // 3. Règle classique : comparaison directe stricte (valeur posée > valeur opposée) avec bonus initiaux
  for (const n of adj) {
    const target = placedBoard[n.cell];
    if (target.owner !== player && !capturedSet.has(n.cell)) {
      const myVal = cellSideValue(placedBoard, cell, n.side, boardElements, rules);
      const oppVal = cellSideValue(placedBoard, n.cell, n.opp, boardElements, rules);
      if (myVal > oppVal) {
        board[n.cell] = { card: target.card, owner: player };
        capturedSet.add(n.cell);
        events.direct.push(n.cell);
      }
    }
  }

  // 4. Règle « Combo » (Enchaînement en cascade) :
  // Les cartes capturées par Identique ou Plus (ainsi que les cartes alliées dont le bonus de synergie
  // vient d'augmenter grâce à ces captures) attaquent leurs voisines avec leurs valeurs effectives actualisées !
  if (rules.combo && (events.same.length > 0 || events.plus.length > 0)) {
    // Inclut les cartes retournées + la carte posée (dont la résonance/faction a pu augmenter suite au retournement)
    const queue = [...new Set([...events.same, ...events.plus, cell])];
    while (queue.length > 0) {
      const srcCell = queue.shift();
      for (const n of neighbors(srcCell)) {
        const target = board[n.cell];
        if (target && target.owner !== player) {
          const srcVal = cellSideValue(board, srcCell, n.side, boardElements, rules);
          const oppVal = cellSideValue(board, n.cell, n.opp, boardElements, rules);
          if (srcVal > oppVal) {
            board[n.cell] = { card: target.card, owner: player };
            if (!capturedSet.has(n.cell)) {
              capturedSet.add(n.cell);
              events.combo.push(n.cell);
              queue.push(n.cell);
              // Toute carte alliée voisine de n.cell peut avoir gagné un bonus de résonance/faction !
              for (const allyNeighbor of neighbors(n.cell)) {
                const slot = board[allyNeighbor.cell];
                if (slot && slot.owner === player && !queue.includes(allyNeighbor.cell)) {
                  queue.push(allyNeighbor.cell);
                }
              }
            }
          }
        }
      }
    }
    if (events.combo.length > 0) {
      events.tags.push('COMBO !');
    }
  }

  // Si aucune règle Identique/Plus n'a eu lieu mais qu'une capture directe a augmenté la synergie de la carte posée :
  // avec la règle Combo active, la carte posée vérifie si son nouveau bonus de synergie lui permet de capturer une autre voisine.
  if (rules.combo && events.same.length === 0 && events.plus.length === 0 && events.direct.length > 0) {
    let changed = true;
    while (changed) {
      changed = false;
      for (const n of adj) {
        const target = board[n.cell];
        if (target && target.owner !== player) {
          const myVal = cellSideValue(board, cell, n.side, boardElements, rules);
          const oppVal = cellSideValue(board, n.cell, n.opp, boardElements, rules);
          if (myVal > oppVal) {
            board[n.cell] = { card: target.card, owner: player };
            if (!capturedSet.has(n.cell)) {
              capturedSet.add(n.cell);
              events.combo.push(n.cell);
              changed = true;
            }
          }
        }
      }
    }
    if (events.combo.length > 0 && !events.tags.includes('COMBO !')) {
      events.tags.push('COMBO !');
    }
  }

  const placedBonuses = getCardBonuses(card, {
    cell,
    owner: player,
    board,
    boardElements,
    rules,
  });

  if (placedBonuses.resonanceMod > 0 && !events.tags.includes('RÉSONANCE +1')) {
    events.tags.push('RÉSONANCE +1');
  }
  if (placedBonuses.factionMod > 0 && !events.tags.includes('FACTION +1')) {
    events.tags.push('FACTION +1');
  }

  const captured = [...capturedSet];
  const hands = state.hands.slice();
  hands[player] = hand.filter((_, i) => i !== handIndex);
  const over = board.every(Boolean);

  return {
    state: {
      board,
      hands,
      turn: over ? player : 1 - player,
      over,
      rules,
      boardElements,
    },
    captured,
    events,
    placedBonuses,
  };
}

// Prévisualise un coup sans modifier la partie : utile pour l'aperçu tactique au survol d'une case.
export function previewMove(state, handIndex, cell) {
  if (state.over || !Number.isInteger(cell) || cell < 0 || cell >= CELLS || state.board[cell]) {
    return {
      captured: [],
      events: { direct: [], same: [], plus: [], combo: [], tags: [] },
      placedBonuses: null,
    };
  }
  const hand = state.hands[state.turn];
  if (!Number.isInteger(handIndex) || handIndex < 0 || handIndex >= hand.length) {
    return {
      captured: [],
      events: { direct: [], same: [], plus: [], combo: [], tags: [] },
      placedBonuses: null,
    };
  }
  const { captured, events, placedBonuses } = play(state, handIndex, cell);
  return { captured, events, placedBonuses };
}

// Comme dans FF8 : cartes possédées sur le plateau + cartes encore en main.
export function score(state) {
  const s = [state.hands[0].length, state.hands[1].length];
  for (const slot of state.board) if (slot) s[slot.owner]++;
  return s;
}

// null tant que la partie continue, sinon 0, 1 ou 'draw'.
export function winner(state) {
  if (!state.over) return null;
  const [a, b] = score(state);
  if (a === b) return 'draw';
  return a > b ? 0 : 1;
}
