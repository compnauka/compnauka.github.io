const CACHE_PREFIX = 'divo-puzzle-';
const CACHE_NAME = `${CACHE_PREFIX}v2.0.0`;
const APP_SHELL = [
  './',
  './index.html',
  './styles.css',
  './manifest.webmanifest',
  './js/app.js',
  './js/camera.js',
  './js/image-processor.js',
  './js/crop-controller.js',
  './js/effects.js',
  './js/puzzle-game.js',
  './assets/pwa/favicon.svg',
  './assets/pwa/favicon.ico',
  './assets/pwa/app-icon.svg',
  './assets/pwa/favicon-32.png',
  './assets/pwa/apple-touch-icon.png',
  './assets/pwa/icon-192.png',
  './assets/pwa/icon-512.png',
  './assets/pwa/icon-maskable-512.png',
  './assets/icons/back.svg',
  './assets/icons/camera.svg',
  './assets/icons/close.svg',
  './assets/icons/eye.svg',
  './assets/icons/gallery.svg',
  './assets/icons/home.svg',
  './assets/icons/play.svg',
  './assets/icons/replay.svg',
  './assets/icons/rotate-camera.svg',
  './assets/icons/trophy.svg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)));
  // Intentionally no skipWaiting(): a new version takes over after the old app closes.
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys
        .filter((key) => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME)
        .map((key) => caches.delete(key))
    ))
  );
  // Intentionally no clients.claim(): do not mix old open pages with the new worker.
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith(networkFirstNavigation(request));
    return;
  }

  event.respondWith(cacheFirst(request));
});

async function networkFirstNavigation(request) {
  try {
    return await fetch(request);
  } catch (_) {
    return (await caches.match('./index.html')) || Response.error();
  }
}

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  const response = await fetch(request);
  if (response.ok && response.type === 'basic' && !request.url.endsWith('/service-worker.js')) {
    const cache = await caches.open(CACHE_NAME);
    cache.put(request, response.clone());
  }
  return response;
}
