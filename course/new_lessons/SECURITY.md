# SECURITY.md — безпека, приватність і аудит

Цей підручник призначений для дітей 1–2 класів і може використовуватися на спільних шкільних комп’ютерах. Тому базова модель безпеки — мінімізація даних, локальність, відсутність акаунтів і контрольований статичний контент.

---

## 1. Поточна security-модель

- Сайт статичний.
- Реєстрація не потрібна.
- Персональні акаунти учнів не використовуються.
- Дитячий прогрес не зберігається між відкриттями.
- Уроки та інструменти мають працювати як локальні same-origin ресурси.
- Вчительський режим є режимом перегляду, а не адмін-панеллю.

Це правильна модель для молодших школярів: менше даних — менше ризиків.

---

## 2. Критична проблема, знайдена під час аудиту

У попередньому архіві були службові браузерні профілі:

```text
.browser-profile/
tests/.browser-profile/
```

Такі папки можуть містити історію, cookies, login data, web data, preferences, кеші, сесії та інші приватні артефакти браузера. Вони не мають потрапляти в репозиторій, архів, pull request або реліз.

Поточний оновлений пакет очищено від цих папок. Агентам заборонено додавати їх повторно.

---

## 3. Blocklist для репозиторію та архівів

Заборонені файли та папки:

```text
.browser-profile/
tests/.browser-profile/
**/.browser-profile/
Cookies
Cookies-journal
Safe Browsing Cookies
Safe Browsing Cookies-journal
Login Data
Login Data For Account
History
Web Data
Local State
.env
.env.*
*.pem
*.key
*.p12
*.pfx
```

Перед створенням архіву або PR потрібно перевірити:

```bash
find . -path '*/.browser-profile*' -print
find . \( -name 'Cookies' -o -name 'Login Data' -o -name 'History' -o -name 'Web Data' -o -name 'Local State' \) -print
```

Результат має бути порожнім.

---

## 4. Політика збереження даних

Заборонено зберігати між сесіями:

- відповіді учня;
- завершені активності;
- прогрес уроку;
- рефлексію;
- імена дітей;
- введені дитячі тексти;
- результати квізів;
- аудіо, фото, файли учня.

Дозволено лише тимчасовий стан у пам’яті сторінки. Короткоживучі UI-налаштування в `sessionStorage` можливі, якщо вони не розкривають роботу попереднього учня.

---

## 5. `localStorage`, cookies, IndexedDB

Для дитячого прогресу заборонені:

```js
localStorage
indexedDB
document.cookie
Cache Storage для персональних результатів
```

`Cache Storage` використовується лише service worker-ом для app shell, статичних сторінок, JS/CSS/assets та локальних інструментів.

---

## 6. Embedded tools

### 6.1. Дозволена модель

Дозволені лише локальні інструменти:

```text
./tools/...
/tools/... у межах same-origin deployment path
```

Інструмент має працювати офлайн і не надсилати дані назовні.

### 6.2. Заборонена модель

За замовчуванням заборонено:

- зовнішні iframe;
- зовнішні тренажери;
- Google Docs / Forms / YouTube embeds у дитячому режимі;
- рекламні, аналітичні, соціальні або маркетингові скрипти;
- інструменти, які вимагають логін.

### 6.3. Технічні вимоги

Для iframe:

```html
<iframe
  sandbox="allow-scripts allow-same-origin allow-forms"
  referrerpolicy="no-referrer"
  loading="lazy">
</iframe>
```

Для `window.open`:

```js
window.open(url, "_blank", "noopener,noreferrer");
```

Для `postMessage`:

- перевіряти `event.origin`;
- перевіряти `payload.type`;
- перевіряти `activityId`;
- приймати події лише від очікуваного локального інструмента.

---

## 7. XSS і lesson data

Контент уроків має бути структурованими даними, а не довільним HTML.

Правила:

- не додавати raw HTML у lesson data;
- текстові поля рендерити через escaping;
- форматування робити через структуровані типи, а не через HTML-рядки;
- не вставляти URL без нормалізації;
- не використовувати `innerHTML` для неперевіреного або зовнішнього вмісту.

Поточний статичний контент має низький ризик XSS, але майбутній імпорт із CMS, Google Docs або AI-генератора потребує суворої схеми і валідатора.

---

## 8. Рекомендовані security headers для Cloudflare Pages

Файл `_headers` можна додати на етапі деплою:

```text
/*
  Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; frame-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'self'; upgrade-insecure-requests
  Referrer-Policy: no-referrer
  X-Content-Type-Options: nosniff
  Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=()
```

`style-src 'unsafe-inline'` допускається тимчасово, якщо стилі ще містять inline-патерни. Довгострокова ціль — зменшити inline style.

---

## 9. PWA/offline security

Service worker має кешувати лише контрольовані статичні ресурси:

- HTML сторінки уроків;
- JS/CSS;
- assets;
- локальні tools;
- manifest/icons/offline fallback.

Service worker не має кешувати:

- браузерні профілі;
- тимчасові тестові профілі;
- персональні результати дітей;
- зовнішні сторінки;
- секрети.

---

## 10. Security checklist перед релізом

- [ ] Немає `.browser-profile` у проєкті.
- [ ] Немає cookies/login/history/web data/local state.
- [ ] Немає `.env` і секретів.
- [ ] Дитячий прогрес не зберігається між сесіями.
- [ ] Embedded tools тільки same-origin і з `tools/`.
- [ ] iframe має sandbox.
- [ ] `window.open` має `noopener,noreferrer`.
- [ ] Service worker кешує лише контрольовані файли.
- [ ] Уроки не містять raw HTML із неперевірених джерел.
- [ ] CSP/headers підготовлені для Cloudflare Pages.

