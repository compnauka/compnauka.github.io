/* ═══════════════════════════════════════════
   CONSTANTS
═══════════════════════════════════════════ */
const GAME_SEC = 60;
const MAX_LETTERS = 22;
const RARE_PROB = 0.02;
const PTS_FAST = 3, PTS_MED = 2, PTS_DEF = 1;
const T_FAST = 1000, T_MED = 2000;
const STREAK_DIV = 5;
const INIT_DELAY = 900;
const REMOVE_DELAY = 340;
const LOW_TIME = 10;
const FIELD_H = 260, LTR_H = 60;
const MISSED_AT = 0.93;   // fraction of journey when letter freezes as missed
const URGENT_AT = 0.65;   // fraction when letter turns urgent
// ADAPTIVE — conservative settings (was too aggressive before)
const AD_WINDOW = 20;     // track last N results
const AD_COOLDOWN = 9000;   // ms between changes
const AD_STEP = 0.05;   // 5% per adjustment
const AD_MAX = 1.35;
const AD_MIN = 0.75;
const AD_MIN_DATA = 10;      // need at least this many samples
const AD_UP = 0.90;   // ≥90% → speed up
const AD_DOWN = 0.65;   // ≤65% → slow down

/* ═══════════════════════════════════════════
   CHAR SETS
═══════════════════════════════════════════ */
const CHARS = {
    ua: {
        beginner: "аоієнтсрвл",
        easy: "абвгдеєжзиіїйклмнопрстуфхцчшщьюя",
        medium: "абвгдеєжзиіїйклмнопрстуфхцчшщьюяАБВГДЕЄЖЗИІЇЙКЛМНОПРСТУФХЦЧШЩЬЮЯ",
        hard: "абвгдеєжзиіїйклмнопрстуфхцчшщьюяАБВГДЕЄЖЗИІЇЙКЛМНОПРСТУФХЦЧШЩЬЮЯ0123456789!\"№;%:?*()-_=+"
    },
    en: {
        beginner: "aeioutnrsl",
        easy: "abcdefghijklmnopqrstuvwxyz",
        medium: "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ",
        hard: "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()-_=+"
    }
};
const RARE = { ua: { beginner: "", easy: "", medium: "ґҐ", hard: "ґҐ" }, en: { beginner: "", easy: "", medium: "", hard: "" } };
const SPEEDS = { slow: { anim: 10000, spawn: 2500 }, medium: { anim: 6000, spawn: 1500 }, fast: { anim: 3500, spawn: 800 } };
const LV_MOD = { beginner: 1.2, easy: 1.0, medium: .9, hard: .8 };
const THEMES = ['sunny', 'ocean', 'night', 'berry'];
const THEME_N = { sunny: 'Сонячний', ocean: 'Морський', night: 'Нічний', berry: 'Ягідний' };
const LVL_N = { beginner: 'Дуже простий', easy: 'Простий', medium: 'Середній', hard: 'Складний' };
const SPD_N = { slow: 'Повільна', medium: 'Середня', fast: 'Швидка' };

/* ═══════════════════════════════════════════
   MESSAGES
═══════════════════════════════════════════ */
const OK_MSG = ["Чудово!", "Супер!", "Відмінно!", "Класно!", "Молодець!", "Круто!", "Браво!", "Влучно!", "Топ!", "Блискуче!", "Бомба!", "Ти зірка!", "Так тримати!", "Оце так!", "Неймовірно!", "Клас!"];
const MISS_MSG = ["Упс!", "Промах!", "Ще спробуй!", "Не здавайся!", "Ок, далі!", "Бувало!", "Наступна!"];
const STREAK_MSG = { 5: "5 підряд! Вогонь!", 10: "10 підряд! Бомба!", 15: "15 підряд! Неймовірно!", 20: "20 підряд! Легенда!", 25: "25 підряд! Топ!", 30: "30 підряд! НЕМОЖЛИВО!" };

