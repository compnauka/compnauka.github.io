(() => {
    'use strict';

    // ===== DOM =====
    const canvas = document.getElementById('game-canvas');
    const ctx = canvas.getContext('2d');

    const overlay = document.getElementById('overlay');
    const overlayTitle = document.getElementById('overlay-title');
    const overlayMsg = document.getElementById('overlay-message');
    const overlayActions = document.getElementById('overlay-actions');
    const overlayFooter = document.getElementById('overlay-footer');

    const menuBtn = document.getElementById('menu-btn');

    const levelNumEl = document.getElementById('level-num');
    const levelTotalEl = document.getElementById('level-total');
    const modeNameEl = document.getElementById('mode-name');
    const starsNowEl = document.getElementById('stars-now');
    const starsNeedEl = document.getElementById('stars-need');
    const livesWrapEl = document.getElementById('lives-wrap');
    const sessionsLeftEl = document.getElementById('sessions-left');

    const toastEl = document.getElementById('toast');

    const confettiCanvas = document.getElementById('confetti-canvas');
    const cCtx = confettiCanvas.getContext('2d');

    // ===== GAME CONSTANTS =====
    const COLS = 15;
    const ROWS = 10;
    const CELL = 40;
    const LOGICAL_W = COLS * CELL; // 600
    const LOGICAL_H = ROWS * CELL; // 400

    const CUP_ICON = "🏆";
    const STAR_ICON = "⭐";
    const HERO_ICON = "\uf0d0"; // Font Awesome wand

    // “Кількість ігрових сесій обмежена”
    const MAX_SESSIONS_PER_DAY = 12;
    const STORAGE_SESSIONS = 'maze_sessions_v3';
    const STORAGE_STATS = 'maze_stats_v3';

    // Beginner має ~1.5× “ширші ходи”:
    // робимо це чесно через hitboxScale (менша колізія => більше простору для помилки)
    const MODES = {
        beginner: { key: 'beginner', label: 'Початківець', levelCount: 5, lives: 3, starsPerLevel: 2, wallInset: 10, hitboxScale: 0.67 },
        master: { key: 'master', label: 'Майстер', levelCount: 10, lives: 5, starsPerLevel: 3, wallInset: 4, hitboxScale: 1.00 },
        free: { key: 'free', label: 'Вільний режим', levelCount: 10, lives: Infinity, starsPerLevel: 3, wallInset: 6, hitboxScale: 0.85 }
    };

    // ===== LEVEL SETS =====
    // 5 дитячих рівнів (6–7 років): широкі коридори/менше різких поворотів/більші “кімнати”.
    const BEGINNER_LEVELS = [
        // 1) Дуже проста пряма (2 ряди коридору)
        [
            "111111111111111",
            "111111111111111",
            "111111111111111",
            "111111111111111",
            "1S00000000000E1",
            "100000000000001",
            "111111111111111",
            "111111111111111",
            "111111111111111",
            "111111111111111",
        ],
        // 2) М’який поворот (широкий L)
        [
            "111111111111111",
            "111111111111111",
            "1S0000000001111",
            "100000000001111",
            "111111111001111",
            "111111111001111",
            "111111111001111",
            "1111111110000E1",
            "111111111000001",
            "111111111111111",
        ],
        // 3) U-подібний маршрут (широка “рамка”)
        [
            "111111111111111",
            "1S0111111111111",
            "1001111111110E1",
            "100111111111001",
            "100111111111001",
            "100111111111001",
            "100111111111001",
            "100000000000001",
            "100000000000001",
            "111111111111111",
        ],
        // 4) Велика кімната з “парканчиком” і проходом
        [
            "111111111111111",
            "1S0000000000001",
            "100000010000001",
            "100000010000001",
            "100000010000001",
            "100000000000001",
            "100000010000001",
            "100000010000001",
            "1000000000000E1",
            "111111111111111",
        ],
        // 5) Широка “рамка” навколо центру (спокійний обхід)
        [
            "111111111111111",
            "1S0000000000001",
            "100000000000001",
            "100111111111001",
            "100111111111001",
            "100111111111001",
            "100111111111001",
            "100000000000001",
            "1000000000000E1",
            "111111111111111",
        ]
    ];

    // 10 оригінальних рівнів = Майстер + Вільний режим
    const MASTER_LEVELS = [
        [
            "111111111111111",
            "111111111111111",
            "111111111111111",
            "1S00000000000E1",
            "111111111111111",
            "111111111111111",
            "111111111111111",
            "111111111111111",
            "111111111111111",
            "111111111111111",
        ],
        [
            "111111111111111",
            "111111111111111",
            "1S0000001111111",
            "111111101111111",
            "111111101111111",
            "1111111000000E1",
            "111111111111111",
            "111111111111111",
            "111111111111111",
            "111111111111111",
        ],
        [
            "111111111111111",
            "111111111111111",
            "1S0011111111111",
            "111001111111111",
            "111100111111111",
            "111110011111111",
            "111111001111111",
            "1111111000000E1",
            "111111111111111",
            "111111111111111",
        ],
        [
            "111111111111111",
            "111111111111111",
            "1S00000100000E1",
            "111111010111111",
            "111111010111111",
            "111111010111111",
            "111111000111111",
            "111111111111111",
            "111111111111111",
            "111111111111111",
        ],
        [
            "111111111111111",
            "1S0001111111111",
            "111101111111111",
            "111100000111111",
            "111111110111111",
            "111111110111111",
            "111111110000011",
            "111111111111011",
            "1111111111110E1",
            "111111111111111",
        ],
        [
            "111111111111111",
            "111111111111111",
            "1S0000011111111",
            "111111000001111",
            "111111111101111",
            "111000000001111",
            "111011111111111",
            "1110000000000E1",
            "111111111111111",
            "111111111111111",
        ],
        [
            "111111111111111",
            "1S0011100000011",
            "111011101111011",
            "111000001111001",
            "111111111111101",
            "110000000000001",
            "110111111111111",
            "1100000000000E1",
            "111111111111111",
            "111111111111111",
        ],
        [
            "111111111111111",
            "1S0000000000111",
            "111111111110111",
            "111000000010111",
            "111011111010111",
            "11101E000010111",
            "111011111110111",
            "111000000000111",
            "111111111111111",
            "111111111111111",
        ],
        [
            "111111111111111",
            "1S0000111111111",
            "111110111111111",
            "111110000000001",
            "100011111111101",
            "101000000000001",
            "101111111111111",
            "100000000011111",
            "1111111110000E1",
            "111111111111111",
        ],
        [
            "111111111111111",
            "1S0001100000111",
            "1111011011101E1",
            "110001101110101",
            "110111101110101",
            "110111100010101",
            "110000111010101",
            "111110111010001",
            "111110000011111",
            "111111111111111",
        ]
    ];

    function activeLevels() {
        if (!mode) return MASTER_LEVELS;
        return mode.key === 'beginner' ? BEGINNER_LEVELS : MASTER_LEVELS;
    }

    // ===== STATE =====
    let gameState = 'menu'; // menu | playing | overlay
    let mode = null;
    let currentLevel = 0;

    let grid = [];
    let isDragging = false;

    const player = { x: 0, y: 0, r: 12 };
    let startPos = { x: 0, y: 0 };
    let endPos = { x: 0, y: 0 };
    let startCell = { c: 0, r: 0 };
    let endCell = { c: 0, r: 0 };

    let stars = [];
    let starsCollected = 0;
    let livesLeft = Infinity;

    let sessionStars = 0;
    let sessionStartMs = 0;

    // Confetti
    let confetti = [];
    let confettiAnimId = null;

    // Canvas scaling
    let scaleX = 1;
    let scaleY = 1;

    // ===== UTIL =====
    const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

    function localISODate() {
        const s = new Date().toLocaleDateString('en-CA');
        if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    }

    function loadSessions() {
        const today = localISODate();
        let data = null;
        try { data = JSON.parse(localStorage.getItem(STORAGE_SESSIONS) || 'null'); } catch { data = null; }
        if (!data || data.date !== today) data = { date: today, used: 0 };
        return data;
    }

    function saveSessions(data) { localStorage.setItem(STORAGE_SESSIONS, JSON.stringify(data)); }
    function sessionsLeft() { const s = loadSessions(); return Math.max(0, MAX_SESSIONS_PER_DAY - (s.used || 0)); }
    function consumeSession() { const s = loadSessions(); s.used = (s.used || 0) + 1; saveSessions(s); }

    function loadStats() {
        let data = null;
        try { data = JSON.parse(localStorage.getItem(STORAGE_STATS) || 'null'); } catch { data = null; }
        if (!data) data = { totalStars: 0 };
        if (typeof data.totalStars !== 'number') data.totalStars = 0;
        return data;
    }
    function saveStats(data) { localStorage.setItem(STORAGE_STATS, JSON.stringify(data)); }

    function toast(msg) {
        toastEl.textContent = msg;
        toastEl.classList.remove('hidden');
        clearTimeout(toast._t);
        toast._t = setTimeout(() => toastEl.classList.add('hidden'), 1400);
    }

    function makeBtn(text, className, onClick) {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = className;
        b.textContent = text;
        b.addEventListener('click', onClick);
        return b;
    }

    function showOverlay(title, msg, actions = [], footer = '') {
        overlayTitle.textContent = title;
        overlayMsg.textContent = msg;
        overlayFooter.textContent = footer;

        overlayActions.innerHTML = '';
        actions.forEach(a => overlayActions.appendChild(a));

        overlay.classList.remove('opacity-0', 'pointer-events-none');
        overlay.classList.add('opacity-100', 'pointer-events-auto');
        gameState = 'overlay';
    }

    function hideOverlay() {
        overlay.classList.remove('opacity-100', 'pointer-events-auto');
        overlay.classList.add('opacity-0', 'pointer-events-none');
        gameState = mode ? 'playing' : 'menu';
    }

    // ===== CANVAS DPR SCALE =====
    function fitCanvasToCSS() {
        const rect = canvas.getBoundingClientRect();
        const dpr = Math.max(1, window.devicePixelRatio || 1);

        const cssW = rect.width;
        const cssH = rect.height;

        canvas.width = Math.round(cssW * dpr);
        canvas.height = Math.round(cssH * dpr);

        scaleX = (cssW / LOGICAL_W);
        scaleY = (cssH / LOGICAL_H);

        ctx.setTransform(dpr * scaleX, 0, 0, dpr * scaleY, 0, 0);
        ctx.imageSmoothingEnabled = true;
    }

    function getPointerPos(e) {
        const rect = canvas.getBoundingClientRect();
        const lx = (e.clientX - rect.left) / rect.width * LOGICAL_W;
        const ly = (e.clientY - rect.top) / rect.height * LOGICAL_H;
        return { x: lx, y: ly };
    }

    // deterministic PRNG
    function mulberry32(seed) {
        return function () {
            let t = seed += 0x6D2B79F5;
            t = Math.imul(t ^ (t >>> 15), t | 1);
            t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
            return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
        };
    }
    function seedFor(levelIndex, modeKey) {
        let s = 0;
        const str = `${modeKey}:${levelIndex}:stars:v3`;
        for (let i = 0; i < str.length; i++) s = (s * 31 + str.charCodeAt(i)) >>> 0;
        return s;
    }

    // ===== HUD =====
    function updateSessionsUI() { sessionsLeftEl.textContent = String(sessionsLeft()); }

    function updateHud() {
        if (!mode) {
            modeNameEl.textContent = '—';
            levelNumEl.textContent = '—';
            levelTotalEl.textContent = '—';
            starsNowEl.textContent = '0';
            starsNeedEl.textContent = '0';
            livesWrapEl.textContent = '—';
            updateSessionsUI();
            return;
        }

        modeNameEl.textContent = mode.label;
        levelNumEl.textContent = String(currentLevel + 1);
        levelTotalEl.textContent = String(mode.levelCount);

        starsNowEl.textContent = String(starsCollected);
        starsNeedEl.textContent = String(stars.length);

        livesWrapEl.textContent = (mode.lives === Infinity) ? '∞' : `${livesLeft}/${mode.lives}`;
        updateSessionsUI();
    }

    // ===== GRID HELPERS =====
    function isWallCell(r, c) { return grid[r][c] === '1'; }
    function isOpenCell(r, c) { return grid[r][c] !== '1'; }
    function cellCenter(r, c) { return { x: c * CELL + CELL / 2, y: r * CELL + CELL / 2 }; }

    function findSE() {
        for (let r = 0; r < ROWS; r++) {
            for (let c = 0; c < COLS; c++) {
                const cell = grid[r][c];
                if (cell === 'S') { startCell = { r, c }; startPos = cellCenter(r, c); }
                if (cell === 'E') { endCell = { r, c }; endPos = cellCenter(r, c); }
            }
        }
    }

    // BFS reachable open cells from start (гарантує, що ⭐ завжди досяжні)
    function computeReachable() {
        const q = [];
        const seen = Array.from({ length: ROWS }, () => Array(COLS).fill(false));

        q.push(startCell);
        seen[startCell.r][startCell.c] = true;

        const reachable = [];
        reachable.push({ r: startCell.r, c: startCell.c });

        const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];

        while (q.length) {
            const cur = q.shift();
            for (const [dr, dc] of dirs) {
                const nr = cur.r + dr, nc = cur.c + dc;
                if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS) continue;
                if (seen[nr][nc]) continue;
                if (!isOpenCell(nr, nc)) continue;
                seen[nr][nc] = true;
                q.push({ r: nr, c: nc });
                reachable.push({ r: nr, c: nc });
            }
        }
        return { seen, reachable };
    }

    // ===== STARS (guaranteed reachable) =====
    function generateStars(levelIndex) {
        const { reachable } = computeReachable();
        const rng = mulberry32(seedFor(levelIndex, mode.key));
        const need = mode.starsPerLevel;

        // кандидати: тільки reachable, але не близько до S/E
        const candidates = [];
        for (const cell of reachable) {
            if (cell.r === startCell.r && cell.c === startCell.c) continue;
            if (cell.r === endCell.r && cell.c === endCell.c) continue;

            const p = cellCenter(cell.r, cell.c);
            const ds = Math.hypot(p.x - startPos.x, p.y - startPos.y);
            const de = Math.hypot(p.x - endPos.x, p.y - endPos.y);
            if (ds < CELL * 2.0) continue;
            if (de < CELL * 1.6) continue;

            candidates.push({ r: cell.r, c: cell.c, x: p.x, y: p.y });
        }

        // shuffle deterministically
        for (let i = candidates.length - 1; i > 0; i--) {
            const j = Math.floor(rng() * (i + 1));
            [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
        }

        const out = [];
        const minDist = CELL * 1.5;

        for (const cand of candidates) {
            if (out.length >= need) break;
            const ok = out.every(s => Math.hypot(s.x - cand.x, s.y - cand.y) >= minDist);
            if (!ok) continue;
            out.push({ x: cand.x, y: cand.y, r: 12, collected: false });
        }

        // fallback
        let k = 0;
        while (out.length < need && k < candidates.length) {
            const cand = candidates[k++];
            if (out.some(s => s.x === cand.x && s.y === cand.y)) continue;
            out.push({ x: cand.x, y: cand.y, r: 12, collected: false });
        }

        stars = out;
        starsCollected = 0;
    }

    function checkStarPickup() {
        for (const s of stars) {
            if (s.collected) continue;
            const d = Math.hypot(player.x - s.x, player.y - s.y);
            if (d <= player.r + s.r - 2) {
                s.collected = true;
                starsCollected++;
                sessionStars++;
                updateHud();
                toast(`+1 ⭐ (${starsCollected}/${stars.length})`);
                if (starsCollected === stars.length) toast("Кубок відкрито! 🏆");
                break;
            }
        }
    }

    // ===== RENDER =====
    function drawWallCell(x, y, inset) {
        const rx = x + inset;
        const ry = y + inset;
        const rw = CELL - inset * 2;
        const rh = CELL - inset * 2;

        ctx.fillStyle = "#84cc16";
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(rx, ry, rw, rh, 8);
        else ctx.rect(rx, ry, rw, rh);
        ctx.fill();

        ctx.fillStyle = "#a3e635";
        ctx.beginPath();
        ctx.arc(rx + rw * 0.25, ry + rh * 0.25, 3.5, 0, Math.PI * 2);
        ctx.arc(rx + rw * 0.70, ry + rh * 0.75, 4.5, 0, Math.PI * 2);
        ctx.fill();
    }

    function render() {
        ctx.clearRect(0, 0, LOGICAL_W, LOGICAL_H);

        const inset = mode ? mode.wallInset : MODES.master.wallInset;

        for (let r = 0; r < ROWS; r++) {
            for (let c = 0; c < COLS; c++) {
                const cell = grid[r][c];
                const x = c * CELL;
                const y = r * CELL;

                if (cell === '1') drawWallCell(x, y, inset);
                else {
                    ctx.fillStyle = "#f1f5f9";
                    ctx.fillRect(x, y, CELL, CELL);
                }
            }
        }

        // stars
        for (const s of stars) {
            if (s.collected) continue;
            ctx.save();
            ctx.shadowBlur = 12;
            ctx.shadowColor = "rgba(251, 191, 36, 0.95)";
            ctx.font = "22px Arial";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(STAR_ICON, s.x, s.y);
            ctx.restore();
        }

        // cup lock
        const locked = starsCollected < stars.length;
        ctx.save();
        ctx.shadowBlur = locked ? 0 : 16;
        ctx.shadowColor = "#fbbf24";
        ctx.globalAlpha = locked ? 0.35 : 1.0;
        ctx.font = "28px Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(CUP_ICON, endPos.x, endPos.y + 2);
        ctx.restore();

        if (locked) {
            ctx.save();
            ctx.font = "14px Arial";
            ctx.textAlign = "center";
            ctx.textBaseline = "top";
            ctx.fillStyle = "rgba(15, 23, 42, 0.65)";
            ctx.fillText("🔒 зірки!", endPos.x, endPos.y + 18);
            ctx.restore();
        }

        // glow
        ctx.globalCompositeOperation = 'lighter';
        const grad = ctx.createRadialGradient(player.x, player.y, 5, player.x, player.y, 40);
        grad.addColorStop(0, "rgba(99, 102, 241, 0.4)");
        grad.addColorStop(1, "rgba(99, 102, 241, 0)");
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(player.x, player.y, 40, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalCompositeOperation = 'source-over';

        // player
        ctx.fillStyle = isDragging ? "#4f46e5" : "#6366f1";
        ctx.beginPath();
        ctx.arc(player.x, player.y, player.r, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "#ffffff";
        ctx.font = "900 14px 'Font Awesome 6 Free'";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(HERO_ICON, player.x, player.y);

        if (isDragging) {
            canvas.classList.add('grabbing');
            canvas.classList.remove('grab');
        } else {
            canvas.classList.add('grab');
            canvas.classList.remove('grabbing');
        }
    }

    // ===== COLLISION =====
    function circleRectCollides(cx, cy, r, rx, ry, rw, rh) {
        const closestX = clamp(cx, rx, rx + rw);
        const closestY = clamp(cy, ry, ry + rh);
        const dx = cx - closestX;
        const dy = cy - closestY;
        return (dx * dx + dy * dy) <= r * r;
    }

    function checkCollision(x, y) {
        const base = player.r - 2;
        const hitR = base * (mode ? mode.hitboxScale : 1);

        const minC = Math.floor((x - hitR) / CELL);
        const maxC = Math.floor((x + hitR) / CELL);
        const minR = Math.floor((y - hitR) / CELL);
        const maxR = Math.floor((y + hitR) / CELL);

        if (minC < 0 || minR < 0 || maxC >= COLS || maxR >= ROWS) return true;

        const inset = mode.wallInset;

        for (let rr = minR; rr <= maxR; rr++) {
            for (let cc = minC; cc <= maxC; cc++) {
                if (!isWallCell(rr, cc)) continue;

                const x0 = cc * CELL;
                const y0 = rr * CELL;

                const rx = x0 + inset;
                const ry = y0 + inset;
                const rw = CELL - inset * 2;
                const rh = CELL - inset * 2;

                if (circleRectCollides(x, y, hitR, rx, ry, rw, rh)) return true;
            }
        }
        return false;
    }

    function canWinAt(x, y) {
        if (starsCollected < stars.length) return false;
        const dx = x - endPos.x;
        const dy = y - endPos.y;
        return Math.sqrt(dx * dx + dy * dy) < (CELL / 2);
    }

    // ===== LEVEL FLOW =====
    function initLevel(levelIndex, fullReset = true) {
        const L = activeLevels();
        grid = L[levelIndex];
        findSE();

        player.x = startPos.x;
        player.y = startPos.y;
        isDragging = false;

        if (fullReset) {
            livesLeft = (mode.lives === Infinity) ? Infinity : mode.lives;
            generateStars(levelIndex);
        }

        updateHud();
        render();
    }

    function restartLevelFromScratch() {
        toast("Рівень спочатку ✨");
        initLevel(currentLevel, true);
    }

    function shake() {
        canvas.parentElement.classList.add('shake');
        setTimeout(() => canvas.parentElement.classList.remove('shake'), 500);
    }

    function fail() {
        isDragging = false;
        shake();

        if (mode.lives === Infinity) {
            player.x = startPos.x; player.y = startPos.y;
            render();
            toast("Спробуй ще раз 🙂");
            return;
        }

        livesLeft = Math.max(0, livesLeft - 1);
        updateHud();

        if (livesLeft > 0) {
            player.x = startPos.x; player.y = startPos.y;
            render();
            toast(`Ой! -1 ❤️ (${livesLeft}/${mode.lives})`);
            return;
        }

        showOverlay(
            "😵 Життя закінчились!",
            "Починаємо рівень спочатку. Спробуй повільніше 🙂",
            [
                makeBtn("Почати рівень спочатку", "bg-indigo-600 hover:bg-indigo-500 text-white text-lg font-black py-4 px-8 rounded-full shadow-lg transition active:scale-95", () => {
                    hideOverlay();
                    restartLevelFromScratch();
                }),
                makeBtn("Вийти в меню", "bg-white hover:bg-slate-50 text-slate-800 text-lg font-black py-4 px-8 rounded-full border-2 border-slate-200 shadow transition active:scale-95", () => exitToMenu())
            ],
            `⭐ у сесії: ${sessionStars}. Сесій лишилось: ${sessionsLeft()}`
        );
    }

    function levelComplete() {
        isDragging = false;
        confettiExplosion();

        setTimeout(() => {
            const st = loadStats();
            st.totalStars += starsCollected;
            saveStats(st);

            const next = currentLevel + 1;
            if (next < mode.levelCount) {
                currentLevel = next;
                showOverlay(
                    "✨ Чудово!",
                    `Рівень пройдено! Ти зібрав ${starsCollected}/${stars.length} ⭐`,
                    [
                        makeBtn("Далі", "bg-indigo-600 hover:bg-indigo-500 text-white text-xl font-black py-4 px-12 rounded-full shadow-lg transition active:scale-95", () => {
                            hideOverlay();
                            initLevel(currentLevel, true);
                        }),
                        makeBtn("Вийти в меню", "bg-white hover:bg-slate-50 text-slate-800 text-xl font-black py-4 px-12 rounded-full border-2 border-slate-200 shadow transition active:scale-95", () => exitToMenu())
                    ],
                    `⭐ у сесії: ${sessionStars}. Всього ⭐: ${loadStats().totalStars}`
                );
            } else {
                gameWin();
            }
        }, 420);
    }

    function gameWin() {
        const totalTime = Math.max(0, Math.round((Date.now() - sessionStartMs) / 1000));
        const mm = String(Math.floor(totalTime / 60)).padStart(2, '0');
        const ss = String(totalTime % 60).padStart(2, '0');

        if (mode.key === 'free') {
            showOverlay(
                "🏁 Фініш кола!",
                `Ти пройшов усі ${mode.levelCount} рівнів. Хочеш ще раз?`,
                [
                    makeBtn("Ще коло!", "bg-indigo-600 hover:bg-indigo-500 text-white text-xl font-black py-4 px-12 rounded-full shadow-lg transition active:scale-95", () => {
                        hideOverlay();
                        currentLevel = 0;
                        initLevel(currentLevel, true);
                    }),
                    makeBtn("Вийти в меню", "bg-white hover:bg-slate-50 text-slate-800 text-xl font-black py-4 px-12 rounded-full border-2 border-slate-200 shadow transition active:scale-95", () => exitToMenu())
                ],
                `⭐ у сесії: ${sessionStars}. Час: ${mm}:${ss}`
            );
            return;
        }

        showOverlay(
            "🎉 ПЕРЕМОГА!",
            `Ти здобув Кубок Бажань! ⭐ у сесії: ${sessionStars}`,
            [
                makeBtn("Зіграти ще (нова сесія)", "bg-indigo-600 hover:bg-indigo-500 text-white text-lg font-black py-4 px-8 rounded-full shadow-lg transition active:scale-95", () => showMainMenu(true)),
                makeBtn("Вийти в меню", "bg-white hover:bg-slate-50 text-slate-800 text-lg font-black py-4 px-8 rounded-full border-2 border-slate-200 shadow transition active:scale-95", () => exitToMenu())
            ],
            `Час: ${mm}:${ss}. Всього ⭐: ${loadStats().totalStars}`
        );
    }

    // ===== MENU =====
    function startSession(modeKey) {
        if (sessionsLeft() <= 0) {
            showMainMenu(false);
            toast("Сесії на сьогодні закінчились 🙂");
            return;
        }
        consumeSession();
        updateSessionsUI();

        mode = MODES[modeKey];
        currentLevel = 0;
        sessionStars = 0;
        sessionStartMs = Date.now();

        hideOverlay();
        initLevel(currentLevel, true);
    }

    function exitToMenu() {
        mode = null;
        currentLevel = 0;
        isDragging = false;
        gameState = 'menu';
        updateHud();
        showMainMenu(false);
    }

    function showPauseMenu() {
        if (!mode) return;
        showOverlay(
            "⏸ Меню",
            "Можеш продовжити, перезапустити рівень або вийти.",
            [
                makeBtn("Продовжити", "bg-indigo-600 hover:bg-indigo-500 text-white text-xl font-black py-4 px-12 rounded-full shadow-lg transition active:scale-95", () => { hideOverlay(); render(); }),
                makeBtn("Рівень спочатку", "bg-white hover:bg-slate-50 text-slate-800 text-xl font-black py-4 px-12 rounded-full border-2 border-slate-200 shadow transition active:scale-95", () => { hideOverlay(); restartLevelFromScratch(); }),
                makeBtn("Вийти в меню", "bg-white hover:bg-slate-50 text-slate-800 text-xl font-black py-4 px-12 rounded-full border-2 border-slate-200 shadow transition active:scale-95", () => exitToMenu())
            ],
            `⭐ у сесії: ${sessionStars}. Сесій лишилось: ${sessionsLeft()}`
        );
    }

    function showMainMenu(fromWin) {
        updateSessionsUI();
        const left = sessionsLeft();
        const st = loadStats();

        const title = fromWin ? "Ще раз?" : "Вітаю, Чародію!";
        const msg = left > 0
            ? "Обери режим. Початківець має спеціальні 5 дитячих рівнів 🙂"
            : "На сьогодні чарівних мандрів достатньо 🙂 Повернись завтра!";

        const btnMain = "text-white text-lg font-black py-4 px-10 rounded-full shadow-lg transform transition active:scale-95";
        const btnAlt = "bg-white hover:bg-slate-50 text-slate-800 text-lg font-black py-4 px-10 rounded-full border-2 border-slate-200 shadow transition active:scale-95";

        const mkStart = (key, label, extra) => {
            const b = makeBtn(`${label} ${extra}`, `${btnMain} bg-indigo-600 hover:bg-indigo-500`, () => startSession(key));
            if (left <= 0) {
                b.disabled = true;
                b.classList.add('opacity-40', 'cursor-not-allowed');
            }
            return b;
        };

        showOverlay(
            title,
            msg,
            [
                mkStart('beginner', 'Початківець', '(5 рівнів, 3 ❤️)'),
                mkStart('master', 'Майстер', '(10 рівнів, 5 ❤️)'),
                mkStart('free', 'Вільний режим', '(без ❤️)'),
                makeBtn("Скинути статистику ⭐", btnAlt, () => { saveStats({ totalStars: 0 }); toast("Статистику скинуто"); showMainMenu(false); })
            ],
            `Сесій лишилось: ${left}/${MAX_SESSIONS_PER_DAY}. Всього ⭐: ${st.totalStars}`
        );
    }

    // ===== INPUT (Pointer events) =====
    function handlePointerDown(e) {
        if (gameState !== 'playing') return;
        const pos = getPointerPos(e);
        const dx = pos.x - player.x;
        const dy = pos.y - player.y;
        if (Math.hypot(dx, dy) < player.r + 20) {
            isDragging = true;
            canvas.setPointerCapture(e.pointerId);
            render();
        }
    }

    function handlePointerMove(e) {
        if (gameState !== 'playing' || !isDragging) return;
        e.preventDefault();

        const pos = getPointerPos(e);

        if (checkCollision(pos.x, pos.y)) {
            fail();
            return;
        }

        player.x = pos.x;
        player.y = pos.y;

        checkStarPickup();
        render();

        if (canWinAt(player.x, player.y)) {
            levelComplete();
            return;
        }

        const dCup = Math.hypot(player.x - endPos.x, player.y - endPos.y);
        if (dCup < (CELL / 2) && starsCollected < stars.length) {
            toast("Спочатку зірочки ⭐");
        }
    }

    function handlePointerUp(e) {
        if (!isDragging) return;
        isDragging = false;
        try { canvas.releasePointerCapture(e.pointerId); } catch { }
        render();
    }

    // ===== CONFETTI =====
    function resizeConfetti() {
        confettiCanvas.width = window.innerWidth;
        confettiCanvas.height = window.innerHeight;
    }
    window.addEventListener('resize', resizeConfetti);
    resizeConfetti();

    function confettiExplosion() {
        for (let i = 0; i < 70; i++) {
            confetti.push({
                x: window.innerWidth / 2,
                y: window.innerHeight / 2,
                w: Math.random() * 8 + 4,
                h: Math.random() * 8 + 4,
                vx: (Math.random() - 0.5) * 18,
                vy: (Math.random() - 0.5) * 18,
                c: `hsl(${Math.random() * 60 + 30}, 100%, 60%)`,
                life: 1.15
            });
        }
        if (!confettiAnimId) updateConfetti();
    }

    function updateConfetti() {
        cCtx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);

        for (let i = confetti.length - 1; i >= 0; i--) {
            const p = confetti[i];
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.22;
            p.vx *= 0.94;
            p.life -= 0.012;

            cCtx.globalAlpha = Math.max(0, p.life);
            cCtx.fillStyle = p.c;
            cCtx.beginPath();
            cCtx.arc(p.x, p.y, p.w / 2, 0, Math.PI * 2);
            cCtx.fill();
            cCtx.globalAlpha = 1;

            if (p.life <= 0) confetti.splice(i, 1);
        }

        if (confetti.length) confettiAnimId = requestAnimationFrame(updateConfetti);
        else confettiAnimId = null;
    }

    // ===== EVENTS =====
    canvas.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('pointermove', handlePointerMove, { passive: false });
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerUp);

    menuBtn.addEventListener('click', () => {
        if (!mode) showMainMenu(false);
        else showPauseMenu();
    });

    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (!mode) showMainMenu(false);
            else {
                if (overlay.classList.contains('opacity-100')) { hideOverlay(); render(); }
                else showPauseMenu();
            }
        }
    });

    window.addEventListener('resize', () => {
        fitCanvasToCSS();
        render();
    });

    // ===== START =====
    function boot() {
        updateHud();
        updateSessionsUI();
        fitCanvasToCSS();
        showMainMenu(false);
    }

    // Дочекатися шрифтів (щоб FA-іконка в canvas була стабільною)
    if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(boot).catch(boot);
    } else {
        boot();
    }
})();