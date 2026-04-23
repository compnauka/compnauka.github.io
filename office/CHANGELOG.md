# CHANGELOG

## 2026-04-23

### Done

- Runtime-маршрути головної сторінки очищено від старого брендового префікса.
- Усі редактори підключено до `office-ui.js`.
- Уніфіковано keyboard/dropdown-поведінку для верхнього меню.
- Додано спільний modal enhancer: focus return, `Escape`, ARIA sync, focus loop.
- Додано спільний status/announce layer.
- Statusbar-и всіх редакторів отримали спільний slot-контракт:
  - `data-office-status-slot="primary"`
  - `data-office-status-slot="secondary"`
  - service-specific додаткові слоти для zoom/canvas/style/meta.
- Runtime-код переведено з alert-неймінгу на modal-неймінг:
  - `showInfoModal`
  - `showConfirmModal`
  - `showPromptModal`
  - `showInfoModal` у таблицях замість `alertModal`.
- Confirm-кнопки вирівняно: `Скасувати` + конкретна дія замість `Так / Ні`.
- Посилено статичні тести:
  - перевірка root links;
  - перевірка `office-ui.js`;
  - перевірка наявності modal surface;
  - заборона старих alert API у runtime-файлах;
  - заборона `Так / Ні` як generic modal button labels;
  - перевірка `aria-label` і базових statusbar slots.
- Нормативні shell-приклади в `UI_INTEGRATION_GUIDE.md` переведено на `office-*` / `data-office-service`.
