# Структура сайту та план уніфікації стилю

> Документ-аудит структури `itnauka.org` (compnauka.github.io) і покроковий план приведення
> незалежних сервісів до спільного впізнаваного вигляду (єдиний хедер, футер, тема, адаптивність).
> Створено: 2026-06-04. Підтримувати в актуальному стані під час адаптації.

**Прогрес:** інфраструктуру (`_shell/`) збудовано; адаптовано **5 сервісів** — `outer/`, `apps/`,
`microbit/`, `edexpo/`, `edinfo/`. Деталі статусів — у §4.

---

## 1. Загальна архітектура

- Статичний сайт на **GitHub Pages**, без збірки (vanilla HTML/CSS/JS).
- Робочий домен: **https://itnauka.org/**
- Коренева сторінка `index.html` — каталог сервісів (рендериться з `data.js` через `script.js`).
- Кожна підпапка — окремий, історично **незалежний** сервіс зі своїм власним стилем.

### Еталон стилю («дизайн-система» сайту)
Головна сторінка задає візуальний стандарт, який треба поширити на сервіси:

| Елемент | Файл / клас | Опис |
|---|---|---|
| Глобальні стилі | [`style.css`](style.css) | CSS-змінні, хедер, футер, картки, темна тема, адаптив |
| Шапка | `.app-container > .header` | `.brand` (іконка + назва) ліворуч, `.theme-toggle-btn` праворуч |
| Підвал | `.footer` | соцмережі (`.footer-socials`) + копірайт |
| Темна тема | `body.dark-mode` + `localStorage["theme"]` | перемикач `#themeToggle` |
| Шрифти | Nunito (заголовки) + Open Sans (текст) | через Google Fonts |
| Іконки | Font Awesome 6.x | |
| Палітра | `--primary-color:#3b82f6` | синій бренд |

