/* ═══════════════════════════════════════════
   CONSTANTS
═══════════════════════════════════════════ */
const GAME_SEC = 30;
const MAX_LETTERS = 7;
const PTS_FAST = 3, PTS_MED = 2, PTS_DEF = 1;
const T_FAST = 1200, T_MED = 2500;
const STREAK_DIV = 3;
const INIT_DELAY = 800;
const REMOVE_DELAY = 340;
const LOW_TIME = 7;
const FIELD_PLAYING_H = 210;
const FIELD_BASE_H = 160;
const LTR_H = 56;
const MISSED_AT = 0.90;
const URGENT_AT = 0.60;

/* ═══════════════════════════════════════════
   CHAR SETS
═══════════════════════════════════════════ */
const CHARS = {
    ua: {
        beginner: "аоієнтсрвл",
        easy: "абвгдеєжзиіїйклмнопрстуфхцчшщьюя"
    },
    en: {
        beginner: "aeioutnrsl",
        easy: "abcdefghijklmnopqrstuvwxyz"
    }
};

const SPEEDS = {
    slow: { anim: 9000, spawn: 2800 },
    medium: { anim: 5500, spawn: 1600 }
};
const LV_MOD = { beginner: 1.3, easy: 1.0 };
const THEMES = ['candy', 'ocean', 'forest', 'sunset'];
const THEME_N = { candy: 'Цукерковий', ocean: 'Морський', forest: 'Лісовий', sunset: 'Захід сонця' };

