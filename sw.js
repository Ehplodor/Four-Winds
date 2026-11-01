// Service worker : met l'application en cache pour jouer hors ligne et gérer les liens ?room= / ?turn= sur mobile.
const VERSION = 'v8';
const CACHE = `quatre-vents-${VERSION}`;
const ASSETS = [
  './',
  'index.html',
  'css/style.css',
  'js/main.js',
  'js/engine.js',
  'js/match.js',
  'js/rng.js',
  'js/ai.js',
  'js/cards.js',
  'js/art.js',
  'js/audio.js',
  'js/network.js',
  'manifest.webmanifest',
  'icons/icon.svg',
  'icons/icon-192.png',
  'icons/icon-512.png',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

// Réseau d'abord, repli sur le cache hors ligne. Les liens ?turn=... et ?room=... retombent sur la page
// d'accueil en cache. Seules les réponses valides de notre origine sont mises en cache.
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return;
  e.respondWith(
    fetch(e.request)
      .then((res) => {
        if (res.ok && res.type === 'basic') {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(url.search ? url.pathname : e.request, copy));
        }
        return res;
      })
      .catch(async () => {
        const cached = await caches.match(e.request, { ignoreSearch: true });
        if (cached) return cached;
        if (e.request.mode === 'navigate') return (await caches.match('index.html')) || Response.error();
        return Response.error();
      }),
  );
});
