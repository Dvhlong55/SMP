const CACHE_NAME = 'smp-cache-v1';
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
  '/SMP/core/image/favicon.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Cache hit - return response
        if (response) {
          return response;
        }
        return fetch(event.request);
      })
  );
});

self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
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
