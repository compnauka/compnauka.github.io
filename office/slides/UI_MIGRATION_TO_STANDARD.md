# UI_MIGRATION_TO_STANDARD.md — ПЛЮС Слайди

## Поточний стан

Базовий shell, command adapter, file picker і runtime-аудит підключені. `slides/js/runtime.js` лишається стабільним module entrypoint, а `slides/js/app.js` все ще є головним coordinator-файлом редактора.

Почато декомпозицію `app.js`: файлово-проєктну логіку, список слайдів, stage rendering, pointer interactions і modal UI винесено в окремі модулі.

## Поточна структура

- `slides/js/runtime.js` — module entrypoint, який запускає `SlidesApp.boot`.
- `slides/js/app.js` — boot, UI coordinator, stage interactions, command dispatch.
- `slides/js/project.js` — нормалізація презентації/елементів, import/export JSON payload, filename slug.
- `slides/js/slide-list.js` — thumbnails, drag reorder і кнопки керування слайдами.
- `slides/js/stage-renderer.js` — DOM-рендеринг сцени, елементів, handles і selected-state.
- `slides/js/stage-interactions.js` — pointer state, drag, resize і координати сцени.
- `slides/js/modal-ui.js` — show/close/info/confirm modal behavior.
- `slides/js/state.js` — локальний state і serialization.
- `slides/js/history.js` — undo/redo stack.
- `slides/js/storage.js` — autosave draft у localStorage.
- `slides/js/templates.js` — створення слайдів, елементів і макетів.
- `slides/js/export.js` — PDF export, print і snapshot rendering.
- `slides/js/utils.js` — DOM, file і utility helpers.

## Найближчий борг

- Розділити `app.js` далі тільки за чіткими межами: menu/color popover UI, presentation mode, object commands.
- Перевірити open/save presentation у браузері після винесення `project.js`.
- Вирівняти modal тексти та statusbar повідомлення.
- Додати browser-smoke сценарій для імпорту/експорту `.artslides.json`.

## Обмеження

Не повторювати помилку надмірного дроблення: новий модуль у `slides/js` має з'являтися лише тоді, коли він забирає самостійну відповідальність з `app.js` і може бути зафіксований у статичному аудиті або browser-smoke тесті. Після поточного проходу наступний крок має бути стабілізаційним або поведінковим, а не механічним подрібненням.
