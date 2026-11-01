import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DuelProtocol, sanitizeDuelMessage, dealPrivateHand } from '../js/duel.js';
import { score } from '../js/engine.js';
import { CARDS } from '../js/cards.js';

// Deux joueurs reliés par un « câble » en mémoire qu'on peut couper.
function makePair({ rules = {}, hostDeck = 'vents', guestDeck = 'forge', tamper = null } = {}) {
  const wire = { up: true, dropped: [] };
  const events = { host: [], guest: [] };
  const host = new DuelProtocol({ role: 'host', deck: hostDeck, onEvent: (e) => events.host.push(e) });
  const guest = new DuelProtocol({ role: 'guest', deck: guestDeck, onEvent: (e) => events.guest.push(e) });
  const link = (to) => (msg) => {
    const copy = JSON.parse(JSON.stringify(msg));
    const final = tamper ? tamper(copy, to) : copy;
    if (!wire.up) return wire.dropped.push(final);
    setTimeout(() => to.receive(final), 0);
  };
  host.sendRaw = link(guest);
  guest.sendRaw = link(host);
  return { host, guest, wire, events, rules, hostDeck };
}

const settle = () => new Promise((r) => setTimeout(r, 20));

async function waitUntil(fn, label = 'condition') {
  for (let i = 0; i < 300; i++) {
    if (fn()) return;
    await settle();
  }
  assert.fail(`délai dépassé : ${label}`);
}

// Joue automatiquement : chaque joueur pose sa première carte sur la première case libre.
async function autoPlay(pair, { stopAfter = Infinity } = {}) {
  let n = 0;
  for (let guard = 0; guard < 200 && n < stopAfter; guard++) {
    await settle();
    const over = pair.host.m?.phase === 'over' && pair.guest.m?.phase === 'over';
    if (over) return;
    for (const p of [pair.host, pair.guest]) {
      const m = p.m;
      if (m?.phase === 'playing' && m.match.game.turn === p.local) {
        const cell = m.match.game.board.findIndex((s) => !s);
        await p.playLocal(0, cell);
        n++;
      }
    }
  }
}

test('duel : chacun ne voit que sa propre main, et la partie va au bout avec le même résultat', async () => {
  const pair = makePair();
  await pair.host.hostStart({ rules: { elemental: true, same: true }, deck: 'vents' });
  await waitUntil(() => pair.host.m?.phase === 'playing' && pair.guest.m?.phase === 'playing', 'distribution');

  const hg = pair.host.m.match.game;
  const gg = pair.guest.m.match.game;
  assert.ok(hg.hands[0].every((c) => !c.hidden) && hg.hands[1].every((c) => c.hidden), "l'hôte voit sa main, pas l'autre");
  assert.ok(gg.hands[1].every((c) => !c.hidden) && gg.hands[0].every((c) => c.hidden), "l'invité voit sa main, pas l'autre");
  assert.deepEqual(hg.boardElements, gg.boardElements);
  assert.equal(hg.turn, gg.turn);
  assert.ok(hg.hands[0].every((c) => c.deck === 'vents') && gg.hands[1].every((c) => c.deck === 'forge'));

  await autoPlay(pair);
  await waitUntil(() => pair.host.m.phase === 'over' && pair.guest.m.phase === 'over', 'fin');
  assert.equal(pair.host.m.result.reason, 'score');
  assert.deepEqual(pair.host.m.result.winner, pair.guest.m.result.winner);
  assert.deepEqual(score(pair.host.m.match.game), score(pair.guest.m.match.game));
});

test('duel : une carte annoncée qui ne venait pas de la main engagée est détectée à la révélation', async () => {
  let swapped = false;
  const pair = makePair({
    tamper: (msg, to) => {
      // L'invité (qui envoie à l'hôte) annonce une autre carte de même niveau et du même deck.
      if (!swapped && msg.t === 'move' && to.role === 'host') {
        const original = CARDS.find((c) => c.id === msg.card);
        const other = CARDS.find((c) => c.deck === original.deck && c.level === original.level && c.id !== original.id);
        msg.card = other.id;
        swapped = true;
      }
      return msg;
    },
  });
  await pair.host.hostStart({ rules: {}, deck: 'vents' });
  await autoPlay(pair);
  await waitUntil(() => pair.host.m.phase === 'over', 'fin');
  assert.equal(pair.host.m.result.reason, 'cheat');
  assert.equal(pair.host.m.result.winner, null);
});

test('duel : une carte du mauvais niveau ou du mauvais deck est refusée immédiatement', async () => {
  const pair = makePair({
    tamper: (msg, to) => {
      if (msg.t === 'move' && to.role === 'host') msg.card = CARDS.find((c) => c.deck === 'ombres').id;
      return msg;
    },
  });
  await pair.host.hostStart({ rules: {}, deck: 'vents' });
  await autoPlay(pair, { stopAfter: 3 });
  await waitUntil(() => pair.host.m.phase === 'over', 'détection');
  assert.equal(pair.host.m.result.reason, 'cheat');
});

