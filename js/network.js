// Connexion directe entre deux navigateurs (WebRTC), sans relais ni serveur de jeu.
//
// La mise en relation se fait par deux liens que les joueurs s'envoient eux-mêmes (messagerie, mail…) :
// 1. l'hôte crée une invitation : le lien contient son offre WebRTC (compressée) ;
// 2. l'invité l'ouvre, le jeu produit un lien de réponse qu'il renvoie à l'hôte ;
// 3. l'hôte ouvre ce lien (ou le colle) : les deux navigateurs se connectent directement.
// Le contenu des liens est placé après « # » : il n'est jamais envoyé au serveur qui héberge le jeu.
//
// Seuls tiers : les serveurs STUN publics, qui renvoient à chaque navigateur son adresse IP publique
// (indispensable pour traverser les box). Les deux joueurs voient l'adresse IP de l'autre, comme dans
// tout échange pair-à-pair. Le canal est chiffré (DTLS) ; un code de vérification affiché des deux côtés
// permet de s'assurer que personne n'a modifié les liens en route.

import { randomHex, sha256Hex } from './duel.js';

const ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun.cloudflare.com:3478' },
];

const MAX_SIGNAL_CHARS = 8000;
const MAX_SIGNAL_BYTES = 20000;
const MAX_MESSAGE_CHARS = 16 * 1024;
const ICE_GATHERING_TIMEOUT_MS = 4000;
const DISCONNECT_GRACE_MS = 8000;

export const REPLY_CHANNEL = 'quatre-vents-reponses';

// ---------------------------------------------------------------------------
// Encodage des liens d'invitation et de réponse
// ---------------------------------------------------------------------------

