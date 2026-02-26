/* =========================================================
   KEYBOARD LAYOUT DATA
   ========================================================= */
const KEYBOARD_DATA = [
    [
        { code: 'Backquote',     top: '~',  bottom: '`',  w: 48 },
        { code: 'Digit1',        top: '!',  bottom: '1',  w: 48 },
        { code: 'Digit2',        top: '@',  bottom: '2',  w: 48 },
        { code: 'Digit3',        top: '#',  bottom: '3',  w: 48 },
        { code: 'Digit4',        top: '$',  bottom: '4',  w: 48 },
        { code: 'Digit5',        top: '%',  bottom: '5',  w: 48 },
        { code: 'Digit6',        top: '^',  bottom: '6',  w: 48 },
        { code: 'Digit7',        top: '&',  bottom: '7',  w: 48 },
        { code: 'Digit8',        top: '*',  bottom: '8',  w: 48 },
        { code: 'Digit9',        top: '(',  bottom: '9',  w: 48 },
        { code: 'Digit0',        top: ')',  bottom: '0',  w: 48 },
        { code: 'Minus',         top: '_',  bottom: '-',  w: 48 },
        { code: 'Equal',         top: '+',  bottom: '=',  w: 48 },
        { code: 'Backspace',     label: '←',              w: 88, func: true }
    ],
    [
        { code: 'Tab',           label: 'Tab',            w: 72, func: true },
        { code: 'KeyQ', top: 'Q', bottom: 'Й', w: 48, letter: true },
        { code: 'KeyW', top: 'W', bottom: 'Ц', w: 48, letter: true },
        { code: 'KeyE', top: 'E', bottom: 'У', w: 48, letter: true },
        { code: 'KeyR', top: 'R', bottom: 'К', w: 48, letter: true },
        { code: 'KeyT', top: 'T', bottom: 'Е', w: 48, letter: true },
        { code: 'KeyY', top: 'Y', bottom: 'Н', w: 48, letter: true },
        { code: 'KeyU', top: 'U', bottom: 'Г', w: 48, letter: true },
        { code: 'KeyI', top: 'I', bottom: 'Ш', w: 48, letter: true },
        { code: 'KeyO', top: 'O', bottom: 'Щ', w: 48, letter: true },
        { code: 'KeyP', top: 'P', bottom: 'З', w: 48, letter: true },
        { code: 'BracketLeft',   top: '{',  bottom: 'Х',  w: 48 },
        { code: 'BracketRight',  top: '}',  bottom: 'Ї',  w: 48 },
        { code: 'Backslash',     top: '|',  bottom: '\\', w: 64 }
    ],
    [
        { code: 'CapsLock',      label: 'Caps',           w: 88, func: true },
        { code: 'KeyA', top: 'A', bottom: 'Ф', w: 48, letter: true },
        { code: 'KeyS', top: 'S', bottom: 'І', w: 48, letter: true },
        { code: 'KeyD', top: 'D', bottom: 'В', w: 48, letter: true },
        { code: 'KeyF', top: 'F', bottom: 'А', w: 48, letter: true },
        { code: 'KeyG', top: 'G', bottom: 'П', w: 48, letter: true },
        { code: 'KeyH', top: 'H', bottom: 'Р', w: 48, letter: true },
        { code: 'KeyJ', top: 'J', bottom: 'О', w: 48, letter: true },
        { code: 'KeyK', top: 'K', bottom: 'Л', w: 48, letter: true },
        { code: 'KeyL', top: 'L', bottom: 'Д', w: 48, letter: true },
        { code: 'Semicolon',     top: ':',  bottom: 'Ж',  w: 48 },
        { code: 'Quote',         top: '"',  bottom: 'Є',  w: 48 },
        { code: 'Enter',         label: 'Enter',          w: 100, func: true }
    ],
    [
        { code: 'ShiftLeft',     label: 'Shift',          w: 120, func: true },
        { code: 'KeyZ', top: 'Z', bottom: 'Я', w: 48, letter: true },
        { code: 'KeyX', top: 'X', bottom: 'Ч', w: 48, letter: true },
        { code: 'KeyC', top: 'C', bottom: 'С', w: 48, letter: true },
        { code: 'KeyV', top: 'V', bottom: 'М', w: 48, letter: true },
        { code: 'KeyB', top: 'B', bottom: 'И', w: 48, letter: true },
        { code: 'KeyN', top: 'N', bottom: 'Т', w: 48, letter: true },
        { code: 'KeyM', top: 'M', bottom: 'Ь', w: 48, letter: true },
        { code: 'Comma',         top: '<',  bottom: 'Б',  w: 48 },
        { code: 'Period',        top: '>',  bottom: 'Ю',  w: 48 },
        { code: 'Slash',         top: '?',  bottom: '.',  w: 48 },
        { code: 'ShiftRight',    label: 'Shift',          w: 104, func: true }
    ],
    [
        { code: 'ControlLeft',   label: 'Ctrl',  w: 64,  func: true },
        { code: 'MetaLeft',      label: 'Win',   w: 64,  func: true },
        { code: 'AltLeft',       label: 'Alt',   w: 64,  func: true },
        { code: 'Space',         label: '',      w: 320, func: true, space: true },
        { code: 'AltRight',      label: 'Alt',   w: 64,  func: true },
        { code: 'ControlRight',  label: 'Ctrl',  w: 64,  func: true }
    ]
];

