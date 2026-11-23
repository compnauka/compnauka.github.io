'use strict';

/* =========================================================
   KEYBOARD LAYOUT DATA
   Справжня 60%-клавіатура (ANSI): кожен ряд = 15 одиниць (u).
   Українська розкладка — «Українська (розширена)» Windows.
   Рядок мітки: 1 символ = літера; 2 символи = [основний, із Shift].
   ========================================================= */
const K = (code, en, uk, w = 1) => ({ code, en, uk, w, func: false });
const F = (code, w, label, display) => ({ code, w, label, display: display || label, func: true });

const ROWS = [
    [
        K('Backquote', '`~', "'₴"),
        K('Digit1', '1!', '1!'), K('Digit2', '2@', '2"'), K('Digit3', '3#', '3№'),
        K('Digit4', '4$', '4;'), K('Digit5', '5%', '5%'), K('Digit6', '6^', '6:'),
        K('Digit7', '7&', '7?'), K('Digit8', '8*', '8*'), K('Digit9', '9(', '9('),
        K('Digit0', '0)', '0)'), K('Minus', '-_', '-_'), K('Equal', '=+', '=+'),
        F('Backspace', 2, 'Backspace', '← Backspace')
    ],
    [
        F('Tab', 1.5, 'Tab', 'Tab ↹'),
        K('KeyQ', 'Q', 'Й'), K('KeyW', 'W', 'Ц'), K('KeyE', 'E', 'У'), K('KeyR', 'R', 'К'),
        K('KeyT', 'T', 'Е'), K('KeyY', 'Y', 'Н'), K('KeyU', 'U', 'Г'), K('KeyI', 'I', 'Ш'),
        K('KeyO', 'O', 'Щ'), K('KeyP', 'P', 'З'),
        K('BracketLeft', '[{', 'Х'), K('BracketRight', ']}', 'Ї'),
        K('Backslash', '\\|', 'Ґ', 1.5)
    ],
    [
        F('CapsLock', 1.75, 'Caps Lock'),
        K('KeyA', 'A', 'Ф'), K('KeyS', 'S', 'І'), K('KeyD', 'D', 'В'), K('KeyF', 'F', 'А'),
        K('KeyG', 'G', 'П'), K('KeyH', 'H', 'Р'), K('KeyJ', 'J', 'О'), K('KeyK', 'K', 'Л'),
        K('KeyL', 'L', 'Д'),
        K('Semicolon', ';:', 'Ж'), K('Quote', '\'"', 'Є'),
        F('Enter', 2.25, 'Enter', 'Enter ↵')
    ],
    [
        F('ShiftLeft', 2.25, 'Shift', '⇧ Shift'),
        K('KeyZ', 'Z', 'Я'), K('KeyX', 'X', 'Ч'), K('KeyC', 'C', 'С'), K('KeyV', 'V', 'М'),
        K('KeyB', 'B', 'И'), K('KeyN', 'N', 'Т'), K('KeyM', 'M', 'Ь'),
        K('Comma', ',<', 'Б'), K('Period', '.>', 'Ю'), K('Slash', '/?', '.,'),
        F('ShiftRight', 2.75, 'Shift', 'Shift ⇧')
    ],
    [
        F('ControlLeft', 1.25, 'Ctrl'), F('MetaLeft', 1.25, 'Win'), F('AltLeft', 1.25, 'Alt'),
        F('Space', 6.25, 'Space', ''),
        F('AltRight', 1.25, 'Alt'), F('MetaRight', 1.25, 'Win'),
        F('ContextMenu', 1.25, 'Menu', '☰'), F('ControlRight', 1.25, 'Ctrl')
    ]
];
const ALL_KEYS = ROWS.flat();
const KEY_BY_CODE = Object.fromEntries(ALL_KEYS.map(k => [k.code, k]));

const LANG_NAMES = { uk: 'Українська', en: 'English' };
const DIFF_NAMES = { easy: 'Легко', medium: 'Середньо', hard: 'Складно' };

/* Частка клавіш кожної категорії, які вже стоять на місці на старті.
   null — категорія не збирається (усі клавіші вже на місці). */
const PREFILL = {
    easy:   { letter: 0.35, digit: null, symbol: null, func: null },
    medium: { letter: 0.6,  digit: 0.4,  symbol: 0.5,  func: 0.45 },
    hard:   { letter: 0.4,  digit: 0.2,  symbol: 0.25, func: 0.3 }
};

