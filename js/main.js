import {
  previewMove,
  score,
  winner,
  getEffectiveValues,
  getCardBonuses,
} from './engine.js';
import { chooseMove, opponentCandidatesFor } from './ai.js';
import { createMatch, playMatchMove, MAX_ROUNDS } from './match.js';
import { randomInt, randomUint32 } from './rng.js';
import {
  CARDS,
  DECKS,
  DECK_LIST,
  ELEMENTS,
  displayValue,
  renderCardArtSVG,
} from './cards.js';
import { sound } from './audio.js';
import { DuelProtocol } from './duel.js';
import {
  DirectLink,
  decodeSignal,
  extractSignalToken,
  buildSignalLink,
  isDirectLinkSupported,
  REPLY_CHANNEL,
} from './network.js';

const AI_DELAY = 720;
const SUDDEN_DEATH_DELAY = 1600;
const $ = (id) => document.getElementById(id);

// Toute donnée qui ne vient pas du code du jeu (URL, saisie, réseau, stockage) doit passer par ici
// avant d'être insérée dans du HTML.
function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch]);
}

const ui = {
  menu: $('menu'),
  game: $('game'),
  codex: $('codex'),
  board: $('board'),
  hands: [$('hand-0'), $('hand-1')],
  scores: [$('score-0'), $('score-1')],
  names: [$('name-0'), $('name-1')],
  deckTags: [$('deck-tag-0'), $('deck-tag-1')],
  sidePanels: [$('side-panel-0'), $('side-panel-1')],
  message: $('message'),
  comboBanner: $('combo-banner'),
  activeRulesBar: $('active-rules-bar'),
  deckSelector: $('deck-selector'),
  selectDeck1: $('select-deck-1'),
  lobbyStats: $('lobby-stats'),
  remoteSetupBox: $('remote-setup-box'),
  netStatusBar: $('net-status-bar'),
  netIndicator: $('net-indicator'),
  codexTabs: $('codex-tabs'),
  codexGrid: $('codex-grid'),
  codexDesc: $('codex-deck-desc'),
  codexFilterLevel: $('codex-filter-level'),
  navBtnMenu: $('nav-btn-menu'),
  navBtnGame: $('nav-btn-game'),
  navBtnCodex: $('nav-btn-codex'),
  btnInstall: $('btn-install'),
  btnSfx: $('btn-sfx'),
  btnMusic: $('btn-music'),
  overlay: $('overlay'),
  dialog: $('dialog'),
};

// Configuration et état de la session
let config = {
  mode: 'ai', // 'ai' | 'local' | 'online'
  difficulty: 'tactician',
  deck0: 'vents',
  deck1: 'random',
  rules: {
    elemental: true,
    synergy: true,
    same: true,
    sameWall: false,
    plus: true,
    combo: true,
    open: false,
    sudden: false,
  },
};

let stats = {
  played: 0,
  wins: 0,
  draws: 0,
  streak: 0,
};

try {
  const savedStats = JSON.parse(localStorage.getItem('qv_stats') || 'null');
  if (savedStats && typeof savedStats === 'object') {
    for (const k of Object.keys(stats)) {
      const v = Number(savedStats[k]);
      if (Number.isInteger(v) && v >= 0) stats[k] = v;
    }
  }
} catch {
  // Ignore
}

// `match` est l'état complet (graine, coups, manche en cours) ; `game` est la manche affichée.
// Ils ne diffèrent que pendant la courte transition vers une manche de Mort Subite.
let match = null;
let game = null;
let matchSeed = 0;
let matchFirstPlayer = 0;
let matchDecks = ['vents', 'forge'];
let matchMoves = [];
let localPlayerIndex = 0; // en duel à distance : 0 pour l'hôte, 1 pour l'invité

let selected = null;
let hoveredCell = null;
let busy = false;
let flipped = [];
let placed = null;
let activeCodexDeck = 'all';
let deferredInstallPrompt = null;
let currentScreen = 'menu'; // 'menu' | 'game' | 'codex'
let previousScreen = 'menu';

function setMatch(next) {
  match = next;
  game = next.game;
  matchSeed = next.seed;
  matchFirstPlayer = next.firstPlayer;
  matchDecks = next.decks.slice();
  matchMoves = next.moves.slice();
}


// Navigation centralisée entre les écrans (Salon, Table de jeu, Codex) avec gestion du scroll et de l'historique
function navigateTo(screen, { pushHistory = true } = {}) {
  document.querySelectorAll('.drag-ghost').forEach((g) => g.remove());
  hideDialog();

  if (screen !== currentScreen) {
    previousScreen = currentScreen;
    currentScreen = screen;
  }

  ui.menu.classList.toggle('hidden', screen !== 'menu');
  ui.game.classList.toggle('hidden', screen !== 'game');
  ui.codex.classList.toggle('hidden', screen !== 'codex');

  ui.navBtnMenu?.classList.toggle('active-nav', screen === 'menu');
  ui.navBtnGame?.classList.toggle('active-nav', screen === 'game');
  ui.navBtnCodex?.classList.toggle('active-nav', screen === 'codex');
  ui.navBtnGame?.classList.toggle('hidden', !game);

  if (typeof window !== 'undefined') {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    if (pushHistory && typeof history !== 'undefined') {
      try {
        history.pushState({ screen }, '');
      } catch {
        // Ignore
      }
    }
  }
}

function saveStats() {
  try {
    localStorage.setItem('qv_stats', JSON.stringify(stats));
  } catch {
    // Ignore
  }
}

function playerName(p) {
  if (config.mode === 'ai') {
    if (p === 0) return 'Vous';
    const labels = { novice: 'IA Apprenti', tactician: 'IA Tacticien', master: 'IA Grand Maître' };
    return labels[config.difficulty] || 'IA';
  }
  if (config.mode === 'online') {
    return p === localPlayerIndex ? `Vous (J${p + 1})` : `Adversaire (J${p + 1})`;
  }
  return p === 0 ? 'Joueur 1' : 'Joueur 2';
}

function isHuman(p) {
  if (config.mode === 'ai') return p === 0;
  if (config.mode === 'online') return p === localPlayerIndex && duelPhase() === 'playing';
  return true; // 'local'
}

function isHandVisible(p) {
  // En duel à distance, la main adverse n'est connue qu'une fois révélée (cartes `hidden` sinon).
  if (config.mode === 'online') return true;
  if (game?.rules.open) return true;
  if (config.mode === 'ai') return p === 0;
  return game ? game.turn === p : p === 0;
}

// Construit l'élément DOM d'une carte avec illustration SVG, élément, étoiles et tous les bonus/malus actifs
function cardEl(card, owner, { hidden = false, cell = null, board = null, boardElements = null, rules = null } = {}) {
  const el = document.createElement('div');
  const ownerClass = owner === 0 || owner === 1 ? `owner-${owner}` : 'owner-neutral';
  el.className = `card ${ownerClass} level-${card.level || 1}`;
  if (hidden) {
    el.classList.add('back');
    return el;
  }

  const elem = ELEMENTS[card.element] || ELEMENTS.vent;
  el.style.setProperty('--hue', card.hue ?? 200);
  el.style.setProperty('--elem-color', elem.color);

  const bonusContext =
    cell !== null && rules
      ? { cell, owner, board, boardElements, rules }
      : null;

  const bonuses = bonusContext
    ? getCardBonuses(card, bonusContext)
    : { totalMod: 0, sideMods: [0, 0, 0, 0], reasons: [] };

  const effectiveVals = bonusContext
    ? getEffectiveValues(card, bonusContext)
    : card.values;

  const mod = bonuses.totalMod;
  const [t, r, b, l] = effectiveVals.map(displayValue);
  const stars = '★'.repeat(card.level || 1);

  const valClass = (idx, disp) => {
    const netSideMod = mod + (bonuses.sideMods?.[idx] || 0);
    if (netSideMod > 0) return 'val-boosted';
    if (netSideMod < 0) return 'val-penalized';
    return disp === 'A' ? 'val-a' : '';
  };

  const reasonsTitle = bonuses.reasons.length ? bonuses.reasons.join(' • ') : '';
  const modHtml =
    mod > 0
      ? `<div class="mod-badge mod-up" title="${reasonsTitle}">+${mod}</div>`
      : mod < 0
      ? `<div class="mod-badge mod-down" title="${reasonsTitle}">${mod}</div>`
      : '';

  el.innerHTML = `
    <div class="art">${renderCardArtSVG(card)}</div>
    <div class="vals">
      <span class="t ${valClass(0, t)}">${t}</span>
      <span class="l ${valClass(3, l)}">${l}</span>
      <span class="r ${valClass(1, r)}">${r}</span>
      <span class="b ${valClass(2, b)}">${b}</span>
    </div>
    <div class="elem-badge" title="Élément : ${elem.name}">${elem.icon}</div>
    ${modHtml}
    <div class="stars" aria-hidden="true">${stars}</div>
    <div class="name-bar"><div class="name">${card.name}</div></div>
  `;

  const bonusSuffix = reasonsTitle ? ` [${reasonsTitle}]` : '';
  el.title = `${card.name} — Niv. ${card.level} (${elem.name})${bonusSuffix} • Cliquer / toucher sur le plateau ou clic droit pour inspecter`;
  el.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    sound.playUiClick();
    showCardInspector(card, bonusContext);
  });

  // Sur le plateau, un simple clic/tap sur une carte déjà posée ouvre l'inspecteur sans bloquer le scroll !
  if (cell !== null) {
    el.style.cursor = 'pointer';
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      sound.playUiClick();
      showCardInspector(card, bonusContext);
    });
  }

  return el;
}

