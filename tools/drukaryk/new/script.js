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
        '1': '1.0rem', '2': '1.25rem', '3': '1.5rem', '4': '1.9rem', '5': '2.25rem', '6': '2.6rem', '7': '3.0rem'
    }
};

const Sanitizer = {
    PURIFY_CFG: {
        ALLOWED_TAGS: ['div', 'p', 'br', 'span', 'b', 'i', 'u', 'font'],
        ALLOWED_ATTR: ['style', 'color', 'size', 'face', 'align'],
        KEEP_CONTENT: true
    },
    STYLE_WHITELIST: new Set(['color', 'font-size', 'font-weight', 'font-style', 'text-decoration', 'text-align']),

    sanitize(html) {
        const clean = DOMPurify.sanitize(String(html || ''), this.PURIFY_CFG);
        const tpl = document.createElement('template');
        tpl.innerHTML = clean;

        // sanitize style attr
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

        // normalize <font> → <span style>
        tpl.content.querySelectorAll('font').forEach(f => {
            const span = document.createElement('span');
            const color = f.getAttribute('color');
            const size = f.getAttribute('size');

            if (color) span.style.color = color;
            if (size && Config.fontSizeMap[String(size)]) span.style.fontSize = Config.fontSizeMap[String(size)];

            while (f.firstChild) span.appendChild(f.firstChild);
            f.replaceWith(span);
        });

        return tpl.innerHTML;
    }
};