/* ═══════════════════════════════════════════
   GAME STATE
═══════════════════════════════════════════ */
const gs = {
    score: 0, timer: GAME_SEC, streak: 0, maxStreak: 0,
    level: "beginner", speed: "medium", lang: "ua",
    running: false,
    anim: 6000, spawn: 1500,
    adaptMult: 1.0, results: [], lastAdapt: 0,
    letters: new Map(),
    timerID: null, spawnID: null,
    sound: true, colorIdx: 0, themeIdx: 0,
    correct: 0, missed: 0,
    missedMap: {},
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
        o.start(actx.currentTime + delay); o.stop(actx.currentTime + delay + dur + .06);
        o.onended = () => { try { o.disconnect(); g.disconnect(); } catch (e) { } };
    } catch (e) { }
}
function snd(t) {
    if (!gs.sound) return;
    switch (t) {
        case 'ok': tone(523, 'sine', .07, .09, 0); tone(659, 'sine', .07, .08, .06); break;
        case 'miss': tone(220, 'square', .06, .05, 0); break;
        case 'str5': [523, 659, 784, 1047].forEach((f, i) => tone(f, 'sine', .09, .09, i * .08)); break;
        case 'str10': [523, 659, 784, 880, 1047, 1175].forEach((f, i) => tone(f, 'sine', .09, .11, i * .07)); break;
        case 'end': [392, 330, 262, 196].forEach((f, i) => tone(f, 'triangle', .22, .1, i * .22)); break;
        case 'up': tone(880, 'sine', .07, .07, 0); tone(1047, 'sine', .07, .07, .09); break;
        case 'down': tone(440, 'sine', .07, .07, 0); tone(330, 'sine', .07, .07, .09); break;
        case 'rec': [523, 659, 784, 1047, 1175, 1319].forEach((f, i) => tone(f, 'sine', .1, .11, i * .07)); break;
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
   KEY MAP
═══════════════════════════════════════════ */
const KMAP = new Map();
function initKMap() {
    const sp = { "!": "1", '"': "2", "№": "3", ";": "4", "%": "5", ":": "6", "?": "7", "*": "8", "(": "9", ")": "0", "_": "-", "+": "=" };
    for (const [c, k] of Object.entries(sp)) KMAP.set(c, k);
}
function match(pressed, expected) {
    if (expected.toLowerCase() !== expected.toUpperCase()) return pressed === expected;
    return pressed === (KMAP.get(expected) || expected) || pressed === expected;
}

/* ═══════════════════════════════════════════
   LANGUAGE
═══════════════════════════════════════════ */
function toggleLang() {
    gs.lang = gs.lang === 'ua' ? 'en' : 'ua';
    const btn = document.getElementById('langbtn');
    const lbl = document.getElementById('langlbl');
    if (gs.lang === 'ua') { btn.className = 'ibtn ua'; lbl.textContent = 'UA'; showFB('Режим: Українська', true, 'neu'); }
    else { btn.className = 'ibtn en'; lbl.textContent = 'EN'; showFB('Mode: English', true, 'neu'); }
}

/* ═══════════════════════════════════════════
   THEME
═══════════════════════════════════════════ */
function cycleTheme() {
    gs.themeIdx = (gs.themeIdx + 1) % THEMES.length;
    const t = THEMES[gs.themeIdx];
    document.documentElement.setAttribute('data-theme', t);
    showFB('Тема: ' + THEME_N[t], true, 'neu');
    try { localStorage.setItem('kt-theme', t); } catch (e) { }
}
function loadTheme() {
    try {
        const s = localStorage.getItem('kt-theme');
        if (s && THEMES.includes(s)) { gs.themeIdx = THEMES.indexOf(s); document.documentElement.setAttribute('data-theme', s); }
    } catch (e) { }
}

/* ═══════════════════════════════════════════
   LEVEL / SPEED SELECTION
═══════════════════════════════════════════ */
function selectLevel(lv) {
    gs.level = lv;
    document.querySelectorAll('#levels .btn').forEach(b => b.classList.remove('sel'));
    document.getElementById(lv).classList.add('sel');
    applySpeed();
}
function selectSpeed(sp) {
    gs.speed = sp;
    const ids = { slow: 'slow', medium: 'medium-speed', fast: 'fast' };
    document.querySelectorAll('#speed-control .btn').forEach(b => b.classList.remove('sel'));
    document.getElementById(ids[sp]).classList.add('sel');
    applySpeed();
}
function applySpeed() {
    const b = SPEEDS[gs.speed], m = LV_MOD[gs.level], a = gs.adaptMult;
    gs.anim = (b.anim * m) / a; gs.spawn = (b.spawn * m) / a;
    updateAdaptBar();
}

/* ═══════════════════════════════════════════
   ADAPTIVE — fixed (softer, slower changes)
═══════════════════════════════════════════ */
function pushResult(ok) {
    gs.results.push(ok);
    if (gs.results.length > AD_WINDOW) gs.results.shift();
    if (gs.results.length < AD_MIN_DATA) return;
    const now = Date.now();
    if (now - gs.lastAdapt < AD_COOLDOWN) return;
    const hit = gs.results.filter(r => r).length / gs.results.length;
    const old = gs.adaptMult;
    if (hit >= AD_UP && old < AD_MAX) {
        gs.adaptMult = Math.min(AD_MAX, +(old + AD_STEP).toFixed(2));
        gs.lastAdapt = now; applySpeed();
        if (gs.adaptMult > old) { showFB('Темп прискорено!', true, 'neu'); snd('up'); }
    } else if (hit <= AD_DOWN && old > AD_MIN) {
        gs.adaptMult = Math.max(AD_MIN, +(old - AD_STEP).toFixed(2));
        gs.lastAdapt = now; applySpeed();
        if (gs.adaptMult < old) { showFB('Темп сповільнено', true, 'neu'); snd('down'); }
    }
}
function updateAdaptBar() {
    const pct = Math.round(((gs.adaptMult - AD_MIN) / (AD_MAX - AD_MIN)) * 100);
    const f = document.getElementById('afill'), p = document.getElementById('apct');
    if (!f) return;
    f.style.width = pct + '%';
    f.style.background = pct > 70 ? 'var(--c1)' : pct > 40 ? 'var(--c3)' : 'var(--c2)';
    p.textContent = pct + '%';
    document.getElementById('abar').classList.toggle('vis', gs.running);
}

/* ═══════════════════════════════════════════
   RANDOM CHAR
═══════════════════════════════════════════ */
function randChar() {
    const r = RARE[gs.lang][gs.level];
    if (r && r.length && Math.random() < RARE_PROB) return r[Math.floor(Math.random() * r.length)];
    const p = CHARS[gs.lang][gs.level];
    return p[Math.floor(Math.random() * p.length)];
}

/* ═══════════════════════════════════════════
   SPAWN LETTER — FIXED animation/positioning
═══════════════════════════════════════════ */
function spawn() {
    if (!gs.running) return;
    if (gs.letters.size >= MAX_LETTERS) { gs.spawnID = setTimeout(spawn, gs.spawn / 2); return; }
    const el = document.createElement('div');
    const ch = randChar();
    const id = Date.now() + Math.random();
    const col = gs.colorIdx++ % 3;
    el.className = `lt c${col}`;
    el.textContent = ch;
    el.style.top = (Math.random() * (FIELD_H - LTR_H)) + 'px';
    // set CSS variables for animation timing
    el.style.setProperty('--ldur', gs.anim + 'ms');
    el.id = 'l' + id;
    const data = { ch, el, t0: Date.now(), id };
    gs.letters.set(id, data);
    document.getElementById('gf').appendChild(el);

    // Urgent: turn on warning glow (without restarting the movement animation)
    data.urgTO = setTimeout(() => {
        if (!el.parentNode || el.classList.contains('ok')) return;
        el.classList.add('urgent');
    }, gs.anim * URGENT_AT);

    // Missed: pause animation at ~93% so letter is still visible near right edge
    data.remTO = setTimeout(() => {
        if (!el.parentNode || !gs.letters.has(id)) return;
        // Pause animation — letter freezes near the right edge (not at start!)
        el.style.animationPlayState = 'paused';
        // Apply missed styles via inline (overrides any class cascade cleanly)
        el.style.background = '#E53935';
        el.style.color = '#fff';
        el.style.borderColor = '#B71C1C';
        el.style.opacity = '.75';
        el.classList.remove('urgent');
        snd('miss');
        gs.streak = 0; updateStreak();
        pushResult(false);
        gs.missedMap[ch] = (gs.missedMap[ch] || 0) + 1;
        gs.missed++;
        showFB(MISS_MSG[Math.floor(Math.random() * MISS_MSG.length)], false);
        setTimeout(() => { if (el.parentNode) el.remove(); }, 500);
        gs.letters.delete(id);
    }, gs.anim * MISSED_AT);

    if (gs.running) gs.spawnID = setTimeout(spawn, gs.spawn);
}

/* ═══════════════════════════════════════════
   KEY HANDLER
═══════════════════════════════════════════ */
function onKey(e) {
    if (!gs.running) return;
    if (e.ctrlKey || e.altKey || e.metaKey) return;
    const pr = e.key; let found = false;
    for (const [id, d] of gs.letters.entries()) {
        if (!d || !d.el) continue;
        if (!match(pr, d.ch)) continue;
        found = true;
        if (d.urgTO) clearTimeout(d.urgTO);
        if (d.remTO) clearTimeout(d.remTO);
        const dt = Date.now() - d.t0;
        let pts = PTS_DEF;
        if (dt < T_FAST) pts = PTS_FAST; else if (dt < T_MED) pts = PTS_MED;
        gs.streak++; if (gs.streak > gs.maxStreak) gs.maxStreak = gs.streak;
        if (gs.streak % STREAK_DIV === 0) pts += Math.floor(gs.streak / STREAK_DIV);
        gs.score += pts; gs.correct++;
        // freeze then animate out
        d.el.style.animationPlayState = 'paused';
        d.el.classList.remove('urgent');
        d.el.classList.add('ok');
        snd('ok'); pushResult(true);
        let msg = OK_MSG[Math.floor(Math.random() * OK_MSG.length)];
        if (STREAK_MSG[gs.streak]) {
            msg = STREAK_MSG[gs.streak];
            showBurst(msg); snd(gs.streak >= 10 ? 'str10' : 'str5'); confetti(30);
        }
        if (pts > PTS_DEF) msg += ' +' + pts + '!';
        if (STREAK_MSG[gs.streak] || pts > PTS_DEF) {
            showFB(msg, true);
        }
        setTimeout(() => { if (d.el && d.el.parentNode) d.el.remove(); }, REMOVE_DELAY);
        gs.letters.delete(id); updateScore(); updateStreak();
        break;
    }
    if (!found && pr.length === 1 && !'shiftaltcontrolmeta'.includes(pr.toLowerCase())) {
        gs.streak = 0; updateStreak();
        showFB(MISS_MSG[Math.floor(Math.random() * MISS_MSG.length)], false); snd('miss');
    }
}

/* ═══════════════════════════════════════════
   GAME FLOW
═══════════════════════════════════════════ */
function clearAll() {
    gs.letters.forEach(d => {
        if (d.urgTO) clearTimeout(d.urgTO); if (d.remTO) clearTimeout(d.remTO);
        if (d.el && d.el.parentNode) d.el.remove();
    }); gs.letters.clear();
}
function stopProcs() {
    gs.running = false;
    if (gs.timerID) { clearInterval(gs.timerID); gs.timerID = null; }
    if (gs.spawnID) { clearTimeout(gs.spawnID); gs.spawnID = null; }
    clearAll();
}
function resetSess() {
    gs.score = 0; gs.timer = GAME_SEC; gs.streak = 0; gs.maxStreak = 0;
    gs.adaptMult = 1.0; gs.results = []; gs.lastAdapt = 0; gs.colorIdx = 0;
    gs.correct = 0; gs.missed = 0; gs.missedMap = {}; gs.startTime = Date.now();
    updateScore(); updateTimer(); updateStreak(); updateAdaptBar();
}
function startGame() {
    if (gs.running) return; stopProcs();
    if (actx && actx.state === 'suspended') actx.resume();
    resetSess(); applySpeed();
    document.getElementById('go').style.display = 'none';
    document.getElementById('sbtn').style.display = 'none';
    document.getElementById('rbtn').style.display = 'inline-flex';
    gs.running = true; updateAdaptBar();
    gs.timerID = setInterval(() => { gs.timer--; updateTimer(); if (gs.timer <= 0) endGame(); }, 1000);
    gs.spawnID = setTimeout(spawn, INIT_DELAY);
}
function startFromGO() { document.getElementById('go').style.display = 'none'; startGame(); }
function endGame() {
    stopProcs(); buildResults(); snd('end'); confetti(50);
    document.getElementById('go').style.display = 'flex';
    document.getElementById('sbtn').style.display = 'inline-flex';
    document.getElementById('rbtn').style.display = 'none';
    updateAdaptBar();
}
function closeGO() { document.getElementById('go').style.display = 'none'; }
function askStop() { if (!gs.running) return; document.getElementById('cmod').style.display = 'flex'; }
function closeConfirm() { document.getElementById('cmod').style.display = 'none'; }
function confirmStop() {
    closeConfirm(); stopProcs(); resetSess();
    document.getElementById('sbtn').style.display = 'inline-flex';
    document.getElementById('rbtn').style.display = 'none';
    updateAdaptBar();
}

/* ═══════════════════════════════════════════
   UI
═══════════════════════════════════════════ */
function updateScore() {
    document.getElementById('sval').textContent = gs.score;
    const el = document.getElementById('score'); el.classList.add('pop');
    setTimeout(() => el.classList.remove('pop'), 220);
}
function updateTimer() {
    document.getElementById('tval').textContent = gs.timer;
    document.getElementById('timer').classList.toggle('low', gs.timer <= LOW_TIME);
}
function updateStreak() {
    document.getElementById('stval').textContent = gs.streak;
    if (gs.streak > 0) { const el = document.getElementById('streak'); el.classList.add('pop'); setTimeout(() => el.classList.remove('pop'), 220); }
}
let fbTimer = null;
function showFB(msg, pos = true, variant = '') {
    const el = document.getElementById('fb');
    el.textContent = msg;
    el.className = 'vis' + (pos ? '' : ' neg') + (variant === 'neu' ? ' neu' : '');
    if (fbTimer) clearTimeout(fbTimer);
    fbTimer = setTimeout(() => el.classList.remove('vis'), 1700);
}

/* ═══════════════════════════════════════════
   GAME OVER — full stats + tips
═══════════════════════════════════════════ */
function buildResults() {
    const total = gs.correct + gs.missed;
    const acc = total > 0 ? Math.round(gs.correct / total * 100) : 0;
    const sec = Math.max(1, (Date.now() - gs.startTime) / 1000);
    const cpm = Math.round(gs.correct / sec * 60);
    document.getElementById('goscore').textContent = gs.score;
    document.getElementById('goacc').textContent = acc + '%';
    document.getElementById('gocpm').textContent = cpm;
    document.getElementById('gostr').textContent = gs.maxStreak;
    // Tags
    document.getElementById('gotags').innerHTML =
        `<span class="gtag">${LVL_N[gs.level]}</span>` +
        `<span class="gtag">${SPD_N[gs.speed]}</span>` +
        `<span class="gtag">${gs.lang === 'ua' ? 'Українська' : 'English'}</span>`;
    // Missed letters (top 5)
    const missed = Object.entries(gs.missedMap).sort((a, b) => b[1] - a[1]).slice(0, 5);
    const msec = document.getElementById('gomisssec');
    if (missed.length > 0) {
        msec.style.display = 'block';
        const mr = document.getElementById('gomissrow'); mr.textContent = '';
        missed.forEach(([c, n]) => { const s = document.createElement('span'); s.className = 'mchip'; s.textContent = c; const sub = document.createElement('sub'); sub.textContent = '×' + n; s.appendChild(sub); mr.appendChild(s); });
    } else { msec.style.display = 'none'; }
    // Achievement
    let ach = '';
    if (gs.score >= 150) ach = '<i class="fas fa-crown"></i> Легенда клавіатури!';
    else if (gs.score >= 100) ach = '<i class="fas fa-trophy"></i> Майстер клавіатури!';
    else if (gs.score >= 60) ach = '<i class="fas fa-star"></i> Чудовий результат!';
    else if (gs.score >= 30) ach = '<i class="fas fa-thumbs-up"></i> Гарна спроба!';
    else if (gs.score >= 10) ach = '<i class="fas fa-dumbbell"></i> Продовжуй тренуватися!';
    else ach = '<i class="fas fa-seedling"></i> Перший крок зроблено!';
    if (gs.maxStreak >= 25) ach += ' <i class="fas fa-fire"></i> Неймовірна серія!';
    else if (gs.maxStreak >= 10) ach += ' <i class="fas fa-bolt"></i> Відмінна серія!';
    document.getElementById('goach').innerHTML = ach;
    // Best score
    const key = 'kt-best-' + gs.level + '-' + gs.speed + '-' + gs.lang;
    let best = 0; try { best = parseInt(localStorage.getItem(key)) || 0; } catch (e) { }
    const bestEl = document.getElementById('gobest');
    if (gs.score > best) {
        try { localStorage.setItem(key, gs.score); } catch (e) { }
        bestEl.style.display = 'block';
        bestEl.innerHTML = '<i class="fas fa-medal"></i> Новий рекорд для цього рівня! ';
        snd('rec');
    } else if (best > 0) {
        bestEl.style.display = 'block';
        bestEl.innerHTML = `<i class="fas fa-chart-line"></i> Рекорд: ${best} балів. Твій результат: ${gs.score}.`;
    } else { bestEl.style.display = 'none'; }
    // Tips
    const tips = [];
    if (acc < 60) tips.push('Точність ' + acc + '% — намагайся не поспішати і бити точно в потрібну клавішу.');
    if (acc >= 85 && gs.score < 30) tips.push('Ти точний, але повільний. Спробуй підвищити швидкість або рівень!');
    if (missed.length > 0) {
        const hardest = missed[0][0];
        tips.push(`Найважча літера для тебе сьогодні: "${hardest}". Зверни увагу на її розташування на клавіатурі.`);
    }
    if (gs.maxStreak < 5 && total > 5) tips.push('Намагайся утримати серію правильних відповідей — не квапся, краще точно!');
    if (gs.maxStreak >= 10) tips.push('Відмінна серія ' + gs.maxStreak + '! Спробуй наступний рівень складності.');
    if (cpm > 30) tips.push('Швидкість ' + cpm + ' симв/хв — непогано! Для порівняння: 60+ cpm вважається гарним результатом.');
    if (tips.length === 0) tips.push('Чудова гра! Спробуй важчий рівень або вищу швидкість.');
    document.getElementById('gotips').innerHTML = tips.map(t => `<div class="tip"><i class="fas fa-lightbulb"></i>${t}</div>`).join('');
}

/* ═══════════════════════════════════════════
   STREAK BURST
═══════════════════════════════════════════ */
function showBurst(txt) {
    const ov = document.getElementById('sburst-overlay'), b = document.getElementById('sburst');
    b.textContent = txt; ov.classList.add('vis');
    setTimeout(() => ov.classList.remove('vis'), 1100);
}

/* ═══════════════════════════════════════════
   CONFETTI
═══════════════════════════════════════════ */
function confetti(n) {
    const field = document.getElementById('gf');
    const w = field.offsetWidth, h = field.offsetHeight;
    const cols = ['#FFE500', '#E53935', '#0097A7', '#388E3C', '#6A1B9A', '#FF7043', '#C62A47', '#FFFFFF'];
    for (let i = 0; i < n; i++) {
        const p = document.createElement('div');
        const c = cols[Math.floor(Math.random() * cols.length)];
        const sz = 8 + Math.random() * 12;
        const sx = Math.random() * w, sy = h * .4 + Math.random() * h * .2;
        const dx = (Math.random() - .5) * 260, dy = -(60 + Math.random() * 180);
        const dur = 900 + Math.random() * 1200;
        const rot = (Math.random() - .5) * 720;
        p.style.cssText = `position:absolute;left:${sx}px;top:${sy}px;width:${sz}px;height:${sz}px;background:${c};border:2px solid #1a1a1a;border-radius:${Math.random() > .5 ? '50%' : '3px'};pointer-events:none;z-index:20;`;
        field.appendChild(p);
        const ca = p.animate([
            { transform: `translate(0,0) rotate(0deg)`, opacity: 1 },
            { transform: `translate(${dx}px,${dy}px) rotate(${rot}deg)`, opacity: 0 }
        ], { duration: dur, easing: 'cubic-bezier(.25,.46,.45,.94)', fill: 'forwards' });
        setTimeout(() => { ca.cancel(); p.remove(); }, dur + 100);
    }
}

/* ═══════════════════════════════════════════
   INIT
═══════════════════════════════════════════ */
function initGame() {
    initAudio(); initKMap(); loadTheme(); applySpeed(); resetSess();
    document.getElementById('gdursec').textContent = GAME_SEC;
    document.addEventListener('keydown', e => {
        if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault();
        onKey(e);
    });
    window.addEventListener('beforeunload', () => { if (gs.running) stopProcs(); });
}
document.addEventListener('DOMContentLoaded', initGame);