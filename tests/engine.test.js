import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  createGame,
  play,
  previewMove,
  score,
  winner,
  legalMoves,
  neighbors,
  getEffectiveValue,
  getCardBonuses,
} from '../js/engine.js';
import { chooseMove } from '../js/ai.js';
import { CARDS, DECKS, ELEMENTS, dealHands, renderCardArtSVG } from '../js/cards.js';
import {
  createSeededRng,
  encodeCompactMatch,
  decodeCompactMatch,
  buildShareLinks,
  renderShareCardSVG,
} from '../js/network.js';

const card = (values, id = values.join(''), element = 'vent') => ({
  id,
  name: id,
  level: 1,
  values,
  element,
});

test('neighbors gère les bords et le centre', () => {
  assert.equal(neighbors(0).length, 2);
  assert.equal(neighbors(1).length, 3);
  assert.equal(neighbors(4).length, 4);
});

test('une valeur supérieure capture la carte voisine', () => {
  let g = createGame({ hands: [[card([1, 1, 1, 1]), card([1, 1, 1, 1])], [card([5, 5, 5, 5])]] });
  g = play(g, 0, 0).state; // joueur 0 en haut à gauche
  const r = play(g, 0, 1); // joueur 1 à droite : sa gauche (5) contre la droite (1)
  assert.deepEqual(r.captured, [0]);
  assert.equal(r.state.board[0].owner, 1);
});

test('une égalité ne capture pas sans la règle Identique', () => {
  let g = createGame({ hands: [[card([3, 3, 3, 3])], [card([3, 3, 3, 3])]] });
  g = play(g, 0, 4).state;
  const r = play(g, 0, 1);
  assert.deepEqual(r.captured, []);
  assert.equal(r.state.board[4].owner, 0);
});

test('seul le côté qui fait face compte', () => {
  let g = createGame({ hands: [[card([9, 9, 2, 9])], [card([3, 1, 1, 1])]] });
  g = play(g, 0, 0).state;
  assert.deepEqual(play(g, 0, 3).captured, [0]);
});

test('les cases occupées et la fin de partie sont respectées', () => {
  let g = createGame({ hands: [[card([1, 1, 1, 1])], [card([1, 1, 1, 1])]] });
  g = play(g, 0, 0).state;
  assert.throws(() => play(g, 0, 0));
});

test('règle Élémentaire : +1 sur le même élément, -1 sur un autre élément', () => {
  const cFeu = card([5, 5, 5, 5], 'f', 'feu');
  const cEau = card([5, 5, 5, 5], 'e', 'eau');
  const rules = { elemental: true };
  assert.equal(getEffectiveValue(cFeu, 0, 'feu', rules), 6);
  assert.equal(getEffectiveValue(cEau, 0, 'feu', rules), 4);

  // Sur le plateau : cEau sur case neutre (5) vs cFeu posée sur case 'feu' (5+1=6) -> capture !
  const boardElements = [null, 'feu', null, null, null, null, null, null, null];
  let g = createGame({
    hands: [[cEau], [cFeu]],
    rules: { elemental: true },
    boardElements,
  });
  g = play(g, 0, 0).state;
  const r = play(g, 0, 1);
  assert.deepEqual(r.captured, [0]);
});

test('règle Identique (Same) et Combo en cascade', () => {
  // Plateau :
  // Case 1 (Haut-Milieu) : J0 avec bas = 4
  // Case 3 (Milieu-Gauche) : J0 avec droite = 6, et haut = 8
  // Case 0 (Haut-Gauche) : J0 avec bas = 2 (sera capturée par Combo depuis la case 3 !)
  // J1 pose en Case 4 (Centre) une carte avec haut = 4 et gauche = 6 -> Identique sur 1 et 3, puis 3 capture 0 par Combo !
  const h0 = [
    card([1, 1, 4, 1], 'c1'),
    card([8, 6, 1, 1], 'c3'),
    card([1, 1, 2, 1], 'c0'),
  ];
  const h1 = [
    card([1, 1, 1, 1], 'dummy1'),
    card([1, 1, 1, 1], 'dummy2'),
    card([4, 1, 1, 6], 'trigger'),
  ];
  let g = createGame({
    hands: [h0, h1],
    firstPlayer: 0,
    rules: { same: true, combo: true },
  });
  g = play(g, 0, 1).state; // J0 en 1
  g = play(g, 0, 8).state; // J1 en 8
  g = play(g, 0, 3).state; // J0 en 3
  g = play(g, 0, 7).state; // J1 en 7
  g = play(g, 0, 0).state; // J0 en 0

  const prev = previewMove(g, 0, 4);
  assert.ok(prev.events.tags.includes('IDENTIQUE !'));
  assert.ok(prev.events.tags.includes('COMBO !'));

  const res = play(g, 0, 4); // J1 pose en 4
  assert.ok(res.events.same.includes(1));
  assert.ok(res.events.same.includes(3));
  assert.ok(res.events.combo.includes(0));
  assert.equal(res.state.board[0].owner, 1);
});

