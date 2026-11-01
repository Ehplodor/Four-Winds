// Module réseau (« Les Quatre Vents ») : jouer à deux à distance depuis un hébergement statique (GitHub Pages),
// sans serveur à nous. Deux modes :
// 1. Duel en direct par code de salon :
//    - la mise en relation passe par des relais MQTT publics (tiers) et, sur un même appareil, par BroadcastChannel ;
//    - tous les messages qui transitent par ces relais sont chiffrés et authentifiés (AES-GCM) avec une clé
//      dérivée du code de salon (PBKDF2), et le sujet MQTT est lui-même dérivé du code : un relais ou un
//      curieux qui écoute tous les sujets ne voit ni le code, ni les coups, ni les adresses IP échangées ;
//    - dès que possible, les deux navigateurs ouvrent un canal WebRTC direct (chiffré par DTLS).
// 2. Duel asynchrone par SMS / lien compact (?turn=...) : toute la partie tient dans une courte chaîne.
//    Ce lien n'est ni chiffré ni signé : voir verifyTokenContinuity pour la détection de triche côté client.

import { DECKS } from './cards.js';
import { createSeededRng, randomUint32, randomInt } from './rng.js';
import { replayMatch, MAX_MATCH_MOVES } from './match.js';

export { createSeededRng };

const DECK_KEYS = Object.keys(DECKS); // ['vents', 'forge', 'abysses', 'ombres']
export const RULE_KEYS = ['elemental', 'synergy', 'same', 'plus', 'combo', 'open', 'sudden'];
const BASE62 = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
const MAX_TOKEN_LENGTH = 120;

// Seules ces émotes peuvent circuler entre les joueurs.
export const EMOTES = ['👏 Bien joué !', '⚡ Quel combo !', '🔥 Belle prise !'];

// ============================================================================
// 1. GRAINES, CODES DE SALON & CODEC DE PARTIE COMPACT (SMS / URL)
// ============================================================================

export function generateSeed() {
  return randomUint32() || 1234567;
}

// 8 caractères dans un alphabet de 32 symboles sans ambiguïté (pas de 0/O ni 1/I) : 40 bits d'entropie.
const ROOM_ALPHABET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
export const ROOM_CODE_LENGTH = 8;

export function generateRoomCode() {
  let out = '';
  for (let i = 0; i < ROOM_CODE_LENGTH; i++) out += ROOM_ALPHABET[randomInt(ROOM_ALPHABET.length)];
  return out;
}

// Accepte « abcd-efgh », « ABCD EFGH »… et renvoie « ABCDEFGH », ou null si le code est invalide.
export function normalizeRoomCode(raw) {
  if (typeof raw !== 'string') return null;
  const code = raw.toUpperCase().replace(/[\s-]/g, '');
  if (code.length !== ROOM_CODE_LENGTH) return null;
  for (const ch of code) if (!ROOM_ALPHABET.includes(ch)) return null;
  return code;
}

export function formatRoomCode(code) {
  return code && code.length === ROOM_CODE_LENGTH ? `${code.slice(0, 4)}-${code.slice(4)}` : code || '';
}

export function encodeRulesMask(rules = {}) {
  let mask = 0;
  RULE_KEYS.forEach((k, i) => {
    if (rules[k]) mask |= 1 << i;
  });
  return mask;
}

export function decodeRulesMask(mask) {
  const rules = {};
  RULE_KEYS.forEach((k, i) => {
    rules[k] = Boolean(mask & (1 << i));
  });
  return rules;
}

function encodeMoves(moves) {
  return moves.map((m) => BASE62[m.handIndex * 9 + m.cell]).join('');
}

function decodeMoves(str) {
  const moves = [];
  for (const ch of str) {
    const code = BASE62.indexOf(ch);
    if (code < 0 || code >= 45) return null;
    moves.push({ handIndex: Math.floor(code / 9), cell: code % 9 });
  }
  return moves;
}

