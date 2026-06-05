const CACHE_NAME = 'smp-cache-v6';
const urlsToCache = [
  '/SMP/',
  '/SMP/index.html',
  '/SMP/pages/toanhoc.html',
  '/SMP/pages/nonmath.html',
  '/SMP/pages/cuocsong.html',
  '/SMP/core/css/shared.css',
  '/SMP/core/css/post.css',
  '/SMP/core/js/shared.js',
  '/SMP/core/js/layout.js',
  '/SMP/core/js/sidebar-data.js',
  '/SMP/core/js/post-layout.js',
  '/SMP/core/image/favicon.png',
  '/SMP/core/image/image_49b1a4.png',
  '/SMP/core/image/mobile_demo.png'
];

self.addEventListener('install', event => {
  // Bỏ qua chờ để kích hoạt Service Worker mới ngay lập tức
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', event => {
  // Chiến lược: Network First, Fallback to Cache
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Cập nhật lại cache với dữ liệu mới nhất
        if (response && response.status === 200 && response.type === 'basic') {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, responseClone);
            });
        }
        return response;
      })
      .catch(() => {
        // Nếu rớt mạng, lấy từ cache
        return caches.match(event.request);
      })
  );
});

self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  // Take control of all clients immediately
  event.waitUntil(clients.claim());
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