/* Мітки клавіші для вибраної мови */
function labels(key, lang) {
    if (key.func) return { func: key.display };
    const s = [...key[lang]];
    return s.length === 1 ? { letter: s[0] } : { main: s[0], shift: s[1] };
}

function category(key, lang) {
    if (key.func) return 'func';
    if (key.code.startsWith('Digit')) return 'digit';
    return [...key[lang]].length === 1 ? 'letter' : 'symbol';
}

/* Ідентифікатор «що це за клавіша»: дві Shift (Ctrl, Alt, Win) взаємозамінні */
function matchId(key) {
    return key.func ? 'func:' + key.label : key.code;
}

/* =========================================================
   THEMES
   ========================================================= */
const THEMES = [
    { bg: '#e0f2fe', accent: '#0891b2', shadow: '#0284c7', board: '#cffafe', boardBorder: '#22d3ee' },
    { bg: '#f0fdf4', accent: '#16a34a', shadow: '#15803d', board: '#dcfce7', boardBorder: '#4ade80' },
    { bg: '#fdf4ff', accent: '#9333ea', shadow: '#7e22ce', board: '#f3e8ff', boardBorder: '#c084fc' },
    { bg: '#fff7ed', accent: '#ea580c', shadow: '#c2410c', board: '#ffedd5', boardBorder: '#fb923c' },
    { bg: '#fff1f2', accent: '#e11d48', shadow: '#be123c', board: '#ffe4e6', boardBorder: '#fb7185' }
];

function applyTheme(t) {
    const r = document.documentElement.style;
    r.setProperty('--bg', t.bg);
    r.setProperty('--accent', t.accent);
    r.setProperty('--accent-shadow', t.shadow);
    r.setProperty('--board-bg', t.board);
    r.setProperty('--board-border', t.boardBorder);
    document.body.style.backgroundImage = `radial-gradient(${t.boardBorder} 1.5px, transparent 1.5px)`;
}

/* =========================================================
   SETTINGS (localStorage)
   ========================================================= */
const STORE_KEY = 'keyPuzzle.settings';
const settings = Object.assign({ lang: 'uk', sound: true, diff: 'easy' }, (() => {
    try { return JSON.parse(localStorage.getItem(STORE_KEY)) || {}; } catch { return {}; }
})());
if (!LANG_NAMES[settings.lang]) settings.lang = 'uk';
function saveSettings() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(settings)); } catch { /* приватний режим */ }
}

/* =========================================================
   GAME STATE
   ========================================================= */
const game = {
    active: false,
    lang: settings.lang,
    diff: settings.diff,
    slots: new Map(),   // code → { key, el, filled }
    pieces: [],         // { key, el, x, y, hx, hy, rot }
    total: 0,
    placed: 0,
    mistakes: 0,
    hints: 0,
    startedAt: 0,
    selected: null,
    round: 0          // номер гри: відкладені таймери старої гри нічого не роблять
};

let U = 52, G = 6;      // розмір 1u клавіші та проміжок, px

/* =========================================================
   AUDIO ENGINE
   ========================================================= */
let AC = null;
function ac() {
    if (!AC) {
        const Ctx = window.AudioContext || window.webkitAudioContext;
        if (!Ctx) return null;
        AC = new Ctx();
    }
    if (AC.state === 'suspended') AC.resume();
    return AC;
}

function tone(freq, type, dur, vol = 0.12, attack = 0.01, release = null, vibratoHz = 0, vibratoAmt = 0, startTime = null) {
    const t0 = startTime ?? AC.currentTime;
    const rel = release ?? dur;
    const osc = AC.createOscillator();
    const gain = AC.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (vibratoHz > 0) {
        const lfo = AC.createOscillator();
        const lfoGain = AC.createGain();
        lfo.frequency.value = vibratoHz;
        lfoGain.gain.value = vibratoAmt;
        lfo.connect(lfoGain);
        lfoGain.connect(osc.frequency);
        lfo.start(t0);
        lfo.stop(t0 + dur);
    }
    gain.gain.setValueAtTime(0, t0);
    gain.gain.linearRampToValueAtTime(vol, t0 + attack);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + rel);
    osc.connect(gain);
    gain.connect(AC.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
}

