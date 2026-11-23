// ─────────────────────────────────────────────
//  CONFIG
// ─────────────────────────────────────────────
const Config = {
    colors: [
        { hex: '#000000', name: 'Чорний' },
        { hex: '#FF4D4D', name: 'Червоний' },
        { hex: '#3B82F6', name: 'Синій' },
        { hex: '#00E055', name: 'Зелений' },
        { hex: '#A855F7', name: 'Фіолетовий' }
    ],
    emojis: ['🐶', '🐱', '🦁', '🚀', '⭐', '🌈', '🍕', '🎨', '🎮', '🐰', '🦊', '🐻', '🐼', '🐨', '🐸', '🐙', '🍓', '🍦', '🎁', '🍭', '🏰', '👻', '🤖', '🦖', '⚽', '💎', '💡', '🦉', '🦋', '🍪'],
    toastLimit: 2,
    maxChars: 7000,
    storageKey: 'drukaryk_v3_content',
    themeKey: 'drukaryk_theme_v1',
    // mapping for <font size="1..7"> → CSS
    fontSizeMap: {
        '1': '1.0rem', '2': '1.25rem', '3': '1.5rem', '4': '1.9rem',
        '5': '2.25rem', '6': '2.6rem', '7': '3.0rem'
    }
};

// ─────────────────────────────────────────────
//  UTILS
// ─────────────────────────────────────────────

/**
 * Fisher-Yates shuffle — рівномірний розподіл на відміну від sort(Math.random)
 */