const Editor = {
    el: null,
    lastRange: null,
    _limitToastShown: false,

    init() {
        this.el = document.getElementById('editor');

        // placeholder state (contenteditable often contains <br>, so CSS :empty won't work)
        this.updatePlaceholderState();

        this.renderColors();
        this.renderEmojis();

        // prefer CSS styles for execCommand (when browser respects it)
        try { document.execCommand('styleWithCSS', false, true); } catch (_) { }

        const capture = () => this.captureSelection();
        ['mouseup', 'keyup', 'touchend'].forEach(ev => this.el.addEventListener(ev, capture));

        this.el.addEventListener('input', () => {
            this.updatePlaceholderState();
            App.updateWordCount();
            App.saveToLocalDebounced();
            this.updateActiveStates();
            this.captureSelection();
        });

        this.el.addEventListener('focus', () => this.updatePlaceholderState());
        this.el.addEventListener('blur', () => this.updatePlaceholderState());

        // character limit + toast throttle
        this.el.addEventListener('keydown', (e) => {
            const nav = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End', 'PageUp', 'PageDown', 'Tab'];
            const len = (this.el.textContent || '').length;

            if (len >= Config.maxChars && !nav.includes(e.key) && !e.ctrlKey && !e.metaKey) {
                e.preventDefault();
                if (!this._limitToastShown) {
                    this._limitToastShown = true;
                    App.toast('Ого! Ти написав забагато!', 'warning');
                    setTimeout(() => this._limitToastShown = false, 3000);
                }
            }
        });

        document.addEventListener('selectionchange', () => this.updateActiveStates());
        this.el.addEventListener('paste', e => {
            e.preventDefault();
            const text = (e.clipboardData || window.clipboardData).getData('text/plain');
            if (!text) return;

            const len = (this.el.textContent || '').length;
            const allowed = Config.maxChars - len;
            if (allowed <= 0) { App.toast('Ого! Ти написав забагато!', 'warning'); return; }

            document.execCommand('insertText', false, text.slice(0, allowed));
            this.captureSelection();
            App.updateWordCount();
            App.saveToLocalDebounced();
        });
    },

    updatePlaceholderState() {
        if (!this.el) return;
        const empty = ((this.el.textContent || '').trim().length === 0);
        this.el.classList.toggle('is-empty', empty);
    },

    // ---- selection validation ----
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
        this.el.focus();
        const sel = window.getSelection();
        if (!sel) return;

        // if lastRange exists but moved outside, drop it
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

        // fallback caret end
        const r = document.createRange();
        r.selectNodeContents(this.el);
        r.collapse(false);
        sel.removeAllRanges();
        sel.addRange(r);
        this.lastRange = r.cloneRange();
    },

    requireSelectionOrHint() {
        const sel = window.getSelection();
        if (!sel || !sel.rangeCount) { App.toast('Клікни в поле тексту 😊', 'info'); return false; }
        const r = sel.getRangeAt(0);
        if (!this._rangeInsideEditor(r)) { App.toast('Клікни в поле тексту 😊', 'info'); return false; }
        if (sel.isCollapsed) { App.toast('Спочатку виділи слово 😊', 'info'); return false; }
        return true;
    },

    // ✅ robust markers: 0x0 + ZWSP
    withSelectionMarkers(fn) {
        const sel = window.getSelection();
        if (!sel || !sel.rangeCount) return fn();

        const range = sel.getRangeAt(0);
        if (!this._rangeInsideEditor(range)) return fn();

        const start = document.createElement('span');
        const end = document.createElement('span');
        start.setAttribute('data-sel', 'start');
        end.setAttribute('data-sel', 'end');
        start.style.cssText = end.style.cssText = 'display:inline-block;width:0;height:0;overflow:hidden;line-height:0;';
        start.appendChild(document.createTextNode('\u200B'));
        end.appendChild(document.createTextNode('\u200B'));

        // insert end first, then start
        const rEnd = range.cloneRange(); rEnd.collapse(false); rEnd.insertNode(end);
        const rStart = range.cloneRange(); rStart.collapse(true); rStart.insertNode(start);

        // set selection between markers
        const between = document.createRange();
        between.setStartAfter(start);
        between.setEndBefore(end);
        sel.removeAllRanges();
        sel.addRange(between);

        try {
            fn();
        } finally {
            // restore selection
            const restored = document.createRange();
            restored.setStartAfter(start);
            restored.setEndBefore(end);
            sel.removeAllRanges();
            sel.addRange(restored);
            this.lastRange = restored.cloneRange();

            start.remove();
            end.remove();
        }
    },

    exec(cmd, val = null) {
        // undo/redo do not require selection
        if (cmd === 'undo' || cmd === 'redo') {
            this.el.focus();
            document.execCommand(cmd, false, null);
            this.updateActiveStates();
            App.saveToLocalDebounced();
            this.captureSelection();
            return;
        }

        const isFormatting = ['bold', 'italic', 'underline', 'foreColor', 'fontSize'].includes(cmd);

        this.restoreSelectionSafe();

        // Ensure selection is inside editor for any formatting
        const sel = window.getSelection();
        if (isFormatting) {
            if (!this.requireSelectionOrHint()) return;
            this.withSelectionMarkers(() => document.execCommand(cmd, false, val));
        } else {
            // for insertText etc.
            if (!sel || !sel.rangeCount || !this._rangeInsideEditor(sel.getRangeAt(0))) {
                App.toast('Клікни в поле тексту 😊', 'info');
                return;
            }
            document.execCommand(cmd, false, val);
            this.captureSelection();
        }

        this.updateActiveStates();
        App.saveToLocalDebounced();
    },

    // ✅ key fix: normalizeFonts INSIDE markers so selection doesn't jump
    setSize(size) {
        this.restoreSelectionSafe();
        if (!this.requireSelectionOrHint()) return;

        this.withSelectionMarkers(() => {
            document.execCommand('fontSize', false, size);
            this.normalizeFonts(); // ← потрібно тут, бо Sanitizer не чіпає живий DOM
        });

        this.updateActiveStates();
        App.saveToLocalDebounced();
    },

    normalizeFonts() {
        // convert <font size/color> → <span style="...">
        this.el.querySelectorAll('font').forEach(f => {
            const span = document.createElement('span');
            const color = f.getAttribute('color');
            const size = f.getAttribute('size');

            if (color) span.style.color = color;
            if (size && Config.fontSizeMap[String(size)]) span.style.fontSize = Config.fontSizeMap[String(size)];

            while (f.firstChild) span.appendChild(f.firstChild);
            f.replaceWith(span);
        });
    },

    insertEmoji(emoji) {
        this.restoreSelectionSafe();
        const sel = window.getSelection();
        if (!sel || !sel.rangeCount || !this._rangeInsideEditor(sel.getRangeAt(0))) {
            App.toast('Клікни в поле тексту 😊', 'info');
            return;
        }
        document.execCommand('insertText', false, emoji);
        this.captureSelection();
        App.updateWordCount();
        App.saveToLocalDebounced();
    },

    updateActiveStates() {
        const sel = window.getSelection();
        if (!sel || !sel.rangeCount) return;
        const r = sel.getRangeAt(0);
        if (!this._rangeInsideEditor(r)) return;

        ['bold', 'italic', 'underline'].forEach(cmd => {
            const btn = document.getElementById(`cmd-${cmd}`);
            if (btn) btn.classList.toggle('active', document.queryCommandState(cmd));
        });

        const currentSize = document.queryCommandValue('fontSize');
        ['3', '5', '7'].forEach(s => {
            const btn = document.getElementById(`sz-${s}`);
            if (btn) btn.classList.toggle('active', String(currentSize) === s);
        });
    },

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

            btn.onmousedown = e => e.preventDefault();
            btn.onclick = () => {
                this.restoreSelectionSafe();
                if (!this.requireSelectionOrHint()) return;

                this.withSelectionMarkers(() => document.execCommand('foreColor', false, color.hex));

                palette.querySelectorAll('.color-swatch').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                this.updateActiveStates();
                App.saveToLocalDebounced();
            };

            palette.appendChild(btn);
        });
    },

    renderEmojis() {
        const container = document.getElementById('emojis');
        container.innerHTML = '';

        [...Config.emojis].sort(() => 0.5 - Math.random()).slice(0, 10).forEach(emoji => {
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
        window.addEventListener('keydown', e => { if (e.key === 'Escape') this.hideModal(); });
    },

    bindFileInput() {
        const input = document.getElementById('file-input');
        input.addEventListener('change', (e) => this.loadFile(e));
    },

    bindModalBackdrop() {
        const modal = document.getElementById('modal');
        modal.addEventListener('mousedown', (e) => {
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
        document.getElementById('theme-icon').className = isDark ? 'fas fa-sun text-lg sm:text-xl' : 'fas fa-moon text-lg sm:text-xl';
    },

    updateWordCount() {
        const text = (Editor.el.innerText || '').trim();
        const count = text ? text.split(/\s+/).filter(Boolean).length : 0;
        document.getElementById('word-count').textContent = count;
    },

    saveToLocalDebounced() {
        clearTimeout(this._saveTimer);
        this._saveTimer = setTimeout(() => {
            const raw = Editor.el.innerHTML;
            const safe = Sanitizer.sanitize(raw);
            if (safe === this._lastSaved) return;
            this._lastSaved = safe;
            try {
                localStorage.setItem(Config.storageKey, safe);
            } catch (err) {
                App.toast('Не вдалось зберегти автоматично', 'warning');
            }
        }, 700);
    },

    loadFromLocal() {
        let saved;
        try { saved = localStorage.getItem(Config.storageKey); } catch (_) { saved = null; }
        if (saved) {
            Editor.el.innerHTML = Sanitizer.sanitize(saved);
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
            { text: 'НІ, ЗАЛИШИТИ', class: 'bg-gray-200 py-4', action: () => { } }
        ]);
    },

    loadFile(event) {
        const input = event.target;
        const file = input.files && input.files[0];
        if (!file) return;
        if (file.size > 500_000) {
            this.toast('Файл надто великий (макс. 500 КБ)', 'error');
            input.value = '';
            return;
        }
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                let content = String(e.target.result || '');

                if (file.name.toLowerCase().endsWith('.html')) {
                    const doc = new DOMParser().parseFromString(content, 'text/html');
                    content = doc.getElementById('exported-content')?.innerHTML || doc.body?.innerHTML || content;
                    Editor.el.innerHTML = Sanitizer.sanitize(content);
                } else {
                    Editor.el.innerText = content;
                }

                Editor.normalizeFonts();
                Editor.lastRange = null;
                Editor.updatePlaceholderState();

                this.updateWordCount();
                this.saveToLocalDebounced();
                this.toast('Відкрито!', 'success');

                // reset
                input.value = '';
                Editor.el.focus();
            } catch (err) {
                this.toast('Помилка файлу', 'error');
                input.value = '';
            }
        };
        reader.readAsText(file);
    },

    askSave() {
        if (!(Editor.el.innerText || '').trim()) return this.toast('Тут поки порожньо 😊', 'warning');

        this.showModal('Зберегти роботу', 'Як ти хочеш зберегти свою історію?', [
            { text: 'ЯК ФАЙЛ (HTML)', class: 'bg-neo-blue text-white py-4', action: () => this.download('html') },
            { text: 'ЯК ТЕКСТ (TXT)', class: 'bg-neo-yellow py-4', action: () => this.download('txt') },
            { text: 'СКАСУВАТИ', class: 'bg-gray-100 py-3', action: () => { } }
        ]);
    },

    download(type) {
        const date = new Date().toLocaleDateString('uk-UA').replace(/\./g, '-');
        const name = `казка-${date}.${type}`;
        const safeInner = Sanitizer.sanitize(Editor.el.innerHTML);

        const content = type === 'txt'
            ? (Editor.el.innerText || '')
            : this.getHtmlTemplate(safeInner);

        const blob = new Blob([content], { type: type === 'txt' ? 'text/plain;charset=utf-8' : 'text/html;charset=utf-8' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = name;
        document.body.appendChild(a);
        a.click();
        a.remove();

        URL.revokeObjectURL(url);
        this.toast('Збережено!', 'success');
    },

    getHtmlTemplate(html) {
        return `<!DOCTYPE html><html lang="uk"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Моя історія</title>
<link href="https://fonts.googleapis.com/css2?family=Nunito:wght@700;900&display=swap" rel="stylesheet">
<style>
body{background:#FFDE00;font-family:'Nunito',sans-serif;padding:20px;display:flex;justify-content:center;min-height:100vh;align-items:flex-start;background-image:radial-gradient(#000 8%, transparent 8%);background-size:24px 24px;margin:0}
.card{background:white;border:4px solid #000;box-shadow:10px 10px 0 #000;border-radius:30px;padding:40px;max-width:900px;width:100%}
.content{font-size:26px;line-height:1.6;font-weight:700;color:#1a1a1a;word-wrap:break-word}
.content b{font-weight:900}
.footer{margin-top:30px;text-align:right;font-weight:900;opacity:0.35}
</style></head><body><div class="card"><div id="exported-content" class="content">${html}</div><div class="footer">ДРУКАРИК</div></div></body></html>`;
    },

    showModal(title, msg, actions) {
        const m = document.getElementById('modal');
        document.getElementById('modal-title').textContent = title;
        document.getElementById('modal-msg').textContent = msg;

        const container = document.getElementById('modal-actions');
        container.innerHTML = '';

        actions.forEach(a => {
            const b = document.createElement('button');
            b.type = 'button';
            b.className = `neo-btn uppercase font-black text-base sm:text-lg ${a.class}`;
            b.textContent = a.text;
            b.onclick = () => { a.action(); this.hideModal(); };
            container.appendChild(b);
        });

        m.classList.remove('hidden');
        m.classList.add('flex');
    },

    hideModal() {
        const m = document.getElementById('modal');
        m.classList.add('hidden');
        m.classList.remove('flex');
        Editor.el.focus();
    },

    toast(text, type = 'info') {
        const now = Date.now();
        if (now - this._toastLock < 600) return;
        this._toastLock = now;

        const container = document.getElementById('toasts');
        while (container.children.length >= Config.toastLimit) container.removeChild(container.firstChild);

        const t = document.createElement('div');
        const colors = {
            info: 'bg-neo-dark text-white',
            success: 'bg-neo-green text-black',
            warning: 'bg-neo-yellow text-black',
            error: 'bg-neo-red text-white'
        };
        t.className = `${colors[type] || colors.info} border-4 border-black px-8 py-3 rounded-full font-black text-lg shadow-neo toast-anim`;
        t.textContent = text;
        container.appendChild(t);
        setTimeout(() => t.remove(), 2400);
    }
};

// Make objects accessible for inline handlers / debugging
window.Config = Config;
window.Sanitizer = Sanitizer;
window.Editor = Editor;
window.App = App;

window.addEventListener('DOMContentLoaded', () => App.init());
