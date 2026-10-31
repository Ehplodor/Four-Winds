import {
  createGame,
  play,
  previewMove,
  score,
  winner,
  getEffectiveValues,
  getCardBonuses,
} from './engine.js';
import { chooseMove } from './ai.js';
import {
  CARDS,
  DECKS,
  DECK_LIST,
  ELEMENTS,
  dealHands,
  displayValue,
  renderCardArtSVG,
} from './cards.js';
import { sound } from './audio.js';
import {
  createSeededRng,
  generateSeed,
  generateRoomCode,
  encodeCompactMatch,
  decodeCompactMatch,
  buildShareLinks,
  PeerRoomSession,
  renderShareCardSVG,
} from './network.js';

const AI_DELAY = 720;
const $ = (id) => document.getElementById(id);

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
  btnInstall: $('btn-install'),
  btnSfx: $('btn-sfx'),
  btnMusic: $('btn-music'),
  overlay: $('overlay'),
  dialog: $('dialog'),
};

// Configuration et état de la session
let config = {
  mode: 'ai', // 'ai' | 'local' | 'online' | 'sms'
  difficulty: 'tactician',
  deck0: 'vents',
  deck1: 'random',
  rules: {
    elemental: true,
    synergy: true,
    same: true,
    plus: true,
    combo: true,
    open: false,
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
  if (savedStats) stats = { ...stats, ...savedStats };
} catch {
  // Ignore
}

let game = null;
let matchSeed = generateSeed();
let matchFirstPlayer = 0;
let matchDecks = ['vents', 'forge'];
let matchMoves = [];
let localPlayerIndex = 0; // 0 pour l'hôte / joueur 1, 1 pour l'invité P2P
let peerSession = null;
let currentRoomCode = generateRoomCode();

let selected = null;
let hoveredCell = null;
let busy = false;
let flipped = [];
let placed = null;
let activeCodexDeck = 'all';
let deferredInstallPrompt = null;

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
    return p === localPlayerIndex ? `Vous (J${p + 1})` : `Adversaire P2P (J${p + 1})`;
  }
  if (config.mode === 'sms') {
    return p === 0 ? 'Joueur 1 (Initiateur)' : 'Joueur 2 (Invité)';
  }
  return p === 0 ? 'Joueur 1' : 'Joueur 2';
}

function isHuman(p) {
  if (config.mode === 'ai') return p === 0;
  if (config.mode === 'online') return p === localPlayerIndex;
  return true; // 'local' et 'sms'
}

function isHandVisible(p) {
  if (config.rules.open) return true;
  if (config.mode === 'ai') return p === 0;
  if (config.mode === 'online') return p === localPlayerIndex;
  return game ? game.turn === p : p === 0;
}

// Construit le jeton compact d'état de la partie en cours (pour SMS / Lien)
function getCurrentMatchToken() {
  return encodeCompactMatch({
    seed: matchSeed,
    deck0: matchDecks[0],
    deck1: matchDecks[1],
    firstPlayer: matchFirstPlayer,
    rules: game?.rules || config.rules,
    moves: matchMoves,
  });
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
  el.title = `${card.name} — Niv. ${card.level} (${elem.name})${bonusSuffix} • Appui long ou clic droit pour inspecter`;
  el.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    sound.playUiClick();
    showCardInspector(card, bonusContext);
  });

  // Appui long tactile sur les cartes du plateau (ou non jouables) pour ouvrir l'inspecteur
  let lpTimer = null;
  let startX = 0;
  let startY = 0;
  el.addEventListener('pointerdown', (e) => {
    if (e.button && e.button !== 0) return;
    startX = e.clientX;
    startY = e.clientY;
    clearTimeout(lpTimer);
    lpTimer = setTimeout(() => {
      lpTimer = null;
      navigator.vibrate?.(15);
      sound.playUiClick();
      showCardInspector(card, bonusContext);
    }, 480);
  });
  el.addEventListener('pointermove', (e) => {
    if (!lpTimer) return;
    if (Math.hypot(e.clientX - startX, e.clientY - startY) > 10) {
      clearTimeout(lpTimer);
      lpTimer = null;
    }
  });
  const clearLp = () => {
    if (lpTimer) {
      clearTimeout(lpTimer);
      lpTimer = null;
    }
  };
  el.addEventListener('pointerup', clearLp);
  el.addEventListener('pointercancel', clearLp);

  return el;
}