function shuffleArray(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

// ─────────────────────────────────────────────
//  SANITIZER
// ─────────────────────────────────────────────
const Sanitizer = {
    PURIFY_CFG: {
        ALLOWED_TAGS: ['div', 'p', 'br', 'span', 'b', 'strong', 'i', 'em', 'u', 'font'],
        ALLOWED_ATTR: ['style', 'color', 'size', 'face', 'align'],
        KEEP_CONTENT: true
    },
    STYLE_WHITELIST: new Set(['color', 'font-size', 'font-weight', 'font-style', 'text-decoration', 'text-decoration-line', 'text-align']),

    sanitize(html) {
        const clean = DOMPurify.sanitize(String(html || ''), this.PURIFY_CFG);
        const tpl = document.createElement('template');
        tpl.innerHTML = clean;

        // фільтруємо style-атрибути
        tpl.content.querySelectorAll('[style]').forEach(el => {
            const raw = el.getAttribute('style') || '';
            const filtered = [];
            raw.split(';').forEach(part => {
                const [k, v] = part.split(':').map(s => (s || '').trim());
                if (!k || !v) return;
                const key = k.toLowerCase();
                if (this.STYLE_WHITELIST.has(key)) filtered.push(`${key}:${v}`);
            });
            if (filtered.length) el.setAttribute('style', filtered.join(';'));
            else el.removeAttribute('style');
        });

        // align → style
        tpl.content.querySelectorAll('[align]').forEach(el => {
            const a = (el.getAttribute('align') || '').toLowerCase();
            if (['left', 'center', 'right', 'justify'].includes(a)) el.style.textAlign = a;
            el.removeAttribute('align');
        });

        // нормалізуємо <font> → <span style>
        this._normalizeFontNodes(tpl.content);

        return tpl.innerHTML;
    },

    /**
     * Єдине місце для конвертації <font> → <span>.
     * Працює як з DocumentFragment (sanitize), так і з живим DOM (Editor.normalizeFonts).
     */
    _normalizeFontNodes(root) {
        root.querySelectorAll('font').forEach(f => {
            const span = document.createElement('span');
            span.style.cssText = f.style.cssText;
            const color = f.getAttribute('color');
            const size = f.getAttribute('size');

            if (color) span.style.color = color;
            if (size && Config.fontSizeMap[String(size)]) {
                span.style.fontSize = Config.fontSizeMap[String(size)];
            }

            while (f.firstChild) span.appendChild(f.firstChild);
            f.replaceWith(span);
        });
    }
};

// ─────────────────────────────────────────────
//  EDITOR
// ─────────────────────────────────────────────
const Editor = {
    el: null,
    lastRange: null,
    _limitToastShown: false,
    _activeColor: '#000000',   // поточний активний колір для відстеження

    init() {
        this.el = document.getElementById('editor');

        this.updatePlaceholderState();
        this.renderColors();
        this.renderEmojis();

        // CSS-стилі для execCommand (якщо браузер підтримує)
        try { document.execCommand('styleWithCSS', false, true); } catch (_) { }

        const capture = () => { this.captureSelection(); this.updateActiveStates(); };
        ['mouseup', 'keyup', 'touchend'].forEach(ev => this.el.addEventListener(ev, capture));

        this.el.addEventListener('input', () => {
            this.updatePlaceholderState();
            App.updateWordCount();
            App.saveToLocalDebounced();
            this.updateActiveStates();
            this.captureSelection();
        });

        this.el.addEventListener('focus', () => this.updateFocusState());
        this.el.addEventListener('blur', () => { this.captureSelection(); this.updateFocusState(); });
        this.updateFocusState();

        // ліміт символів + throttle-toast
        this.el.addEventListener('beforeinput', e => {
            if (!e.inputType.startsWith('insert') || e.inputType === 'insertFromPaste' || e.isComposing) return;
            const added = e.data || (e.inputType === 'insertParagraph' || e.inputType === 'insertLineBreak' ? '\n' : '');
            if (!this.canInsert(added)) {
                e.preventDefault();
                this.showLimitHint();
            }
        });

        document.addEventListener('selectionchange', () => {
            this.captureSelection();
            this.updateActiveStates();
        });

        this.el.addEventListener('paste', e => {
            e.preventDefault();
            const text = (e.clipboardData || window.clipboardData).getData('text/plain');
            if (!text) return;

            const len = (this.el.textContent || '').length;
            const allowed = Math.max(0, Config.maxChars - len + this.selectedLength());
            if (allowed <= 0) { App.toast('Ого! Ти написав забагато!', 'warning'); return; }

            document.execCommand('insertText', false, text.slice(0, allowed));
            if (text.length > allowed) this.showLimitHint();
            this.updatePlaceholderState();
            this.captureSelection();
            App.updateWordCount();
            App.saveToLocalDebounced();
        });
    },

    updateFocusState() {
        const active = document.activeElement === this.el;
        document.getElementById('editor-shell').classList.toggle('is-focused', active);
        document.getElementById('editor-focus-text').textContent = active
            ? 'Можна друкувати' : 'Натисни тут, щоб друкувати';
        this.el.dataset.placeholder = active ? 'Почни свою історію…' : 'Натисни на поле й почни свою історію…';
        this.updatePlaceholderState();
    },

    selectedLength() {
        const sel = window.getSelection();
        return sel?.rangeCount && this._rangeInsideEditor(sel.getRangeAt(0)) ? sel.toString().length : 0;
    },

    canInsert(text) {
        return (this.el.textContent || '').length - this.selectedLength() + text.length <= Config.maxChars;
    },

    showLimitHint() {
        if (this._limitToastShown) return;
        this._limitToastShown = true;
        App.toast('Місце закінчилося. Видали частину тексту або збережи історію.', 'warning');
        setTimeout(() => { this._limitToastShown = false; }, 3000);
    },

    updatePlaceholderState() {
        if (!this.el) return;
        const empty = ((this.el.textContent || '').trim().length === 0);
        this.el.classList.toggle('is-empty', empty);
    },

    // ── selection helpers ────────────────────

    _rangeInsideEditor(range) {
        if (!range || !this.el) return false;
        const node = range.commonAncestorContainer.nodeType === 1
            ? range.commonAncestorContainer
            : range.commonAncestorContainer.parentNode;
        return !!(node && this.el.contains(node));
    },

    captureSelection() {
        const sel = window.getSelection();
        if (!sel || !sel.rangeCount) return;
        const range = sel.getRangeAt(0);
        if (this._rangeInsideEditor(range)) this.lastRange = range.cloneRange();
    },

    restoreSelectionSafe() {
        const current = window.getSelection();
        const keepCurrent = current?.rangeCount && this._rangeInsideEditor(current.getRangeAt(0));
        this.el.focus();
        const sel = window.getSelection();
        if (!sel) return;
        // Re-adding a collapsed range discards the browser's pending typing styles.
        if (keepCurrent) { this.captureSelection(); return; }

        if (this.lastRange) {
            const host = this.lastRange.commonAncestorContainer.nodeType === 1
                ? this.lastRange.commonAncestorContainer
                : this.lastRange.commonAncestorContainer.parentNode;
            if (!(host && this.el.contains(host))) this.lastRange = null;
        }

        if (this.lastRange) {
            sel.removeAllRanges();
            sel.addRange(this.lastRange);
            return;
        }

        // fallback: курсор у кінець
        const r = document.createRange();
        r.selectNodeContents(this.el);
        r.collapse(false);
        sel.removeAllRanges();
        sel.addRange(r);
        this.lastRange = r.cloneRange();
    },

    /**
     * FIX #2: дозволяємо форматування без виділення (toggle-режим).
     * Якщо курсор collapsed — застосовуємо команду до поточної позиції
     * і діти просто продовжують друкувати вже відформатованим текстом.
     * Показуємо hint тільки якщо курсор взагалі не в редакторі.
     */
    requireFocusOrHint() {
        const sel = window.getSelection();
        if (!sel || !sel.rangeCount) { App.toast('Клікни в поле тексту 😊', 'info'); return false; }
        const r = sel.getRangeAt(0);
        if (!this._rangeInsideEditor(r)) { App.toast('Клікни в поле тексту 😊', 'info'); return false; }
        return true;
    },

    // ─── commands ────────────────────────────

    exec(cmd, val = null) {
        if (cmd === 'undo' || cmd === 'redo') {
            this.el.focus();
            document.execCommand(cmd, false, null);
            this.updateActiveStates();
            this.updatePlaceholderState();
            App.updateWordCount();
            App.saveToLocalDebounced();
            this.captureSelection();
            return;
        }

        this.restoreSelectionSafe();

        const sel = window.getSelection();
        if (!sel) return;

        if (['bold', 'italic', 'underline'].includes(cmd)) {
            // FIX #2: дозволяємо без виділення — toggle на collapsed cursor
            if (!this.requireFocusOrHint()) return;

            document.execCommand(cmd, false, val);
        } else if (['foreColor', 'fontSize'].includes(cmd)) {
            if (!this.requireFocusOrHint()) return;
            document.execCommand(cmd, false, val);
        } else {
            if (!sel.rangeCount || !this._rangeInsideEditor(sel.getRangeAt(0))) {
                App.toast('Клікни в поле тексту 😊', 'info');
                return;
            }
            document.execCommand(cmd, false, val);
            this.captureSelection();
        }

        this.updateActiveStates();
        this.captureSelection();
        App.saveToLocalDebounced();
    },

    setSize(size) {
        this.restoreSelectionSafe();

        const sel = window.getSelection();
        if (!sel) return;

        if (!this.requireFocusOrHint()) return;

        // Keep the live DOM under the browser's editing engine so undo and the caret survive.
        document.execCommand('fontSize', false, size);
        this.captureSelection();

        this.updateActiveStates();
        App.saveToLocalDebounced();
    },

    /**
     * FIX #3: більше не дублює логіку — делегує до Sanitizer._normalizeFontNodes
     */
    normalizeFonts() {
        Sanitizer._normalizeFontNodes(this.el);
    },

    insertEmoji(emoji) {
        this.restoreSelectionSafe();
        if (!this.canInsert(emoji)) { this.showLimitHint(); return; }
        const sel = window.getSelection();
        if (!sel || !sel.rangeCount || !this._rangeInsideEditor(sel.getRangeAt(0))) {
            App.toast('Клікни в поле тексту 😊', 'info');
            return;
        }
        document.execCommand('insertText', false, emoji);
        this.updatePlaceholderState();
        this.captureSelection();
        App.updateWordCount();
        App.saveToLocalDebounced();
    },

    /**
     * FIX #7: відстежуємо колір — скидаємо активний swatch після Undo
     */
    updateActiveStates() {
        const sel = window.getSelection();
        if (!sel || !sel.rangeCount) return;
        const r = sel.getRangeAt(0);
        if (!this._rangeInsideEditor(r)) return;

        ['bold', 'italic', 'underline'].forEach(cmd => {
            const btn = document.getElementById(`cmd-${cmd}`);
            if (btn) {
                const active = document.queryCommandState(cmd);
                btn.classList.toggle('active', active);
                btn.setAttribute('aria-pressed', String(active));
            }
        });

        const currentSize = document.queryCommandValue('fontSize');
        ['3', '5', '7'].forEach(s => {
            const btn = document.getElementById(`sz-${s}`);
            if (btn) {
                const active = String(currentSize) === s;
                btn.classList.toggle('active', active);
                btn.setAttribute('aria-pressed', String(active));
            }
        });

        // FIX #7: оновлюємо активний swatch кольору
        const rawColor = document.queryCommandValue('foreColor');
        if (rawColor) {
            const hex = this._rgbToHex(rawColor);
            if (hex) {
                const palette = document.getElementById('palette');
                palette && palette.querySelectorAll('.color-swatch').forEach(b => {
                    const active = b.dataset.hex.toLowerCase() === hex.toLowerCase();
                    b.classList.toggle('active', active);
                    b.setAttribute('aria-pressed', String(active));
                });
            }
        }
    },

    /** Конвертує rgb(r,g,b) або #hex у нижній hex */
    _rgbToHex(color) {
        if (!color) return null;
        if (color.startsWith('#')) return color.toLowerCase();
        const m = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
        if (!m) return null;
        return '#' + [m[1], m[2], m[3]]
            .map(n => parseInt(n).toString(16).padStart(2, '0'))
            .join('').toLowerCase();
    },

    // ─── render UI ───────────────────────────

    renderColors() {
        const palette = document.getElementById('palette');
        palette.innerHTML = '';

        Config.colors.forEach((color, idx) => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = `color-swatch ${idx === 0 ? 'active' : ''}`;
            btn.style.backgroundColor = color.hex;
            btn.dataset.hex = color.hex;
            btn.title = color.name;
            btn.setAttribute('aria-label', `Колір: ${color.name}`);
            btn.setAttribute('aria-pressed', String(idx === 0));

            btn.onmousedown = e => e.preventDefault();
            btn.onclick = () => {
                this.exec('foreColor', color.hex);

                palette.querySelectorAll('.color-swatch').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this._activeColor = color.hex;

                this.updateActiveStates();
                App.saveToLocalDebounced();
            };

            palette.appendChild(btn);
        });
    },

    /** FIX #5: Fisher-Yates замість sort(Math.random) */
    renderEmojis() {
        const container = document.getElementById('emojis');
        container.innerHTML = '';

        shuffleArray(Config.emojis).slice(0, 10).forEach(emoji => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center text-3xl sm:text-4xl hover:scale-125 transition active:scale-90 select-none';
            btn.textContent = emoji;
            btn.setAttribute('aria-label', `Вставити ${emoji}`);
            btn.onmousedown = e => e.preventDefault();
            btn.onclick = () => this.insertEmoji(emoji);
            container.appendChild(btn);
        });
    }
};