const LETTER_KEYS = KEYBOARD_DATA.flat().filter(k => k.letter);

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

/* =========================================================
   GAME STATE
   ========================================================= */
let currentDifficulty = 'easy';
let placedCount      = 0;
let totalPuzzle      = 0;
let wrongAttempts    = 0;
let placedKeys       = new Set();
let pieceOriginalPos = {};  // code → { x, y }

/* =========================================================
   AUDIO ENGINE
   ========================================================= */
const AC = new (window.AudioContext || window.webkitAudioContext)();

/* --- Low-level helpers --- */

function resume() {
    if (AC.state === 'suspended') AC.resume();
}

/**
 * Play a single oscillator tone with optional vibrato.
 * @param {number} freq       Hz
 * @param {string} type       OscillatorType
 * @param {number} dur        seconds total
 * @param {number} vol        peak gain
 * @param {number} attack     seconds to peak
 * @param {number} release    seconds to silence (from peak onwards)
 * @param {number} vibratoHz  LFO rate (0 = off)
 * @param {number} vibratoAmt LFO depth in Hz
 * @param {number} startTime  AC time offset (default = now)
 */
function tone(freq, type, dur, vol = 0.12, attack = 0.01, release = null, vibratoHz = 0, vibratoAmt = 0, startTime = null) {
    const t0 = startTime ?? AC.currentTime;
    const rel = release ?? dur;

    const osc  = AC.createOscillator();
    const gain = AC.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);

    // Optional vibrato via LFO
    if (vibratoHz > 0) {
        const lfo     = AC.createOscillator();
        const lfoGain = AC.createGain();
        lfo.frequency.value  = vibratoHz;
        lfoGain.gain.value   = vibratoAmt;
        lfo.connect(lfoGain);
        lfoGain.connect(osc.frequency);
        lfo.start(t0);
        lfo.stop(t0 + dur);
    }

    // Envelope
    gain.gain.setValueAtTime(0, t0);
    gain.gain.linearRampToValueAtTime(vol, t0 + attack);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + rel);

    osc.connect(gain);
    gain.connect(AC.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
}

/**
 * Short white-noise burst (for "click" / "swoosh" effects).
 */
function noise(dur, vol = 0.08, filterFreq = 2000, attack = 0.005) {
    const t0      = AC.currentTime;
    const bufSize = AC.sampleRate * dur;
    const buffer  = AC.createBuffer(1, bufSize, AC.sampleRate);
    const data    = buffer.getChannelData(0);
    for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1;

    const src    = AC.createBufferSource();
    const filter = AC.createBiquadFilter();
    const gain   = AC.createGain();

    src.buffer = buffer;
    filter.type            = 'bandpass';
    filter.frequency.value = filterFreq;
    filter.Q.value         = 0.8;

    gain.gain.setValueAtTime(0, t0);
    gain.gain.linearRampToValueAtTime(vol, t0 + attack);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);

    src.connect(filter);
    filter.connect(gain);
    gain.connect(AC.destination);
    src.start(t0);
    src.stop(t0 + dur + 0.05);
}

/* --- Sound library --- */

