/* =========================================================================
   Каталог інструментів: лічильники + «розумний» пошук і фільтр за типом.

   Пошук працює на трьох рівнях:
     1) токенізація — запит ділиться на слова, потрібні ВСІ («ігри python»);
     2) морфологія — слова порівнюються за основою, тож «презентації»
        знаходить «презентацій», а «кодування» — «код»;
     3) синоніми — CATEGORY_KEYWORDS (тема категорії) і data-kw на <li>
        (кирилиця для латинських назв, теми конкретного інструмента).
        Ці слова ніде не показуються, їх бачить лише пошук.

   Панель пошуку вставляється скриптом (progressive enhancement):
   без JS сторінка лишається звичайним списком посилань.
   ========================================================================= */

/* Ключ — унікальний фрагмент назви категорії (у нижньому регістрі).
   Значення — теми й синоніми, за якими цю категорію мають знаходити.
   Пишемо і повні форми, і короткі («гра», «ігри», «ігор»): основа
   відсікає лише закінчення й не знає про чергування голосних. */
const CATEGORY_KEYWORDS = {
    'паперова': 'unplugged анплагд без комп\'ютера роздруківки друкувати картки картки-завдання алгоритм алгоритми початкова школа молодша молодші класи малюки офлайн активності дидактичні матеріали робочі аркуші сценарії уроків',
    'чат-боти': 'ші аі ai штучний інтелект нейромережа нейромережі чатбот бот бота асистент помічник gpt llm генерація тексту діалог',
    'інструменти з ші': 'ші аі ai штучний інтелект нейромережа вчителю підготовка до уроку план уроку конспект генератор завдань адаптація тексту перевірка робіт',
    'тести та вікторини': 'гра гри ігри ігор ігрові вікторина вікторини квіз тест тести тестування опитування оцінювання перевірка знань гейміфікація флешкартки картки самостійна контрольна',
    'інтерактивні': 'урок таймер дошка опитування відеоурок керування класом залучення інтерактив демонстрація екрана правила поведінки',
    'платформи для навчання': 'lms дистанційне навчання курси електронний журнал домашнє завдання онлайн-школа мудл вебінар',
    'цифрова грамотність': 'безпека безпечний інтернет кібербезпека приватність булінг кібербулінг пароль паролі браузер медіаграмотність фішинг шахрайство етика',
    'клавіатурні': 'друк друкування сліпий метод набір тексту клавіатура швидкість друку тренажер десятипальцевий',
    'офісні': 'текстовий редактор документи ворд word екзель excel таблиці електронні таблиці презентації powerpoint офіс редагування тексту резюме бланк',
    'спільної роботи': 'команда командна співпраця проєкти проєктна діяльність дошка нотатки спільний доступ репозиторій git версії',
    'хмарні': 'хмара хмарні файли диск сховище зберігання резервне копіювання синхронізація обмін файлами',
    'графічні': 'графіка малювання малюнок фото фотографії зображення дизайн растр вектор колаж редагування фото піксель обробка зображень плакат',
    'органайзери': 'схеми блок-схеми діаграми ментальні карти інтелект-карти планування структура інфографіка алгоритм майндмеп',
    'блочне': 'кодування код програмування алгоритм алгоритми блоки скретч початкова школа молодша молодші класи малюки гра гри ігри перші кроки спрайт анімація година коду',
    'текстове програмування': 'кодування код програмування пайтон python паскаль pascal java javascript ide середовище розробки компілятор редактор коду олімпіада задачі синтаксис',
    'веброзробка': 'сайт сайти веб вебсайт html css javascript верстка вебсторінка конструктор сайтів фронтенд браузер',
    'базами даних': 'бд база даних субд sql запити таблиці записи access реляційна',
    'презентацій та інфографіки': 'презентації слайди інфографіка виступ доповідь захист проєкту анімовані слайди дизайн',
    'мультимедіа': 'відео монтаж відеомонтаж запис екрана скрінкаст анімація мультфільм звук аудіо стрім трансляція камера',
    '3d-моделювання': '3д 3d моделювання модель друк 3d-друк cad креслення об\'ємні фігури рендер прототип',
    'розробка ігор': 'гра гри ігри ігор ігрові геймдев рушій движок 2d 3d кодування квест платформер',
    'мобільних': 'мобільні додатки телефон смартфон андроїд android додаток застосунок apk',
    'мікроконтролери': 'мікроконтролер ардуїно arduino мікробіт micro:bit датчики сенсори схеми електроніка робототехніка симулятор інтернет речей плата',
    'робототехніка': 'роботи робот робототехніка симулятор віртуальний робот lego ev3 програмування роботів змагання',
    'математика': 'математика геометрія графіки функції калькулятор фізика хімія симуляції досліди моделювання наука рівняння побудова графіків'
};