/**
 * Encode une partie en chaîne compacte (format 2) :
 * "2.<graine base36>.<deck0><deck1><premier joueur>.<masque de règles base36>.<coups base62>"
 * Chaque coup (index de main 0..4, case 0..8) tient sur un caractère : handIndex * 9 + case.
 */
export function encodeCompactMatch({ seed, deck0, deck1, firstPlayer = 0, rules = {}, moves = [] }) {
  const d0 = Math.max(0, DECK_KEYS.indexOf(deck0));
  const d1 = Math.max(0, DECK_KEYS.indexOf(deck1));
  const first = firstPlayer === 1 ? 1 : 0;
  const mask = encodeRulesMask(rules).toString(36);
  return `2.${(seed >>> 0).toString(36)}.${d0}${d1}${first}.${mask}.${encodeMoves(moves)}`;
}

function parseCompactToken(clean) {
  const parts = clean.split('.');
  if (parts[0] === '2') {
    // Format actuel
    if (parts.length !== 5 || !/^[0-9a-z]{1,7}$/.test(parts[1]) || !/^[0-3]{2}[01]$/.test(parts[2])) return null;
    if (!/^[0-9a-z]{1,3}$/.test(parts[3])) return null;
    const seed = parseInt(parts[1], 36);
    const mask = parseInt(parts[3], 36);
    if (seed > 0xffffffff || mask >= 1 << RULE_KEYS.length) return null;
    return { seed, meta: parts[2], rules: decodeRulesMask(mask), movesRaw: parts[4] };
  }
  if (parts[0] === '1') {
    // Ancien format (règles sur un seul caractère base62), conservé pour relire les anciens liens.
    if (parts.length < 3 || parts.length > 4 || !/^[0-9a-z]{1,7}$/.test(parts[1])) return null;
    const meta = parts[2];
    if (!/^[0-3]{2}[01].$/.test(meta)) return null;
    const mask = BASE62.indexOf(meta[3]);
    const seed = parseInt(parts[1], 36);
    if (mask < 0 || seed > 0xffffffff) return null;
    return { seed, meta: meta.slice(0, 3), rules: decodeRulesMask(mask), movesRaw: parts[3] || '' };
  }
  return null;
}

/**
 * Décode une chaîne compacte et rejoue la partie. Renvoie null pour tout jeton invalide ou contenant un coup
 * illégal (jamais d'exception : le jeton vient d'un lien externe).
 */
export function decodeCompactMatch(token) {
  if (!token || typeof token !== 'string') return null;
  const clean = token.trim();
  if (clean.length > MAX_TOKEN_LENGTH) return null;
  const parsed = parseCompactToken(clean);
  if (!parsed) return null;

  const moves = decodeMoves(parsed.movesRaw);
  if (!moves || moves.length > MAX_MATCH_MOVES) return null;

  const deck0 = DECK_KEYS[Number(parsed.meta[0])];
  const deck1 = DECK_KEYS[Number(parsed.meta[1])];
  const firstPlayer = parsed.meta[2] === '1' ? 1 : 0;
  if (!deck0 || !deck1) return null;

  try {
    const { match, last } = replayMatch({ seed: parsed.seed, deck0, deck1, firstPlayer, rules: parsed.rules }, moves);
    return {
      seed: parsed.seed,
      deck0,
      deck1,
      firstPlayer,
      rules: match.rules,
      moves,
      match,
      game: match.game,
      lastMoveResult: last?.result || null,
      lastRoundOver: last?.roundOver || null,
    };
  } catch {
    return null;
  }
}

// Clé qui identifie une partie indépendamment des coups joués (pour l'historique anti-triche).
export function matchKey({ seed, deck0, deck1, firstPlayer, rules }) {
  return encodeCompactMatch({ seed, deck0, deck1, firstPlayer, rules, moves: [] });
}

