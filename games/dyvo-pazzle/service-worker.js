const CACHE_PREFIX = 'divo-puzzle-';
// Генерується автоматично: node tools/stamp-cache-version.mjs
// Це хеш вмісту всіх файлів APP_SHELL, тому будь-яка зміна гри змінює і сам
// цей файл — браузер бачить новий Service Worker і перевстановлює кеш.
// Руками не редагувати: qa-check.mjs звіряє значення з фактичним вмістом.
const CACHE_VERSION = 'v4bdb983d8f14';
const CACHE_NAME = `${CACHE_PREFIX}${CACHE_VERSION}`;
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

  event.respondWith(staleWhileRevalidate(event, request));
});

async function networkFirstNavigation(request) {
  try {
    const response = await fetch(request);
    if (response.ok && response.type === 'basic') {
      const cache = await caches.open(CACHE_NAME);
      cache.put('./index.html', response.clone());
    }
    return response;
  } catch (_) {
    return (await caches.match('./index.html')) || Response.error();
  }
}

// Stale-while-revalidate: віддаємо кеш одразу (миттєво й офлайн), а паралельно
// тягнемо свіжу версію у фон і кладемо в кеш — наступне завантаження вже нове.
// Саме це рятує, якщо CACHE_VERSION забули оновити: старий воркер сам
// підтягне нові файли, замість того щоб віддавати старі назавжди.
function staleWhileRevalidate(event, request) {
  if (request.url.endsWith('/service-worker.js')) return fetch(request);

  return caches.open(CACHE_NAME).then(async (cache) => {
    const cached = await cache.match(request);

    const fromNetwork = fetch(request)
      .then((response) => {
        if (response.ok && response.type === 'basic') cache.put(request, response.clone());
        return response;
      })
      .catch(() => null);

    // Без waitUntil браузер може вбити воркер до завершення фонового запиту.
    if (cached) {
      event.waitUntil(fromNetwork);
      return cached;
    }

    return (await fromNetwork) || Response.error();
  });
}