/* Підказки, коли нічого не знайшлося і схожих слів немає */
const FALLBACK_SUGGESTIONS = ['програмування', 'вікторини', 'графіка', 'презентації'];

/* Слова з URL, які нічого не означають і лише засмічують пошук */
const URL_STOPWORDS = new Set([
    'https', 'http', 'www', 'com', 'org', 'net', 'ua', 'pp', 'gov', 'in', 'co',
    'html', 'index', 'en', 'uk', 'lang', 'intl', 'ru', 'edu', 'me', 'ai', 'io'
]);

/* Службові слова назв категорій: у пошуку від них лише шум.
   Зокрема «робота» — інакше запит «роботи» тягне «спільну роботу»
   і «роботу з базами даних» замість робототехніки. */
const TITLE_STOPWORDS = new Set([
    'інструменти', 'інструмент', 'для', 'та', 'і', 'й', 'з', 'робота', 'роботи'
]);

/* Закінчення для грубого стемінгу — від найдовших до найкоротших */
const SUFFIXES = [
    'ування', 'ювання', 'ання', 'ення', 'ості', 'ість', 'ами', 'ями', 'ах', 'ях',
    'ів', 'ий', 'ій', 'ії', 'ою', 'ею', 'их', 'им', 'ім', 'ом', 'ем', 'ам', 'ям',
    'а', 'я', 'и', 'і', 'у', 'ю', 'е', 'о', 'ь', 'й'
];

/* Основа слова: відсікаємо одне закінчення, якщо лишається щонайменше 3 літери */
const stem = word => {
    for (const suffix of SUFFIXES) {
        if (word.length - suffix.length >= 3 && word.endsWith(suffix)) {
            return word.slice(0, -suffix.length);
        }
    }
    return word;
};

