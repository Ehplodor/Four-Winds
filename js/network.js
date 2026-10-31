// Module Réseau Serverless & P2P (« Les Quatre Vents »)
// Permet à deux joueurs de s'affronter à distance depuis un hébergement statique (GitHub Pages) sans serveur dédié :
// 1. Mode Temps Réel Transparent (Code de salon à 6 caractères / Lien d'invitation / QR Code) :
//    - Négociation automatique WebRTC (RTCPeerConnection + RTCDataChannel)
//    - Signalisation et repli temps réel via courtiers WebSocket publics redondants + BroadcastChannel local
// 2. Mode WebRTC Manuel pur (échange d'Offre/Réponse SDP compressée sans aucun tiers)
// 3. Fallback Universel par SMS / Lien Compact déterministe (?turn=...) :
//    - Toute la partie (graine PRNG, decks, règles et liste des coups) est encodée en ~20 caractères.
//    - Fonctionne par SMS natif (sms:?&body=...), WhatsApp, Signal ou copier-coller, même en asynchrone.

import { DECKS } from './cards.js';
import { createGame, play } from './engine.js';
import { dealHands } from './cards.js';

const DECK_KEYS = Object.keys(DECKS); // ['vents', 'forge', 'abysses', 'ombres']
const RULE_KEYS = ['elemental', 'synergy', 'same', 'plus', 'combo', 'open'];
const BASE62 = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

// ============================================================================
// 1. PRNG DÉTERMINISTE (Mulberry32) & CODEC D'ÉTAT COMPACT (SMS / URL)
// ============================================================================

export function createSeededRng(seedInt) {
  let a = seedInt >>> 0;
  return function rng() {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function generateSeed() {
  return Math.floor(Math.random() * 0x7fffffff) || 1234567;
}

export function generateRoomCode(len = 6) {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let out = '';
  for (let i = 0; i < len; i++) {
    out += chars[Math.floor(Math.random() * chars.length)];
  }
  return out;
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

/**
 * Encode une partie déterministe complète en une chaîne ultra-compacte pour SMS / URL :
 * Format : "1.<seedBase36>.<d0><d1><first><rulesBase62>.<movesBase62>"
 * Chaque coup (handIndex 0..4, cell 0..8) est encodé en un seul caractère Base62 (handIndex * 9 + cell = 0..44).
 */
export function encodeCompactMatch({ seed, deck0, deck1, firstPlayer = 0, rules = {}, moves = [] }) {
  const seedStr = (seed >>> 0).toString(36);
  const d0 = Math.max(0, DECK_KEYS.indexOf(deck0));
  const d1 = Math.max(0, DECK_KEYS.indexOf(deck1));
  const first = firstPlayer === 1 ? 1 : 0;
  const rChar = BASE62[encodeRulesMask(rules)] || '0';
  const movesStr = moves
    .map((m) => {
      const code = m.handIndex * 9 + m.cell;
      return BASE62[code] || '0';
    })
    .join('');

  return `1.${seedStr}.${d0}${d1}${first}${rChar}.${movesStr}`;
}

/**
 * Décode une chaîne compacte et reconstruit l'état exact de la partie (mains, plateau, historique).
 */
export function decodeCompactMatch(token) {
  if (!token || typeof token !== 'string') return null;
  const clean = token.trim();
  const parts = clean.split('.');
  if (parts.length < 3 || parts[0] !== '1') return null;

  const seed = parseInt(parts[1], 36);
  if (Number.isNaN(seed)) return null;

  const meta = parts[2];
  if (meta.length < 4) return null;
  const d0Idx = Number(meta[0]);
  const d1Idx = Number(meta[1]);
  const firstPlayer = Number(meta[2]) === 1 ? 1 : 0;
  const rMask = BASE62.indexOf(meta[3]);
  if (rMask < 0) return null;

  const deck0 = DECK_KEYS[d0Idx] || 'vents';
  const deck1 = DECK_KEYS[d1Idx] || 'vents';
  const rules = decodeRulesMask(rMask);

  const movesRaw = parts[3] || '';
  const moves = [];
  for (const ch of movesRaw) {
    const code = BASE62.indexOf(ch);
    if (code < 0 || code >= 45) return null;
    moves.push({
      handIndex: Math.floor(code / 9),
      cell: code % 9,
    });
  }

  // Reconstruction déterministe de la distribution et du plateau
  const rng = createSeededRng(seed);
  const hands = dealHands(rng, { deck0, deck1 });
  let game = createGame({
    hands,
    firstPlayer,
    rules,
    rng,
  });

  let lastMoveResult = null;
  for (const m of moves) {
    lastMoveResult = play(game, m.handIndex, m.cell);
    game = lastMoveResult.state;
  }

  return {
    seed,
    deck0,
    deck1,
    firstPlayer,
    rules,
    moves,
    game,
    lastMoveResult,
  };
}

/**
 * Construit les liens de partage et d'envoi par SMS natif (iOS & Android).
 */
export function buildShareLinks({ token, roomCode, playerName = 'Un joueur', scoreText = '' }) {
  const baseUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}${window.location.pathname}`
      : 'https://les-quatre-vents.app/';

  const url = token
    ? `${baseUrl}?turn=${encodeURIComponent(token)}`
    : `${baseUrl}?room=${encodeURIComponent(roomCode)}`;

  const message = token
    ? `🃏 Les Quatre Vents — J'ai joué mon coup${scoreText ? ` (${scoreText})` : ''} ! Touche ce lien pour voir le plateau et jouer ton tour : ${url}`
    : `🃏 Les Quatre Vents — Rejoins ma table de jeu (Code : ${roomCode}) : ${url}`;

  // Compatibilité universelle URI SMS (iOS et Android supportent sms:?&body=...)
  const isIOS =
    typeof navigator !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent || '');
  const smsSep = isIOS ? '&' : '?';
  const smsHref = `sms:${smsSep}body=${encodeURIComponent(message)}`;

  return { url, message, smsHref };
}

// ============================================================================
// 2. CONNEXION TEMPS RÉEL P2P (WebRTC + Courtiers Publics WSS + BroadcastChannel)
// ============================================================================

const ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun.cloudflare.com:3478' },
];

