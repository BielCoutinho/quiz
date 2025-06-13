const cacheName = 'quiz-pwa-v1';
const assets = [
  '/',
  '/index.html',
  '/manifest.json',
  '/img/icon-48.png',
  '/img/icon-96.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(cacheName).then((cache) => {
      return cache.addAll(assets);
    })
  );
});

self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((res) => {
      return res || fetch(e.request);
    })
  );
});
