// Service Worker for HST PWA
const CACHE_NAME = 'hst-cache-v2';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // CRITICAL: Never intercept non-GET requests (POST, PUT, DELETE, PATCH).
  // Returning without calling event.respondWith() lets the browser handle
  // these requests natively, going straight to the network.
  if (event.request.method !== 'GET') {
    return;
  }

  // For API GET requests: network-first (fresh data when online)
  if (event.request.url.includes('/api/')) {
    event.respondWith(
      fetch(event.request)
        .then((res) => res)
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // For static assets: cache-first
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  );
});
