const CACHE_NAME = "interactive-lesson-v10";
const OFFLINE_URL = "./offline.html";
const ASSETS = [
  "./",
  "./index.html",
  "./offline.html",
  "./tokens.css",
  "./styles.css",
  "./js/app.js",
  "./js/lesson-data.js",
  "./js/state.js",
  "./js/shared.js",
  "./js/sections.js",
  "./js/task-draw.js",
  "./js/task-classify.js",
  "./js/task-truefalse.js",
  "./js/task-pick.js",
  "./js/task-fill.js",
  "./js/task-scenarios.js",
  "./js/quiz.js",
  "./js/reflection.js",
  "./manifest.json",
  "./icon-192.svg",
  "./icon-512.svg"
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

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          return response;
        })
        .catch(() => {
          if (event.request.mode === "navigate") return caches.match(OFFLINE_URL);
          return caches.match("./index.html");
        });
    })
  );
});