/**
 * Le lien SMS n'est pas signé : un adversaire peut réécrire l'historique (changer un coup passé, jouer deux fois).
 * On compare donc le jeton reçu au dernier état connu de cette partie sur cet appareil :
 * - 'new'      : partie jamais vue ici (premier lien reçu, rien à comparer) ;
 * - 'same'     : rien de nouveau (lien déjà ouvert) ;
 * - 'extends'  : l'historique connu est conservé et prolongé (l'appelant vérifie que les coups ajoutés
 *                ont bien été joués aux tours de l'adversaire, Mort Subite comprise) ;
 * - 'stale'    : lien plus ancien que l'état connu ;
 * - 'tampered' : l'historique déjà connu a été modifié.
 */
export function verifyTokenContinuity(knownMoves, receivedMoves) {
  if (!knownMoves) return 'new';
  const known = encodeMoves(knownMoves);
  const received = encodeMoves(receivedMoves);
  if (received === known) return 'same';
  if (known.startsWith(received)) return 'stale';
  return received.startsWith(known) ? 'extends' : 'tampered';
}

/**
 * Construit les liens de partage et d'envoi par SMS natif (iOS & Android).
 */
export function buildShareLinks({ token, roomCode, scoreText = '' }) {
  const baseUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}${window.location.pathname}`
      : 'https://les-quatre-vents.app/';

  const url = token
    ? `${baseUrl}?turn=${encodeURIComponent(token)}`
    : `${baseUrl}?room=${encodeURIComponent(roomCode)}`;

  const message = token
    ? `🃏 Les Quatre Vents — J'ai joué mon coup${scoreText ? ` (${scoreText})` : ''} ! Touche ce lien pour voir le plateau et jouer ton tour : ${url}`
    : `🃏 Les Quatre Vents — Rejoins ma table de jeu (code : ${formatRoomCode(roomCode)}) : ${url}`;

  // iOS attend « sms:&body= », Android « sms:?body= »
  const isIOS =
    typeof navigator !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent || '');
  const smsSep = isIOS ? '&' : '?';
  const smsHref = `sms:${smsSep}body=${encodeURIComponent(message)}`;

  return { url, message, smsHref };
}

// ============================================================================
// 2. VALIDATION DES MESSAGES REÇUS
// ============================================================================

const MAX_PACKET_BYTES = 16 * 1024;
const MAX_CLOCK_SKEW_MS = 10 * 60 * 1000;

const isMove = (m) =>
  m && Number.isInteger(m.handIndex) && m.handIndex >= 0 && m.handIndex <= 4 &&
  Number.isInteger(m.cell) && m.cell >= 0 && m.cell <= 8;

const isShortString = (s, max) => typeof s === 'string' && s.length <= max;

function sanitizeRules(rules) {
  if (!rules || typeof rules !== 'object') return null;
  const out = {};
  for (const k of RULE_KEYS) out[k] = rules[k] === true;
  return out;
}

/**
 * Ne garde que les champs attendus de chaque type de message et rejette tout le reste (renvoie null).
 * Tout ce qui arrive du réseau passe par ici avant d'atteindre le jeu.
 */