function noise(dur, vol = 0.08, filterFreq = 2000, attack = 0.005) {
    const t0 = AC.currentTime;
    const bufSize = Math.floor(AC.sampleRate * dur);
    const buffer = AC.createBuffer(1, bufSize, AC.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1;
    const src = AC.createBufferSource();
    const filter = AC.createBiquadFilter();
    const gain = AC.createGain();
    src.buffer = buffer;
    filter.type = 'bandpass';
    filter.frequency.value = filterFreq;
    filter.Q.value = 0.8;
    gain.gain.setValueAtTime(0, t0);
    gain.gain.linearRampToValueAtTime(vol, t0 + attack);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(filter);
    filter.connect(gain);
    gain.connect(AC.destination);
    src.start(t0);
    src.stop(t0 + dur + 0.05);
}

function sweep(type, f1, f2, dur, vol, filterFreq) {
    const t0 = AC.currentTime;
    const osc = AC.createOscillator();
    const gain = AC.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(f1, t0);
    osc.frequency.exponentialRampToValueAtTime(f2, t0 + dur * 0.7);
    gain.gain.setValueAtTime(0, t0);
    gain.gain.linearRampToValueAtTime(vol, t0 + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    let node = osc;
    if (filterFreq) {
        const filter = AC.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = filterFreq;
        osc.connect(filter);
        node = filter;
    }
    node.connect(gain);
    gain.connect(AC.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
    return osc;
}

/* Кожен звук мовчить, якщо звук вимкнено або AudioContext недоступний */
const Sfx = new Proxy({
    pickup() {
        sweep('sine', 900, 500, 0.12, 0.18);
        noise(0.06, 0.04, 3500);
    },
    hover() {
        tone(1480, 'sine', 0.25, 0.06, 0.005, 0.2);
        tone(2960, 'sine', 0.18, 0.025, 0.005, 0.15);
    },
    success() {
        const t0 = AC.currentTime;
        [523.25, 659.25, 784.0, 1046.5].forEach((f, i) => tone(f, 'sine', 0.45, 0.14, 0.01, 0.4, 5, 4, t0 + i * 0.07));
        tone(2093, 'sine', 0.18, 0.05, 0.005, 0.15, 0, 0, t0 + 0.28);
    },
    wrong() {
        const osc = sweep('sawtooth', 320, 120, 0.3, 0.14, 800);
        const lfo = AC.createOscillator();
        const lfoGain = AC.createGain();
        lfo.frequency.value = 18;
        lfoGain.gain.value = 45;
        lfo.connect(lfoGain);
        lfoGain.connect(osc.frequency);
        lfo.start();
        lfo.stop(AC.currentTime + 0.3);
    },
    snapback() {
        sweep('sine', 200, 80, 0.18, 0.07);
        noise(0.12, 0.025, 600, 0.01);
    },
    victory() {
        const t0 = AC.currentTime;
        [
            { f: 523.25, t: 0.00, d: 0.18 }, { f: 659.25, t: 0.13, d: 0.18 },
            { f: 784.00, t: 0.26, d: 0.18 }, { f: 1046.5, t: 0.39, d: 0.28 },
            { f: 1318.5, t: 0.55, d: 0.18 }, { f: 1568.0, t: 0.67, d: 0.18 },
            { f: 2093.0, t: 0.79, d: 0.55 }
        ].forEach(n => {
            tone(n.f, 'sine', n.d + 0.2, 0.16, 0.01, n.d, 6, 8, t0 + n.t);
            tone(n.f * 1.5, 'sine', n.d + 0.1, 0.05, 0.01, n.d, 0, 0, t0 + n.t);
        });
        [0, 0.26, 0.52, 0.67, 0.79].forEach(o => setTimeout(() => AC && noise(0.07, 0.06, 200), o * 1000));
        [2093, 2637, 3136].forEach((f, i) => tone(f, 'sine', 0.2, 0.04, 0.005, 0.18, 0, 0, t0 + 0.9 + i * 0.04));
    }
}, {
    get(target, name) {
        return () => {
            if (!settings.sound || !ac()) return;
            try { target[name](); } catch { /* звук не критичний */ }
        };
    }
});

/* =========================================================
   DOM HELPERS
   ========================================================= */
const $ = id => document.getElementById(id);

function esc(s) {
    return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function capHTML(key, lang) {
    const l = labels(key, lang);
    if (l.func !== undefined) return `<span class="cap-func">${esc(l.func)}</span>`;
    if (l.letter) return `<span class="cap-letter">${esc(l.letter)}</span>`;
    return `<span class="cap-shift">${esc(l.shift)}</span><span class="cap-main">${esc(l.main)}</span>`;
}

function hintText(key, lang) {
    const l = labels(key, lang);
    return l.func ?? l.letter ?? l.main;
}

/* =========================================================
   MENU
   ========================================================= */
function renderMenu() {
    document.querySelectorAll('.lang-btn').forEach(b => {
        const on = b.dataset.lang === game.lang;
        b.classList.toggle('active', on);
        b.setAttribute('aria-checked', on);
    });
}

function chooseLanguage(lang) {
    game.lang = settings.lang = lang;
    saveSettings();
    renderMenu();
    if (!game.active) buildKeyboard(null); // фонове прев'ю під меню
}

function chooseDifficulty(diff) {
    game.diff = settings.diff = diff;
    saveSettings();
    ac(); // розблоковуємо звук жестом користувача
    hideDiffScreen();
    startNewGame();
}

// Підганяє картку вибору мови/рівня під екран без прокрутки
function fitDiffCard() {
    const el = $('diff-screen');
    const card = el && el.querySelector('.diff-card');
    if (!card || el.style.display === 'none') return;
    card.style.setProperty('--fit', '1');
    const margin = 16;
    const k = Math.min(
        1,
        (window.innerHeight - margin * 2) / card.offsetHeight,
        (window.innerWidth - margin * 2) / card.offsetWidth
    );
    card.style.setProperty('--fit', String(Math.max(0.4, k)));
}

function showDiffScreen() {
    const el = $('diff-screen');
    el.style.display = 'flex';
    fitDiffCard();
    requestAnimationFrame(() => { el.classList.remove('hide'); fitDiffCard(); });
}
window.addEventListener('resize', fitDiffCard);

function hideDiffScreen() {
    const el = $('diff-screen');
    el.classList.add('hide');
    setTimeout(() => { el.style.display = 'none'; }, 320);
}

function goToMenu() {
    game.round++;
    game.active = false;
    $('victory').classList.remove('show');
    $('pieces-layer').innerHTML = '';
    game.pieces = [];
    game.selected = null;
    document.body.classList.remove('has-selection');
    buildKeyboard(null);
    layout();
    showDiffScreen();
}

/* =========================================================
   GAME FLOW
   ========================================================= */
function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

/* Які клавіші треба зібрати: беремо частку з кожної категорії окремо,
   щоб на середньому/складному рівні завжди були і цифри, і спецклавіші. */
function pickPuzzleKeys(diff, lang) {
    const rules = PREFILL[diff];
    const byCat = {};
    ALL_KEYS.forEach(k => {
        if (k.code === 'Space') return; // пробіл очевидний і займає пів екрана
        (byCat[category(k, lang)] ||= []).push(k);
    });
    const result = [];
    Object.entries(byCat).forEach(([cat, keys]) => {
        const prefill = rules[cat];
        if (prefill == null) return;
        const n = Math.max(1, Math.round(keys.length * (1 - prefill)));
        result.push(...shuffle(keys).slice(0, n));
    });
    return result;
}

function startNewGame() {
    game.round++;
    game.active = true;
    game.placed = 0;
    game.mistakes = 0;
    game.hints = 0;
    game.selected = null;
    game.startedAt = Date.now();
    document.body.classList.remove('diff-easy', 'diff-medium', 'diff-hard', 'has-selection');
    document.body.classList.add('diff-' + game.diff);
    applyTheme(THEMES[Math.floor(Math.random() * THEMES.length)]);
    document.querySelectorAll('.star-icon').forEach(s => s.classList.remove('lit'));
    $('victory').classList.remove('show');

    const puzzleKeys = pickPuzzleKeys(game.diff, game.lang);
    game.total = puzzleKeys.length;
    $('total-count').textContent = game.total;
    $('placed-count').textContent = 0;
    $('mode-pill').textContent = `${LANG_NAMES[game.lang]} · ${DIFF_NAMES[game.diff]}`;

    buildKeyboard(new Set(puzzleKeys.map(k => k.code)));
    createPieces(puzzleKeys);
    layout();
}

/* =========================================================
   BUILD KEYBOARD
   emptyCodes = null → уся клавіатура заповнена (прев'ю в меню)
   ========================================================= */
function buildKeyboard(emptyCodes) {
    const kbd = $('keyboard');
    kbd.innerHTML = '';
    game.slots.clear();

    ROWS.forEach(row => {
        const rowEl = document.createElement('div');
        rowEl.className = 'key-row';
        row.forEach(key => {
            const el = document.createElement('div');
            el.className = 'key-cap';
            el.style.setProperty('--w', key.w);
            if (key.func) el.classList.add('func-key');
            if (key.code === 'Space') el.classList.add('space-key');

            if (emptyCodes && emptyCodes.has(key.code)) {
                el.classList.add('key-slot');
                el.dataset.code = key.code;
                el.dataset.hint = hintText(key, game.lang);
                el.setAttribute('aria-label', 'Порожнє місце');
                game.slots.set(key.code, { key, el, filled: false });
            } else {
                el.innerHTML = capHTML(key, game.lang);
            }
            rowEl.appendChild(el);
        });
        kbd.appendChild(rowEl);
    });
}

function fillSlot(slot) {
    const el = slot.el;
    el.classList.remove('key-slot', 'drag-over', 'hint-glow');
    el.removeAttribute('data-hint');
    el.removeAttribute('aria-label');
    el.innerHTML = capHTML(slot.key, game.lang);
    el.classList.add('correct-anim');
    setTimeout(() => el.classList.remove('correct-anim'), 500);
}

/* =========================================================
   PIECES
   ========================================================= */
function createPieces(keys) {
    const layer = $('pieces-layer');
    layer.innerHTML = '';
    game.pieces = keys.map(key => {
        const el = document.createElement('div');
        el.className = 'puzzle-piece' + (key.func ? ' func-key' : '');
        el.style.setProperty('--w', key.w);
        el.innerHTML = capHTML(key, game.lang);
        el.setAttribute('role', 'button');
        el.setAttribute('aria-label', 'Клавіша ' + hintText(key, game.lang));
        const piece = { key, el, x: 0, y: 0, hx: 0, hy: 0, rot: (Math.random() - 0.5) * 12 / key.w };
        el.style.setProperty('--rot', piece.rot + 'deg');
        el.addEventListener('pointerdown', e => onPointerDown(e, piece));
        layer.appendChild(el);
        return piece;
    });
}

function setPiecePos(p, x, y) {
    p.x = x; p.y = y;
    p.el.style.left = x + 'px';
    p.el.style.top = y + 'px';
}

const keyW = w => w * (U + G) - G;

/* =========================================================
   LAYOUT: розмір клавіатури + розкладання фішок без накладань
   ========================================================= */
function playArea() {
    const header = $('header').getBoundingClientRect();
    const pill = $('hint-pill').getBoundingClientRect();
    const top = Math.round(header.bottom + 4);
    const bottom = Math.round((pill.height ? pill.top : window.innerHeight) - 6);
    return { l: 8, t: top, r: window.innerWidth - 8, b: bottom };
}

function setUnit(u) {
    U = u;
    G = Math.max(3, Math.round(u * 0.11));
    const r = document.documentElement.style;
    r.setProperty('--u', U + 'px');
    r.setProperty('--g', G + 'px');
}

const overlaps = (a, b, pad = 0) =>
    a.x < b.x + b.w + pad && a.x + a.w + pad > b.x && a.y < b.y + b.h + pad && a.y + a.h + pad > b.y;

function layout() {
    const area = playArea();
    const main = $('main');
    main.style.top = area.t + 'px';
    main.style.bottom = (window.innerHeight - area.b) + 'px';

    const remaining = game.pieces.filter(p => p.el.isConnected && !p.placing);
    const aw = area.r - area.l, ah = area.b - area.t;
    // Стартовий розмір: у ландшафті клавіатура займає ~70% ширини (фішки — з боків),
    // у портреті — майже всю ширину (фішки — зверху й знизу). Далі зменшуємо, доки фішки не вмістяться.
    const portrait = ah > aw * 0.9;
    const wShare = !remaining.length ? 0.9 : portrait ? 0.97 : 0.7;
    // ширина клавіатури разом із рамкою ≈ 17.2u (15u клавіш + проміжки + відступи корпусу)
    let u = Math.floor(Math.min(64, (aw * wShare) / 17.2, (ah * (remaining.length ? 0.6 : 0.85)) / 6.6));
    u = Math.max(20, u);
    for (; u >= 20; u -= 2) {
        setUnit(u);
        const b = $('keyboard-board').getBoundingClientRect();
        if (b.width > aw || b.height > ah) continue;
        if (packPieces(remaining, area, false)) return;
    }
    packPieces(remaining, area, true);
}

function packPieces(pieces, area, force) {
    if (!pieces.length) return true;
    const b = $('keyboard-board').getBoundingClientRect();
    const margin = Math.max(8, G * 2);
    const board = { x: b.left - margin, y: b.top - margin, w: b.width + margin * 2, h: b.height + margin * 2 };
    const pad = Math.max(6, Math.round(U * 0.2));   // запас під нахил фішки й тінь
    const cap = U * 2.4;
    const bcx = b.left + b.width / 2, bcy = b.top + b.height / 2;
    const placed = [];

    const order = [...pieces].sort((a, c) => c.key.w - a.key.w);
    for (const p of order) {
        const w = keyW(p.key.w), h = U;
        const spanX = area.r - area.l - w, spanY = area.b - area.t - h;
        let best = null, bestScore = -Infinity;
        if (spanX > 0 && spanY > 0) {
            let valid = 0;
            for (let i = 0; i < 900 && valid < 50; i++) {
                const r = { x: area.l + Math.random() * spanX, y: area.t + Math.random() * spanY, w, h };
                if (overlaps(r, board) || placed.some(q => overlaps(r, q, pad))) continue;
                valid++;
                const cx = r.x + w / 2, cy = r.y + h / 2;
                let dmin = cap;
                for (const q of placed) {
                    const dx = Math.max(0, Math.abs(cx - (q.x + q.w / 2)) - (w + q.w) / 2);
                    const dy = Math.max(0, Math.abs(cy - (q.y + q.h / 2)) - (h + q.h) / 2);
                    dmin = Math.min(dmin, Math.hypot(dx, dy));
                }
                // Розсіюємо фішки рівномірно, але тримаємо ближче до клавіатури
                const score = dmin * 1000 - Math.hypot(cx - bcx, (cy - bcy) * 1.6);
                if (score > bestScore) { bestScore = score; best = r; }
            }
        }
        if (!best) {
            if (!force) return false;
            best = {
                x: area.l + Math.random() * Math.max(0, spanX),
                y: area.t + Math.random() * Math.max(0, spanY), w, h
            };
        }
        placed.push(best);
        p.hx = best.x; p.hy = best.y;
    }
    pieces.forEach(p => setPiecePos(p, p.hx, p.hy));
    return true;
}

let resizeTimer = 0;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => { resizeCanvas(); layout(); }, 120);
});

/* =========================================================
   DRAG & DROP (pointer events: миша, тачпад, дотик, стилус)
   Також: тап по фішці → тап по місцю.
   ========================================================= */
let drag = null;

function onPointerDown(e, p) {
    if (e.button > 0 || drag || p.placing) return;
    e.preventDefault();
    p.el.setPointerCapture(e.pointerId);
    drag = { p, id: e.pointerId, sx: e.clientX, sy: e.clientY, ox: e.clientX - p.x, oy: e.clientY - p.y, moved: false, slot: null };
    p.el.addEventListener('pointermove', onPointerMove);
    p.el.addEventListener('pointerup', onPointerUp);
    p.el.addEventListener('pointercancel', onPointerCancel);
}

function onPointerMove(e) {
    if (!drag || e.pointerId !== drag.id) return;
    const { p } = drag;
    if (!drag.moved) {
        if (Math.hypot(e.clientX - drag.sx, e.clientY - drag.sy) < 6) return;
        drag.moved = true;
        selectPiece(null);
        p.el.classList.add('dragging');
        Sfx.pickup();
    }
    const w = keyW(p.key.w);
    const x = Math.min(Math.max(e.clientX - drag.ox, 0), window.innerWidth - w);
    const y = Math.min(Math.max(e.clientY - drag.oy, 0), window.innerHeight - U);
    setPiecePos(p, x, y);

    const slot = slotAt(e.clientX, e.clientY, p);
    if (slot !== drag.slot) {
        drag.slot?.el.classList.remove('drag-over');
        if (slot) { slot.el.classList.add('drag-over'); Sfx.hover(); }
        drag.slot = slot;
    }
}

function endDrag() {
    const { p } = drag;
    p.el.removeEventListener('pointermove', onPointerMove);
    p.el.removeEventListener('pointerup', onPointerUp);
    p.el.removeEventListener('pointercancel', onPointerCancel);
    p.el.classList.remove('dragging');
    drag.slot?.el.classList.remove('drag-over');
    drag = null;
}

function onPointerCancel() {
    if (!drag) return;
    const { p, moved } = drag;
    endDrag();
    if (moved) snapBack(p);
}

function onPointerUp(e) {
    if (!drag || e.pointerId !== drag.id) return;
    const { p, moved } = drag;
    const slot = moved ? slotAt(e.clientX, e.clientY, p) : null;
    endDrag();

    if (!moved) { selectPiece(game.selected === p ? null : p); return; }
    if (slot) { tryPlace(p, slot); return; }

    // Відпустили поза клавіатурою — фішка лишається там, де її поклали
    const area = playArea();
    const b = $('keyboard-board').getBoundingClientRect();
    const r = { x: p.x, y: p.y, w: keyW(p.key.w), h: U };
    const inside = r.x >= area.l && r.y >= area.t && r.x + r.w <= area.r && r.y + r.h <= area.b;
    if (inside && !overlaps(r, { x: b.left, y: b.top, w: b.width, h: b.height })) {
        p.hx = p.x; p.hy = p.y;
        // покладена фішка — зверху над іншими
        $('pieces-layer').appendChild(p.el);
    } else {
        Sfx.snapback();
        snapBack(p);
    }
}

/* Порожнє місце під точкою; якщо мимо — найближче місце в радіусі пів клавіші від центру фішки */
function slotAt(x, y, p) {
    let best = null, bestD = Infinity;
    const cx = p.x + keyW(p.key.w) / 2, cy = p.y + U / 2;
    for (const s of game.slots.values()) {
        if (s.filled) continue;
        const r = s.el.getBoundingClientRect();
        if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) return s;
        const d = Math.hypot(cx - (r.left + r.width / 2), cy - (r.top + r.height / 2));
        if (d < U * 0.5 && d < bestD) { bestD = d; best = s; }
    }
    return best;
}

