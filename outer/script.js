/* =========================================================================
   Каталог інструментів: лічильники + пошук і фільтр за типом.
   Панель пошуку вставляється скриптом (progressive enhancement):
   без JS сторінка лишається звичайним списком посилань.
   ========================================================================= */
document.addEventListener('DOMContentLoaded', () => {
    const grid = document.getElementById('category-grid');
    if (!grid) return;

    const cards = [...grid.getElementsByClassName('category-card')];
    const toolCountEl = document.getElementById('tool-count');
    const categoryCountEl = document.getElementById('category-count');

    // --- Індекс: для кожної картки — назва категорії, для кожного пункту — текст і типи ---
    const index = cards.map(card => {
        const h2 = card.querySelector('h2');
        const items = [...card.querySelectorAll('.software-list li')].map(li => {
            const link = li.querySelector('a');
            // online → «Онлайн», install → «Офлайн»/«PDF», ai → «ШІ»
            const tags = [...li.querySelectorAll('.tool-type')].map(t =>
                ['online', 'install', 'ai'].find(type => t.classList.contains(type)) || ''
            );
            const name = li.querySelector('a > span:first-child');
            const text = `${name ? name.textContent : li.textContent} ${link ? link.getAttribute('href') : ''}`;
            return {
                el: li,
                text: text.toLowerCase().replace(/\s+/g, ' '),
                tags
            };
        });
        return {
            el: card,
            title: (h2 ? h2.textContent : '').toLowerCase().replace(/\s+/g, ' ').trim(),
            items
        };
    });

    const totalTools = index.reduce((n, c) => n + c.items.length, 0);
    const totalCats = index.length;

    // --- Панель пошуку та фільтрів ---
    const bar = document.createElement('div');
    bar.className = 'filter-bar';
    bar.innerHTML = `
        <div class="search-wrap">
            <i class="fas fa-magnifying-glass search-icon" aria-hidden="true"></i>
            <input type="search" id="tool-search" class="search-input" autocomplete="off"
                   placeholder="Пошук: назва інструмента або категорія…"
                   aria-label="Пошук інструмента або категорії">
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
        <button type="button" class="reset-btn">Скинути всі фільтри</button>`;

    grid.parentNode.insertBefore(bar, grid);
    grid.parentNode.insertBefore(status, grid);
    grid.parentNode.insertBefore(empty, grid.nextSibling);

    const input = bar.querySelector('.search-input');
    const clearBtn = bar.querySelector('.search-clear');
    const chips = [...bar.querySelectorAll('.chip')];
    const resetBtn = empty.querySelector('.reset-btn');

    let activeTags = [];

    const apply = () => {
        const q = input.value.toLowerCase().replace(/\s+/g, ' ').trim();
        let shownTools = 0;
        let shownCats = 0;

        for (const cat of index) {
            const catMatch = q !== '' && cat.title.includes(q);
            let visibleInCat = 0;

            for (const item of cat.items) {
                const byText = q === '' || catMatch || item.text.includes(q);
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

        const filtering = q !== '' || activeTags.length > 0;
        clearBtn.hidden = q === '';
        empty.hidden = shownTools > 0;

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

    resetBtn.addEventListener('click', () => {
        input.value = '';
        activeTags = [];
        syncChips();
        apply();
        input.focus();
    });

    apply();
});