// Gestionnaire unifié Tactile + Souris (Pointer Events) pour les cartes jouables en main :
// - N'intercepte JAMAIS le scroll vertical de la page au simple toucher (pas de setPointerCapture dans pointerdown).
// - Un tap/clic court sélectionne ou désélectionne la carte.
// - Glisser une carte (à la souris, ou au doigt lorsqu'elle est sélectionnée) crée une carte fantôme et prévisualise les captures.
function attachTactilePlayableEvents(el, handIndex, card, owner) {
  let dragging = false;
  let justDragged = false;
  let ghostEl = null;
  let startX = 0;
  let startY = 0;
  let activePointerId = null;

  const cleanupGhost = () => {
    if (ghostEl) {
      ghostEl.remove();
      ghostEl = null;
    }
    el.classList.remove('dragging-source');
    ui.board.querySelectorAll('.cell.drag-over').forEach((c) => c.classList.remove('drag-over'));
  };

  const moveGhost = (clientX, clientY, isTouch) => {
    if (!ghostEl) return;
    const offsetY = isTouch ? -38 : -10;
    ghostEl.style.transform = `translate3d(${clientX}px, ${clientY + offsetY}px, 0) translate(-50%, -50%) scale(1.08)`;
  };

  const findEmptyCellAt = (clientX, clientY) => {
    const target = document.elementFromPoint(clientX, clientY)?.closest('.cell');
    if (!target) return null;
    const cellIdx = Number(target.dataset.cell);
    if (Number.isNaN(cellIdx) || game?.board[cellIdx]) return null;
    return { cellEl: target, cellIdx };
  };

  el.addEventListener('click', () => {
    if (justDragged) {
      justDragged = false;
      return;
    }
    if (busy || !game || game.over) return;
    select(handIndex);
  });

  el.addEventListener('pointerdown', (e) => {
    if (e.button && e.button !== 0) return;
    if (busy || !game || game.over) return;
    // Sur tactile, on n'active le glisser-déposer que si la carte est déjà sélectionnée,
    // afin de laisser le défilement vertical (scroll) de la page 100% libre le reste du temps.
    if (e.pointerType === 'touch' && selected !== handIndex) return;
    activePointerId = e.pointerId;
    startX = e.clientX;
    startY = e.clientY;
    dragging = false;
  });

  el.addEventListener('pointermove', (e) => {
    if (activePointerId !== e.pointerId) return;
    const dist = Math.hypot(e.clientX - startX, e.clientY - startY);

    if (!dragging && dist >= 10) {
      dragging = true;
      justDragged = true;
      selected = handIndex;
      try {
        el.setPointerCapture(e.pointerId);
      } catch {
        // Ignore
      }
      sound.playSelectCard();
      navigator.vibrate?.(10);

      ui.hands[owner].querySelectorAll('.card').forEach((c, idx) => {
        c.classList.toggle('selected', idx === handIndex);
      });
      ui.board.querySelectorAll('.cell').forEach((c, idx) => {
        if (!game.board[idx]) c.classList.add('target');
      });

      el.classList.add('dragging-source');
      ghostEl = cardEl(card, owner);
      ghostEl.classList.add('drag-ghost');
      document.body.appendChild(ghostEl);
    }

    if (dragging) {
      e.preventDefault();
      moveGhost(e.clientX, e.clientY, e.pointerType === 'touch');

      ui.board.querySelectorAll('.cell.drag-over').forEach((c) => c.classList.remove('drag-over'));
      const found = findEmptyCellAt(e.clientX, e.clientY);
      if (found) {
        found.cellEl.classList.add('drag-over');
        if (hoveredCell !== found.cellIdx) {
          hoveredCell = found.cellIdx;
          updatePreviewHighlights();
        }
      } else if (hoveredCell !== null) {
        hoveredCell = null;
        updatePreviewHighlights();
      }
    }
  });

  const finishPointer = (e, cancelled = false) => {
    if (activePointerId !== e.pointerId) return;
    activePointerId = null;
    if (dragging) {
      try {
        el.releasePointerCapture(e.pointerId);
      } catch {
        // Ignore
      }
      const found = !cancelled ? findEmptyCellAt(e.clientX, e.clientY) : null;
      cleanupGhost();
      dragging = false;
      setTimeout(() => {
        justDragged = false;
      }, 80);
      if (found) {
        navigator.vibrate?.(14);
        selected = handIndex;
        place(found.cellIdx);
      } else {
        hoveredCell = null;
        render();
      }
    }
  };

  el.addEventListener('pointerup', (e) => finishPointer(e, false));
  el.addEventListener('pointercancel', (e) => finishPointer(e, true));
}

// =========================================================================
// DUEL À DISTANCE : connexion directe par liens partagés + mains cachées vérifiables
// =========================================================================
// - js/network.js : connexion WebRTC directe, mise en relation par deux liens (#join= puis #reply=) ;
// - js/duel.js : protocole d'engagement (chacun ne connaît que sa main, tout est vérifié en fin de manche),
//   messages numérotés et journal pour reprendre après une coupure ou un rechargement de page.
// Une coupure met la partie en pause ; seul un abandon explicite compte comme une défaite.

// Un enregistrement par rôle : deux onglets du même navigateur peuvent jouer l'hôte et l'invité (tests).
const DUEL_STORAGE_PREFIX = 'qv_duel_';
const DUEL_ROLES = ['host', 'guest'];
const EMOTES = ['👏 Bien joué !', '⚡ Quel combo !', '🔥 Belle prise !'];
const EMOTE_MIN_INTERVAL = 1500;
const REPLY_ACK_TIMEOUT = 1500;

const net = {
  duel: null, // DuelProtocol en cours
  link: null, // DirectLink en cours (invitation, réponse ou connexion établie)
  state: 'idle', // idle | inviting | connecting | replying | connected | lost
  inviteUrl: null, // hôte : lien d'invitation à envoyer
  replyUrl: null, // invité : lien de réponse à renvoyer
  relayUrl: null, // lien de réponse reçu dans un onglet qui n'a pas créé l'invitation
  pendingInvite: null, // invité : invitation reçue, pas encore acceptée
  interrupted: null, // duel inachevé retrouvé dans le stockage local
  verification: null, // code affiché des deux côtés une fois connectés
  error: null,
  lastEmoteAt: 0,
  ui: Promise.resolve(), // file de présentation des événements du duel
  channel: typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel(REPLY_CHANNEL) : null,
};

function duelPhase() {
  return net.duel?.m?.phase || null;
}

function duelActive() {
  const p = duelPhase();
  return p === 'setup' || p === 'playing' || p === 'reveal';
}

function onlineAvailable() {
  return isDirectLinkSupported() && (typeof window === 'undefined' || window.isSecureContext !== false);
}

function saveDuel() {
  if (!net.duel) return;
  try {
    localStorage.setItem(DUEL_STORAGE_PREFIX + net.duel.role, JSON.stringify(net.duel.snapshot()));
  } catch {
    // Ignore
  }
}

function readSavedDuel(role) {
  try {
    const s = JSON.parse(localStorage.getItem(DUEL_STORAGE_PREFIX + role) || 'null');
    const ok = s && s.v === 1 && s.role === role && Array.isArray(s.journal) && /^[0-9a-f]{16}$/.test(s.sessionId);
    return ok ? s : null;
  } catch {
    return null;
  }
}

function forgetSavedDuel(role) {
  try {
    localStorage.removeItem(DUEL_STORAGE_PREFIX + role);
  } catch {
    // Ignore
  }
}

function attachDuel(duel) {
  net.duel = duel;
  net.interrupted = null;
  localPlayerIndex = duel.local;
  duel.sendRaw = (msg) => net.link?.send(msg);
  duel.onEvent = (evt) => {
    saveDuel();
    net.ui = net.ui.then(() => presentDuelEvent(evt)).catch((err) => console.error(err));
  };
}

async function restoreSavedDuel(saved) {
  try {
    const duel = await DuelProtocol.restore(saved);
    return duel.m && duel.m.phase !== 'over' ? duel : null;
  } catch {
    return null;
  }
}

// Reprend un duel enregistré dans cet onglet (les autres onglets qui le tenaient le lâchent).
function adoptDuel(duel) {
  attachDuel(duel);
  net.channel?.postMessage({ t: 'takeover', sid: duel.sessionId, role: duel.role });
  if (duel.m?.match) {
    selectMode('online');
    selected = null;
    hoveredCell = null;
    busy = false;
    setMatch(duel.m.match);
  }
}

function newLink() {
  net.link?.close();
  const link = new DirectLink({
    onOpen: () => onLinkOpen(link),
    onMessage: (msg) => onLinkMessage(link, msg),
    onClose: () => onLinkClose(link),
  });
  net.link = link;
  net.verification = null;
  return link;
}

async function onLinkOpen(link) {
  if (net.link !== link) return;
  net.state = 'connected';
  net.inviteUrl = null;
  net.replyUrl = null;
  net.error = null;
  net.verification = await link.verification();
  sound.playSelectCard();
  net.duel?.connected();
  if (ui.dialog.dataset.net === '1') hideDialog();
  refreshNetUi();
  if (game && config.mode === 'online' && currentScreen === 'game') {
    setMessage(`Connexion rétablie. ${turnMessage()}`);
    render();
  }
}