**Приклади вже коректного застосування шаблону:**
- [`404.html`](404.html) — спрощений хедер (бренд-посилання на `/` + перемикач теми) + футер. **Найкращий мінімальний приклад для копіювання у сервіси.**
- [`support.html`](support.html) — те саме на базі `style.css`.
- [Офіс ПЛЮС](https://schooloffice.github.io/) — повноцінний сервіс, винесений в окремий репозиторій `schooloffice.github.io`.

> ⚠️ Папка `office/` має власний `office/CLAUDE.md` із суворим обмеженням: працювати лише всередині `office/`. Не чіпати її без окремого запиту.

---

## 2. Інвентаризація сервісів

Колонка «Статус» відображає уніфікацію (спільний shell: хедер + кнопка «Назад» + футер + темна тема).

| Папка | Призначення | К-сть HTML | Стиль / технологія | Статус уніфікації |
|---|---|---:|---|---|
| `/` (корінь) | Каталог сервісів | 141* | `style.css` (еталон) | — (еталон) |
| `outer/` | Добірка зовнішніх інструментів для вчителя | 1 | власний `outer/style.css` | ✅ адаптовано |
| `apps/` | Добірка освітніх застосунків | 1 | власний `apps/style.css` | ✅ адаптовано |
| `edexpo/` | UA EdTech Expo (галерея проєктів) | 1 | Tailwind CDN | ✅ адаптовано |
| `edinfo/` | Добірка сервісів Ed-Info | 1 | власний (перестильовано під сайт) | ✅ адаптовано |
| `microbit/` | Ресурс про micro:bit | 2 | власний `microbit/style.css` | ✅ адаптовано |
| [schooloffice.github.io](https://schooloffice.github.io/) | Офіс ПЛЮС (редактори), окремий репозиторій | — | власний shell | ✅ винесено |
| `path/` | IT Level Up — шлях навчання | 1 | власний (вже має темну тему) | ⬜ заплановано |
| `checkup/` | Тест з інформатики (IT-Орієнтир) | 2 | власний | ⬜ заплановано |
| `kids/` | Логічні ігри для малечі | 10 | власний | ⬜ заплановано |
| `vartovi/` | «Вартові Міста» — ігри | 3 | власний | ⬜ заплановано |
| `howto/` | «ЯК? Комп'ютер — це просто» | 2 | власний `howto/style.css` | ⬜ заплановано |
| `course/` | Уроки (grade1, main, new_lessons) | 37 | власний | ⬜ заплановано |
| `games/` | Ігри (arkanoid, snake, tangram…) | 23 | у кожній грі свій | ⬜ заплановано |
| `services/` | Великий набір тренажерів | 53 | у кожного свій | ⬜ заплановано |
| `tools/` | Інструменти (penslyk, doshka, pixel…) | 15 | у кожного свій | ⬜ заплановано |
| `python/` | Редирект «сторінку перенесено» | 1 | мінімальний | — (редирект) |

\* підрахунок включає вкладені сервіси.

### Початковий висновок аудиту (станом на старт)
**Жоден** сервіс верхнього рівня (окрім `office/`) не мав ані спільного хедера, ані посилання
назад на головну — звідси скарги «зайшов у сервіс — не можеш повернутися». Це й розв'язує shell (§3).

---

## 3. Цільовий стандарт уніфікації

Що має бути спільним і впізнаваним у кожному сервісі:

1. **Шапка** — бренд (іконка + «Комп'ютерна наука») як посилання на `/`, перемикач теми.
2. **Кнопка «Назад»/«На головну»** — щоб не шукати вкладку (головна скарга).
3. **Підвал** — соцмережі + копірайт.
4. **Темна тема** — спільний `localStorage["theme"]`, щоб вибір зберігався між сервісами.
5. **Адаптивність** — мобільна верстка через спільні брейкпоінти `style.css`.
6. **Доступність** — `:focus-visible`, `aria-label`, контраст.

### Реалізований механізм: спільний «shell» ✅
Замість хардкоду хедера/футера на кожній сторінці зроблено самодостатній інжектор:

- [`_shell/site-shell.js`](_shell/site-shell.js) — вставляє стандартний хедер (кнопка «Назад»,
  бренд-посилання на `/`, перемикач теми) на початок `<body>` і футер (соцмережі + копірайт) у кінець;
  ініціалізує темну тему зі спільного `localStorage["theme"]`; авто-підвантажує Font Awesome,
  якщо сервіс його не має.
- [`_shell/site-shell.css`](_shell/site-shell.css) — стилі shell-а зі **scoped `.ss-*` класами**,
  щоб НЕ конфліктувати з власними стилями кожного сервісу (працює поверх будь-якого CSS чи Tailwind).

Підключення в будь-якому сервісі — **один рядок**:
```html
<script src="/_shell/site-shell.js" data-back="/#useful-links" defer></script>
```

Параметри тега `<script>` (усі необов'язкові):
- `data-back` — куди веде «Назад» (типово `/`; рекомендовано — хеш категорії, див. §4);
- `data-brand` — підпис бренду (типово «Комп'ютерна наука»);
- `data-no-footer` — не вставляти футер (якщо у сервісу вже є повноцінний свій).

> **Хелпер `.ss-fs`** (у `site-shell.css`) — для повноекранних макетів, де `body` є flex-колонкою з
> `justify-content:center` (контент центрувався по вертикалі). Після вставки `.ss-header` таке центрування
> відсувало хедер від верху (з'являвся зайвий зазор). Клас `ss-fs` на `<body>` повертає
> `justify-content:flex-start`, тож хедер притиснутий до верху, а контент іде одразу під ним.
> Використовувати разом із `data-no-footer`. Приклади — `maze`, `mouse_keys`.

> Темну тему **самого контенту** сервісу shell не робить автоматично — він лише перемикає клас
> `body.dark-mode` і стилізує власну обгортку. Тому в кожному сервісі окремо додаємо правила
> `body.dark-mode { … }` (через CSS-змінні або точкові перевизначення) — це робиться при адаптації.

---

## 4. Покроковий план адаптації

### Етап 0. Підготовка (інфраструктура) ✅ ВИКОНАНО
- [x] Створено [`_shell/site-shell.js`](_shell/site-shell.js) + [`_shell/site-shell.css`](_shell/site-shell.css) — самодостатній shell зі scoped `.ss-*` класами (не конфліктує з власними стилями сервісів).
- [x] Shell містить: кнопку «Назад» (налаштовується через `data-back`), бренд-посилання на `/`, перемикач теми зі спільним `localStorage["theme"]`, футер із соцмережами; авто-підвантаження Font Awesome, якщо сервіс його не має.
- [x] Підключення в сервіс — один рядок: `<script src="/_shell/site-shell.js" defer></script>`.
- [x] `data-no-footer` (наявність атрибута) вимикає футер — для повноекранних ігор/тренажерів, де важлива висота без скролу.
- [x] Shell-хедер/футер мають `width:100%; align-self:stretch; flex:0 0 auto` — щоб бути на всю ширину навіть коли body — центрований flex/grid (`items-center`), і не стискатись у flex-колонці.

> **Повноекранні ігри (рецепт):**
> - Якщо футер не потрібен — `data-no-footer` + наявний `body{height:100dvh;overflow:hidden}` + поле `flex-1 min-h-0` (поле саме стискається, скролу нема).
> - Якщо футер **потрібен**, а гра має лишатись на повний екран — загорнути ігрову частину в обгортку з **визначеною** висотою `height: calc(100dvh - 64px)` (64px = `.ss-header`), а футер винести під неї (буде нижче згину, доступний скролом). body — `min-height:100dvh` без `overflow:hidden`; для гри з декоративними елементами за краями додати `html,body{overflow-x:hidden}`. ⚠️ Саме `height` (не `min-height`) — інакше `%`-висоти всередині (`h-full`) колапсують. Приклад — `mouse103`.
> - **Чиста повноекранна гра** (увесь UI `absolute inset-0`/`top-4` відносно `body`, `touch-action:none`): загорнути все в `.game-screen { position:relative; height:calc(100dvh - 64px); overflow:hidden }` — обгортка стає containing block, і абсолютний UI лягає під хедер, а не накладається. `data-no-footer` (скрол/футер конфліктують з `touch-action:none`). Приклади — `fireflies`, `jailfish`.
>   - ⚠️ **Координати drag/spawn:** після обгортки containing block зсунутий на 64px. Якщо drag пише `el.style.top = clientY - offset` у елемент **усередині** `.game-screen` — віднімати `gameArea.getBoundingClientRect().top` (інакше зсув +64px). Spawn рахувати від `gameArea.clientWidth/clientHeight`, не `window.inner*`. (Виняток — якщо на час drag елемент `appendChild(document.body)`, як у `fireflies`: тоді контекст = body, віднімати не треба.)

> **Назва сервісу в хедері (`data-title`):** щоб спільний хедер не був напівпорожнім і не дублювався з власним заголовком сервісу — передаємо `data-title="Назва сервісу"`. Shell показує хлібну крихту `Комп'ютерна наука › Назва`; на мобільному ховає текст бренду (лишає іконку + назву). Тоді у сервісі **прибираємо власний дубль-заголовок**, лишаючи лише функціонал (бали/прогрес/нав). Робимо це **там, де звільняє місце** на сторінці (не для контентних hero зі статистикою/описом). Застосовано: tyts, key_puzzle, mouse103, microbit (title-смуги); computational_thinking + coding/python (прибрано великі hero → контент піднявся); fireflies + jailfish (прибрано декоративний заголовок із верху поля).

> **Конвенція кнопки «Назад» (`data-back`):** головна сторінка підтримує глибокі посилання на
> категорію через хеш `#<id-категорії>` (див. `script.js` + `CATEGORIES` у `data.js`). Тож кнопку
> «Назад» сервісу варто вести не просто на `/`, а на конкретну категорію, де він розміщений,
> наприклад: `data-back="/#useful-links"`. Список id категорій — у `data.js`.

### Етап 1. Сервіси-«добірки» (найпростіші, найбільша користь)
Сторінки-каталоги без складної інтерактивності — низький ризик, швидкий результат:
- [x] **`outer/`** ✅ (підключено shell з `data-back="/#useful-links"`; додано темну тему в `outer/style.css`; зменшено заголовок/відступи hero на мобільному; перевірено світлу/темну тему, desktop і mobile 375px)
- [x] `apps/` ✅ (підключено shell з `data-back="/#useful-links"`; додано темну тему через перевизначення CSS-змінних градієнта в `apps/style.css`; прибрано власний дубльований футер; перевірено світлу/темну тему, desktop і mobile)
- [x] `edinfo/` ✅ (підключено shell з `data-back="/#useful-links"`; **повністю перестильовано** з нео-брутального стилю (товсті чорні рамки, жорсткі тіні) на м'яку дизайн-мову сайту — токени з style.css, заокруглені картки, м'які тіні, синій primary, шрифти Nunito+Open Sans, градієнтний заголовок; кольори категорій збережено на іконках; додано темну тему; у власному футері прибрано дубль-копірайт, лишено лише подяку Г. Громку)
- [ ] `path/`

### Етап 2. Контентні/ігрові хаби
- [ ] `kids/` (індекс + 9 ігор)
- [ ] `vartovi/`
- [x] `microbit/` ✅ (shell на обох сторінках index + technical-details з `data-back="/#useful-links"`; власну фіксовану навігацію переведено на `sticky; top:64px`, щоб стояла під спільним хедером; додано повну темну тему в `microbit/style.css`; прибрано дубль копірайту)
- [ ] `howto/`
- [ ] `checkup/`
- [x] `edexpo/` ✅ (на Tailwind CDN; підключено shell з `data-back="/#useful-links"`; власну шапку «UA EdTech Expo» видалено як зайву, кнопку «Запропонувати проєкт» перенесено в hero; додано контейнерний блок темної теми поверх Tailwind-утиліт у inline `<style>`; власний футер «Community Driven» прибрано як дубль — лишився канонічний від shell)

### Етап 3. Великі набори (потребують обережності)
- [ ] `games/` — 23 окремі ігри, у кожної свій layout.
- [ ] `services/` — 53 тренажери; уніфікувати поетапно за підкатегоріями.
  - [x] `services/computational_thinking/index.html` ✅ (shell з `data-back="/#computational-thinking"`; додано темну тему; прибрано дубль-копірайт у власному футері; власну градієнтну шапку-заголовок і таб-навігацію лишено; зменшено початковий блок під новий хедер; перевірено світлу/темну/mobile)
  - [x] `services/digital_literacy/typing_skills/tyts/index.html` ✅ (тренажер «Тиць! Перші клавіші» — **лише фізична клавіатура** (keydown), без drag/кліків → жодних координат; shell з `data-no-footer`; центрований контент загорнуто в `.game-screen flex-1`, щоб shell лишився зверху, абсолютну панель-шапку опущено на `top:72px`; темна тема через CSS-змінні + утиліти (`[class*="bg-white"]`, `text-slate-*`) + перебито inline dot-grid; перевірено світлу/темну/mobile, keydown)
  - [x] `services/digital_literacy/typing_skills/key_puzzle/index.html` ✅ (drag-пазл, усе `position:fixed` відносно viewport, власний `#header`; shell з `data-no-footer`; shell **накладається** зверху (z1000 над усім), власні `#header`/`#main` опущено на `top:64px`; координати пазлів НЕ ламаються, бо `#pieces-layer` лишається `fixed inset:0` — drag перевірено 1:1; додано темну тему через CSS-змінні + `.func-key` + перебито inline dot-grid; **виправлено баг** `document.body.className=` що стирав `dark-mode` при зміні складності → `classList`; **scatter-зону пазлів прив'язано до фактичного `#header.bottom`** (динамічно) + clamp, щоб фішки не лягали під хедер; перевірено світлу/темну, drag, 0 перекриттів на всіх складностях desktop+mobile)
  - [x] `services/digital_literacy/mouse_skills/fireflies/index.html` + `…/jailfish/index.html` ✅ (чисті повноекранні ігри на Tailwind — `body h-screen overflow-hidden`, увесь UI `absolute` відносно body, без header/footer; shell з `data-no-footer`; гру загорнуто в `.game-screen { position:relative; height:calc(100dvh - 64px); overflow:hidden }` → стає контейнером позиціювання, тож абсолютний UI не лізе під хедер; гра вміщується без скролу; перевірено desktop+mobile)
  - [x] `services/digital_literacy/mouse_skills/mouse103/index.html` ✅ (повноекранна гра на Tailwind; shell з хедером **і футером**; ігрову частину загорнуто в `.game-screen { height: calc(100dvh - 64px) }` → **перший екран = гра на повну висоту без скролу**, а футер — нижче згину (доступний скролом); `html,body{overflow-x:hidden}` проти горизонтального скролу від десктоп-візуалізації миші; помірна темна тема (затемнення фону поля); перевірено desktop+mobile, обидві теми)
  - [x] `services/security_and_safety/` ✅ — `cybersecurity_for_kids`, `cryptography_for_kids`, `critical_thinking_for_kids` (контентні уроки: shell+`data-title`, темна тема через CSS-змінні + `white→var(--card-bg)`, дедуп футера) + `caesar_cipher/caesar_encrypt|decrypt` (центровані тули: shell, body вже flex-col, повноширинна шапка, темна тема). `data-back="/#safety-info"`.
  - [x] `tools/bit_converter/index.html` ✅ (центрована картка-тул; shell з `data-back="/#digital-tools"`; body→flex-col + `margin:auto`; темна тема; прибрано стрей `</script>`)
  - [x] `services/quizes/` ✅ — `sorting_hub` (хаб: прибрано title-блок, shell `data-back="/#quiz"`, темна тема) + `ct_quiz` (utilities+tokens: body→`flex-col items-center`, inline dark-overrides для `.bg-white`/`text-gray-*`) + `save_server` (повноекранна ретро-гра, вже темна: shell `data-no-footer`, game-container→`h-[calc(100dvh-80px)]`)
  - [x] `services/coding/python/index.html` ✅ (shell з `data-back="/#programming"`; вже на токенах сайту; **`prefers-color-scheme` → `body.dark-mode`**, щоб тему контролював перемикач; додано dark-стилі для `.search-bar`/`.search-input`/`.file-links`; прибрано дубль-футер (він би став світлим у dark через `background: var(--text-primary)`); перевірено світлу/темну/mobile)

#### Пакет із 18 сервісів (ігри + assembly + digital_literacy) ✅

- [x] `games/magic_square` + `games/math_quiz` ✅ (тренажери з власним `topbar` і `data-theme`; shell `data-back="/#games"` + `data-title`; темну тему **зведено містком** — у `[data-theme="dark"]` додано `, body.dark-mode`; у math_quiz прибрано дубль-футер)
- [x] `games/tangram` ✅ (повноекранна canvas-гра, `data-theme`; shell `data-no-footer`, `#app→flex:1` під 64px хедера; містком `[data-theme="dark"], body.dark-mode`; drag канви рахується від `canvas.getBoundingClientRect()` — офсет хедера враховується сам)
- [x] `games/fact-or-opinion` ✅ (картка-екрани `.app-shell`, `body display:grid place-items:center` → перероблено на `block` + `.app-shell{margin:24px auto; width:min(100%-32px,760px)}`; **додано власну темну тему** — `body.dark-mode` перевизначає `--bg/--surface/--text` + `.app-shell/.rule-card/.statement-card`; `data-back="/#games"`)
- [x] `games/seabattle.html` ✅ (центрована paper-картка на тлі моря; `body flex row→column !important`, `justify-start`, `padding:0`, картка `margin:24px auto; width:min(1200px,100%-32px); box-sizing:border-box`; модалки `z-index:1000` лишають хедер під собою на момент показу — ок; `data-back="/#games"`)
- [x] `services/coding/farmbot` + `farmbot_plus` ✅ (контентні сторінки-ігри; shell `data-back="/#programming"` + `data-title`; **додано темну тему** через перевизначення `:root`-змінних; hardcoded `white/#fff` (`.cell`, `.modal-card`, code) → `var(--card-color)`/`var(--code-bg)`; прибрано дубль-футери; файли нормалізовано CRLF→LF)
- [x] `services/assembly/hardware.html` + `software.html` ✅ (story-choice симулятори, **вже завжди-тёмні**, `body flex center` центрує картку 650px; inline-оверайд: `body flex-direction:column; justify-content:flex-start; padding:0`, `#game-container{margin:24px auto; width:min(650px,100%-32px) !important; box-sizing:border-box}`; `data-back="/#digital-literacy"`)
- [x] `services/digital_literacy/data-and-information` ✅ (контентний урок на справжньому Tailwind CDN; sticky `<nav top-0 z-50>` → `top-16 z-40`, щоб стояв під хедером; прибрано дубль-футер; `data-back="/#digital-literacy"`; темну тему лишено світлою — багата кольорова сторінка)
- [x] `services/digital_literacy/mouse_skills/windows` ✅ (fullscreen desktop-симулятор, `body height:100vh overflow:hidden`; `body→flex-col`, `.desktop{flex:1}`, `.control-panel top:20→84px`, `.window.maximized height:calc(100vh-64px)`; `data-no-footer`)
- [x] `services/digital_literacy/mouse_skills/maze` + `mouse_keys` ✅ (Tailwind-ігри `flex-col justify-center` — додано клас **`ss-fs`** (хедер flush-top), `data-no-footer`; у mouse_keys прибрано `p-4` body (full-bleed хедер) → `pb-4`, а поле `#gameBoard` із фіксованого `h-[60vh]` переведено на **`flex-1 min-h-0`**, щоб займало залишок висоти під 64px-хедером і не обрізалось при `body overflow:hidden`)
- [x] `services/digital_literacy/mouse_skills/svitlo` ✅ (Tailwind-сцена «Рятівники світла», `.city-background 100vh` + HUD `fixed top-4`; `body→flex-col`, `.city-background height:calc(100vh-64px)`, HUD `top-4→top-20`; `data-no-footer`)
- [x] `services/digital_literacy/typing_skills/key_ppo` ✅ (immersive keyboard-гра «Захисники неба», усі шари `position:absolute` від viewport; зсунуто `#ui-layer/#game-area/#damage-overlay/#the-wall/.menu-overlay` на `top:64px`; хедер z1000 над грою, back доступний; `data-no-footer`)
- [x] `services/digital_literacy/typing_skills/keymaster` ✅ (Tailwind `darkMode:'class'`, власний nav+перемикач, `body h-screen flex-col` (main `flex-grow` сам поглинає 64px); shell `data-no-footer` + **містком** inline-скрипт `body.dark-mode → html.dark` (MutationObserver), щоб перемикач shell керував `dark:`-утилітами)
- [x] `services/digital_literacy/typing_skills/urls_typing` + `typing_lesson` ✅ (контентні сторінки з власним header+footer; shell `data-back="/#digital-literacy"`; прибрано body-padding для full-bleed хедера (перенесено в `.container`); прибрано дубль-футери; urls_typing — додано темну тему через `:root`-змінні; typing_lesson — лишено світлою (багата сторінка))

> **Прибирання дублів після пакета (бо хедер тепер дає «Назад» і перемикач теми):**
> - `math_quiz` — прибрано власну кнопку `← На головну` (дублювала «Назад» хедера).
> - **Власні перемикачі теми** прибрано з `magic_square`, `math_quiz`, `tangram`, `keymaster` — їх замінює перемикач у спільному хедері. JS-обробники зроблено null-safe (`dom.themeToggle?.addEventListener`), щоб видалення кнопки не ламало гру.
> - У `magic_square`/`math_quiz` `loadPreferences` більше **не виставляє `data-theme="dark"`** (тримає `data-theme="light"` сталим). Інакше при вимкненні теми хедер прибирає лише `body.dark-mode`, а застряглий `data-theme="dark"` й далі активував би темні CSS-змінні (`[data-theme="dark"]` у селекторі) → гра лишалась темною. Тепер єдиний динамічний тригер — `body.dark-mode` від хедера.
> - `tangram` — канва читає тему з `data-theme` у JS, тож додано місток `body.dark-mode → data-theme` + `dispatchEvent('resize')` (перемальовує канву); `keymaster` — місток `body.dark-mode → html.dark` (Tailwind `darkMode:'class'`).
> - Перевірено в браузері: 0 дубль-футерів/кнопок «додому»/перемикачів теми на всіх 18; консоль без помилок; перемикач теми хедера коректно вмикає/вимикає dark на `magic_square`, `math_quiz`, `tangram`, `keymaster`, `fact-or-opinion`, `farmbot(+plus)`, `urls_typing`.

- [ ] `tools/` — 15 інструментів.
- [ ] `course/` — навчальні уроки (узгодити з власною дизайн-системою курсу).

### Принципи на кожному кроці
1. Не ламати наявну функціональність — додаємо обгортку, не переписуємо контент.
2. Зберегти SEO/мету (canonical, OG) кожного сервісу.
3. Перевірити мобільну верстку та темну тему після інтеграції.
4. Один сервіс = один невеликий коміт, щоб легко відкотити.

---

## 5. Рецепт адаптації сервісу (перевірений на 5 сервісах)

Базові кроки для будь-якого сервісу:

1. **Підключити shell** — у `<head>` (або перед `</body>`) один рядок:
   `<script src="/_shell/site-shell.js" data-back="/#<id-категорії>" defer></script>`.
2. **Кнопка «Назад»** — у `data-back` вказати хеш категорії з `data.js`, де лежить сервіс
   (більшість добірок — `useful-links`). Головна відкриє саме цю категорію.
3. **Темна тема контенту** — додати в CSS сервісу блок `body.dark-mode { … }` (найкраще через
   перевизначення CSS-змінних палітри; для Tailwind — точкові `!important`-перевизначення утиліт).
4. **Прибрати дублі** — якщо власний футер сервісу дублює копірайт «Комп'ютерна наука», прибрати/сховати
   його (shell дає канонічний). Осмислені власні футери (атрибуція автору, дисклеймер) — лишати.
5. **Перевірити** в браузері: desktop + mobile (375px), світла + темна тема, кнопка «Назад» веде в
   потрібну категорію, футер один зі соцмережами.

**Типові сценарії (з прикладами):**
- **Проста добірка** (`outer/`, `apps/`) — лише shell + dark-mode у власному CSS; за потреби дрібний
  тюнінг мобільних відступів/заголовків.
- **Сервіс із власною шапкою-навбаром** (`microbit/`) — щоб не виходило дві шапки, що накладаються,
  власну шапку перевести на `position: sticky; top: 64px` (висота `.ss-header`), щоб вона ставала
  одразу під спільним хедером; прибрати компенсаційний `padding-top`, який був під фіксовану шапку.
- **Зайва власна шапка** (`edexpo/`) — якщо вона лише дублює бренд/навігацію, її можна **видалити**,
  корисні дії з неї перенести в контент (hero).
- **Tailwind-сторінка** (`edexpo/`) — dark-mode зробити коротким блоком у inline `<style>`, що
  перевизначає ключові утиліти (`.bg-white`, `.text-slate-900` тощо) під `body.dark-mode`.
- **Сильно відмінний стиль** (`edinfo/` — був «нео-брутальний») — за бажанням замовника **перестилити**
  під дизайн-токени сайту (м'які картки, радіус 16px, м'які тіні, синій primary, Nunito+Open Sans,
  градієнтний заголовок), зберігши кольорову ідентичність розділів на іконках.

**⚠️ Нюанс локального тестування:** дев-сервер `npx serve` редіректить `/<сервіс>/index.html` →
`/<сервіс>` (без слеша), через що відносні шляхи (`style.css`, зображення) збиваються на корінь.
Тестувати треба з трейлінг-слешем: `http://localhost:8753/<сервіс>/`. На **GitHub Pages цього немає** —
там `/<сервіс>/` зберігає слеш, відносні шляхи коректні. (`.claude/launch.json` — у `.gitignore`.)

**Критерій готовності:** зайшовши на сервіс, користувач бачить ту саму шапку, що й на головній,
одним кліком повертається у свою категорію, перемикає тему — і вибір теми зберігається між сервісами.

---

## 6. Подальші ідеї
- ✅ Спільні соцмережі/копірайт — уже одне джерело правди (масив `SOCIALS` у `site-shell.js`).
- Додати у shell хлібні крихти (breadcrumbs): `Головна / Назва сервісу`.
- Розглянути єдиний підпис року копірайту (зараз shell ставить поточний рік автоматично).
- Розглянути спільний service worker для офлайн-доступу (вже є в `office/`, `course/`).