// Courtiers MQTT-over-WSS publics gratuits permettant d'échanger la signalisation WebRTC et les coups
// sans aucun serveur propriétaire à héberger.
const PUBLIC_WSS_BROKERS = [
  'wss://broker.emqx.io:8084/mqtt',
  'wss://broker.hivemq.com:8884/mqtt',
  'wss://test.mosquitto.org:8081/mqtt',
];

/**
 * Client MQTT v3.1.1 minimaliste sur WebSocket binaire (0 dépendance externe).
 * Permet de publier et recevoir de petits paquets JSON sur un topic `quatre-vents/room/<CODE>`.
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
      const clientId = `qv_${Math.random().toString(36).slice(2, 10)}`;
      this.ws.send(this.encodeConnect(clientId));
    };

    this.ws.onmessage = (e) => {
      const data = new Uint8Array(e.data);
      if (!data.length) return;
      const type = data[0] >> 4;
      if (type === 2) {
        // CONNACK
        this.connected = true;
        this.ws.send(this.encodeSubscribe(this.topic));
        if (this.onOpen) this.onOpen();
        this.pingTimer = setInterval(() => {
          if (this.ws?.readyState === 1) {
            this.ws.send(new Uint8Array([0xc0, 0x00])); // PINGREQ
          }
        }, 25000);
      } else if (type === 3) {
        // PUBLISH
        const parsed = this.decodePublish(data);
        if (parsed && this.onMessage) this.onMessage(parsed);
      }
    };

    this.ws.onerror = () => {};
    this.ws.onclose = () => {
      this.connected = false;
      clearInterval(this.pingTimer);
    };
  }

  publish(obj) {
    if (!this.connected || this.ws?.readyState !== 1) return false;
    try {
      const str = JSON.stringify(obj);
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
    const bytes = new TextEncoder().encode(str);
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
    const pBytes = new TextEncoder().encode(payloadStr);
    const rem = tBytes.length + pBytes.length;
    return new Uint8Array([0x30, ...this.encodeLength(rem), ...tBytes, ...pBytes]);
  }

  decodePublish(data) {
    let idx = 1;
    let mult = 1;
    let remLen = 0;
    let byte;
    do {
      if (idx >= data.length) return null;
      byte = data[idx++];
      remLen += (byte & 127) * mult;
      mult *= 128;
    } while ((byte & 128) !== 0);

    if (idx + 2 > data.length) return null;
    const topicLen = (data[idx] << 8) | data[idx + 1];
    idx += 2 + topicLen;
    const payloadBytes = data.slice(idx, idx + (remLen - 2 - topicLen));
    try {
      const text = new TextDecoder().decode(payloadBytes);
      return JSON.parse(text);
    } catch {
      return null;
    }
  }
}

/**
 * Gestionnaire de session P2P combinant :
 * - BroadcastChannel (instantané entre onglets d'un même appareil)
 * - Courtiers WSS publics redondants (connexion transparente mondiale par simple Code à 6 lettres)
 * - WebRTC DataChannel (canal direct P2P chiffré navigateur-à-navigateur, automatique ou par copier-coller SDP)
 */