function onLinkMessage(link, msg) {
  if (net.link !== link || !net.duel) return;
  if (msg && msg.t === 'emote') return receiveEmote(msg);
  net.duel.receive(msg).then(saveDuel);
}

function onLinkClose(link) {
  if (net.link !== link) return;
  const wasConnected = net.state === 'connected';
  net.link = null;
  net.verification = null;
  net.inviteUrl = null;
  net.replyUrl = null;
  net.state = wasConnected ? 'lost' : 'idle';
  if (!wasConnected) {
    net.error =
      "La connexion directe n'a pas pu s'établir. Certains réseaux (entreprise, partage de connexion, NAT strict) bloquent les connexions entre deux appareils : essayez depuis un autre réseau, ou créez une nouvelle invitation.";
  }
  refreshNetUi();
  if (game && config.mode === 'online' && currentScreen === 'game') {
    setMessage(turnMessage());
    render();
  }
  if (duelActive() && currentScreen === 'game') showDuelPause();
}

function receiveEmote(msg) {
  const now = Date.now();
  if (!Number.isInteger(msg.e) || msg.e < 0 || msg.e >= EMOTES.length || now - net.lastEmoteAt < EMOTE_MIN_INTERVAL) return;
  net.lastEmoteAt = now;
  sound.playUiClick();
  triggerComboBanner([EMOTES[msg.e]]);
}

// --- Hôte : invitation ---

async function createInvite({ resume = false } = {}) {
  if (!onlineAvailable()) {
    net.error = 'Le duel à distance a besoin d’un navigateur récent et d’une page sécurisée (https:// ou localhost).';
    return refreshNetUi();
  }
  if (!resume || !net.duel) {
    attachDuel(new DuelProtocol({ role: 'host', deck: config.deck0 }));
  }
  const link = newLink();
  net.state = 'inviting';
  net.inviteUrl = null;
  net.error = null;
  refreshNetUi();
  try {
    const token = await link.createInvite({ sessionId: net.duel.sessionId, resume });
    if (net.link !== link) return;
    net.inviteUrl = buildSignalLink('join', token);
  } catch {
    if (net.link === link) {
      net.state = 'idle';
      net.error = "Impossible de préparer l'invitation sur ce navigateur.";
    }
  }
  refreshNetUi();
}

async function acceptReplyToken(raw) {
  const signal = await decodeSignal(extractSignalToken(raw, 'reply'));
  if (!signal || signal.k !== 'a') throw new Error("Ce n'est pas un lien de réponse valide.");
  if (!net.link || net.duel?.role !== 'host' || net.state !== 'inviting') {
    throw new Error("Aucune invitation n'attend de réponse sur cette page.");
  }
  if (signal.sid !== net.duel.sessionId) throw new Error('Cette réponse concerne une autre partie.');
  await net.link.acceptReply(signal);
  net.state = 'connecting';
  refreshNetUi();
}

// --- Invité : réponse ---

async function receiveInviteToken(raw) {
  const signal = await decodeSignal(extractSignalToken(raw, 'join'));
  if (!signal || signal.k !== 'o') {
    infoDialog("Lien d'invitation invalide", "Ce lien d'invitation est incomplet ou abîmé. Demandez à votre adversaire de vous le renvoyer.");
    return;
  }
  if (!onlineAvailable()) {
    infoDialog('Duel à distance indisponible', 'Ce navigateur ne permet pas la connexion directe, ou la page n’est pas sécurisée (https://).');
    return;
  }
  selectMode('online');
  net.pendingInvite = signal;
  net.error = null;
  if (signal.resume) {
    await acceptInvite();
    return;
  }
  showMenu();
  sound.playSelectCard();
}

async function acceptInvite() {
  const signal = net.pendingInvite;
  if (!signal) return;
  net.pendingInvite = null;

  if (signal.resume) {
    let duel = net.duel?.role === 'guest' && net.duel.sessionId === signal.sid ? net.duel : null;
    if (!duel) {
      const saved = readSavedDuel('guest');
      if (saved?.sessionId === signal.sid) duel = await restoreSavedDuel(saved);
      if (duel) adoptDuel(duel);
    }
    if (!duel) {
      infoDialog(
        'Partie introuvable',
        "Ce lien de reprise concerne une partie qui n'est pas enregistrée dans ce navigateur. Ouvrez-le avec le navigateur où vous jouiez cette partie.",
      );
      return;
    }
  } else {
    attachDuel(new DuelProtocol({ role: 'guest', deck: config.deck0, sessionId: signal.sid }));
  }

  const link = newLink();
  net.state = 'replying';
  net.replyUrl = null;
  refreshNetUi();
  try {
    const token = await link.acceptInvite(signal);
    if (net.link !== link) return;
    net.replyUrl = buildSignalLink('reply', token);
  } catch {
    if (net.link === link) {
      net.state = 'idle';
      net.error = "Impossible de répondre à cette invitation sur ce navigateur.";
    }
  }
  refreshNetUi();
  if (signal.resume) {
    if (game) {
      navigateTo('game');
      setMessage(turnMessage());
      render();
    }
    showLinkDialog('reply');
  }
}

// Un onglet ouvert depuis un lien de réponse transmet celle-ci à l'onglet qui a créé l'invitation.
async function relayReply(raw) {
  const token = extractSignalToken(raw, 'reply');
  const acked = await new Promise((resolve) => {
    if (!net.channel) return resolve(false);
    const onMessage = (e) => {
      if (e.data?.t === 'ack' && e.data.token === token.slice(0, 24)) done(true);
    };
    const timer = setTimeout(() => done(false), REPLY_ACK_TIMEOUT);
    function done(value) {
      clearTimeout(timer);
      net.channel.removeEventListener('message', onMessage);
      resolve(value);
    }
    net.channel.addEventListener('message', onMessage);
    net.channel.postMessage({ t: 'reply', token });
  });
  if (acked) {
    infoDialog(
      'Réponse transmise',
      "La réponse de votre adversaire a été transmise à l'onglet où vous avez créé l'invitation : la connexion s'y établit. Vous pouvez fermer cet onglet-ci.",
    );
    return;
  }
  net.relayUrl = buildSignalLink('reply', token);
  showDialog(
    `
    <h2>Réponse reçue</h2>
    <p style="color:var(--text-muted);line-height:1.5;">
      Aucun onglet de ce navigateur n'attend cette réponse. Retournez dans l'onglet (ou le navigateur) où vous avez créé l'invitation
      et collez-y ce lien. Si cet onglet a été fermé, l'invitation est perdue : créez-en une nouvelle.
    </p>
    <div class="dialog-actions">
      <button type="button" class="cta-btn" data-action="copy-link" data-link="relay">📋 Copier le lien de réponse</button>
      <button type="button" class="hud-btn" data-action="close">Fermer</button>
    </div>
  `,
    { net: true },
  );
}

net.channel?.addEventListener('message', async (e) => {
  const d = e.data;
  if (!d || typeof d !== 'object') return;
  if (d.t === 'reply' && typeof d.token === 'string' && net.state === 'inviting') {
    try {
      await acceptReplyToken(d.token);
      net.channel.postMessage({ t: 'ack', token: d.token.slice(0, 24) });
    } catch {
      // Réponse destinée à un autre onglet
    }
  } else if (d.t === 'takeover' && net.duel && d.sid === net.duel.sessionId && d.role === net.duel.role) {
    net.link?.close();
    net.link = null;
    net.duel = null;
    net.state = 'idle';
    game = null;
    match = null;
    showMenu();
    infoDialog('Partie reprise ailleurs', 'Cette partie a été reprise dans un autre onglet. Continuez-la là-bas.');
  }
});

// --- Présentation des événements du duel ---

function presentDuelEvent(evt) {
  switch (evt.kind) {
    case 'ready': {
      selectMode('online');
      localPlayerIndex = net.duel.local;
      selected = null;
      hoveredCell = null;
      busy = false;
      setMatch(evt.match);
      if (ui.dialog.dataset.net === '1' || currentScreen !== 'game') hideDialog();
      navigateTo('game');
      sound.playSelectCard();
      const opener = evt.match.firstPlayer === localPlayerIndex ? 'Vous engagez la manche.' : 'Votre adversaire engage la manche.';
      setMessage(`${opener} ${turnMessage()}`);
      render();
      return null;
    }
    case 'move':
      return presentDuelMove(evt);
    case 'verifying':
      setMessage('Fin de manche : vérification des mains…');
      return null;
    case 'revealed':
      setMatch(evt.match);
      render();
      return null;
    case 'sudden-death':
      return new Promise((resolve) => {
        busy = true;
        game = evt.roundOver;
        render();
        setMessage(`Égalité ! Mort Subite : chacun reprend les cartes de sa couleur pour la manche ${evt.match.round}/${MAX_ROUNDS}.`);
        setTimeout(() => {
          busy = false;
          setMatch(evt.match);
          triggerComboBanner([`MORT SUBITE — MANCHE ${evt.match.round}`]);
          setMessage(turnMessage());
          render();
          resolve();
        }, SUDDEN_DEATH_DELAY);
      });
    case 'over':
      refreshNetUi();
      if (!evt.match) {
        infoDialog('Partie annulée', evt.result?.message || 'La partie a été interrompue.');
        return null;
      }
      setMatch(evt.match);
      busy = false;
      render();
      endGame(evt.result);
      return null;
    case 'error':
      console.warn('[duel]', evt.message);
      return null;
    default:
      return null;
  }
}