/* ═══════════════════════════════════════════
   REAL KEYBOARD LAYOUT (виправлено)
═══════════════════════════════════════════ */
const KB = {
    en: [
        // Ряд 0 — цифри та backspace
        [
            { c: '`', cls: 'kb-spec kb-dim', lbl: '`' },
            { c: '1', cls: 'kb-spec kb-dim', lbl: '1' }, { c: '2', cls: 'kb-spec kb-dim', lbl: '2' },
            { c: '3', cls: 'kb-spec kb-dim', lbl: '3' }, { c: '4', cls: 'kb-spec kb-dim', lbl: '4' },
            { c: '5', cls: 'kb-spec kb-dim', lbl: '5' }, { c: '6', cls: 'kb-spec kb-dim', lbl: '6' },
            { c: '7', cls: 'kb-spec kb-dim', lbl: '7' }, { c: '8', cls: 'kb-spec kb-dim', lbl: '8' },
            { c: '9', cls: 'kb-spec kb-dim', lbl: '9' }, { c: '0', cls: 'kb-spec kb-dim', lbl: '0' },
            { c: '-', cls: 'kb-spec kb-dim', lbl: '-' }, { c: '=', cls: 'kb-spec kb-dim', lbl: '=' },
            { c: '', cls: 'kb-spec kb-bs kb-dim', lbl: '⌫' }
        ],
        // Ряд 1 — Tab, літери, [ ] \
        [
            { c: '', cls: 'kb-spec kb-tab', lbl: 'Tab' },
            { c: 'q' }, { c: 'w' }, { c: 'e' }, { c: 'r' }, { c: 't' }, { c: 'y' }, { c: 'u' }, { c: 'i' }, { c: 'o' }, { c: 'p' },
            { c: '[', cls: 'kb-spec kb-dim', lbl: '[' },
            { c: ']', cls: 'kb-spec kb-dim', lbl: ']' },
            { c: '\\', cls: 'kb-spec kb-dim', lbl: '\\' }
        ],
        // Ряд 2 — Caps, літери, ; ' Enter
        [
            { c: '', cls: 'kb-spec kb-caps', lbl: 'Caps' },
            { c: 'a' }, { c: 's' }, { c: 'd' }, { c: 'f' }, { c: 'g' }, { c: 'h' }, { c: 'j' }, { c: 'k' }, { c: 'l' },
            { c: ';', cls: 'kb-spec kb-dim', lbl: ';' },
            { c: '\'', cls: 'kb-spec kb-dim', lbl: '\'' },
            { c: '', cls: 'kb-spec kb-enter', lbl: '↵' }
        ],
        // Ряд 3 — Shift, літери, , . / Shift
        [
            { c: '', cls: 'kb-spec kb-shift', lbl: '⇧ Shift' },
            { c: 'z' }, { c: 'x' }, { c: 'c' }, { c: 'v' }, { c: 'b' }, { c: 'n' }, { c: 'm' },
            { c: ',', cls: 'kb-spec kb-dim', lbl: ',' },
            { c: '.', cls: 'kb-spec kb-dim', lbl: '.' },
            { c: '/', cls: 'kb-spec kb-dim', lbl: '/' },
            { c: '', cls: 'kb-spec kb-shift', lbl: 'Shift ⇧' }
        ],
        // Ряд 4 — пробіл
        [
            { c: '', cls: 'kb-spec kb-space', lbl: 'Пробіл / Space' }
        ]
    ],
    ua: [
        // Ряд 0 — цифри з апострофом
        [
            { c: '\'', cls: 'kb-spec kb-dim', lbl: '\'' },
            { c: '1', cls: 'kb-spec kb-dim', lbl: '1' }, { c: '2', cls: 'kb-spec kb-dim', lbl: '2' },
            { c: '3', cls: 'kb-spec kb-dim', lbl: '3' }, { c: '4', cls: 'kb-spec kb-dim', lbl: '4' },
            { c: '5', cls: 'kb-spec kb-dim', lbl: '5' }, { c: '6', cls: 'kb-spec kb-dim', lbl: '6' },
            { c: '7', cls: 'kb-spec kb-dim', lbl: '7' }, { c: '8', cls: 'kb-spec kb-dim', lbl: '8' },
            { c: '9', cls: 'kb-spec kb-dim', lbl: '9' }, { c: '0', cls: 'kb-spec kb-dim', lbl: '0' },
            { c: '-', cls: 'kb-spec kb-dim', lbl: '-' }, { c: '=', cls: 'kb-spec kb-dim', lbl: '=' },
            { c: '', cls: 'kb-spec kb-bs kb-dim', lbl: '⌫' }
        ],
        // Ряд 1 — Tab, й ц у к е н г ш щ з х ї \
        [
            { c: '', cls: 'kb-spec kb-tab', lbl: 'Tab' },
            { c: 'й' }, { c: 'ц' }, { c: 'у' }, { c: 'к' }, { c: 'е' }, { c: 'н' }, { c: 'г' }, { c: 'ш' }, { c: 'щ' }, { c: 'з' }, { c: 'х' }, { c: 'ї' },
            { c: '\\', cls: 'kb-spec kb-dim', lbl: '\\' }
        ],
        // Ряд 2 — Caps, ф і в а п р о л д ж є ; ' Enter (виправлено подвоєну с)
        [
            { c: '', cls: 'kb-spec kb-caps', lbl: 'Caps' },
            { c: 'ф' }, { c: 'і' }, { c: 'в' }, { c: 'а' }, { c: 'п' }, { c: 'р' }, { c: 'о' }, { c: 'л' }, { c: 'д' }, { c: 'ж' }, { c: 'є' },
            { c: ';', cls: 'kb-spec kb-dim', lbl: ';' },
            { c: '\'', cls: 'kb-spec kb-dim', lbl: '\'' },
            { c: '', cls: 'kb-spec kb-enter', lbl: '↵' }
        ],
        // Ряд 3 — Shift, я ч с м и т ь б ю , . / Shift
        [
            { c: '', cls: 'kb-spec kb-shift', lbl: '⇧ Shift' },
            { c: 'я' }, { c: 'ч' }, { c: 'с' }, { c: 'м' }, { c: 'и' }, { c: 'т' }, { c: 'ь' }, { c: 'б' }, { c: 'ю' },
            { c: ',', cls: 'kb-spec kb-dim', lbl: ',' },
            { c: '.', cls: 'kb-spec kb-dim', lbl: '.' },
            { c: '/', cls: 'kb-spec kb-dim', lbl: '/' },
            { c: '', cls: 'kb-spec kb-shift', lbl: 'Shift ⇧' }
        ],
        // Ряд 4 — пробіл
        [
            { c: '', cls: 'kb-spec kb-space', lbl: 'Пробіл / Space' }
        ]
    ]
};

/* ═══════════════════════════════════════════
   MESSAGES
═══════════════════════════════════════════ */
const OK_MSG = ["Чудово!", "Супер!", "Відмінно!", "Клас!", "Молодець!",
    "Круто!", "Браво!", "Влучно!", "Топ!", "Блискуче!", "Бомба!"];
