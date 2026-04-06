const STATIC_CACHE = 'grade1-static-v1';
const STATIC_ASSETS = [
    './',
    './index.html',
    './lesson_1_1.html',
    './lesson_1_2.html',
    './style.css',
    './style_lesson.css',
    './tokens.css',
    './i18n.js',
    './main.js',
    './lesson_1_1.js',
    './manifest.json',
    './offline.html'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(STATIC_CACHE).then((cache) => cache.addAll(STATIC_ASSETS))
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => Promise.all(
            keys.filter((key) => key !== STATIC_CACHE).map((key) => caches.delete(key))
        ))
    );
});

self.addEventListener('fetch', (event) => {
    if (event.request.method !== 'GET') {
        return;
    }

    event.respondWith(
        fetch(event.request)
            .then((response) => {
                const copy = response.clone();
                caches.open(STATIC_CACHE).then((cache) => cache.put(event.request, copy));
                return response;
            })
            .catch(() => caches.match(event.request).then((cached) => cached || caches.match('./offline.html')))
    );
});
