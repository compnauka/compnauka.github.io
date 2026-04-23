# CHANGELOG

## 2026-04-23

### Уніфікація shell

- Усі 6 редакторів підключені до `UI_TOKENS.css`, `office-ui.js`, `shell-overrides.css` та `offline.js`.
- Зафіксовано базовий shell-контракт: header, menubar, toolbar, workspace, statusbar.
- Статичний аудит перевіряє `office-*` класи, `data-office-service`, порядок стилів і локальні asset paths.

### Overlay, modal, dropdown

- Додано shared modal behavior в `office-ui.js`: ARIA sync, `Escape`, focus return, focus loop.
- Виправлено ризик MutationObserver-loop: observed attributes тепер записуються тільки при зміні значення.
- Глобальний `pointerdown` більше не закриває активну модалку при кліку всередині неї.
- Локальні меню/picker синхронізують стан через `office:overlayclose`.

### Standard Commands

- Додано `OfficeUI.registerCommand`, `OfficeUI.registerCommands`, `OfficeUI.hasCommand`, `OfficeUI.runCommand`.
- Усі редактори реєструють стандартні команди `new/open/save/undo/redo`.
- Тулбар, головне меню та hotkeys поступово переведені на `OfficeUI.runCommand`.
- Статичний аудит перевіряє:
  - наявність command adapter;
  - маршрутизацію кожної стандартної команди;
  - parity між кнопкою тулбара та пунктом головного меню.

### File Picker

- Додано `OfficeUI.openFilePicker(inputOrId)`.
- File-open точки в редакторах переведені на shared helper.
- Helper скидає `input.value`, щоб повторне відкриття того самого файлу не губило `change` event.
- Статичний аудит перевіряє використання `OfficeUI.openFilePicker` у кожному редакторі.

### Save/Open стабілізація

- Перевірено `Save` у всіх редакторах через статичний контракт.
- Flowcharts більше не має окремого винятку для toolbar Save: стандартні toolbar-кнопки отримали явні `data-action`.
- Vector отримав захист від подвійного спрацювання `toggle-snap`.

### Стилі і токени

- Аудит перевіряє, що `UI_TOKENS.css` підключений до локальних стилів, а `shell-overrides.css` після них.
- Локальні `style.css` не повинні перевизначати `--office-*` токени або `.office-*` component selectors.
- Локальний `--accent` має відповідати `SERVICE_THEME_MAP.json`.

### Документація

- `UI_INTEGRATION_GUIDE.md` оновлено до поточного command/file-picker/modal/status контракту.
- `README.md` розділено на активні джерела правди, довідкові документи і кандидати на архів.
- Поточний висновок: кількість документації завелика для щоденної розробки, але масово видаляти її не варто без окремого архівного кроку.