function presentDuelMove({ player, step, match: next }) {
  const res = step.result;
  const last = next.moves[next.moves.length - 1];
  setMatch(next);
  flipped = res.captured;
  placed = last?.cell ?? null;
  selected = null;
  hoveredCell = null;

  sound.playPlaceCard(res.placedBonuses?.totalMod || 0);
  if (res.captured.length > 0) {
    const isSpecial = res.events.tags.length > 0;
    setTimeout(() => sound.playCapture(res.captured.length, isSpecial), 90);
  }
  if (res.events.tags.length > 0) triggerComboBanner(res.events.tags);
  render();
  if (step.roundOver) setMessage('Fin de manche : vérification des mains…');
  else setMessage(player === localPlayerIndex ? turnMessage() : `Coup adverse joué. ${turnMessage()}`);
  return null;
}

function playOnline(handIndex, cell) {
  selected = null;
  busy = true;
  net.duel.playLocal(handIndex, cell).then(() => {
    saveDuel();
    net.ui = net.ui.then(() => {
      busy = false;
      render();
    });
  });
}

// --- Interface réseau ---

function refreshNetUi() {
  renderRemoteSetupBox();
  updateNetBar();
}

function updateNetBar() {
  const online = config.mode === 'online';
  ui.netStatusBar?.classList.toggle('hidden', !online);
  const code = net.verification ? ` — code ${net.verification}` : '';
  const labels = {
    idle: '⚪ Pas de connexion',
    inviting: '🟡 Invitation envoyée, en attente de la réponse',
    connecting: '🟡 Connexion en cours…',
    replying: "🟡 En attente de la connexion de l'hôte…",
    connected: `🟢 Connexion directe${code}`,
    lost: '🟠 Connexion perdue : partie en pause',
  };
  if (ui.netIndicator) ui.netIndicator.textContent = labels[net.state] || labels.idle;
  $('btn-reconnect')?.classList.toggle('hidden', !online || net.state === 'connected' || !duelActive());
  $('btn-resign')?.classList.toggle('hidden', !online || !duelActive());
  const canRematch = net.duel?.role === 'host' && net.state === 'connected' && !duelActive();
  $('btn-again')?.classList.toggle('hidden', online && !canRematch);
}

function linkBlockHtml(kind) {
  const url = kind === 'invite' ? net.inviteUrl : net.replyUrl;
  if (!url) return '<p class="remote-note">Préparation du lien… (quelques secondes)</p>';
  return `
    <input type="text" class="modern-input link-field" readonly value="${escapeHtml(url)}" aria-label="Lien à envoyer" />
    <div class="remote-actions-row">
      <button type="button" class="cta-btn" data-action="share-link" data-link="${kind}" style="padding:8px 18px;font-size:0.9rem;">📱 Partager</button>
      <button type="button" class="hud-btn" data-action="copy-link" data-link="${kind}">📋 Copier</button>
    </div>
  `;
}

function pasteReplyHtml() {
  return `
    <p class="remote-note">Quand votre adversaire vous renvoie son lien de réponse, ouvrez-le dans ce navigateur, ou collez-le ici :</p>
    <div class="remote-input-row">
      <input type="text" class="modern-input" data-paste="reply" autocomplete="off" spellcheck="false" placeholder="Lien de réponse (…#reply=…)" />
      <button type="button" class="hud-btn" data-action="submit-reply">Valider</button>
    </div>
  `;
}

const PRIVACY_NOTE =
  "Connexion directe et chiffrée entre les deux navigateurs, sans serveur de jeu ni relais. Seuls des serveurs STUN publics aident chaque appareil à connaître son adresse publique, et chaque joueur voit l'adresse IP de l'autre. Les mains restent secrètes jusqu'à la fin de la manche, puis sont vérifiées.";

function renderRemoteSetupBox() {
  if (!ui.remoteSetupBox) return;
  if (config.mode !== 'online') {
    ui.remoteSetupBox.classList.add('hidden');
    return;
  }
  ui.remoteSetupBox.classList.remove('hidden');
  const error = net.error ? `<p class="remote-error">${escapeHtml(net.error)}</p>` : '';

  if (!onlineAvailable()) {
    ui.remoteSetupBox.innerHTML = `
      <div class="remote-card">
        <strong style="color:var(--gold)">Duel à distance indisponible ici</strong>
        <p class="remote-note">Le duel à distance a besoin d'une page sécurisée (adresse en https:// ou localhost) et d'un navigateur récent. Ouvrez le jeu depuis son adresse https (par exemple GitHub Pages).</p>
      </div>`;
    return;
  }

  let html;
  if (net.pendingInvite) {
    html = `
      <div class="remote-card">
        <strong style="color:var(--gold)">📨 Invitation reçue</strong>
        <p class="remote-note">Choisissez votre deck ci-dessous, puis acceptez : le jeu produira un lien de réponse à renvoyer à votre adversaire. L'hôte choisit les règles de table.</p>
        <div class="remote-actions-row">
          <button type="button" class="cta-btn" data-action="accept-invite" style="padding:8px 18px;font-size:0.9rem;">Accepter l'invitation</button>
          <button type="button" class="hud-btn" data-action="cancel-link">Refuser</button>
        </div>
      </div>`;
  } else if (net.state === 'replying') {
    html = `
      <div class="remote-card">
        <strong style="color:var(--gold)">↩ Renvoyez ce lien de réponse à votre adversaire</strong>
        ${linkBlockHtml('reply')}
        <p class="remote-note">Gardez cette page ouverte : la connexion s'établit dès que votre adversaire ouvre ce lien, puis il lance la partie.</p>
        <div class="remote-actions-row"><button type="button" class="hud-btn" data-action="cancel-link">Annuler</button></div>
      </div>`;
  } else if (net.state === 'inviting' || net.state === 'connecting') {
    html = `
      <div class="remote-card">
        <strong style="color:var(--gold)">✉ Envoyez ce lien d'invitation à votre adversaire</strong>
        ${net.state === 'connecting' ? '<p class="remote-note">Réponse reçue : connexion en cours…</p>' : `${linkBlockHtml('invite')}${pasteReplyHtml()}`}
        <p class="remote-note">Gardez cette page ouverte jusqu'à la connexion. Chaque invitation ne sert qu'une fois.</p>
        <div class="remote-actions-row"><button type="button" class="hud-btn" data-action="cancel-link">Annuler l'invitation</button></div>
      </div>`;
  } else if (net.state === 'connected') {
    const host = net.duel?.role === 'host';
    html = `
      <div class="remote-card">
        <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap;">
          <strong style="color:var(--gold)">🟢 Connecté en direct à votre adversaire</strong>
          <span class="p2p-status-badge connected">Code : ${escapeHtml(net.verification || '?')}</span>
        </div>
        <p class="remote-note">Vérifiez que votre adversaire voit le même code (par message ou de vive voix) : sinon, quelqu'un a modifié les liens en route et il faut recommencer.</p>
        <p class="remote-note">${
          host
            ? 'Choisissez votre deck et les règles, puis ouvrez la table : les mains sont tirées à deux, sans que personne ne voie celle de l’autre.'
            : "L'hôte choisit les règles et lance la partie. Votre deck est celui sélectionné ci-dessous."
        }</p>
        ${duelActive() && game ? '<div class="remote-actions-row"><button type="button" class="cta-btn" data-action="resume-game" style="padding:8px 18px;font-size:0.9rem;">Retour à la table</button></div>' : ''}
      </div>`;
  } else {
    const interrupted = net.duel && duelActive() ? net.duel : null;
    const resumeCard =
      interrupted || net.interrupted
        ? `
      <div class="remote-card">
        <strong style="color:var(--gold)">⏸ Duel interrompu</strong>
        <p class="remote-note">${
          (interrupted?.role || net.interrupted?.role) === 'host'
            ? 'Créez un lien de reprise et envoyez-le à votre adversaire : la partie reprendra où elle en était.'
            : "Demandez à votre adversaire (l'hôte) un lien de reprise, puis ouvrez-le dans ce navigateur."
        }</p>
        <div class="remote-actions-row">
          <button type="button" class="cta-btn" data-action="resume-duel" style="padding:8px 18px;font-size:0.9rem;">Reprendre</button>
          <button type="button" class="hud-btn" data-action="forget-duel">Oublier ce duel</button>
        </div>
      </div>`
        : '';
    html = `
      ${resumeCard}
      <div class="remote-cols">
        <div class="remote-card">
          <strong style="color:var(--gold)">Inviter un adversaire</strong>
          <p class="remote-note">Le jeu crée un lien à envoyer par la messagerie de votre choix. Votre adversaire l'ouvre et vous renvoie un lien de réponse : vous êtes alors connectés en direct.</p>
          <div class="remote-actions-row">
            <button type="button" class="cta-btn" data-action="create-invite" style="padding:8px 18px;font-size:0.9rem;">Créer une invitation</button>
          </div>
        </div>
        <div class="remote-card">
          <strong style="color:var(--gold)">Rejoindre une partie</strong>
          <p class="remote-note">Ouvrez le lien d'invitation reçu, ou collez-le ici :</p>
          <div class="remote-input-row">
            <input type="text" class="modern-input" data-paste="join" autocomplete="off" spellcheck="false" placeholder="Lien d'invitation (…#join=…)" />
            <button type="button" class="hud-btn" data-action="submit-join">Rejoindre</button>
          </div>
        </div>
      </div>`;
  }
  ui.remoteSetupBox.innerHTML = `${error}${html}<p class="remote-note">${PRIVACY_NOTE}</p>`;
}

