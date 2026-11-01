// Moteur Audio procédural via Web Audio API (aucun fichier externe requis, fonctionne 100% hors-ligne).
// Bruitages de cartes (sélection, pose, capture, combo, fin de partie) et musique générative (music.js).
//
// Pour rester agréables à la longue, les bruitages :
// - passent par un bus commun filtré (aigus adoucis) et un compresseur doux ;
// - utilisent des ondes douces (sinus, triangle filtré), des attaques arrondies et des volumes bas ;
// - varient légèrement de hauteur à chaque déclenchement (moins de répétition mécanique) ;
// - sont limités en cadence (un survol rapide de la main ne mitraille plus).

import { createComposer, midiToFreq, STEPS_PER_BAR } from './music.js';
import { createSeededRng, randomUint32 } from './rng.js';

// Gamme pentatonique de La mineur : les bruitages restent consonants entre eux et avec la musique.
const PENTA = [440, 523.25, 587.33, 659.25, 783.99, 880, 1046.5, 1174.66];

const MIN_GAP = { hover: 0.12, click: 0.05, select: 0.06, place: 0.05, capture: 0.08 };

class SoundManager {
  constructor() {
    this.ctx = null;
    this.sfxEnabled = true;
    this.musicEnabled = false;
    this.musicTimer = null;
    this.musicBus = null;
    this.sfxBus = null;
    this.master = null;
    this.noise = null;
    this.lastPlayed = {};
    this.startingMusic = false;

    try {
      const saved = JSON.parse(localStorage.getItem('qv_audio') || '{}');
      if (typeof saved.sfx === 'boolean') this.sfxEnabled = saved.sfx;
      if (typeof saved.music === 'boolean') this.musicEnabled = saved.music;
    } catch {
      // Ignore storage errors
    }
  }

  init() {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return null;
      this.ctx = new AudioCtx();
      this.buildGraph();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    // La musique mémorisée comme active reprend dès la première interaction.
    if (this.musicEnabled && !this.musicTimer && !this.startingMusic) this.startMusic();
    return this.ctx;
  }

  buildGraph() {
    const ctx = this.ctx;
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -20;
    comp.knee.value = 18;
    comp.ratio.value = 3;
    comp.attack.value = 0.01;
    comp.release.value = 0.2;
    this.master = ctx.createGain();
    this.master.gain.value = 0.9;
    this.master.connect(comp);
    comp.connect(ctx.destination);

    // Bus des bruitages : coupe les aigus agressifs.
    const sfxFilter = ctx.createBiquadFilter();
    sfxFilter.type = 'lowpass';
    sfxFilter.frequency.value = 3200;
    sfxFilter.Q.value = 0.5;
    this.sfxBus = ctx.createGain();
    this.sfxBus.gain.value = 1;
    this.sfxBus.connect(sfxFilter);
    sfxFilter.connect(this.master);

    // Bruit blanc réutilisé (percussions, frottement de carte).
    const len = Math.floor(ctx.sampleRate * 0.5);
    this.noise = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = this.noise.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
  }

  savePrefs() {
    try {
      localStorage.setItem(
        'qv_audio',
        JSON.stringify({ sfx: this.sfxEnabled, music: this.musicEnabled }),
      );
    } catch {
      // Ignore
    }
  }

  toggleSfx() {
    this.sfxEnabled = !this.sfxEnabled;
    this.savePrefs();
    if (this.sfxEnabled) this.playUiClick();
    return this.sfxEnabled;
  }

  toggleMusic() {
    this.musicEnabled = !this.musicEnabled;
    this.savePrefs();
    if (this.musicEnabled) {
      this.startMusic();
    } else {
      this.stopMusic();
    }
    return this.musicEnabled;
  }

  // Limite la cadence d'un même bruitage (renvoie false s'il vient d'être joué).
  throttle(name) {
    const now = typeof performance !== 'undefined' ? performance.now() / 1000 : Date.now() / 1000;
    if (now - (this.lastPlayed[name] || 0) < (MIN_GAP[name] || 0)) return false;
    this.lastPlayed[name] = now;
    return true;
  }

  // Légère variation de hauteur (±1,5 %) pour éviter l'effet « disque rayé ».
  vary(freq) {
    return freq * (1 + (Math.random() - 0.5) * 0.03);
  }

  tone({
    freq = 440,
    type = 'sine',
    duration = 0.12,
    gain = 0.05,
    delay = 0,
    at = null,
    slideTo = null,
    attack = 0.01,
    cutoff = null,
    dest = null,
  }) {
    const ctx = this.init();
    if (!ctx) return;
    const now = at ?? ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, now + duration);