const MISS_MSG = ["Ой! Ще раз!", "Промах!", "Не здавайся!", "Наступна!", "Спробуй!"];
const STREAK_MSG = {
    3: '<i class="fas fa-fire"></i> 3 підряд!',
    5: '<i class="fas fa-fire"></i> 5 підряд!',
    8: '<i class="fas fa-bolt"></i> 8 підряд!',
    10: '<i class="fas fa-star"></i> 10 підряд!',
    15: '<i class="fas fa-star"></i> 15 підряд!',
    20: '<i class="fas fa-crown"></i> 20! Легенда!'
};

/* ═══════════════════════════════════════════
   GAME STATE
═══════════════════════════════════════════ */
const gs = {
    score: 0, timer: GAME_SEC, streak: 0, maxStreak: 0,
    level: "beginner", speed: "slow", lang: "ua",
    running: false,
    anim: 9000, spawn: 2800,
    letters: new Map(),
    timerID: null, spawnID: null,
    sound: true, colorIdx: 0, themeIdx: 0,
    correct: 0, missed: 0, missedMap: {},
    startTime: 0
};

/* ═══════════════════════════════════════════
   AUDIO
═══════════════════════════════════════════ */
let actx = null;
function initAudio() {
    try { actx = new (window.AudioContext || window.webkitAudioContext)(); }
    catch (e) { gs.sound = false; updateSoundIcon(); }
}
function tone(f, type = 'sine', dur = .1, gain = .09, delay = 0) {
    if (!gs.sound || !actx) return;
    if (actx.state === 'suspended') actx.resume();
    try {
        const o = actx.createOscillator(), g = actx.createGain();
        o.connect(g); g.connect(actx.destination);
        o.type = type;
        o.frequency.setValueAtTime(f, actx.currentTime + delay);
        g.gain.setValueAtTime(gain, actx.currentTime + delay);
        g.gain.exponentialRampToValueAtTime(.001, actx.currentTime + delay + dur + .04);
        o.start(actx.currentTime + delay);
        o.stop(actx.currentTime + delay + dur + .06);
        o.onended = () => { try { o.disconnect(); g.disconnect(); } catch (e) { } };
    } catch (e) { }
}
function snd(t) {
    if (!gs.sound) return;
    switch (t) {
        case 'ok': tone(523, 'sine', .07, .09, 0); tone(659, 'sine', .07, .08, .07); break;
        case 'miss': tone(200, 'square', .06, .05, 0); break;
        case 'str3': [523, 659, 784].forEach((f, i) => tone(f, 'sine', .09, .1, i * .08)); break;
        case 'str5': [523, 659, 784, 1047].forEach((f, i) => tone(f, 'sine', .09, .1, i * .08)); break;
        case 'str10': [523, 659, 784, 880, 1047, 1175].forEach((f, i) => tone(f, 'sine', .09, .11, i * .07)); break;
        case 'end': [523, 659, 523, 784, 1047].forEach((f, i) => tone(f, 'sine', .15, .1, i * .18)); break;
        case 'up': tone(880, 'sine', .07, .07, 0); tone(1047, 'sine', .07, .07, .09); break;
        case 'down': tone(440, 'sine', .07, .07, 0); tone(330, 'sine', .07, .07, .09); break;
        case 'rec': [523, 659, 784, 1047, 1175, 1319, 1568].forEach((f, i) => tone(f, 'sine', .1, .11, i * .07)); break;
        case 'cd3': tone(523, 'sine', .15, .12, 0); break;
        case 'cd2': tone(659, 'sine', .15, .12, 0); break;
        case 'cd1': tone(784, 'sine', .15, .12, 0); break;
        case 'go': [523, 659, 784, 1047].forEach((f, i) => tone(f, 'sine', .12, .13, i * .06)); break;
    }
}
function toggleSound() {
    gs.sound = !gs.sound; updateSoundIcon();
    if (gs.sound && actx && actx.state === 'suspended') actx.resume();
}
function updateSoundIcon() {
    const i = document.getElementById('sndico');
    if (i) i.className = gs.sound ? 'fas fa-volume-high' : 'fas fa-volume-xmark';
}

/* ═══════════════════════════════════════════
   ZONE SWITCHING
═══════════════════════════════════════════ */
function showPreGameZone() {
    document.getElementById('pre-game-zone').style.display = 'flex';
    document.getElementById('in-game-zone').style.display = 'none';
    document.getElementById('gf').classList.remove('gf-playing');
}
function showInGameZone() {
    document.getElementById('pre-game-zone').style.display = 'none';
    document.getElementById('in-game-zone').style.display = 'flex';
    document.getElementById('gf').classList.add('gf-playing');
}