const Audio = {

    /**
     * PICKUP — м'який "pop" коли беремо клавішу
     * Короткий синусоїдний спалах із швидким спадом
     */
    pickup() {
        resume();
        // Легкий "тюк" — синус з pitchbend вниз
        const t0 = AC.currentTime;
        const osc  = AC.createOscillator();
        const gain = AC.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(900, t0);
        osc.frequency.exponentialRampToValueAtTime(500, t0 + 0.08);
        gain.gain.setValueAtTime(0, t0);
        gain.gain.linearRampToValueAtTime(0.18, t0 + 0.008);
        gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.12);
        osc.connect(gain);
        gain.connect(AC.destination);
        osc.start(t0);
        osc.stop(t0 + 0.15);

        // Тихий "повітряний" шерех
        noise(0.06, 0.04, 3500, 0.005);
    },

    /**
     * HOVER — тихий "дзінь" коли клавіша нависає над правильним слотом
     * Ніжний металічний дзвін
     */
    hover() {
        resume();
        tone(1480, 'sine', 0.25, 0.06, 0.005, 0.2);        // основний тон
        tone(2960, 'sine', 0.18, 0.025, 0.005, 0.15);       // октава вище — обертон
    },

    /**
     * SUCCESS — веселий мажорний акорд при правильному розміщенні
     * Арпеджіо до-мі-соль + блиск на вершині
     */
    success() {
        resume();
        const t0 = AC.currentTime;
        // Арпеджіо C4 → E4 → G4 → C5
        const notes = [523.25, 659.25, 784.0, 1046.5];
        notes.forEach((f, i) => {
            tone(f, 'sine', 0.45, 0.14, 0.01, 0.4, 5, 4, t0 + i * 0.07);
        });
        // Мерехтливий "sparkle" зверху
        setTimeout(() => {
            tone(2093, 'sine', 0.18, 0.05, 0.005, 0.15, 0, 0);
            noise(0.08, 0.03, 8000, 0.005);
        }, 280);
    },

    /**
     * WRONG — смішне "бойнг" / "вобл" при помилці
     * Спадаючий питч із wobble — не лякає, але помітно
     */
    wrong() {
        resume();
        const t0  = AC.currentTime;
        const osc  = AC.createOscillator();
        const gain = AC.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(320, t0);
        osc.frequency.exponentialRampToValueAtTime(120, t0 + 0.28);

        // Швидкий тремоло ефект
        const lfo     = AC.createOscillator();
        const lfoGain = AC.createGain();
        lfo.frequency.value = 18;
        lfoGain.gain.value  = 45;
        lfo.connect(lfoGain);
        lfoGain.connect(osc.frequency);
        lfo.start(t0); lfo.stop(t0 + 0.3);

        gain.gain.setValueAtTime(0, t0);
        gain.gain.linearRampToValueAtTime(0.14, t0 + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.3);

        // Легкий lowpass фільтр — м'якше
        const filter = AC.createBiquadFilter();
        filter.type            = 'lowpass';
        filter.frequency.value = 800;

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(AC.destination);
        osc.start(t0); osc.stop(t0 + 0.35);
    },

    /**
     * SNAPBACK — тихий "вух" коли клавіша повертається назад
     */
    snapback() {
        resume();
        const t0  = AC.currentTime;
        const osc  = AC.createOscillator();
        const gain = AC.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(200, t0);
        osc.frequency.exponentialRampToValueAtTime(80, t0 + 0.15);

        gain.gain.setValueAtTime(0.07, t0);
        gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.18);

        osc.connect(gain);
        gain.connect(AC.destination);
        osc.start(t0); osc.stop(t0 + 0.2);

        noise(0.12, 0.025, 600, 0.01);
    },

    /**
     * VICTORY — весела мелодія при зборі всієї клавіатури
     * Дитяча фанфара: C-E-G-C-E-G-C (з октавним стрибком)
     */
    victory() {
        resume();
        const t0 = AC.currentTime;

        // Головна мелодія
        const melody = [
            { f: 523.25, t: 0.00, d: 0.18 },   // C4
            { f: 659.25, t: 0.13, d: 0.18 },   // E4
            { f: 784.00, t: 0.26, d: 0.18 },   // G4
            { f: 1046.5, t: 0.39, d: 0.28 },   // C5
            { f: 1318.5, t: 0.55, d: 0.18 },   // E5
            { f: 1568.0, t: 0.67, d: 0.18 },   // G5
            { f: 2093.0, t: 0.79, d: 0.55 },   // C6 — фінал
        ];
        melody.forEach(n => {
            tone(n.f, 'sine', n.d + 0.2, 0.16, 0.01, n.d, 6, 8, t0 + n.t);
            // Гармонійний шар трохи тихіше
            tone(n.f * 1.5, 'sine', n.d + 0.1, 0.05, 0.01, n.d, 0, 0, t0 + n.t);
        });

        // Барабанний ритм підкладки (noise bursts)
        [0, 0.26, 0.52, 0.67, 0.79].forEach(offset => {
            setTimeout(() => noise(0.07, 0.06, 200, 0.005), offset * 1000);
        });

        // Фінальний sparkle
        setTimeout(() => {
            noise(0.3, 0.04, 9000, 0.01);
            [2093, 2637, 3136].forEach((f, i) =>
                setTimeout(() => tone(f, 'sine', 0.2, 0.04, 0.005, 0.18), i * 40)
            );
        }, 900);
    }
};