// Fenêtre affichant un lien à transmettre (invitation de reprise côté hôte, réponse côté invité).
function showLinkDialog(kind) {
  const host = kind === 'invite';
  showDialog(
    `
    <h2>${host ? '🔗 Lien de reprise' : '↩ Lien de réponse'}</h2>
    <p style="color:var(--text-muted);line-height:1.5;">${
      host
        ? 'Envoyez ce lien à votre adversaire. La partie reprendra exactement où elle en était dès que vous aurez ouvert sa réponse.'
        : "Renvoyez ce lien à votre adversaire et gardez cette page ouverte : la partie reprend dès qu'il l'ouvre."
    }</p>
    <div class="remote-card">
      ${linkBlockHtml(kind)}
      ${host ? pasteReplyHtml() : ''}
    </div>
    <div class="dialog-actions"><button type="button" class="hud-btn" data-action="close">Fermer</button></div>
  `,
    { net: true },
  );
}

function showDuelPause() {
  const host = net.duel?.role === 'host';
  showDialog(
    `
    <h2>⏸ Connexion perdue</h2>
    <p style="color:var(--text-muted);line-height:1.5;">
      La partie est en pause, rien n'est perdu : une coupure ne compte jamais comme un abandon.
      ${host ? 'Créez un lien de reprise et envoyez-le à votre adversaire.' : "Votre adversaire (l'hôte) va vous envoyer un lien de reprise : ouvrez-le dans ce navigateur, ou collez-le ici."}
    </p>
    ${
      host
        ? ''
        : `<div class="remote-input-row">
        <input type="text" class="modern-input" data-paste="join" autocomplete="off" spellcheck="false" placeholder="Lien de reprise (…#join=…)" />
        <button type="button" class="hud-btn" data-action="submit-join">Reprendre</button>
      </div>`
    }
    <div class="dialog-actions">
      ${host ? '<button type="button" class="cta-btn" data-action="resume-invite">Créer un lien de reprise</button>' : ''}
      <button type="button" class="hud-btn" data-action="close">Attendre</button>
    </div>
  `,
    { net: true },
  );
}

function confirmResign() {
  showDialog(`
    <h2>Abandonner le duel ?</h2>
    <p style="color:var(--text-muted);line-height:1.5;">La partie sera comptée comme une défaite pour vous et une victoire pour votre adversaire.</p>
    <div class="dialog-actions">
      <button type="button" class="cta-btn" data-action="confirm-resign">Abandonner</button>
      <button type="button" class="hud-btn" data-action="close">Continuer la partie</button>
    </div>
  `);
}

async function shareLink(url, btn) {
  if (!url) return;
  if (btn.dataset.action === 'share-link' && navigator.share) {
    try {
      await navigator.share({ title: 'Les Quatre Vents — Duel', text: 'Un duel aux Quatre Vents ? Ouvre ce lien :', url });
      return;
    } catch {
      // Repli sur la copie
    }
  }
  try {
    await navigator.clipboard.writeText(url);
    btn.textContent = '✓ Copié !';
  } catch {
    const field = (btn.closest('.remote-card') || ui.dialog).querySelector('.link-field');
    field?.select();
    btn.textContent = 'Copiez le lien sélectionné';
  }
}

function pastedValue(btn, kind) {
  const scope = btn.closest('.remote-card') || ui.dialog;
  return scope.querySelector(`input[data-paste="${kind}"]`)?.value || '';
}

async function handleNetAction(action, btn) {
  switch (action) {
    case 'create-invite':
      return createInvite();
    case 'resume-invite':
      await createInvite({ resume: true });
      return showLinkDialog('invite');
    case 'accept-invite':
      return acceptInvite();
    case 'cancel-link':
      net.pendingInvite = null;
      net.link?.close();
      net.link = null;
      net.state = 'idle';
      net.inviteUrl = null;
      net.replyUrl = null;
      if (!duelActive()) net.duel = null;
      return refreshNetUi();
    case 'share-link':
    case 'copy-link': {
      const urls = { invite: net.inviteUrl, reply: net.replyUrl, relay: net.relayUrl };
      return shareLink(urls[btn.dataset.link], btn);
    }
    case 'submit-reply': {
      const raw = pastedValue(btn, 'reply').trim();
      if (!raw) return;
      try {
        await acceptReplyToken(raw);
      } catch (err) {
        infoDialog('Lien de réponse refusé', err.message);
      }
      return;
    }
    case 'submit-join': {
      const raw = pastedValue(btn, 'join').trim();
      if (raw) return receiveInviteToken(raw);
      return;
    }
    case 'resume-duel': {
      if (!net.duel || !duelActive()) {
        const duel = net.interrupted ? await restoreSavedDuel(net.interrupted) : null;
        if (!duel) {
          if (net.interrupted) forgetSavedDuel(net.interrupted.role);
          net.interrupted = null;
          refreshNetUi();
          return infoDialog('Reprise impossible', "Ce duel enregistré n'a pas pu être relu.");
        }
        adoptDuel(duel);
      }
      if (game) navigateTo('game');
      render();
      if (net.duel.role === 'host') {
        await createInvite({ resume: true });
        return showLinkDialog('invite');
      }
      return showDuelPause();
    }
    case 'forget-duel':
      if (net.duel && duelActive()) {
        forgetSavedDuel(net.duel.role);
        net.link?.close();
        net.link = null;
        net.duel = null;
        net.state = 'idle';
      }
      if (net.interrupted) forgetSavedDuel(net.interrupted.role);
      net.interrupted = null;
      return refreshNetUi();
    case 'reconnect':
      return net.duel?.role === 'host' ? (await createInvite({ resume: true }), showLinkDialog('invite')) : showDuelPause();
    case 'resign':
      return confirmResign();
    case 'confirm-resign':
      hideDialog();
      return net.duel?.resign().then(saveDuel);
    default:
      return undefined;
  }
}

const NET_ACTIONS = new Set([
  'create-invite',
  'resume-invite',
  'accept-invite',
  'cancel-link',
  'share-link',
  'copy-link',
  'submit-reply',
  'submit-join',
  'resume-duel',
  'forget-duel',
  'reconnect',
  'resign',
  'confirm-resign',
]);

function selectMode(mode) {
  config.mode = mode;
  document.querySelectorAll('[data-set-mode]').forEach((b) => b.classList.toggle('active', b.dataset.setMode === mode));
  $('diff-selector')?.classList.toggle('hidden', mode !== 'ai');
}

// =========================================================================
// RENDU DU SALON
// =========================================================================
function renderLobby() {
  ui.deckSelector.replaceChildren();
  for (const d of DECK_LIST) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `deck-choice ${config.deck0 === d.id ? 'active' : ''}`;
    const elemsHtml = d.favoredElements
      .map((ek) => {
        const e = ELEMENTS[ek];
        return `<span class="mini-elem" style="color:${e.color}">${e.icon} ${e.name}</span>`;
      })
      .join('');

    btn.innerHTML = `
      <div class="deck-choice-top">
        <span class="deck-badge" style="color:${d.accent}">${d.badge}</span>
        <span class="deck-style-pill">${d.style}</span>
      </div>
      <div class="deck-choice-title">${d.name}</div>
      <div class="deck-choice-desc">${d.description}</div>
      <div class="deck-elements-row">${elemsHtml}</div>
    `;
    btn.addEventListener('click', () => {
      config.deck0 = d.id;
      if (net.duel?.role === 'guest') net.duel.setDeck(d.id);
      sound.playUiClick();
      renderLobby();
    });
    ui.deckSelector.appendChild(btn);
  }

  ui.lobbyStats.innerHTML = `
    <span>Parties jouées : <strong>${stats.played}</strong></span>
    <span>Victoires : <strong>${stats.wins}</strong></span>
    <span>Égalités : <strong>${stats.draws}</strong></span>
    <span>Série actuelle : <strong>${stats.streak} 🔥</strong></span>
  `;

  renderRemoteSetupBox();
  updateAudioButtons();
}

function updateAudioButtons() {
  if (ui.btnSfx) {
    ui.btnSfx.classList.toggle('muted', !sound.sfxEnabled);
    ui.btnSfx.textContent = sound.sfxEnabled ? '🔊' : '🔇';
  }
  if (ui.btnMusic) {
    ui.btnMusic.classList.toggle('muted', !sound.musicEnabled);
    ui.btnMusic.textContent = sound.musicEnabled ? '🎵' : '🔕';
  }
}

// =========================================================================
// RENDU DE LA TABLE DE JEU
// =========================================================================
function renderActiveRulesBar() {
  ui.activeRulesBar.replaceChildren();
  const labels = [
    ['elemental', 'Élémentaire'],
    ['synergy', 'Synergie'],
    ['same', 'Identique'],
    ['sameWall', 'Mur Identique'],
    ['plus', 'Plus'],
    ['combo', 'Combo'],
    ['open', 'Main Ouverte'],
    ['sudden', 'Mort Subite'],
  ];
  for (const [key, label] of labels) {
    if (game.rules[key]) {
      const tag = document.createElement('span');
      tag.className = 'rule-tag';
      tag.textContent = label;
      ui.activeRulesBar.appendChild(tag);
    }
  }
  if (match && match.round > 1) {
    const tag = document.createElement('span');
    tag.className = 'rule-tag';
    tag.textContent = `Manche ${match.round}/${MAX_ROUNDS}`;
    ui.activeRulesBar.appendChild(tag);
  }
}

