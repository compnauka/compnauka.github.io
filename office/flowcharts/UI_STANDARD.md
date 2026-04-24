# UI_STANDARD.md — ПЛЮС Схеми

Статус: локальний довідник редактора.

Глобальні правила дивись у `../UI_INTEGRATION_GUIDE.md` та `../OFFICE_UI_STANDARD.md`.
Архітектурну межу між shared root-шаром і локальним шаром редактора дивись у `../ARCHITECTURE.md`.

## Специфіка

- Тип: редактор блок-схем.
- Основні сценарії: створення блоків, з'єднань, підписів, експорт PNG, збереження JSON-проєкту.
- Меню: Файл, Редагування, Вставка, Перегляд, Допомога.
- `Ctrl+S` історично використовується для PNG export; JSON save відповідає toolbar Save і `Ctrl+Shift+S`.

## Локальні пріоритети

- Тримати виняток `Ctrl+S` явно задокументованим у меню.
- Standard toolbar actions мають мати `data-action`.
- File picker має йти через `OfficeUI.openFilePicker`.

## Локальна структура

- `flowcharts/index.html` — HTML shell редактора.
- `flowcharts/style.css` — локальні стилі редактора.
- `flowcharts/js/runtime.js` — стабільний runtime entrypoint без бізнес-логіки.
- `flowcharts/js/app.js` — boot і shell-adapter (`FlowchartsApp.boot`).
- `flowcharts/js/core.js` — доменна логіка блоків, зв'язків і моделі схеми.
- `flowcharts/js/ui.js` — DOM/UI-шар редактора.
- `flowcharts/js/editor.js` — orchestration шару редактора й взаємодія між core та UI.
