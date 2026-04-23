# UI_STANDARD.md — ПЛЮС Схеми

Статус: локальний довідник редактора.

Глобальні правила дивись у `../UI_INTEGRATION_GUIDE.md` та `../OFFICE_UI_STANDARD.md`.

## Специфіка

- Тип: редактор блок-схем.
- Основні сценарії: створення блоків, з'єднань, підписів, експорт PNG, збереження JSON-проєкту.
- Меню: Файл, Редагування, Вставка, Перегляд, Допомога.
- `Ctrl+S` історично використовується для PNG export; JSON save відповідає toolbar Save і `Ctrl+Shift+S`.

## Локальні пріоритети

- Тримати виняток `Ctrl+S` явно задокументованим у меню.
- Standard toolbar actions мають мати `data-action`.
- File picker має йти через `OfficeUI.openFilePicker`.