export function sanitizePacket(pkt) {
  if (!pkt || typeof pkt !== 'object') return null;
  if (!isShortString(pkt.sender, 32) || !isShortString(pkt.msgId, 64)) return null;
  if (!Number.isFinite(pkt.ts) || Math.abs(Date.now() - pkt.ts) > MAX_CLOCK_SKEW_MS) return null;
  const base = { type: pkt.type, sender: pkt.sender, msgId: pkt.msgId };

  switch (pkt.type) {
    case 'hello':
    case 'hello-ack':
      return { ...base, isHost: pkt.isHost === true };
    case 'webrtc-offer':
    case 'webrtc-answer': {
      const expected = pkt.type === 'webrtc-offer' ? 'offer' : 'answer';
      if (!pkt.sdp || pkt.sdp.type !== expected || !isShortString(pkt.sdp.sdp, 12000)) return null;
      return { ...base, sdp: { type: expected, sdp: pkt.sdp.sdp } };
    }
    case 'webrtc-ice': {
      const c = pkt.candidate;
      if (!c || !isShortString(c.candidate, 1000)) return null;
      const sdpMid = c.sdpMid === null || c.sdpMid === undefined ? null : c.sdpMid;
      if (sdpMid !== null && !isShortString(sdpMid, 64)) return null;
      const idx = c.sdpMLineIndex ?? null;
      if (idx !== null && !(Number.isInteger(idx) && idx >= 0 && idx < 16)) return null;
      return { ...base, candidate: { candidate: c.candidate, sdpMid, sdpMLineIndex: idx } };
    }
    case 'game-start': {
      const rules = sanitizeRules(pkt.rules);
      if (!Number.isInteger(pkt.seed) || pkt.seed < 0 || pkt.seed > 0xffffffff) return null;
      if (!DECK_KEYS.includes(pkt.deck0) || !DECK_KEYS.includes(pkt.deck1)) return null;
      if (pkt.firstPlayer !== 0 && pkt.firstPlayer !== 1) return null;
      if (!rules || !Array.isArray(pkt.moves) || pkt.moves.length > MAX_MATCH_MOVES) return null;
      if (!pkt.moves.every(isMove)) return null;
      return {
        ...base,
        seed: pkt.seed,
        deck0: pkt.deck0,
        deck1: pkt.deck1,
        firstPlayer: pkt.firstPlayer,
        rules,
        moves: pkt.moves.map((m) => ({ handIndex: m.handIndex, cell: m.cell })),
      };
    }
    case 'game-move':
      if (!isMove(pkt) || !Number.isInteger(pkt.ply) || pkt.ply < 0 || pkt.ply >= MAX_MATCH_MOVES) return null;
      return { ...base, handIndex: pkt.handIndex, cell: pkt.cell, ply: pkt.ply };
    case 'game-emote':
      return EMOTES.includes(pkt.text) ? { ...base, text: pkt.text } : null;
    default:
      return null;
  }
}

// ============================================================================
// 3. CHIFFREMENT DU SALON (Web Crypto : PBKDF2 → AES-GCM)
// ============================================================================

const PBKDF2_ITERATIONS = 150000;
const enc = new TextEncoder();
const dec = new TextDecoder();

export function isRoomCryptoAvailable() {
  return Boolean(globalThis.crypto?.subtle && globalThis.isSecureContext !== false);
}

function toBase64(bytes) {
  let s = '';
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s);
}

function fromBase64(str) {
  const bin = atob(str);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

// Dérive du code de salon une clé AES-GCM et un identifiant de sujet MQTT.
// Le coût de PBKDF2 rend la recherche exhaustive des 2^40 codes à partir du sujet observé très coûteuse.
export async function deriveRoomSecrets(roomCode) {
  const subtle = globalThis.crypto.subtle;
  const base = await subtle.importKey('raw', enc.encode(roomCode), 'PBKDF2', false, ['deriveBits']);
  const bits = new Uint8Array(
    await subtle.deriveBits(
      { name: 'PBKDF2', salt: enc.encode('quatre-vents/salon/v3'), iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
      base,
      512,
    ),
  );
  const key = await subtle.importKey('raw', bits.slice(0, 32), 'AES-GCM', false, ['encrypt', 'decrypt']);
  const topicId = [...bits.slice(32, 48)].map((b) => b.toString(16).padStart(2, '0')).join('');
  return { key, topicId };
}

export async function sealPacket(secrets, packet) {
  const iv = globalThis.crypto.getRandomValues(new Uint8Array(12));
  const ct = new Uint8Array(
    await globalThis.crypto.subtle.encrypt(
      { name: 'AES-GCM', iv, additionalData: enc.encode(secrets.topicId) },
      secrets.key,
      enc.encode(JSON.stringify(packet)),
    ),
  );
  const out = new Uint8Array(iv.length + ct.length);
  out.set(iv);
  out.set(ct, iv.length);
  return `v3:${toBase64(out)}`;
}

// Renvoie l'objet déchiffré, ou null si le message n'a pas été produit avec la clé du salon.
export async function openPacket(secrets, sealed) {
  if (typeof sealed !== 'string' || !sealed.startsWith('v3:') || sealed.length > MAX_PACKET_BYTES * 2) return null;
  try {
    const raw = fromBase64(sealed.slice(3));
    if (raw.length < 13) return null;
    const pt = await globalThis.crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: raw.slice(0, 12), additionalData: enc.encode(secrets.topicId) },
      secrets.key,
      raw.slice(12),
    );
    if (pt.byteLength > MAX_PACKET_BYTES) return null;
    return JSON.parse(dec.decode(pt));
  } catch {
    return null;
  }
}