function updatePreviewHighlights() {
  const cells = ui.board.querySelectorAll('.cell');
  cells.forEach((c) => c.classList.remove('will-capture'));

  if (selected === null || hoveredCell === null || busy || !game || game.over) return;
  if (game.board[hoveredCell]) return;

  const { captured, events, placedBonuses } = previewMove(game, selected, hoveredCell);
  for (const cIdx of captured) {
    cells[cIdx]?.classList.add('will-capture');
  }

  const bonusInfo =
    placedBonuses && placedBonuses.reasons.length > 0
      ? ` • [${placedBonuses.reasons.join(', ')}]`
      : '';

  if (events.tags.length > 0) {
    setMessage(
      `Aperçu : ${events.tags.join(' + ')} (${captured.length} capture${captured.length > 1 ? 's' : ''})${bonusInfo}`,
    );
  } else if (captured.length > 0) {
    setMessage(
      `Aperçu : ${captured.length} capture${captured.length > 1 ? 's' : ''} directe${captured.length > 1 ? 's' : ''}${bonusInfo}`,
    );
  } else if (bonusInfo) {
    setMessage(`Aperçu sur cette case${bonusInfo}`);
  } else {
    setMessage('Choisissez une case libre sur le plateau.');
  }
}

function render() {
  if (!game) return;
  const [s0, s1] = score(game);
  ui.scores[0].textContent = s0;
  ui.scores[1].textContent = s1;

  renderActiveRulesBar();
  updateNetBar();

  for (const p of [0, 1]) {
    ui.names[p].textContent = playerName(p);
    const deckInfo = DECKS[matchDecks[p]] || DECKS.vents;
    ui.deckTags[p].textContent = `${deckInfo.badge} ${deckInfo.name}`;
    ui.sidePanels[p].classList.toggle('active-turn', !game.over && game.turn === p);

    const handEl = ui.hands[p];
    handEl.replaceChildren();
    const visible = isHandVisible(p);

    game.hands[p].forEach((card, i) => {
      const el = cardEl(card, p, { hidden: !visible || card.hidden });
      const playable = !busy && !game.over && game.turn === p && isHuman(p);
      if (playable) {
        el.classList.add('playable');
        el.tabIndex = 0;
        el.addEventListener('mouseenter', () => sound.playHover());
        el.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            select(i);
          }
        });
        attachTactilePlayableEvents(el, i, card, p);
      }
      if (playable && selected === i) el.classList.add('selected');
      handEl.appendChild(el);
    });
  }

  ui.board.replaceChildren();
  game.board.forEach((slot, cell) => {
    const el = document.createElement('div');
    el.className = 'cell';
    el.dataset.cell = String(cell);

    const cellElemKey = game.boardElements?.[cell];
    if (cellElemKey && ELEMENTS[cellElemKey]) {
      const eInfo = ELEMENTS[cellElemKey];
      el.style.setProperty('--elem-color', eInfo.color);
      const badge = document.createElement('div');
      badge.className = 'cell-element';
      badge.innerHTML = `
        <div class="cell-element-ring">${eInfo.icon}</div>
        <span class="cell-element-label">${eInfo.name}</span>
      `;
      el.appendChild(badge);
    }

    if (slot) {
      const c = cardEl(slot.card, slot.owner, {
        cell,
        board: game.board,
        boardElements: game.boardElements,
        rules: game.rules,
      });
      if (flipped.includes(cell)) c.classList.add('flip');
      if (placed === cell) c.classList.add('drop');
      el.appendChild(c);
    } else if (!busy && !game.over && isHuman(game.turn)) {
      if (selected !== null) {
        el.classList.add('target');
        el.tabIndex = 0;
        el.addEventListener('click', () => place(cell));
        el.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            place(cell);
          }
        });
      }

      el.addEventListener('mouseenter', () => {
        hoveredCell = cell;
        updatePreviewHighlights();
      });
      el.addEventListener('mouseleave', () => {
        if (hoveredCell === cell) hoveredCell = null;
        updatePreviewHighlights();
      });

      el.addEventListener('dragover', (e) => {
        e.preventDefault();
        el.classList.add('drag-over');
        if (hoveredCell !== cell) {
          hoveredCell = cell;
          updatePreviewHighlights();
        }
      });
      el.addEventListener('dragleave', () => {
        el.classList.remove('drag-over');
      });
      el.addEventListener('drop', (e) => {
        e.preventDefault();
        el.classList.remove('drag-over');
        const idxStr = e.dataTransfer?.getData('text/plain');
        const handIdx = idxStr !== '' && idxStr !== undefined ? Number(idxStr) : selected;
        if (handIdx !== null && !Number.isNaN(handIdx)) {
          selected = handIdx;
          place(cell);
        }
      });
    }

    ui.board.appendChild(el);
  });

  flipped = [];
  placed = null;
  updatePreviewHighlights();
}

function setMessage(text) {
  ui.message.textContent = text;
}

function turnMessage() {
  const p = game.turn;
  if (config.mode === 'ai') {
    return p === 0 ? 'À vous de jouer — choisissez ou glissez une carte.' : `${playerName(1)} médite son coup…`;
  }
  if (config.mode === 'online') {
    if (net.state !== 'connected') {
      return p === localPlayerIndex
        ? 'Connexion coupée : vous pouvez jouer, votre coup partira à la reconnexion.'
        : 'Connexion coupée : partie en pause en attendant la reconnexion.';
    }
    return p === localPlayerIndex ? 'À vous de jouer.' : 'En attente du coup de votre adversaire…';
  }
  return `${playerName(p)}, à votre tour de jouer.`;
}

function select(i) {
  selected = selected === i ? null : i;
  sound.playSelectCard();
  if (selected === null) {
    setMessage(turnMessage());
  } else {
    const c = game?.hands[game.turn]?.[selected];
    const elem = c ? ELEMENTS[c.element] : null;
    const label = c ? `${c.name} (${elem ? `${elem.icon} ${elem.name}` : `Niv.${c.level}`})` : 'Carte sélectionnée';
    setMessage(`${label} — touchez ou glissez vers une case libre.`);
  }
  render();
}

function triggerComboBanner(tags) {
  if (!tags || tags.length === 0) return;
  ui.comboBanner.textContent = tags.join(' • ');
  ui.comboBanner.classList.remove('hidden');
  clearTimeout(triggerComboBanner._timer);
  triggerComboBanner._timer = setTimeout(() => {
    ui.comboBanner.classList.add('hidden');
  }, 950);
}

// Coup d'une partie locale (IA ou 2 joueurs sur le même écran). Le duel à distance passe par playOnline.
function applyMove(handIndex, cell) {
  const { match: nextMatch, result: res, roundOver, suddenDeath } = playMatchMove(match, handIndex, cell);
  const totalMod = res.placedBonuses?.totalMod || 0;
  setMatch(nextMatch);
  // Pendant la transition de Mort Subite, on affiche d'abord le plateau final de la manche.
  if (suddenDeath) game = roundOver;
  flipped = res.captured;
  placed = cell;
  selected = null;
  hoveredCell = null;

  sound.playPlaceCard(totalMod);
  if (res.captured.length > 0) {
    const isSpecial = res.events.tags.length > 0;
    setTimeout(() => sound.playCapture(res.captured.length, isSpecial), 90);
  }
  if (res.events.tags.length > 0) {
    triggerComboBanner(res.events.tags);
  }

  if (suddenDeath) {
    busy = true;
    render();
    setMessage(`Égalité ! Mort Subite : chacun reprend les cartes de sa couleur pour la manche ${match.round}/${MAX_ROUNDS}.`);
    const current = match;
    setTimeout(() => {
      if (match !== current) return;
      busy = false;
      game = match.game;
      triggerComboBanner([`MORT SUBITE — MANCHE ${match.round}`]);
      render();
      afterTurn();
    }, SUDDEN_DEATH_DELAY);
    return;
  }

  render();
  if (game.over) return endGame();
  afterTurn();
}

// Suite d'un coup : message de tour, tour de l'IA.
function afterTurn() {
  setMessage(turnMessage());
  if (!isHuman(game.turn) && config.mode === 'ai') aiTurn();
}

function place(cell) {
  if (selected === null || busy) return;
  if (config.mode === 'online') return playOnline(selected, cell);
  applyMove(selected, cell);
}

function aiTurn() {
  busy = true;
  render();
  const current = game;
  setTimeout(() => {
    if (game !== current) return;
    busy = false;
    // Sans Main Ouverte, l'IA ne connaît de la main adverse que ce qui est public.
    const opponentCandidates = game.rules.open ? undefined : opponentCandidatesFor(game, 0, matchDecks[0]);
    const m = chooseMove(game, { difficulty: config.difficulty, opponentCandidates });
    applyMove(m.handIndex, m.cell);
  }, AI_DELAY);
}

function infoDialog(title, body) {
  showDialog(`
    <h2>${escapeHtml(title)}</h2>
    <p style="color:var(--text-muted);line-height:1.5;">${escapeHtml(body)}</p>
    <div class="dialog-actions"><button type="button" class="hud-btn" data-action="close">Fermer</button></div>
  `);
}

