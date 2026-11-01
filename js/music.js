// Compositeur génératif de la musique d'ambiance (logique pure, sans Web Audio : testable sous Node).
// La musique avance mesure par mesure. Chaque mesure est une liste d'événements
// { voice, step, len, midi, vel } que le synthétiseur (audio.js) transforme en sons.
// Pour éviter la répétition : sections d'intensités différentes, plusieurs grilles d'accords,
// motifs mélodiques recomposés à chaque section, modulations de tonalité et petites variations.

export const STEPS_PER_BAR = 16; // doubles croches

const MINOR_SCALE = [0, 2, 3, 5, 7, 8, 10];
const CHORD_TONES = { m: [0, 3, 7], M: [0, 4, 7] };

// Grilles d'accords en mineur (degré en demi-tons depuis la tonique, qualité).
export const PROGRESSIONS = [
  [[0, 'm'], [8, 'M'], [3, 'M'], [10, 'M']], // i VI III VII
  [[5, 'm'], [0, 'm'], [10, 'M'], [3, 'M']], // iv i VII III
  [[8, 'M'], [10, 'M'], [0, 'm'], [0, 'm']], // VI VII i i
  [[0, 'm'], [7, 'm'], [8, 'M'], [10, 'M']], // i v VI VII
  [[0, 'm'], [3, 'M'], [5, 'm'], [7, 'M']], // i III iv V
  [[8, 'M'], [3, 'M'], [10, 'M'], [0, 'm']], // VI III VII i
];

// Couches actives selon l'intensité de la section.
export const SECTIONS = {
  calme: { bars: 4, layers: ['pad', 'arp'] },
  groove: { bars: 8, layers: ['pad', 'arp', 'bass', 'kick', 'hat'] },
  elan: { bars: 8, layers: ['pad', 'arp', 'bass', 'kick', 'hat', 'snare', 'lead'] },
  respiration: { bars: 4, layers: ['pad', 'lead', 'hat'] },
  chant: { bars: 8, layers: ['pad', 'bass', 'hat', 'snare', 'lead'] },
};

// Enchaînements possibles après chaque section (choisis au hasard).
const NEXT_SECTION = {
  calme: ['groove', 'groove', 'chant'],
  groove: ['elan', 'elan', 'chant'],
  elan: ['respiration', 'groove', 'chant', 'elan'],
  respiration: ['elan', 'groove'],
  chant: ['elan', 'respiration', 'groove'],
};

const KEY_SHIFTS = [0, 5, -2, 3, -4, 2]; // modulations possibles (en demi-tons depuis La)
const KEY_BASE = 57; // La 3 (MIDI)

const KICK_PATTERNS = [
  [0, 6, 8],
  [0, 8, 10],
  [0, 7, 8, 14],
  [0, 3, 8, 11],
];
const BASS_PATTERNS = [
  // [pas, longueur, intervalle depuis la fondamentale]
  [[0, 3, 0], [6, 2, 0], [8, 3, 7], [11, 2, 0], [14, 2, 12]],
  [[0, 2, 0], [3, 2, 0], [8, 2, 0], [10, 2, 7], [12, 4, 0]],
  [[0, 6, 0], [6, 2, 7], [8, 6, 0], [14, 2, 10]],
  [[0, 2, 0], [2, 2, 12], [4, 2, 0], [8, 2, 0], [10, 2, 12], [12, 2, 7], [14, 2, 0]],
];
const ARP_PATTERNS = [
  { every: 2, order: [0, 1, 2, 3, 2, 1, 2, 3] },
  { every: 2, order: [0, 2, 1, 3, 0, 2, 1, 3] },
  { every: 1, order: [0, 1, 2, 3, 2, 1, 0, 1, 2, 3, 2, 1, 2, 3, 2, 1] },
  { every: 2, order: [3, 2, 1, 0, 1, 2, 3, 2] },
];
const RHYTHMS = [
  // Attaques d'un motif mélodique sur une mesure : [pas, longueur]
  [[0, 3], [3, 3], [6, 2], [8, 4], [12, 2], [14, 2]],
  [[0, 2], [2, 2], [4, 4], [10, 2], [12, 4]],
  [[0, 4], [6, 2], [8, 2], [10, 2], [12, 4]],
  [[2, 2], [4, 2], [6, 4], [11, 3], [14, 2]],
  [[0, 6], [6, 2], [8, 6], [14, 2]],
];

const pick = (rng, arr) => arr[Math.floor(rng() * arr.length) % arr.length];

// Note de la gamme mineure (degré pouvant dépasser l'octave) → demi-tons.
function degreeToSemis(deg) {
  const oct = Math.floor(deg / 7);
  return oct * 12 + MINOR_SCALE[((deg % 7) + 7) % 7];
}

// Degré de gamme le plus proche d'une note de l'accord (pour les temps forts).
function snapToChord(deg, chord) {
  const tones = CHORD_TONES[chord[1]].map((t) => (chord[0] + t) % 12);
  let best = deg;
  let bestDist = Infinity;
  for (let d = deg - 3; d <= deg + 3; d++) {
    const pc = ((degreeToSemis(d) % 12) + 12) % 12;
    if (tones.includes(pc) && Math.abs(d - deg) < bestDist) {
      best = d;
      bestDist = Math.abs(d - deg);
    }
  }
  return best;
}

