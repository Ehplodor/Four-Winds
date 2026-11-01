// Protocole du duel en ligne, indépendant du transport (WebRTC en jeu, mémoire dans les tests).
//
// Mains cachées vérifiables (principe du « mental poker » simplifié) :
// 1. Chaque joueur tire un secret s et une valeur aléatoire r, et publie d'abord leurs empreintes
//    H(s) et H(r) (« engagement »).
// 2. Une fois les deux engagements reçus, chacun révèle r. Personne n'a pu choisir son r en fonction de celui
//    de l'autre, donc ni le premier joueur ni les cases élémentaires (tirés de H(r_hôte | r_invité)) ne sont
//    manipulables.
// 3. Chaque joueur tire sa main de son propre deck avec H(s | r_hôte | r_invité) : il est le seul à la connaître,
//    et il ne peut plus la choisir puisque s est engagé avant que r adverse soit connu.
// 4. À chaque coup, la carte jouée est annoncée ; l'adversaire vérifie son deck et son niveau (une carte par
//    niveau est distribuée). En fin de manche, chacun révèle s : l'autre recalcule la main et vérifie que
//    toutes les cartes annoncées en faisaient partie. Toute incohérence annule la partie.
//
// Fiabilité : chaque message porte un numéro de séquence et reste dans une boîte d'envoi. Après une coupure,
// un message `sync` indique ce qui a été reçu et l'autre renvoie la suite : la partie reprend là où elle
// s'était arrêtée. Le journal (`snapshot`) permet aussi de reprendre après un rechargement de la page.

import { CARDS, DECKS, dealHands } from './cards.js';
import { winner } from './engine.js';
import {
  createMatchFromHands,
  playMatchMove,
  startSuddenDeath,
  needsSuddenDeath,
  MAX_MATCH_MOVES,
} from './match.js';
import { createSeededRng } from './rng.js';

export const DUEL_RULE_KEYS = ['elemental', 'synergy', 'same', 'sameWall', 'plus', 'combo', 'open', 'sudden'];
const DECK_KEYS = Object.keys(DECKS);
const CARD_BY_ID = new Map(CARDS.map((c) => [c.id, c]));
const enc = new TextEncoder();

// ---------------------------------------------------------------------------
// Outils cryptographiques
// ---------------------------------------------------------------------------

