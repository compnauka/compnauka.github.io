const CACHE_VERSION = 'office-plus-v2';
const CORE_ASSETS = [
  './design-tokens.json',
  './flowcharts/app-core.js',
  './flowcharts/flowchart-core.js',
  './flowcharts/index.html',
  './flowcharts/main.js',
  './flowcharts/style.css',
  './flowcharts/ui.js',
  './index.html',
  './office-ui.js',
  './offline.js',
  './paint/index.html',
  './paint/js/app.js',
  './paint/js/canvas.js',
  './paint/js/constants.js',
  './paint/js/state.js',
  './paint/js/ui.js',
  './paint/js/utils.js',
  './paint/style.css',
  './SERVICE_THEME_MAP.json',
  './slides/index.html',
  './slides/js/app.js',
  './slides/js/constants.js',
  './slides/js/export.js',
  './slides/js/history.js',
  './slides/js/runtime.js',
  './slides/js/state.js',
  './slides/js/storage.js',
  './slides/js/templates.js',
  './slides/js/utils.js',
  './slides/style.css',
  './tables/index.html',
  './tables/js/app-core.js',
  './tables/js/grid.js',
  './tables/js/main.js',
  './tables/js/ui.js',
  './tables/js/workbook.js',
  './tables/logic.js',
  './tables/style.css',
  './text/app.js',
  './text/core/history.js',
  './text/core/sanitize.js',
  './text/core/selection.js',
  './text/core/state.js',
  './text/formats/docx.js',
  './text/formats/rtf.js',
  './text/formats/txt.js',
  './text/index.html',
  './text/style.css',
  './text/ui/editor.js',
  './text/ui/menu.js',
  './text/ui/modals.js',
  './text/ui/toolbar.js',
  './UI_TOKENS.css',
  './vector/filetest.png',
  './vector/home.png',
  './vector/home2.png',
  './vector/index.html',
  './vector/js/app.js',
  './vector/js/constants.js',
  './vector/js/editor.js',
  './vector/js/state.js',
  './vector/js/ui.js',
  './vector/js/utils.js',
  './vector/style.css',
  './vendor/chartjs/chart.umd.js',
  './vendor/docx/index.umd.js',
  './vendor/dompurify/purify.min.js',
  './vendor/fontawesome/css/all.min.css',
  './vendor/fontawesome/webfonts/fa-regular-400.woff2',
  './vendor/fontawesome/webfonts/fa-solid-900.woff2',
  './vendor/html2canvas/html2canvas.min.js',
  './vendor/html2pdf/html2pdf.bundle.min.js',
  './vendor/mammoth/mammoth.browser.min.js'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_VERSION)
      .then(cache => cache.addAll(CORE_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => key !== CACHE_VERSION).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    caches.match(request).then(cached => {
      if (cached) return cached;
      return fetch(request).then(response => {
        if (!response || response.status !== 200 || response.type !== 'basic') return response;
        const copy = response.clone();
        caches.open(CACHE_VERSION).then(cache => cache.put(request, copy));
        return response;
      });
    })
  );
});