// Fin de partie. `result` vient du duel à distance : { winner: 0|1|'draw'|null, reason: 'score'|'resign'|'cheat' }.
function endGame(result = null) {
  const [s0, s1] = score(game);
  const online = config.mode === 'online';
  const reason = result?.reason || 'score';
  const w = result ? result.winner : winner(game);
  const cancelled = reason === 'cheat';

  if (!cancelled) {
    stats.played++;
    if (w === 'draw') {
      stats.draws++;
    } else if (w === localPlayerIndex) {
      stats.wins++;
      stats.streak++;
    } else {
      stats.streak = 0;
    }
    saveStats();
  }

  let title;
  let detail = '';
  if (cancelled) {
    title = 'Partie annulée';
    detail = `${result.message || 'Une incohérence a été détectée dans le jeu adverse.'} Cette partie ne compte pas dans vos statistiques.`;
    sound.playEndGame('lose');
  } else if (w === 'draw') {
    title = 'Égalité Parfaite';
    sound.playEndGame('draw');
  } else if (config.mode !== 'local') {
    if (reason === 'resign') {
      title = w === localPlayerIndex ? 'Victoire par abandon' : 'Vous avez abandonné';
      detail = w === localPlayerIndex ? 'Votre adversaire a abandonné la partie.' : '';
    } else {
      title = w === localPlayerIndex ? 'Victoire Triomphale !' : 'Défaite…';
    }
    sound.playEndGame(w === localPlayerIndex ? 'win' : 'lose');
  } else {
    title = `${playerName(w)} remporte la partie !`;
    sound.playEndGame('win');
  }

  const rounds = match?.round || 1;
  const roundsText =
    rounds > 1 && !cancelled
      ? `Après ${rounds} manches${w === 'draw' ? ` (limite de ${MAX_ROUNDS} manches atteinte)` : ''}.`
      : '';
  const canRestart = !online || (net.duel?.role === 'host' && net.state === 'connected');
  const restartNote = online && !canRestart
    ? `<p style="text-align:center;color:var(--text-muted);font-size:0.85rem;">${
        net.duel?.role === 'host' ? 'La revanche sera possible une fois reconnectés.' : 'La revanche se lance depuis la table de l’hôte.'
      }</p>`
    : '';

  setMessage(`${title} (${s0} – ${s1})`);
  updateNetBar();
  setTimeout(() => {
    showDialog(`
      <h2 class="result">${escapeHtml(title)}</h2>
      <p class="final-score"><span class="s0">${s0}</span> – <span class="s1">${s1}</span></p>
      <p style="text-align:center;color:var(--text-muted);margin:0 0 12px;font-size:0.9rem;">
        ${DECKS[matchDecks[0]].badge} ${DECKS[matchDecks[0]].name} &nbsp;contre&nbsp; ${DECKS[matchDecks[1]].badge} ${DECKS[matchDecks[1]].name}
        ${roundsText ? `<br>${roundsText}` : ''}
        ${detail ? `<br>${escapeHtml(detail)}` : ''}
      </p>
      <div class="dialog-actions">
        ${canRestart ? '<button type="button" class="cta-btn" data-action="again">Rejouer</button>' : ''}
        <button type="button" class="hud-btn" data-action="menu">Retour au Salon</button>
      </div>
      ${restartNote}
    `);
  }, 850);
}

function startOnlineMatch() {
  if (net.duel?.role !== 'host' || net.state !== 'connected') {
    const guest = net.duel?.role === 'guest' && net.state === 'connected';
    infoDialog(
      guest ? 'Seul l’hôte lance la partie' : 'Connectez-vous d’abord',
      guest
        ? "En duel à distance, c'est l'hôte qui choisit les règles et lance la partie. Votre plateau s'ouvrira automatiquement."
        : 'Créez une invitation (ou ouvrez celle de votre adversaire) dans le salon, puis attendez la connexion.',
    );
    return;
  }
  if (!net.duel.canStart()) {
    if (game) resumeGame();
    return;
  }
  hideDialog();
  setMessage('Distribution des mains…');
  net.duel.hostStart({ rules: { ...config.rules }, deck: config.deck0 }).then(saveDuel);
}

function startMatch() {
  if (config.mode === 'online') return startOnlineMatch();

  selected = null;
  hoveredCell = null;
  busy = false;

  const deck0 = config.deck0 || 'vents';
  let deck1 = config.deck1;
  if (!deck1 || deck1 === 'random') {
    const keys = Object.keys(DECKS);
    deck1 = keys[randomInt(keys.length)];
  }
  setMatch(createMatch({ seed: randomUint32(), deck0, deck1, firstPlayer: randomInt(2), rules: config.rules }));
  localPlayerIndex = 0;

  navigateTo('game');

  const opener =
    config.mode === 'ai' && matchFirstPlayer === 0
      ? 'Vous engagez la manche.'
      : `${playerName(matchFirstPlayer)} engage la manche.`;
  setMessage(`${opener} ${turnMessage()}`);
  render();
  if (!isHuman(game.turn) && config.mode === 'ai') aiTurn();
}

function showMenu(opts = {}) {
  navigateTo('menu', opts);
  renderLobby();
}

function resumeGame(opts = {}) {
  if (!game) return showMenu(opts);
  navigateTo('game', opts);
  render();
}

// =========================================================================
// CODEX DES 100 CARTES & INSPECTEUR
// =========================================================================
function showCodex(opts = {}) {
  navigateTo('codex', opts);
  renderCodex();
}

function renderCodex() {
  ui.codexTabs.replaceChildren();
  const tabs = [
    { id: 'all', label: `Toutes (${CARDS.length})` },
    ...DECK_LIST.map((d) => ({
      id: d.id,
      label: `${d.badge} ${d.name} (${CARDS.filter((c) => c.deck === d.id).length})`,
    })),
  ];

  for (const t of tabs) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = `codex-tab ${activeCodexDeck === t.id ? 'active' : ''}`;
    b.textContent = t.label;
    b.addEventListener('click', () => {
      activeCodexDeck = t.id;
      sound.playUiClick();
      renderCodex();
    });
    ui.codexTabs.appendChild(b);
  }

  if (activeCodexDeck === 'all') {
    ui.codexDesc.textContent =
      'Parcourez les 100 cartes réparties dans les 4 factions. Cliquez sur une carte pour admirer son illustration et son histoire.';
  } else {
    const d = DECKS[activeCodexDeck];
    ui.codexDesc.textContent = `${d.subtitle} — ${d.description}`;
  }

  const lvlFilter = ui.codexFilterLevel.value;
  const filtered = CARDS.filter((c) => {
    if (activeCodexDeck !== 'all' && c.deck !== activeCodexDeck) return false;
    if (lvlFilter !== 'all' && String(c.level) !== lvlFilter) return false;
    return true;
  });

  ui.codexGrid.replaceChildren();
  for (const card of filtered) {
    const item = document.createElement('div');
    item.className = 'codex-item';
    const cEl = cardEl(card, 0);
    const sum = card.values.reduce((a, b) => a + b, 0);
    const elem = ELEMENTS[card.element] || ELEMENTS.vent;
    item.appendChild(cEl);

    const meta = document.createElement('div');
    meta.className = 'codex-meta';
    meta.innerHTML = `
      <div class="codex-role">${card.archetype || 'Unité'} • ${elem.icon} ${elem.name}</div>
      <div class="codex-sum">Puissance totale : ${sum}</div>
    `;
    item.appendChild(meta);
    item.addEventListener('click', () => {
      sound.playUiClick();
      showCardInspector(card);
    });
    ui.codexGrid.appendChild(item);
  }
}

function showCardInspector(card, bonusContext = null) {
  const deck = DECKS[card.deck] || DECKS.vents;
  const elem = ELEMENTS[card.element] || ELEMENTS.vent;
  const [t, r, b, l] = card.values.map(displayValue);
  const sum = card.values.reduce((acc, v) => acc + v, 0);
  const bonuses = bonusContext ? getCardBonuses(card, bonusContext) : null;
  const activeBonusHtml =
    bonuses && bonuses.reasons.length > 0
      ? `<div style="font-size:0.84rem;color:#6ee7b7;margin-top:4px;">
           Bonus actifs sur le plateau : <strong>${bonuses.reasons.join(' • ')}</strong> (Total : ${bonuses.totalMod > 0 ? `+${bonuses.totalMod}` : bonuses.totalMod})
         </div>`
      : '';

  showDialog(`
    <div class="inspector-layout">
      <div id="inspector-card-slot"></div>
      <div class="inspector-details">
        <div style="font-size:0.78rem;color:var(--gold);text-transform:uppercase;letter-spacing:0.12em;">
          ${deck.badge} ${deck.name} — Niveau ${card.level} (${'★'.repeat(card.level)})
        </div>
        <h2 style="margin:2px 0;">${card.name}</h2>
        <div style="font-size:0.86rem;color:var(--text-muted);">
          Archétype : <strong>${card.archetype || 'Combattant'}</strong> &nbsp;|&nbsp;
          Élément : <strong style="color:${elem.color}">${elem.icon} ${elem.name}</strong>
        </div>
        <p class="inspector-lore">« ${card.lore || 'Une créature ancienne des Quatre Vents.'} »</p>
        <div style="font-size:0.85rem;color:#e2e8f0;">
          Valeurs de base : <strong>Haut ${t}</strong> • <strong>Droite ${r}</strong> • <strong>Bas ${b}</strong> • <strong>Gauche ${l}</strong>
          <span style="color:var(--text-muted)">(Somme : ${sum})</span>
        </div>
        ${activeBonusHtml}
      </div>
    </div>
    <div class="dialog-actions">
      <button type="button" class="hud-btn" data-action="close">Fermer</button>
    </div>
  `);

  const slot = $('inspector-card-slot');
  if (slot) {
    slot.appendChild(cardEl(card, bonusContext?.owner ?? 0, bonusContext || {}));
  }
}