export function randomHex(bytes) {
  return [...globalThis.crypto.getRandomValues(new Uint8Array(bytes))].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function sha256Hex(...parts) {
  const digest = await globalThis.crypto.subtle.digest('SHA-256', enc.encode(parts.join('|')));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

const seedFromHex = (hex) => parseInt(hex.slice(0, 8), 16) >>> 0;

// Main privée : une carte par niveau (1 à 5), dans l'ordre des niveaux.
export function dealPrivateHand(deck, seedHex) {
  return dealHands(createSeededRng(seedFromHex(seedHex)), { deck0: deck, deck1: deck })[0];
}

export function hiddenCard(owner, level, deck) {
  return {
    id: `hidden-${owner}-${level}`,
    hidden: true,
    level,
    deck,
    name: 'Carte cachée',
    values: [1, 1, 1, 1],
    element: null,
  };
}

// ---------------------------------------------------------------------------
// Validation des messages reçus
// ---------------------------------------------------------------------------

const isHex = (s, len) => typeof s === 'string' && s.length === len && /^[0-9a-f]+$/.test(s);
const isInt = (n, min, max) => Number.isInteger(n) && n >= min && n <= max;

function sanitizeRules(rules) {
  if (!rules || typeof rules !== 'object') return null;
  return Object.fromEntries(DUEL_RULE_KEYS.map((k) => [k, rules[k] === true]));
}

// Ne garde que les champs attendus ; renvoie null pour tout message mal formé.
export function sanitizeDuelMessage(msg) {
  if (!msg || typeof msg !== 'object') return null;
  if (msg.t === 'sync') return isInt(msg.have, 0, 1e6) ? { t: 'sync', have: msg.have } : null;
  if (!isInt(msg.seq, 0, 1e6) || !isHex(msg.id, 16)) return null;
  const base = { t: msg.t, seq: msg.seq, id: msg.id };
  switch (msg.t) {
    case 'setup': {
      const rules = sanitizeRules(msg.rules);
      return rules && DECK_KEYS.includes(msg.deck) && msg.v === 1 ? { ...base, rules, deck: msg.deck } : null;
    }
    case 'join':
      return DECK_KEYS.includes(msg.deck) ? { ...base, deck: msg.deck } : null;
    case 'commit':
      return isHex(msg.h, 64) && isHex(msg.hr, 64) ? { ...base, h: msg.h, hr: msg.hr } : null;
    case 'rand':
      return isHex(msg.r, 32) ? { ...base, r: msg.r } : null;
    case 'move':
      if (!isInt(msg.ply, 0, MAX_MATCH_MOVES - 1) || !isInt(msg.h, 0, 4) || !isInt(msg.c, 0, 8)) return null;
      return typeof msg.card === 'string' && msg.card.length <= 64 ? { ...base, ply: msg.ply, h: msg.h, c: msg.c, card: msg.card } : null;
    case 'reveal':
      return isHex(msg.s, 64) ? { ...base, s: msg.s } : null;
    case 'resign':
      return base;
    default:
      return null;
  }
}

// ---------------------------------------------------------------------------
// Protocole
// ---------------------------------------------------------------------------

/**
 * Événements émis par onEvent(evt) :
 * - { kind: 'ready', match }                     : distribution faite, la manche commence
 * - { kind: 'move', player, step, match }        : un coup a été joué (step vient de playMatchMove)
 * - { kind: 'verifying' }                         : fin de manche, attente de la révélation adverse
 * - { kind: 'sudden-death', match, roundOver }    : vérification faite, nouvelle manche de Mort Subite
 * - { kind: 'revealed', match }                   : main adverse révélée (règle Main Ouverte)
 * - { kind: 'over', result, match }               : fin de partie ; result = { winner: 0|1|'draw'|null, reason }
 *   reason ∈ 'score' | 'resign' | 'cheat' (winner null : partie annulée)
 * - { kind: 'error', message }                    : message rejeté (ignoré)
 */
export class DuelProtocol {
  constructor({ role, send = () => {}, onEvent = () => {}, deck = 'vents', sessionId = randomHex(8) }) {
    this.role = role;
    this.local = role === 'host' ? 0 : 1;
    this.remote = 1 - this.local;
    this.sendRaw = send;
    this.onEvent = onEvent;
    this.myDeck = deck;
    this.sessionId = sessionId;

    this.outbox = [];
    this.nextInSeq = 0;
    this.journal = [];
    this.m = null;
    this.queue = Promise.resolve();
    this.replaying = false;
    this.replayGen = [];
  }

  // --- API publique (toutes les actions sont sérialisées) ---

  // À appeler à chaque (re)connexion : demande à l'autre de renvoyer ce qu'on n'a pas reçu.
  connected() {
    this.sendRaw({ t: 'sync', have: this.nextInSeq });
  }

  setDeck(deck) {
    if (DECK_KEYS.includes(deck)) this.myDeck = deck;
  }

  canStart() {
    return this.role === 'host' && (!this.m || this.m.phase === 'over');
  }

  hostStart({ rules, deck }) {
    return this.enqueue(async () => {
      if (!this.canStart()) throw new Error("Seul l'hôte lance une partie, une fois la précédente terminée.");
      const id = randomHex(8);
      this.log({ k: 'act', a: 'start', id, rules, deck });
      await this.doStart(id, sanitizeRules(rules), deck);
    });
  }

  playLocal(handIndex, cell) {
    return this.enqueue(async () => {
      this.log({ k: 'act', a: 'move', h: handIndex, c: cell });
      this.doPlayLocal(handIndex, cell);
    });
  }

  resign() {
    return this.enqueue(async () => {
      if (!this.m || this.m.phase === 'over') return;
      this.log({ k: 'act', a: 'resign' });
      this.out({ t: 'resign' });
      this.finish({ winner: this.remote, reason: 'resign', resigned: this.local });
    });
  }

  receive(raw) {
    const msg = sanitizeDuelMessage(raw);
    if (!msg) {
      this.onEvent({ kind: 'error', message: 'Message mal formé ignoré.' });
      return this.queue;
    }
    if (msg.t === 'sync') {
      for (const o of this.outbox) if (o.seq >= msg.have) this.sendRaw(o);
      return this.queue;
    }
    return this.enqueue(async () => {
      if (msg.seq < this.nextInSeq) return; // doublon
      if (msg.seq > this.nextInSeq) {
        this.sendRaw({ t: 'sync', have: this.nextInSeq }); // trou : on redemande la suite
        return;
      }
      this.nextInSeq++;
      this.log({ k: 'in', msg });
      await this.process(msg);
    });
  }

  // --- Persistance ---

  snapshot() {
    return { v: 1, role: this.role, sessionId: this.sessionId, deck: this.myDeck, journal: this.journal };
  }

  static async restore(saved, { send, onEvent } = {}) {
    const p = new DuelProtocol({ role: saved.role, deck: saved.deck, sessionId: saved.sessionId });
    p.replaying = true;
    p.replayGen = saved.journal.filter((ev) => ev.k === 'gen');
    for (const ev of saved.journal) {
      p.journal.push(ev);
      if (ev.k === 'in') {
        p.nextInSeq++;
        await p.process(ev.msg);
      } else if (ev.k === 'act' && ev.a === 'start') await p.doStart(ev.id, sanitizeRules(ev.rules), ev.deck);
      else if (ev.k === 'act' && ev.a === 'move') p.doPlayLocal(ev.h, ev.c);
      else if (ev.k === 'act' && ev.a === 'resign') {
        p.out({ t: 'resign' });
        p.finish({ winner: p.remote, reason: 'resign', resigned: p.local });
      }
    }
    p.replaying = false;
    p.sendRaw = send || (() => {});
    p.onEvent = onEvent || (() => {});
    return p;
  }

  // --- Interne ---

  enqueue(fn) {
    this.queue = this.queue.then(fn).catch((err) => this.onEvent({ kind: 'error', message: err.message }));
    return this.queue;
  }

  log(ev) {
    if (!this.replaying) this.journal.push(ev);
  }

  emit(evt) {
    if (!this.replaying) this.onEvent(evt);
  }

  out(payload) {
    const msg = { ...payload, seq: this.outbox.length, id: payload.id || this.m.id };
    this.outbox.push(msg);
    if (!this.replaying) this.sendRaw(msg);
  }

  gen() {
    if (this.replaying) {
      const ev = this.replayGen.shift();
      return { secret: ev.secret, rand: ev.rand };
    }
    const ev = { k: 'gen', secret: randomHex(32), rand: randomHex(16) };
    this.journal.push(ev);
    return { secret: ev.secret, rand: ev.rand };
  }

  newMatchRecord(id, rules) {
    return {
      id,
      rules,
      phase: 'setup',
      decks: [null, null],
      secret: null,
      rand: null,
      commits: [null, null],
      rands: [null, null],
      randSent: false,
      revealSent: false,
      revealed: [false, false],
      played: [[], []],
      match: null,
      pendingRoundOver: null,
      result: null,
    };
  }

  async doStart(id, rules, deck) {
    this.m = this.newMatchRecord(id, rules);
    this.m.decks[0] = deck;
    this.myDeck = deck;
    this.out({ t: 'setup', v: 1, rules, deck, id });
    await this.sendCommit();
  }

  async sendCommit() {
    const { secret, rand } = this.gen();
    this.m.secret = secret;
    this.m.rand = rand;
    this.m.rands[this.local] = rand;
    this.out({ t: 'commit', h: await sha256Hex(secret), hr: await sha256Hex(rand) });
  }

  cheat(message) {
    this.finish({ winner: null, reason: 'cheat', cheater: this.remote, message });
  }

  async process(msg) {
    if (msg.t === 'setup') {
      if (this.role !== 'guest' || (this.m && this.m.phase !== 'over')) return;
      this.m = this.newMatchRecord(msg.id, msg.rules);
      this.m.decks[0] = msg.deck;
      this.m.decks[1] = this.myDeck;
      this.out({ t: 'join', deck: this.myDeck });
      await this.sendCommit();
      return;
    }
    const m = this.m;
    if (!m || msg.id !== m.id || m.phase === 'over') return;

    switch (msg.t) {
      case 'join':
        if (this.role === 'host' && m.phase === 'setup') m.decks[1] = msg.deck;
        break;
      case 'commit':
        if (m.commits[this.remote]) return;
        m.commits[this.remote] = { h: msg.h, hr: msg.hr };
        if (!m.randSent) {
          m.randSent = true;
          this.out({ t: 'rand', r: m.rand });
        }
        break;
      case 'rand':
        if (!m.commits[this.remote] || m.rands[this.remote]) return;
        if ((await sha256Hex(msg.r)) !== m.commits[this.remote].hr) return this.cheat("La valeur aléatoire adverse ne correspond pas à son engagement.");
        m.rands[this.remote] = msg.r;
        await this.setupMatch();
        break;
      case 'move':
        this.receiveMove(msg);
        break;
      case 'reveal':
        await this.receiveReveal(msg.s);
        break;
      case 'resign':
        this.finish({ winner: this.local, reason: 'resign', resigned: this.remote });
        break;
    }
  }

  async setupMatch() {
    const m = this.m;
    if (!m.decks[0] || !m.decks[1]) return this.cheat('Deck adverse inconnu.');
    const [rHost, rGuest] = m.rands;
    const joint = await sha256Hex('joint', rHost, rGuest);
    const rng = createSeededRng(seedFromHex(joint));
    const firstPlayer = rng() < 0.5 ? 0 : 1;
    const own = dealPrivateHand(m.decks[this.local], await sha256Hex('main', m.secret, rHost, rGuest));
    const hidden = [1, 2, 3, 4, 5].map((lvl) => hiddenCard(this.remote, lvl, m.decks[this.remote]));
    const hands = this.local === 0 ? [own, hidden] : [hidden, own];
    m.match = createMatchFromHands({
      hands,
      rng,
      seed: seedFromHex(joint),
      deck0: m.decks[0],
      deck1: m.decks[1],
      firstPlayer,
      rules: m.rules,
    });
    m.phase = 'playing';
    this.emit({ kind: 'ready', match: m.match });
    if (m.rules.open) this.sendReveal();
  }

  sendReveal() {
    if (this.m.revealSent) return;
    this.m.revealSent = true;
    this.out({ t: 'reveal', s: this.m.secret });
  }

  doPlayLocal(handIndex, cell) {
    const m = this.m;
    if (!m || m.phase !== 'playing') throw new Error("Aucune manche en cours.");
    const game = m.match.game;
    if (game.turn !== this.local) throw new Error("Ce n'est pas votre tour.");
    const card = game.hands[this.local][handIndex];
    if (!card || card.hidden) throw new Error('Carte invalide.');
    if (!Number.isInteger(cell) || cell < 0 || cell > 8 || game.board[cell]) throw new Error('Case invalide.');
    // Le coup part avant ses conséquences (révélation de fin de manche) pour garder l'ordre logique.
    this.out({ t: 'move', ply: m.match.moves.length, h: handIndex, c: cell, card: card.id });
    this.applyMove(this.local, handIndex, cell);
  }

  receiveMove(msg) {
    const m = this.m;
    if (m.phase !== 'playing' || msg.ply !== m.match.moves.length) return this.cheat('Coup reçu hors séquence.');
    const game = m.match.game;
    if (game.turn !== this.remote) return this.cheat("Coup adverse reçu alors que ce n'était pas son tour.");
    const slot = game.hands[this.remote][msg.h];
    const card = CARD_BY_ID.get(msg.card);
    if (!slot || !card) return this.cheat('Carte adverse inconnue.');
    if (slot.hidden) {
      if (card.deck !== m.decks[this.remote] || card.level !== slot.level || m.played[this.remote].includes(card.id)) {
        return this.cheat("La carte annoncée ne peut pas venir de la main de l'adversaire.");
      }
      const hands = game.hands.slice();
      hands[this.remote] = hands[this.remote].map((c, i) => (i === msg.h ? card : c));
      m.match = { ...m.match, game: { ...game, hands } };
    } else if (slot.id !== card.id) {
      return this.cheat("La carte annoncée n'est pas celle de la main adverse.");
    }
    if (game.board[msg.c]) return this.cheat('Case déjà occupée.');
    this.applyMove(this.remote, msg.h, msg.c);
  }

  applyMove(player, handIndex, cell) {
    const m = this.m;
    const card = m.match.game.hands[player][handIndex];
    const step = playMatchMove(m.match, handIndex, cell, { autoSuddenDeath: false });
    m.match = step.match;
    if (player === this.remote && !m.revealed[this.remote]) m.played[this.remote].push(card.id);
    this.emit({ kind: 'move', player, step, match: m.match });

    if (!step.roundOver) return;
    if (!m.revealed[this.remote] || !m.revealSent) {
      // Fin de manche : chacun révèle son secret pour que l'autre vérifie toutes les cartes jouées.
      m.phase = 'reveal';
      m.pendingRoundOver = step.roundOver;
      this.sendReveal();
      if (m.revealed[this.remote]) this.finishRound();
      else this.emit({ kind: 'verifying' });
      return;
    }
    m.pendingRoundOver = step.roundOver;
    this.finishRound();
  }

  async receiveReveal(secret) {
    const m = this.m;
    if (m.revealed[this.remote]) return;
    if (!m.rands[0] || !m.rands[1]) return this.cheat('Révélation reçue avant la distribution.');
    if ((await sha256Hex(secret)) !== m.commits[this.remote].h) return this.cheat('Le secret adverse ne correspond pas à son engagement.');
    const hand = dealPrivateHand(m.decks[this.remote], await sha256Hex('main', secret, m.rands[0], m.rands[1]));
    const ids = hand.map((c) => c.id);
    if (!m.played[this.remote].every((id) => ids.includes(id))) {
      return this.cheat("Une carte jouée par l'adversaire ne faisait pas partie de sa main.");
    }
    m.revealed[this.remote] = true;
    // Remplace les cartes encore cachées (main en cours, et état final de manche en attente) par les vraies.
    const unplayed = hand.filter((c) => !m.played[this.remote].includes(c.id));
    const fill = (state) => {
      if (!state) return state;
      const hands = state.hands.slice();
      hands[this.remote] = hands[this.remote].map((c) => (c.hidden ? unplayed.find((u) => u.level === c.level) || c : c));
      return { ...state, hands };
    };
    m.match = { ...m.match, game: fill(m.match.game) };
    m.pendingRoundOver = fill(m.pendingRoundOver);
    if (m.phase === 'reveal') this.finishRound();
    else this.emit({ kind: 'revealed', match: m.match });
  }

  finishRound() {
    const m = this.m;
    const roundOver = m.pendingRoundOver;
    m.pendingRoundOver = null;
    if (needsSuddenDeath(roundOver, m.match.round)) {
      m.match = startSuddenDeath(m.match, roundOver);
      m.phase = 'playing';
      this.emit({ kind: 'sudden-death', match: m.match, roundOver });
      return;
    }
    this.finish({ winner: winner(roundOver), reason: 'score' });
  }

  finish(result) {
    this.m.phase = 'over';
    this.m.result = result;
    this.emit({ kind: 'over', result, match: this.m.match });
  }
}
