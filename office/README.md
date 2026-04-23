# Пакет UI-стандартів для Офіс ПЛЮС

Ця папка містить MVP шкільного офісного пакета і нормативну базу для приведення всіх редакторів до єдиного стилю, поведінки та тестованої структури.

## Редактори

- `text/` — ПЛЮС Текст
- `tables/` — ПЛЮС Таблиці
- `paint/` — ПЛЮС Малюнки
- `slides/` — ПЛЮС Слайди
- `flowcharts/` — ПЛЮС Схеми
- `vector/` — ПЛЮС Вектор

## Нормативні документи

- `ART_OFFICE_UI_STANDARD.md` — головний UI-стандарт усієї лінійки
- `UI_TOKENS.css` — спільні CSS-токени та базові shell-компоненти
- `design-tokens.json` — машинозчитуваний набір дизайн-токенів
- `SERVICE_THEME_MAP.json` — карта сервісів, акцентів і структури меню
- `UI_INTEGRATION_GUIDE.md` — технічний гайд з інтеграції стандарту в код
- `APP_SHELL.html` — базовий HTML-шаблон shell-інтерфейсу
- `SHELL_COMPONENTS.md` — правила для titlebar, menu bar, toolbar, contextual UI, workspace, statusbar
- `SERVICE_SHELL_BLUEPRINTS.md` — shell-схеми для кожного редактора
- `COMPONENT_CHECKLIST.md` — чекліст для рев'ю, QA і приймання
- `KEYBOARD_SHORTCUTS.md` — єдиний стандарт гарячих клавіш
- `WORKSPACE_ACCESSIBILITY.md` — focus-visible, tabindex, повернення фокуса і keyboard interaction у workspace
- `MODAL_STANDARD.md` — єдиний стандарт модальних вікон
- `DROPDOWN_STANDARD.md` — єдиний стандарт dropdown, menu, picker і popover-поведінки
- `CONTEXTUAL_UI_STANDARD.md` — єдиний стандарт контекстного UI
- `CHANGELOG_STANDARD.md` — стандарт ведення changelog для UI-змін
- `UI_REVIEW_TEMPLATE.md` — шаблон формалізованого UI-рев'ю
- `PROMPT_FOR_AGENT.md` — регламент для агента або розробника

У корені кожного редактора повинні бути:

- `UI_STANDARD.md`
- `UI_MIGRATION_TO_STANDARD.md`

## Поточна стратегія міграції

1. Зафіксувати baseline і тестовий стенд.
2. Підключити `UI_TOKENS.css` і `art-*` shell-класи у всі редактори.
3. Винести зовнішні CDN-ресурси в локальний `vendor/`, щоб редактори працювали офлайн.
4. Уніфікувати меню, toolbar, statusbar, zoom, undo/redo.
5. Уніфікувати поведінку keyboard shortcuts, dropdown, modal і workspace focus.
6. Після цього полірувати редактори по одному за локальними `UI_MIGRATION_TO_STANDARD.md`.

## Тести

Запуск базового статичного аудиту:

```powershell
powershell -ExecutionPolicy Bypass -File tests\run-tests.ps1
```

Тест перевіряє:

- наявність обов'язкових стандартів;
- наявність усіх 6 редакторів;
- локальні `UI_STANDARD.md` і `UI_MIGRATION_TO_STANDARD.md`;
- підключення `../UI_TOKENS.css`;
- `body.office-app` і правильний `data-office-service`;
- базові `office-header`, `office-menubar`, `office-toolbar`, `office-workspace`, `office-statusbar`;
- focusable workspace;
- очікувані пункти меню.

`tests/browser-smoke.html` можна відкрити в браузері як додатковий smoke-тест DOM-структури. Зовнішні CDN-ресурси поки лише позначаються warning-ами: їх винесення в локальний `vendor/` є окремим наступним кроком.

Локальний сервер для першої браузерної перевірки:

```powershell
powershell -ExecutionPolicy Bypass -File tests\serve-office.ps1 -Port 4173
```

Після запуску відкрий:

- `http://127.0.0.1:4173/`
- `http://127.0.0.1:4173/tests/browser-smoke.html`

