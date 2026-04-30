# PWA.md — offline-режим для “Привіт, ШІ!”

## 1. Навіщо PWA цьому проєкту

Книга орієнтована на школу. У школі можуть бути нестабільний Wi-Fi, планшети або старі комп’ютери, а також потреба показати книгу без постійного інтернету. Тому книга має працювати offline після першого завантаження.

## 2. Поточний стан

Зараз у проєкті немає:

- `manifest.json`;
- `sw.js`;
- `offline.html`;
- реєстрації service worker;
- кеш-стратегії.

## 3. Мінімальний набір PWA-файлів

```text
manifest.json
sw.js
offline.html
icons/
  icon-192.png
  icon-512.png
```

Якщо іконок ще немає, їх треба створити окремо з обкладинки або логотипа книги.

## 4. manifest.json

Приклад:

```json
{
  "name": "Привіт, ШІ! Інтерактивна книга",
  "short_name": "Привіт, ШІ!",
  "description": "Інтерактивна книга про штучний інтелект для дітей.",
  "start_url": "./index.html",
  "scope": "./",
  "display": "standalone",
  "background_color": "#f3f6f9",
  "theme_color": "#4f46e5",
  "lang": "uk",
  "icons": [
    { "src": "icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "icons/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

У `index.html` додати:

```html
<link rel="manifest" href="manifest.json">
<meta name="theme-color" content="#4f46e5">
```

## 5. Service worker

Мінімальний `sw.js`:

```js
const CACHE_NAME = "pryvitshi-v1";

const CORE_ASSETS = [
  "./",
  "./index.html",
  "./style.css",
  "./main.js",
  "./bookSections.js",
  "./offline.html",
  "./000.webp",
  "./001.webp",
  "./002.webp",
  "./003.webp",
  "./004.webp",
  "./005.webp",
  "./006.webp",
  "./007.webp",
  "./008.webp",
  "./009.webp",
  "./010.webp",
  "./011.webp",
  "./012.webp",
  "./013.webp",
  "./014.webp",
  "./AI_SONG.mp3"
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS)));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
    )
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).catch(() => {
        if (event.request.mode === "navigate") return caches.match("./offline.html");
      });
    })
  );
});
```

## 6. Реєстрація service worker

У `main.js` або окремому `pwa.js`:

```js
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch((error) => {
      console.warn("Service worker registration failed", error);
    });
  });
}
```

## 7. offline.html

```html
<!DOCTYPE html>
<html lang="uk">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Немає інтернету | Привіт, ШІ!</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <main style="max-width: 640px; margin: 4rem auto; padding: 2rem; font-family: sans-serif;">
    <h1>Книга тимчасово offline</h1>
    <p>Схоже, зараз немає інтернету. Якщо книгу вже відкривали на цьому пристрої, спробуйте оновити сторінку.</p>
    <a href="./index.html">Повернутися до книги</a>
  </main>
</body>
</html>
```

## 8. Кеш-стратегія

Для цього проєкту рекомендовано:

- **Cache first** для локальних статичних файлів;
- **Network fallback to offline.html** для навігаційних запитів;
- версіонувати кеш через `CACHE_NAME`.

При оновленні контенту змінювати:

```js
const CACHE_NAME = "pryvitshi-v2";
```

## 9. Важливе зауваження про CDN

Поки використовуються Tailwind CDN і Google Fonts, offline-режим не буде повністю контрольованим.

Для якісного PWA бажано:

1. прибрати Tailwind CDN;
2. зібрати CSS локально;
3. або перейти на власний CSS без CDN;
4. шрифт підключити локально або використати системний fallback.

## 10. Тестування PWA

У Chrome DevTools:

1. Application → Service Workers.
2. Перевірити, що service worker зареєстрований.
3. Application → Cache Storage.
4. Перевірити, що assets закешовані.
5. Network → Offline.
6. Оновити сторінку.
7. Перевірити, що книга відкривається або показує `offline.html`.

## 11. PWA checklist

- [ ] Є `manifest.json`.
- [ ] Є іконки 192×192 і 512×512.
- [ ] Є `sw.js`.
- [ ] Є `offline.html`.
- [ ] Service worker реєструється без помилок.
- [ ] Основні файли кешуються.
- [ ] Зображення кешуються.
- [ ] Аудіо кешується або коректно деградує.
- [ ] Сторінка відкривається offline.
- [ ] Після оновлення версії старий кеш видаляється.