// ============================================================================
// 4. CONNEXION EN DIRECT (relais MQTT publics + BroadcastChannel + WebRTC)
// ============================================================================

// Serveurs STUN publics : ils voient l'adresse IP publique des joueurs (nécessaire à WebRTC).
const ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun.cloudflare.com:3478' },
];

// Relais MQTT-over-WSS publics et gratuits, gérés par des tiers, sans garantie de disponibilité.
// Ils ne voient que des messages chiffrés sur un sujet dérivé du code. Toute modification de cette liste
// doit être reportée dans la directive connect-src de la Content-Security-Policy (index.html).
export const PUBLIC_WSS_BROKERS = [
  'wss://broker.emqx.io:8084/mqtt',
  'wss://broker.hivemq.com:8884/mqtt',
  'wss://test.mosquitto.org:8081/mqtt',
];

/**
 * Client MQTT v3.1.1 minimaliste sur WebSocket binaire (0 dépendance externe).
 * Publie et reçoit des chaînes sur un seul sujet ; ignore tout message trop gros ou d'un autre sujet.
 */
class MiniMqttWsClient {
  constructor(url, topic, onMessage, onOpen) {
    this.url = url;
    this.topic = topic;
    this.onMessage = onMessage;
    this.onOpen = onOpen;
    this.ws = null;
    this.connected = false;
    this.pingTimer = null;
    this.connect();
  }

  connect() {
    if (typeof WebSocket === 'undefined') return;
    try {
      this.ws = new WebSocket(this.url, 'mqtt');
      this.ws.binaryType = 'arraybuffer';
    } catch {
      return;
    }

    this.ws.onopen = () => {
      const clientId = `qv_${randomUint32().toString(36)}`;
      this.ws.send(this.encodeConnect(clientId));
    };

    this.ws.onmessage = (e) => {
      if (!(e.data instanceof ArrayBuffer) || e.data.byteLength > MAX_PACKET_BYTES * 2 + 512) return;
      const data = new Uint8Array(e.data);
      if (!data.length) return;
      const type = data[0] >> 4;
      if (type === 2) {
        // CONNACK
        this.connected = true;
        this.ws.send(this.encodeSubscribe(this.topic));
        if (this.onOpen) this.onOpen();
        clearInterval(this.pingTimer);
        this.pingTimer = setInterval(() => {
          if (this.ws?.readyState === 1) {
            this.ws.send(new Uint8Array([0xc0, 0x00])); // PINGREQ
          }
        }, 25000);
      } else if (type === 3) {
        // PUBLISH
        const text = this.decodePublish(data);
        if (text !== null && this.onMessage) this.onMessage(text);
      }
    };

    this.ws.onerror = () => {};
    this.ws.onclose = () => {
      this.connected = false;
      clearInterval(this.pingTimer);
    };
  }

  publish(str) {
    if (!this.connected || this.ws?.readyState !== 1) return false;
    try {
      this.ws.send(this.encodePublish(this.topic, str));
      return true;
    } catch {
      return false;
    }
  }

  close() {
    clearInterval(this.pingTimer);
    try {
      this.ws?.close();
    } catch {
      // Ignore
    }
  }

  encodeLength(len) {
    const out = [];
    do {
      let d = len % 128;
      len = Math.floor(len / 128);
      if (len > 0) d |= 128;
      out.push(d);
    } while (len > 0);
    return out;
  }

