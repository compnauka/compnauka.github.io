# UI_STANDARD.md — ПЛЮС Таблиці

Статус: локальний довідник редактора.

Глобальні правила дивись у `../UI_INTEGRATION_GUIDE.md` та `../OFFICE_UI_STANDARD.md`.

## Специфіка

- Тип: табличний редактор.
- Основні сценарії: редагування клітинок, імпорт/експорт workbook, CSV, базове форматування, прості діаграми.
- Меню: Файл, Редагування, Вставка, Формат, Дані, Перегляд, Допомога.
- Стандартні команди мають іти через `OfficeUI.registerCommands` / `OfficeUI.runCommand`.
- Відкриття workbook має іти через `OfficeUI.openFilePicker`.

## Локальні пріоритети

- Не ламати ввід у клітинках глобальними hotkeys.
- Тримати header/context menus синхронізованими з `office:overlayclose`.
- Уникати дублювання formatting controls між toolbar і контекстом.
