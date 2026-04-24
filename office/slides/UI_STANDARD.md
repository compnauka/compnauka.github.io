# UI_STANDARD.md — ПЛЮС Слайди

Статус: локальний довідник редактора.

Глобальні правила дивись у `../UI_INTEGRATION_GUIDE.md` та `../OFFICE_UI_STANDARD.md`.
Архітектурну межу між shared root-шаром і локальним шаром редактора дивись у `../ARCHITECTURE.md`.

## Специфіка

- Тип: редактор презентацій.
- Основні сценарії: створення слайдів, редагування тексту/фігур/зображень, збереження проєкту, презентаційний режим.
- Меню: Файл, Редагування, Вставка, Слайд, Перегляд, Допомога.
- Runtime bundle: `slides/js/runtime.js` є перевіреним deployed entry.

## Локальні пріоритети

- Не перевантажувати постійну панель об'єктним форматуванням.
- File picker для проєктів і зображень має йти через `OfficeUI.openFilePicker`.
- Standard commands мають лишатися синхронними між меню, toolbar і hotkeys.

## Локальна структура

- `slides/index.html` — HTML shell редактора.
- `slides/style.css` — локальні стилі редактора.
- `slides/js/runtime.js` — стабільний module entrypoint, який лише піднімає застосунок.
- `slides/js/app.js` — source of truth для `SlidesApp.boot`, shell-adapter і команд редактора.
- `slides/js/export.js` — експорт і друк презентації.
- `slides/js/ui.js` та доменні модулі — локальна UI- і редакторна логіка.
