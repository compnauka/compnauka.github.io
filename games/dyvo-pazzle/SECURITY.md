# Security & Privacy Notes

## Threat model

Гра є повністю клієнтською. Сервер не приймає фотографії та не має користувацьких акаунтів. Основні ризики: надмірне використання пам'яті через великі/пошкоджені файли, неправильний lifecycle камери, витік локального фото через зайве збереження, небезпечні заголовки хостингу та помилки scope/cache Service Worker.

## Реалізовано

- allow-list JPEG / PNG / WebP / HEIC / HEIF;
- перевірка сигнатури JPEG / PNG / WebP / основних HEIF brand;
- максимальний розмір файлу 20 МБ;
- обмеження декодованого зображення 60 MP;
- нормалізація робочого фото максимум до 2048 px по довгій стороні;
- фінальний пазл 1280×1280;
- Blob/Object URL замість Base64 Data URL;
- Object URL відкликаються при очищенні;
- `getUserMedia()` використовує request token, застарілі stream закриваються;
- камера зупиняється при hidden/pagehide;
- Service Worker видаляє тільки кеші з префіксом `divo-puzzle-`;
- немає `skipWaiting()` та `clients.claim()`;
- same-origin fetch у Service Worker;
- CSP: `script-src` — тільки `'self'` плюс `static.cloudflareinsights.com`
  (cookieless-лічильник Cloudflare, який платформа вставляє сама); no object,
  no form submit, `connect-src 'self'` — жодного зовнішнього передавання даних;
- кореневий `_headers` сайту, блок `/games/dyvo-pazzle/*`: CSP із `frame-ancestors 'none'`, `Permissions-Policy` (камера — тільки self), `Cross-Origin-Opener-Policy`; `nosniff` і `Referrer-Policy` приходять із загальносайтового блоку `/*`.

## Важливе обмеження

`style-src` містить `'unsafe-inline'`, оскільки ігрові деталі, crop і responsive board використовують динамічні CSS style properties (`left`, `top`, `width`, `background-position`, `background-image`). `script-src` залишається без `'unsafe-inline'`, що є важливішим бар'єром проти виконання ін'єктованого JavaScript.

## Не робити без окремого privacy review

- не додавати автоматичне збереження дитячих фото в LocalStorage/IndexedDB;
- не додавати analytics/session replay, що може захоплювати canvas або DOM із фото;
- не відправляти фото в AI/API без окремої інформованої згоди й окремої архітектури;
- не розширювати Service Worker scope на весь домен без потреби.
