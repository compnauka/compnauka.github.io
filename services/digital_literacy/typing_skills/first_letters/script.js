'use strict';

/* ============================================================
   КОНФІГУРАЦІЯ / Configuration
   ============================================================ */
const AppConfig = {
    alphabets: {
        uk: 'АБВГҐДЕЄЖЗИІЇЙКЛМНОПРСТУФХЦЧШЩЬЮЯ'.split(''),
        en: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')
    },
    colorsCount: 8,
    boardRows: 4,
    minBoardColumns: 5,
    tapThreshold: 22,
    statusMessageDuration: 2200,

    /*
     * Назви українських літер для озвучення.
     * Для англійської мови speech API читає літеру сам.
     */
    letterNames: {
        'А': 'А', 'Б': 'Бе', 'В': 'Ве', 'Г': 'Ге', 'Ґ': 'Ґе', 'Д': 'Де',
        'Е': 'Е', 'Є': 'Є', 'Ж': 'Же', 'З': 'Зе', 'И': 'И', 'І': 'І',
        'Ї': 'Ї', 'Й': 'Й короткий', 'К': 'Ка', 'Л': 'Ел', 'М': 'Ем',
        'Н': 'Ен', 'О': 'О', 'П': 'Пе', 'Р': 'Ер', 'С': 'Ес', 'Т': 'Те',
        'У': 'У', 'Ф': 'Еф', 'Х': 'Ха', 'Ц': 'Це', 'Ч': 'Че', 'Ш': 'Ша',
        'Щ': 'Ща', 'Ь': "М'який знак", 'Ю': 'Ю', 'Я': 'Я'
    }
};


/* ============================================================
   ЗВУКИ / Sound Manager
   Використовує Web Audio API — не потребує зовнішніх файлів.
   ============================================================ */
class SoundManager {
    constructor() {
        this._ctx = null;
        this.enabled = true;
    }

    setEnabled(value) {
        this.enabled = Boolean(value);
    }

    /** Лінива ініціалізація контексту (браузер вимагає жест користувача) */
    _getCtx() {
        if (!this._ctx) {
            try {
                this._ctx = new (window.AudioContext || window.webkitAudioContext)();
            } catch {
                return null;
            }
        }
        return this._ctx;
    }

    /**
     * Відтворює один тон.
     * @param {number} freq     - Початкова частота (Гц)
     * @param {number} endFreq  - Кінцева частота (Гц)
     * @param {number} dur      - Тривалість (сек)
     * @param {string} type     - Тип хвилі: 'sine' | 'square' | 'triangle'
     * @param {number} vol      - Гучність 0..1
     */
    _tone(freq, endFreq, dur, type = 'sine', vol = 0.22) {
        if (!this.enabled) return;
        const ctx = this._getCtx();
        if (!ctx) return;
        try {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.type = type;
            osc.frequency.setValueAtTime(freq, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(
                Math.max(endFreq, 20),
                ctx.currentTime + dur
            );
            gain.gain.setValueAtTime(vol, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);

            osc.start(ctx.currentTime);
            osc.stop(ctx.currentTime + dur + 0.01);
        } catch { /* silent */ }
    }

    /** Підйом літери з банку */
    pickup() {
        this._tone(440, 880, 0.11, 'sine', 0.18);
    }

    /** Розміщення літери на дошці */
    drop() {
        this._tone(700, 350, 0.12, 'sine', 0.22);
        setTimeout(() => this._tone(500, 640, 0.09, 'sine', 0.13), 55);
    }

    /** Видалення літери (повернення до банку) */
    remove() {
        this._tone(500, 180, 0.14, 'sine', 0.18);
    }

    /** Очищення всієї дошки — низхідна мелодія */
    clear() {
        [523, 440, 349, 262].forEach((f, i) =>
            setTimeout(() => this._tone(f, f * 0.85, 0.17, 'sine', 0.18), i * 85)
        );
    }

    /** М'який сигнал, коли дошка вже заповнена */
    full() {
        this._tone(220, 160, 0.16, 'sine', 0.15);
        setTimeout(() => this._tone(180, 140, 0.14, 'sine', 0.12), 90);
    }
}


/* ============================================================
   МОВЛЕННЯ / Speech Manager
   Озвучує назву літери для дітей (Web Speech API, uk-UA / en-US).
   ============================================================ */
class SpeechManager {
    constructor() {
        this.available = 'speechSynthesis' in window;
        this.enabled = true;
    }

