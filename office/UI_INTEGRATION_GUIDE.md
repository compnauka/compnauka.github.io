Окремо звіряти contextual UI з `CONTEXTUAL_UI_STANDARD.md`.

# Технічний гайд з інтеграції UI-стандарту Офіс ПЛЮС

Цей файл описує, як впроваджувати глобальний UI-стандарт у код кожного сервісу.

## 1. Мінімальний обов'язковий набір файлів

У корені монорепи або спільного шару UI повинні існувати:

- `ART_OFFICE_UI_STANDARD.md`
- `UI_TOKENS.css`
- `design-tokens.json`
- `SERVICE_THEME_MAP.json`
- `KEYBOARD_SHORTCUTS.md`
- `WORKSPACE_ACCESSIBILITY.md`
- `MODAL_STANDARD.md`
- `DROPDOWN_STANDARD.md`

У корені кожного сервісу повинні існувати:

- `UI_STANDARD.md`
- `UI_MIGRATION_TO_STANDARD.md`

## 2. Базова DOM-структура

Кожен сервіс повинен прагнути до такого shell-каркаса:

```html
<body class="office-app" data-office-service="text">
  <header class="office-header">...</header>
  <nav class="office-menubar">...</nav>
  <section class="office-toolbar">...</section>
  <section class="office-contextual-ui" hidden>...</section>
  <main class="office-workspace office-workspace-focusable" tabindex="0">...</main>
  <footer class="office-statusbar">...</footer>
</body>
```

`data-office-service` має значення:

- `text`
- `tables`
- `paint`
- `slides`
- `flowcharts`
- `vector`

Саме цей атрибут підключає акцентний колір сервісу через `UI_TOKENS.css`.

## 3. Обов'язкові ролі блоків

### 3.1. Header

Header містить тільки:

- іконку сервісу;
- назву сервісу;
- назву документа / проєкту;
- стан збереження.

Header не використовується як ще один toolbar.

### 3.2. Menubar

У меню не повинно бути іконкових кнопок. Меню — це текстові пункти першого рівня.

Базовий порядок:

- `Файл`
- `Редагування`
- `Вставка`
- `Інструменти` лише якщо це дозволено сервісом
- предметні меню сервісу
- `Перегляд`
- `Допомога`

### 3.3. Toolbar

У toolbar обов'язковий порядок груп:

1. файлова група;
2. історія;
3. базові дії сервісу;
4. швидкі предметні дії;
5. вигляд / масштаб праворуч.

### 3.4. Contextbar

Contextbar показується лише коли це справді доречно.

Приклади:

- у Тексті — коли виділено текст або обране зображення / таблицю;
- у Слайдах — коли виділено текстовий блок, фігуру або зображення;
- у Векторі — коли вибрано один або кілька об'єктів;
- у Таблицях — коли є активне виділення, де релевантне форматування;
- у Малюнках — для молодших учнів бажано sticky inspector або стабільна панель параметрів;
- у Схемах — коли вибрано блок або стрілку, але краще у стабільному місці.

Контекстна панель не повинна дублювати весь toolbar.

## 4. Обов'язкові CSS-класи

Стандартний UI-шар повинен прагнути використовувати такі класи:

- `.office-app`
- `.office-header`
- `.office-menubar`
- `.office-menu-button`
- `.office-toolbar`
- `.office-toolbar-group`
- `.office-contextual-ui`
- `.office-context-group`
- `.office-button`
- `.office-icon-button`
- `.office-select`
- `.office-input`
- `.office-chip`
- `.office-divider`
- `.office-statusbar`
- `.office-status-group`
- `.office-workspace`
- `.office-workspace-focusable`
- `.office-dropdown`
- `.office-popover`
- `.office-modal`
- `.office-modal-backdrop`

Допускаються локальні префіксовані класи сервісу, але shell-рівень має бути сумісний з цими базовими класами.

## 5. Що треба винести в спільний шар

У shared UI повинні жити:

- токени кольорів, розмірів, відступів, радіусів;
- стани кнопок;
- меню та dropdown;
- кнопки zoom;
- статус-бар;
- focus-visible;
- hover/active/disabled поведінка;
- розділювачі груп;
- базова типографіка shell-рівня;
- базова поведінка modal, dropdown і workspace focus.

У локальному сервісі повинні жити:

