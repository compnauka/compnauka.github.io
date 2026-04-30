# ROADMAP.md — практичний план виправлень

## 1. Пріоритети

Пріоритети визначені за принципом:

1. Спочатку дитяча безпека й доступність.
2. Потім архітектурна надійність.
3. Потім PWA/offline.
4. Потім змістова перебудова.
5. Потім полірування дизайну.

## 2. P0 — виправити до публікації

### P0.1. Дозволити масштабування

Файл: `index.html`

Замінити viewport на:

```html
<meta name="viewport" content="width=device-width, initial-scale=1.0">
```

Acceptance criteria:

- на мобільному можна збільшити сторінку;
- при zoom 200% сайт залишається читабельним.

### P0.2. Прибрати аналітику

Файл: `index.html`

Видалити:

- Google Analytics script;
- Plausible script;
- inline scripts для `gtag` і `plausible`.

Acceptance criteria:

- у Network немає запитів до `googletagmanager.com`, `google-analytics.com`, `plausible.io`;
- у коді немає `gtag` і `plausible`.

### P0.3. Виправити зовнішні посилання

Файл: `bookSections.js`

Усі посилання з `target="_blank"` мають отримати:

```html
rel="noopener noreferrer"
```

Acceptance criteria:

- пошук `target="_blank"` показує `rel` поруч.

### P0.4. Виправити `quizzes_updated.js`

Поточний файл синтаксично невалідний.

Варіанти:

- інтегрувати питання в `bookSections.js`;
- або перейменувати файл на `QUIZZES_DRAFT.md`;
- або видалити, якщо він не потрібен.

Acceptance criteria:

- усі `.js` файли проходять `node --check`.

## 3. P1 — accessibility

### P1.1. Skip-link

Додати skip-link до `index.html` і стилі в `style.css`.

Acceptance criteria:

- перший Tab показує “Перейти до змісту”;
- Enter переносить фокус до `main`.

### P1.2. ARIA для мобільного меню

Файли: `index.html`, `main.js`

Додати:

- `aria-controls="sidebar"`;
- `aria-expanded`;
- Escape-закриття;
- повернення фокуса.

Acceptance criteria:

- screen reader бачить стан меню;
- Escape закриває меню.

### P1.3. Reduced motion

Файл: `style.css`, за потреби `main.js`

Acceptance criteria:

- при `prefers-reduced-motion: reduce` анімації мінімізовані;
- повідомлення не з’являються надто повільно.

### P1.4. Alt-тексти

Файл: `bookSections.js`

Додати змістовні alt для кожного зображення.

Acceptance criteria:

- жодне змістове зображення не має `alt="Ілюстрація"`.

### P1.5. Аудіо-транскрипт

Файл: `bookSections.js`

Додати опис або текст для `AI_SONG.mp3`.

Acceptance criteria:

- зміст аудіо зрозумілий без прослуховування.

## 4. P2 — архітектура

### P2.1. Розділити `main.js`

Мінімальний поділ:

```text
main.js
navigation.js
renderers.js
quiz.js
storage.js
menu.js
```

Acceptance criteria:

- кожен файл має одну відповідальність;
- поведінка книги не змінилася;
- усі JS-файли проходять синтаксичну перевірку.

### P2.2. Новий формат контенту

Перейти від HTML-рядків до структурованих блоків.

Acceptance criteria:

- новий розділ можна додати без HTML;
- текст рендериться через `textContent`;
- списки й посилання рендеряться через окремі функції.

### P2.3. Валідація контенту

Додати простий валідатор:

- кожен розділ має `id`, `title`, `messages`;
- кожне повідомлення має `speaker` і `blocks`;
- кожне зображення має `src` і `alt`;
- кожен квіз має питання, варіанти й пояснення.

Acceptance criteria:

- при помилці в контенті в консолі є зрозуміле повідомлення;
- порожній/битий розділ не ламає всю книгу.

## 5. P3 — PWA/offline

### P3.1. Додати manifest

Файл: `manifest.json`

Acceptance criteria:

- Chrome DevTools бачить manifest;
- назва й іконки коректні.

### P3.2. Додати service worker

Файл: `sw.js`

Acceptance criteria:

- service worker реєструється;
- основні файли кешуються.

### P3.3. Додати offline page

Файл: `offline.html`

Acceptance criteria:

- при відсутності мережі користувач бачить зрозуміле повідомлення.

## 6. P4 — змістова перебудова під Тиждень ШІ

### P4.1. Вступ

Переписати вступ як сцену оголошення Тижня ШІ у школі.

### P4.2. Розділи 1–3

Прив’язати до:

- розуміння поняття ШІ;
- пошуку й перевірки фактів;
- плаката “ШІ навколо нас”.

### P4.3. Розділ 4

Замінити машинне навчання на демонстрацію з картками:

- кіт;
- пес;
- не тварина.

### P4.4. Розділ 5

Генеративний ШІ — створення матеріалів для Тижня ШІ.

### P4.5. Розділи 6–7

Переписати ризики й безпеку без залякування, але чесно.

### P4.6. Розділ 8

Активність для першачків.

### P4.7. Розділ 9

Фінальна доповідь Тимка.

Acceptance criteria для P4:

- кожен розділ має конкретний шкільний результат;
- сюжет рухається від розгубленості до впевненості;
- фінал збирає всі попередні артефакти.

## 7. P5 — дизайн і полірування

- Уніфікувати design tokens.
- Прибрати зайві hardcoded значення.
- Перевірити типографіку на мобільному.
- Покращити empty/fallback стани для медіа.
- Додати акуратні зовнішні індикатори для посилань.

## 8. Рекомендований порядок комітів

1. `fix: remove analytics and allow zoom`
2. `fix: improve menu accessibility`
3. `fix: add reduced motion and skip link`
4. `chore: resolve invalid quiz draft file`
5. `refactor: split rendering and navigation modules`
6. `refactor: introduce structured content blocks`
7. `feat: add PWA offline support`
8. `content: rewrite book around AI Week storyline`
9. `test: add manual QA checklist and content validation`

## 9. Визначення “готово”

Проєкт готовий до першої публічної версії, якщо виконані P0, P1, P3 і базова частина P4.

Архітектурний P2 бажано зробити до великої змістової перебудови, щоб не переносити HTML-рядки в новий контент.
