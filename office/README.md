# Пакет UI-стандартів для АРТ Офіс

У цьому пакеті містяться:

- `ART_OFFICE_UI_STANDARD.md` — єдиний стандарт усієї лінійки
- окремі `UI_STANDARD.md` для кожного сервісу
- окремі `UI_MIGRATION_TO_STANDARD.md` для кожного сервісу
- `UI_TOKENS.css` — спільні CSS-токени та shell-компоненти
- `design-tokens.json` — машинозчитуваний набір дизайн-токенів
- `SERVICE_THEME_MAP.json` — карта сервісів, акцентів і структур меню
- `UI_INTEGRATION_GUIDE.md` — технічний гайд з інтеграції стандарту в код
- `APP_SHELL.html` — базовий HTML-шаблон shell інтерфейсу
- `SHELL_COMPONENTS.md` — правила для titlebar, menu bar, toolbar, contextbar, workspace, statusbar
- `SERVICE_SHELL_BLUEPRINTS.md` — короткі shell-схеми для кожного сервісу
- `COMPONENT_CHECKLIST.md` — чекліст для рев'ю, QA і приймання
- `UI_REVIEW_TEMPLATE.md` — єдиний шаблон формалізованого UI-рев'ю
- `CHANGELOG_STANDARD.md` — єдиний стандарт ведення changelog для UI-змін
- `PROMPT_FOR_AGENT.md` — системний промпт/регламент для агента або розробника

## Нові поведінкові стандарти у версії 1.1

- `KEYBOARD_SHORTCUTS.md` — єдиний стандарт гарячих клавіш
- `WORKSPACE_ACCESSIBILITY.md` — focus-visible, tabindex, повернення фокуса та keyboard interaction у workspace
- `MODAL_STANDARD.md` — єдиний стандарт модальних вікон
- `DROPDOWN_STANDARD.md` — єдиний стандарт dropdown, menu, picker та popover-поведінки

## Структура

- `art-text/`
- `art-tables/`
- `art-paint/`
- `art-slides/`
- `art-flowcharts/`
- `art-vector/`

## Як використовувати

1. Файл `ART_OFFICE_UI_STANDARD.md` використовується як головний нормативний документ.
2. У корінь кожного сервісу потрібно покласти:
   - `UI_STANDARD.md`
   - `UI_MIGRATION_TO_STANDARD.md`
3. Будь-які зміни UI у сервісі потрібно звіряти спочатку з глобальним стандартом, потім із локальним.
4. Будь-які поведінкові зміни menu, modal, dropdown, workspace і shortcuts потрібно звіряти з окремими поведінковими стандартами.

## Рекомендований порядок впровадження

1. Додати документи в репозиторій.
2. Зафіксувати, що будь-яка зміна UI проходить через ці стандарти.
3. Привести спочатку shell-рівень:
   - меню,
   - toolbar,
   - статус-бар,
   - масштаб,
   - undo/redo.
4. Потім вирівняти поведінковий шар:
   - keyboard shortcuts,
   - dropdown/menu,
   - modal,
   - workspace focus-visible.
5. Потім доробляти локальні контекстні панелі сервісів.

## Технічне впровадження

1. Підключити `UI_TOKENS.css` у всі сервіси.
2. Використовувати `design-tokens.json` для генерації тем, якщо згодом з'явиться build-step або дизайн-тулінг.
3. Звіряти shell-структуру з `UI_INTEGRATION_GUIDE.md`.
4. Використовувати `SERVICE_THEME_MAP.json` як джерело правди для назви сервісу, акцентного кольору й структури меню.
5. Для keyboard, modal, dropdown і workspace-поведінки використовувати окремі стандарти як джерело правди.

## Рекомендований порядок читання для агента / розробника

1. `ART_OFFICE_UI_STANDARD.md`
2. `UI_STANDARD.md` конкретного сервісу
3. `UI_MIGRATION_TO_STANDARD.md` конкретного сервісу
4. `KEYBOARD_SHORTCUTS.md`
5. `WORKSPACE_ACCESSIBILITY.md`
6. `MODAL_STANDARD.md`
7. `DROPDOWN_STANDARD.md`
8. `UI_TOKENS.css`
9. `SHELL_COMPONENTS.md`
10. `SERVICE_SHELL_BLUEPRINTS.md`
11. `COMPONENT_CHECKLIST.md`
12. `UI_REVIEW_TEMPLATE.md`
13. `CHANGELOG_STANDARD.md`

## Стан пакета

Версія пакета: **1.2**  
У цій версії додано повний governance-шар для рев'ю та документування UI-змін:
- шаблон формалізованого UI-рев'ю;
- стандарт ведення changelog для UI-змін;
- оновлений README з новим порядком читання і впровадження;
- збережено всі виправлення версії 1.1 щодо shortcuts, workspace, modal, dropdown і вікових правил.