    setEnabled(value) {
        this.enabled = Boolean(value);
        if (!this.enabled && this.available) {
            try { window.speechSynthesis.cancel(); } catch { /* silent */ }
        }
    }

    speak(text, lang = 'uk-UA') {
        if (!this.available || !this.enabled) return;
        try {
            window.speechSynthesis.cancel();
            const utt = new SpeechSynthesisUtterance(text);
            utt.lang = lang;
            utt.rate = 0.72;
            utt.pitch = 1.25; // трохи вищий тон для дитячого застосунку
            utt.volume = 1;
            window.speechSynthesis.speak(utt);
        } catch { /* silent */ }
    }
}


/* ============================================================
   ЕФЕКТИ / Effects Manager
   Іскри (sparkles) та анімації літер.
   ============================================================ */
class EffectsManager {
    constructor() {
        this.container = document.getElementById('sparklesContainer');
    }

    /**
     * Розсипає іскри навколо точки (x, y) у viewport-координатах.
     * @param {number} x
     * @param {number} y
     */
    sparkle(x, y) {
        const emojis = ['⭐', '✨', '🌟', '💫', '🎉', '🎊', '🌈'];
        const count = 7;

        for (let i = 0; i < count; i++) {
            const el = document.createElement('span');
            el.className = 'sparkle';
            el.textContent = emojis[Math.floor(Math.random() * emojis.length)];
            el.setAttribute('aria-hidden', 'true');

            const angle = (i / count) * 2 * Math.PI - Math.PI / 2;
            const dist = 38 + Math.random() * 28;

            el.style.left = (x - 12) + 'px';
            el.style.top = (y - 12) + 'px';
            el.style.setProperty('--dx', (Math.cos(angle) * dist) + 'px');
            el.style.setProperty('--dy', (Math.sin(angle) * dist) + 'px');
            el.style.animationDelay = (Math.random() * 0.07) + 's';

            this.container.appendChild(el);
            el.addEventListener('animationend', () => el.remove(), { once: true });
        }
    }

    /** Анімація «стрибок» при появі літери на дошці */
    bounceIn(el) {
        el.classList.remove('bounce-in');
        void el.offsetWidth; // примусовий reflow
        el.classList.add('bounce-in');
        el.addEventListener('animationend',
            () => el.classList.remove('bounce-in'), { once: true });
    }

    /** Анімація «промовляння» при тапі на літеру дошки */
    speakPulse(el) {
        el.classList.remove('speaking');
        void el.offsetWidth;
        el.classList.add('speaking');
        el.addEventListener('animationend',
            () => el.classList.remove('speaking'), { once: true });
    }
}


/* ============================================================
   ОСНОВНИЙ РЕДАКТОР / Letter Editor
   ============================================================ */
class LetterEditor {
    constructor() {
        this.lang = 'uk';

        this.el = {
            bank: document.getElementById('letters'),
            dropzone: document.getElementById('dropzone'),
            langUk: document.getElementById('langUk'),
            langEn: document.getElementById('langEn'),
            clearBtn: document.getElementById('clearBtn'),
            soundToggle: document.getElementById('soundToggle'),
            speechToggle: document.getElementById('speechToggle'),
            soundIcon: document.getElementById('soundIcon'),
            soundText: document.getElementById('soundText'),
            speechIcon: document.getElementById('speechIcon'),
            speechText: document.getElementById('speechText'),
            boardHint: document.getElementById('boardHint'),
            statusMessage: document.getElementById('statusMessage'),
            overlay: document.getElementById('clearOverlay'),
            confirmYes: document.getElementById('confirmYes'),
            confirmNo: document.getElementById('confirmNo'),
        };

        /** Стан перетягування */
        this.drag = {
            active: false,
            pointerId: null,    // активний pointerId; ігнорує другий палець під час drag
            ghost: null,
            char: '',
            colorClass: '',
            startX: 0,
            startY: 0,
            sourceCell: null,   // комірка дошки (якщо тягнемо звідти)
            sourceLetter: null, // сам елемент літери
        };

        this.soundEnabled = true;
        this.speechEnabled = true;
        this.statusTimer = null;
        this.boardColumns = 0;
        this.resizeTimer = null;

        this.sound = new SoundManager();
        this.speech = new SpeechManager();
        this.effects = new EffectsManager();

        this._init();
    }