test('duel : une coupure met en pause, la resynchronisation reprend sans perte ni doublon', async () => {
  const pair = makePair();
  await pair.host.hostStart({ rules: {}, deck: 'vents' });
  await waitUntil(() => pair.guest.m?.phase === 'playing', 'distribution');
  await autoPlay(pair, { stopAfter: 2 });
  await waitUntil(() => pair.host.m.match.moves.length === pair.guest.m.match.moves.length, 'synchro avant coupure');
  pair.wire.up = false;
  // Le joueur dont c'est le tour joue pendant la coupure : son coup est perdu en route.
  const mover = pair.host.m.match.game.turn === pair.host.local ? pair.host : pair.guest;
  await mover.playLocal(0, mover.m.match.game.board.findIndex((s) => !s));
  await settle();
  assert.ok(pair.wire.dropped.length >= 1);
  assert.notEqual(pair.host.m.match.moves.length, pair.guest.m.match.moves.length);
  // Reconnexion : chacun envoie sync, l'autre renvoie ce qui manque.
  pair.wire.up = true;
  pair.host.connected();
  pair.guest.connected();
  await waitUntil(() => pair.host.m.match.moves.length === pair.guest.m.match.moves.length, 'resynchronisation');
  await autoPlay(pair);
  await waitUntil(() => pair.host.m.phase === 'over' && pair.guest.m.phase === 'over', 'fin');
  assert.equal(pair.host.m.result.reason, 'score');
  assert.deepEqual(pair.host.m.result.winner, pair.guest.m.result.winner);
});

test('duel : seul un abandon explicite donne la victoire', async () => {
  const pair = makePair();
  await pair.host.hostStart({ rules: {}, deck: 'vents' });
  await waitUntil(() => pair.guest.m?.phase === 'playing', 'distribution');
  pair.wire.up = false; // une simple coupure ne termine rien
  await settle();
  assert.equal(pair.host.m.phase, 'playing');
  pair.wire.up = true;
  await pair.guest.resign();
  await waitUntil(() => pair.host.m.phase === 'over', 'abandon reçu');
  assert.deepEqual(pair.host.m.result, { winner: 0, reason: 'resign', resigned: 1 });
  assert.deepEqual(pair.guest.m.result, { winner: 0, reason: 'resign', resigned: 1 });
});

test('duel : Main Ouverte révèle les deux mains dès la distribution', async () => {
  const pair = makePair();
  await pair.host.hostStart({ rules: { open: true }, deck: 'vents' });
  await waitUntil(() => pair.host.m?.revealed[1] && pair.guest.m?.revealed[0], 'révélation');
  assert.ok(pair.host.m.match.game.hands[1].every((c) => !c.hidden));
  assert.ok(pair.guest.m.match.game.hands[0].every((c) => !c.hidden));
});

test('duel : reprise après rechargement à partir du journal', async () => {
  const pair = makePair();
  await pair.host.hostStart({ rules: { sudden: true }, deck: 'vents' });
  await autoPlay(pair, { stopAfter: 4 });
  await settle();
  const saved = JSON.parse(JSON.stringify(pair.guest.snapshot()));
  const restored = await DuelProtocol.restore(saved, { send: pair.guest.sendRaw });
  assert.deepEqual(restored.m.match.game.board, pair.guest.m.match.game.board);
  assert.deepEqual(restored.m.match.game.hands, pair.guest.m.match.game.hands);
  assert.equal(restored.nextInSeq, pair.guest.nextInSeq);
  assert.equal(restored.outbox.length, pair.guest.outbox.length);
});

test('duel : messages mal formés rejetés, tirage privé déterministe', () => {
  assert.equal(sanitizeDuelMessage({ t: 'move', seq: 0, id: 'zz', ply: 0, h: 0, c: 0, card: 'x' }), null);
  assert.equal(sanitizeDuelMessage({ t: 'move', seq: 0, id: '0123456789abcdef', ply: 0, h: 7, c: 0, card: 'x' }), null);
  assert.equal(sanitizeDuelMessage({ t: 'setup', seq: 0, id: '0123456789abcdef', v: 1, deck: '__proto__', rules: {} }), null);
  assert.equal(sanitizeDuelMessage({ t: 'eval', seq: 0, id: '0123456789abcdef' }), null);
  const hand = dealPrivateHand('abysses', 'a'.repeat(64));
  assert.deepEqual(hand.map((c) => c.level), [1, 2, 3, 4, 5]);
  assert.ok(hand.every((c) => c.deck === 'abysses'));
  assert.deepEqual(dealPrivateHand('abysses', 'a'.repeat(64)), hand);
});

test('duel : Mort Subite après vérification des mains, identique des deux côtés', async () => {
  let checked = false;
  for (let attempt = 0; attempt < 120 && !checked; attempt++) {
    const pair = makePair();
    await pair.host.hostStart({ rules: { sudden: true }, deck: 'vents' });
    await autoPlay(pair, { stopAfter: 9 });
    await waitUntil(() => pair.host.m.match.round > 1 || pair.host.m.phase === 'over', 'fin de manche');
    await waitUntil(() => pair.guest.m.match.round === pair.host.m.match.round, 'même manche');
    if (pair.host.m.match.round === 2) {
      const [h, g] = [pair.host.m.match.game, pair.guest.m.match.game];
      assert.ok(!h.hands.flat().some((c) => c.hidden) && !g.hands.flat().some((c) => c.hidden));
      assert.deepEqual(h.hands.map((x) => x.map((c) => c.id)), g.hands.map((x) => x.map((c) => c.id)));
      assert.deepEqual(h.boardElements, g.boardElements);
      assert.equal(h.turn, g.turn);
      await autoPlay(pair);
      await waitUntil(() => pair.host.m.phase === 'over' && pair.guest.m.phase === 'over', 'fin du match');
      assert.notEqual(pair.host.m.result.reason, 'cheat');
      assert.deepEqual(pair.host.m.result.winner, pair.guest.m.result.winner);
      checked = true;
    }
  }
  assert.ok(checked, 'aucune égalité obtenue');
});
