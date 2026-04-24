# Архітектура Office

Цей репозиторій має два незалежні, але узгоджені шари.

## Shared Root Layer

Корінь `office/` містить спільну інфраструктуру для всіх редакторів:

- `office-shell.js` — thin adapter-шар для boot, command routing і file picker, який використовують локальні `js/app.js`
- `office-ui.js` — shell-контракт, стандартні команди, modal/menu helpers, file picker
- `offline.js` — реєстрація Service Worker
- `sw.js` — offline/cache policy
- `UI_TOKENS.css`, `shell-overrides.css` — shared shell styling
- `vendor/` — локальні сторонні залежності
- документи стандартів і тести в `tests/`

Цей шар не повинен містити редактор-специфічну бізнес-логіку.

## Service Layer

Кожен редактор має власну папку і відповідає лише за свою предметну логіку, UI та локальний state.

Рекомендована структура сервісу:

- `index.html` — HTML shell сервісу
- `style.css` — локальні стилі сервісу
- `js/runtime.js` — стабільний entrypoint для HTML
- `js/app.js` — boot + адаптер до shared shell, який експонує `window.<Editor>App.boot`
- `js/state.js` — локальний UI/runtime state
- `js/ui.js` — DOM/UI helper layer
- `js/core.js` або доменні модулі на кшталт `editor.js`, `grid.js`, `workbook.js`
- `js/export.js`, `js/storage.js`, `js/utils.js`, `js/constants.js` — за потреби

## Layer Rules

- `index.html` підключає shared root-файли лише наприкінці: `../office-shell.js`, `../office-ui.js` і `../offline.js`.
- `js/runtime.js` не містить бізнес-логіки; він лише запускає `window.<Editor>App.boot` із `js/app.js`.
- `js/app.js` не дублює shared root API, а делегує в `window.OfficeShell` і `window.OfficeUI`.
- shared root-шар не повинен знати про внутрішню структуру конкретного редактора, окрім стабільних ресурсних шляхів у `sw.js` і тестах.
- сервісні модулі можуть залежати від shared root API, але не повинні конфліктувати з глобальними іменами інших сервісів.

## Поточна Ціль

Мета міграції — щоб усі редактори мали схожу семантику файлів, навіть якщо конкретні доменні модулі різняться.