    /* ----------------------------------------------------------
       Ініціалізація
       ---------------------------------------------------------- */
    _init() {
        this._renderBoard();
        this._renderBank();
        this._bindEvents();
    }

    /* ----------------------------------------------------------
       Рендеринг
       ---------------------------------------------------------- */
    _renderBoard(items = []) {
        const columns = this._calculateBoardColumns();
        const capacity = columns * AppConfig.boardRows;
        this.boardColumns = columns;
        this.el.dropzone.style.setProperty('--board-columns', String(columns));

        this.el.dropzone.innerHTML = '';
        const frag = document.createDocumentFragment();

        for (let i = 0; i < capacity; i++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.dataset.index = i;

            const saved = items[i];
            if (saved) {
                cell.appendChild(this._makeLetter(saved.char, saved.colorClass));
            }

            frag.appendChild(cell);
        }

        this.el.dropzone.appendChild(frag);
        this._syncHint();
    }

    _getBoardItems() {
        return [...this.el.dropzone.querySelectorAll('.cell')].map((cell) => {
            const letter = cell.querySelector('.letter');
            if (!letter) return null;
            return {
                char: letter.dataset.char,
                colorClass: letter.dataset.color
            };
        });
    }

    _getCssNumber(name, fallback) {
        const value = getComputedStyle(document.documentElement)
            .getPropertyValue(name)
            .trim();
        const parsed = parseFloat(value);
        return Number.isFinite(parsed) ? parsed : fallback;
    }

    _calculateBoardColumns() {
        const boardRect = this.el.dropzone.getBoundingClientRect();
        const styles = getComputedStyle(this.el.dropzone);
        const paddingX = parseFloat(styles.paddingLeft) + parseFloat(styles.paddingRight);
        const borderX = parseFloat(styles.borderLeftWidth) + parseFloat(styles.borderRightWidth);
        const gap = this._getCssNumber('--board-gap', 6);
        const cell = this._getCssNumber('--board-cell-size', 46);
        const contentWidth = Math.max(0, boardRect.width - paddingX - borderX);
        const columns = Math.floor((contentWidth + gap) / (cell + gap));
        return Math.max(AppConfig.minBoardColumns, columns || AppConfig.minBoardColumns);
    }

    _handleResize() {
        window.clearTimeout(this.resizeTimer);
        this.resizeTimer = window.setTimeout(() => {
            const nextColumns = this._calculateBoardColumns();
            if (nextColumns === this.boardColumns) return;

            const items = this._getBoardItems();
            this._cancelActiveDrag();
            this._renderBoard(items);
        }, 120);
    }

    _renderBank() {
        this.el.bank.innerHTML = '';
        const frag = document.createDocumentFragment();
        AppConfig.alphabets[this.lang].forEach((char, idx) =>
            frag.appendChild(
                this._makeLetter(char, `color-${idx % AppConfig.colorsCount}`)
            )
        );
        this.el.bank.appendChild(frag);
    }

    /* ----------------------------------------------------------
       Фабрика елементу літери
       ---------------------------------------------------------- */

    /**
     * Створює div-літеру з усіма потрібними data-атрибутами.
     *
     * ВИПРАВЛЕННЯ ПОМИЛКИ B1:
     * Оригінальний createLetterElement() не зберігав dataset.color,
     * тому при перетягуванні літери з дошки colorClass ставав undefined.
     */
    _makeLetter(char, colorClass) {
        const el = document.createElement('div');
        el.className = `letter ${colorClass}`;
        el.textContent = char;
        el.dataset.char = char;
        el.dataset.color = colorClass; // ← ВИПРАВЛЕНО
        el.setAttribute('role', 'button');
        el.setAttribute('tabindex', '0');
        el.setAttribute('aria-label', `Літера ${char}`);
        return el;
    }