/* ═══════════════════════════════════════════
   REAL KEYBOARD BUILD
═══════════════════════════════════════════ */
function buildKeyboard() {
    const container = document.getElementById('vkb');
    container.innerHTML = '';
    const available = new Set(CHARS[gs.lang][gs.level].split(''));

    KB[gs.lang].forEach(rowDef => {
        const rowEl = document.createElement('div');
        rowEl.className = 'kb-row';

        rowDef.forEach(k => {
            const key = document.createElement('div');
            const label = k.lbl !== undefined ? k.lbl : k.c;
            const isLetter = k.c && k.c.length === 1;

            let cls = 'kb-key';
            if (k.cls) cls += ' ' + k.cls;
            if (isLetter && !available.has(k.c)) cls += ' kb-dim';
            key.className = cls;
            key.textContent = label;
            if (isLetter) key.dataset.char = k.c;

            rowEl.appendChild(key);
        });
        container.appendChild(rowEl);
    });
}

let kbRaf = null;
function updateKeyboard() {
    if (kbRaf) cancelAnimationFrame(kbRaf);
    kbRaf = requestAnimationFrame(() => {
        document.querySelectorAll('.kb-key').forEach(k => k.classList.remove('kb-active'));
        if (!gs.running) return;
        const needed = new Set();
        gs.letters.forEach(d => needed.add(d.ch.toLowerCase()));
        document.querySelectorAll('.kb-key[data-char]').forEach(k => {
            if (needed.has(k.dataset.char)) k.classList.add('kb-active');
        });
    });
}

function refreshKeyDim() {
    const available = new Set(CHARS[gs.lang][gs.level].split(''));
    document.querySelectorAll('.kb-key[data-char]').forEach(k => {
        k.classList.toggle('kb-dim', !available.has(k.dataset.char));
    });
}

/* ═══════════════════════════════════════════
   INSTRUCTIONS TOGGLE
═══════════════════════════════════════════ */
function toggleIns() {
    const body = document.getElementById('ins-body');
    const toggle = document.getElementById('ins-toggle');
    const hidden = body.hasAttribute('hidden');
    if (hidden) { body.removeAttribute('hidden'); toggle.classList.add('open'); }
    else { body.setAttribute('hidden', ''); toggle.classList.remove('open'); }
}

/* ═══════════════════════════════════════════
   LANGUAGE
═══════════════════════════════════════════ */
function toggleLang() {
    if (gs.running) return;
    gs.lang = gs.lang === 'ua' ? 'en' : 'ua';
    const btn = document.getElementById('langbtn');
    const lbl = document.getElementById('langlbl');
    if (gs.lang === 'ua') {
        btn.className = 'ibtn ua'; lbl.textContent = 'UA';
        showFB('Режим: Українська', true, 'neu');
    } else {
        btn.className = 'ibtn en'; lbl.textContent = 'EN';
        showFB('Mode: English', true, 'neu');
    }
    buildKeyboard();
}

/* ═══════════════════════════════════════════
   THEME
═══════════════════════════════════════════ */
function cycleTheme() {
    gs.themeIdx = (gs.themeIdx + 1) % THEMES.length;
    const t = THEMES[gs.themeIdx];
    document.documentElement.setAttribute('data-theme', t);
    showFB('Тема: ' + THEME_N[t], true, 'neu');
    try { localStorage.setItem('kt-kids-theme', t); } catch (e) { }
}
function loadTheme() {
    try {
        const s = localStorage.getItem('kt-kids-theme');
        if (s && THEMES.includes(s)) {
            gs.themeIdx = THEMES.indexOf(s);
            document.documentElement.setAttribute('data-theme', s);
        }
    } catch (e) { }
}

/* ═══════════════════════════════════════════
   LEVEL / SPEED
═══════════════════════════════════════════ */
function selectLevel(lv) {
    gs.level = lv;
    document.querySelectorAll('#levels .btn').forEach(b => b.classList.remove('sel'));
    document.getElementById(lv).classList.add('sel');
    applySpeed(); refreshKeyDim();
}
function selectSpeed(sp) {
    gs.speed = sp;
    const map = { slow: 'slow', medium: 'medium-speed' };
    document.querySelectorAll('#speed-control .btn').forEach(b => b.classList.remove('sel'));
    document.getElementById(map[sp]).classList.add('sel');
    applySpeed();
}
function applySpeed() {
    const b = SPEEDS[gs.speed];
    const m = LV_MOD[gs.level];
    gs.anim = b.anim * m;
    gs.spawn = b.spawn * m;
}

