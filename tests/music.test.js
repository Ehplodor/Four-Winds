import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createComposer, SECTIONS, STEPS_PER_BAR, midiToFreq } from '../js/music.js';
import { createSeededRng } from '../js/rng.js';

const VOICES = new Set(['pad', 'arp', 'bass', 'lead', 'kick', 'hat', 'snare']);

test('midiToFreq : La 4 = 440 Hz', () => {
  assert.equal(midiToFreq(69), 440);
  assert.ok(Math.abs(midiToFreq(57) - 220) < 1e-9);
});

test('le compositeur produit des mesures valides', () => {
  const c = createComposer(createSeededRng(42));
  assert.ok(c.tempo >= 100 && c.tempo <= 112);
  for (let i = 0; i < 200; i++) {
    const { section, events } = c.nextBar();
    assert.ok(SECTIONS[section], `section inconnue ${section}`);
    for (const ev of events) {
      assert.ok(VOICES.has(ev.voice));
      assert.ok(ev.step >= 0 && ev.step < STEPS_PER_BAR);
      assert.ok(ev.len > 0);
      if (ev.midi !== undefined) assert.ok(ev.midi >= 20 && ev.midi <= 100, `note hors tessiture ${ev.midi}`);
      // Seules les voix de la section jouent.
      assert.ok(SECTIONS[section].layers.includes(ev.voice), `${ev.voice} hors section ${section}`);
    }
  }
});

test('la musique varie : plusieurs sections, tonalités et mesures différentes', () => {
  const c = createComposer(createSeededRng(7));
  const sections = new Set();
  const keys = new Set();
  const bars = new Set();
  for (let i = 0; i < 120; i++) {
    keys.add(c.key);
    const { section, events } = c.nextBar();
    sections.add(section);
    bars.add(JSON.stringify(events));
  }
  assert.ok(sections.size >= 4, `trop peu de sections : ${[...sections]}`);
  assert.ok(keys.size >= 3, 'trop peu de modulations');
  assert.ok(bars.size >= 60, `trop de mesures identiques : ${bars.size} distinctes sur 120`);
});

test('le compositeur est déterministe pour une graine donnée', () => {
  const a = createComposer(createSeededRng(123));
  const b = createComposer(createSeededRng(123));
  for (let i = 0; i < 30; i++) assert.deepEqual(a.nextBar(), b.nextBar());
});
