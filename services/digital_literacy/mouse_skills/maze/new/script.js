(() => {
    'use strict';

    // ===== DOM =====
    const canvas    = document.getElementById('game-canvas');
    const ctx       = canvas.getContext('2d');

    const overlay       = document.getElementById('overlay');
    const overlayTitle  = document.getElementById('overlay-title');
    const overlayMsg    = document.getElementById('overlay-message');
    const overlayActions= document.getElementById('overlay-actions');
    const overlayFooter = document.getElementById('overlay-footer');
    const overlayIcon   = document.getElementById('overlay-icon');

    const menuBtn       = document.getElementById('menu-btn');

    const levelNumEl    = document.getElementById('level-num');
    const levelTotalEl  = document.getElementById('level-total');
    const modeNameEl    = document.getElementById('mode-name');
    const starsNowEl    = document.getElementById('stars-now');
    const starsNeedEl   = document.getElementById('stars-need');
    const livesWrapEl   = document.getElementById('lives-wrap');
    const sessionsLeftEl= document.getElementById('sessions-left');

    const toastEl       = document.getElementById('toast');

    const confettiCanvas= document.getElementById('confetti-canvas');
    const cCtx          = confettiCanvas.getContext('2d');

    // ===== GAME CONSTANTS =====
    const COLS      = 15;
    const ROWS      = 10;
    const CELL      = 40;
    const LOGICAL_W = COLS * CELL; // 600
    const LOGICAL_H = ROWS * CELL; // 400

    // Font Awesome 6 Free Solid unicode glyphs (used in canvas)
    const FA_WAND   = '\uf0d0'; // fa-wand-magic
    const FA_TROPHY = '\uf091'; // fa-trophy
    const FA_LOCK   = '\uf023'; // fa-lock
    const FA_STAR   = '\uf005'; // fa-star
    const FA_HEART  = '\uf004'; // fa-heart

    const MAX_SESSIONS_PER_DAY = 12;
    const STORAGE_SESSIONS     = 'maze_sessions_v3';
    const STORAGE_STATS        = 'maze_stats_v3';

    const MODES = {
        beginner: { key: 'beginner', label: 'Початківець', levelCount: 5,  lives: 3,        starsPerLevel: 2, wallInset: 10, hitboxScale: 0.65 },
        master:   { key: 'master',   label: 'Майстер',     levelCount: 10, lives: 5,        starsPerLevel: 3, wallInset: 4,  hitboxScale: 1.00 },
        free:     { key: 'free',     label: 'Вільний',     levelCount: 10, lives: Infinity, starsPerLevel: 3, wallInset: 6,  hitboxScale: 0.85 }
    };

    // ===== LEVEL SETS =====
    const BEGINNER_LEVELS = [
        // 1) Широкий прямий коридор
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
        // 2) М'який L-поворот
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
        // 3) U-подібний маршрут
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
        // 4) Велика кімната з «парканчиком»
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
        // 5) Обхід центру
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
        return mode && mode.key === 'beginner' ? BEGINNER_LEVELS : MASTER_LEVELS;
    }

    // ===== STATE =====
    let gameState   = 'menu';
    let mode        = null;
    let currentLevel = 0;

    let grid        = [];
    let isDragging  = false;

    const player    = { x: 0, y: 0, r: 12 };
    let startPos    = { x: 0, y: 0 };
    let endPos      = { x: 0, y: 0 };
    let startCell   = { c: 0, r: 0 };
    let endCell     = { c: 0, r: 0 };

    let stars           = [];
    let starsCollected  = 0;
    let livesLeft       = Infinity;

    let sessionStars    = 0;
    let sessionStartMs  = 0;

    // Star collect animation
    let starFlashTimer  = 0;

    // Confetti
    let confetti        = [];
    let confettiAnimId  = null;

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

    // ===== TOAST =====
    let _toastTimer = null;
    function toast(msg, iconClass = 'fa-circle-info') {
        toastEl.innerHTML = `<i class="fa-solid ${iconClass}"></i> ${msg}`;
        toastEl.classList.remove('hidden');
        clearTimeout(_toastTimer);
        _toastTimer = setTimeout(() => toastEl.classList.add('hidden'), 1800);
    }

    // ===== BUTTON FACTORY =====
    function makeBtn(html, className, onClick, disabled = false) {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = className;
        b.innerHTML = html;
        if (disabled) {
            b.disabled = true;
            b.classList.add('opacity-40', 'cursor-not-allowed');
        }
        b.addEventListener('click', onClick);
        return b;
    }

    // ===== OVERLAY =====
    // icon: Font Awesome class name e.g. 'fa-hat-wizard', 'fa-trophy'
    // iconColor: Tailwind color class e.g. 'text-indigo-500', 'text-amber-500'
    function showOverlay(title, msg, actions = [], footer = '', icon = 'fa-hat-wizard', iconColor = 'text-indigo-500') {
        overlayTitle.textContent   = title;
        overlayMsg.textContent     = msg;
        overlayMsg.style.display   = msg ? '' : 'none';
        overlayFooter.textContent  = footer;

        overlayIcon.className = `fa-solid ${icon}`;
        // update icon color on parent
        const wrap = document.getElementById('overlay-icon-wrap');
        wrap.className = `mb-3 text-6xl ${iconColor}`;

        overlayActions.innerHTML = '';
        actions.forEach(a => overlayActions.appendChild(a));

        overlay.classList.remove('opacity-0', 'pointer-events-none');
        overlay.classList.add('opacity-100', 'pointer-events-auto');
        // scroll back to top in case content is tall
        overlay.scrollTop = 0;
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
        const dpr  = Math.max(1, window.devicePixelRatio || 1);

        canvas.width  = Math.round(rect.width  * dpr);
        canvas.height = Math.round(rect.height * dpr);

        scaleX = rect.width  / LOGICAL_W;
        scaleY = rect.height / LOGICAL_H;

        ctx.setTransform(dpr * scaleX, 0, 0, dpr * scaleY, 0, 0);
        ctx.imageSmoothingEnabled = true;
    }

    function getPointerPos(e) {
        const rect = canvas.getBoundingClientRect();
        return {
            x: (e.clientX - rect.left) / rect.width  * LOGICAL_W,
            y: (e.clientY - rect.top)  / rect.height * LOGICAL_H
        };
    }

    // ===== PRNG =====
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

    function renderLives() {
        if (!mode) { livesWrapEl.innerHTML = '—'; return; }
        if (mode.lives === Infinity) {
            livesWrapEl.innerHTML = '<i class="fa-solid fa-infinity text-indigo-500"></i>';
            return;
        }
        let html = '';
        for (let i = 0; i < mode.lives; i++) {
            const lost = i >= livesLeft;
            html += `<i class="fa-solid fa-heart life-icon ${lost ? 'lost text-rose-200' : 'text-rose-500'}"></i>`;
        }
        livesWrapEl.innerHTML = html;
    }

    function updateHud() {
        if (!mode) {
            modeNameEl.textContent  = '—';
            levelNumEl.textContent  = '—';
            levelTotalEl.textContent= '—';
            starsNowEl.textContent  = '0';
            starsNeedEl.textContent = '0';
            livesWrapEl.innerHTML   = '—';
            updateSessionsUI();
            return;
        }

        modeNameEl.textContent   = mode.label;
        levelNumEl.textContent   = String(currentLevel + 1);
        levelTotalEl.textContent = String(mode.levelCount);
        starsNowEl.textContent   = String(starsCollected);
        starsNeedEl.textContent  = String(stars.length);
        renderLives();
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
                if (cell === 'E') { endCell   = { r, c }; endPos   = cellCenter(r, c); }
            }
        }
    }

    // BFS from start to find all reachable open cells
    function computeReachable() {
        const q    = [];
        const seen = Array.from({ length: ROWS }, () => Array(COLS).fill(false));

        q.push(startCell);
        seen[startCell.r][startCell.c] = true;

        const reachable = [{ r: startCell.r, c: startCell.c }];
        const dirs      = [[1,0],[-1,0],[0,1],[0,-1]];

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

    // ===== STARS =====
    function generateStars(levelIndex) {
        const { reachable } = computeReachable();
        const rng  = mulberry32(seedFor(levelIndex, mode.key));
        const need = mode.starsPerLevel;

        const candidates = [];
        for (const cell of reachable) {
            if (cell.r === startCell.r && cell.c === startCell.c) continue;
            if (cell.r === endCell.r   && cell.c === endCell.c)   continue;

            const p  = cellCenter(cell.r, cell.c);
            const ds = Math.hypot(p.x - startPos.x, p.y - startPos.y);
            const de = Math.hypot(p.x - endPos.x,   p.y - endPos.y);
            if (ds < CELL * 2.0) continue;
            if (de < CELL * 1.6) continue;

            candidates.push({ r: cell.r, c: cell.c, x: p.x, y: p.y });
        }

        // deterministic Fisher-Yates
        for (let i = candidates.length - 1; i > 0; i--) {
            const j = Math.floor(rng() * (i + 1));
            [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
        }

        const out     = [];
        const minDist = CELL * 1.5;

        for (const cand of candidates) {
            if (out.length >= need) break;
            const ok = out.every(s => Math.hypot(s.x - cand.x, s.y - cand.y) >= minDist);
            if (!ok) continue;
            out.push({ x: cand.x, y: cand.y, r: 11, collected: false });
        }

        // fallback: relax distance constraint
        let k = 0;
        while (out.length < need && k < candidates.length) {
            const cand = candidates[k++];
            if (out.some(s => s.x === cand.x && s.y === cand.y)) continue;
            out.push({ x: cand.x, y: cand.y, r: 11, collected: false });
        }

        stars          = out;
        starsCollected = 0;
    }

    function checkStarPickup() {
        for (const s of stars) {
            if (s.collected) continue;
            const d = Math.hypot(player.x - s.x, player.y - s.y);
            if (d <= player.r + s.r) {
                s.collected     = true;
                starsCollected++;
                sessionStars++;
                starFlashTimer  = 8; // frames to show flash
                updateHud();
                if (starsCollected === stars.length) {
                    toast(`Зібрано всі зірки! Веди до кубка.`, 'fa-trophy');
                } else {
                    toast(`Зірка! ${starsCollected} / ${stars.length}`, 'fa-star');
                }
                break;
            }
        }
    }

    // ===== CANVAS DRAW HELPERS =====

    /** Draw a 5-point star centred at (cx,cy) with outer radius or, inner ratio ~0.4 */
    function drawStar5(cx, cy, outerR, fillColor, glowColor) {
        const spikes  = 5;
        const innerR  = outerR * 0.42;
        const step    = Math.PI / spikes;

        ctx.save();
        if (glowColor) {
            ctx.shadowBlur  = 14;
            ctx.shadowColor = glowColor;
        }
        ctx.beginPath();
        for (let i = 0; i < spikes * 2; i++) {
            const angle  = i * step - Math.PI / 2;
            const radius = i % 2 === 0 ? outerR : innerR;
            const x      = cx + Math.cos(angle) * radius;
            const y      = cy + Math.sin(angle) * radius;
            if (i === 0) ctx.moveTo(x, y);
            else         ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fillStyle = fillColor;
        ctx.fill();
        ctx.restore();
    }

    /** Draw a Font Awesome glyph centred at (cx,cy) */
    function drawFAGlyph(glyph, cx, cy, size, color, glow) {
        ctx.save();
        ctx.font          = `900 ${size}px "Font Awesome 6 Free"`;
        ctx.textAlign     = 'center';
        ctx.textBaseline  = 'middle';
        ctx.fillStyle     = color;
        if (glow) { ctx.shadowBlur = 14; ctx.shadowColor = glow; }
        ctx.fillText(glyph, cx, cy);
        ctx.restore();
    }

    // ===== RENDER =====
    function drawWallCell(x, y, inset) {
        const rx = x + inset, ry = y + inset;
        const rw = CELL - inset * 2, rh = CELL - inset * 2;

        ctx.fillStyle = '#84cc16';
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(rx, ry, rw, rh, 7);
        else ctx.rect(rx, ry, rw, rh);
        ctx.fill();

        // highlight dot
        ctx.fillStyle = '#a3e635';
        ctx.beginPath();
        ctx.arc(rx + rw * 0.28, ry + rh * 0.28, 3, 0, Math.PI * 2);
        ctx.fill();
    }

    function render() {
        ctx.clearRect(0, 0, LOGICAL_W, LOGICAL_H);

        const inset = mode ? mode.wallInset : MODES.master.wallInset;

        // Grid
        for (let r = 0; r < ROWS; r++) {
            for (let c = 0; c < COLS; c++) {
                const cell = grid[r][c];
                const x    = c * CELL, y = r * CELL;

                if (cell === '1') drawWallCell(x, y, inset);
                else {
                    // flash open cells bright when star collected
                    if (starFlashTimer > 0) {
                        const t = starFlashTimer / 8;
                        ctx.fillStyle = `rgba(251,191,36,${t * 0.12})`;
                        ctx.fillRect(x, y, CELL, CELL);
                    }
                    ctx.fillStyle = '#f1f5f9';
                    ctx.fillRect(x, y, CELL, CELL);
                }
            }
        }

        if (starFlashTimer > 0) starFlashTimer--;

        // Stars
        for (const s of stars) {
            if (s.collected) continue;
            drawStar5(s.x, s.y, s.r + 1, '#fbbf24', 'rgba(251,191,36,0.9)');
        }

        // Trophy / End
        const locked = starsCollected < stars.length;
        ctx.save();
        ctx.globalAlpha = locked ? 0.30 : 1.0;
        drawFAGlyph(
            FA_TROPHY,
            endPos.x, endPos.y - 2,
            26,
            locked ? '#94a3b8' : '#f59e0b',
            locked ? null       : 'rgba(251,191,36,0.8)'
        );
        ctx.restore();

        if (locked) {
            // Lock badge
            ctx.save();
            ctx.globalAlpha = 0.75;
            drawFAGlyph(FA_LOCK, endPos.x + 10, endPos.y + 14, 11, '#64748b', null);
            ctx.restore();
        }

        // Player glow (compositing lighter)
        ctx.globalCompositeOperation = 'lighter';
        const grad = ctx.createRadialGradient(player.x, player.y, 5, player.x, player.y, 38);
        grad.addColorStop(0, 'rgba(99,102,241,0.38)');
        grad.addColorStop(1, 'rgba(99,102,241,0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(player.x, player.y, 38, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalCompositeOperation = 'source-over';

        // Player circle
        ctx.fillStyle = isDragging ? '#4f46e5' : '#6366f1';
        ctx.shadowBlur  = 8;
        ctx.shadowColor = 'rgba(99,102,241,0.5)';
        ctx.beginPath();
        ctx.arc(player.x, player.y, player.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Player icon
        drawFAGlyph(FA_WAND, player.x, player.y, 13, '#ffffff', null);

        // Cursor style
        canvas.classList.toggle('grabbing', isDragging);
        canvas.classList.toggle('grab', !isDragging);
    }

    // ===== COLLISION =====
    function circleRectCollides(cx, cy, r, rx, ry, rw, rh) {
        const closestX = clamp(cx, rx, rx + rw);
        const closestY = clamp(cy, ry, ry + rh);
        const dx = cx - closestX, dy = cy - closestY;
        return (dx * dx + dy * dy) <= r * r;
    }

    function checkCollision(x, y) {
        const hitR  = (player.r - 2) * (mode ? mode.hitboxScale : 1);

        const minC  = Math.floor((x - hitR) / CELL);
        const maxC  = Math.floor((x + hitR) / CELL);
        const minR_ = Math.floor((y - hitR) / CELL);
        const maxR_ = Math.floor((y + hitR) / CELL);

        // Out of bounds
        if (minC < 0 || minR_ < 0 || maxC >= COLS || maxR_ >= ROWS) return true;

        const inset = mode.wallInset;

        for (let rr = minR_; rr <= maxR_; rr++) {
            for (let cc = minC; cc <= maxC; cc++) {
                if (!isWallCell(rr, cc)) continue;
                const x0 = cc * CELL, y0 = rr * CELL;
                if (circleRectCollides(x, y, hitR,
                    x0 + inset, y0 + inset,
                    CELL - inset * 2, CELL - inset * 2))
                    return true;
            }
        }
        return false;
    }

    function canWinAt(x, y) {
        if (starsCollected < stars.length) return false;
        return Math.hypot(x - endPos.x, y - endPos.y) < CELL / 2;
    }

    // ===== LEVEL FLOW =====
    function initLevel(levelIndex, fullReset = true) {
        grid = activeLevels()[levelIndex];
        findSE();

        player.x   = startPos.x;
        player.y   = startPos.y;
        isDragging = false;
        starFlashTimer = 0;

        if (fullReset) {
            livesLeft = (mode.lives === Infinity) ? Infinity : mode.lives;
            generateStars(levelIndex);
        }

        updateHud();
        render();
    }

    function restartLevel() {
        toast('Рівень спочатку', 'fa-rotate-left');
        initLevel(currentLevel, true);
    }

    function shake() {
        const p = canvas.parentElement;
        p.classList.add('shake');
        setTimeout(() => p.classList.remove('shake'), 500);
    }

    function fail() {
        isDragging = false;
        shake();

        if (mode.lives === Infinity) {
            player.x = startPos.x;
            player.y = startPos.y;
            render();
            toast('Спробуй ще раз!', 'fa-rotate-left');
            return;
        }

        livesLeft = Math.max(0, livesLeft - 1);
        updateHud();

        if (livesLeft > 0) {
            player.x = startPos.x;
            player.y = startPos.y;
            render();
            toast(`-1 життя  (${livesLeft} лишилось)`, 'fa-heart-crack');
            return;
        }

        // No lives left
        showOverlay(
            'Життя скінчились!',
            'Спробуй повільніше — точність важливіша за швидкість.',
            [
                makeBtn(
                    '<i class="fa-solid fa-rotate-left mr-2"></i>Спочатку',
                    'bg-indigo-600 hover:bg-indigo-500 text-white text-base font-black py-3 px-8 rounded-full shadow-lg transition',
                    () => { hideOverlay(); restartLevel(); }
                ),
                makeBtn(
                    '<i class="fa-solid fa-door-open mr-2"></i>Вийти в меню',
                    'bg-white hover:bg-slate-50 text-slate-700 text-base font-black py-3 px-8 rounded-full border-2 border-slate-200 shadow transition',
                    () => exitToMenu()
                )
            ],
            `Зірки у сесії: ${sessionStars}  |  Сесій лишилось: ${sessionsLeft()}`,
            'fa-heart-crack',
            'text-rose-500'
        );
    }

    function levelComplete() {
        isDragging = false;
        confettiExplosion();

        setTimeout(() => {
            const st    = loadStats();
            st.totalStars += starsCollected;
            saveStats(st);

            const next = currentLevel + 1;
            if (next < mode.levelCount) {
                currentLevel = next;
                showOverlay(
                    'Чудово!',
                    `Рівень пройдено! Зорі: ${starsCollected} / ${stars.length}`,
                    [
                        makeBtn(
                            '<i class="fa-solid fa-arrow-right mr-2"></i>Далі',
                            'bg-indigo-600 hover:bg-indigo-500 text-white text-base font-black py-3 px-10 rounded-full shadow-lg transition',
                            () => { hideOverlay(); initLevel(currentLevel, true); }
                        ),
                        makeBtn(
                            '<i class="fa-solid fa-door-open mr-2"></i>Вийти в меню',
                            'bg-white hover:bg-slate-50 text-slate-700 text-base font-black py-3 px-10 rounded-full border-2 border-slate-200 shadow transition',
                            () => exitToMenu()
                        )
                    ],
                    `Зірки у сесії: ${sessionStars}  |  Всього зірок: ${st.totalStars}`,
                    'fa-star',
                    'text-amber-400'
                );
            } else {
                gameWin();
            }
        }, 450);
    }

    function gameWin() {
        const totalTime = Math.max(0, Math.round((Date.now() - sessionStartMs) / 1000));
        const mm = String(Math.floor(totalTime / 60)).padStart(2, '0');
        const ss = String(totalTime % 60).padStart(2, '0');

        if (mode.key === 'free') {
            showOverlay(
                'Коло завершено!',
                `Всі ${mode.levelCount} рівнів пройдено. Ще раз?`,
                [
                    makeBtn(
                        '<i class="fa-solid fa-rotate mr-2"></i>Ще коло!',
                        'bg-indigo-600 hover:bg-indigo-500 text-white text-base font-black py-3 px-10 rounded-full shadow-lg transition',
                        () => {
                            if (sessionsLeft() <= 0) {
                                toast('Сесії на сьогодні закінчились', 'fa-moon');
                                showMainMenu(false);
                                return;
                            }
                            consumeSession();
                            updateSessionsUI();
                            currentLevel   = 0;
                            sessionStars   = 0;
                            sessionStartMs = Date.now();
                            hideOverlay();
                            initLevel(0, true);
                        }
                    ),
                    makeBtn(
                        '<i class="fa-solid fa-door-open mr-2"></i>В меню',
                        'bg-white hover:bg-slate-50 text-slate-700 text-base font-black py-3 px-10 rounded-full border-2 border-slate-200 shadow transition',
                        () => exitToMenu()
                    )
                ],
                `Зірки у сесії: ${sessionStars}  |  Час: ${mm}:${ss}`,
                'fa-flag-checkered',
                'text-indigo-500'
            );
            return;
        }

        showOverlay(
            'ПЕРЕМОГА!',
            `Кубок здобуто! Зірки у сесії: ${sessionStars}`,
            [
                makeBtn(
                    '<i class="fa-solid fa-rotate mr-2"></i>Грати ще',
                    'bg-indigo-600 hover:bg-indigo-500 text-white text-base font-black py-3 px-8 rounded-full shadow-lg transition',
                    () => {
                        // restart same mode as a new session
                        if (sessionsLeft() <= 0) {
                            toast('Сесії на сьогодні закінчились', 'fa-moon');
                            showMainMenu(false);
                            return;
                        }
                        consumeSession();
                        updateSessionsUI();
                        currentLevel   = 0;
                        sessionStars   = 0;
                        sessionStartMs = Date.now();
                        hideOverlay();
                        initLevel(0, true);
                    }
                ),
                makeBtn(
                    '<i class="fa-solid fa-door-open mr-2"></i>В меню',
                    'bg-white hover:bg-slate-50 text-slate-700 text-base font-black py-3 px-8 rounded-full border-2 border-slate-200 shadow transition',
                    () => exitToMenu()
                )
            ],
            `Час: ${mm}:${ss}  |  Всього зірок: ${loadStats().totalStars}`,
            'fa-trophy',
            'text-amber-400'
        );
    }

    // ===== MENU =====
    function startSession(modeKey) {
        if (sessionsLeft() <= 0) {
            showMainMenu(false);
            toast('Сесії на сьогодні закінчились', 'fa-moon');
            return;
        }
        consumeSession();
        updateSessionsUI();

        mode           = MODES[modeKey];
        currentLevel   = 0;
        sessionStars   = 0;
        sessionStartMs = Date.now();

        hideOverlay();
        initLevel(0, true);
    }

    function exitToMenu() {
        mode         = null;
        currentLevel = 0;
        isDragging   = false;
        gameState    = 'menu';
        updateHud();
        showMainMenu(false);
    }

    function showPauseMenu() {
        if (!mode) return;
        showOverlay(
            'Пауза',
            `Рівень ${currentLevel + 1} / ${mode.levelCount}  •  Зірки: ${starsCollected} / ${stars.length}`,
            [
                makeBtn(
                    '<i class="fa-solid fa-play mr-2"></i>Продовжити',
                    'bg-indigo-600 hover:bg-indigo-500 text-white text-base font-black py-3 px-10 rounded-full shadow-lg transition',
                    () => { hideOverlay(); render(); }
                ),
                makeBtn(
                    '<i class="fa-solid fa-rotate-left mr-2"></i>Рівень спочатку',
                    'bg-white hover:bg-slate-50 text-slate-700 text-base font-black py-3 px-10 rounded-full border-2 border-slate-200 shadow transition',
                    () => { hideOverlay(); restartLevel(); }
                ),
                makeBtn(
                    '<i class="fa-solid fa-door-open mr-2"></i>Вийти в меню',
                    'bg-white hover:bg-slate-50 text-slate-700 text-base font-black py-3 px-10 rounded-full border-2 border-slate-200 shadow transition',
                    () => exitToMenu()
                )
            ],
            `Зірки у сесії: ${sessionStars}  |  Сесій лишилось: ${sessionsLeft()}`,
            'fa-pause',
            'text-indigo-400'
        );
    }

    function showMainMenu(fromWin) {
        updateSessionsUI();
        const left = sessionsLeft();
        const st   = loadStats();

        const title = fromWin ? 'Ще раз?' : 'Вітаю, Чародію!';
        const msg   = left <= 0
            ? 'Сьогоднішні сесії вичерпані. Повернись завтра!'
            : '';

        const btnPrimary = 'text-white text-sm font-black py-3 px-8 rounded-full shadow-lg transition active:scale-95';
        const btnSecond  = 'bg-white hover:bg-slate-50 text-slate-700 text-sm font-black py-3 px-8 rounded-full border-2 border-slate-200 shadow transition active:scale-95';

        const mkMode = (key, icon, label, desc, disabled = false) => makeBtn(
            `<i class="fa-solid ${icon} mr-2"></i>${label} <span class="font-normal opacity-75 ml-1 text-xs">${desc}</span>`,
            `${btnPrimary} bg-indigo-600 hover:bg-indigo-500`,
            () => startSession(key),
            disabled || left <= 0
        );

        showOverlay(
            title,
            msg,
            [
                mkMode('beginner', 'fa-seedling',    'Початківець',   '5 рівнів · 3 життя'),
                mkMode('master',   'fa-crown',        'Майстер',       '10 рівнів · 5 життів'),
                mkMode('free',     'fa-infinity',     'Вільний режим', '10 рівнів · без втрат'),
                makeBtn(
                    '<i class="fa-solid fa-trash-can mr-2"></i>Скинути статистику',
                    btnSecond,
                    () => { saveStats({ totalStars: 0 }); toast('Статистику скинуто', 'fa-trash-can'); showMainMenu(false); }
                )
            ],
            `Сесій лишилось: ${left} / ${MAX_SESSIONS_PER_DAY}  |  Всього зірок: ${st.totalStars}`,
            'fa-hat-wizard',
            'text-indigo-500'
        );
    }

    // ===== INPUT =====
    function handlePointerDown(e) {
        if (gameState !== 'playing') return;
        const pos = getPointerPos(e);
        if (Math.hypot(pos.x - player.x, pos.y - player.y) < player.r + 22) {
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

        // Hint: near cup but stars not collected
        const dCup = Math.hypot(player.x - endPos.x, player.y - endPos.y);
        if (dCup < CELL * 0.6 && starsCollected < stars.length) {
            toast(`Збери зірки: ${starsCollected} / ${stars.length}`, 'fa-star');
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
        confettiCanvas.width  = window.innerWidth;
        confettiCanvas.height = window.innerHeight;
    }

    function confettiExplosion() {
        // Spawn from canvas visual center
        const rect = canvas.getBoundingClientRect();
        const originX = rect.left + rect.width  / 2;
        const originY = rect.top  + rect.height / 2;

        const COLORS = [
            '#fbbf24','#f59e0b','#ef4444','#6366f1',
            '#22c55e','#3b82f6','#ec4899','#a855f7'
        ];

        for (let i = 0; i < 90; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 14 + 4;
            confetti.push({
                x:    originX,
                y:    originY,
                w:    Math.random() * 9 + 4,
                h:    Math.random() * 9 + 4,
                vx:   Math.cos(angle) * speed,
                vy:   Math.sin(angle) * speed - 4,
                rot:  Math.random() * Math.PI * 2,
                rotV: (Math.random() - 0.5) * 0.3,
                c:    COLORS[Math.floor(Math.random() * COLORS.length)],
                life: 1.2
            });
        }
        if (!confettiAnimId) updateConfetti();
    }

    function updateConfetti() {
        cCtx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);

        for (let i = confetti.length - 1; i >= 0; i--) {
            const p = confetti[i];
            p.x   += p.vx;
            p.y   += p.vy;
            p.vy  += 0.3;
            p.vx  *= 0.96;
            p.rot += p.rotV;
            p.life -= 0.014;

            if (p.life <= 0) { confetti.splice(i, 1); continue; }

            cCtx.save();
            cCtx.globalAlpha = Math.max(0, p.life);
            cCtx.fillStyle   = p.c;
            cCtx.translate(p.x, p.y);
            cCtx.rotate(p.rot);
            cCtx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
            cCtx.restore();
        }

        if (confetti.length) confettiAnimId = requestAnimationFrame(updateConfetti);
        else { confettiAnimId = null; cCtx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height); }
    }

    // ===== EVENTS =====
    canvas.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('pointermove', handlePointerMove, { passive: false });
    window.addEventListener('pointerup',   handlePointerUp);
    window.addEventListener('pointercancel', handlePointerUp);

    menuBtn.addEventListener('click', () => {
        if (gameState === 'overlay') { hideOverlay(); render(); return; }
        if (!mode) showMainMenu(false);
        else showPauseMenu();
    });

    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (gameState === 'overlay') { hideOverlay(); render(); }
            else if (!mode) showMainMenu(false);
            else showPauseMenu();
        }
    });

    window.addEventListener('resize', () => {
        fitCanvasToCSS();
        resizeConfetti();
        render();
    });

    // ===== BOOT =====
    function boot() {
        updateHud();
        updateSessionsUI();
        fitCanvasToCSS();
        resizeConfetti();
        showMainMenu(false);
    }

    if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(boot).catch(boot);
    } else {
        boot();
    }
})();