    /* ----------------------------------------------------------
       Робота з дошкою
       ---------------------------------------------------------- */
    _placeInCell(cell, char, colorClass, animate = true) {
        cell.innerHTML = '';
        const el = this._makeLetter(char, colorClass);
        cell.appendChild(el);
        if (animate) this.effects.bounceIn(el);
        this._syncHint();
        return el;
    }

    _addToFirstEmpty(char, colorClass) {
        const empty = [...this.el.dropzone.querySelectorAll('.cell')]
            .find(c => c.children.length === 0);
        if (!empty) {
            this._showBoardFullMessage();
            return false;
        }

        this._placeInCell(empty, char, colorClass);

        const r = empty.getBoundingClientRect();
        this.effects.sparkle(r.left + r.width / 2, r.top + r.height / 2);
        this.sound.drop();
        this._clearStatusMessage();
        return true;
    }

    _showBoardFullMessage() {
        this.sound.full();
        this.el.dropzone.classList.remove('board-full');
        void this.el.dropzone.offsetWidth;
        this.el.dropzone.classList.add('board-full');
        this._setStatusMessage('Дошка заповнена. Перетягни літеру назад у набір або очисти дошку.');
    }

    _setStatusMessage(message) {
        if (!this.el.statusMessage) return;
        window.clearTimeout(this.statusTimer);
        this.el.statusMessage.textContent = message;
        this.el.statusMessage.classList.add('status-message--visible');
        this.statusTimer = window.setTimeout(
            () => this._clearStatusMessage(),
            AppConfig.statusMessageDuration
        );
    }

    _clearStatusMessage() {
        if (!this.el.statusMessage) return;
        window.clearTimeout(this.statusTimer);
        this.el.statusMessage.textContent = '';
        this.el.statusMessage.classList.remove('status-message--visible');
    }

    _boardHasLetters() {
        return !!this.el.dropzone.querySelector('.cell .letter');
    }

    /** Показує/ховає підказку на порожній дошці */
    _syncHint() {
        this.el.boardHint.classList.toggle('hidden', this._boardHasLetters());
    }
    /** Встановлює мову та синхронізує стан кнопок-перемикачів */
    _setLang(lang) {
        this._cancelActiveDrag();

        this.lang = lang;
        const isUk = lang === 'uk';
        this.el.langUk.classList.toggle('btn--lang-active', isUk);
        this.el.langUk.setAttribute('aria-pressed', String(isUk));
        this.el.langEn.classList.toggle('btn--lang-active', !isUk);
        this.el.langEn.setAttribute('aria-pressed', String(!isUk));
        this._renderBank();
    }