  encodeStr(str) {
    const bytes = enc.encode(str);
    return [(bytes.length >> 8) & 0xff, bytes.length & 0xff, ...bytes];
  }

  encodeConnect(clientId) {
    const vh = [0x00, 0x04, 0x4d, 0x51, 0x54, 0x54, 0x04, 0x02, 0x00, 0x3c];
    const pl = this.encodeStr(clientId);
    const rem = vh.length + pl.length;
    return new Uint8Array([0x10, ...this.encodeLength(rem), ...vh, ...pl]);
  }

  encodeSubscribe(topic) {
    const vh = [0x00, 0x01];
    const pl = [...this.encodeStr(topic), 0x00];
    const rem = vh.length + pl.length;
    return new Uint8Array([0x82, ...this.encodeLength(rem), ...vh, ...pl]);
  }

  encodePublish(topic, payloadStr) {
    const tBytes = this.encodeStr(topic);
    const pBytes = enc.encode(payloadStr);
    const rem = tBytes.length + pBytes.length;
    return new Uint8Array([0x30, ...this.encodeLength(rem), ...tBytes, ...pBytes]);
  }

  // Renvoie la charge utile (texte) d'un PUBLISH QoS 0 sur notre sujet, ou null.
  decodePublish(data) {
    let idx = 1;
    let mult = 1;
    let remLen = 0;
    let byte;
    let lenBytes = 0;
    do {
      if (idx >= data.length || ++lenBytes > 4) return null;
      byte = data[idx++];
      remLen += (byte & 127) * mult;
      mult *= 128;
    } while ((byte & 128) !== 0);

    if (idx + remLen !== data.length || remLen < 2) return null;
    if ((data[0] & 0x06) !== 0) return null; // QoS > 0 : non utilisé ici
    const topicLen = (data[idx] << 8) | data[idx + 1];
    if (2 + topicLen > remLen) return null;
    const topic = dec.decode(data.slice(idx + 2, idx + 2 + topicLen));
    if (topic !== this.topic) return null;
    return dec.decode(data.slice(idx + 2 + topicLen, idx + remLen));
  }
}

/**
 * Session de duel en direct. Le premier pair du rôle opposé (hôte ↔ invité) qui se présente est retenu ;
 * les messages de tout autre émetteur sont ignorés. Événements :
 * onStatus({ state }) avec state ∈ 'deriving' | 'waiting' | 'connected' | 'connected-webrtc' | 'error'.
 */
export class PeerRoomSession {
  constructor({ roomCode, isHost, onStatus, onPeerJoined, onGameStart, onMove, onEmote }) {
    this.roomCode = normalizeRoomCode(roomCode) || generateRoomCode();
    this.isHost = Boolean(isHost);
    this.peerId = `p_${randomUint32().toString(36)}`;
    this.onStatus = onStatus || (() => {});
    this.onPeerJoined = onPeerJoined || (() => {});
    this.onGameStart = onGameStart || (() => {});
    this.onMove = onMove || (() => {});
    this.onEmote = onEmote || (() => {});

    this.secrets = null;
    this.bc = null;
    this.mqttClients = [];
    this.pc = null;
    this.dc = null;
    this.seenMsgIds = new Set();
    this.peerConnected = false;
    this.remotePeerId = null;
    this.lastSeenFromPeer = 0;
    this.closed = false;
  }

  async start() {
    if (!isRoomCryptoAvailable()) {
      this.onStatus({ state: 'error', reason: 'insecure-context' });
      return;
    }
    this.onStatus({ state: 'deriving' });
    this.secrets = await deriveRoomSecrets(this.roomCode);
    if (this.closed) return;
    const topic = `quatre-vents-v3/${this.secrets.topicId}`;

    // Même appareil (deux onglets) : BroadcastChannel, avec les mêmes messages chiffrés.
    if (typeof BroadcastChannel !== 'undefined') {
      this.bc = new BroadcastChannel(topic);
      this.bc.onmessage = (e) => this.receiveSealed(e.data);
    }

    for (const url of PUBLIC_WSS_BROKERS) {
      const client = new MiniMqttWsClient(
        url,
        topic,
        (text) => this.receiveSealed(text),
        () => {
          this.onStatus({ state: this.peerConnected ? 'connected' : 'waiting' });
          this.sendSignal({ type: 'hello', isHost: this.isHost });
        },
      );
      this.mqttClients.push(client);
    }

    this.sendSignal({ type: 'hello', isHost: this.isHost });
    this.onStatus({ state: 'waiting' });
  }