/* ═══════════════════════════════════════════
   RANDOM CHAR
═══════════════════════════════════════════ */
function randChar() {
    const pool = CHARS[gs.lang][gs.level];
    return pool[Math.floor(Math.random() * pool.length)];
}

/* ═══════════════════════════════════════════
   SPAWN LETTER
═══════════════════════════════════════════ */
function getFieldH() {
    return document.getElementById('gf').offsetHeight || FIELD_BASE_H;
}

function spawn() {
    if (!gs.running) return;
    if (gs.letters.size >= MAX_LETTERS) {
        gs.spawnID = setTimeout(spawn, gs.spawn / 2); return;
    }
    const el = document.createElement('div');
    const ch = randChar();
    const id = Date.now() + Math.random();
    const col = gs.colorIdx++ % 5;
    el.className = `lt c${col}`;
    el.textContent = ch;
    const fieldH = getFieldH();
    el.style.top = (Math.random() * (fieldH - LTR_H)) + 'px';
    el.style.setProperty('--ldur', gs.anim + 'ms');
    el.id = 'l' + id;

    const data = { ch, el, t0: Date.now(), id };
    gs.letters.set(id, data);
    document.getElementById('gf').appendChild(el);
    updateKeyboard();

    data.urgTO = setTimeout(() => {
        if (!el.parentNode || el.classList.contains('ok-done')) return;
        el.classList.add('urgent');
    }, gs.anim * URGENT_AT);

    data.remTO = setTimeout(() => {
        if (!el.parentNode || !gs.letters.has(id)) return;
        el.style.animationPlayState = 'paused';
        el.style.background = '#E53935';
        el.style.color = '#fff'; el.style.opacity = '.8';
        el.classList.remove('urgent');
        snd('miss');
        gs.streak = 0; updateStreak();
        gs.missedMap[ch] = (gs.missedMap[ch] || 0) + 1;
        gs.missed++;
        showFB(MISS_MSG[Math.floor(Math.random() * MISS_MSG.length)], false);
        setTimeout(() => { if (el.parentNode) el.remove(); }, 500);
        gs.letters.delete(id);
        updateKeyboard();
    }, gs.anim * MISSED_AT);

    if (gs.running) gs.spawnID = setTimeout(spawn, gs.spawn);
}

/* ═══════════════════════════════════════════
   KEY HANDLER
═══════════════════════════════════════════ */
function onKey(e) {
    if (!gs.running) return;
    if (e.ctrlKey || e.altKey || e.metaKey) return;
    const pr = e.key;
    let found = false;

    for (const [id, d] of gs.letters.entries()) {
        if (!d || !d.el) continue;
        if (pr !== d.ch) continue;
        found = true;

        if (d.urgTO) clearTimeout(d.urgTO);
        if (d.remTO) clearTimeout(d.remTO);

        const dt = Date.now() - d.t0;
        let pts = PTS_DEF;
        if (dt < T_FAST) pts = PTS_FAST;
        else if (dt < T_MED) pts = PTS_MED;

        gs.streak++;
        if (gs.streak > gs.maxStreak) gs.maxStreak = gs.streak;
        if (gs.streak % STREAK_DIV === 0) pts += Math.floor(gs.streak / STREAK_DIV);
        gs.score += pts; gs.correct++;

        // Freeze at rendered position
        const gfRect = document.getElementById('gf').getBoundingClientRect();
        const elRect = d.el.getBoundingClientRect();
        d.el.style.animationPlayState = 'paused';
        d.el.style.left = (elRect.left - gfRect.left) + 'px';
        d.el.style.top = (elRect.top - gfRect.top) + 'px';
        d.el.style.animation = 'lt-ok .32s cubic-bezier(.34,1.56,.64,1) forwards';
        d.el.classList.remove('urgent');
        d.el.classList.add('ok-done');

        snd('ok'); spawnStars(d.el);

        let msg = OK_MSG[Math.floor(Math.random() * OK_MSG.length)];
        if (STREAK_MSG[gs.streak]) {
            showBurst(STREAK_MSG[gs.streak]);
            if (gs.streak >= 10) snd('str10');
            else if (gs.streak >= 5) snd('str5');
            else snd('str3');
            confetti(25);
        }
        if (pts > PTS_DEF) msg += ' +' + pts + '!';
        if (STREAK_MSG[gs.streak] || pts > PTS_DEF) showFB(msg, true);

        setTimeout(() => { if (d.el && d.el.parentNode) d.el.remove(); }, REMOVE_DELAY);
        gs.letters.delete(id);
        updateScore(); updateStreak(); updateKeyboard();
        break;
    }

    if (!found && pr.length === 1 && !'shiftaltcontrolmeta'.includes(pr.toLowerCase())) {
        gs.streak = 0; updateStreak();
        showFB(MISS_MSG[Math.floor(Math.random() * MISS_MSG.length)], false);
        snd('miss');
    }
}