- контент редактора;
- специфічні віджети;
- специфічні панелі інструментів;
- логіка редактора;
- специфічні контекстні інспектори.

## 6. Інваріанти, які не можна ламати

Розробник або агент не має права:

1. переносити `Undo / Redo` вправо, якщо в інших сервісах вони лишаються зліва;
2. міняти місцями `Файл` і `Редагування`;
3. ховати масштаб у довільне місце без причини;
4. робити toolbar нижчим або вищим без узгодження зі стандартом;
5. змінювати кольори shell-рівня не через токени;
6. створювати другий або третій повноцінний ряд toolbar без обґрунтування;
7. дублювати одні й ті самі команди одночасно в меню, toolbar, бічній панелі та contextual UI без явної причини;
8. ламати `Ctrl+S`, `Ctrl+Z`, `Esc`, `Tab` і повернення фокуса.

## 7. Політика адаптивності

На вузьких екранах дозволено:

- переносити toolbar на два рядки;
- згортати другорядні групи у кнопку `Ще`;
- зменшувати кількість одночасно видимих підписів;
- стискати dropdown до іконки + chevron, якщо значення видно окремо.

На вузьких екранах заборонено:

- міняти порядок базових груп;
- прибирати `Новий / Відкрити / Зберегти` без альтернативи першого рівня;
- ховати `Undo / Redo` глибше, ніж на один клік;
- робити меню недоступним з клавіатури.

## 8. Behavior-first інтеграція

### 8.1. Keyboard shortcuts
- звіряти з `KEYBOARD_SHORTCUTS.md`;
- скорочення, показані в меню, мають реально працювати.

### 8.2. Workspace focus
- додавати `tabindex="0"` там, де відсутній native focus;
- використовувати `.office-workspace-focusable:focus-visible` або еквівалент;
- після закриття overlay фокус повертати на trigger або workspace.

### 8.3. Modal
- використовувати єдину структуру `header → body → footer`;
- тримати focus trap;
- не пробивати modal глобальними гарячими клавішами документа.

### 8.4. Dropdown / picker
- підтримувати `Esc`;
- підтримувати click-outside close;
- повертати фокус на trigger після закриття.

## 9. Definition of Done для UI-рефакторингу

Зміна вважається завершеною лише якщо:

- shell-рівень відповідає `ART_OFFICE_UI_STANDARD.md`;
- локальний сервіс відповідає своєму `UI_STANDARD.md`;
- відмінності від локального стандарту явно зафіксовані;
- використані глобальні токени з `UI_TOKENS.css` або `design-tokens.json`;
- нові елементи мають стани `default / hover / active / focus-visible / disabled`;
- toolbar не збільшує когнітивне навантаження і не дублює contextual UI;
- shortcuts, modal, dropdown і workspace focus перевірені за окремими стандартами.
## Implementation Status (2026-04-23)

Вже впроваджено в коді:

- нейтральні service routes без старого брендового префікса у runtime-навігації;
- спільний shell через `UI_TOKENS.css`;
- спільний поведінковий шар через `office-ui.js`;
- спільна keyboard/dropdown-поведінка;
- спільний modal enhancer для існуючих modal-патернів;
- runtime modal API naming:
  - info: `showInfoModal(...)`
  - confirm: `showConfirmModal(...)`
  - prompt/input: `showPromptModal(...)`
  - старі `showAlert`, `alertModal`, `showTextPrompt` не використовуються;
- confirm footer order:
  - secondary/cancel ліворуч: `Скасувати`
  - primary праворуч: конкретна дія (`Створити`, `Видалити`, `Очистити`, `Завантажити`, `Продовжити`);
- спільний status/announce API:
  - `window.OfficeUI.updateStatus(message, slot?)`
  - `window.OfficeUI.announce(message)`
  - `document.dispatchEvent(new CustomEvent('office:status', { detail: { message, slot } }))`
- statusbar slot contract:
  - кожен редактор має `data-office-status-slot="primary"`
  - кожен редактор має `data-office-status-slot="secondary"`
  - додаткові службові слоти допускаються як `meta`, `zoom`, `canvas`, `style` або локально обґрунтовані значення;

Ще потребує повної редакторної міграції:

- локальні модальні сценарії ще треба візуально вирівняти між редакторами;
- statusbar-контент у кожному редакторі ще треба візуально і текстово відполірувати;
- нормативні shell-приклади в цьому документі переведені на `office-*` / `data-office-service`.