test('règle Plus : capture quand les sommes opposées sont égales sur 2 côtés', () => {
  // Case 1 : bas = 7
  // Case 3 : droite = 4
  // J1 pose en Case 4 : haut = 3 (3+7=10) et gauche = 6 (6+4=10) -> Somme 10 des deux côtés -> PLUS !
  const h0 = [card([1, 1, 7, 1], 'c1'), card([1, 4, 1, 1], 'c3')];
  const h1 = [card([1, 1, 1, 1], 'd'), card([3, 1, 1, 6], 'plusCard')];
  let g = createGame({
    hands: [h0, h1],
    firstPlayer: 0,
    rules: { plus: true, combo: false },
  });
  g = play(g, 0, 1).state;
  g = play(g, 0, 8).state;
  g = play(g, 0, 3).state;
  const res = play(g, 0, 4);
  assert.ok(res.events.tags.includes('PLUS !'));
  assert.deepEqual(res.captured.sort(), [1, 3]);
});

test('une partie complète se termine avec un total de 10 cartes sur les 3 niveaux d’IA', () => {
  for (const difficulty of ['novice', 'tactician', 'master']) {
    let g = createGame({
      hands: dealHands(Math.random, { deck0: 'forge', deck1: 'abysses' }),
      firstPlayer: 0,
      rules: { elemental: true, same: true, plus: true, combo: true },
    });
    let plays = 0;
    while (!g.over) {
      const m = chooseMove(g, { difficulty });
      g = play(g, m.handIndex, m.cell).state;
      plays++;
    }
    assert.equal(plays, 9);
    const [a, b] = score(g);
    assert.equal(a + b, 10);
    assert.notEqual(winner(g), null);
    assert.equal(legalMoves(g).length, 0);
  }
});

test("l'IA prend une capture quand elle est disponible", () => {
  let g = createGame({ hands: [[card([1, 1, 1, 1]), card([1, 1, 1, 1])], [card([9, 9, 9, 9]), card([1, 1, 1, 1])]] });
  g = play(g, 0, 4).state;
  const m = chooseMove(g);
  assert.equal(m.handIndex, 0);
  assert.ok([1, 3, 5, 7].includes(m.cell));
});

test('les 4 decks (100 cartes) sont valides, uniques, bien dosés et illustrés en SVG', () => {
  assert.equal(CARDS.length, 100);
  const ids = new Set(CARDS.map((c) => c.id));
  assert.equal(ids.size, 100);

  const expectedRangeByLevel = {
    1: [10, 12],
    2: [14, 15],
    3: [18, 18],
    4: [21, 22],
    5: [25, 25],
  };

  for (const deckKey of Object.keys(DECKS)) {
    const deckCards = CARDS.filter((c) => c.deck === deckKey);
    assert.equal(deckCards.length, 25, `Le deck ${deckKey} doit contenir 25 cartes`);
    for (let lvl = 1; lvl <= 5; lvl++) {
      const lvlCards = deckCards.filter((c) => c.level === lvl);
      assert.equal(lvlCards.length, 5, `Le deck ${deckKey} niveau ${lvl} doit avoir 5 cartes`);
      const [minSum, maxSum] = expectedRangeByLevel[lvl];
      for (const c of lvlCards) {
        assert.equal(c.values.length, 4);
        assert.ok(c.values.every((v) => v >= 1 && v <= 10));
        const sum = c.values.reduce((a, b) => a + b, 0);
        assert.ok(
          sum >= minSum && sum <= maxSum,
          `Carte ${c.id} (N${lvl}) somme=${sum} hors plage [${minSum}, ${maxSum}]`,
        );
        assert.ok(ELEMENTS[c.element], `Élément invalide sur ${c.id}`);
        const svg = renderCardArtSVG(c);
        assert.ok(svg.startsWith('<svg') && svg.includes('</svg>'));
      }
    }

    // Distribution miroir au sein d'un même deck
    const [h0, h1] = dealHands(Math.random, { deck0: deckKey, deck1: deckKey });
    assert.equal(h0.length, 5);
    assert.equal(h1.length, 5);
    assert.equal(new Set([...h0, ...h1].map((c) => c.id)).size, 10);
  }
});

