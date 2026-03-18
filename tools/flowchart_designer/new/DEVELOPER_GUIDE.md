# Технічний гайд: Редактор блок-схем

Цей документ призначений для розробників і ШІ-агентів, які вносять зміни в редактор блок-схем у каталозі `tools/flowchart_designer/new`.

## Призначення

Редактор блок-схем — навчальний веб-інструмент для учнів 5–11 класів з інформатики.
Проєкт працює без збірки, без npm-залежностей у рантаймі і запускається як звичайний статичний сайт.

Ключові властивості:

- ванільний JavaScript без фреймворків
- логіка маршрутизації винесена в окреме ядро без DOM
- UI, drag-and-drop, модалки, undo/redo і взаємодія з полотном живуть у `script.js`
- довідник для учнів — окремий самодостатній файл `manual.html`

## Файли

Основні файли:

- [index.html](/d:/GIT/compnauka.github.io/tools/flowchart_designer/new/index.html) — основна сторінка редактора
- [style.css](/d:/GIT/compnauka.github.io/tools/flowchart_designer/new/style.css) — стилі редактора і локальна дизайн-система
- [script.js](/d:/GIT/compnauka.github.io/tools/flowchart_designer/new/script.js) — увесь UI-рантайм редактора
- [flowchart-core.js](/d:/GIT/compnauka.github.io/tools/flowchart_designer/new/flowchart-core.js) — ядро: маршрутизація, серіалізація, нормалізація
- [manual.html](/d:/GIT/compnauka.github.io/tools/flowchart_designer/new/manual.html) — довідник для учнів

Тести:

- [tests/flowchart-core.test.js](/d:/GIT/compnauka.github.io/tools/flowchart_designer/new/tests/flowchart-core.test.js) — логіка ядра
- [tests/encoding.test.js](/d:/GIT/compnauka.github.io/tools/flowchart_designer/new/tests/encoding.test.js) — перевірка на пошкодження кодування

Схеми для довідника:

- `schema_001.png` … `schema_005.png`
- `schema_006_while.svg`
- `schema_007_repeat_until.svg`

## Важливі правила змін

Перед редагуванням дотримуйся цих інваріантів:

- Не додавати зовнішніх build/runtime-залежностей.
- `flowchart-core.js` не повинен звертатись до `document`, `window`, DOM або браузерного стану.
- Увесь код `script.js` знаходиться всередині одного `DOMContentLoaded`-listener.
- Нові змінні стану, функції та обробники в `script.js` треба додавати всередині цього замикання.
- `manual.html` — окремий самодостатній документ зі своїм `<style>`.
- Інтерфейс, підказки, повідомлення й коментарі мають лишатися україномовними.

## Як усе влаштовано

### 1. `flowchart-core.js`

Це pure-ядро, яке можна використовувати і в браузері, і в Node-тестах.

Основне:

- `DEFAULT_BASE_COLORS` — базові кольори фігур
- `ROUTE_MODES` — режими маршруту стрілки: `auto`, `vertical`, `horizontal`, `bypass-left`, `bypass-right`
- `PROJECT_LIMITS` — ліміти імпорту JSON
- `getDefaultText(type, shapes)` — дефолтний текст фігур
- `smartWrapText(raw, type)` — розбиття тексту по рядках
- `getEdgePoints(shape, outset)` — точки приєднання стрілок
- `routeOrthogonal(fromShape, toShape, routeMode)` — ортогональний маршрут між блоками
- `resolveConnectionLabel(conn)` — підпис стрілки: кастомний або автоматичний `Так/Ні`
- `serializeProject(state, positionsById)` — експорт проєкту
- `parseProject(raw)` — безпечний імпорт і нормалізація проєкту

Цей файл не знає нічого про DOM-елементи. Він працює лише з простими JS-об’єктами формату:

```js
{
  left, top, width, height, type
}
```

### 2. `script.js`

Це головний UI-контролер редактора.

Важлива особливість: майже вся поведінка живе в одному великому `DOMContentLoaded`-замиканні. Тут створюються:

- посилання на DOM
- кнопки верхньої панелі
- внутрішні модалки
- глобальний `state`
- drag/drop блоків
- підключення стрілок
- undo/redo
- автозбереження
- імпорт/експорт
- help-panel

Ключові секції:

- DOM initialization
- state and snapshots
- autosave
- coordinates and canvas transforms
- handles and connections
- selection and context bars
- shape creation/deletion
- import/export
- help and global shortcuts

