const CACHE_NAME = "interactive-lesson-v16";
const OFFLINE_URL = "./offline.html";
const ASSETS = [
  "./",
  "./index.html",
  "./offline.html",
  "./tokens.css",
  "./styles.css",
  "./js/app.js",
  "./js/activity-registry.js",
  "./js/assets/cycle-2-manifest.js",
  "./js/ifo-catalog.js",
  "./js/landing-modules.js",
  "./js/landing.js",
  "./js/lesson-data.js",
  "./js/lessons/action-sequence-1-2.js",
  "./js/lessons/algorithm-representation-1-2.js",
  "./js/lessons/catalog.js",
  "./js/lessons/check-before-share-1-2.js",
  "./js/lessons/commands-executors-1-2.js",
  "./js/lessons/computer-parts-1-2.js",
  "./js/lessons/computer-problems-help-1-2.js",
  "./js/lessons/computer-safety-1-2.js",
  "./js/lessons/computer-types-1-2.js",
  "./js/lessons/computer-what-is-1-2.js",
  "./js/lessons/device-purpose-1-2.js",
  "./js/lessons/draw-in-program-1-2.js",
  "./js/lessons/everyday-algorithm-1-2.js",
  "./js/lessons/find-fix-order-1-2.js",
  "./js/lessons/info-history-coding-1-2.js",
  "./js/lessons/info-presentation-1-2.js",
  "./js/lessons/info-types-1-2.js",
  "./js/lessons/internet-what-for-1-2.js",
  "./js/lessons/kind-online-1-2.js",
  "./js/lessons/message-actions-1-2.js",
  "./js/lessons/objects-models-1-2.js",
  "./js/lessons/private-info-1-2.js",
  "./js/lessons/search-online-1-2.js",
  "./js/lessons/sets-order-1-2.js",
  "./js/lessons/sign-your-work-1-2.js",
  "./js/lessons/simple-info-product-1-2.js",
  "./js/lessons/simple-tables-1-2.js",
  "./js/lessons/sources-truth-1-2.js",
  "./js/lessons/work-alone-together-1-2.js",
  "./js/state.js",
  "./js/shared.js",
  "./js/sections.js",
  "./js/task-click-trainer.js",
  "./js/task-creative.js",
  "./js/task-draw.js",
  "./js/task-embedded-tool.js",
  "./js/task-classify.js",
  "./js/task-fill.js",
  "./js/task-key-trainer.js",
  "./js/task-pick.js",
  "./js/task-scenarios.js",
  "./js/task-sequence.js",
  "./js/task-table-read.js",
  "./js/task-trace-contour.js",
  "./js/task-transfer.js",
  "./js/task-truefalse.js",
  "./js/quiz.js",
  "./js/reflection.js",
  "./manifest.json",
  "./icon-192.svg",
  "./icon-512.svg",
  "./tools/draw-studio/index.html",
  "./tools/draw-studio/tool.css",
  "./tools/draw-studio/tool.js",
  "./tools/shared/tool-bridge.js",
  "./tools/product-studio/index.html",
  "./tools/product-studio/tool.css",
  "./tools/product-studio/tool.js",
  "./tools/signature-studio/index.html",
  "./tools/signature-studio/tool.css",
  "./tools/signature-studio/tool.js",
  "./tools/teamwork-studio/index.html",
  "./tools/teamwork-studio/tool.css",
  "./tools/teamwork-studio/tool.js",
  "./tools/search-studio/index.html",
  "./tools/search-studio/tool.css",
  "./tools/search-studio/tool.js"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
    )
  );
  self.clients.claim();
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const requestUrl = new URL(event.request.url);
  if (requestUrl.origin !== self.location.origin) return;

  if (event.request.mode === "navigate") {
    event.respondWith(networkFirst(event.request));
    return;
  }

  if (shouldPreferFreshAppShell(requestUrl.pathname)) {
    event.respondWith(networkFirst(event.request));
    return;
  }

  event.respondWith(staleWhileRevalidate(event.request, event));
});

function shouldPreferFreshAppShell(pathname) {
  return /\.(html|js|css|json)$/i.test(pathname);
}

async function networkFirst(request) {
  const cache = await caches.open(CACHE_NAME);

  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return (await cache.match(request)) || (await cache.match(OFFLINE_URL));
  }
}

async function staleWhileRevalidate(request, event) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);

  const networkPromise = fetch(request)
    .then((response) => {
      if (response.ok) {
        cache.put(request, response.clone());
      }
      return response;
    })
    .catch(() => null);

  event.waitUntil(networkPromise);

  if (cached) {
    return cached;
  }

  const networkResponse = await networkPromise;
  if (networkResponse) {
    return networkResponse;
  }

  if (request.mode === "navigate") {
    return cache.match(OFFLINE_URL);
  }

  return cache.match("./index.html");
}