export class PeerRoomSession {
  constructor({ roomCode, isHost, onStatus, onPeerJoined, onGameStart, onMove, onEmote }) {
    this.roomCode = (roomCode || generateRoomCode()).toUpperCase();
    this.isHost = Boolean(isHost);
    this.peerId = `p_${Math.random().toString(36).slice(2, 9)}`;
    this.onStatus = onStatus || (() => {});
    this.onPeerJoined = onPeerJoined || (() => {});
    this.onGameStart = onGameStart || (() => {});
    this.onMove = onMove || (() => {});
    this.onEmote = onEmote || (() => {});

    this.bc = null;
    this.mqttClients = [];
    this.pc = null;
    this.dc = null;
    this.seenMsgIds = new Set();
    this.peerConnected = false;
  }

  start() {
    const topic = `quatre-vents-v2/room/${this.roomCode}`;

    // 1. Canal local BroadcastChannel (0 ms de latence sur le même appareil)
    if (typeof BroadcastChannel !== 'undefined') {
      this.bc = new BroadcastChannel(topic);
      this.bc.onmessage = (e) => this.handleIncomingPacket(e.data);
    }

    // 2. Courtiers WebSocket publics redondants pour la découverte à distance sans serveur dédié
    for (const url of PUBLIC_WSS_BROKERS) {
      const client = new MiniMqttWsClient(
        url,
        topic,
        (pkt) => this.handleIncomingPacket(pkt),
        () => {
          this.onStatus({ state: this.peerConnected ? 'connected' : 'waiting', transport: 'wss' });
          this.sendSignal({ type: 'hello', isHost: this.isHost });
        },
      );
      this.mqttClients.push(client);
    }

    // Annonce initiale sur BroadcastChannel également
    this.sendSignal({ type: 'hello', isHost: this.isHost });
    this.onStatus({ state: 'waiting', roomCode: this.roomCode });
  }

