// Aléatoire du jeu.
// - createSeededRng : PRNG déterministe (Mulberry32) pour rejouer une partie à l'identique sur deux appareils.
// - randomUint32 / randomInt : aléatoire cryptographique pour tout ce qui doit être imprévisible
//   (graines de partie, codes de salon), avec repli sur Math.random si l'API Web Crypto est absente.

export function createSeededRng(seedInt) {
  let a = seedInt >>> 0;
  return function rng() {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function randomUint32() {
  const c = globalThis.crypto;
  if (c?.getRandomValues) return c.getRandomValues(new Uint32Array(1))[0];
  return Math.floor(Math.random() * 0x100000000) >>> 0;
}

// Entier uniforme dans [0, max), sans biais de modulo.
export function randomInt(max) {
  const limit = Math.floor(0x100000000 / max) * max;
  let x;
  do {
    x = randomUint32();
  } while (x >= limit);
  return x % max;
}