// Motif mélodique : rythme + contour (mouvements de degré), rejoué et varié sur la phrase.
function makeMotif(rng) {
  const rhythm = pick(rng, RHYTHMS);
  const contour = rhythm.map(() => pick(rng, [-2, -1, -1, 1, 1, 2, 0, 3, -3]));
  return { rhythm, contour, start: pick(rng, [2, 4, 4, 7]) };
}

export function createComposer(rng = Math.random) {
  const state = {
    tempo: 100 + Math.floor(rng() * 4) * 4, // 100 à 112 BPM
    key: 0,
    section: 'calme',
    barInSection: 0,
    progression: pick(rng, PROGRESSIONS),
    motif: makeMotif(rng),
    kick: KICK_PATTERNS[0],
    bass: BASS_PATTERNS[0],
    arp: ARP_PATTERNS[0],
    sectionsPlayed: 0,
    bar: 0,
  };

  function enterSection(name) {
    state.section = name;
    state.barInSection = 0;
    state.sectionsPlayed++;
    state.progression = pick(rng, PROGRESSIONS);
    state.motif = makeMotif(rng);
    state.kick = pick(rng, KICK_PATTERNS);
    state.bass = pick(rng, BASS_PATTERNS);
    state.arp = pick(rng, ARP_PATTERNS);
    // Modulation de temps en temps, jamais deux sections de suite dans la même tonalité trop longtemps.
    if (state.sectionsPlayed % 3 === 0 || rng() < 0.25) {
      const shifts = KEY_SHIFTS.filter((k) => k !== state.key);
      state.key = pick(rng, shifts);
    }
  }

  function nextBar() {
    const def = SECTIONS[state.section];
    const layers = new Set(def.layers);
    const bi = state.barInSection;
    const chord = state.progression[bi % state.progression.length];
    const root = KEY_BASE + state.key + chord[0];
    const tones = CHORD_TONES[chord[1]];
    const lastBar = bi === def.bars - 1;
    const events = [];

    if (layers.has('pad')) {
      for (const t of tones) {
        events.push({ voice: 'pad', step: 0, len: STEPS_PER_BAR, midi: root - 12 + t, vel: 1 });
      }
    }

    if (layers.has('arp')) {
      const arpNotes = [...tones.map((t) => root + t), root + 12];
      const { every, order } = state.arp;
      for (let i = 0; i * every < STEPS_PER_BAR; i++) {
        const step = i * every;
        const accent = step % 4 === 0 ? 1 : 0.7;
        events.push({ voice: 'arp', step, len: every, midi: arpNotes[order[i % order.length]], vel: accent });
      }
    }

    if (layers.has('bass')) {
      for (const [step, len, iv] of state.bass) {
        const interval = iv === 7 && chord[1] === 'M' ? 7 : iv;
        events.push({ voice: 'bass', step, len, midi: root - 24 + interval, vel: step === 0 ? 1 : 0.8 });
      }
    }

    if (layers.has('kick')) {
      const pattern = lastBar ? [0, 8] : state.kick;
      for (const step of pattern) events.push({ voice: 'kick', step, len: 2, vel: step === 0 ? 1 : 0.8 });
    }

    if (layers.has('hat')) {
      for (let step = 2; step < STEPS_PER_BAR; step += 4) events.push({ voice: 'hat', step, len: 1, vel: 1 });
      if (state.section === 'elan' || state.section === 'groove') {
        for (const step of [7, 13, 15]) if (rng() < 0.5) events.push({ voice: 'hat', step, len: 1, vel: 0.45 });
      }
    }

    if (layers.has('snare')) {
      const pattern = lastBar ? [4, 12, 13, 14, 15] : [4, 12];
      for (const step of pattern) events.push({ voice: 'snare', step, len: 2, vel: step >= 13 ? 0.55 : 1 });
    }

    if (layers.has('lead')) {
      // Phrase de 4 mesures : A, A varié, A, conclusion sur une note de l'accord.
      const { rhythm, contour, start } = state.motif;
      const phraseBar = bi % 4;
      let deg = start + (phraseBar === 2 ? 2 : 0);
      rhythm.forEach(([step, len], i) => {
        let move = contour[i];
        if (phraseBar === 1 && i === rhythm.length - 1) move = -move; // réponse
        if (phraseBar === 3 && i >= rhythm.length - 2) return; // laisse respirer la fin de phrase
        deg += move;
        deg = Math.max(0, Math.min(11, deg));
        if (step % 4 === 0) deg = snapToChord(deg, chord);
        events.push({ voice: 'lead', step, len, midi: KEY_BASE + state.key + degreeToSemis(deg), vel: step % 4 === 0 ? 1 : 0.8 });
      });
      if (phraseBar === 3) {
        const endDeg = snapToChord(start, chord);
        events.push({ voice: 'lead', step: 12, len: 4, midi: KEY_BASE + state.key + degreeToSemis(endDeg), vel: 0.9 });
      }
    }

    const section = state.section;
    state.bar++;
    state.barInSection++;
    if (state.barInSection >= def.bars) enterSection(pick(rng, NEXT_SECTION[state.section]));
    return { section, events };
  }

  return {
    get tempo() {
      return state.tempo;
    },
    get key() {
      return state.key;
    },
    nextBar,
  };
}

export function midiToFreq(midi) {
  return 440 * 2 ** ((midi - 69) / 12);
}
