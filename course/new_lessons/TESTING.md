# TESTING.md — обов’язкові перевірки проєкту

Мета тестування — не лише знайти помилки в коді, а й захистити проєкт від трьох головних ризиків: витоку приватних файлів, поломки уроків і педагогічного/UX-перевантаження для дітей.

---

## 1. Мінімальний набір перед здачею

```powershell
powershell -ExecutionPolicy Bypass -File scripts\generate-lesson-pages.ps1
powershell -ExecutionPolicy Bypass -File tests\run-tests.ps1
powershell -ExecutionPolicy Bypass -File tests\run-browser-smoke.ps1
```

Якщо середовище не має PowerShell, потрібно виконати еквівалентні перевірки вручну або через інший скрипт.

---

## 2. Security checks

Перед архівом, PR або релізом:

```bash
find . -path '*/.browser-profile*' -print
find . \( -name 'Cookies' -o -name 'Login Data' -o -name 'History' -o -name 'Web Data' -o -name 'Local State' \) -print
```

Очікуваний результат: порожній список.

Також перевірити:

- немає `.env`;
- немає приватних ключів;
- немає зовнішніх iframe;
- `window.open` має `noopener,noreferrer`;
- iframe має sandbox;
- lesson progress не пишеться в `localStorage`.

---

## 3. Content validation checks

Потрібний окремий валідатор lesson data. До його появи агент має перевіряти вручну:

- кожен lesson id унікальний;
- кожен урок є в `catalog.js`;
- кожен урок має HTML-сторінку;
- кожен урок є в генераторі;
- кожна HTML-сторінка має правильний `data-lesson-id`;
- кожен activity має відомий `type`;
- кожен quiz answer існує серед options;
- кожен asset path існує;
- кожен coverage code існує в `ifo-catalog.js` або задокументований як новий.

---

## 4. PWA checks

Перевірити:

- `sw.js` містить усі HTML-сторінки уроків;
- `sw.js` містить усі JS-модулі уроків;
- `sw.js` містить усі task-модулі;
- `sw.js` містить усі локальні tools;
- `CACHE_NAME` змінений після оновлення app shell;
- offline fallback працює;
- невідомі зовнішні ресурси не кешуються.

---

## 5. Layout checks

Мінімальна матриця viewport:

```text
360×640     малий смартфон
390×844     типовий смартфон
768×1024    планшет portrait
1024×768    планшет landscape
1366×768    ноутбук
```

На кожному viewport:

- немає горизонтального overflow;
- primary action видно або легко досяжна;
- кнопки не перекриваються;
- canvas/iframe не вилазить за межі;
- teacher/student mode не ламають layout;
- текст не обрізається без доступу до прокрутки.

Автоматична перевірка, яку бажано додати:

```js
document.documentElement.scrollWidth <= window.innerWidth
```

---

## 6. Accessibility checks

Перевірити:

- tab-навігацію;
- focus-visible;
- aria-live feedback;
- label/legend для форм;
- aria-pressed для toggle-кнопок;
- reduced motion;
- контраст;
- можливість виконання без миші там, де це не canvas-малювання;
- альтернативу для canvas/drag-only завдань.

---

## 7. Pedagogical checks

Перед прийняттям нового уроку:

- [ ] одна головна ідея;
- [ ] не більше 1–2 нових понять;
- [ ] учнівський текст короткий;
- [ ] активності мають навчальну дію;
- [ ] student mode не містить методички;
- [ ] teacher mode містить короткий сценарій проведення;
- [ ] урок не перевантажений кількістю карток;
- [ ] є дружній фідбек;
- [ ] завдання можна пояснити дитині усно за 10–20 секунд.

---

## 8. Рекомендовані наступні автоматичні тести

1. `check-release-safety` — блокує `.browser-profile`, cookies, login data, env, keys.
2. `validate-lessons` — перевіряє структуру lesson data.
3. `check-sw-assets` — порівнює файлову систему і `sw.js`.
4. `check-text-complexity` — рахує довжину інструкцій у student mode.
5. `check-embedded-tools` — дозволяє лише same-origin `tools/` URL.
6. `layout-smoke` — перевіряє горизонтальний overflow на ключових viewport.

