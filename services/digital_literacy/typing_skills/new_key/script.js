(() => {
    "use strict";

    // ---------- DOM ----------
    const $ = (id) => document.getElementById(id);

    const app = $("app");
    const cvs = $("game");
    const ctx = cvs.getContext("2d");

    const overlay = $("overlay");
    const ovTitle = $("ovTitle");
    const ovBody = $("ovBody");
    const reqText = $("reqText");

    const btnStart = $("btnStart");
    const btnReplay = $("btnReplay");
    const btnNext = $("btnNext");
    const btnStay = $("btnStay");
    const btnPause = $("btnPause");
    const btnQuit = $("btnQuit");
    const btnCert = $("btnCert");

    const btnSound = $("btnSound");
    const btnKbMode = $("btnKbMode");
    const kbModeText = $("kbModeText");
    const btnContrast = $("btnContrast");
    const btnReset = $("btnReset");
    const themeSel = $("themeSel");

    const kbWrap = $("kbWrap");
    const kbHost = $("kb");

    const lvlText = $("lvlText");
    const lvlName = $("lvlName");
    const timeText = $("timeText");
    const streakText = $("streakText");
    const heartsHost = $("hearts");
    const starsHost = $("stars");
    const timeBar = $("timeBar");

    const wpmText = $("wpmText");
    const cpmText = $("cpmText");
    const accText = $("accText");
    const bestText = $("bestText");

    const fingerHint = $("fingerHint");
    const targetHint = $("targetHint");
    const toast = $("toast");

    const ghost = $("ghost");

    // ---------- constants ----------
    const VW = 400, VH = 300;
    const ROUND_SECONDS = 45;

    // ---------- utils ----------
    const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
    const rnd = (a, b) => a + Math.random() * (b - a);
    const pick = (arr) => arr[(Math.random() * arr.length) | 0];

    function showToast(msg) {
        toast.textContent = msg;
        toast.classList.add("show");
        clearTimeout(showToast._t);
        showToast._t = setTimeout(() => toast.classList.remove("show"), 1050);
    }

    // ---------- adaptive canvas (crisp on retina) ----------
    function resizeCanvas() {
        const dpr = Math.max(1, Math.floor(window.devicePixelRatio || 1));
        // keep logical coordinate system 400x300
        cvs.width = VW * dpr;
        cvs.height = VH * dpr;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    window.addEventListener("resize", resizeCanvas, { passive: true });
    resizeCanvas();

    // ---------- "dictionary" 500+ (generated from stems+ends for small gzip) ----------
    const stems = (
        "мам тат школ книг вікн сон мор косм кот пес друг гра рук ніс ліс дім " +
        "сад стіл стул чай суп сік хліб сир риб яблук груш банан зима весн літ осін " +
        "біг стриб сміх радість казк зірк хмар вітер дощ сніг річк міст дорог поїзд " +
        "літак ракета планета зореліт орієнтир карта клавіш екран ліва права центр " +
        "швидк точно помилк перемог бонус скарб джунгл тигр слон папуга"
    ).trim().split(/\s+/);

    const ends = ["а", "у", "і", "и", "ою", "ом", "е", "я", "ю", "ів", "ам", "ям", "ок", "чик", "енько", "ство", "ний", "на", "не", "ти", "тись"];

    function buildWordList(minCount = 540) {
        const set = new Set();
        stems.forEach(s => set.add(s));
        for (let i = 0; i < stems.length; i++) {
            for (let j = 0; j < ends.length; j++) {
                const w = stems[i] + ends[j];
                if (w.length >= 3 && w.length <= 10) set.add(w);
                if (set.size >= minCount) return [...set];
            }
        }
        return [...set];
    }
    const WORDS = buildWordList(560);

    const SENTENCES = [
        "я люблю школу",
        "котик стрибає високо",
        "ми читаємо цікаву книгу",
        "сонце світить яскраво",
        "дощ тихо стукає у вікно",
        "у нас добра команда",
        "я друкую швидко і точно",
        "ми вчимося без стресу",
        "друг допомагає завжди",
        "космос дуже загадковий",
        "море хвилюється ніжно",
        "вітер грається з хмарами",
    ];

    // ---------- keyboard layout (UA ЙЦУКЕН) ----------
    const ROWS = [
        ["й", "ц", "у", "к", "е", "н", "г", "ш", "щ", "з", "х", "ї"],
        ["ф", "і", "в", "а", "п", "р", "о", "л", "д", "ж", "є"],
        ["я", "ч", "с", "м", "и", "т", "ь", "б", "ю"]
    ];

    // Finger hint map (rough, enough for kids)
    const fingerMap = new Map([
        ["ф", "Лівий мізинець"], ["й", "Лівий мізинець"], ["я", "Лівий мізинець"],
        ["і", "Лівий безіменний"], ["ц", "Лівий безіменний"], ["ч", "Лівий безіменний"],
        ["в", "Лівий середній"], ["у", "Лівий середній"], ["с", "Лівий середній"],
        ["а", "Лівий вказівний"], ["к", "Лівий вказівний"], ["м", "Лівий вказівний"],
        ["п", "Лівий вказівний"], ["е", "Лівий вказівний"], ["и", "Лівий вказівний"],
        ["р", "Правий вказівний"], ["н", "Правий вказівний"], ["т", "Правий вказівний"],
        ["о", "Правий середній"], ["г", "Правий середній"], ["ь", "Правий середній"],
        ["л", "Правий безіменний"], ["ш", "Правий безіменний"], ["б", "Правий безіменний"],
        ["д", "Правий мізинець"], ["щ", "Правий мізинець"], ["ю", "Правий мізинець"],
        ["ж", "Правий мізинець"], ["з", "Правий мізинець"], ["х", "Правий мізинець"], ["ї", "Правий мізинець"], ["є", "Правий мізинець"]
    ]);

    // IMPORTANT improvement:
    // Physical-key mapping (e.code -> UA char). Works even if OS layout is ENG.
    const CODE2UA = new Map([
        // row 1 (Q..])
        ["KeyQ", "й"], ["KeyW", "ц"], ["KeyE", "у"], ["KeyR", "к"], ["KeyT", "е"], ["KeyY", "н"],
        ["KeyU", "г"], ["KeyI", "ш"], ["KeyO", "щ"], ["KeyP", "з"], ["BracketLeft", "х"], ["BracketRight", "ї"],
        // row 2 (A..')
        ["KeyA", "ф"], ["KeyS", "і"], ["KeyD", "в"], ["KeyF", "а"], ["KeyG", "п"], ["KeyH", "р"],
        ["KeyJ", "о"], ["KeyK", "л"], ["KeyL", "д"], ["Semicolon", "ж"], ["Quote", "є"],
        // row 3 (Z..)
        ["KeyZ", "я"], ["KeyX", "ч"], ["KeyC", "с"], ["KeyV", "м"], ["KeyB", "и"], ["KeyN", "т"],
        ["KeyM", "ь"], ["Comma", "б"], ["Period", "ю"],
        // space
        ["Space", " "]
    ]);

    // ---------- levels ----------
    const LEVELS = [
        { name: "Домашній ряд 1", mode: "letters", chars: "фівапр", acc: 90, wpm: 8, hint: true },
        { name: "Домашній ряд 2", mode: "letters", chars: "олджє", acc: 90, wpm: 10, hint: true },
        { name: "Домашній ряд 3", mode: "letters", chars: "йцукенг", acc: 88, wpm: 12, hint: true },

        { name: "Слова 1", mode: "words", chars: "фівапролджє", acc: 85, wpm: 14, hint: true },
        { name: "Слова 2", mode: "words", chars: "йцукенгшщзхї", acc: 85, wpm: 16, hint: true },
        { name: "Слова 3", mode: "words", chars: "ячесмитьбю", acc: 85, wpm: 18, hint: true },

        { name: "Речення 1", mode: "sent", chars: "йцукенгшщзхїфівапролджєячесмитьбю", acc: 80, wpm: 20, hint: false },
        { name: "Речення 2", mode: "sent", chars: "йцукенгшщзхїфівапролджєячесмитьбю", acc: 80, wpm: 22, hint: false },
        { name: "Речення 3", mode: "sent", chars: "йцукенгшщзхїфівапролджєячесмитьбю", acc: 80, wpm: 24, hint: false },

        { name: "Експерт 1", mode: "mixed", chars: "йцукенгшщзхїфівапролджєячесмитьбю", acc: 75, wpm: 26, hint: false },
        { name: "Експерт 2", mode: "mixed", chars: "йцукенгшщзхїфівапролджєячесмитьбю", acc: 75, wpm: 28, hint: false },
        { name: "Експерт 3", mode: "mixed", chars: "йцукенгшщзхїфівапролджєячесмитьбю", acc: 75, wpm: 30, hint: false },
    ];

    // ---------- persistent profile ----------
    const LS_KEY = "klavsprint_kids_v2";
    const profile = loadProfile();

    function loadProfile() {
        try {
            const p = JSON.parse(localStorage.getItem(LS_KEY) || "{}");
            return {
                theme: p.theme || "sun",
                sound: p.sound !== false,
                contrast: p.contrast === true,
                // kbMode: "auto" | "show" | "hide"
                kbMode: (p.kbMode === "show" || p.kbMode === "hide") ? p.kbMode : "auto",
                unlocked: clamp(p.unlocked || 1, 1, 12),
                bestWpm: p.bestWpm || 0,
            };
        } catch {
            return { theme: "sun", sound: true, contrast: false, kbMode: "auto", unlocked: 1, bestWpm: 0 };
        }
    }
    function saveProfile() {
        localStorage.setItem(LS_KEY, JSON.stringify(profile));
    }

    // ---------- audio (WebAudio, 5 cues) ----------
    let audioCtx = null;
    function ensureAudio() {
        if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    function beep(type) {
        if (!profile.sound) return;
        ensureAudio();
        const t0 = audioCtx.currentTime;

        const map = {
            hit: [880, 0.06, "triangle"],
            miss: [140, 0.08, "sawtooth"],
            bonus: [660, 0.10, "square"],
            level: [990, 0.14, "triangle"],
            click: [520, 0.04, "sine"],
        };
        const [f, dur, wave] = map[type] || map.click;

        const o = audioCtx.createOscillator();
        const g = audioCtx.createGain();
        o.type = wave;
        o.frequency.setValueAtTime(f, t0);
        g.gain.setValueAtTime(0.0001, t0);
        g.gain.exponentialRampToValueAtTime(0.12, t0 + 0.01);
        g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
        o.connect(g).connect(audioCtx.destination);
        o.start(t0);
        o.stop(t0 + dur + 0.02);
    }

    // ---------- keyboard SVG ----------
    const keyEls = new Map(); // char -> rect

    function buildKeyboard() {
        const w = 720, h = 230;
        const pad = 14;
        const keyW = 48, keyH = 48;
        const gap = 10;

        let svg = `<svg viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">`;
        let y = pad;

        ROWS.forEach((row, r) => {
            const x0 = pad + (r * 22);
            let x = x0;
            row.forEach((ch, i) => {
                svg += `
          <g class="kG" data-ch="${ch}">
            <rect class="kKey" x="${x}" y="${y}" rx="12" ry="12" width="${keyW}" height="${keyH}"></rect>
            <text class="kText" x="${x + keyW / 2}" y="${y + keyH / 2 + 5}" text-anchor="middle">${ch}</text>
          </g>
        `;
                x += keyW + gap;
            });
            y += keyH + gap;
        });

        // add space key (virtual)
        svg += `
      <g class="kG" data-ch=" ">
        <rect class="kKey" x="180" y="184" rx="14" ry="14" width="360" height="40"></rect>
        <text class="kText" x="360" y="210" text-anchor="middle">пробіл</text>
      </g>
    `;

        svg += `</svg>`;
        kbHost.innerHTML = svg;

        keyEls.clear();
        kbHost.querySelectorAll(".kG").forEach(g => {
            const ch = g.getAttribute("data-ch");
            const rect = g.querySelector("rect");
            keyEls.set(ch, rect);
            g.style.cursor = "pointer";
            g.addEventListener("pointerdown", (e) => {
                e.preventDefault();
                processChar(ch, true);
                flashKey(ch, "hit");
                focusGhost();
            });
        });
    }

    function clearKeyFx() {
        keyEls.forEach(rect => rect.classList.remove("kGlow", "kHit", "kMiss"));
    }
    function flashKey(ch, kind) {
        const rect = keyEls.get(ch);
        if (!rect) return;
        rect.classList.remove("kHit", "kMiss");
        rect.classList.add("kGlow");
        rect.classList.add(kind === "miss" ? "kMiss" : "kHit");
        setTimeout(() => rect.classList.remove("kGlow", "kHit", "kMiss"), 140);
    }
    function highlightTarget(ch) {
        clearKeyFx();
        const rect = keyEls.get(ch);
        if (!rect) return;
        rect.classList.add("kGlow");
    }

    // ---------- game state ----------
    const state = {
        running: false,
        paused: false,

        level: 1,

        // time
        timeLeft: ROUND_SECONDS,
        startAt: 0,       // perf time when round started (adjusted for pause)
        lastAt: 0,
        pauseAt: 0,       // perf time when paused

        // stats
        totalKeys: 0,
        correctKeys: 0,
        correctChars: 0,
        errors: 0,
        stars: 0,
        streak: 0,
        mult: 1,

        // targets
        targets: [],
        lockId: null,     // IMPORTANT: lock-on target for comfort
        nextId: 1,

        // fx
        parts: [],
        confetti: [],
        shakeT: 0,

        // cat
        catY: 235,
        catVy: 0,

        // auto-next
        autoNextTimer: null,
        autoNextLeft: 0,
    };

    function resetRoundStats() {
        state.timeLeft = ROUND_SECONDS;
        state.totalKeys = 0;
        state.correctKeys = 0;
        state.correctChars = 0;
        state.errors = 0;
        state.stars = 0;
        state.streak = 0;
        state.mult = 1;

        state.targets.length = 0;
        state.parts.length = 0;
        state.confetti.length = 0;
        state.lockId = null;

        spawnIfNeeded.acc = 0;
        state.shakeT = 0;
        state.catY = 235;
        state.catVy = 0;

        setHeartsByErrors();
        setStars();
        streakText.textContent = "0";
        timeText.textContent = String(ROUND_SECONDS);
        timeBar.style.transform = "scaleX(1)";
    }

    // ---------- target creation ----------
    function makeTarget(levelDef) {
        const baseSpeed = 68; // px/s at level 1
        const sp = baseSpeed * Math.pow(1.05, state.level - 1);

        const lanes = [70, 120, 170, 220];
        const y = pick(lanes);

        let text = "а";
        const chars = levelDef.chars;

        if (levelDef.mode === "letters") {
            text = chars[(Math.random() * chars.length) | 0];
        } else if (levelDef.mode === "words") {
            let tries = 0;
            while (tries++ < 30) {
                const w = pick(WORDS);
                if ([...w].every(c => chars.includes(c))) { text = w; break; }
            }
            if (!text) text = chars[(Math.random() * chars.length) | 0];
        } else if (levelDef.mode === "sent") {
            text = pick(SENTENCES);
        } else { // mixed
            const r = Math.random();
            if (r < 0.55) text = pick(SENTENCES);
            else if (r < 0.93) text = pick(WORDS);
            else text = pick(["1", "2", "3", "4", "5", "!", "?"]);
        }

        if (text.length > 22) text = text.slice(0, 22);

        return {
            id: state.nextId++,
            text,
            typed: 0,
            x: VW + rnd(10, 80),
            y,
            speed: sp * (0.9 + Math.random() * 0.25),
            miss: false,
        };
    }

    function spawnIfNeeded(dt, levelDef) {
        const L = state.level;
        const base = levelDef.mode === "letters" ? 0.55 : (levelDef.mode === "words" ? 0.85 : 1.15);
        const rate = base / (1 + (L - 1) * 0.06);
        spawnIfNeeded.acc = (spawnIfNeeded.acc || 0) + dt;

        while (spawnIfNeeded.acc > rate) {
            spawnIfNeeded.acc -= rate;
            const limit = (levelDef.mode === "letters" ? 4 : 3);
            if (state.targets.length < limit) state.targets.push(makeTarget(levelDef));
        }
    }

    function getLockedTarget() {
        if (!state.lockId) return null;
        return state.targets.find(t => t.id === state.lockId) || null;
    }

    function leftMostTarget() {
        if (!state.targets.length) return null;
        let best = state.targets[0];
        for (let i = 1; i < state.targets.length; i++) {
            if (state.targets[i].x < best.x) best = state.targets[i];
        }
        return best;
    }

    // If not locked:
    // - If typed char matches next char of some target, choose the left-most among those.
    // - Else choose left-most target.
    function chooseTargetForChar(ch) {
        const locked = getLockedTarget();
        if (locked) return locked;

        let best = null;
        for (const t of state.targets) {
            const expected = t.text[t.typed];
            if (expected === ch) {
                if (!best || t.x < best.x) best = t;
            }
        }
        return best || leftMostTarget();
    }

    // ---------- particles ----------
    function burst(x, y, good = true) {
        const n = good ? 14 : 10;
        for (let i = 0; i < n; i++) {
            state.parts.push({
                x, y,
                vx: rnd(-90, 90),
                vy: rnd(-140, 40),
                life: rnd(0.25, 0.5),
                t: 0,
                good
            });
        }
    }

    function confetti(x, y) {
        for (let i = 0; i < 26; i++) {
            state.confetti.push({
                x, y,
                vx: rnd(-120, 120),
                vy: rnd(-220, -60),
                g: rnd(280, 420),
                r: rnd(0, Math.PI * 2),
                vr: rnd(-8, 8),
                life: rnd(0.7, 1.2),
                t: 0,
            });
        }
    }

    // ---------- drawing ----------
    function drawBG() {
        ctx.save();
        ctx.fillStyle = "rgba(0,0,0,0)";
        ctx.fillRect(0, 0, VW, VH);

        ctx.fillStyle = "rgba(0,0,0,.25)";
        ctx.fillRect(0, 248, VW, 52);

        ctx.strokeStyle = "rgba(255,255,255,.08)";
        ctx.lineWidth = 3;
        for (let i = 0; i < 5; i++) {
            ctx.beginPath();
            ctx.moveTo(i * 90 + 20, 0);
            ctx.bezierCurveTo(i * 90 + 10, 70, i * 90 + 60, 140, i * 90 + 30, 220);
            ctx.stroke();
        }

        ctx.fillStyle = "rgba(255,255,255,.06)";
        ctx.fillRect(18, 40, 10, 200);
        ctx.fillRect(372, 30, 10, 210);

        ctx.restore();
    }

    function roundRect(x, y, w, h, r, fill = true, stroke = true) {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.arcTo(x + w, y, x + w, y + h, r);
        ctx.arcTo(x + w, y + h, x, y + h, r);
        ctx.arcTo(x, y + h, x, y, r);
        ctx.arcTo(x, y, x + w, y, r);
        ctx.closePath();
        if (fill) ctx.fill();
        if (stroke) ctx.stroke();
    }

    function tri(x1, y1, x2, y2, x3, y3) {
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.lineTo(x3, y3);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
    }

    function drawCat() {
        const x = 70, y = state.catY;
        ctx.save();
        ctx.translate(x, y);

        ctx.fillStyle = "rgba(255,255,255,.10)";
        ctx.strokeStyle = "rgba(255,255,255,.20)";
        ctx.lineWidth = 2;

        roundRect(-18, -18, 44, 28, 10, true, true);
        roundRect(10, -30, 24, 24, 10, true, true);

        ctx.fillStyle = "rgba(255,255,255,.12)";
        tri(14, -30, 18, -42, 22, -30);
        tri(28, -30, 32, -42, 36, -30);

        ctx.fillStyle = "rgba(0,245,255,.70)";
        ctx.fillRect(18, -22, 4, 4);
        ctx.fillRect(30, -22, 4, 4);

        ctx.strokeStyle = "rgba(255,43,214,.35)";
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(-18, -6);
        ctx.quadraticCurveTo(-30, -20, -10, -30);
        ctx.stroke();

        ctx.restore();
    }

    function drawLanes() {
        ctx.save();
        ctx.strokeStyle = "rgba(255,255,255,.06)";
        ctx.lineWidth = 2;
        [70, 120, 170, 220].forEach(y => {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(VW, y);
            ctx.stroke();
        });
        ctx.restore();
    }

    function drawTargets() {
        const locked = getLockedTarget();

        state.targets.forEach(t => {
            const isActive = locked ? (t.id === locked.id) : (t === leftMostTarget());
            const typed = t.text.slice(0, t.typed);
            const rest = t.text.slice(t.typed);

            ctx.save();
            ctx.translate(t.x, t.y);

            const w = Math.max(36, 12 + t.text.length * 10);
            const h = 34;

            ctx.fillStyle = isActive ? "rgba(255,255,255,.10)" : "rgba(0,0,0,.18)";
            ctx.strokeStyle = t.miss ? "rgba(255,59,59,.55)" : (isActive ? "rgba(0,245,255,.55)" : "rgba(255,255,255,.16)");
            ctx.lineWidth = 2;
            roundRect(-w / 2, -h / 2, w, h, 12, true, true);

            ctx.font = "800 16px system-ui, sans-serif";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";

            ctx.fillStyle = "rgba(60,255,134,.95)";
            ctx.fillText(typed, -rest.length * 4.8, 0);

            ctx.fillStyle = t.miss ? "rgba(255,59,59,.95)" : "rgba(233,241,255,.90)";
            ctx.fillText(rest, typed.length * 4.8, 0);

            ctx.restore();
        });
    }

    function drawParticles(dt) {
        for (let i = state.parts.length - 1; i >= 0; i--) {
            const p = state.parts[i];
            p.t += dt;
            if (p.t >= p.life) { state.parts.splice(i, 1); continue; }
            p.vy += 360 * dt;
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            const k = 1 - p.t / p.life;
            ctx.globalAlpha = k;
            ctx.fillStyle = p.good ? "rgba(60,255,134,.85)" : "rgba(255,59,59,.85)";
            ctx.fillRect(p.x, p.y, 3, 3);
            ctx.globalAlpha = 1;
        }

        for (let i = state.confetti.length - 1; i >= 0; i--) {
            const c = state.confetti[i];
            c.t += dt;
            if (c.t >= c.life) { state.confetti.splice(i, 1); continue; }
            c.vy += c.g * dt;
            c.x += c.vx * dt;
            c.y += c.vy * dt;
            c.r += c.vr * dt;
            const k = 1 - c.t / c.life;
            ctx.globalAlpha = k;

            ctx.fillStyle = (i % 3 === 0) ? "rgba(0,245,255,.9)" : (i % 3 === 1 ? "rgba(255,43,214,.9)" : "rgba(255,230,0,.9)");
            ctx.save();
            ctx.translate(c.x, c.y);
            ctx.rotate(c.r);
            ctx.fillRect(-3, -2, 7, 4);
            ctx.restore();
            ctx.globalAlpha = 1;
        }
    }

    function render(dt) {
        let sx = 0, sy = 0;
        if (state.shakeT > 0) {
            state.shakeT -= dt;
            sx = rnd(-3, 3);
            sy = rnd(-2, 2);
        }

        ctx.save();
        ctx.clearRect(0, 0, VW, VH);
        ctx.translate(sx, sy);

        drawBG();
        drawLanes();
        drawCat();
        drawTargets();
        drawParticles(dt);

        ctx.restore();
    }

    // ---------- UI hearts/stars ----------
    function setHeartsByErrors() {
        const left = clamp(3 - Math.floor(state.errors / 4), 0, 3);
        heartsHost.innerHTML = "";
        for (let i = 0; i < 3; i++) {
            const s = document.createElement("span");
            s.textContent = i < left ? "❤️" : "🖤";
            heartsHost.appendChild(s);
        }
    }
    function setStars() {
        starsHost.innerHTML = "";
        const n = clamp(state.stars, 0, 6);
        for (let i = 0; i < 6; i++) {
            const s = document.createElement("span");
            s.textContent = i < n ? "⭐" : "✦";
            starsHost.appendChild(s);
        }
    }

    // ---------- stats ----------
    function calcLiveStats() {
        const elapsed = ROUND_SECONDS - state.timeLeft;
        const minutes = Math.max(1 / 60, elapsed / 60);
        const cpm = Math.round(state.correctChars / minutes);
        const wpm = Math.round((state.correctChars / 5) / minutes);
        const acc = state.totalKeys > 0 ? Math.round((state.correctKeys / state.totalKeys) * 100) : 100;
        return { wpm, cpm, acc };
    }
    function updateStatsUI() {
        const { wpm, cpm, acc } = calcLiveStats();
        wpmText.textContent = String(wpm);
        cpmText.textContent = String(cpm);
        accText.textContent = `${acc}%`;
    }

    // ---------- pause logic (FIXED) ----------
    function togglePause() {
        if (!state.running) return;
        if (!state.paused) {
            state.paused = true;
            state.pauseAt = performance.now();
            showToast("⏸ Пауза");
            beep("click");
        } else {
            state.paused = false;
            // compensate start time so elapsed ignores pause duration
            const pausedFor = performance.now() - state.pauseAt;
            state.startAt += pausedFor;
            state.pauseAt = 0;
            showToast("▶ Продовжити");
            beep("click");
        }
    }

    // ---------- kb visibility mode ----------
    function isKbVisibleForLevel(levelDef) {
        if (profile.kbMode === "show") return true;
        if (profile.kbMode === "hide") return false;
        return !!levelDef.hint;
    }
    function applyKbModeUI() {
        kbModeText.textContent = profile.kbMode === "auto" ? "Авто" : (profile.kbMode === "show" ? "Вкл" : "Викл");
        btnKbMode.setAttribute("aria-pressed", profile.kbMode !== "auto" ? "true" : "false");
    }

    // ---------- input normalization (BIG improvement) ----------
    function normalizeInput(e) {
        // 1) physical key mapping to UA positions
        if (CODE2UA.has(e.code)) return CODE2UA.get(e.code);
        // 2) fallback to actual key
        if (e.key && e.key.length === 1) {
            const ch = e.key.toLowerCase();
            if (ch === "’" || ch === "'" || ch === "´") return "";
            return ch;
        }
        return "";
    }

    // ---------- gameplay: process char ----------
    function processChar(ch, fromVirtual = false) {
        if (!state.running || state.paused) return;
        if (!ch) return;

        const t = chooseTargetForChar(ch);
        if (!t) return;

        // expected char
        const expected = t.text[t.typed];

        state.totalKeys++;

        if (ch === expected) {
            state.correctKeys++;
            state.correctChars++;
            t.typed++;

            // lock-on on first correct char (comfort)
            if (!state.lockId) state.lockId = t.id;

            state.streak++;
            if (state.streak > 0 && state.streak % 10 === 0) {
                state.mult = 2;
                state.stars += 2;
                beep("bonus");
                confetti(200, 70);
                showToast("🔥 Стрик 10! x2 бонус");
            }

            if (t.typed >= t.text.length) {
                const bx = clamp(t.x, 40, VW - 40);
                burst(bx, t.y, true);
                confetti(bx, t.y);
                beep("hit");
                state.stars += (t.text.length === 1 ? 1 : 2);

                state.catVy = -320;

                // remove completed
                state.targets = state.targets.filter(x => x.id !== t.id);
                // unlock lock
                state.lockId = null;

                if (state.streak % 10 !== 0) state.mult = 1;
            } else {
                beep("click");
            }

            setStars();
            streakText.textContent = String(state.streak);
            if (!fromVirtual) flashKey(ch, "hit");
        } else {
            // wrong
            state.errors++;
            state.streak = 0;
            state.mult = 1;
            t.miss = true;
            state.shakeT = 0.16;
            beep("miss");
            if (!fromVirtual) flashKey(ch, "miss");

            burst(clamp(t.x, 40, VW - 40), t.y, false);
            setHeartsByErrors();
            streakText.textContent = "0";

            // if locked and you fail: unlock to reduce frustration
            state.lockId = null;
        }
    }

    // ---------- keyboard highlight / hints ----------
    function updateHints(levelDef) {
        const locked = getLockedTarget();
        const base = locked || leftMostTarget();

        if (!base) {
            targetHint.textContent = "Ціль: —";
            fingerHint.textContent = "Підказка пальця: —";
            clearKeyFx();
            return;
        }

        const nextCh = base.text[base.typed] || "";
        targetHint.textContent = `Ціль: ${base.text}  (введено: ${base.typed}/${base.text.length})`;

        if (isKbVisibleForLevel(levelDef) && nextCh) highlightTarget(nextCh);
        else clearKeyFx();

        fingerHint.textContent = `Підказка пальця: ${fingerMap.get(nextCh) || "—"}`;
    }

    // ---------- round control ----------
    function reqLineForLevel(levelDef) {
        return `Вимоги: точність ≥ ${levelDef.acc}% • швидкість ≥ ${levelDef.wpm} WPM • режим: ${levelDef.mode.toUpperCase()}`;
    }

    function setLevel(n) {
        state.level = clamp(n, 1, 12);
        const def = LEVELS[state.level - 1];
        lvlText.textContent = `${state.level}/12`;
        lvlName.textContent = def.name;
        reqText.textContent = reqLineForLevel(def);
        kbWrap.classList.toggle("hidden", !isKbVisibleForLevel(def));
    }

    function focusGhost() {
        ghost.focus({ preventScroll: true });
    }

    function startRound() {
        clearAutoNext();

        const def = LEVELS[state.level - 1];
        kbWrap.classList.toggle("hidden", !isKbVisibleForLevel(def));

        resetRoundStats();

        state.running = true;
        state.paused = false;

        state.startAt = performance.now();
        state.lastAt = state.startAt;

        overlay.classList.add("hidden");
        btnNext.disabled = state.level >= 12;

        reqText.textContent = reqLineForLevel(def);

        focusGhost();
        showToast(`▶ ${def.name}`);
        beep("level");
    }

    function quitRound() {
        clearAutoNext();
        if (!state.running) return;
        state.running = false;
        state.paused = false;

        overlay.classList.remove("hidden");
        ovTitle.textContent = "⏹ Раунд зупинено";
        ovBody.textContent = "Можеш почати знову коли захочеш 🙂";
        reqText.textContent = reqLineForLevel(LEVELS[state.level - 1]);
        beep("click");
    }

    function clearAutoNext() {
        if (state.autoNextTimer) {
            clearInterval(state.autoNextTimer);
            state.autoNextTimer = null;
            state.autoNextLeft = 0;
        }
    }

    function scheduleAutoNext() {
        clearAutoNext();
        state.autoNextLeft = 2; // seconds
        state.autoNextTimer = setInterval(() => {
            state.autoNextLeft--;
            // update overlay message (keep short)
            reqText.textContent = `✅ Автоперехід через ${Math.max(0, state.autoNextLeft)}…  •  ${reqLineForLevel(LEVELS[state.level - 1])}`;
            if (state.autoNextLeft <= 0) {
                clearAutoNext();
                if (state.level < 12) {
                    setLevel(state.level + 1);
                    startRound();
                }
            }
        }, 1000);
    }

    function finishRound() {
        state.running = false;
        state.paused = false;

        const def = LEVELS[state.level - 1];
        const minutes = ROUND_SECONDS / 60;
        const wpm = Math.round((state.correctChars / 5) / minutes);
        const acc = state.totalKeys > 0 ? Math.round((state.correctKeys / state.totalKeys) * 100) : 100;
        const pass = (acc >= def.acc) && (wpm >= def.wpm);

        if (wpm > profile.bestWpm) {
            profile.bestWpm = wpm;
            saveProfile();
        }
        bestText.textContent = profile.bestWpm ? `${profile.bestWpm} WPM` : "—";

        overlay.classList.remove("hidden");

        if (pass) {
            ovTitle.textContent = "✅ Рівень пройдено!";
            ovBody.innerHTML =
                `Результат: <b>${wpm} WPM</b>, точність: <b>${acc}%</b>.<br/>` +
                `Котик каже: <b>Блискуче!</b> Наступний рівень — автоматично 🚀`;
            confetti(200, 90);
            beep("level");

            if (state.level < 12) {
                profile.unlocked = Math.max(profile.unlocked, state.level + 1);
                saveProfile();
                btnNext.disabled = false;
                scheduleAutoNext(); // IMPORTANT: auto transition
            } else {
                btnNext.disabled = true;
                reqText.textContent = "🏁 Це був останній рівень. Можеш перепройти для рекорду!";
            }
        } else {
            ovTitle.textContent = "🟡 Спробуй ще раз!";
            ovBody.innerHTML =
                `Результат: <b>${wpm} WPM</b>, точність: <b>${acc}%</b>.<br/>` +
                `Котик каже: <b>Без стресу</b> — ще одна спроба і буде супер 💪`;
            beep("miss");
            btnNext.disabled = true;
            reqText.textContent = reqLineForLevel(def);
        }
    }

    // ---------- certificate ----------
    function exportCertificatePNG() {
        const w = 900, h = 540;
        const c = document.createElement("canvas");
        c.width = w; c.height = h;
        const g = c.getContext("2d");

        const minutes = ROUND_SECONDS / 60;
        const wpm = Math.round((state.correctChars / 5) / minutes);
        const acc = state.totalKeys > 0 ? Math.round((state.correctKeys / state.totalKeys) * 100) : 100;

        g.fillStyle = "#0b1020";
        g.fillRect(0, 0, w, h);

        g.fillStyle = "rgba(0,245,255,.16)";
        g.beginPath(); g.arc(160, 140, 220, 0, Math.PI * 2); g.fill();
        g.fillStyle = "rgba(255,43,214,.12)";
        g.beginPath(); g.arc(760, 160, 240, 0, Math.PI * 2); g.fill();
        g.fillStyle = "rgba(255,230,0,.10)";
        g.beginPath(); g.arc(520, 480, 260, 0, Math.PI * 2); g.fill();

        g.strokeStyle = "rgba(255,255,255,.28)";
        g.lineWidth = 8;
        rr(26, 26, w - 52, h - 52, 28); g.stroke();

        g.fillStyle = "rgba(233,241,255,.95)";
        g.font = "900 46px system-ui, sans-serif";
        g.textAlign = "center";
        g.fillText("Сертифікат друку", w / 2, 140);

        g.font = "700 22px system-ui, sans-serif";
        g.fillStyle = "rgba(233,241,255,.78)";
        g.fillText("КлавСпринт Kids • ЙЦУКЕН", w / 2, 180);

        g.fillStyle = "rgba(15,23,48,.86)";
        g.strokeStyle = "rgba(255,255,255,.18)";
        g.lineWidth = 4;
        rr(170, 230, w - 340, 190, 22); g.fill(); g.stroke();

        g.fillStyle = "rgba(233,241,255,.95)";
        g.font = "800 30px system-ui, sans-serif";
        g.fillText(`Рівень: ${state.level}/12`, w / 2, 290);
        g.fillText(`WPM: ${wpm}   •   Точність: ${acc}%`, w / 2, 340);

        g.font = "700 20px system-ui, sans-serif";
        g.fillStyle = "rgba(233,241,255,.75)";
        const d = new Date();
        g.fillText(`Дата: ${d.toLocaleDateString("uk-UA")}`, w / 2, 390);

        g.fillStyle = "rgba(60,255,134,.85)";
        g.font = "900 26px system-ui, sans-serif";
        g.fillText("🐾 Котик підтверджує!", w / 2, 450);

        const a = document.createElement("a");
        a.href = c.toDataURL("image/png");
        a.download = `klavsprint-certificate-level${state.level}.png`;
        a.click();
        beep("level");

        function rr(x, y, w, h, r) {
            g.beginPath();
            g.moveTo(x + r, y);
            g.arcTo(x + w, y, x + w, y + h, r);
            g.arcTo(x + w, y + h, x, y + h, r);
            g.arcTo(x, y + h, x, y, r);
            g.arcTo(x, y, x + w, y, r);
            g.closePath();
        }
    }

    // ---------- main loop ----------
    function tick(t) {
        requestAnimationFrame(tick);

        const dt = clamp((t - state.lastAt) / 1000, 0, 0.05);
        state.lastAt = t;

        // cat physics always (nice idle)
        state.catVy += 520 * dt;
        state.catY += state.catVy * dt;
        if (state.catY > 235) { state.catY = 235; state.catVy = 0; }

        if (!state.running) {
            render(dt);
            return;
        }
        if (state.paused) {
            render(dt);
            return;
        }

        const def = LEVELS[state.level - 1];

        // timer
        const elapsed = (t - state.startAt) / 1000;
        state.timeLeft = clamp(ROUND_SECONDS - elapsed, 0, ROUND_SECONDS);
        timeText.textContent = String(Math.ceil(state.timeLeft));

        // time progress bar
        const k = clamp(state.timeLeft / ROUND_SECONDS, 0, 1);
        timeBar.style.transform = `scaleX(${k})`;

        // spawn/move
        spawnIfNeeded(dt, def);

        for (let i = state.targets.length - 1; i >= 0; i--) {
            const tg = state.targets[i];
            tg.x -= tg.speed * dt;

            if (tg.x < -40) {
                if (tg.typed < tg.text.length) {
                    tg.miss = true;
                    state.errors++;
                    state.streak = 0;
                    state.mult = 1;
                    state.lockId = null;
                    setHeartsByErrors();
                    beep("miss");
                    burst(60, tg.y, false);
                    state.shakeT = 0.14;
                }
                state.targets.splice(i, 1);
            }
        }

        updateStatsUI();
        updateHints(def);
        render(dt);

        if (state.timeLeft <= 0) finishRound();
    }

    // ---------- UI bindings ----------
    function applyTheme(t) {
        app.dataset.theme = t;
        themeSel.value = t;
        profile.theme = t;
        saveProfile();
    }
    function applySound(on) {
        profile.sound = on;
        btnSound.setAttribute("aria-pressed", on ? "true" : "false");
        btnSound.textContent = on ? "🔊 Звук" : "🔈 Звук";
        saveProfile();
    }
    function applyContrast(on) {
        profile.contrast = on;
        btnContrast.setAttribute("aria-pressed", on ? "true" : "false");
        app.classList.toggle("hc", on);
        saveProfile();
    }
    function cycleKbMode() {
        profile.kbMode = (profile.kbMode === "auto") ? "show" : (profile.kbMode === "show" ? "hide" : "auto");
        applyKbModeUI();
        saveProfile();
        kbWrap.classList.toggle("hidden", !isKbVisibleForLevel(LEVELS[state.level - 1]));
    }

    btnStart.addEventListener("click", () => { beep("click"); startRound(); });
    btnReplay.addEventListener("click", () => { beep("click"); startRound(); });
    btnStay.addEventListener("click", () => {
        beep("click");
        clearAutoNext();
        reqText.textContent = reqLineForLevel(LEVELS[state.level - 1]);
        showToast("🧷 Автоперехід скасовано");
    });
    btnNext.addEventListener("click", () => {
        beep("click");
        clearAutoNext();
        if (state.level < 12) { setLevel(state.level + 1); startRound(); }
    });
    btnPause.addEventListener("click", () => togglePause());
    btnQuit.addEventListener("click", () => quitRound());
    btnCert.addEventListener("click", () => exportCertificatePNG());

    btnSound.addEventListener("click", () => applySound(!profile.sound));
    btnKbMode.addEventListener("click", () => cycleKbMode());
    btnContrast.addEventListener("click", () => applyContrast(!profile.contrast));
    themeSel.addEventListener("change", () => applyTheme(themeSel.value));

    btnReset.addEventListener("click", () => {
        beep("click");
        if (!confirm("Скинути прогрес і рекорд?")) return;
        localStorage.removeItem(LS_KEY);
        Object.assign(profile, loadProfile());
        applyTheme(profile.theme);
        applySound(profile.sound);
        applyContrast(profile.contrast);
        applyKbModeUI();
        setLevel(1);
        bestText.textContent = "—";
        showToast("↺ Скинуто");
    });

    // ESC pause + typing
    window.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
            togglePause();
            e.preventDefault();
            return;
        }
        if (!state.running) return;

        if (e.code === "Space") e.preventDefault(); // prevent scroll

        const ch = normalizeInput(e);
        if (ch) processChar(ch, false);
    }, { passive: false });

    // keep focus for mobile
    ["pointerdown", "touchstart", "mousedown"].forEach(ev => {
        document.addEventListener(ev, () => focusGhost(), { passive: true });
    });

    // ---------- init ----------
    function init() {
        buildKeyboard();

        applyTheme(profile.theme);
        applySound(profile.sound);
        applyContrast(profile.contrast);
        applyKbModeUI();

        setLevel(profile.unlocked);
        bestText.textContent = profile.bestWpm ? `${profile.bestWpm} WPM` : "—";

        overlay.classList.remove("hidden");
        ovTitle.textContent = "КлавСпринт Kids";
        ovBody.innerHTML =
            `Друкуй те, що летить справа наліво. <br/>` +
            `Працює навіть якщо в системі випадково <b>англійська</b> розкладка (важлива позиція клавіші).<br/>` +
            `<span class="muted">Пауза: Esc • Підказки клавіатури: Авто/Вкл/Викл</span>`;
        reqText.textContent = reqLineForLevel(LEVELS[state.level - 1]);

        setHeartsByErrors();
        setStars();

        state.lastAt = performance.now();
        requestAnimationFrame(tick);

        focusGhost();
    }

    init();

})();