function toBase64Url(bytes) {
  let s = '';
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(str) {
  const bin = atob(str.replace(/-/g, '+').replace(/_/g, '/'));
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

export async function encodeSignal(obj) {
  const stream = new Blob([JSON.stringify(obj)]).stream().pipeThrough(new CompressionStream('deflate-raw'));
  return toBase64Url(new Uint8Array(await new Response(stream).arrayBuffer()));
}

const isHex16 = (s) => typeof s === 'string' && /^[0-9a-f]{16}$/.test(s);

// Renvoie { k: 'o'|'a', inv, sid, resume, sdp } ou null si le lien est invalide (jamais d'exception).
export async function decodeSignal(str) {
  if (typeof str !== 'string' || !str || str.length > MAX_SIGNAL_CHARS || !/^[A-Za-z0-9_-]+$/.test(str)) return null;
  try {
    const reader = new Blob([fromBase64Url(str)]).stream().pipeThrough(new DecompressionStream('deflate-raw')).getReader();
    const chunks = [];
    let size = 0;
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.length;
      if (size > MAX_SIGNAL_BYTES) return null; // bombe de décompression
      chunks.push(value);
    }
    const obj = JSON.parse(new TextDecoder().decode(await new Blob(chunks).arrayBuffer()));
    if (!obj || obj.v !== 1 || (obj.k !== 'o' && obj.k !== 'a')) return null;
    if (!isHex16(obj.inv) || !isHex16(obj.sid) || typeof obj.sdp !== 'string' || obj.sdp.length > 12000) return null;
    if (!obj.sdp.startsWith('v=0')) return null;
    return { k: obj.k, inv: obj.inv, sid: obj.sid, resume: obj.resume === true, sdp: obj.sdp };
  } catch {
    return null;
  }
}

// Extrait le jeton d'un lien complet (…#join=… / …#reply=…) ou renvoie le texte tel quel.
export function extractSignalToken(text, key) {
  const raw = String(text || '').trim();
  const m = raw.match(new RegExp(`[#&?]${key}=([A-Za-z0-9_-]+)`));
  return m ? m[1] : raw;
}

export function buildSignalLink(key, token) {
  const base = typeof window !== 'undefined' ? `${window.location.origin}${window.location.pathname}` : 'https://example.invalid/';
  return `${base}#${key}=${token}`;
}

// ---------------------------------------------------------------------------
// Code de vérification (anti-interception des liens)
// ---------------------------------------------------------------------------

const VERIFY_SYMBOLS = [
  '🦊', '🌙', '⚓', '🔥', '🌲', '🐉', '⭐', '🍀', '🦉', '🌊', '⚡', '🍄', '🐚', '🗝️', '🛡️', '🏹',
  '🦋', '🌵', '🐺', '🪶', '🎐', '🌋', '🐢', '🪐', '🍁', '🐋', '🦅', '🧭', '🔔', '💎', '🌻', '🐝',
];

function sdpFingerprint(sdp) {
  const m = String(sdp).match(/a=fingerprint:(\S+) ([0-9A-Fa-f:]+)/);
  return m ? `${m[1].toLowerCase()} ${m[2].toUpperCase()}` : null;
}

// Même code des deux côtés si et seulement si chacun parle bien au navigateur de l'autre :
// un intermédiaire qui aurait remplacé un lien imposerait sa propre empreinte DTLS.
export async function verificationCode(sdpA, sdpB) {
  const fps = [sdpFingerprint(sdpA), sdpFingerprint(sdpB)];
  if (fps.some((f) => !f)) return null;
  const hex = await sha256Hex('verification', ...fps.sort());
  return [0, 2, 4, 6].map((i) => VERIFY_SYMBOLS[parseInt(hex.slice(i, i + 2), 16) % VERIFY_SYMBOLS.length]).join(' ');
}

// ---------------------------------------------------------------------------
// Connexion WebRTC
// ---------------------------------------------------------------------------

export function isDirectLinkSupported() {
  return typeof RTCPeerConnection !== 'undefined' && typeof CompressionStream !== 'undefined' && Boolean(globalThis.crypto?.subtle);
}

function waitForIceGathering(pc) {
  if (pc.iceGatheringState === 'complete') return Promise.resolve();
  return new Promise((resolve) => {
    const timer = setTimeout(done, ICE_GATHERING_TIMEOUT_MS);
    function done() {
      clearTimeout(timer);
      pc.removeEventListener('icegatheringstatechange', check);
      resolve();
    }
    function check() {
      if (pc.iceGatheringState === 'complete') done();
    }
    pc.addEventListener('icegatheringstatechange', check);
  });
}

/**
 * Une connexion directe. Événements : onOpen(), onMessage(obj), onClose() (coupure définitive ou
 * prolongée au-delà de quelques secondes).
 */
export class DirectLink {
  constructor({ onOpen = () => {}, onMessage = () => {}, onClose = () => {} } = {}) {
    this.onOpen = onOpen;
    this.onMessage = onMessage;
    this.onClose = onClose;
    this.pc = null;
    this.dc = null;
    this.inviteId = null;
    this.sessionId = null;
    this.localSdp = null;
    this.remoteSdp = null;
    this.answered = false;
    this.closed = false;
    this.graceTimer = null;
  }

  get isOpen() {
    return this.dc?.readyState === 'open';
  }

  newPeer() {
    this.pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
    this.pc.onconnectionstatechange = () => {
      const s = this.pc.connectionState;
      if (s === 'connected') clearTimeout(this.graceTimer);
      if (s === 'failed' || s === 'closed') this.fail();
      if (s === 'disconnected') {
        clearTimeout(this.graceTimer);
        this.graceTimer = setTimeout(() => {
          if (this.pc?.connectionState !== 'connected') this.fail();
        }, DISCONNECT_GRACE_MS);
      }
    };
  }

  setupChannel(dc) {
    this.dc = dc;
    dc.onopen = () => this.onOpen();
    dc.onclose = () => this.fail();
    dc.onmessage = (e) => {
      if (typeof e.data !== 'string' || e.data.length > MAX_MESSAGE_CHARS) return;
      try {
        this.onMessage(JSON.parse(e.data));
      } catch {
        // Ignore
      }
    };
  }

  fail() {
    if (this.closed) return;
    this.closed = true;
    clearTimeout(this.graceTimer);
    try {
      this.pc?.close();
    } catch {
      // Ignore
    }
    this.onClose();
  }

  // Hôte : prépare l'offre et renvoie le jeton à mettre dans le lien d'invitation.
  async createInvite({ sessionId, resume = false }) {
    this.inviteId = randomHex(8);
    this.sessionId = sessionId;
    this.newPeer();
    this.setupChannel(this.pc.createDataChannel('quatre-vents', { ordered: true }));
    await this.pc.setLocalDescription(await this.pc.createOffer());
    await waitForIceGathering(this.pc);
    this.localSdp = this.pc.localDescription.sdp;
    return encodeSignal({ v: 1, k: 'o', inv: this.inviteId, sid: sessionId, resume, sdp: this.localSdp });
  }

  // Hôte : applique la réponse de l'invité (une seule réponse acceptée par invitation).
  async acceptReply(signal) {
    if (!signal || signal.k !== 'a' || signal.inv !== this.inviteId) throw new Error('Cette réponse ne correspond pas à votre invitation en cours.');
    if (this.answered) throw new Error('Cette invitation a déjà reçu une réponse.');
    this.answered = true;
    this.remoteSdp = signal.sdp;
    await this.pc.setRemoteDescription({ type: 'answer', sdp: signal.sdp });
  }

  // Invité : répond à une invitation et renvoie le jeton du lien de réponse.
  async acceptInvite(signal) {
    if (!signal || signal.k !== 'o') throw new Error('Invitation invalide.');
    this.inviteId = signal.inv;
    this.sessionId = signal.sid;
    this.remoteSdp = signal.sdp;
    this.newPeer();
    this.pc.ondatachannel = (e) => this.setupChannel(e.channel);
    await this.pc.setRemoteDescription({ type: 'offer', sdp: signal.sdp });
    await this.pc.setLocalDescription(await this.pc.createAnswer());
    await waitForIceGathering(this.pc);
    this.localSdp = this.pc.localDescription.sdp;
    return encodeSignal({ v: 1, k: 'a', inv: signal.inv, sid: signal.sid, sdp: this.localSdp });
  }

  verification() {
    return verificationCode(this.localSdp, this.remoteSdp);
  }

  send(obj) {
    if (!this.isOpen) return false;
    try {
      this.dc.send(JSON.stringify(obj));
      return true;
    } catch {
      return false;
    }
  }

  close() {
    this.closed = true;
    clearTimeout(this.graceTimer);
    try {
      this.dc?.close();
      this.pc?.close();
    } catch {
      // Ignore
    }
  }
}
