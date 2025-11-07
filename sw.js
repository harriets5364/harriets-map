// Minimal service worker: caches app shell, but does NOT aggressively cache tiles.
// Network-first for tile requests to avoid stale/partial tiles.
const CACHE_NAME = 'harriet-map-shell-v3';

const APP_SHELL = [
  './index.html',
  './manifest.json',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js',
  'https://unpkg.com/leaflet-routing-machine@3.2.12/dist/leaflet-routing-machine.min.js',
  'https://unpkg.com/leaflet-routing-machine@3.2.12/dist/leaflet-routing-machine.css'
];

self.addEventListener('install', (ev) => {
  ev.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (ev) => {
  ev.waitUntil(clients.claim());
});

self.addEventListener('fetch', (ev) => {
  const req = ev.request;
  if (req.url.includes('tile.openstreetmap.org')) {
    // Network-first for tiles
    ev.respondWith(fetch(req).catch(() => caches.match(req)));
    return;
  }
  ev.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req).then((res) => {
        return caches.open(CACHE_NAME).then((cache) => { cache.put(req, res.clone()); return res; });
      }).catch(() => cached);
    })
  );
});
