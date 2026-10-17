const CACHE = 'digital-superpowers-shell-v7-copy-audit';
const CORE = [
  './', './index.html', './skill.html', './adults.html',
  './lesson-01.html', './lesson-02.html', './lesson-03.html', './lesson-04.html', './lesson-05.html', './lesson-06.html', './lesson-07.html',
  './lesson-08.html', './lesson-09.html', './lesson-10.html', './lesson-11.html', './lesson-12.html',
  './lesson-13.html', './lesson-14.html', './lesson-15.html', './lesson-16.html',
  './manifest.webmanifest', './assets/app-icon.svg',
  './css/tokens.css', './css/base.css', './css/components.css', './css/home.css', './css/screens.css', './css/lessons.css', './css/adults.css',
  './js/icons.js', './js/data.js', './js/storage.js', './js/app.js', './js/skill.js',
  './js/lessons/devices-lessons.js', './js/lessons/info-lessons.js', './js/lessons/online-lessons.js', './js/lessons/algo-lessons.js',
  './js/components/storyboard.js', './js/components/memory-cards.js', './js/components/quiz-rounds.js',
  './js/components/control-lab.js', './js/components/virtual-keyboard.js', './js/components/media-lab.js',
  './js/components/sort.js', './js/components/sequence.js', './js/components/save-find.js',
  './js/components/browser-sim.js', './js/components/search-sim.js', './js/components/safety-scenarios.js', './js/components/password-game.js',
  './js/components/robot-ui.js', './js/components/command-lab.js', './js/components/route-runner.js', './js/components/debug-runner.js', './js/components/grid-runner.js', './js/components/repeat-runner.js'
];
self.addEventListener('install', event => event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(CORE))));
self.addEventListener('activate', event => event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))));
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== location.origin) return;
  if (/\.(mp4|webm|mp3|m4a|wav)$/i.test(url.pathname)) return;
  event.respondWith(caches.match(event.request).then(cached => cached || fetch(event.request).then(response => {
    if (response.ok) {
      const copy = response.clone();
      caches.open(CACHE).then(cache => cache.put(event.request, copy));
    }
    return response;
  }).catch(() => cached)));
});
