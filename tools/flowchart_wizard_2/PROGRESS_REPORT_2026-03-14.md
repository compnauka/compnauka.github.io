# Проміжний звіт по ТЗ і рефакторингу

Дата: 2026-03-14

## 1. Що зроблено по ТЗ

### P1. Валідатор і цикли

Виконано:
- виправлено логіку `collectIssues()` для схем із `back-edge`/циклами;
- прибрано хибні попередження `unreachable` і `no-input` для коректних циклів;
- додано приклади циклів:
  - `ex-while`
  - `ex-dowhile`
  - `ex-for`
- додано приклад неповного розгалуження:
  - `ex-if-only`
- додано підказку маскота для:
  - циклу в процесі побудови;
  - завершеного циклу;
  - неповного `if`;
- додано hint у wizard при з'єднанні з блоком вище, тобто при побудові циклу.

Результат:
- існуючі приклади `ex-linear` і `ex-merge` проходять перевірку;
- нові приклади циклів проходять перевірку;
- приклад неповного `if` проходить перевірку.

## 2. Що зроблено по рефакторингу

Початково весь код був зосереджений у одному великому `script.js`.

Зараз структура розділена так:
- `script.js` — тонкий bootstrap, який завантажує `app.mjs`;
- `app.mjs` — основний застосунок, DOM-інтеграція, події, частина рендерингу;
- `modules/examples.mjs` — приклади схем;
- `modules/graph.mjs` — графова логіка:
  - edge cache
  - `inEdges/outEdges`
  - `ancestors/descendants`
  - `openEnds`
  - `isDone`
  - `findBackEdges`
  - `hasIncompleteIf`
- `modules/validation.mjs` — `collectIssues`;
- `modules/mascot.mjs` — текстова логіка маскота;
- `modules/wizard.mjs` — helper-функції wizard:
  - badge
  - live text
  - explain content
  - merge hint
  - cycle connection hint
- `modules/render-utils.mjs` — render helper-утиліти:
  - `buildShape`
  - path helpers
  - `createWrapText`
- `modules/layout.mjs` — `computeRanks` і `applyLayout`
- `modules/edge-routing.mjs` — `computeEdgeRoute`

## 3. Тести

Створено файл:
- `tests/flowchart.logic.test.js`

На поточний момент покрито 7 сценаріїв:
- валідність `ex-linear`;
- валідність `ex-merge`;
- валідність циклічних прикладів;
- відсутність хибних `unreachable/no-input` для циклу;
- повідомлення маскота про цикл;
- повідомлення маскота про неповне розгалуження;
- `wrapText` додає багатокрапку;
- routing будує шлях для upward loop edge.

Команди перевірки, які успішно запускались:
- `node tests/flowchart.logic.test.js`
- `node --check app.mjs`
- `node --check script.js`
- `node --check modules\\examples.mjs`
- `node --check modules\\graph.mjs`
- `node --check modules\\validation.mjs`
- `node --check modules\\mascot.mjs`
- `node --check modules\\wizard.mjs`
- `node --check modules\\render-utils.mjs`
- `node --check modules\\layout.mjs`
- `node --check modules\\edge-routing.mjs`

## 4. Поточний стан

Загалом:
- критична частина ТЗ по циклах уже закрита;
- код став значно менш монолітним;
- основна бізнес-логіка вже винесена в окремі модулі;
- є базовий автоматизований захист від регресій.

## 5. Що лишилося по ТЗ

Ще не реалізовано або не завершено:
- блок `Підпрограма`;
- опційний блок `Коментар` (якщо будемо робити);
- подальші пов'язані зміни в UI/рендері під нові типи блоків;
- ручна перевірка інтерфейсу в браузері після великих рефакторингів.

## 6. Що лишилося по рефакторингу

Найбільші шматки, що ще залишаються в `app.mjs`:
- `render()`
- `renderNode()`
- `renderEdge()` DOM-малювання
- `renderPlus()`
- drag/pan/toolbar/modal event-логіка

Рекомендований порядок на завтра:
1. обережно винести `renderNode` helper-частини;
2. за потреби винести DOM-частину `renderEdge`;
3. після цього перейти до реалізації блоку `Підпрограма`;
4. додати під це окремі тести.

## 7. Важливі примітки

- Під час роботи були проблеми з кодуванням кирилиці в окремих shell-операціях, тому безпечніше орієнтуватися на фактичні файли в репозиторії, а не на відображення деяких рядків у консолі.
- Поточні тести вже адаптовані до нової модульної структури.
- Вхідна точка сайту не змінена для користувача: `index.html` як і раніше підключає `script.js`.

