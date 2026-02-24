(() => {
    'use strict';

    // ---------- AUDIO ----------
    const Sound = {
        ctx: null,
        init() {
            if (!this.ctx) this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        },
        tone(freq, type, duration, vol = 0.1) {
            if (!this.ctx) return;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = type;
            osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
            gain.gain.setValueAtTime(vol, this.ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start();
            osc.stop(this.ctx.currentTime + duration);
        },
        noise(duration) {
            if (!this.ctx) return;
            const bufferSize = Math.floor(this.ctx.sampleRate * duration);
            const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

            const src = this.ctx.createBufferSource();
            src.buffer = buffer;
            const gain = this.ctx.createGain();
            gain.gain.setValueAtTime(0.18, this.ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);
            src.connect(gain);
            gain.connect(this.ctx.destination);
            src.start();
        },
        move() { this.tone(210, 'triangle', 0.08, 0.05); },
        point() { this.tone(650, 'sine', 0.10, 0.05); },
        bonus() {
            this.tone(820, 'sine', 0.10, 0.10);
            setTimeout(() => this.tone(1200, 'sine', 0.18, 0.09), 90);
        },
        crash() { this.tone(110, 'sawtooth', 0.28, 0.20); this.noise(0.28); },
        ambulance() {
            if (!this.ctx) return;
            const now = this.ctx.currentTime;
            for (let i = 0; i < 3; i++) {
                const t = now + (i * 0.6);

                const o1 = this.ctx.createOscillator();
                const g1 = this.ctx.createGain();
                o1.frequency.value = 820; o1.type = 'sine'; g1.gain.value = 0.09;
                o1.connect(g1); g1.connect(this.ctx.destination);
                o1.start(t); o1.stop(t + 0.3);

                const o2 = this.ctx.createOscillator();
                const g2 = this.ctx.createGain();
                o2.frequency.value = 610; o2.type = 'sine'; g2.gain.value = 0.09;
                o2.connect(g2); g2.connect(this.ctx.destination);
                o2.start(t + 0.3); o2.stop(t + 0.6);
            }
        }
    };

    // ---------- CONFIG ----------
    const BASE = {
        lanes: 3,
        objSize: 64,       // 16 * 4
        bonusBuf: 6,
        hitBuf: 14
    };

    const MODES = {
        beginner: {
            id: 'beginner', name: 'Початківець', badge: 'ПОЧАТКІВЕЦЬ',
            lives: 3, timeLimitSec: 60,
            baseSpeed: 380, speedInc: 18, speedStep: 6,
            spawnMs: 1200, minSpawnMs: 520, tighten: 6,
            obstacleMult: 1.0, bonusMult: 1.18,
            slowFactor: 0.66, slowMs: 2600
        },
        master: {
            id: 'master', name: 'Майстер', badge: 'МАЙСТЕР',
            lives: 5, timeLimitSec: 180,
            baseSpeed: 520, speedInc: 26, speedStep: 5,
            spawnMs: 950, minSpawnMs: 360, tighten: 7,
            obstacleMult: 1.22, bonusMult: 0.85,
            slowFactor: 0.70, slowMs: 2200
        },
        free: {
            id: 'free', name: 'Вільний', badge: 'ВІЛЬНИЙ',
            lives: Infinity, timeLimitSec: 0,
            baseSpeed: 450, speedInc: 22, speedStep: 6,
            spawnMs: 1050, minSpawnMs: 420, tighten: 6,
            obstacleMult: 1.05, bonusMult: 1.0,
            slowFactor: 0.68, slowMs: 2400
        }
    };

    const OBJECTS = [
        { type: 'obstacle', icon: 'fa-triangle-exclamation', color: 'text-orange-500', weight: 3 },
        { type: 'obstacle', icon: 'fa-mound', color: 'text-stone-500', weight: 3 },
        { type: 'obstacle', icon: 'fa-car-side', color: 'text-blue-500', weight: 2, transform: 'rotate(90deg)', shadow: true },
        { type: 'obstacle', icon: 'fa-box', color: 'text-amber-700', weight: 3 },

        { type: 'bonus', kind: 'star', icon: 'fa-star', color: 'text-yellow-400', weight: 2, points: 5 },
        { type: 'bonus', kind: 'bolt', icon: 'fa-bolt', color: 'text-purple-500', weight: 1, points: 10, effect: 'slow' }
    ];

    // ---------- DOM ----------
    const UI = {
        game: document.getElementById('gameContainer'),
        road: document.getElementById('roadStripes'),
        objects: document.getElementById('objectsContainer'),
        player: document.getElementById('playerCar'),

        score: document.getElementById('scoreValue'),
        high: document.getElementById('highScoreValue'),
        stars: document.getElementById('starsValue'),
        bolts: document.getElementById('boltsValue'),
        time: document.getElementById('timeValue'),
        lives: document.getElementById('livesValue'),
        mode: document.getElementById('modeBadge'),
        rank: document.getElementById('rankBadge'),

        pauseIcon: document.getElementById('pauseIcon'),
        slowmo: document.getElementById('slowmoBadge'),
        toast: document.getElementById('toast'),

        screens: {
            start: document.getElementById('startScreen'),
            pause: document.getElementById('pauseScreen'),
            finish: document.getElementById('finishScreen')
        },

        finish: {
            icon: document.getElementById('finishIcon'),
            title: document.getElementById('finishTitle'),
            sub: document.getElementById('finishSubtitle'),
            score: document.getElementById('finalScore'),
            modeHigh: document.getElementById('finalModeHigh'),
            globalHigh: document.getElementById('finalGlobalHigh'),
            stars: document.getElementById('finalStars'),
            bolts: document.getElementById('finalBolts'),
            avoided: document.getElementById('finalAvoided'),
            crashes: document.getElementById('finalCrashes'),
            time: document.getElementById('finalTime'),
            reward: document.getElementById('rewardBadge'),
            autoLine: document.getElementById('autoRestartLine'),
            autoSec: document.getElementById('autoRestartSec'),
            playAgain: document.getElementById('playAgainBtn'),
            chooseMode: document.getElementById('chooseModeBtn')
        },

        btns: {
            pause: document.getElementById('pauseBtn'),
            menuTop: document.getElementById('menuBtn'),
            resume: document.getElementById('resumeBtn'),
            restart: document.getElementById('restartRunBtn'),
            exitToMenu: document.getElementById('exitToMenuBtn')
        },

        visual: {
            left: [document.getElementById('visualLeftBtnDesktop')],
            right: [document.getElementById('visualRightBtnDesktop')]
        }
    };

    // ---------- STORAGE ----------
    const KEY_GLOBAL = 'mouseRacerHighScore_global_v3';
    const keyMode = (modeId) => `mouseRacerHighScore_${modeId}_v3`;

    const getInt = (k) => {
        const v = parseInt(localStorage.getItem(k) || '0', 10);
        return Number.isFinite(v) ? v : 0;
    };
    const setInt = (k, v) => localStorage.setItem(k, String(v));

    // ---------- HELPERS ----------
    const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
    const fmtTime = (ms) => {
        const s = Math.max(0, Math.ceil(ms / 1000));
        const m = Math.floor(s / 60);
        const ss = s % 60;
        return `${m}:${String(ss).padStart(2, '0')}`;
    };

    function getRank(score) {
        if (score >= 220) return { badge: '🏆 ЛЕГЕНДА', reward: 'Золота медаль героя' };
        if (score >= 140) return { badge: '🥇 ГЕРОЙ', reward: 'Золота медаль' };
        if (score >= 80) return { badge: '🥈 ПОМІЧНИК', reward: 'Срібна медаль' };
        if (score >= 30) return { badge: '🥉 СТАЖЕР', reward: 'Бронзова медаль' };
        return { badge: '⭐ НОВЕНЬКИЙ', reward: 'Почесна наліпка' };
    }

    function toast(msg) {
        UI.toast.textContent = msg;
        UI.toast.classList.remove('hidden');
        clearTimeout(toast._t);
        toast._t = setTimeout(() => UI.toast.classList.add('hidden'), 1200);
    }

    function confettiBurst(type = 'small') {
        if (typeof confetti !== 'function') return;
        const base = { origin: { y: 0.7 } };
        if (type === 'record') {
            confetti({ ...base, particleCount: 140, spread: 80, startVelocity: 45 });
            setTimeout(() => confetti({ ...base, particleCount: 90, spread: 70, startVelocity: 35 }), 200);
            return;
        }
        confetti({ ...base, particleCount: 60, spread: 60, startVelocity: 35 });
    }

    // ---------- METRICS (cache) ----------
    const Metrics = {
        w: 0, h: 0,
        laneW: 0,
        playerW: 0, playerH: 0,
        playerBottom: 0,
        playerY: 0,
        laneCenterX(lane) { return (lane + 0.5) * this.laneW; },
        measure() {
            this.w = UI.game.clientWidth;
            this.h = UI.game.clientHeight;
            this.laneW = this.w / BASE.lanes;
            this.playerW = UI.player.offsetWidth;
            this.playerH = UI.player.offsetHeight;

            const cs = getComputedStyle(UI.player);
            this.playerBottom = parseFloat(cs.bottom || '0') || 0;
            this.playerY = this.h - this.playerBottom - this.playerH; // top y within container

            // позицію гравця перерахувати (важливо при ресайзі)
            Game.updatePlayerPosition();
            // і об'єкти — перерахувати left (у % воно ок, але ми ставимо в %, тому не треба)
        }
    };

    // ---------- STATE ----------
    const State = {
        mode: null,
        s: null,

        running: false,
        paused: false,

        lane: 1,
        objects: [],

        score: 0,
        stars: 0,
        bolts: 0,
        avoided: 0,
        crashes: 0,

        speed: 0,
        spawnMs: 0,
        minSpawnMs: 0,
        spawnAcc: 0,

        elapsed: 0,
        leftMs: 0,

        slowUntil: 0,
        invulnUntil: 0,

        lastT: 0,
        raf: null,

        // HUD optimization
        hudDirty: true,
        hudAcc: 0,
        hudCache: {
            score: null, high: null, stars: null, bolts: null, time: null, lives: null, mode: null, rank: null
        },

        globalHigh: getInt(KEY_GLOBAL),
        modeHigh: 0,

        lives: Infinity,

        // auto restart
        autoRestartTimer: null,
        autoRestartTick: null,
        autoRestartTarget: 0
    };

    // ---------- GAME ----------
    const Game = {
        init() {
            // audio unlock
            const kick = () => {
                Sound.init();
                window.removeEventListener('pointerdown', kick);
                window.removeEventListener('keydown', kick);
            };
            window.addEventListener('pointerdown', kick, { once: true });
            window.addEventListener('keydown', kick, { once: true });

            this.bindUI();
            this.bindInputs();
            this.showMenu();

            Metrics.measure();
            window.addEventListener('resize', () => Metrics.measure());

            // auto pause on tab hide
            document.addEventListener('visibilitychange', () => {
                if (document.hidden && State.running && !State.paused) this.togglePause(true, true);
            });
        },

        bindUI() {
            UI.btns.pause.addEventListener('click', () => this.togglePause());
            UI.btns.menuTop.addEventListener('click', () => this.exitToMenu(true));

            UI.btns.resume.addEventListener('click', () => this.togglePause(false));
            UI.btns.restart.addEventListener('click', () => this.restartRun());
            UI.btns.exitToMenu.addEventListener('click', () => this.exitToMenu(false));

            UI.finish.playAgain.addEventListener('click', () => {
                this.cancelAutoRestart();
                if (State.mode) this.start(State.mode.id);
                else this.showMenu();
            });

            UI.finish.chooseMode.addEventListener('click', () => {
                this.cancelAutoRestart();
                this.showMenu();
            });

            UI.screens.start.querySelectorAll('[data-mode]').forEach(btn => {
                btn.addEventListener('click', () => {
                    const modeId = btn.getAttribute('data-mode');
                    this.start(modeId);
                });
            });
        },

        bindInputs() {
            document.addEventListener('contextmenu', e => e.preventDefault());

            document.addEventListener('keydown', (e) => {
                if (e.code === 'Space') {
                    e.preventDefault();
                    this.togglePause();
                    return;
                }
                if (!State.running || State.paused) return;
                if (e.code === 'ArrowLeft' || e.code === 'KeyA') this.move(-1);
                if (e.code === 'ArrowRight' || e.code === 'KeyD') this.move(1);
                if (e.code === 'Escape') this.exitToMenu(true);
            });

            UI.game.addEventListener('mousedown', (e) => {
                if (!State.running || State.paused) return;
                if (e.button === 0) { this.highlight(UI.visual.left, true); this.move(-1); }
                else if (e.button === 2) { this.highlight(UI.visual.right, true); this.move(1); }
            });

            document.addEventListener('mouseup', () => {
                this.highlight(UI.visual.left, false);
                this.highlight(UI.visual.right, false);
            });

            let touchStartX = 0;
            UI.game.addEventListener('touchstart', (e) => { touchStartX = e.touches[0].clientX; }, { passive: true });
            UI.game.addEventListener('touchend', (e) => {
                if (!State.running || State.paused) return;
                const x = e.changedTouches[0].clientX;
                const diff = x - touchStartX;
                if (Math.abs(diff) > 40) this.move(diff < 0 ? -1 : 1);
                else this.move(x < window.innerWidth / 2 ? -1 : 1);
            }, { passive: true });
        },

        showMenu() {
            this.stopLoop();
            this.cancelAutoRestart();

            State.running = false;
            State.paused = false;

            UI.screens.pause.classList.add('hidden');
            UI.screens.finish.classList.add('hidden');
            UI.screens.start.classList.remove('hidden');

            UI.road.classList.add('paused');
            UI.slowmo.classList.add('hidden');
            UI.player.classList.remove('invulnerable');

            this.clearObjects();
            State.mode = null;
            State.s = null;

            // reset HUD fields
            State.score = 0; State.stars = 0; State.bolts = 0; State.avoided = 0; State.crashes = 0;
            State.lives = Infinity;
            State.elapsed = 0; State.leftMs = 0;

            State.globalHigh = getInt(KEY_GLOBAL);
            State.modeHigh = 0;

            this.markHUD();
            this.renderHUD(true);

            Metrics.measure();
            this.updatePlayerPosition();
        },

        start(modeId) {
            Sound.init();
            this.cancelAutoRestart();

            State.mode = MODES[modeId] || MODES.beginner;
            State.s = State.mode;

            State.globalHigh = getInt(KEY_GLOBAL);
            State.modeHigh = getInt(keyMode(State.mode.id));

            this.resetRun(true);

            UI.screens.start.classList.add('hidden');
            UI.screens.finish.classList.add('hidden');
            UI.screens.pause.classList.add('hidden');

            State.running = true;
            State.paused = false;

            UI.road.classList.remove('paused');
            this.updatePauseIcon();

            Sound.ambulance();
            toast(`Режим: ${State.mode.name}`);

            State.lastT = performance.now();
            this.stopLoop();
            State.raf = requestAnimationFrame((t) => this.loop(t));
        },

        resetRun(full) {
            this.clearObjects();
            State.lane = 1;
            this.updatePlayerPosition();

            State.slowUntil = 0;
            State.invulnUntil = 0;
            UI.player.classList.remove('invulnerable');
            UI.slowmo.classList.add('hidden');

            State.speed = State.s.baseSpeed;
            State.spawnMs = State.s.spawnMs;
            State.minSpawnMs = State.s.minSpawnMs;
            State.spawnAcc = 0;

            State.elapsed = 0;
            State.leftMs = State.s.timeLimitSec ? State.s.timeLimitSec * 1000 : 0;

            State.lives = State.s.lives;

            if (full) {
                State.score = 0;
                State.stars = 0;
                State.bolts = 0;
                State.avoided = 0;
                State.crashes = 0;
            }

            this.markHUD();
            this.renderHUD(true);

            Metrics.measure();
        },

        restartRun() {
            if (!State.mode) return this.showMenu();
            if (State.paused) this.togglePause(false);
            this.start(State.mode.id);
        },

        exitToMenu(withConfirm) {
            this.cancelAutoRestart();

            if (withConfirm && State.running) {
                const ok = window.confirm('Вийти в меню? Заїзд завершиться і статистика збережеться.');
                if (!ok) return;
                this.finish('exit');
                return;
            }

            if (State.running) {
                this.finish('exit');
                return;
            }

            this.showMenu();
        },

        togglePause(force, auto = false) {
            if (!State.running) return;

            const next = (typeof force === 'boolean') ? force : !State.paused;
            State.paused = next;
            this.updatePauseIcon();

            if (State.paused) {
                UI.screens.pause.classList.remove('hidden');
                UI.road.classList.add('paused');
                this.stopLoop();
                if (auto) toast('Пауза (вкладку згорнули)');
            } else {
                UI.screens.pause.classList.add('hidden');
                UI.road.classList.remove('paused');
                State.lastT = performance.now();
                this.stopLoop();
                State.raf = requestAnimationFrame((t) => this.loop(t));
            }
        },

        updatePauseIcon() {
            if (State.paused) {
                UI.pauseIcon.classList.remove('fa-pause');
                UI.pauseIcon.classList.add('fa-play');
            } else {
                UI.pauseIcon.classList.remove('fa-play');
                UI.pauseIcon.classList.add('fa-pause');
            }
        },

        stopLoop() {
            if (State.raf) cancelAnimationFrame(State.raf);
            State.raf = null;
        },

        markHUD() {
            State.hudDirty = true;
        },

        renderHUD(force = false) {
            // throttle ~12fps unless forced
            if (!force) {
                if (!State.hudDirty) return;
                if (State.hudAcc < 80) return;
            }

            State.hudAcc = 0;
            State.hudDirty = false;

            // mode badge
            const modeText = State.mode ? State.mode.badge : 'ОБЕРИ РЕЖИМ';
            if (force || State.hudCache.mode !== modeText) {
                UI.mode.textContent = modeText;
                State.hudCache.mode = modeText;
            }

            // global high
            const high = State.globalHigh;
            if (force || State.hudCache.high !== high) {
                UI.high.textContent = String(high);
                State.hudCache.high = high;
            }

            // score
            if (force || State.hudCache.score !== State.score) {
                UI.score.textContent = String(State.score);
                State.hudCache.score = State.score;
            }

            // stars/bolts
            if (force || State.hudCache.stars !== State.stars) {
                UI.stars.textContent = String(State.stars);
                State.hudCache.stars = State.stars;
            }
            if (force || State.hudCache.bolts !== State.bolts) {
                UI.bolts.textContent = String(State.bolts);
                State.hudCache.bolts = State.bolts;
            }

            // time
            let timeText = '—';
            if (State.mode) {
                timeText = State.s.timeLimitSec ? fmtTime(State.leftMs) : fmtTime(State.elapsed);
            }
            if (force || State.hudCache.time !== timeText) {
                UI.time.textContent = timeText;
                State.hudCache.time = timeText;
            }

            // lives
            const livesMarkup = this.livesMarkup();
            if (force || State.hudCache.lives !== livesMarkup) {
                UI.lives.innerHTML = livesMarkup;
                State.hudCache.lives = livesMarkup;
            }

            // rank
            const r = getRank(State.score);
            const rankText = `Ранг: ${r.badge}`;
            if (force || State.hudCache.rank !== rankText) {
                UI.rank.textContent = rankText;
                State.hudCache.rank = rankText;
            }
        },

        livesMarkup() {
            if (!State.mode) return '';
            if (State.lives === Infinity) return `<span class="font-black text-slate-700">∞</span>`;
            const max = State.s.lives;
            let html = '';
            for (let i = 0; i < max; i++) {
                html += `<i class="fa-solid fa-heart ${i < State.lives ? 'heart' : 'empty'}"></i>`;
            }
            return html;
        },

        move(dir) {
            const next = State.lane + dir;
            if (next < 0 || next >= BASE.lanes) return;
            State.lane = next;
            this.updatePlayerPosition();
            Sound.move();
        },

        updatePlayerPosition() {
            const laneWidthPct = 100 / BASE.lanes;
            const centerPct = (State.lane * laneWidthPct) + (laneWidthPct / 2);
            UI.player.style.left = `${centerPct}%`;
            UI.player.style.transform = `translateX(-50%)`;
        },

        highlight(nodes, on) {
            nodes.forEach(n => n && n.classList.toggle('mouse-btn-active', on));
        },

        weightedPick() {
            const s = State.s;
            const items = OBJECTS.map(o => ({
                ...o,
                _w: (o.type === 'obstacle' ? o.weight * s.obstacleMult : o.weight * s.bonusMult)
            }));
            const total = items.reduce((a, o) => a + o._w, 0);
            let r = Math.random() * total;
            for (const it of items) {
                r -= it._w;
                if (r <= 0) return it;
            }
            return items[0];
        },

        spawn() {
            const lane = Math.floor(Math.random() * BASE.lanes);
            const type = this.weightedPick();

            const laneWidthPct = 100 / BASE.lanes;
            const centerPct = (lane * laneWidthPct) + (laneWidthPct / 2);

            const el = document.createElement('div');
            el.className = 'game-object absolute top-0 w-16 h-16 flex items-center justify-center z-10';
            el.style.left = `${centerPct}%`;
            el.style.transform = `translate(-50%, -80px)`;

            const extraClass = type.shadow ? 'game-shadow' : 'drop-shadow-md';
            const iconTransform = type.transform ? `style="transform:${type.transform}"` : '';
            el.innerHTML = `<i class="fa-solid ${type.icon} fa-3x ${type.color} ${extraClass}" ${iconTransform}></i>`;

            UI.objects.appendChild(el);
            State.objects.push({ el, lane, y: -80, data: type, passed: false });
        },

        addScore(points) {
            const prev = State.score;
            State.score = Math.max(0, State.score + points);

            // speed tiers
            const step = State.s.speedStep;
            const prevTier = Math.floor(prev / step);
            const nowTier = Math.floor(State.score / step);
            if (nowTier > prevTier) State.speed += State.s.speedInc;

            this.markHUD();
        },

        popText(xPct, yPx, text, cls) {
            const fb = document.createElement('div');
            fb.className = `absolute font-extrabold text-2xl z-20 bonus-pop ${cls}`;
            fb.style.left = `${xPct}%`;
            fb.style.top = `${yPx}px`;
            fb.style.transform = 'translate(-50%, 0)';
            fb.textContent = text;
            UI.game.appendChild(fb);
            setTimeout(() => fb.remove(), 450);
        },

        collect(objIndex) {
            const obj = State.objects[objIndex];
            Sound.bonus();

            const laneWidthPct = 100 / BASE.lanes;
            const xPct = (obj.lane * laneWidthPct) + (laneWidthPct / 2);

            if (obj.data.kind === 'star') {
                State.stars++;
                this.popText(xPct, obj.y, `+${obj.data.points}`, 'text-yellow-300');
            } else if (obj.data.kind === 'bolt') {
                State.bolts++;
                this.popText(xPct, obj.y, `+${obj.data.points}`, 'text-purple-200');
            } else {
                this.popText(xPct, obj.y, `+${obj.data.points}`, 'text-white');
            }

            this.addScore(obj.data.points);

            if (obj.data.effect === 'slow') {
                State.slowUntil = performance.now() + State.s.slowMs;
                toast('СЛОУ-МО активовано!');
            }

            obj.el.remove();
            State.objects.splice(objIndex, 1);
            this.markHUD();
        },

        crash() {
            Sound.crash();
            State.crashes++;

            if (State.mode.id === 'free') {
                // вільний режим: нескінченно, але є правило — маленький штраф
                State.score = Math.max(0, State.score - 3);
                toast('Аварія! -3 очки. Спробуй ще!');
                this.respawn();
                this.markHUD();
                return;
            }

            State.lives = Math.max(0, State.lives - 1);
            this.markHUD();

            if (State.lives <= 0) {
                this.finish('lives');
                return;
            }

            toast(`Аварія! -1 життя (залишилось: ${State.lives})`);
            this.respawn();
        },

        respawn() {
            // очистити об'єкти, щоб не було “миттєвої другої аварії”
            this.clearObjects();

            // невразливість
            State.invulnUntil = performance.now() + 1100;
            UI.player.classList.add('invulnerable');
            setTimeout(() => UI.player.classList.remove('invulnerable'), 1100);

            // полегшення
            State.speed = Math.max(State.s.baseSpeed * 0.9, State.speed * 0.92);
            State.spawnMs = Math.min(State.s.spawnMs, State.spawnMs + 80);

            // назад у центр
            State.lane = 1;
            this.updatePlayerPosition();
            this.markHUD();
        },

        clearObjects() {
            UI.objects.innerHTML = '';
            State.objects.forEach(o => o.el && o.el.remove());
            State.objects = [];
        },

        finish(reason) {
            State.running = false;
            State.paused = false;
            this.stopLoop();

            UI.road.classList.add('paused');
            UI.screens.pause.classList.add('hidden');

            // records
            let newGlobal = false;
            let newMode = false;

            if (State.score > State.globalHigh) {
                State.globalHigh = State.score;
                setInt(KEY_GLOBAL, State.globalHigh);
                newGlobal = true;
            }

            if (State.score > State.modeHigh && State.mode) {
                State.modeHigh = State.score;
                setInt(keyMode(State.mode.id), State.modeHigh);
                newMode = true;
            }

            const r = getRank(State.score);

            UI.screens.finish.classList.remove('hidden');

            UI.finish.score.textContent = String(State.score);
            UI.finish.modeHigh.textContent = String(State.modeHigh);
            UI.finish.globalHigh.textContent = String(State.globalHigh);
            UI.finish.stars.textContent = String(State.stars);
            UI.finish.bolts.textContent = String(State.bolts);
            UI.finish.avoided.textContent = String(State.avoided);
            UI.finish.crashes.textContent = String(State.crashes);

            const timeText = State.s.timeLimitSec
                ? `Пройдено: ${fmtTime(State.s.timeLimitSec * 1000 - Math.max(0, State.leftMs))} з ${fmtTime(State.s.timeLimitSec * 1000)}`
                : `Час у грі: ${fmtTime(State.elapsed)}`;
            UI.finish.time.textContent = timeText;

            // reason-specific UI
            UI.finish.autoLine.classList.add('hidden');

            if (reason === 'time') {
                UI.finish.icon.className = 'fa-solid fa-flag-checkered text-4xl text-emerald-600';
                UI.finish.title.textContent = 'Час вийшов!';
                UI.finish.sub.textContent = 'Заїзд завершено — ось твоя статистика';
            } else if (reason === 'lives') {
                UI.finish.icon.className = 'fa-solid fa-heart-crack text-4xl text-red-500';
                UI.finish.title.textContent = 'Життя закінчились!';
                UI.finish.sub.textContent = 'Рівень почнеться знову автоматично';
                this.scheduleAutoRestart(3);
            } else if (reason === 'exit') {
                UI.finish.icon.className = 'fa-solid fa-door-open text-4xl text-slate-600';
                UI.finish.title.textContent = 'Заїзд зупинено';
                UI.finish.sub.textContent = 'Ти вийшов у меню — статистика збережена';
            } else {
                UI.finish.icon.className = 'fa-solid fa-flag-checkered text-4xl text-emerald-600';
                UI.finish.title.textContent = 'Фініш!';
                UI.finish.sub.textContent = 'Статистика заїзду';
            }

            UI.finish.reward.textContent = `Нагорода: ${r.reward} • Ранг: ${r.badge}`;

            if (newGlobal || newMode) confettiBurst('record');
            else confettiBurst('small');

            this.markHUD();
            this.renderHUD(true);
        },

        scheduleAutoRestart(seconds) {
            this.cancelAutoRestart();

            UI.finish.autoLine.classList.remove('hidden');
            UI.finish.autoSec.textContent = String(seconds);

            const startAt = performance.now() + seconds * 1000;
            State.autoRestartTarget = startAt;

            State.autoRestartTick = setInterval(() => {
                const left = Math.max(0, Math.ceil((State.autoRestartTarget - performance.now()) / 1000));
                UI.finish.autoSec.textContent = String(left);
            }, 200);

            State.autoRestartTimer = setTimeout(() => {
                // якщо користувач не вийшов/не змінив режим — рестарт того ж рівня
                if (State.mode) this.start(State.mode.id);
            }, seconds * 1000);
        },

        cancelAutoRestart() {
            if (State.autoRestartTimer) clearTimeout(State.autoRestartTimer);
            if (State.autoRestartTick) clearInterval(State.autoRestartTick);
            State.autoRestartTimer = null;
            State.autoRestartTick = null;
            UI.finish.autoLine && UI.finish.autoLine.classList.add('hidden');
        },

        loop(t) {
            if (!State.running || State.paused) return;

            const dt = t - State.lastT;
            State.lastT = t;

            // tab-jump guard
            if (dt > 140) {
                State.raf = requestAnimationFrame((tt) => this.loop(tt));
                return;
            }

            const now = performance.now();
            const slow = now < State.slowUntil;
            UI.slowmo.classList.toggle('hidden', !slow);

            const slowFactor = slow ? State.s.slowFactor : 1;

            // timer (таймер НЕ сповільнюємо — це справедливіше)
            State.elapsed += dt;
            if (State.s.timeLimitSec) {
                State.leftMs -= dt;
                if (State.leftMs <= 0) {
                    this.finish('time');
                    return;
                }
            }

            // spawn (сповільнюємо разом зі світом)
            State.spawnAcc += dt * slowFactor;
            if (State.spawnAcc >= State.spawnMs) {
                this.spawn();
                State.spawnAcc = 0;
                if (State.spawnMs > State.minSpawnMs) {
                    State.spawnMs = Math.max(State.minSpawnMs, State.spawnMs - State.s.tighten);
                }
                this.markHUD();
            }

            // movement
            const step = (State.speed * (dt * slowFactor)) / 1000;
            const invuln = now < State.invulnUntil;

            // collision window in container coords
            const carTop = Metrics.playerY;
            const carBottom = Metrics.playerY + Metrics.playerH;

            for (let i = State.objects.length - 1; i >= 0; i--) {
                const o = State.objects[i];
                o.y += step;
                o.el.style.transform = `translate(-50%, ${o.y}px)`;

                // collisions only same lane
                if (!invuln && o.lane === State.lane) {
                    const buf = (o.data.type === 'bonus') ? BASE.bonusBuf : BASE.hitBuf;
                    const objTop = o.y;
                    const objBottom = o.y + BASE.objSize;

                    if (objBottom - buf > carTop + buf && objTop + buf < carBottom - buf) {
                        if (o.data.type === 'obstacle') {
                            this.crash();
                            break;
                        } else {
                            this.collect(i);
                            continue;
                        }
                    }
                }

                // passed
                if (o.y > Metrics.h) {
                    if (!o.passed && o.data.type === 'obstacle') {
                        o.passed = true;
                        State.avoided++;
                        this.addScore(1);
                    }
                    o.el.remove();
                    State.objects.splice(i, 1);
                    this.markHUD();
                }
            }

            // HUD throttling
            State.hudAcc += dt;
            this.renderHUD(false);

            State.raf = requestAnimationFrame((tt) => this.loop(tt));
        }
    };

    // start
    Game.init();
})();