function tryPlace(p, slot) {
    if (matchId(slot.key) === matchId(p.key)) onCorrect(p, slot);
    else onWrong(p, slot);
}

function onCorrect(p, slot) {
    Sfx.success();
    p.placing = true;
    slot.filled = true; // одразу резервуємо місце, ще до кінця анімації
    if (game.selected === p) selectPiece(null);
    game.placed++;
    $('placed-count').textContent = game.placed;

    const r = slot.el.getBoundingClientRect();
    p.el.classList.add('placing');
    setPiecePos(p, r.left, r.top);
    p.el.style.setProperty('--rot', '0deg');
    const round = game.round;
    setTimeout(() => {
        if (round !== game.round) return;
        fillSlot(slot);
        p.el.remove();
        game.pieces = game.pieces.filter(q => q !== p);
        fireConfetti(r.left + r.width / 2, r.top + r.height / 2, 22);
        if (game.placed >= game.total) setTimeout(() => round === game.round && showVictory(), 550);
    }, 200);
}

function onWrong(p, slot) {
    Sfx.wrong();
    game.mistakes++;
    slot.el.classList.add('wrong-anim');
    setTimeout(() => slot.el.classList.remove('wrong-anim'), 420);
    snapBack(p);
}

function snapBack(p) {
    p.el.classList.add('snap-back');
    setPiecePos(p, p.hx, p.hy);
    setTimeout(() => p.el.classList.remove('snap-back'), 380);
}

