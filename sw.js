// ── KIRITAN PORTAL | SERVICE WORKER ──
// PWAの心臓部。これがあるとホーム画面にインストールできて、オフラインでも開ける。
//
// 戦略(stale-while-revalidate):
//   - 画面のファイル → まずキャッシュから即返す。裏で新しいのを取りに行って次回用に保存
//   - /api/ → 絶対キャッシュしない。データは常に最新じゃないと意味がない
//
// ⚠️ 運用ルール: フロントのファイルを変更したら CACHE_VERSION を必ず上げること！
// 上げ忘れると学生のスマホに古い画面が残り続ける。
//
// 教訓メモ(v3で2時間溶かした): SWのfetchは素直に書くとブラウザのHTTPキャッシュを
// 経由する。するとサーバーが304を返してきて「古いファイルを新しいキャッシュに保存」
// という最悪の事態が起きる。下でcache:'reload'/'no-cache'を指定してるのはそのため。
// 絶対に消さないこと。未来の自分へ。

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
  // 古いバージョンのキャッシュを掃除する。kiritan-v3とかが残ってたら全部削除。
  // clients.claim()で開いてるタブの制御も即座に引き継ぐ(リロード1回分早くなる)
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