/* ═══════════════════════════════════════════
   GAME FLOW
═══════════════════════════════════════════ */
function clearAll() {
    gs.letters.forEach(d => {
        if (d.urgTO) clearTimeout(d.urgTO);
        if (d.remTO) clearTimeout(d.remTO);
        if (d.el && d.el.parentNode) d.el.remove();
    });
    gs.letters.clear();
}
function stopProcs() {
    gs.running = false;
    if (gs.timerID) { clearInterval(gs.timerID); gs.timerID = null; }
    if (gs.spawnID) { clearTimeout(gs.spawnID); gs.spawnID = null; }
    clearAll(); updateKeyboard();
}
function resetSess() {
    gs.score = 0; gs.timer = GAME_SEC; gs.streak = 0; gs.maxStreak = 0;
    gs.colorIdx = 0; gs.correct = 0; gs.missed = 0; gs.missedMap = {}; gs.startTime = Date.now();
    updateScore(); updateTimer(); updateStreak();
}

function startGame() {
    if (gs.running) return;
    stopProcs();
    if (actx && actx.state === 'suspended') actx.resume();
    resetSess(); applySpeed();
    document.getElementById('go').style.display = 'none';
    showInGameZone();
    buildKeyboard();

    const cdEl = document.getElementById('countdown');
    cdEl.style.display = 'flex';
    let count = 3;
    const tick = () => {
        cdEl.classList.remove('pop-anim');
        void cdEl.offsetWidth;
        cdEl.classList.add('pop-anim');
        cdEl.textContent = count;
        snd('cd' + count);
        count--;
        if (count > 0) {
            setTimeout(tick, 750);
        } else {
            setTimeout(() => {
                cdEl.innerHTML = '<i class="fas fa-rocket"></i>';
                cdEl.classList.remove('pop-anim');
                void cdEl.offsetWidth;
                cdEl.classList.add('pop-anim');
                snd('go');
                setTimeout(() => { cdEl.style.display = 'none'; actuallyStart(); }, 650);
            }, 750);
        }
    };
    setTimeout(tick, 200);
}

function actuallyStart() {
    gs.running = true;
    gs.timerID = setInterval(() => { gs.timer--; updateTimer(); if (gs.timer <= 0) endGame(); }, 1000);
    gs.spawnID = setTimeout(spawn, INIT_DELAY);
}

function startFromGO() {
    document.getElementById('go').style.display = 'none';
    startGame();
}
function endGame() {
    stopProcs(); buildResults(); snd('end'); confetti(60);
    document.getElementById('go').style.display = 'flex';
    showPreGameZone();
}
function closeGO() { document.getElementById('go').style.display = 'none'; }
function askStop() {
    if (!gs.running) return;
    document.getElementById('cmod').style.display = 'flex';
}
function closeConfirm() { document.getElementById('cmod').style.display = 'none'; }
function confirmStop() {
    closeConfirm(); stopProcs(); resetSess();
    document.getElementById('countdown').style.display = 'none';
    showPreGameZone();
}

/* ═══════════════════════════════════════════
   UI UPDATES
═══════════════════════════════════════════ */
function updateScore() {
    document.getElementById('sval').textContent = gs.score;
    const el = document.getElementById('score');
    el.classList.remove('pop'); void el.offsetWidth; el.classList.add('pop');
}
function updateTimer() {
    document.getElementById('tval').textContent = gs.timer;
    document.getElementById('timer').classList.toggle('low', gs.timer <= LOW_TIME);
}
function updateStreak() {
    document.getElementById('stval').textContent = gs.streak;
    if (gs.streak > 0) {
        const el = document.getElementById('streak');
        el.classList.remove('pop'); void el.offsetWidth; el.classList.add('pop');
    }
}