/* =========================================================
   THEME
   ========================================================= */
function applyTheme(t) {
    const r = document.documentElement.style;
    r.setProperty('--bg',            t.bg);
    r.setProperty('--accent',        t.accent);
    r.setProperty('--accent-shadow', t.shadow);
    r.setProperty('--board-bg',      t.board);
    r.setProperty('--board-border',  t.boardBorder);
    document.body.style.backgroundImage =
        `radial-gradient(${t.boardBorder} 1.5px, transparent 1.5px)`;
}

function randomTheme() {
    return THEMES[Math.floor(Math.random() * THEMES.length)];
}

/* =========================================================
   DIFFICULTY SELECTION
   ========================================================= */
function chooseDifficulty(diff) {
    currentDifficulty = diff;
    hideDiffScreen();
    startNewGame();
}

function showDiffScreen() {
    const el = document.getElementById('diff-screen');
    el.style.display = 'flex';
    requestAnimationFrame(() => el.classList.remove('hide'));
}

function hideDiffScreen() {
    const el = document.getElementById('diff-screen');
    el.classList.add('hide');
    setTimeout(() => { el.style.display = 'none'; }, 320);
}

function goToMenu() {
    document.getElementById('victory').classList.remove('show');
    document.getElementById('pieces-layer').innerHTML = '';
    showDiffScreen();
}

/* =========================================================
   GAME FLOW
   ========================================================= */
function startNewGame() {
    placedCount      = 0;
    wrongAttempts    = 0;
    placedKeys       = new Set();
    pieceOriginalPos = {};

    document.body.className = 'diff-' + currentDifficulty;
    applyTheme(randomTheme());

    const numHints     = 7 + Math.floor(Math.random() * 5);
    const shuffled     = shuffle(LETTER_KEYS);
    const preplacedSet = new Set(shuffled.slice(0, numHints).map(k => k.code));
    const puzzlePieces = shuffled.slice(numHints);

    totalPuzzle = puzzlePieces.length;
    document.getElementById('total-count').textContent  = totalPuzzle;
    document.getElementById('placed-count').textContent = 0;

    buildKeyboard(preplacedSet);
    setTimeout(() => scatterPieces(puzzlePieces), 60);
}

/* =========================================================
   BUILD KEYBOARD
   ========================================================= */
function buildKeyboard(preplacedSet) {
    const kbd = document.getElementById('keyboard');
    kbd.innerHTML = '';

    KEYBOARD_DATA.forEach(row => {
        const rowEl = document.createElement('div');
        rowEl.className = 'key-row';

        row.forEach(key => {
            const el = document.createElement('div');
            el.id          = 'key-' + key.code;
            el.style.width = key.w + 'px';
            el.className   = 'key-cap';

            if (key.func) {
                el.classList.add('func-key');
                if (!key.space) el.textContent = key.label;
            } else if (key.letter) {
                if (preplacedSet.has(key.code)) {
                    el.innerHTML = keyLabelHTML(key.top, key.bottom);
                    placedKeys.add(key.code);
                } else {
                    el.classList.add('key-slot');
                    el.dataset.code       = key.code;
                    el.dataset.hintBottom = key.bottom;
                    el.dataset.hintTop    = key.top;
                }
            } else {
                el.innerHTML = keyLabelHTML(key.top, key.bottom);
            }

            rowEl.appendChild(el);
        });

        kbd.appendChild(rowEl);
    });
}

function keyLabelHTML(top, bottom) {
    return `<span class="key-label-top">${top}</span><span class="key-label-bottom">${bottom}</span>`;
}

/* =========================================================
   SCATTER PIECES
   ========================================================= */
