# UI_MIGRATION_TO_STANDARD.md — ПЛЮС Слайди

## Поточний стан

Базовий shell, command adapter, file picker і runtime-аудит підключені.
Локальна структура вже вирівняна до `slides/js/runtime.js -> slides/js/app.js`, де `app.js` є єдиним source of truth.

## Найближчий борг

- Переглянути контекстне форматування об'єктів.
- Перевірити open/save presentation у браузері.
- Вирівняти modal тексти та statusbar повідомлення.
