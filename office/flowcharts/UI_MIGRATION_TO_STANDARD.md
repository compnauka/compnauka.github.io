# UI_MIGRATION_TO_STANDARD.md — ПЛЮС Схеми

## Поточний стан

Базовий shell, command adapter, toolbar/menu parity і file picker підключені.
Локальна структура вже вирівняна до `flowcharts/js/core.js`, `flowcharts/js/ui.js`, `flowcharts/js/editor.js`, `flowcharts/js/app.js`, `flowcharts/js/runtime.js`.

## Найближчий борг

- Перевірити ручний сценарій Help/About, open project, PNG save і JSON save.
- Вирівняти statusbar тексти.
- Пізніше вирішити, чи залишати виняток `Ctrl+S = PNG`, чи перевести на єдину модель.