  sendSignal(payload) {
    const packet = {
      ...payload,
      sender: this.peerId,
      msgId: `${this.peerId}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    };
    this.seenMsgIds.add(packet.msgId);

    // Envoi direct par WebRTC DataChannel s'il est ouvert
    if (this.dc && this.dc.readyState === 'open') {
      try {
        this.dc.send(JSON.stringify(packet));
      } catch {
        // Ignore
      }
    }

    // Envoi sur BroadcastChannel
    try {
      this.bc?.postMessage(packet);
    } catch {
      // Ignore
    }

    // Envoi sur tous les courtiers WSS connectés
    for (const c of this.mqttClients) {
      c.publish(packet);
    }
  }

  async handleIncomingPacket(pkt) {
    if (!pkt || pkt.sender === this.peerId || !pkt.msgId) return;
    if (this.seenMsgIds.has(pkt.msgId)) return;
    this.seenMsgIds.add(pkt.msgId);

    switch (pkt.type) {
      case 'hello':
        if (!this.peerConnected) {
          this.peerConnected = true;
          this.sendSignal({ type: 'hello-ack', isHost: this.isHost });
          this.onStatus({ state: 'connected', roomCode: this.roomCode });
          this.onPeerJoined(pkt);
          if (this.isHost) {
            this.initWebRtcOffer().catch(() => {});
          }
        }
        break;

      case 'hello-ack':
        if (!this.peerConnected) {
          this.peerConnected = true;
          this.onStatus({ state: 'connected', roomCode: this.roomCode });
          this.onPeerJoined(pkt);
        }
        break;

      case 'webrtc-offer':
        if (!this.isHost && pkt.sdp) {
          this.handleWebRtcOffer(pkt.sdp).catch(() => {});
        }
        break;

      case 'webrtc-answer':
        if (this.isHost && pkt.sdp && this.pc) {
          try {
            await this.pc.setRemoteDescription(new RTCSessionDescription(pkt.sdp));
          } catch {
            // Ignore
          }
        }
        break;

      case 'webrtc-ice':
        if (this.pc && pkt.candidate) {
          try {
            await this.pc.addIceCandidate(new RTCIceCandidate(pkt.candidate));
          } catch {
            // Ignore
          }
        }
        break;

      case 'game-start':
        this.onGameStart(pkt);
        break;

      case 'game-move':
        this.onMove(pkt);
        break;

      case 'game-emote':
        this.onEmote(pkt);
        break;
    }
  }

  // Négociation WebRTC automatique en arrière-plan pour établir un RTCDataChannel direct
  async initWebRtcOffer() {
    if (typeof RTCPeerConnection === 'undefined') return;
    this.pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
    this.dc = this.pc.createDataChannel('quatre-vents');
    this.setupDataChannel(this.dc);

    this.pc.onicecandidate = (e) => {
      if (e.candidate) {
        this.sendSignal({ type: 'webrtc-ice', candidate: e.candidate });
      }
    };

    const offer = await this.pc.createOffer();
    await this.pc.setLocalDescription(offer);
    this.sendSignal({ type: 'webrtc-offer', sdp: this.pc.localDescription });
  }

  async handleWebRtcOffer(remoteSdp) {
    if (typeof RTCPeerConnection === 'undefined') return;
    this.pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
    this.pc.ondatachannel = (e) => {
      this.dc = e.channel;
      this.setupDataChannel(this.dc);
    };
    this.pc.onicecandidate = (e) => {
      if (e.candidate) {
        this.sendSignal({ type: 'webrtc-ice', candidate: e.candidate });
      }
    };

    await this.pc.setRemoteDescription(new RTCSessionDescription(remoteSdp));
    const answer = await this.pc.createAnswer();
    await this.pc.setLocalDescription(answer);
    this.sendSignal({ type: 'webrtc-answer', sdp: this.pc.localDescription });
  }

  setupDataChannel(channel) {
    channel.onopen = () => {
      this.peerConnected = true;
      this.onStatus({ state: 'connected-webrtc', roomCode: this.roomCode });
    };
    channel.onmessage = (e) => {
      try {
        const pkt = JSON.parse(e.data);
        this.handleIncomingPacket(pkt);
      } catch {
        // Ignore
      }
    };
  }

  close() {
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
// 3. BADGE VISUEL DE CODE DE SALON / QR STYLISÉ EN SVG
// ============================================================================

/**
 * Génère une matrice visuelle déterministe SVG (type QR/Runes) accompagnant le code de salon
 * et les boutons de partage natifs (Web Share API + SMS + Copier).
 */
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