// ─────────────────────────────────────────────
//  APP
// ─────────────────────────────────────────────
const App = {
    _saveTimer: null,
    _toastLock: 0,
    _lastSaved: '',

    init() {
        this.initTheme();
        this.bindFileInput();
        this.bindModalBackdrop();
        Editor.init();
        this.loadFromLocal();
        this.updateWordCount();
        this.bindViewport();
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'hidden') this.saveToLocal();
        });
        window.addEventListener('pagehide', () => this.saveToLocal());

        window.addEventListener('keydown', e => {
            const modal = document.getElementById('modal');
            const modalOpen = modal.getAttribute('aria-hidden') === 'false';
            if (e.key === 'Escape' && modalOpen) { e.preventDefault(); this.hideModal(); }
            if (e.key === 'Tab' && modalOpen) {
                const buttons = [...modal.querySelectorAll('button')];
                const first = buttons[0], last = buttons[buttons.length - 1];
                if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
                else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
            }

            // FIX #8: Ctrl+S / Cmd+S — швидке збереження
            if ((e.ctrlKey || e.metaKey) && (e.code === 'KeyS' || e.key.toLowerCase() === 's')) {
                e.preventDefault();
                if (!modalOpen) this.askSave();
            }
        });
    },

    bindViewport() {
        const resize = () => {
            document.documentElement.style.setProperty('--app-height', `${Math.round(window.visualViewport?.height || window.innerHeight)}px`);
        };
        window.visualViewport?.addEventListener('resize', resize);
        window.addEventListener('resize', resize);
        resize();
    },

    bindFileInput() {
        const input = document.getElementById('file-input');
        input.addEventListener('change', e => this.loadFile(e));
    },

    bindModalBackdrop() {
        const modal = document.getElementById('modal');
        modal.addEventListener('mousedown', e => {
            if (e.target === modal) this.hideModal();
        });
    },

    initTheme() {
        let isDark = false;
        try { isDark = localStorage.getItem(Config.themeKey) === 'dark'; } catch (_) { }
        document.documentElement.classList.toggle('dark', isDark);
        const icon = document.getElementById('theme-icon');
        icon.className = isDark ? 'fas fa-sun text-lg sm:text-xl' : 'fas fa-moon text-lg sm:text-xl';
    },

    toggleTheme() {
        const isDark = !document.documentElement.classList.contains('dark');
        document.documentElement.classList.toggle('dark', isDark);
        try { localStorage.setItem(Config.themeKey, isDark ? 'dark' : 'light'); } catch (_) { }
        document.getElementById('theme-icon').className =
            isDark ? 'fas fa-sun text-lg sm:text-xl' : 'fas fa-moon text-lg sm:text-xl';
    },

    updateWordCount() {
        const text = (Editor.el.innerText || '').trim();
        const count = text ? text.split(/\s+/).filter(Boolean).length : 0;
        document.getElementById('word-count').textContent = count;
    },

    saveToLocalDebounced() {
        clearTimeout(this._saveTimer);
        this._saveTimer = setTimeout(() => this.saveToLocal(), 700);
    },

    saveToLocal() {
        clearTimeout(this._saveTimer);
        try {
            const safe = Sanitizer.sanitize(Editor.el.innerHTML);
            if (safe === this._lastSaved) return;
            localStorage.setItem(Config.storageKey, safe);
            this._lastSaved = safe;
        } catch (_) {
            this.toast('Не вдалось зберегти автоматично', 'warning');
        }
    },

    loadFromLocal() {
        let saved;
        try { saved = localStorage.getItem(Config.storageKey); } catch (_) { saved = null; }
        if (saved) {
            Editor.el.innerHTML = Sanitizer.sanitize(saved);
            this._lastSaved = Editor.el.innerHTML;
            Editor.normalizeFonts();
            this.updateWordCount();
        }
        Editor.updatePlaceholderState();
    },

    clear() {
        this.showModal('Видалити все?', 'Твій текст зникне назавжди. Ти впевнений?', [
            {
                text: 'ТАК, СТЕРТИ',
                class: 'bg-neo-red text-white py-4',
                action: () => {
                    Editor.el.innerHTML = '';
                    Editor.lastRange = null;
                    Editor.updatePlaceholderState();
                    this.updateWordCount();
                    this.saveToLocalDebounced();
                    this.toast('Очищено!', 'success');
                    Editor.el.focus();
                }
            },
            { text: 'НІ, ЗАЛИШИТИ', class: 'bg-gray-200 py-4', action: () => {} }
        ]);
    },

    loadFile(event) {
        const input = event.target;
        const file  = input.files && input.files[0];
        if (!file) return;

        if (file.size > 500_000) {
            this.toast('Файл надто великий (макс. 500 КБ)', 'error');
            input.value = '';
            return;
        }
        if (!/\.(txt|html)$/i.test(file.name)) {
            this.toast('Обери файл TXT або HTML', 'error');
            input.value = '';
            return;
        }

        const reader = new FileReader();
        reader.onload = e => {
            try {
                let content = String(e.target.result || '');

                const draft = document.createElement('div');
                if (file.name.toLowerCase().endsWith('.html')) {
                    const doc = new DOMParser().parseFromString(content, 'text/html');
                    content = doc.getElementById('exported-content')?.innerHTML
                        || doc.body?.innerHTML
                        || content;
                    draft.innerHTML = Sanitizer.sanitize(content);
                } else {
                    draft.innerText = content;
                }
                if ((draft.textContent || '').length > Config.maxChars) {
                    this.toast(`У файлі забагато тексту (максимум ${Config.maxChars} символів)`, 'warning');
                    input.value = '';
                    return;
                }
                const apply = () => {
                    Editor.el.innerHTML = draft.innerHTML;
                    Editor.lastRange = null;
                    Editor.updatePlaceholderState();
                    this.updateWordCount();
                    this.saveToLocalDebounced();
                    this.toast('Відкрито!', 'success');
                    input.value = '';
                    Editor.el.focus();
                };
                input.value = '';
                if ((Editor.el.innerText || '').trim()) {
                    this.showModal('Відкрити іншу історію?', 'Новий файл замінить текст у полі. Збережи поточну історію, якщо хочеш її залишити.', [
                        { text: 'ВІДКРИТИ ФАЙЛ', class: 'bg-neo-blue text-white py-4', action: apply },
                        { text: 'СКАСУВАТИ', class: 'bg-gray-100 py-3', action: () => {} }
                    ]);
                } else apply();
            } catch (_) {
                this.toast('Помилка файлу', 'error');
                input.value = '';
            }
        };
        reader.onerror = () => { this.toast('Не вдалося прочитати файл', 'error'); input.value = ''; };
        reader.readAsText(file);
    },

    askSave() {
        if (!(Editor.el.innerText || '').trim()) return this.toast('Тут поки порожньо 😊', 'warning');

        this.showModal('Зберегти роботу', 'Як ти хочеш зберегти свою історію?', [
            { text: 'ЯК ФАЙЛ (HTML)', class: 'bg-neo-blue text-white py-4', action: () => this.download('html') },
            { text: 'ЯК ТЕКСТ (TXT)', class: 'bg-neo-yellow py-4',          action: () => this.download('txt') },
            { text: 'СКАСУВАТИ',      class: 'bg-gray-100 py-3',            action: () => {} }
        ]);
    },

    download(type) {
        const date = new Date().toLocaleDateString('uk-UA').replace(/\./g, '-');
        const name = `казка-${date}.${type}`;
        const safeInner = Sanitizer.sanitize(Editor.el.innerHTML);

        const content = type === 'txt'
            ? (Editor.el.innerText || '')
            : this.getHtmlTemplate(safeInner);

        const blob = new Blob(
            [content],
            { type: type === 'txt' ? 'text/plain;charset=utf-8' : 'text/html;charset=utf-8' }
        );
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href     = url;
        a.download = name;
        document.body.appendChild(a);
        a.click();
        a.remove();

        // FIX #4: даємо браузеру час почати завантаження перш ніж відкликати URL
        setTimeout(() => URL.revokeObjectURL(url), 10_000);

        this.toast('Збережено!', 'success');
    },

    getHtmlTemplate(html) {
        return `<!DOCTYPE html><html lang="uk"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Моя історія</title>
<link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;700;900&display=swap" rel="stylesheet">
<style>
body{background:#FFDE00;font-family:'Nunito',sans-serif;padding:20px;display:flex;justify-content:center;min-height:100vh;align-items:flex-start;background-image:radial-gradient(#000 8%, transparent 8%);background-size:24px 24px;margin:0}
.card{background:white;border:4px solid #000;box-shadow:10px 10px 0 #000;border-radius:30px;padding:40px;max-width:900px;width:100%}
.content{font-size:26px;line-height:1.5;font-weight:400;color:#1a1a1a;word-wrap:break-word}
.content b{font-weight:900}
.footer{margin-top:30px;text-align:right;font-weight:900;opacity:0.35}
</style></head><body><div class="card"><div id="exported-content" class="content">${html}</div><div class="footer">ДРУКАРИК</div></div></body></html>`;
    },

    // ─── modal ───────────────────────────────

    showModal(title, msg, actions) {
        const m = document.getElementById('modal');
        if (m.getAttribute('aria-hidden') !== 'false') this._modalTrigger = document.activeElement;
        Editor.captureSelection();
        document.getElementById('modal-title').textContent = title;
        document.getElementById('modal-msg').textContent   = msg;

        const container = document.getElementById('modal-actions');
        container.innerHTML = '';

        actions.forEach(a => {
            const b   = document.createElement('button');
            b.type      = 'button';
            b.className = `neo-btn uppercase font-black text-base sm:text-lg ${a.class}`;
            b.textContent = a.text;
            b.onclick = () => { this.hideModal(); a.action(); };
            container.appendChild(b);
        });

        m.classList.remove('hidden');
        m.classList.add('flex');

        // FIX #6: захоплення фокусу для клавіатурних користувачів
        m.setAttribute('aria-hidden', 'false');
        const firstBtn = container.querySelector('button');
        if (firstBtn) firstBtn.focus();
    },

    hideModal() {
        const m = document.getElementById('modal');
        if (m.getAttribute('aria-hidden') !== 'false') return;
        m.classList.add('hidden');
        m.classList.remove('flex');
        m.setAttribute('aria-hidden', 'true');
        if (this._modalTrigger === Editor.el) Editor.restoreSelectionSafe();
        else this._modalTrigger?.focus();
    },

    // ─── toast ───────────────────────────────

    toast(text, type = 'info') {
        const now = Date.now();
        if (now - this._toastLock < 600) return;
        this._toastLock = now;

        const container = document.getElementById('toasts');
        while (container.children.length >= Config.toastLimit) {
            container.removeChild(container.firstChild);
        }

        const t = document.createElement('div');
        const colors = {
            info:    'bg-neo-dark text-white',
            success: 'bg-neo-green text-black',
            warning: 'bg-neo-yellow text-black',
            error:   'bg-neo-red text-white'
        };
        t.className = `${colors[type] || colors.info} border-4 border-black px-8 py-3 rounded-full font-black text-lg shadow-neo toast-anim`;
        t.setAttribute('role', 'status');
        t.setAttribute('aria-live', 'polite');
        t.textContent = text;
        container.appendChild(t);
        setTimeout(() => t.remove(), 2400);
    }
};

// ─────────────────────────────────────────────
//  GLOBAL EXPOSURE
// ─────────────────────────────────────────────
window.Config    = Config;
window.Sanitizer = Sanitizer;
window.Editor    = Editor;
window.App       = App;

window.addEventListener('DOMContentLoaded', () => App.init());