/* ---------- вибір фішки тапом ---------- */
function selectPiece(p) {
    game.selected?.el.classList.remove('selected');
    game.selected = p;
    document.body.classList.toggle('has-selection', !!p);
    if (p) { p.el.classList.add('selected'); Sfx.pickup(); }
}

$('keyboard-board').addEventListener('click', e => {
    if (!game.selected) return;
    const el = e.target.closest('.key-slot');
    const slot = el && game.slots.get(el.dataset.code);
    if (slot && !slot.filled) tryPlace(game.selected, slot);
});

document.addEventListener('click', e => {
    if (game.selected && !e.target.closest('.puzzle-piece, .key-slot, #hint-btn')) selectPiece(null);
});

document.addEventListener('keydown', e => {
    if (e.key === 'Escape') selectPiece(null);
});

/* =========================================================
   HINT BUTTON: показує, куди йде вибрана (або випадкова) клавіша
   ========================================================= */
function showHint() {
    if (!game.active) return;
    const left = game.pieces.filter(p => !p.placing);
    if (!left.length) return;
    const p = game.selected && !game.selected.placing ? game.selected : left[Math.floor(Math.random() * left.length)];
    const slot = [...game.slots.values()].find(s => !s.filled && matchId(s.key) === matchId(p.key));
    if (!slot) return;
    game.hints++;
    [p.el, slot.el].forEach(el => {
        el.classList.remove('hint-glow');
        void el.offsetWidth; // перезапуск анімації
        el.classList.add('hint-glow');
        setTimeout(() => el.classList.remove('hint-glow'), 1900);
    });
    Sfx.hover();
}