test('les règles Identique, Plus et Combo prennent en compte les bonus de case, de résonance, de faction et de carte', () => {
  // 1. Identique déclenché grâce au cumul Case élémentaire (+1) + Résonance élémentaire alliée (+1) = +2
  // J1 possède déjà une carte 'feu' en case 7 (Bas-Milieu).
  // J0 possède une carte 'eau' en case 1 (Haut-Milieu, bas = 7) et en case 3 (Milieu-Gauche, droite = 7).
  // J1 pose en case 4 (Centre, case d'élément 'feu') une carte 'feu' de valeurs de base [5, 5, 5, 5].
  // Grâce à Case 'feu' (+1) + Résonance avec la carte alliée 'feu' en case 7 (+1), ses valeurs passent de 5 à 7 !
  // Elle égalise donc 7 en haut (case 1) et 7 à gauche (case 3) -> IDENTIQUE déclenché !
  const boardElements = [null, null, null, null, 'feu', null, null, null, null];
  const j0Card1 = { id: 'j0-1', name: 'J0-1', level: 2, values: [1, 1, 7, 1], element: 'eau', deck: 'abysses' };
  const j0Card3 = { id: 'j0-3', name: 'J0-3', level: 2, values: [1, 7, 1, 1], element: 'vent', deck: 'vents' };
  const j1Ally7 = { id: 'j1-7', name: 'J1-7', level: 2, values: [2, 2, 2, 2], element: 'feu', deck: 'forge' };
  const j1Center = { id: 'j1-4', name: 'J1-4', level: 2, values: [5, 5, 5, 5], element: 'feu', deck: 'forge' };

  let g = createGame({
    hands: [
      [j0Card1, j0Card3],
      [j1Ally7, j1Center],
    ],
    firstPlayer: 0,
    rules: { elemental: true, synergy: true, same: true, plus: true, combo: true },
    boardElements,
  });

  g = play(g, 0, 1).state; // J0 en 1
  g = play(g, 0, 7).state; // J1 en 7 (allié 'feu')
  g = play(g, 0, 3).state; // J0 en 3

  const res = play(g, 0, 4); // J1 pose en 4 (case 'feu' + allié 'feu' en 7 => +2 => valeurs 7)
  assert.equal(res.placedBonuses.tileMod, 1);
  assert.equal(res.placedBonuses.resonanceMod, 1);
  assert.equal(res.placedBonuses.totalMod, 2);
  assert.ok(res.events.tags.includes('IDENTIQUE !'));
  assert.ok(res.captured.includes(1));
  assert.ok(res.captured.includes(3));
});

