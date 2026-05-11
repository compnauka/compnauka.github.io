# SECURITY.md — безпека та приватність "Привіт, ШІ!"

## 1. Модель продукту

`Привіт, ШІ!` — дитячий освітній статичний сайт без реєстрації. Основна аудиторія — учні початкової школи, вчителі та батьки.

> Сайт не збирає, не зберігає і не передає персональні дані дітей.

## 2. Поточні ризики

### 2.1. Google Analytics

У `index.html` підключено Google Analytics (`G-N8T05K3NGT`). Для дитячого продукту це небажано без явної згоди.

**Статус:** залишено за рішенням власника продукту.

**Якщо прибирати:**
- видалити блок `gtag` з `index.html`
- альтернатива: агреговані server logs без cookies або self-hosted аналітика

### 2.2. Google Fonts через CDN

Шрифт Nunito підключено через `fonts.googleapis.com`. При кожному відкритті браузер робить запит до Google — це privacy-залежність і залежність від доступності сервісу.

**Вирішення:** завантажити `.woff2` локально та підключити через `@font-face` у `style.css`.

### 2.3. ~~`localStorage`~~ — вирішено ✅

Прогрес зберігається в `sessionStorage` як `aiBookProgress`. Скидається автоматично при закритті вкладки — кожен учень починає з початку.

### 2.4. Зовнішні посилання

У `bookSections.js` є посилання на зовнішні сайти. Усі мають `target="_blank"` і `rel="noopener noreferrer"` (через `renderSegments` у `renderers.js`).

Поточні зовнішні ресурси в контенті:
- `https://hourofcode.com/ai-oceans`
- `https://quickdraw.withgoogle.com/`
- `https://itnauka.org/`
- `https://ravlyk.org/`

Усі ресурси мають бути вручну перевірені перед публікацією.

## 3. Що вже виправлено

| Проблема | Статус |
|---|---|
| Tailwind CDN | ✅ Видалено, стилі власні |
| Plausible | ✅ Не підключено |
| `user-scalable=no` | ✅ Виправлено, zoom не заблоковано |
| `innerHTML` для контенту | ✅ Весь контент через DOM API |
| HTML-рядки в `bookSections.js` | ✅ Замінено структурованими блоками |
| Skip-link | ✅ Є |
| `aria-expanded`/`aria-controls` | ✅ Є |
| `rel="noopener noreferrer"` | ✅ Є у всіх зовнішніх посиланнях |
| `quizzes_updated.js` | ✅ Видалено |

## 4. Заборонені практики

- Збирати ПІБ, телефон, адресу, email дитини
- Просити фото дитини
- Підключати рекламні скрипти
- Вставляти довільний HTML із контентних файлів (`innerHTML` з даних)
- Зберігати персональні дані в `localStorage`
- Блокувати zoom
- Приховувати зовнішні переходи від користувача

## 5. Дозволені дані в `sessionStorage`

- Номер поточного розділу (`aiBookProgress`)

Більше нічого не зберігається.

## 6. Цільова CSP (після відмови від Google Fonts CDN)

```http
Content-Security-Policy:
  default-src 'self';
  script-src 'self' https://www.googletagmanager.com https://www.google-analytics.com;
  style-src 'self';
  img-src 'self';
  media-src 'self';
  font-src 'self';
  connect-src 'self' https://www.google-analytics.com;
  object-src 'none';
  base-uri 'none';
  frame-ancestors 'none';
```

Поки Google Fonts підключено через CDN, `style-src` і `font-src` потребують розширення.

## 7. Безпека медіафайлів

- Усі зображення та аудіо — локальні
- Не підвантажувати зображення з зовнішніх URL
- Не дозволяти користувацьке завантаження файлів

## 8. Security checklist перед публікацією

- [x] Zoom не заблоковано
- [x] Контент не вставляється через `innerHTML`
- [x] Немає inline event handlers у контенті
- [x] Немає збору персональних даних
- [x] Усі `target="_blank"` мають `rel="noopener noreferrer"`
- [x] Немає синтаксичних помилок у JS
- [ ] Google Analytics — рішення власника
- [ ] Google Fonts локально — рекомендовано
- [x] `sessionStorage` замість `localStorage` ✅
- [ ] PWA кешування для офлайн-роботи