// `net: true` marque une fenêtre liée à la connexion, refermée automatiquement une fois connectés.
function showDialog(html, { net: isNetDialog = false } = {}) {
  ui.dialog.innerHTML = html;
  ui.dialog.dataset.net = isNetDialog ? '1' : '';
  ui.overlay.classList.remove('hidden');
  ui.dialog.querySelector('button')?.focus();
}

function hideDialog() {
  ui.overlay.classList.add('hidden');
}

function showRules() {
  showDialog(`
    <h2>Règles des Quatre Vents &amp; Jeu à Distance</h2>
    <ul class="rules-list">
      <li><strong>Principe :</strong> Chaque joueur reçoit <strong>5 cartes</strong> (une de chaque niveau, de ★ à ★★★★★) issues de son Deck. Chaque carte possède 4 valeurs directionnelles (Haut, Droite, Bas, Gauche, de 1 à A=10) et une affinité élémentaire.</li>
      <li><strong>Capture classique :</strong> Posez une carte sur une case libre de la grille 3×3. Toute carte adverse adjacente dont la valeur opposée est <strong>strictement inférieure</strong> est capturée.</li>
      <li><strong>Élémentaire :</strong> Les cases marquées d'un sceau élémentaire confèrent <strong>+1</strong> à toutes les valeurs d'une carte du même élément, et <strong>-1</strong> aux autres.</li>
      <li><strong>Synergie (Résonance &amp; Faction) :</strong> Une carte adjacente à au moins une carte alliée du <strong>même élément</strong> gagne <strong>+1 (Résonance)</strong>. Si elle est adjacente à au moins <strong>2 cartes alliées de la même Faction (Deck)</strong>, elle gagne <strong>+1 supplémentaire (Cohésion)</strong>. Tous ces bonus se cumulent et s'appliquent aux règles spéciales et aux combos !</li>
      <li><strong>Identique (Same) &amp; Plus :</strong> Capture si au moins 2 côtés adjacents ont des valeurs effectives égales (<em>Identique</em>) ou des sommes égales (<em>Plus</em>) aux valeurs opposées.</li>
      <li><strong>Combo (Cascade dynamique) :</strong> Toute carte retournée par <em>Identique</em> ou <em>Plus</em> (ainsi que toute carte alliée dont le bonus de synergie augmente suite à une capture) attaque immédiatement ses voisines avec ses valeurs effectives actualisées.</li>
      <li><strong>Mort Subite :</strong> En cas d'égalité, une nouvelle manche commence aussitôt : chacun reprend les cartes de sa couleur (plateau et main). Jusqu'à ${MAX_ROUNDS} manches au total, après quoi l'égalité est définitive.</li>
      <li><strong>Mur Identique :</strong> avec Identique, un côté de valeur A (10) posé contre le bord du plateau compte comme une égalité.</li>
      <li><strong>Duel à distance :</strong> l'hôte envoie un <strong>lien d'invitation</strong>, l'invité renvoie un <strong>lien de réponse</strong>, et les deux navigateurs se connectent en direct, sans serveur de jeu. Chacun tire sa main en secret et s'y engage par une empreinte cryptographique : personne ne voit la main de l'autre, et en fin de manche chaque main est vérifiée (une carte qui n'en faisait pas partie annule la partie). Une coupure met la partie en pause ; seul un abandon explicite compte comme une défaite.</li>
    </ul>
    <div class="dialog-actions">
      <button type="button" class="cta-btn" data-action="close">Compris</button>
    </div>
  `);
}

// =========================================================================
// GESTIONNAIRES D'ÉVÉNEMENTS GLOBAUX & LIENS DU DUEL (#join= / #reply=)
// =========================================================================
document.addEventListener('click', (e) => {
  const modeBtn = e.target.closest('[data-set-mode]');
  if (modeBtn) {
    selectMode(modeBtn.dataset.setMode);
    sound.playUiClick();
    renderRemoteSetupBox();
    return;
  }

  const diffBtn = e.target.closest('[data-set-diff]');
  if (diffBtn) {
    config.difficulty = diffBtn.dataset.setDiff;
    sound.playUiClick();
    document.querySelectorAll('[data-set-diff]').forEach((b) =>
      b.classList.toggle('active', b.dataset.setDiff === config.difficulty),
    );
    return;
  }

  const ruleBtn = e.target.closest('[data-toggle-rule]');
  if (ruleBtn) {
    const r = ruleBtn.dataset.toggleRule;
    config.rules[r] = !config.rules[r];
    sound.playUiClick();
    ruleBtn.classList.toggle('active', config.rules[r]);
    return;
  }

  const emoteBtn = e.target.closest('[data-emote]');
  if (emoteBtn) {
    const text = emoteBtn.dataset.emote;
    const index = EMOTES.indexOf(text);
    if (index < 0) return;
    sound.playUiClick();
    triggerComboBanner([text]);
    net.link?.send({ t: 'emote', e: index });
    return;
  }

  const btn = e.target.closest('button');
  if (!btn) {
    if (e.target === ui.overlay) hideDialog();
    return;
  }

  if (btn.id === 'btn-start-match') {
    sound.playUiClick();
    return startMatch();
  }

  if (NET_ACTIONS.has(btn.dataset.action)) {
    sound.playUiClick();
    handleNetAction(btn.dataset.action, btn).catch((err) => console.error(err));
    return;
  }

  switch (btn.dataset.action) {
    case 'rules':
      sound.playUiClick();
      return showRules();
    case 'codex':
      sound.playUiClick();
      if (currentScreen === 'codex') {
        return previousScreen === 'game' && game ? resumeGame() : showMenu();
      }
      return showCodex();
    case 'close-codex':
      sound.playUiClick();
      return previousScreen === 'game' && game ? resumeGame() : showMenu();
    case 'resume-game':
      sound.playUiClick();
      return resumeGame();
    case 'close':
      sound.playUiClick();
      return hideDialog();
    case 'again':
      sound.playUiClick();
      return startMatch();
    case 'menu':
      sound.playUiClick();
      return showMenu();
    case 'inspect-selected': {
      sound.playUiClick();
      if (!game) return;
      const hand = (game.hands[game.turn] || []).filter((c) => !c.hidden);
      const cardToInspect = selected !== null && game.hands[game.turn][selected] && !game.hands[game.turn][selected].hidden ? game.hands[game.turn][selected] : hand[0];
      if (cardToInspect) showCardInspector(cardToInspect);
      return;
    }
    case 'install-pwa':
      sound.playUiClick();
      if (deferredInstallPrompt) {
        deferredInstallPrompt.prompt();
        deferredInstallPrompt.userChoice.finally(() => {
          deferredInstallPrompt = null;
          ui.btnInstall?.classList.add('hidden');
        });
      }
      return;
    case 'toggle-sfx':
      sound.toggleSfx();
      return updateAudioButtons();
    case 'toggle-music':
      sound.toggleMusic();
      return updateAudioButtons();
  }
});

ui.selectDeck1?.addEventListener('change', (e) => {
  config.deck1 = e.target.value;
  sound.playUiClick();
});

ui.codexFilterLevel?.addEventListener('change', () => {
  sound.playUiClick();
  renderCodex();
});

$('brand-home')?.addEventListener('click', () => {
  sound.playUiClick();
  showMenu();
});

$('brand-home')?.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    sound.playUiClick();
    showMenu();
  }
});

window.addEventListener('popstate', (e) => {
  if (!ui.overlay.classList.contains('hidden')) {
    hideDialog();
    return;
  }
  const target = e.state?.screen || 'menu';
  if (target === 'game' && game) {
    resumeGame({ pushHistory: false });
  } else if (target === 'codex') {
    showCodex({ pushHistory: false });
  } else {
    showMenu({ pushHistory: false });
  }
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !ui.overlay.classList.contains('hidden')) {
    hideDialog();
  }
});

// Détection de l'invite d'installation PWA sur mobile / desktop
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredInstallPrompt = e;
  ui.btnInstall?.classList.remove('hidden');
});

// Initialisation : lien d'invitation (#join=…), lien de réponse (#reply=…) ou duel interrompu à reprendre.
// Le contenu des liens est placé après « # » : il ne quitte jamais le navigateur.
renderLobby();

async function initFromUrl() {
  const hash = typeof location !== 'undefined' ? location.hash : '';
  const hasJoin = /[#&]join=/.test(hash);
  const hasReply = /[#&]reply=/.test(hash);
  if (hasJoin || hasReply) {
    try {
      history.replaceState(null, '', `${location.pathname}${location.search}`);
    } catch {
      // Ignore
    }
  }

  if (!hasReply) {
    for (const role of DUEL_ROLES) {
      const saved = readSavedDuel(role);
      if (!saved) continue;
      if (await restoreSavedDuel(saved)) net.interrupted ||= saved;
      else forgetSavedDuel(role);
    }
  }

  if (hasJoin) return receiveInviteToken(hash);
  if (hasReply) return relayReply(hash);
  if (net.interrupted) {
    selectMode('online');
    renderRemoteSetupBox();
  }
  return undefined;
}

initFromUrl().catch((err) => console.error(err));

if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}