### 3. `style.css`

CSS уже виконує роль маленької дизайн-системи.

У `:root` є групи токенів:

- базові кольори бренду і фігур
- action-токени для кнопок
- panel-токени для плаваючих контекстних панелей
- modal/help токени
- surface-токени для карток, м’яких фонів і службових блоків
- control-токени для тіней, фокусів, радіусів

Якщо треба змінити вигляд кнопок або поверхонь, спочатку дивись у `:root`, а не в окремий селектор.

### 4. `manual.html`

Довідник живе окремо від редактора.

Він:

- не використовує `style.css`
- містить власний `<style>`
- має багато навчального контенту, прикладів і вбудованих/зовнішніх схем

Тут не слід зав’язуватися на DOM редактора або спільні CSS-класи з `index.html`.

## Стан редактора

Головний `state` у [script.js](/d:/GIT/compnauka.github.io/tools/flowchart_designer/new/script.js) містить:

```js
{
  shapes: [],
  connections: [],
  selectedShape: null,
  selectedConnId: null,
  baseColors: {},
  currentColor: '#3f51b5',
  lastShapeType: 'process',
  snapEnabled: true,
  diagramTitle: '',
  shapeCounter: 0,
  scale: 1,
  minScale: 0.2,
  maxScale: 3.5,
  scaleStep: 0.1,
  activeShape: null,
  dragState: null,
  connDrag: null,
  pendingConn: null,
  undoStack: [],
  redoStack: [],
  MAX_UNDO: 30
}
```

### `shapes`

Зберігає логічні блоки:

```js
{ id, type, color, textRaw }
```

Позиції блоків не дублюються постійно в `state.shapes`, а беруться з DOM під час snapshot/export.

### `connections`

Зберігає стрілки:

```js
{ id, from, to, type, routeMode, label }
```

`type`:

- `null` — звичайна стрілка
- `yes` — гілка `Так`
- `no` — гілка `Ні`

## Формат JSON-проєкту

Поточний формат серіалізації:

```json
{
  "version": 2,
  "diagramTitle": "",
  "shapeCounter": 0,
  "lastShapeType": "process",
  "snapEnabled": true,
  "baseColors": {},
  "shapes": [
    {
      "id": "shape-1",
      "type": "process",
      "color": "#03a9f4",
      "textRaw": "Дія",
      "left": 100,
      "top": 120
    }
  ],
  "connections": [
    {
      "id": "conn-shape-1-shape-2",
      "from": "shape-1",
      "to": "shape-2",
      "type": null,
      "routeMode": "auto",
      "label": null
    }
  ]
}
```

`parseProject()` у ядрі:

- нормалізує типи фігур
- перевіряє id
- обрізає текст по лімітах
- клацає координати в допустимі межі
- викидає невалідні з’єднання

## Ключові UX-конвенції

Ці правила вже закладені в поведінку редактора та довідник.

### Ромб `Умова`

- `Так` виходить ліворуч
- `Ні` виходить праворуч

Це важливо для маршрутизації, підписів і навчального тексту.

### Контекстні панелі

Панелі `Вибрана стрілка` і `Вибраний блок` тепер:

- показуються поверх схеми
- стоять по центру
- завжди розташовані під хедером
- не залежать від прокрутки полотна

Позиція керується CSS-змінною `--floating-bar-top`, яку JS оновлює через `updateFloatingBarOffset()`.

### Snap-to-grid

- сітка ввімкнена за замовчуванням
- логічний крок snap: `20px`
- візуальний крок фону полотна: `24px`
- стан snap зберігається в undo/redo і JSON-проєкті

### Видалення блока

Видалення зроблено “розумним”:

- простий порожній блок без важливих наслідків видаляється одразу
- якщо є з’єднання або змістовний текст, показується confirm-модалка

## Ключові функції в `script.js`

Не весь файл треба читати підряд. Найважливіші точки входу:

- `createShape(...)` — створення блока
- `connectShapes(...)` — створення стрілки
- `updateConnection(connId)` — перемальовка стрілки
- `updateConnectionBar()` — показ/оновлення верхньої контекстної панелі
- `deleteSelected()` — видалення вибраного блока або стрілки
- `performShapeDeletion(shapeEl)` — фактичне видалення блока
- `collectProjectData()` — збирання проєкту для збереження
- `downloadProjectJson()` — експорт JSON
- `openProjectFilePicker()` / `importProjectFromText(...)` — імпорт
- `renderHelpPanelContent()` — контент help-panel
- `scheduleRefresh()` / `refreshAll()` — синхронізація геометрії після змін