  async sendSignal(payload) {
    if (!this.secrets || this.closed) return;
    const packet = {
      ...payload,
      sender: this.peerId,
      ts: Date.now(),
      msgId: `${this.peerId}_${randomUint32().toString(36)}${randomUint32().toString(36)}`,
    };
    this.seenMsgIds.add(packet.msgId);

    // Canal WebRTC direct s'il est ouvert (déjà chiffré par DTLS, pair authentifié par la signalisation chiffrée)
    if (this.dc && this.dc.readyState === 'open') {
      try {
        this.dc.send(JSON.stringify(packet));
      } catch {
        // Ignore
      }
    }

    const sealed = await sealPacket(this.secrets, packet);
    try {
      this.bc?.postMessage(sealed);
    } catch {
      // Ignore
    }
    for (const c of this.mqttClients) c.publish(sealed);
  }

  async receiveSealed(sealed) {
    if (!this.secrets) return;
    const pkt = await openPacket(this.secrets, sealed);
    if (pkt) this.handleIncomingPacket(pkt);
  }

  // Le pair retenu doit avoir le rôle opposé. Un pair silencieux depuis 30 s peut être remplacé (rechargement de page).
  acceptSender(pkt) {
    if (pkt.sender === this.remotePeerId) {
      this.lastSeenFromPeer = Date.now();
      return true;
    }
    const isIntroduction = pkt.type === 'hello' || pkt.type === 'hello-ack';
    const roleOk = isIntroduction && pkt.isHost !== this.isHost;
    const slotFree = !this.remotePeerId || Date.now() - this.lastSeenFromPeer > 30000;
    if (roleOk && slotFree) {
      this.remotePeerId = pkt.sender;
      this.lastSeenFromPeer = Date.now();
      this.peerConnected = false;
      return true;
    }
    return false;
  }

  async handleIncomingPacket(raw) {
    const pkt = sanitizePacket(raw);
    if (!pkt || pkt.sender === this.peerId) return;
    if (this.seenMsgIds.has(pkt.msgId)) return;
    if (this.seenMsgIds.size > 2000) this.seenMsgIds.clear();
    this.seenMsgIds.add(pkt.msgId);
    if (!this.acceptSender(pkt)) return;

    switch (pkt.type) {
      case 'hello':
        this.sendSignal({ type: 'hello-ack', isHost: this.isHost });
      // fallthrough
      case 'hello-ack':
        if (!this.peerConnected) {
          this.peerConnected = true;
          this.onStatus({ state: 'connected' });
          this.onPeerJoined(pkt);
          if (this.isHost) this.initWebRtcOffer().catch(() => {});
        }
        break;

      case 'webrtc-offer':
        if (!this.isHost) this.handleWebRtcOffer(pkt.sdp).catch(() => {});
        break;

      case 'webrtc-answer':
        if (this.isHost && this.pc && this.pc.signalingState === 'have-local-offer') {
          try {
            await this.pc.setRemoteDescription(new RTCSessionDescription(pkt.sdp));
          } catch {
            // Ignore
          }
        }
        break;

      case 'webrtc-ice':
        if (this.pc) {
          try {
            await this.pc.addIceCandidate(new RTCIceCandidate(pkt.candidate));
          } catch {
            // Ignore
          }
        }
        break;

      // Seul l'hôte distribue les cartes : un invité qui enverrait game-start est ignoré.
      case 'game-start':
        if (!this.isHost) this.onGameStart(pkt);
        break;

      case 'game-move':
        this.onMove(pkt);
        break;

      case 'game-emote':
        this.onEmote(pkt);
        break;
    }
  }