    const a = Math.min(attack, duration * 0.5);
    g.gain.setValueAtTime(0.0001, now);
    g.gain.linearRampToValueAtTime(gain, now + a);
    g.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    let out = osc;
    if (cutoff) {
      const f = ctx.createBiquadFilter();
      f.type = 'lowpass';
      f.frequency.value = cutoff;
      osc.connect(f);
      out = f;
    }
    out.connect(g);
    g.connect(dest || this.sfxBus || ctx.destination);
    osc.start(now);
    osc.stop(now + duration + 0.05);
  }

  // Clochette douce : fondamentale + harmonique discrète, extinction naturelle.
  bell(freq, { gain = 0.04, delay = 0, at = null, duration = 0.5, dest = null } = {}) {
    this.tone({ freq, type: 'sine', duration, gain, delay, at, attack: 0.008, dest });
    this.tone({ freq: freq * 2, type: 'sine', duration: duration * 0.45, gain: gain * 0.18, delay, at, attack: 0.005, dest });
  }

  noiseBurst({ at, duration = 0.05, gain = 0.02, type = 'highpass', freq = 6000, q = 0.7, dest = null }) {
    const ctx = this.ctx;
    if (!ctx || !this.noise) return;
    const src = ctx.createBufferSource();
    src.buffer = this.noise;
    const f = ctx.createBiquadFilter();
    f.type = type;
    f.frequency.value = freq;
    f.Q.value = q;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, at);
    g.gain.linearRampToValueAtTime(gain, at + 0.004);
    g.gain.exponentialRampToValueAtTime(0.0001, at + duration);
    src.connect(f);
    f.connect(g);
    g.connect(dest || this.sfxBus);
    src.start(at, Math.random() * 0.3);
    src.stop(at + duration + 0.02);
  }

  // ─── Bruitages ──────────────────────────────────────────────────────────────

  playHover() {
    if (!this.sfxEnabled || !this.throttle('hover')) return;
    this.tone({ freq: this.vary(740), duration: 0.05, gain: 0.008, attack: 0.012 });
  }

  playUiClick() {
    if (!this.sfxEnabled || !this.throttle('click')) return;
    this.tone({ freq: this.vary(560), duration: 0.07, gain: 0.03, attack: 0.004, slideTo: 620 });
  }

  playSelectCard() {
    if (!this.sfxEnabled || !this.throttle('select')) return;
    this.tone({ freq: this.vary(523.25), duration: 0.12, gain: 0.032, attack: 0.008, slideTo: 587.33 });
    this.tone({ freq: this.vary(783.99), duration: 0.16, gain: 0.012, attack: 0.02, delay: 0.03 });
  }

  playPlaceCard(elementMod = 0) {
    if (!this.sfxEnabled || !this.throttle('place')) return;
    const ctx = this.init();
    if (!ctx) return;
    // Carte posée sur la pierre : bruit sourd et feutré + léger frottement.
    this.tone({ freq: this.vary(150), type: 'sine', duration: 0.14, gain: 0.08, attack: 0.006, slideTo: 80 });
    this.noiseBurst({ at: ctx.currentTime, duration: 0.07, gain: 0.012, type: 'bandpass', freq: 1400, q: 0.8 });
    if (elementMod > 0) {
      // Résonance élémentaire (+1) : deux clochettes claires mais discrètes.
      this.bell(659.25, { gain: 0.03, delay: 0.06, duration: 0.45 });
      this.bell(987.77, { gain: 0.022, delay: 0.12, duration: 0.5 });
    } else if (elementMod < 0) {
      // Affaiblissement (-1) : note grave qui retombe, sans grincement.
      this.tone({ freq: 233.08, type: 'triangle', duration: 0.28, gain: 0.03, delay: 0.05, slideTo: 207.65, cutoff: 900, attack: 0.03 });
    }
  }

  playCapture(count = 1, isSpecial = false) {
    if (!this.sfxEnabled || !this.throttle('capture')) return;
    const start = isSpecial ? 2 : 0;
    const steps = Math.min(isSpecial ? 5 : 3, Math.max(2, count + 1));
    for (let i = 0; i < steps; i++) {
      this.bell(PENTA[start + i], {
        gain: (isSpecial ? 0.036 : 0.032) * (1 - i * 0.08),
        delay: i * (isSpecial ? 0.075 : 0.06),
        duration: i === steps - 1 ? 0.6 : 0.35,
      });
    }
  }

  playEndGame(result) {
    if (!this.sfxEnabled) return;
    if (result === 'win') {
      [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => {
        this.bell(f, { gain: 0.04, delay: i * 0.12, duration: i === 3 ? 1.1 : 0.4 });
      });
      this.tone({ freq: 261.63, type: 'triangle', duration: 1.2, gain: 0.025, delay: 0.36, attack: 0.08, cutoff: 1200 });
    } else if (result === 'lose') {
      [392.0, 349.23, 311.13, 261.63].forEach((f, i) => {
        this.tone({ freq: f, type: 'sine', duration: i === 3 ? 0.8 : 0.3, gain: 0.035, delay: i * 0.16, attack: 0.03 });
      });
    } else {
      this.bell(440, { gain: 0.035, duration: 0.4 });
      this.bell(523.25, { gain: 0.035, delay: 0.16, duration: 0.6 });
    }
  }

  // ─── Musique générative ─────────────────────────────────────────────────────

  startMusic() {
    if (!this.musicEnabled) return;
    this.stopMusic();
    this.startingMusic = true;
    const ctx = this.init();
    this.startingMusic = false;
    if (!ctx) return;

    // Bus dédié (recréé à chaque lancement pour couper net les notes déjà programmées à l'arrêt).
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 5000;
    this.musicBus = ctx.createGain();
    this.musicBus.gain.setValueAtTime(0.0001, ctx.currentTime);
    this.musicBus.gain.linearRampToValueAtTime(0.55, ctx.currentTime + 1.5);
    this.musicBus.connect(lp);
    lp.connect(this.master);
    this.musicOut = lp;

    this.composer = createComposer(createSeededRng(randomUint32()));
    this.stepDur = 60 / this.composer.tempo / 4;
    this.nextBarTime = ctx.currentTime + 0.15;
    this.musicTimer = setInterval(() => this.scheduleMusic(), 100);
    this.scheduleMusic();
  }

  // Programme les mesures à venir avec un peu d'avance (horloge audio précise, pas de dérive).
  scheduleMusic() {
    const ctx = this.ctx;
    if (!ctx || !this.musicBus) return;
    const now = ctx.currentTime;
    if ((typeof document !== 'undefined' && document.hidden) || ctx.state !== 'running') {
      this.nextBarTime = Math.max(this.nextBarTime, now + 0.15);
      return;
    }
    if (this.nextBarTime < now) this.nextBarTime = now + 0.05; // rattrapage après une pause
    while (this.nextBarTime < now + 0.4) {
      const { events } = this.composer.nextBar();
      for (const ev of events) this.playMusicEvent(ev, this.nextBarTime);
      this.nextBarTime += this.stepDur * STEPS_PER_BAR;
    }
  }

  playMusicEvent(ev, barTime) {
    const at = barTime + ev.step * this.stepDur;
    const dur = ev.len * this.stepDur;
    const dest = this.musicBus;
    const v = ev.vel ?? 1;
    switch (ev.voice) {
      case 'pad': {
        const f = midiToFreq(ev.midi);
        // Nappe chaude : deux triangles légèrement désaccordés, attaque lente.
        this.tone({ freq: f * 0.997, type: 'triangle', duration: dur + 0.3, gain: 0.014, at, attack: 0.5, cutoff: 1100, dest });
        this.tone({ freq: f * 1.003, type: 'triangle', duration: dur + 0.3, gain: 0.014, at, attack: 0.5, cutoff: 1100, dest });
        break;
      }
      case 'arp':
        this.tone({ freq: midiToFreq(ev.midi), type: 'sine', duration: Math.max(0.16, dur * 1.4), gain: 0.022 * v, at, attack: 0.006, dest });
        break;
      case 'bass':
        this.tone({ freq: midiToFreq(ev.midi), type: 'triangle', duration: dur * 0.95, gain: 0.07 * v, at, attack: 0.01, cutoff: 600, dest });
        break;
      case 'lead':
        this.tone({ freq: midiToFreq(ev.midi), type: 'triangle', duration: dur * 1.1, gain: 0.03 * v, at, attack: 0.02, cutoff: 2200, dest });
        break;
      case 'kick':
        this.tone({ freq: 110, type: 'sine', duration: 0.22, gain: 0.11 * v, at, attack: 0.003, slideTo: 42, dest });
        break;
      case 'hat':
        this.noiseBurst({ at, duration: 0.035, gain: 0.012 * v, type: 'highpass', freq: 7500, dest });
        break;
      case 'snare':
        this.noiseBurst({ at, duration: 0.12, gain: 0.03 * v, type: 'bandpass', freq: 1900, q: 0.9, dest });
        this.tone({ freq: 190, type: 'sine', duration: 0.07, gain: 0.02 * v, at, attack: 0.003, dest });
        break;
      default:
        break;
    }
  }

  stopMusic() {
    if (this.musicTimer) {
      clearInterval(this.musicTimer);
      this.musicTimer = null;
    }
    if (this.musicBus && this.ctx) {
      const bus = this.musicBus;
      const out = this.musicOut;
      const t = this.ctx.currentTime;
      bus.gain.cancelScheduledValues(t);
      bus.gain.setValueAtTime(Math.max(bus.gain.value, 0.0001), t);
      bus.gain.exponentialRampToValueAtTime(0.0001, t + 0.4);
      setTimeout(() => {
        bus.disconnect();
        out?.disconnect();
      }, 600);
    }
    this.musicBus = null;
    this.musicOut = null;
  }
}

export const sound = new SoundManager();
