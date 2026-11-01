import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createGame, play } from '../js/engine.js';
import { analyzeMoves } from '../js/hints.js';

const card = (values, id = values.join(''), element = 'vent') => ({ id, name: id, level: 1, values, element });

test('analyzeMoves : aucune aide sur un plateau vide sans bonus', () => {
  const g = createGame({ hands: [[card([5, 5, 5, 5])], [card([1, 1, 1, 1])]], firstPlayer: 0 });
  const hints = analyzeMoves(g, 0);
  assert.equal(hints.length, 9);
  assert.ok(hints.every((h) => h === null));
});

test('analyzeMoves : signale les cases de prise directe avec le nombre de prises', () => {
  // J0 pose une carte faible en 1 ; J1 joue ensuite une carte forte : les cases 0, 2 et 4 prennent la carte 1.
  const h0 = [card([1, 1, 1, 1], 'faible'), card([1, 1, 1, 1], 'x')];
  const h1 = [card([9, 9, 9, 9], 'forte')];
  let g = createGame({ hands: [h0, h1], firstPlayer: 0 });
  g = play(g, 0, 1).state;
  const hints = analyzeMoves(g, 0);
  for (const cell of [0, 2, 4]) {
    assert.equal(hints[cell]?.kind, 'capture', `case ${cell}`);
    assert.equal(hints[cell].captures, 1);
    assert.equal(hints[cell].label, '⚔1');
  }
  assert.equal(hints[1], null, 'case occupée');
  for (const cell of [3, 5, 6, 7, 8]) assert.equal(hints[cell], null, `case ${cell}`);
});

test('analyzeMoves : Plus est classé comme coup spécial', () => {
  const h0 = [card([1, 1, 7, 1], 'c1'), card([1, 4, 1, 1], 'c3')];
  const h1 = [card([1, 1, 1, 1], 'd'), card([3, 1, 1, 6], 'plusCard')];
  let g = createGame({ hands: [h0, h1], firstPlayer: 0, rules: { plus: true, combo: false } });
  g = play(g, 0, 1).state;
  g = play(g, 0, 8).state;
  g = play(g, 0, 3).state;
  const hints = analyzeMoves(g, 0); // il ne reste à J1 que plusCard
  assert.equal(hints[4]?.kind, 'special');
  assert.equal(hints[4].captures, 2);
  assert.match(hints[4].label, /^Plus ⚔2$/);
  assert.match(hints[4].detail, /Plus : 2 prises/);
});

test('analyzeMoves : bonus de case élémentaire sans prise', () => {
  const elements = Array(9).fill(null);
  elements[4] = 'feu';
  const g = createGame({
    hands: [[card([5, 5, 5, 5], 'braise', 'feu')], [card([1, 1, 1, 1])]],
    firstPlayer: 0,
    rules: { elemental: true },
    boardElements: elements,
  });
  const hints = analyzeMoves(g, 0);
  assert.equal(hints[4]?.kind, 'bonus');
  assert.equal(hints[4].label, '+1');
  assert.equal(hints.filter(Boolean).length, 1);
});

test('analyzeMoves : rien pour une carte cachée, un index invalide ou une partie finie', () => {
  const g = createGame({ hands: [[{ hidden: true }], [card([1, 1, 1, 1])]], firstPlayer: 0 });
  assert.ok(analyzeMoves(g, 0).every((h) => h === null));
  assert.ok(analyzeMoves(g, 5).every((h) => h === null));
  assert.ok(analyzeMoves({ ...g, over: true }, 0).every((h) => h === null));
});
