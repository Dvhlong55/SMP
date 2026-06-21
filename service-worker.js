const CACHE_NAME = 'smp-cache-v22';
const urlsToCache = [
  '/',
  '/index.html',
  '/pages/toanhoc.html',
  '/pages/nonmath.html',
  '/pages/forum.html',
  '/pages/saved.html',
  '/pages/vetoi.html',
  '/pages/auth.html',
  '/pages/notifications.html',
  '/core/css/shared.css',
  '/core/css/post.css',
  '/core/js/shared.js',
  '/core/js/layout.js',
  '/core/js/sidebar-data.js',
  '/core/js/post-layout.js',
  '/core/image/favicon.png',
  '/core/image/favicon-192.png',
  '/core/image/favicon-512.png',
  '/core/image/image_49b1a4.png',
  '/core/image/mobile_demo.png'
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
  // Chỉ xử lý yêu cầu GET
  if (event.request.method !== 'GET') {
    return;
  }

  // Bỏ qua các yêu cầu gọi API động hoặc các request đến origin khác (như API backend trên Render)
  const url = new URL(event.request.url);
  if (url.pathname.includes('/api/') || url.origin !== self.location.origin) {
    return;
  }

  // Chỉ xử lý các giao thức http hoặc https (tránh các lỗi từ chrome-extension://, ws://, ...)
  if (!event.request.url.startsWith('http')) {
    return;
  }

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
      .catch(error => {
        // Nếu rớt mạng, lấy từ cache
        return caches.match(event.request).then(cachedResponse => {
          if (cachedResponse) {
            return cachedResponse;
          }
          // Nếu không có trong cache, ném lỗi để trình duyệt xử lý lỗi mạng tự nhiên
          throw error;
        });
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