## Handles і з’єднання

Для конекторів використовується двошаровий підхід:

- `.conn-handle-hit-area` — невидима збільшена зона натискання
- `.conn-handle-visual` — видимий маленький кружечок

Це зроблено спеціально для touch-пристроїв.

Якщо змінюєш handles, треба перевіряти разом:

- `createHandleGroup`
- `updateHandleGroup`
- `showHandlesForShape`
- `hideAllHandles`
- `attachHandleListeners`
- CSS для `#connectors-layer`

## Undo / redo / autosave

Undo/redo побудовані на snapshot-підході.

Snapshot містить:

- shapes
- connections
- baseColors
- diagramTitle
- shapeCounter
- lastShapeType
- snapEnabled

Автозбереження:

- зберігається в `localStorage`
- ключ: `flowchart-designer-2-autosave`
- виконується через `requestAnimationFrame`, не синхронно після кожної дрібниці

## Зовнішні ресурси

У `index.html` є зовнішні CDN-підключення:

- Google Fonts (`Nunito`)
- Font Awesome
- `html2canvas`

Це не npm-залежності проєкту, але вони потрібні в браузері.
Якщо щось не працює офлайн, перш за все перевір ці підключення.

## Тестування

Запуск:

```bash
npm test
```

Що покривається:

- базова логіка маршрутизації
- підписи `Так/Ні`
- overlap лейблів
- обхідні маршрути
- серіалізація/парсинг JSON
- перевірка на типові “кракозябри” кодування

Корисна додаткова локальна перевірка:

```bash
node --check script.js
```

## Типові пастки

### 1. Не лізь з DOM у `flowchart-core.js`

Якщо нова логіка потребує `document`, вона не повинна йти в core.

### 2. Не створюй новий глобальний модуль без потреби

У цьому редакторі майже все навмисно централізовано в одному `script.js`.
Краще тримати нові зміни в наявній структурі, ніж починати часткову “псевдомодульну” міграцію.

### 3. Обережно з текстами

Український інтерфейс важливий не лише для UX, а й для навчального контексту.
Після великих правок бажано запускати `npm test`, бо там є перевірка кодування.

### 4. Не ламай конвенцію `Так/Ні`

Навіть якщо в підручниках буває інакше, поточна логіка редактора, довідник і приклади спираються на:

- `Так` ліворуч
- `Ні` праворуч

### 5. Контекстні панелі тепер fixed

Якщо міняєш хедер або його висоту, не забудь перевірити:

- чи не перекриває він `connectionBar`
- чи правильно працює `updateFloatingBarOffset()`

## Рекомендований порядок діагностики багів

Якщо щось “ламається”, перевір у такому порядку:

1. Чи це проблема DOM/UI в `script.js`
2. Чи це проблема geometry/routing у `flowchart-core.js`
3. Чи зламався CSS-шар кнопок/панелей у `style.css`
4. Чи відтворюється проблема після `npm test`
5. Чи не зіпсоване кодування текстів

## Якщо редагуєш довідник

Пам’ятай:

- `manual.html` живе окремо
- там уже є підготовлені закоментовані теги для заміни SVG-схем циклів на звичайні зображення
- не треба переносити туди класи або залежності з редактора

## Коли документ треба оновлювати

Оновлюй цей файл, якщо змінюється хоча б одна з речей:

- формат JSON-проєкту
- структура `state`
- нові гарячі клавіші
- нові важливі UX-конвенції
- великі секції `script.js`
- семантична дизайн-система в `style.css`

---

Якщо ти новий розробник або агент і не знаєш, з чого почати, найкращий маршрут такий:

1. Прочитати цей файл
2. Подивитися [index.html](/d:/GIT/compnauka.github.io/tools/flowchart_designer/new/index.html)
3. Знайти потрібну функцію в [script.js](/d:/GIT/compnauka.github.io/tools/flowchart_designer/new/script.js) через `rg`
4. Якщо зміна стосується маршрутизації або JSON, перейти в [flowchart-core.js](/d:/GIT/compnauka.github.io/tools/flowchart_designer/new/flowchart-core.js)
5. Після змін запустити `npm test`
