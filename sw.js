// ── KIRITAN PORTAL | SERVICE WORKER ──
// Makes the portal installable and lets the app shell load instantly
// (and offline). Strategy:
//   - app shell files → cache-first, refreshed in the background
//   - /api/ requests  → never cached, they must be fresh
// Bump CACHE_VERSION whenever you ship changes so old caches get purged.

const CACHE_VERSION = 'kiritan-v4';

const SHELL_FILES = [
  './',
  './index.html',
  './style.css',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './js/data.js',
  './js/utils.js',
  './js/api.js',
  './js/auth.js',
  './js/lang.js',
  './js/tasks.js',
  './js/reminder.js',
  './js/schedule.js',
  './js/classes.js',
  './js/reviews.js',
  './js/orb.js',
  './js/app.js',
];

self.addEventListener('install', (event) => {
  // cache: 'reload' skips the browser's HTTP cache — otherwise a stale
  // 304 can sneak an OLD file into a NEW cache version and undo the bump.
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) =>
      cache.addAll(SHELL_FILES.map((u) => new Request(u, { cache: 'reload' })))
    )
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  // Delete caches from older versions
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Only handle same-origin GETs. API calls and cross-origin requests
  // (weather, fonts) go straight to the network.
  if (event.request.method !== 'GET') return;
  if (url.origin !== location.origin) return;
  if (url.pathname.startsWith('/api/')) return;

  // Stale-while-revalidate: serve from cache immediately,
  // fetch a fresh copy in the background for next time.
  event.respondWith(
    caches.open(CACHE_VERSION).then(async (cache) => {
      const cached = await cache.match(event.request);
      // no-cache = always revalidate with the server, never trust the
      // HTTP cache — that's how stale files were surviving version bumps
      const fresh = fetch(event.request, { cache: 'no-cache' })
        .then((res) => {
          if (res.ok) cache.put(event.request, res.clone());
          return res;
        })
        .catch(() => cached); // offline → whatever we have
      return cached || fresh;
    })
  );
});