    /* ----------------------------------------------------------
       Прив'язка подій
       ---------------------------------------------------------- */
    _bindEvents() {
        // Перемикання мови
        this.el.langUk.addEventListener('click', () => this._setLang('uk'));
        this.el.langEn.addEventListener('click', () => this._setLang('en'));

        // Перемикачі звуку та озвучення
        this.el.soundToggle.addEventListener('click', () => this._toggleSound());
        this.el.speechToggle.addEventListener('click', () => this._toggleSpeech());

        // Кнопка «Очистити»
        // ВИПРАВЛЕННЯ B5: додано діалог підтвердження
        this.el.clearBtn.addEventListener('click', () => {
            if (!this._boardHasLetters()) return;
            this._cancelActiveDrag();
            this._toggleOverlay(true);
        });
        this.el.confirmYes.addEventListener('click', () => {
            this._toggleOverlay(false);
            this._cancelActiveDrag();
            this.sound.clear();
            this._renderBoard([]);
        });
        this.el.confirmNo.addEventListener('click', () =>
            this._toggleOverlay(false)
        );

        // Pointer-події для drag-and-drop
        this.el.bank.addEventListener('pointerdown', this._onDown.bind(this));
        this.el.dropzone.addEventListener('pointerdown', this._onDown.bind(this));
        this.el.bank.addEventListener('keydown', this._onLetterKeyDown.bind(this));
        this.el.dropzone.addEventListener('keydown', this._onLetterKeyDown.bind(this));
        document.addEventListener('pointermove', this._onMove.bind(this), { passive: false });
        document.addEventListener('pointerup', this._onUp.bind(this));
        document.addEventListener('pointercancel', this._onCancel.bind(this));
        window.addEventListener('resize', this._handleResize.bind(this));
        window.addEventListener('orientationchange', this._handleResize.bind(this));
        window.addEventListener('blur', () => this._cancelActiveDrag());
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) this._cancelActiveDrag();
        });
    }

    _toggleSound() {
        this.soundEnabled = !this.soundEnabled;
        this.sound.setEnabled(this.soundEnabled);
        this.el.soundToggle.setAttribute('aria-pressed', String(this.soundEnabled));
        this.el.soundToggle.setAttribute('aria-label', this.soundEnabled ? 'Вимкнути звуки' : 'Увімкнути звуки');
        this.el.soundToggle.classList.toggle('btn--toggle-off', !this.soundEnabled);
        this.el.soundIcon.textContent = this.soundEnabled ? '🔊' : '🔇';
        this.el.soundText.textContent = this.soundEnabled ? 'Звук' : 'Тихо';
    }

    _toggleSpeech() {
        this.speechEnabled = !this.speechEnabled;
        this.speech.setEnabled(this.speechEnabled);
        this.el.speechToggle.setAttribute('aria-pressed', String(this.speechEnabled));
        this.el.speechToggle.setAttribute('aria-label', this.speechEnabled ? 'Вимкнути озвучення літер' : 'Увімкнути озвучення літер');
        this.el.speechToggle.classList.toggle('btn--toggle-off', !this.speechEnabled);
        this.el.speechIcon.textContent = this.speechEnabled ? '🗣️' : '🤫';
        this.el.speechText.textContent = this.speechEnabled ? 'Голос' : 'Без голосу';
    }

    _onLetterKeyDown(e) {
        if (this.drag.active) return;

        const letter = e.target.closest('.letter');
        if (!letter || (e.key !== 'Enter' && e.key !== ' ')) return;
        e.preventDefault();

        const inBoard = this.el.dropzone.contains(letter);
        const char = letter.dataset.char;
        const colorClass = letter.dataset.color;
        this._speakLetter(char);

        if (inBoard) {
            this.effects.speakPulse(letter);
            return;
        }

        this._addToFirstEmpty(char, colorClass);
    }

    _toggleOverlay(show) {
        this.el.overlay.setAttribute('aria-hidden', show ? 'false' : 'true');
        if (show) this.el.confirmYes.focus();
    }

    /* ----------------------------------------------------------
       Pointer Down
       ---------------------------------------------------------- */
    _onDown(e) {
        const letter = e.target.closest('.letter');
        if (!letter) return;

        const inBank = this.el.bank.contains(letter);
        const inBoard = this.el.dropzone.contains(letter);
        if (!inBank && !inBoard) return;

        e.preventDefault();

        /*
         * ВИПРАВЛЕННЯ B6: multi-touch guard.
         * Якщо дитина тримає одну літеру пальцем і торкається іншої,
         * другий pointerdown більше не перезаписує стан drag і не залишає
         * «підвішений» ghost-елемент поза дошкою.
         */
        if (this.drag.active) return;

        // Прибираємо можливі «сироти» після старої помилки або системного cancel.
        this._removeGhostLetters();

        const d = this.drag;
        d.active = true;
        d.pointerId = e.pointerId;
        d.char = letter.dataset.char;
        d.colorClass = letter.dataset.color;
        d.startX = e.clientX;
        d.startY = e.clientY;
        d.sourceCell = inBoard ? letter.closest('.cell') : null;
        d.sourceLetter = letter;

        // Трохи затемнюємо літеру на дошці (вона залишається на місці)
        if (inBoard) letter.style.opacity = '0.22';

        // Створюємо «привид» для перетягування
        const ghost = this._makeLetter(d.char, d.colorClass);
        ghost.classList.add('letter--ghost');
        document.body.appendChild(ghost);
        d.ghost = ghost;
        this._moveGhost(e.clientX, e.clientY);

        // Озвучуємо літеру одразу при торканні
        this._speakLetter(d.char);
        this.sound.pickup();
    }

    /* ----------------------------------------------------------
       Pointer Move
       ---------------------------------------------------------- */
    _onMove(e) {
        if (!this.drag.active || e.pointerId !== this.drag.pointerId) return;
        e.preventDefault();
        this._moveGhost(e.clientX, e.clientY);
        this._highlightCellAt(e.clientX, e.clientY);
    }

    /* ----------------------------------------------------------
       Pointer Up
       ---------------------------------------------------------- */
    _onUp(e) {
        if (!this.drag.active || e.pointerId !== this.drag.pointerId) return;

        const d = this.drag;
        const dist = Math.hypot(e.clientX - d.startX, e.clientY - d.startY);

        this._clearHighlights();

        if (dist < AppConfig.tapThreshold) {
            /* ---- ТАП / Tap ---- */
            if (d.sourceCell) {
                /*
                 * ВИПРАВЛЕННЯ B4: тап по літері на дошці більше НЕ видаляє її.
                 * Замість цього — анімація + озвучення (вже викликано в _onDown).
                 */
                if (d.sourceLetter) {
                    d.sourceLetter.style.opacity = '1';
                    this.effects.speakPulse(d.sourceLetter);
                }
            } else {
                // Тап по банку → додаємо на першу вільну комірку
                this._addToFirstEmpty(d.char, d.colorClass);
            }
        } else {
            /* ---- ПЕРЕТЯГУВАННЯ / Drag ---- */
            const targetCell = this._cellAt(e.clientX, e.clientY);

            if (targetCell && this.el.dropzone.contains(targetCell)) {
                /* Скидаємо на комірку дошки */
                if (d.sourceCell && targetCell !== d.sourceCell) {
                    const existing = targetCell.querySelector('.letter');
                    if (existing) {
                        // Обмін місцями
                        this._placeInCell(d.sourceCell,
                            existing.dataset.char, existing.dataset.color);
                    } else {
                        d.sourceCell.innerHTML = '';
                    }
                } else if (!d.sourceCell) {
                    // З банку на дошку — просто розміщуємо
                } else {
                    // Та сама комірка — відновлюємо
                    if (d.sourceLetter) d.sourceLetter.style.opacity = '1';
                    this._cleanupDrag();
                    return;
                }

                this._placeInCell(targetCell, d.char, d.colorClass);

                const r = targetCell.getBoundingClientRect();
                this.effects.sparkle(r.left + r.width / 2, r.top + r.height / 2);
                this.sound.drop();

            } else {
                /* Скинули поза дошкою */
                if (d.sourceCell) {
                    if (this._isOverBank(e.clientX, e.clientY)) {
                        /*
                         * Перетягнули з дошки назад у банк → видаляємо літеру з дошки.
                         * Це єдиний навмисний спосіб видалити окрему літеру.
                         */
                        const sourceCell = d.sourceCell;
                        const removingEl = d.sourceLetter;
                        if (removingEl && sourceCell) {
                            removingEl.style.opacity = '1';
                            removingEl.classList.add('pop-out');
                            window.setTimeout(() => {
                                sourceCell.innerHTML = '';
                                this._syncHint();
                            }, 220);
                        }
                        this._clearStatusMessage();
                        this.sound.remove();
                    } else {
                        /*
                         * ВИПРАВЛЕННЯ B3: скинули випадково поза дошкою —
                         * літера повертається на місце замість видалення.
                         */
                        if (d.sourceLetter) d.sourceLetter.style.opacity = '1';
                    }
                }
                // З банку поза дошкою — нічого не робимо
            }
        }

        this._cleanupDrag();
        this._syncHint();
    }

    /* ----------------------------------------------------------
       Pointer Cancel
       ---------------------------------------------------------- */
    _onCancel(e) {
        if (!this.drag.active) return;
        if (e && e.pointerId !== this.drag.pointerId) return;
        this._cancelActiveDrag();
    }

    /* ----------------------------------------------------------
       Допоміжні методи
       ---------------------------------------------------------- */

    /** Переміщає ghost-елемент під палець/курсор */
    _moveGhost(x, y) {
        if (!this.drag.ghost) return;
        const half = parseFloat(
            getComputedStyle(document.documentElement).getPropertyValue('--key-size')
        ) / 2 || 29;
        this.drag.ghost.style.left = (x - half) + 'px';
        this.drag.ghost.style.top = (y - half) + 'px';
    }

    /** Повертає комірку під точкою (ховаючи ghost тимчасово) */
    _cellAt(x, y) {
        if (!this.drag.ghost) return null;
        this.drag.ghost.style.display = 'none';
        const el = document.elementFromPoint(x, y);
        this.drag.ghost.style.display = '';
        return el ? el.closest('.cell') : null;
    }

    /** Чи знаходиться точка над банком літер */
    _isOverBank(x, y) {
        if (!this.drag.ghost) return false;
        this.drag.ghost.style.display = 'none';
        const el = document.elementFromPoint(x, y);
        this.drag.ghost.style.display = '';
        return !!(el && this.el.bank.contains(el));
    }

    /** Підсвічує комірку під вказівником + загальний стан дошки */
    _highlightCellAt(x, y) {
        this._clearHighlights();
        const cell = this._cellAt(x, y);
        if (cell && this.el.dropzone.contains(cell)) {
            cell.classList.add('cell--highlight');
        }
        this.el.dropzone.classList.add('drag-over');
    }

    _clearHighlights() {
        this.el.dropzone
            .querySelectorAll('.cell--highlight')
            .forEach(c => c.classList.remove('cell--highlight'));
        this.el.dropzone.classList.remove('drag-over');
    }

    /** Скасовує активне перетягування без втрати літери */
    _cancelActiveDrag() {
        if (this.drag.sourceLetter) {
            this.drag.sourceLetter.style.opacity = '1';
        }
        this._clearHighlights();
        this._cleanupDrag();
    }

    /** Прибирає всі ghost-елементи, включно з можливими «сиротами» */
    _removeGhostLetters() {
        document
            .querySelectorAll('.letter--ghost')
            .forEach((ghost) => ghost.remove());
    }

    /** Прибирає ghost та скидає стан перетягування */
    _cleanupDrag() {
        if (this.drag.sourceLetter) {
            this.drag.sourceLetter.style.opacity = '1';
        }
        this._removeGhostLetters();
        this.drag.active = false;
        this.drag.pointerId = null;
        this.drag.ghost = null;
        this.drag.sourceCell = null;
        this.drag.sourceLetter = null;
    }

    /** Озвучує назву літери відповідною мовою */
    _speakLetter(char) {
        const lang = this.lang === 'uk' ? 'uk-UA' : 'en-US';
        const name = this.lang === 'uk'
            ? (AppConfig.letterNames[char] || char)
            : char;
        this.speech.speak(name, lang);
    }
}


/* ============================================================
   ЗАПУСК / Bootstrap
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {
    installInputGuard();
    new LetterEditor();
});

/* ============================================================
   ОБМЕЖЕНИЙ ЗАХИСТ ВІД НЕБАЖАНИХ ЖЕСТІВ
   Не блокує глобальну прокрутку та масштабування сторінки.
   Стандартні touch-дії вимикаються лише для самих літер через CSS
   touch-action: none, а тут прибираємо випадкове перетягування елементів.
   ============================================================ */
function installInputGuard() {
    document.addEventListener('dragstart', (e) => {
        if (e.target.closest?.('.letter')) e.preventDefault();
    });

    document.addEventListener('contextmenu', (e) => {
        if (e.target.closest?.('.letter')) e.preventDefault();
    });
}