/* =========================================================
   SOUND TOGGLE
   ========================================================= */
function renderSoundBtn() {
    const btn = $('sound-btn');
    btn.innerHTML = `<i class="fa-solid ${settings.sound ? 'fa-volume-high' : 'fa-volume-xmark'}" aria-hidden="true"></i>`;
    btn.setAttribute('aria-pressed', settings.sound);
    btn.title = settings.sound ? 'Вимкнути звук' : 'Увімкнути звук';
}

function toggleSound() {
    settings.sound = !settings.sound;
    saveSettings();
    renderSoundBtn();
}

/* =========================================================
   VICTORY SCREEN
   ========================================================= */
function showVictory() {
    game.active = false;
    Sfx.victory();
    fireBigConfetti();

    const errors = game.mistakes + game.hints;
    const ratio = errors / Math.max(1, game.total);
    const litCount = errors === 0 ? 3 : ratio <= 0.15 ? 2 : 1;
    document.querySelectorAll('.star-icon').forEach((s, i) => {
        s.classList.remove('lit');
        if (i < litCount) setTimeout(() => s.classList.add('lit'), 300 + i * 150);
    });

    const sec = Math.round((Date.now() - game.startedAt) / 1000);
    const time = `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`;
    $('victory-stats').innerHTML =
        `<div><i class="fa-solid fa-stopwatch"></i> ${time}</div>` +
        `<div><i class="fa-solid fa-xmark"></i> Помилок: ${game.mistakes}</div>` +
        `<div><i class="fa-solid fa-lightbulb"></i> Підказок: ${game.hints}</div>`;

    $('victory').classList.add('show');
}

