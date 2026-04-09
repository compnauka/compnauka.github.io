const STATIC_CACHE = 'server-rescue-static-v1';
const STATIC_ASSETS = [
    './',
    './index.html',
    './offline.html',
    './ui-strings.js',
    './quiz-content.uk.js',
    './game-services.js',
    './game-renderers.js',
    './style.css',
    './tokens.css',
    './main.js',
    './manifest.json'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(STATIC_CACHE).then((cache) => cache.addAll(STATIC_ASSETS))
    );
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) =>
            Promise.all(
                keys
                    .filter((key) => key !== STATIC_CACHE)
                    .map((key) => caches.delete(key))
            )
        )
    );
    self.clients.claim();
});

self.addEventListener('fetch', (event) => {
    const { request } = event;
    const isNavigation = request.mode === 'navigate';
    const url = new URL(request.url);
    const isSameOrigin = url.origin === self.location.origin;

    if (isNavigation) {
        event.respondWith(
            fetch(request).catch(() => caches.match('./offline.html'))
        );
        return;
    }

    if (!isSameOrigin) {
        return;
    }

    event.respondWith(
        caches.match(request).then((cachedResponse) => {
            if (cachedResponse) {
                return cachedResponse;
            }

            return fetch(request).then((networkResponse) => {
                if (!networkResponse || networkResponse.status !== 200 || request.method !== 'GET') {
                    return networkResponse;
                }

                const responseClone = networkResponse.clone();
                caches.open(STATIC_CACHE).then((cache) => cache.put(request, responseClone));
                return networkResponse;
            });
        })
    );
});
