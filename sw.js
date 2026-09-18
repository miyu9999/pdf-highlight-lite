const CACHE_NAME = 'pdf-highlight-lite-v5';
const APP_SHELL = ['./', './index.html', './icon-192.png', './icon-512.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
  );
  self.clients.claim();
});

// 自前ファイル（同一オリジン）はネットワーク優先：オンライン時は常に最新を取得し、更新を即反映
// CDN上のpdf.js/pdf-lib/CMapリソース（バージョン固定URLで中身が変わらない）はキャッシュ優先のまま、初回取得後オフラインでも動く
self.addEventListener('fetch', (e) => {
  const sameOrigin = new URL(e.request.url).origin === self.location.origin;

  if (sameOrigin) {
    e.respondWith(
      fetch(e.request)
        .then((response) => {
          if (response.ok && e.request.method === 'GET') {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(e.request, clone));
          }
          return response;
        })
        .catch(() => caches.match(e.request))
    );
    return;
  }

  e.respondWith(
    caches.match(e.request).then((cached) => {
      if (cached) return cached;
      return fetch(e.request).then((response) => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(e.request, clone));
        }
        return response;
      });
    })
  );
});
