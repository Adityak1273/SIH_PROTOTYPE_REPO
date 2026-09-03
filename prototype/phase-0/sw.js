const CACHE = 'cognitive-care-ner-v0.9.7';
const APP_SHELL = [
  './',
  './index.html',
  './config.js?v=0.9.7',
  './styles.css?v=0.9.7',
  './avatar.css?v=0.9.7',
  './phase1.css?v=0.9.7',
  './phase2.css?v=0.9.7',
  './phase3.css?v=0.9.7',
  './phase4.css?v=0.9.7',
  './multilingual.css?v=0.9.7',
  './sequence-game.css?v=0.9.7',
  './sorting-game.css?v=0.9.7',
  './category-game.css?v=0.9.7',
  './pattern-game.css?v=0.9.7',
  './spot-difference-game.css?v=0.9.7',
  './manifest.webmanifest'
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(APP_SHELL)).catch(() => {}));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))
    )).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  // Always prefer the deployed server for HTML and versioned application assets.
  // This prevents an older PWA cache from hiding newly deployed game code.
  const isAppAsset = url.pathname.endsWith('.html') ||
    url.pathname.endsWith('.js') ||
    url.pathname.endsWith('.css') ||
    url.pathname === '/' ||
    url.pathname.endsWith('.webmanifest');

  if (isAppAsset) {
    event.respondWith(
      fetch(event.request, { cache: 'no-store' })
        .then((response) => {
          if (response && response.ok) {
            const copy = response.clone();
            caches.open(CACHE).then((cache) => cache.put(event.request, copy)).catch(() => {});
          }
          return response;
        })
        .catch(() => caches.match(event.request).then((cached) => cached || caches.match('./index.html')))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request).then((response) => {
      const copy = response.clone();
      caches.open(CACHE).then((cache) => cache.put(event.request, copy)).catch(() => {});
      return response;
    }).catch(() => caches.match('./index.html')))
  );
});