  // Négociation WebRTC automatique en arrière-plan pour établir un canal direct
  async initWebRtcOffer() {
    if (typeof RTCPeerConnection === 'undefined') return;
    this.pc?.close();
    this.pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
    this.dc = this.pc.createDataChannel('quatre-vents');
    this.setupDataChannel(this.dc);

    this.pc.onicecandidate = (e) => {
      if (e.candidate) this.sendSignal({ type: 'webrtc-ice', candidate: e.candidate.toJSON() });
    };

    const offer = await this.pc.createOffer();
    await this.pc.setLocalDescription(offer);
    this.sendSignal({ type: 'webrtc-offer', sdp: { type: 'offer', sdp: this.pc.localDescription.sdp } });
  }

  async handleWebRtcOffer(remoteSdp) {
    if (typeof RTCPeerConnection === 'undefined') return;
    this.pc?.close();
    this.pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
    this.pc.ondatachannel = (e) => {
      this.dc = e.channel;
      this.setupDataChannel(this.dc);
    };
    this.pc.onicecandidate = (e) => {
      if (e.candidate) this.sendSignal({ type: 'webrtc-ice', candidate: e.candidate.toJSON() });
    };

    await this.pc.setRemoteDescription(new RTCSessionDescription(remoteSdp));
    const answer = await this.pc.createAnswer();
    await this.pc.setLocalDescription(answer);
    this.sendSignal({ type: 'webrtc-answer', sdp: { type: 'answer', sdp: this.pc.localDescription.sdp } });
  }

  setupDataChannel(channel) {
    channel.onopen = () => {
      this.peerConnected = true;
      this.onStatus({ state: 'connected-webrtc' });
    };
    channel.onmessage = (e) => {
      if (typeof e.data !== 'string' || e.data.length > MAX_PACKET_BYTES) return;
      try {
        this.handleIncomingPacket(JSON.parse(e.data));
      } catch {
        // Ignore
      }
    };
  }

  close() {
    this.closed = true;
    try {
      this.dc?.close();
      this.pc?.close();
      this.bc?.close();
    } catch {
      // Ignore
    }
    for (const c of this.mqttClients) c.close();
    this.mqttClients = [];
  }
}

// ============================================================================
// 5. BADGE VISUEL DU CODE (motif décoratif, ce n'est pas un QR code lisible)
// ============================================================================

export function renderShareCardSVG(codeString = 'VENTS') {
  const size = 11;
  const cells = [];
  let hash = 2166136261;
  for (let i = 0; i < codeString.length; i++) {
    hash ^= codeString.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  const rng = createSeededRng(hash >>> 0);

  const isFinder = (r, c) =>
    (r < 3 && c < 3) || (r < 3 && c >= size - 3) || (r >= size - 3 && c < 3);

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (isFinder(r, c)) {
        const cornerR = r < 3 ? r : r - (size - 3);
        const cornerC = c < 3 ? c : c - (size - 3);
        if (cornerR === 0 || cornerR === 2 || cornerC === 0 || cornerC === 2 || (cornerR === 1 && cornerC === 1)) {
          cells.push(`<rect x="${c * 8 + 6}" y="${r * 8 + 6}" width="7" height="7" rx="1.5" fill="#f2d46b"/>`);
        }
      } else if (rng() > 0.45) {
        cells.push(`<rect x="${c * 8 + 6}" y="${r * 8 + 6}" width="7" height="7" rx="1.5" fill="#93c5fd"/>`);
      }
    }
  }

  return `<svg viewBox="0 0 100 100" class="share-matrix-svg" aria-hidden="true">
    <rect width="100" height="100" rx="10" fill="#0b1124" stroke="#f2d46b" stroke-width="2"/>
    ${cells.join('')}
  </svg>`;
}