function scatterPieces(pieces) {
    const layer  = document.getElementById('pieces-layer');
    layer.innerHTML = '';

    const board  = document.getElementById('keyboard-board').getBoundingClientRect();
    const margin = 65;
    const W = window.innerWidth;
    const H = window.innerHeight;
    const S = 58;

    const kx1 = board.left   - margin;
    const kx2 = board.right  + margin;
    const ky1 = board.top    - margin;
    const ky2 = board.bottom + margin;

    const allZones = [
        { x1: 60,       x2: W - 60 - S, y1: 70,      y2: ky1 - S - 8  },
        { x1: 60,       x2: W - 60 - S, y1: ky2 + 8, y2: H - 70 - S   },
        { x1: 18,       x2: kx1 - S - 8, y1: ky1,    y2: ky2 - S      },
        { x1: kx2 + 8,  x2: W - 18 - S, y1: ky1,     y2: ky2 - S      }
    ];
    const zones = allZones.filter(z => z.x2 > z.x1 + 10 && z.y2 > z.y1 + 10);

    pieces.forEach((key, i) => {
        const el = document.createElement('div');
        el.className    = 'puzzle-piece';
        el.dataset.code = key.code;
        el.id           = 'piece-' + key.code;
        el.innerHTML    = `<span class="piece-top">${key.top}</span><span class="piece-bottom">${key.bottom}</span>`;

        let x, y;
        if (zones.length > 0) {
            const zone = zones[i % zones.length];
            x = zone.x1 + Math.random() * (zone.x2 - zone.x1);
            y = zone.y1 + Math.random() * (zone.y2 - zone.y1);
        } else {
            x = 20 + Math.random() * (W - 80);
            y = 20 + Math.random() * (H * 0.28);
        }

        el.style.left = x + 'px';
        el.style.top  = y + 'px';
        pieceOriginalPos[key.code] = { x, y };

        const rot = (Math.random() - 0.5) * 14;
        el.style.transform = `rotate(${rot}deg)`;
        el.dataset.rot = rot;

        layer.appendChild(el);
        setupDraggable(el);
    });
}

/* =========================================================
   DRAG & DROP
   ========================================================= */
let activeDrag    = null;
let currentSlot   = null;
let lastHoverSlot = null;   // для hover-звуку (щоб не дзвеніло кожен кадр)

function setupDraggable(el) {
    el.addEventListener('mousedown', onDragStart);
    el.addEventListener('touchstart', onDragStart, { passive: false });
}

function onDragStart(e) {
    resume();
    e.preventDefault();

    const el     = e.currentTarget;
    const rect   = el.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    Audio.pickup();                     // 🔊 звук підйому

    el.style.zIndex = 1000;
    el.classList.add('dragging');

    activeDrag    = { el, code: el.dataset.code, offsetX: clientX - rect.left, offsetY: clientY - rect.top };
    lastHoverSlot = null;

    document.addEventListener('mousemove', onDragMove);
    document.addEventListener('mouseup',   onDragEnd);
    document.addEventListener('touchmove', onDragMove, { passive: false });
    document.addEventListener('touchend',  onDragEnd);
}

function onDragMove(e) {
    if (!activeDrag) return;
    e.preventDefault();

    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const { el, offsetX, offsetY } = activeDrag;

    el.style.left = (clientX - offsetX) + 'px';
    el.style.top  = (clientY - offsetY) + 'px';

    el.style.visibility = 'hidden';
    const under = document.elementFromPoint(clientX, clientY);
    el.style.visibility = 'visible';

    const slot = resolveSlot(under);

    // Remove old highlight
    if (currentSlot && currentSlot !== slot) {
        currentSlot.classList.remove('drag-over');
    }

    if (slot && !placedKeys.has(slot.dataset.code)) {
        slot.classList.add('drag-over');
        currentSlot = slot;

        // 🔊 звук при наведенні на слот — тільки раз за слот
        if (slot !== lastHoverSlot) {
            Audio.hover();
            lastHoverSlot = slot;
        }
    } else {
        currentSlot   = null;
        lastHoverSlot = null;
    }
}

function onDragEnd(e) {
    if (!activeDrag) return;

    const clientX = e.changedTouches ? e.changedTouches[0].clientX : e.clientX;
    const clientY = e.changedTouches ? e.changedTouches[0].clientY : e.clientY;
    const { el, code } = activeDrag;

    document.removeEventListener('mousemove', onDragMove);
    document.removeEventListener('mouseup',   onDragEnd);
    document.removeEventListener('touchmove', onDragMove);
    document.removeEventListener('touchend',  onDragEnd);

    el.classList.remove('dragging');
    if (currentSlot) currentSlot.classList.remove('drag-over');

    el.style.visibility = 'hidden';
    const under = document.elementFromPoint(clientX, clientY);
    el.style.visibility = 'visible';
    const slot = resolveSlot(under);

    if (slot && !placedKeys.has(slot.dataset.code)) {
        if (slot.dataset.code === code) {
            onCorrectPlacement(el, slot, code);
        } else {
            onWrongPlacement(el, slot);
        }
    } else {
        onSnapBack(el, code);
    }

    currentSlot   = null;
    lastHoverSlot = null;
    activeDrag    = null;
}