const tokenize = text => text.toLowerCase().split(/[^\p{L}\p{N}+#]+/u).filter(Boolean);

/* Слова з URL: без протоколу, доменних «хвостів» і суто числових шматків */
const tokenizeUrl = url => tokenize(url).filter(w => !URL_STOPWORDS.has(w) && !/^\d+$/.test(w));

/* Мішок слів для пошуку: самі слова + їхні основи */
const makeBag = texts => {
    const words = new Set();
    const stems = new Set();
    for (const word of texts) {
        words.add(word);
        stems.add(stem(word));
    }
    return { words, stems };
};

/* Токен запиту збігається зі словом, якщо: точний збіг, збіг основ,
   або слово починається з токена («програм» → «програмування»).
   Префіксний збіг — від 4 літер, щоб «гра» не витягувала «графіку». */
const bagMatches = (bag, token) => {
    if (bag.words.has(token)) return true;
    const tokenStem = stem(token);
    if (bag.stems.has(tokenStem)) return true;
    if (token.length >= 4) {
        for (const word of bag.words) if (word.startsWith(token)) return true;
    }
    if (tokenStem.length >= 4) {
        for (const s of bag.stems) if (s.startsWith(tokenStem)) return true;
    }
    return false;
};

document.addEventListener('DOMContentLoaded', () => {
    const grid = document.getElementById('category-grid');
    if (!grid) return;

    const cards = [...grid.getElementsByClassName('category-card')];
    const toolCountEl = document.getElementById('tool-count');
    const categoryCountEl = document.getElementById('category-count');

    // --- Індекс: для кожної картки — слова категорії, для кожного пункту — власні слова й типи ---
    const index = cards.map(card => {
        const h2 = card.querySelector('h2');
        const title = (h2 ? h2.textContent : '').toLowerCase().replace(/\s+/g, ' ').trim();
        const synonymsKey = Object.keys(CATEGORY_KEYWORDS).find(key => title.includes(key));
        const categoryBag = makeBag([
            ...tokenize(title).filter(w => !TITLE_STOPWORDS.has(w)),
            ...(synonymsKey ? tokenize(CATEGORY_KEYWORDS[synonymsKey]) : [])
        ]);

        const items = [...card.querySelectorAll('.software-list li')].map(li => {
            const link = li.querySelector('a');
            // online → «Онлайн», install → «Офлайн»/«PDF», ai → «ШІ»
            const typeEls = [...li.querySelectorAll('.tool-type')];
            const tags = typeEls.map(t =>
                ['online', 'install', 'ai'].find(type => t.classList.contains(type)) || ''
            );
            const name = li.querySelector('a > span:first-child');
            const bag = makeBag([
                ...tokenize(name ? name.textContent : li.textContent),
                ...(link ? tokenizeUrl(link.getAttribute('href')) : []),
                ...tokenize(li.dataset.kw || ''),
                ...typeEls.flatMap(t => tokenize(t.textContent))
            ]);
            return { el: li, bag, tags };
        });

        return { el: card, categoryBag, items };
    });

    const totalTools = index.reduce((n, c) => n + c.items.length, 0);
    const totalCats = index.length;

    // Словник для підказок: усі теми категорій, лише «змістовні» слова
    const vocabulary = [...new Set(
        Object.values(CATEGORY_KEYWORDS).flatMap(tokenize).filter(w => w.length >= 5)
    )];

    // --- Панель пошуку та фільтрів ---
    const bar = document.createElement('div');
    bar.className = 'filter-bar';
    bar.innerHTML = `
        <div class="search-wrap">
            <i class="fas fa-magnifying-glass search-icon" aria-hidden="true"></i>
            <input type="search" id="tool-search" class="search-input" autocomplete="off"
                   placeholder="Пошук: назва, категорія або тема…"
                   aria-label="Пошук інструмента, категорії або теми">
            <button type="button" class="search-clear" aria-label="Очистити пошук" hidden>
                <i class="fas fa-xmark" aria-hidden="true"></i>
            </button>
        </div>
        <div class="chips" role="group" aria-label="Фільтр за типом інструмента">
            <button type="button" class="chip chip--all is-active" data-tag="" aria-pressed="true">Всі</button>
            <button type="button" class="chip chip--online" data-tag="online" aria-pressed="false">Онлайн</button>
            <button type="button" class="chip chip--install" data-tag="install" aria-pressed="false">Офлайн / PDF</button>
            <button type="button" class="chip chip--ai" data-tag="ai" aria-pressed="false">ШІ</button>
        </div>`;

    const status = document.createElement('p');
    status.className = 'filter-status';
    status.setAttribute('role', 'status');
    status.setAttribute('aria-live', 'polite');

    const empty = document.createElement('div');
    empty.className = 'no-results';
    empty.hidden = true;
    empty.innerHTML = `
        <i class="fas fa-face-frown" aria-hidden="true"></i>
        <p>Нічого не знайшлося. Спробуйте інше слово або зніміть фільтри.</p>
        <div class="suggest" hidden><span class="suggest-label">Спробуйте:</span></div>
        <button type="button" class="reset-btn">Скинути всі фільтри</button>`;

    grid.parentNode.insertBefore(bar, grid);
    grid.parentNode.insertBefore(status, grid);
    grid.parentNode.insertBefore(empty, grid.nextSibling);

    const input = bar.querySelector('.search-input');
    const clearBtn = bar.querySelector('.search-clear');
    const chips = [...bar.querySelectorAll('.chip')];
    const resetBtn = empty.querySelector('.reset-btn');
    const suggestBox = empty.querySelector('.suggest');

    let activeTags = [];

    // Схожі теми: спільний початок основи (від 3 літер) з будь-яким словом запиту
    const suggestFor = tokens => {
        const found = [];
        for (const token of tokens) {
            const prefix = stem(token).slice(0, 3);
            if (prefix.length < 3) continue;
            for (const word of vocabulary) {
                if (stem(word).startsWith(prefix) && !found.includes(word)) found.push(word);
                if (found.length >= 3) return found;
            }
        }
        return found.length ? found : FALLBACK_SUGGESTIONS.slice(0, 3);
    };

    const renderSuggestions = tokens => {
        for (const btn of suggestBox.querySelectorAll('.suggest-btn')) btn.remove();
        if (tokens.length === 0) {
            suggestBox.hidden = true;
            return;
        }
        for (const word of suggestFor(tokens)) {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'suggest-btn';
            btn.textContent = word;
            suggestBox.appendChild(btn);
        }
        suggestBox.hidden = false;
    };

    const apply = () => {
        const tokens = tokenize(input.value);
        let shownTools = 0;
        let shownCats = 0;

        for (const cat of index) {
            let visibleInCat = 0;

            for (const item of cat.items) {
                // Кожне слово запиту має знайтися або в самому пункті, або в темі категорії
                const byText = tokens.every(token =>
                    bagMatches(item.bag, token) || bagMatches(cat.categoryBag, token)
                );
                const byTag = activeTags.length === 0 || activeTags.some(t => item.tags.includes(t));
                const visible = byText && byTag;
                item.el.hidden = !visible;
                if (visible) visibleInCat++;
            }

            cat.el.hidden = visibleInCat === 0;
            if (visibleInCat > 0) {
                shownCats++;
                shownTools += visibleInCat;
            }
        }

        if (toolCountEl) toolCountEl.textContent = shownTools;
        if (categoryCountEl) categoryCountEl.textContent = shownCats;

        const filtering = tokens.length > 0 || activeTags.length > 0;
        clearBtn.hidden = input.value === '';
        empty.hidden = shownTools > 0;
        if (shownTools === 0) renderSuggestions(tokens);

        if (!filtering) {
            status.textContent = '';
            status.hidden = true;
        } else {
            status.hidden = false;
            status.textContent = shownTools === 0
                ? 'Нічого не знайдено'
                : `Знайдено ${shownTools} з ${totalTools} інструментів у ${shownCats} з ${totalCats} категорій`;
        }
    };

    // Підсвітити чипи відповідно до activeTags («Всі» активний, коли фільтрів немає)
    const syncChips = () => {
        for (const chip of chips) {
            const on = chip.dataset.tag === ''
                ? activeTags.length === 0
                : activeTags.includes(chip.dataset.tag);
            chip.setAttribute('aria-pressed', on ? 'true' : 'false');
            chip.classList.toggle('is-active', on);
        }
    };

    input.addEventListener('input', apply);
    input.addEventListener('keydown', e => {
        if (e.key === 'Escape' && input.value !== '') {
            e.preventDefault();
            input.value = '';
            apply();
        }
    });

    clearBtn.addEventListener('click', () => {
        input.value = '';
        input.focus();
        apply();
    });

    for (const chip of chips) {
        chip.addEventListener('click', () => {
            const tag = chip.dataset.tag;
            if (tag === '') {
                activeTags = [];             // «Всі» — зняти фільтри за типом
            } else {
                const i = activeTags.indexOf(tag);
                if (i === -1) activeTags.push(tag); else activeTags.splice(i, 1);
            }
            syncChips();
            apply();
        });
    }

    suggestBox.addEventListener('click', e => {
        const btn = e.target.closest('.suggest-btn');
        if (!btn) return;
        input.value = btn.textContent;
        activeTags = [];                     // підказка марна, якщо лишився фільтр за типом
        syncChips();
        apply();
        input.focus();
    });

    resetBtn.addEventListener('click', () => {
        input.value = '';
        activeTags = [];
        syncChips();
        apply();
        input.focus();
    });

    apply();
});
