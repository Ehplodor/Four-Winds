// Service worker : met l'application en cache pour jouer hors ligne et gérer les liens ?room= / ?turn= sur mobile.
const VERSION = 'v4';
const CACHE = `quatre-vents-${VERSION}`;
const ASSETS = [
  './',
  'index.html',
  'css/style.css',
  'js/main.js',
  'js/engine.js',
  'js/ai.js',
  'js/cards.js',
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

// Réseau d'abord, repli sur le cache (avec ignoreSearch pour supporter les liens ?turn=... et ?room=... hors-ligne).
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return;
  e.respondWith(
    fetch(e.request)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(e.request, copy));
        return res;
      })
      .catch(() => caches.match(e.request, { ignoreSearch: true }) || caches.match('index.html')),
  );
});