function resolveSlot(el) {
    if (!el) return null;
    if (el.classList.contains('key-slot')) return el;
    return el.closest?.('.key-slot') || null;
}

/* =========================================================
   PLACEMENT LOGIC
   ========================================================= */
function onCorrectPlacement(pieceEl, slot, code) {
    Audio.success();                    // 🔊 правильно!
    placedKeys.add(code);
    placedCount++;

    const key = LETTER_KEYS.find(k => k.code === code);
    slot.classList.remove('key-slot', 'drag-over');
    slot.innerHTML = keyLabelHTML(key.top, key.bottom);
    slot.removeAttribute('data-hint-bottom');
    slot.removeAttribute('data-hint-top');
    slot.classList.add('correct-anim');

    const r = slot.getBoundingClientRect();
    pieceEl.style.transition = 'left 0.22s ease, top 0.22s ease, opacity 0.22s, transform 0.22s';
    pieceEl.style.left       = (r.left + r.width  / 2 - 26) + 'px';
    pieceEl.style.top        = (r.top  + r.height / 2 - 26) + 'px';
    pieceEl.style.opacity    = '0';
    pieceEl.style.transform  = 'scale(1.35)';
    setTimeout(() => pieceEl.remove(), 240);

    fireConfetti(r.left + r.width / 2, r.top + r.height / 2, 22);

    document.getElementById('placed-count').textContent = placedCount;

    if (placedCount >= totalPuzzle) {
        setTimeout(showVictory, 650);
    }
}

function onWrongPlacement(pieceEl, slot) {
    Audio.wrong();                      // 🔊 помилка
    wrongAttempts++;
    slot.classList.add('wrong-anim');
    setTimeout(() => slot.classList.remove('wrong-anim'), 420);
    snapBack(pieceEl, pieceEl.dataset.code);
}

function onSnapBack(el, code) {
    Audio.snapback();                   // 🔊 повернення назад
    snapBack(el, code);
}

function snapBack(el, code) {
    const orig = pieceOriginalPos[code];
    if (!orig) return;
    const rot = parseFloat(el.dataset.rot || 0);
    el.classList.add('snap-back');
    el.style.left      = orig.x + 'px';
    el.style.top       = orig.y + 'px';
    el.style.transform = `rotate(${rot}deg)`;
    el.style.zIndex    = 25;
    setTimeout(() => el.classList.remove('snap-back'), 380);
}

/* =========================================================
   VICTORY SCREEN
   ========================================================= */
function showVictory() {
    Audio.victory();                    // 🔊 перемога!
    fireBigConfetti();

    const litCount = wrongAttempts === 0 ? 3 : wrongAttempts < 5 ? 2 : 1;
    document.querySelectorAll('.star-icon').forEach((s, i) => {
        setTimeout(() => { if (i < litCount) s.classList.add('lit'); }, i * 150);
    });

    document.getElementById('victory').classList.add('show');
}

/* =========================================================
   CONFETTI
   ========================================================= */
const canvas = document.getElementById('confetti-canvas');
const ctx    = canvas.getContext('2d');
let particles = [];

function resizeCanvas() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

function fireConfetti(cx, cy, count) {
    const colors = ['#f472b6', '#60a5fa', '#facc15', '#4ade80', '#a78bfa', '#fb923c'];
    for (let i = 0; i < count; i++) {
        particles.push({
            x: cx, y: cy,
            vx: (Math.random() - 0.5) * 14,
            vy: (Math.random() - 0.5) * 14 - 3,
            size:  Math.random() * 7 + 3,
            color: colors[Math.floor(Math.random() * colors.length)],
            life:  1,
            decay: Math.random() * 0.025 + 0.015,
            rot:   Math.random() * 360,
            rotv:  (Math.random() - 0.5) * 10
        });
    }
}

function fireBigConfetti() {
    fireConfetti(window.innerWidth / 2, window.innerHeight / 2, 200);
}

function animateConfetti() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x   += p.vx; p.y  += p.vy;
        p.vy  += 0.35;  p.vx *= 0.99;
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
    requestAnimationFrame(animateConfetti);
}
animateConfetti();

/* =========================================================
   UTILITIES
   ========================================================= */
function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}
