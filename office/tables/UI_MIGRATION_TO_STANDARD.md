# UI_MIGRATION_TO_STANDARD.md — ПЛЮС Таблиці

## Поточний стан

Базовий shell, command adapter, file picker і статичний UI-аудит підключені.
Локальна структура вже вирівняна до `tables/js/core.js`, `tables/js/state.js`, `tables/js/grid.js`, `tables/js/structure.js`, `tables/js/workbook.js`, `tables/js/charts.js`, `tables/js/ui.js`, `tables/js/app.js`, `tables/js/runtime.js`.

## Найближчий борг

- Розширити `tables/js/charts.js` до навчальних сценаріїв: лінійні, стовпчикові й кругові діаграми з підписами, кількома рядами та виділеними діапазонами.
- Посилити `tables/js/structure.js`: формульні зсуви, перевірки діапазонів, масова вставка/видалення рядків і колонок.
- Додати майстер вставки формул поверх уже підтриманого ядра `IF`, `AND`, `OR`, `NOT`, `ROUND`, `MOD`, відсотків і статистичних функцій.
- Вирівняти тексти statusbar.
- Перевірити в браузері open/save workbook після shared file picker.
