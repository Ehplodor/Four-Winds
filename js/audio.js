// Moteur Audio procédural via Web Audio API (aucun fichier externe requis, fonctionne 100% hors-ligne).
// Génère les bruitages de cartes (sélection, pose sur pierre, capture, combo, victoire) et une musique d'ambiance douce.

class SoundManager {
  constructor() {
    this.ctx = null;
    this.sfxEnabled = true;
    this.musicEnabled = false;
    this.musicTimer = null;
    this.step = 0;

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
      if (AudioCtx) this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
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

  tone({ freq = 440, type = 'sine', duration = 0.12, gain = 0.12, delay = 0, slideTo = null }) {
    const ctx = this.init();
    if (!ctx) return;
    const now = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    if (slideTo) {
      osc.frequency.exponentialRampToValueAtTime(slideTo, now + duration);
    }

    g.gain.setValueAtTime(0.0001, now);
    g.gain.linearRampToValueAtTime(gain, now + Math.min(0.018, duration * 0.25));
    g.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc.connect(g);
    g.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + duration + 0.02);
  }

  playHover() {
    if (!this.sfxEnabled) return;
    this.tone({ freq: 660, type: 'sine', duration: 0.045, gain: 0.035, slideTo: 740 });
  }

  playUiClick() {
    if (!this.sfxEnabled) return;
    this.tone({ freq: 520, type: 'triangle', duration: 0.07, gain: 0.08, slideTo: 780 });
  }

  playSelectCard() {
    if (!this.sfxEnabled) return;
    this.tone({ freq: 440, type: 'triangle', duration: 0.08, gain: 0.09, slideTo: 587.33 });
    this.tone({ freq: 880, type: 'sine', duration: 0.11, gain: 0.05, delay: 0.03 });
  }

  playPlaceCard(elementMod = 0) {
    if (!this.sfxEnabled) return;
    // Impact feutré sur la table de pierre
    this.tone({ freq: 155, type: 'triangle', duration: 0.11, gain: 0.16, slideTo: 78 });
    this.tone({ freq: 310, type: 'sine', duration: 0.07, gain: 0.07, delay: 0.02 });
    if (elementMod > 0) {
      // Accord cristallin de résonance élémentaire (+1)
      this.tone({ freq: 659.25, type: 'sine', duration: 0.18, gain: 0.09, delay: 0.05 });
      this.tone({ freq: 987.77, type: 'sine', duration: 0.22, gain: 0.08, delay: 0.1 });
    } else if (elementMod < 0) {
      // Dissonance légère (-1)
      this.tone({ freq: 293.66, type: 'sawtooth', duration: 0.14, gain: 0.04, delay: 0.05, slideTo: 246.94 });
    }
  }

  playCapture(count = 1, isSpecial = false) {
    if (!this.sfxEnabled) return;
    const notes = isSpecial
      ? [523.25, 659.25, 783.99, 1046.5, 1318.5] // Do Mi Sol Do Mi (Combo / Plus / Identique)
      : [440, 554.37, 659.25, 880];              // La Do# Mi La
    const steps = Math.min(notes.length, Math.max(2, count + (isSpecial ? 2 : 1)));
    for (let i = 0; i < steps; i++) {
      this.tone({
        freq: notes[i],
        type: isSpecial ? 'triangle' : 'sine',
        duration: 0.16,
        gain: 0.11,
        delay: i * 0.065,
      });
    }
  }

  playEndGame(result) {
    if (!this.sfxEnabled) return;
    if (result === 'win') {
      const fanfare = [523.25, 659.25, 783.99, 1046.5];
      fanfare.forEach((f, i) => {
        this.tone({
          freq: f,
          type: 'triangle',
          duration: i === 3 ? 0.45 : 0.16,
          gain: 0.12,
          delay: i * 0.11,
        });
      });
    } else if (result === 'lose') {
      const sad = [392.0, 349.23, 329.63, 261.63];
      sad.forEach((f, i) => {
        this.tone({
          freq: f,
          type: 'sine',
          duration: i === 3 ? 0.45 : 0.18,
          gain: 0.1,
          delay: i * 0.13,
        });
      });
    } else {
      this.tone({ freq: 440, type: 'triangle', duration: 0.2, gain: 0.09 });
      this.tone({ freq: 523.25, type: 'triangle', duration: 0.3, gain: 0.09, delay: 0.15 });
    }
  }

  // Arpège d'ambiance doux et mystique inspiré des salons de cartes
  startMusic() {
    if (!this.musicEnabled) return;
    this.stopMusic();
    this.init();
    // Progression d'arpèges en La mineur / Fa majeur7 / Sol / Mi mineur
    const chords = [
      [220.0, 261.63, 329.63, 392.0, 329.63, 261.63],
      [174.61, 220.0, 261.63, 329.63, 261.63, 220.0],
      [196.0, 246.94, 293.66, 392.0, 293.66, 246.94],
      [164.81, 196.0, 246.94, 329.63, 246.94, 196.0],
    ];
    this.step = 0;
    this.musicTimer = setInterval(() => {
      if (!this.musicEnabled || document.hidden) return;
      const chord = chords[Math.floor(this.step / 6) % chords.length];
      const note = chord[this.step % 6];
      this.tone({
        freq: note,
        type: 'sine',
        duration: 0.42,
        gain: 0.028,
      });
      if (this.step % 6 === 0) {
        this.tone({
          freq: note * 0.5,
          type: 'triangle',
          duration: 1.4,
          gain: 0.022,
        });
      }
      this.step++;
    }, 340);
  }

  stopMusic() {
    if (this.musicTimer) {
      clearInterval(this.musicTimer);
      this.musicTimer = null;
    }
  }
}

export const sound = new SoundManager();