// Gestionnaire unifié Tactile + Souris (Pointer Events) pour les cartes jouables en main :
// - Tap court : sélectionne / désélectionne la carte
// - Glisser (Drag tactile ou souris) : crée une carte fantôme sous le doigt, prévisualise les captures sur la grille et dépose au relâchement
function attachTactilePlayableEvents(el, handIndex, card, owner) {
  let dragging = false;
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

  el.addEventListener('pointerdown', (e) => {
    if (e.button && e.button !== 0) return;
    if (busy || !game || game.over) return;
    activePointerId = e.pointerId;
    startX = e.clientX;
    startY = e.clientY;
    dragging = false;
    try {
      el.setPointerCapture(e.pointerId);
    } catch {
      // Ignore
    }
  });

  el.addEventListener('pointermove', (e) => {
    if (activePointerId !== e.pointerId) return;
    const dist = Math.hypot(e.clientX - startX, e.clientY - startY);

    if (!dragging && dist >= 10) {
      dragging = true;
      selected = handIndex;
      sound.playSelectCard();
      navigator.vibrate?.(10);

      // Marquer visuellement les cartes sélectionnées et les cases cibles sans détruire l'élément en cours de capture
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
    try {
      el.releasePointerCapture(e.pointerId);
    } catch {
      // Ignore
    }

    if (dragging) {
      const found = !cancelled ? findEmptyCellAt(e.clientX, e.clientY) : null;
      cleanupGhost();
      dragging = false;
      if (found) {
        navigator.vibrate?.(14);
        selected = handIndex;
        place(found.cellIdx);
      } else {
        hoveredCell = null;
        render();
      }
    } else if (!cancelled) {
      const dist = Math.hypot(e.clientX - startX, e.clientY - startY);
      if (dist < 10 && ui.overlay.classList.contains('hidden')) {
        select(handIndex);
      }
    }
  };

  el.addEventListener('pointerup', (e) => finishPointer(e, false));
  el.addEventListener('pointercancel', (e) => finishPointer(e, true));
}

// =========================================================================
// RENDU DU SALON (HUB) & CONFIGURATION P2P / SMS SANS SERVEUR
// =========================================================================
function renderRemoteSetupBox() {
  if (!ui.remoteSetupBox) return;
  if (config.mode !== 'online' && config.mode !== 'sms') {
    ui.remoteSetupBox.classList.add('hidden');
    return;
  }
  ui.remoteSetupBox.classList.remove('hidden');

  if (config.mode === 'online') {
    if (!peerSession) {
      initHostPeerSession(currentRoomCode, true);
    }
    const { url, smsHref, message } = buildShareLinks({ roomCode: currentRoomCode });
    const isConnected = peerSession?.peerConnected;

    ui.remoteSetupBox.innerHTML = `
      <div class="remote-cols">
        <div class="remote-card">
          <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;">
            <strong style="color:var(--gold)">Héberger un Salon P2P</strong>
            <span class="p2p-status-badge ${isConnected ? 'connected' : ''}" id="lobby-p2p-badge">
              ${isConnected ? '🟢 Adversaire connecté !' : '🟡 En attente d’un joueur…'}
            </span>
          </div>
          <div class="room-code-display">
            ${renderShareCardSVG(currentRoomCode)}
            <div>
              <div style="font-size:0.74rem;color:var(--text-muted);margin-bottom:4px;">Code de table sans serveur :</div>
              <div class="room-code-pill">${currentRoomCode}</div>
            </div>
          </div>
          <div class="remote-actions-row">
            <button type="button" class="hud-btn" id="btn-share-room">📱 Partager</button>
            <a class="sms-btn" href="${smsHref}">💬 Inviter par SMS</a>
            <button type="button" class="hud-btn" id="btn-copy-room">📋 Copier le lien</button>
          </div>
        </div>

        <div class="remote-card">
          <strong style="color:var(--gold)">Rejoindre le Salon d'un Ami</strong>
          <p style="margin:0;font-size:0.8rem;color:var(--text-muted);">
            Saisissez le code à 6 caractères communiqué par votre adversaire (ou cliquez directement sur son lien SMS/WhatsApp) :
          </p>
          <div class="remote-input-row">
            <input type="text" id="input-join-code" class="modern-input" maxlength="8" placeholder="Ex: ${currentRoomCode}" />
            <button type="button" class="cta-btn" id="btn-join-room" style="padding:8px 18px;font-size:0.9rem;">Rejoindre</button>
          </div>
          <div style="font-size:0.75rem;color:var(--text-muted);">
            Connexion directe chiffrée WebRTC + relais WSS publics automatiques. En cas de coupure réseau, bascule possible par SMS à tout moment.
          </div>
        </div>
      </div>
    `;

    $('btn-share-room')?.addEventListener('click', async () => {
      sound.playUiClick();
      if (navigator.share) {
        try {
          await navigator.share({ title: 'Les Quatre Vents — Table P2P', text: message, url });
          return;
        } catch {
          // Fallback copie
        }
      }
      await navigator.clipboard?.writeText(url);
      $('btn-share-room').textContent = '✓ Lien copié !';
    });

    $('btn-copy-room')?.addEventListener('click', async () => {
      sound.playUiClick();
      await navigator.clipboard?.writeText(url);
      $('btn-copy-room').textContent = '✓ Copié !';
    });

    $('btn-join-room')?.addEventListener('click', () => {
      const code = ($('input-join-code')?.value || '').trim().toUpperCase();
      if (!code) return;
      sound.playUiClick();
      joinPeerRoom(code);
    });
  } else if (config.mode === 'sms') {
    ui.remoteSetupBox.innerHTML = `
      <div class="remote-cols">
        <div class="remote-card">
          <strong style="color:var(--gold)">💬 Mode Universel par SMS / Lien Compact</strong>
          <p style="margin:0;font-size:0.82rem;color:var(--text-muted);line-height:1.45;">
            Jouez à distance avec n'importe quel smartphone <strong>sans aucun serveur ni connexion simultanée</strong>.
            Chaque coup génère un lien ultra-compact (~22 caractères) contenant toute la partie, prêt à être envoyé en 1 tap par <strong>SMS, WhatsApp ou Signal</strong>.
          </p>
        </div>
        <div class="remote-card">
          <strong style="color:var(--gold)">Reprendre un code reçu par SMS</strong>
          <div class="remote-input-row">
            <input type="text" id="input-sms-token" class="modern-input" placeholder="Coller un code 1.xxx.xxx ou lien…" />
            <button type="button" class="hud-btn" id="btn-load-sms">Charger</button>
          </div>
        </div>
      </div>
    `;

    $('btn-load-sms')?.addEventListener('click', () => {
      const raw = ($('input-sms-token')?.value || '').trim();
      if (!raw) return;
      sound.playUiClick();
      const extracted = raw.includes('turn=')
        ? decodeURIComponent(raw.split('turn=')[1].split('&')[0])
        : raw;
      loadMatchFromCompactToken(extracted);
    });
  }
}

function initHostPeerSession(roomCode, asHost = true) {
  if (peerSession) peerSession.close();
  currentRoomCode = roomCode.toUpperCase();
  localPlayerIndex = asHost ? 0 : 1;

  peerSession = new PeerRoomSession({
    roomCode: currentRoomCode,
    isHost: asHost,
    onStatus: ({ state }) => {
      const badge = $('lobby-p2p-badge');
      if (badge) {
        const ok = state === 'connected' || state === 'connected-webrtc';
        badge.className = `p2p-status-badge ${ok ? 'connected' : ''}`;
        badge.textContent = ok
          ? state === 'connected-webrtc'
            ? '🟢 Connecté en WebRTC Direct !'
            : '🟢 Adversaire connecté !'
          : `🟡 Salon ${currentRoomCode} en attente…`;
      }
      if (ui.netIndicator) {
        ui.netIndicator.textContent =
          state === 'connected-webrtc'
            ? `🟢 P2P WebRTC Direct (Salon ${currentRoomCode})`
            : `🟢 P2P Connecté (Salon ${currentRoomCode})`;
      }
    },
    onPeerJoined: () => {
      sound.playSelectCard();
      const badge = $('lobby-p2p-badge');
      if (badge) {
        badge.className = 'p2p-status-badge connected';
        badge.textContent = '🟢 Adversaire connecté !';
      }
      // Si l'hôte a déjà ouvert le plateau, il synchronise immédiatement la partie avec l'invité
      if (asHost && game && !ui.game.classList.contains('hidden')) {
        peerSession.sendSignal({
          type: 'game-start',
          seed: matchSeed,
          deck0: matchDecks[0],
          deck1: matchDecks[1],
          firstPlayer: matchFirstPlayer,
          rules: game.rules,
          moves: matchMoves,
        });
      }
    },
    onGameStart: (pkt) => {
      sound.playSelectCard();
      startFromRemotePacket(pkt);
    },
    onMove: (pkt) => {
      if (!game || game.over) return;
      if (game.turn !== localPlayerIndex && typeof pkt.handIndex === 'number' && typeof pkt.cell === 'number') {
        applyMove(pkt.handIndex, pkt.cell, { fromRemote: true });
      }
    },
    onEmote: (pkt) => {
      if (pkt.text) {
        sound.playUiClick();
        triggerComboBanner([pkt.text]);
      }
    },
  });
  peerSession.start();
}

function joinPeerRoom(code) {
  config.mode = 'online';
  initHostPeerSession(code, false);
  renderRemoteSetupBox();
  showDialog(`
    <h2>Connexion au Salon ${code}</h2>
    <p style="color:var(--text-muted);line-height:1.5;">
      Recherche de l'hôte du salon <strong>${code}</strong> via WebRTC / Relais P2P…<br>
      Dès que l'hôte lance la partie (ou si la table est déjà ouverte), le plateau s'ouvrira automatiquement.
    </p>
    <div class="dialog-actions">
      <button type="button" class="hud-btn" data-action="close">Patienter dans le Salon</button>
    </div>
  `);
}

function startFromRemotePacket(pkt) {
  config.mode = 'online';
  matchSeed = pkt.seed;
  matchFirstPlayer = pkt.firstPlayer;
  matchDecks = [pkt.deck0 || 'vents', pkt.deck1 || 'forge'];
  matchMoves = [];

  const rng = createSeededRng(matchSeed);
  const hands = dealHands(rng, { deck0: matchDecks[0], deck1: matchDecks[1] });
  game = createGame({
    hands,
    firstPlayer: matchFirstPlayer,
    rules: pkt.rules || config.rules,
    rng,
  });

  if (Array.isArray(pkt.moves)) {
    for (const m of pkt.moves) {
      game = play(game, m.handIndex, m.cell).state;
      matchMoves.push(m);
    }
  }

  ui.menu.classList.add('hidden');
  ui.codex.classList.add('hidden');
  ui.game.classList.remove('hidden');
  ui.netStatusBar?.classList.remove('hidden');
  hideDialog();
  setMessage(turnMessage());
  render();
}

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
    ['plus', 'Plus'],
    ['combo', 'Combo'],
    ['open', 'Main Ouverte'],
  ];
  for (const [key, label] of labels) {
    if (game.rules[key]) {
      const tag = document.createElement('span');
      tag.className = 'rule-tag';
      tag.textContent = label;
      ui.activeRulesBar.appendChild(tag);
    }
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
  ui.netStatusBar?.classList.toggle('hidden', config.mode !== 'online' && config.mode !== 'sms');
  if (config.mode === 'sms' && ui.netIndicator) {
    ui.netIndicator.textContent = `💬 Mode SMS / Lien Universel — Coup #${matchMoves.length + 1}/9`;
  }

  for (const p of [0, 1]) {
    ui.names[p].textContent = playerName(p);
    const deckInfo = DECKS[matchDecks[p]] || DECKS.vents;
    ui.deckTags[p].textContent = `${deckInfo.badge} ${deckInfo.name}`;
    ui.sidePanels[p].classList.toggle('active-turn', !game.over && game.turn === p);

    const handEl = ui.hands[p];
    handEl.replaceChildren();
    const visible = isHandVisible(p);

    game.hands[p].forEach((card, i) => {
      const el = cardEl(card, p, { hidden: !visible });
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
    return p === localPlayerIndex
      ? 'À votre tour de jouer (P2P en direct).'
      : 'En attente du coup de votre adversaire…';
  }
  if (config.mode === 'sms') {
    return `${playerName(p)} : jouez votre coup puis envoyez le lien par SMS / Messagerie.`;
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

function applyMove(handIndex, cell, { fromRemote = false } = {}) {
  const res = play(game, handIndex, cell);
  const totalMod = res.placedBonuses?.totalMod || 0;
  game = res.state;
  matchMoves.push({ handIndex, cell });
  flipped = res.captured;
  placed = cell;
  selected = null;
  hoveredCell = null;

  // En mode P2P en ligne, transmettre immédiatement le coup à l'adversaire
  if (config.mode === 'online' && !fromRemote && peerSession) {
    peerSession.sendSignal({
      type: 'game-move',
      handIndex,
      cell,
      token: getCurrentMatchToken(),
    });
  }

  sound.playPlaceCard(totalMod);
  if (res.captured.length > 0) {
    const isSpecial = res.events.tags.length > 0;
    setTimeout(() => sound.playCapture(res.captured.length, isSpecial), 90);
  }
  if (res.events.tags.length > 0) {
    triggerComboBanner(res.events.tags);
  }

  render();

  // Mise à jour de l'URL sans rechargement en mode SMS pour pouvoir partager à tout moment
  if (config.mode === 'sms' && typeof history !== 'undefined') {
    const token = getCurrentMatchToken();
    history.replaceState(null, '', `?turn=${encodeURIComponent(token)}`);
  }

  if (game.over) return endGame();
  setMessage(turnMessage());

  if (config.mode === 'sms' && !fromRemote) {
    setTimeout(() => showShareTurnDialog(), 520);
    return;
  }

  if (!isHuman(game.turn) && config.mode === 'ai') aiTurn();
}

function place(cell) {
  if (selected === null || busy) return;
  applyMove(selected, cell);
}

function aiTurn() {
  busy = true;
  render();
  const current = game;
  setTimeout(() => {
    if (game !== current) return;
    busy = false;
    const m = chooseMove(game, { difficulty: config.difficulty });
    applyMove(m.handIndex, m.cell);
  }, AI_DELAY);
}

// Boîte de dialogue d'envoi de coup par SMS / Lien (Mode SMS ou Fallback P2P)
function showShareTurnDialog() {
  if (!game) return;
  const token = getCurrentMatchToken();
  const [s0, s1] = score(game);
  const { url, message, smsHref } = buildShareLinks({
    token,
    scoreText: `${s0}-${s1}`,
  });

  showDialog(`
    <h2>💬 Envoyer votre coup à distance</h2>
    <p style="color:var(--text-muted);font-size:0.9rem;line-height:1.45;">
      Toute la partie (plateau, mains, éléments et votre dernier coup) est condensée dans ce code de <strong>${token.length} caractères</strong>.
      Votre adversaire n'a qu'à toucher le lien dans son SMS ou sa messagerie pour jouer son tour !
    </p>
    <div class="room-code-display" style="margin:12px 0;justify-content:center;">
      ${renderShareCardSVG(token)}
      <div class="room-code-pill" style="font-size:1rem;letter-spacing:0.06em;word-break:break-all;">${token}</div>
    </div>
    <div class="dialog-actions">
      <a class="sms-btn" href="${smsHref}">💬 Envoyer par SMS</a>
      <button type="button" class="cta-btn" id="btn-native-share-turn" style="padding:9px 20px;font-size:0.92rem;">📱 Partager le lien</button>
      <button type="button" class="hud-btn" id="btn-copy-turn-link">📋 Copier le lien</button>
      <button type="button" class="hud-btn" data-action="close">Continuer sur cet écran</button>
    </div>
  `);

  $('btn-native-share-turn')?.addEventListener('click', async () => {
    sound.playUiClick();
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Les Quatre Vents — Ton tour !', text: message, url });
        return;
      } catch {
        // Fallback copie
      }
    }
    await navigator.clipboard?.writeText(url);
    $('btn-native-share-turn').textContent = '✓ Lien copié !';
  });

  $('btn-copy-turn-link')?.addEventListener('click', async () => {
    sound.playUiClick();
    await navigator.clipboard?.writeText(url);
    $('btn-copy-turn-link').textContent = '✓ Lien copié !';
  });
}

function loadMatchFromCompactToken(token) {
  const decoded = decodeCompactMatch(token);
  if (!decoded) {
    showDialog(`
      <h2>Code de partie invalide</h2>
      <p style="color:var(--text-muted)">Le lien ou code saisi n'a pas pu être reconnu.</p>
      <div class="dialog-actions"><button type="button" class="hud-btn" data-action="close">Fermer</button></div>
    `);
    return;
  }

  config.mode = 'sms';
  matchSeed = decoded.seed;
  matchFirstPlayer = decoded.firstPlayer;
  matchDecks = [decoded.deck0, decoded.deck1];
  matchMoves = decoded.moves;
  game = decoded.game;

  if (decoded.lastMoveResult && decoded.moves.length > 0) {
    const lastMove = decoded.moves[decoded.moves.length - 1];
    placed = lastMove.cell;
    flipped = decoded.lastMoveResult.captured || [];
  }

  ui.menu.classList.add('hidden');
  ui.codex.classList.add('hidden');
  ui.game.classList.remove('hidden');
  hideDialog();

  if (game.over) {
    render();
    endGame();
  } else {
    setMessage(`Coup adverse reçu ! ${turnMessage()}`);
    render();
  }
}

function endGame() {
  const w = winner(game);
  const [s0, s1] = score(game);

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

  let title;
  if (w === 'draw') {
    title = 'Égalité Parfaite';
    sound.playEndGame('draw');
  } else if (config.mode === 'ai' || config.mode === 'online') {
    title = w === localPlayerIndex ? 'Victoire Triomphale !' : 'Défaite…';
    sound.playEndGame(w === localPlayerIndex ? 'win' : 'lose');
  } else {
    title = `${playerName(w)} remporte la manche !`;
    sound.playEndGame('win');
  }

  const token = getCurrentMatchToken();
  const { smsHref } = buildShareLinks({ token, scoreText: `Score final ${s0}-${s1}` });
  const smsFinalBtn =
    config.mode === 'sms' || config.mode === 'online'
      ? `<a class="sms-btn" href="${smsHref}">💬 Envoyer le résultat par SMS</a>`
      : '';

  setMessage(`${title} (${s0} – ${s1})`);
  setTimeout(() => {
    showDialog(`
      <h2 class="result">${title}</h2>
      <p class="final-score"><span class="s0">${s0}</span> – <span class="s1">${s1}</span></p>
      <p style="text-align:center;color:var(--text-muted);margin:0 0 12px;font-size:0.9rem;">
        ${DECKS[matchDecks[0]].badge} ${DECKS[matchDecks[0]].name} &nbsp;contre&nbsp; ${DECKS[matchDecks[1]].badge} ${DECKS[matchDecks[1]].name}
      </p>
      <div class="dialog-actions">
        ${smsFinalBtn}
        <button type="button" class="cta-btn" data-action="again">Rejouer la Manche</button>
        <button type="button" class="hud-btn" data-action="menu">Retour au Salon</button>
      </div>
    `);
  }, 850);
}

function startMatch() {
  selected = null;
  hoveredCell = null;
  busy = false;
  matchMoves = [];
  matchSeed = generateSeed();

  const rng = createSeededRng(matchSeed);
  const deck0 = config.deck0 || 'vents';
  let deck1 = config.deck1;
  if (!deck1 || deck1 === 'random') {
    const keys = Object.keys(DECKS);
    deck1 = keys[Math.floor(rng() * keys.length)];
  }
  matchDecks = [deck0, deck1];

  matchFirstPlayer = rng() < 0.5 ? 0 : 1;
  const hands = dealHands(rng, { deck0, deck1 });
  game = createGame({
    hands,
    firstPlayer: matchFirstPlayer,
    rules: config.rules,
    rng,
  });

  if (config.mode === 'online' && peerSession) {
    localPlayerIndex = peerSession.isHost ? 0 : 1;
    peerSession.sendSignal({
      type: 'game-start',
      seed: matchSeed,
      deck0,
      deck1,
      firstPlayer: matchFirstPlayer,
      rules: config.rules,
      moves: [],
    });
  } else {
    localPlayerIndex = 0;
  }

  ui.menu.classList.add('hidden');
  ui.codex.classList.add('hidden');
  ui.game.classList.remove('hidden');
  hideDialog();

  const opener =
    config.mode === 'ai' && matchFirstPlayer === 0
      ? 'Vous engagez la manche.'
      : `${playerName(matchFirstPlayer)} engage la manche.`;
  setMessage(`${opener} ${turnMessage()}`);
  render();
  if (!isHuman(game.turn) && config.mode === 'ai') aiTurn();
}

function showMenu() {
  hideDialog();
  if (typeof history !== 'undefined' && window.location.search) {
    history.replaceState(null, '', window.location.pathname);
  }
  ui.game.classList.add('hidden');
  ui.codex.classList.add('hidden');
  ui.menu.classList.remove('hidden');
  renderLobby();
}

// =========================================================================
// CODEX DES 100 CARTES & INSPECTEUR
// =========================================================================
function showCodex() {
  hideDialog();
  ui.menu.classList.add('hidden');
  ui.game.classList.add('hidden');
  ui.codex.classList.remove('hidden');
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

function showDialog(html) {
  ui.dialog.innerHTML = html;
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
      <li><strong>Duel à Distance sans serveur (P2P &amp; SMS) :</strong> Affrontez un joueur distant en direct via un simple <strong>Code de Salon à 6 lettres</strong> (WebRTC P2P) ou en mode <strong>SMS / Lien Compact</strong> universel !</li>
    </ul>
    <div class="dialog-actions">
      <button type="button" class="cta-btn" data-action="close">Compris</button>
    </div>
  `);
}

// =========================================================================
// GESTIONNAIRES D'ÉVÉNEMENTS GLOBAUX & PARAMÈTRES D'URL (?room= / ?turn=)
// =========================================================================
document.addEventListener('click', (e) => {
  const modeBtn = e.target.closest('[data-set-mode]');
  if (modeBtn) {
    config.mode = modeBtn.dataset.setMode;
    sound.playUiClick();
    document.querySelectorAll('[data-set-mode]').forEach((b) =>
      b.classList.toggle('active', b.dataset.setMode === config.mode),
    );
    $('diff-selector').classList.toggle('hidden', config.mode !== 'ai');
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
    sound.playUiClick();
    triggerComboBanner([text]);
    peerSession?.sendSignal({ type: 'game-emote', text });
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

  switch (btn.dataset.action) {
    case 'rules':
      sound.playUiClick();
      return showRules();
    case 'codex':
      sound.playUiClick();
      return showCodex();
    case 'close-codex':
      sound.playUiClick();
      return showMenu();
    case 'close':
      sound.playUiClick();
      return hideDialog();
    case 'again':
      sound.playUiClick();
      return startMatch();
    case 'menu':
      sound.playUiClick();
      return showMenu();
    case 'share-turn':
      sound.playUiClick();
      return showShareTurnDialog();
    case 'inspect-selected': {
      sound.playUiClick();
      if (!game) return;
      const hand = game.hands[game.turn] || [];
      const cardToInspect = selected !== null && hand[selected] ? hand[selected] : hand[0];
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

// Initialisation et lecture automatique d'un lien reçu par SMS / Messagerie (?turn=... ou ?room=...)
renderLobby();

if (typeof window !== 'undefined') {
  const params = new URLSearchParams(window.location.search);
  const turnToken = params.get('turn');
  const roomParam = params.get('room');

  if (turnToken) {
    document.querySelectorAll('[data-set-mode]').forEach((b) =>
      b.classList.toggle('active', b.dataset.setMode === 'sms'),
    );
    $('diff-selector')?.classList.add('hidden');
    loadMatchFromCompactToken(turnToken);
  } else if (roomParam) {
    document.querySelectorAll('[data-set-mode]').forEach((b) =>
      b.classList.toggle('active', b.dataset.setMode === 'online'),
    );
    $('diff-selector')?.classList.add('hidden');
    joinPeerRoom(roomParam.trim().toUpperCase());
  }
}

if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}