let fbTimer = null;
function showFB(msg, pos = true, variant = '') {
    const el = document.getElementById('fb');
    el.innerHTML = msg;
    el.className = 'vis' + (pos ? '' : ' neg') + (variant === 'neu' ? ' neu' : '');
    if (fbTimer) clearTimeout(fbTimer);
    fbTimer = setTimeout(() => el.classList.remove('vis'), 1800);
}

/* ═══════════════════════════════════════════
   GAME OVER RESULTS
═══════════════════════════════════════════ */
function buildResults() {
    const total = gs.correct + gs.missed;
    const acc = total > 0 ? Math.round(gs.correct / total * 100) : 0;

    document.getElementById('goscore').textContent = gs.score;
    document.getElementById('goacc').textContent = acc + '%';
    document.getElementById('gostr').textContent = gs.maxStreak;

    // Stars
    const filled = '<i class="fas fa-star"></i>';
    const empty = '<i class="fas fa-star" style="opacity:.25"></i>';
    let stars;
    if (acc >= 80 && gs.score >= 20) stars = filled + filled + filled;
    else if (acc >= 60 || gs.score >= 10) stars = filled + filled + empty;
    else if (gs.score >= 4) stars = filled + empty + empty;
    else stars = empty + empty + empty;
    document.getElementById('gorating').innerHTML = stars;

    const ico = document.getElementById('go-trophy-ico');
    if (ico) ico.style.color = gs.score >= 50 ? '#FFD700' : gs.score >= 20 ? 'var(--c3)' : 'var(--c1)';

    let ach = '';
    if (gs.score >= 80) ach = '<i class="fas fa-crown"></i> Легенда клавіатури!';
    else if (gs.score >= 50) ach = '<i class="fas fa-trophy"></i> Майстер!';
    else if (gs.score >= 30) ach = '<i class="fas fa-star"></i> Чудовий результат!';
    else if (gs.score >= 15) ach = '<i class="fas fa-thumbs-up"></i> Гарна спроба!';
    else if (gs.score >= 5) ach = '<i class="fas fa-dumbbell"></i> Продовжуй тренуватися!';
    else ach = '<i class="fas fa-seedling"></i> Перший крок зроблено!';
    if (gs.maxStreak >= 10) ach += ' <i class="fas fa-fire"></i>';
    document.getElementById('goach-badge').innerHTML = ach;

    const key = 'kt-kids-best-' + gs.level + '-' + gs.speed + '-' + gs.lang;
    let best = 0;
    try { best = parseInt(localStorage.getItem(key)) || 0; } catch (e) { }
    const bestEl = document.getElementById('gobest');
    if (gs.score > best) {
        try { localStorage.setItem(key, gs.score); } catch (e) { }
        bestEl.style.display = 'block';
        bestEl.innerHTML = '<i class="fas fa-medal"></i> Новий рекорд! ' + gs.score + ' балів!';
        snd('rec');
    } else if (best > 0) {
        bestEl.style.display = 'block';
        bestEl.innerHTML = '<i class="fas fa-chart-line"></i> Рекорд: ' + best + ' | Зараз: ' + gs.score;
    } else {
        bestEl.style.display = 'none';
    }

    const missed = Object.entries(gs.missedMap).sort((a, b) => b[1] - a[1]).slice(0, 4);
    const msec = document.getElementById('gomisssec');
    if (missed.length > 0) {
        msec.style.display = 'block';
        const mr = document.getElementById('gomissrow');
        mr.textContent = '';
        missed.forEach(([c, n]) => {
            const s = document.createElement('span');
            s.className = 'mchip';
            s.textContent = c;
            const sub = document.createElement('sub');
            sub.textContent = '×' + n;
            s.appendChild(sub);
            mr.appendChild(s);
        });
    } else {
        msec.style.display = 'none';
    }

    let tip = '';
    if (acc < 60 && total > 3)
        tip = '<i class="fas fa-crosshairs"></i> Точність ' + acc + '% — не поспішай, краще натискай правильно!';
    else if (missed.length > 0)
        tip = '<i class="fas fa-keyboard"></i> Найважча літера: «' + missed[0][0] + '». Знайди її на клавіатурі!';
    else if (gs.maxStreak < 3 && total > 5)
        tip = '<i class="fas fa-fire"></i> Спробуй не помилятись кілька разів підряд — отримаєш бонус!';
    else if (gs.maxStreak >= 8)
        tip = '<i class="fas fa-bolt"></i> Серія ' + gs.maxStreak + ' — чудово! Спробуй рівень «Простий».';
    else
        tip = '<i class="fas fa-rocket"></i> Чудова гра! Ще раз — і поб\'єш рекорд!';
    document.getElementById('gotip').innerHTML = tip;
}