test('la cascade Combo recalcule dynamiquement les bonus de synergie (Résonance & Faction) après un retournement', () => {
  // Scénario :
  // - Case 1 (Haut-Milieu) : carte adverse J0 d'élément 'foudre' et deck 'forge', valeurs [1, 1, 4, 1]
  // - Case 3 (Milieu-Gauche) : carte adverse J0 d'élément 'foudre' et deck 'forge', valeurs [1, 4, 1, 1]
  // - Case 5 (Milieu-Droite) : carte adverse J0 d'élément 'eau' et deck 'abysses', avec gauche = 6
  // - J1 pose en Case 4 (Centre) une carte d'élément 'foudre' et deck 'forge' avec valeurs [6, 5, 1, 6].
  //   1) Sur la pose initiale en 4 (aucun allié sur le plateau) :
  //      - Haut (6) + Bas de Case 1 (4) = 10
  //      - Gauche (6) + Droite de Case 3 (4) = 10
  //      -> Règle PLUS déclenchée ! Les cases 1 et 3 sont capturées et deviennent alliées (J1) !
  //   2) À droite (vers Case 5), la carte posée en 4 avait initialement Droite = 5 contre Gauche = 6 (pas de capture directe).
  //      MAIS comme les cases 1 et 3 viennent d'être capturées et sont toutes deux d'élément 'foudre' et du deck 'forge',
  //      la carte en Case 4 gagne immédiatement :
  //      - Résonance élémentaire (+1)
  //      - Cohésion de faction (+1, car 2 voisines alliées du deck 'forge')
  //      Sa valeur Droite passe donc de 5 à 7 (5 + 2 = 7 > 6) !
  //   3) Grâce au Combo dynamique, la Case 4 capture alors la Case 5 en cascade !
  const c1 = { id: 'c1', name: 'C1', level: 1, values: [1, 1, 4, 1], element: 'foudre', deck: 'forge' };
  const c3 = { id: 'c3', name: 'C3', level: 1, values: [1, 4, 1, 1], element: 'foudre', deck: 'forge' };
  const c5 = { id: 'c5', name: 'C5', level: 2, values: [1, 1, 1, 6], element: 'eau', deck: 'abysses' };
  const d1 = { id: 'd1', name: 'D1', level: 1, values: [1, 1, 1, 1], element: 'vent', deck: 'vents' };
  const d2 = { id: 'd2', name: 'D2', level: 1, values: [1, 1, 1, 1], element: 'vent', deck: 'vents' };
  const trigger = { id: 'trig', name: 'Trigger', level: 3, values: [6, 5, 1, 6], element: 'foudre', deck: 'forge' };

  let g = createGame({
    hands: [
      [c1, c3, c5],
      [d1, d2, trigger],
    ],
    firstPlayer: 0,
    rules: { synergy: true, plus: true, combo: true },
  });

  g = play(g, 0, 1).state; // J0 en 1
  g = play(g, 0, 0).state; // J1 en 0 (neutre)
  g = play(g, 0, 3).state; // J0 en 3
  g = play(g, 0, 8).state; // J1 en 8 (neutre)
  g = play(g, 0, 5).state; // J0 en 5 (gauche = 6)

  const res = play(g, 0, 4); // J1 pose trigger en 4
  assert.ok(res.events.tags.includes('PLUS !'));
  assert.ok(res.events.tags.includes('COMBO !'));
  assert.equal(res.placedBonuses.resonanceMod, 1);
  assert.equal(res.placedBonuses.factionMod, 1);
  assert.ok(res.events.combo.includes(5), 'La case 5 doit être capturée en cascade grâce au bonus acquis');
  assert.equal(res.state.board[5].owner, 1);
});

test('les bonus intrinsèques de carte (bonus global et sideBonuses) fonctionnent avec les règles spéciales', () => {
  const boostedCard = {
    id: 'b',
    name: 'Boosted',
    level: 2,
    values: [4, 4, 4, 4],
    element: 'feu',
    bonus: 1,
    sideBonuses: [1, 0, 0, 0], // Haut reçoit +1 global +1 directionnel = +2 (total 6)
  };
  const bonuses = getCardBonuses(boostedCard, {});
  assert.equal(bonuses.traitMod, 1);
  assert.equal(getEffectiveValue(boostedCard, 0), 6);
  assert.equal(getEffectiveValue(boostedCard, 1), 5);
});

test('le codec réseau sans serveur (SMS / URL compacte) reconstruit exactement une partie en cours ou terminée', () => {
  const seed = 98765432;
  const rules = { elemental: true, synergy: true, same: true, plus: true, combo: true, open: false };
  const rng = createSeededRng(seed);
  const hands = dealHands(rng, { deck0: 'ombres', deck1: 'forge' });
  let g = createGame({ hands, firstPlayer: 1, rules, rng });

  const moves = [];
  for (let step = 0; step < 5; step++) {
    const m = chooseMove(g, { difficulty: 'tactician', rng });
    g = play(g, m.handIndex, m.cell).state;
    moves.push(m);
  }

  const token = encodeCompactMatch({
    seed,
    deck0: 'ombres',
    deck1: 'forge',
    firstPlayer: 1,
    rules,
    moves,
  });

  // Le jeton complet doit tenir en moins de 30 caractères pour un SMS ultra-court
  assert.ok(token.length <= 30, `Jeton trop long (${token.length}) : ${token}`);

  const decoded = decodeCompactMatch(token);
  assert.ok(decoded);
  assert.equal(decoded.seed, seed);
  assert.equal(decoded.deck0, 'ombres');
  assert.equal(decoded.deck1, 'forge');
  assert.equal(decoded.firstPlayer, 1);
  assert.deepEqual(decoded.moves, moves);
  assert.deepEqual(score(decoded.game), score(g));
  assert.equal(decoded.game.turn, g.turn);
  assert.deepEqual(decoded.game.boardElements, g.boardElements);

  const links = buildShareLinks({ token, scoreText: '6-4' });
  assert.ok(links.url.includes(encodeURIComponent(token)));
  assert.ok(links.smsHref.startsWith('sms:'));

  const badgeSvg = renderShareCardSVG(token);
  assert.ok(badgeSvg.startsWith('<svg') && badgeSvg.includes('</svg>'));
});