/* =========================================================
   CONFETTI
   ========================================================= */
const canvas = $('confetti-canvas');
const ctx = canvas.getContext('2d');
let particles = [];
let confettiRunning = false;

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
resizeCanvas();

function fireConfetti(cx, cy, count) {
    const colors = ['#f472b6', '#60a5fa', '#facc15', '#4ade80', '#a78bfa', '#fb923c'];
    for (let i = 0; i < count; i++) {
        particles.push({
            x: cx, y: cy,
            vx: (Math.random() - 0.5) * 14,
            vy: (Math.random() - 0.5) * 14 - 3,
            size: Math.random() * 7 + 3,
            color: colors[Math.floor(Math.random() * colors.length)],
            life: 1,
            decay: Math.random() * 0.025 + 0.015,
            rot: Math.random() * 360,
            rotv: (Math.random() - 0.5) * 10
        });
    }
    if (!confettiRunning) { confettiRunning = true; requestAnimationFrame(animateConfetti); }
}

function fireBigConfetti() {
    fireConfetti(window.innerWidth / 2, window.innerHeight / 2, 200);
}

/* Анімація крутиться лише поки є частинки (не навантажує CPU у спокої) */
function animateConfetti() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx; p.y += p.vy;
        p.vy += 0.35; p.vx *= 0.99;
        p.life -= p.decay; p.rot += p.rotv;
        if (p.life <= 0) { particles.splice(i, 1); continue; }
        ctx.save();
        ctx.globalAlpha = p.life;
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot * Math.PI / 180);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
        ctx.restore();
    }
    if (particles.length) requestAnimationFrame(animateConfetti);
    else confettiRunning = false;
}

/* =========================================================
   INIT
   ========================================================= */
document.querySelectorAll('.lang-btn').forEach(b => b.addEventListener('click', () => chooseLanguage(b.dataset.lang)));
$('hint-btn').addEventListener('click', showHint);
$('sound-btn').addEventListener('click', toggleSound);
$('again-btn').addEventListener('click', startNewGame);
renderMenu();
renderSoundBtn();
buildKeyboard(null);
layout();
// Спільний хедер сайту вставляється асинхронно — перераховуємо розміри після його появи
window.addEventListener('load', layout);
if (document.fonts?.ready) document.fonts.ready.then(layout);