/* ═══════════════════════════════════════════
   STREAK BURST
═══════════════════════════════════════════ */
function showBurst(html) {
    const ov = document.getElementById('sburst-overlay');
    const b = document.getElementById('sburst');
    b.innerHTML = html;
    ov.classList.add('vis');
    setTimeout(() => ov.classList.remove('vis'), 1200);
}

/* ═══════════════════════════════════════════
   STAR PARTICLES
═══════════════════════════════════════════ */
function spawnStars(sourceEl) {
    const overlay = document.getElementById('stars-overlay');
    const rect = sourceEl.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const icons = ['fa-star', 'fa-star', 'fa-bolt', 'fa-circle-dot', 'fa-sparkles'];
    const colors = ['#FF3CAC', '#FFE500', '#784BA0', '#00C897', '#F97316'];
    for (let i = 0; i < 7; i++) {
        const s = document.createElement('i');
        s.className = 'fas ' + icons[i % icons.length] + ' star-particle';
        s.style.left = cx + 'px';
        s.style.top = cy + 'px';
        s.style.color = colors[i % colors.length];
        const angle = (Math.PI * 2 * i / 7) + (Math.random() - .5) * .7;
        const dist = 45 + Math.random() * 65;
        s.style.setProperty('--dx', Math.cos(angle) * dist + 'px');
        s.style.setProperty('--dy', Math.sin(angle) * dist - 20 + 'px');
        s.style.setProperty('--rot', (Math.random() - .5) * 360 + 'deg');
        s.style.animationDuration = (.7 + Math.random() * .5) + 's';
        overlay.appendChild(s);
        setTimeout(() => s.remove(), 1300);
    }
}

/* ═══════════════════════════════════════════
   CONFETTI
═══════════════════════════════════════════ */
function confetti(n) {
    const field = document.getElementById('gf');
    const w = field.offsetWidth, h = field.offsetHeight;
    const cols = ['#FF3CAC', '#FFE500', '#784BA0', '#2563EB', '#00C897', '#F97316'];
    for (let i = 0; i < n; i++) {
        const p = document.createElement('div');
        const sz = 8 + Math.random() * 9;
        const sx = Math.random() * w;
        const sy = h * .3 + Math.random() * h * .3;
        const dx = (Math.random() - .5) * 250;
        const dy = -(50 + Math.random() * 180);
        const dur = 700 + Math.random() * 1100;
        const rot = (Math.random() - .5) * 720;
        const c = cols[Math.floor(Math.random() * cols.length)];
        p.style.cssText = `position:absolute;left:${sx}px;top:${sy}px;width:${sz}px;height:${sz}px;`
            + `background:${c};border-radius:${Math.random() > .5 ? '50%' : '4px'};pointer-events:none;z-index:20;`;
        field.appendChild(p);
        const ca = p.animate([
            { transform: `translate(0,0) rotate(0deg)`, opacity: 1 },
            { transform: `translate(${dx}px,${dy}px) rotate(${rot}deg)`, opacity: 0 }
        ], { duration: dur, easing: 'cubic-bezier(.25,.46,.45,.94)', fill: 'forwards' });
        setTimeout(() => { ca.cancel(); p.remove(); }, dur + 100);
    }
}

/* ═══════════════════════════════════════════
   INJECT KEYFRAMES
═══════════════════════════════════════════ */
function injectKeyframes() {
    const style = document.createElement('style');
    style.textContent = `
    @keyframes lt-ok {
      0%   { transform: scale(1);   opacity: 1; }
      45%  { transform: scale(1.5); opacity: 1; }
      100% { transform: scale(0);   opacity: 0; }
    }
  `;
    document.head.appendChild(style);
}

/* ═══════════════════════════════════════════
   INIT
═══════════════════════════════════════════ */
function initGame() {
    initAudio();
    injectKeyframes();
    loadTheme();
    applySpeed();
    resetSess();
    showPreGameZone();
    buildKeyboard();

    document.addEventListener('keydown', e => {
        if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault();
        onKey(e);
    });
    window.addEventListener('beforeunload', () => { if (gs.running) stopProcs(); });
}

document.addEventListener('DOMContentLoaded', initGame);