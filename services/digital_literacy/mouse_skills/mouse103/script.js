(() => {
    'use strict';

    // ══════════════════════════════════════
    //  AUDIO
    // ══════════════════════════════════════
    const Sound = {
        ctx: null,
        init() {
            if (!this.ctx) this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        },
        tone(freq, type, dur, vol = 0.1) {
            if (!this.ctx) return;
            const o = this.ctx.createOscillator();
            const g = this.ctx.createGain();
            o.type = type;
            o.frequency.setValueAtTime(freq, this.ctx.currentTime);
            g.gain.setValueAtTime(vol, this.ctx.currentTime);
            g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + dur);
            o.connect(g); g.connect(this.ctx.destination);
            o.start(); o.stop(this.ctx.currentTime + dur);
        },
        noise(dur) {
            if (!this.ctx) return;
            const buf  = this.ctx.createBuffer(1, Math.floor(this.ctx.sampleRate * dur), this.ctx.sampleRate);
            const data = buf.getChannelData(0);
            for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
            const src = this.ctx.createBufferSource();
            src.buffer = buf;
            const g = this.ctx.createGain();
            g.gain.setValueAtTime(0.18, this.ctx.currentTime);
            g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + dur);
            src.connect(g); g.connect(this.ctx.destination); src.start();
        },
        move()  { this.tone(210, 'triangle', 0.08, 0.05); },
        bonus() {
            this.tone(820, 'sine', 0.10, 0.10);
            setTimeout(() => this.tone(1200, 'sine', 0.18, 0.09), 90);
        },
        crash() { this.tone(110, 'sawtooth', 0.28, 0.20); this.noise(0.28); },
        star()  { this.tone(900, 'sine', 0.12, 0.09); },
        win() {
            [523, 659, 784, 1047].forEach((f, i) =>
                setTimeout(() => this.tone(f, 'sine', 0.20, 0.12), i * 90));
        },
        ambulance() {
            if (!this.ctx) return;
            const now = this.ctx.currentTime;
            for (let i = 0; i < 3; i++) {
                const t = now + i * 0.6;
                const makeNote = (freq, start, end) => {
                    const o = this.ctx.createOscillator();
                    const g = this.ctx.createGain();
                    o.frequency.value = freq; o.type = 'sine'; g.gain.value = 0.09;
                    o.connect(g); g.connect(this.ctx.destination);
                    o.start(t + start); o.stop(t + end);
                };
                makeNote(820, 0, 0.3);
                makeNote(610, 0.3, 0.6);
            }
        }
    };

    // ══════════════════════════════════════
    //  КОНФІГ
    // ══════════════════════════════════════
    const BASE = { lanes: 3, objSize: 64, bonusBuf: 8, hitBuf: 13 };

    const MODES = {
        beginner: {
            id: 'beginner', name: 'Початківець', badge: 'ЛЕГКО',
            lives: 5, timeLimitSec: 75,
            baseSpeed: 220, speedInc: 10, speedStep: 8,
            spawnMs: 1600, minSpawnMs: 750, tighten: 3,
            obstacleMult: 0.85, bonusMult: 1.4,
            slowFactor: 0.55, slowMs: 3200,
            tutorialMs: 15000
        },
        master: {
            id: 'master', name: 'Майстер', badge: 'ВАЖКО',
            lives: 2, timeLimitSec: 180,
            baseSpeed: 520, speedInc: 26, speedStep: 5,
            spawnMs: 950, minSpawnMs: 360, tighten: 7,
            obstacleMult: 1.22, bonusMult: 0.85,
            slowFactor: 0.70, slowMs: 2200,
            tutorialMs: 0
        },
        free: {
            id: 'free', name: 'Вільний', badge: 'ВІЛЬНИЙ',
            lives: Infinity, timeLimitSec: 0,
            baseSpeed: 450, speedInc: 20, speedStep: 6,
            spawnMs: 1100, minSpawnMs: 440, tighten: 5,
            obstacleMult: 1.05, bonusMult: 1.0,
            slowFactor: 0.65, slowMs: 2600,
            tutorialMs: 0
        }
    };

    const OBJECTS = [
        { type: 'obstacle', icon: 'fa-triangle-exclamation', color: 'text-orange-500', weight: 3 },
        { type: 'obstacle', icon: 'fa-mountain',             color: 'text-stone-400',  weight: 3 },
        { type: 'obstacle', icon: 'fa-car-side',             color: 'text-sky-400',    weight: 2, transform: 'rotate(90deg)', shadow: true },
        { type: 'obstacle', icon: 'fa-box',                  color: 'text-amber-600',  weight: 3 },
        { type: 'bonus', kind: 'star', icon: 'fa-star', color: 'text-yellow-400', weight: 2, points: 5 },
        { type: 'bonus', kind: 'bolt', icon: 'fa-bolt', color: 'text-purple-400', weight: 1, points: 10, effect: 'slow' }
    ];

    // ══════════════════════════════════════
    //  DOM
    // ══════════════════════════════════════
    const UI = {
        game:    document.getElementById('gameContainer'),
        road:    document.getElementById('roadStripes'),
        objects: document.getElementById('objectsContainer'),
        player:  document.getElementById('playerCar'),
        timeBar: document.getElementById('timeBar'),
        flash:   document.getElementById('crashFlash'),

        score:   document.getElementById('scoreValue'),
        high:    document.getElementById('highScoreValue'),
        stars:   document.getElementById('starsValue'),
        bolts:   document.getElementById('boltsValue'),
        timeText: document.getElementById('timeValue'),
        timeTextWrap: document.getElementById('timeTextWrap'),
        lives:   document.getElementById('livesValue'),

        pauseIconWrap: document.getElementById('pauseIconWrap'),
        slowmo:  document.getElementById('slowmoBadge'),
        toast:   document.getElementById('toast'),

        screens: {
            start:  document.getElementById('startScreen'),
            pause:  document.getElementById('pauseScreen'),
            finish: document.getElementById('finishScreen')
        },

        finish: {
            iconBg:   document.getElementById('finishIconBg'),
            iconWrap: document.getElementById('finishIconWrap'),
            title:    document.getElementById('finishTitle'),
            sub:      document.getElementById('finishSub'),
            score:    document.getElementById('finalScore'),
            high:     document.getElementById('finalHigh'),
            stars:    document.getElementById('finalStars'),
            bolts:    document.getElementById('finalBolts'),
            crashes:  document.getElementById('finalCrashes'),
            reward:   document.getElementById('rewardBadge'),
            rewardTxt:document.getElementById('rewardText'),
            playAgain:  document.getElementById('playAgainBtn'),
            chooseMode: document.getElementById('chooseModeBtn')
        },

        btns: {
            pause:      document.getElementById('pauseBtn'),
            menuTop:    document.getElementById('menuBtn'),
            resume:     document.getElementById('resumeBtn'),
            restart:    document.getElementById('restartRunBtn'),
            exitToMenu: document.getElementById('exitToMenuBtn'),
            mobileLeft: document.getElementById('mobileLeftBtn'),
            mobileRight: document.getElementById('mobileRightBtn')
        },

        confirm: {
            screen: document.getElementById('exitConfirmScreen'),
            yes: document.getElementById('exitConfirmYesBtn'),
            no: document.getElementById('exitConfirmNoBtn')
        },

        visual: {
            left:  [document.getElementById('visualLeftBtnDesktop'), document.getElementById('mobileLeftBtn')],
            right: [document.getElementById('visualRightBtnDesktop'), document.getElementById('mobileRightBtn')]
        }
    };

    // ══════════════════════════════════════
    //  STORAGE
    // ══════════════════════════════════════
    const KEY_GLOBAL = 'mouseRacerHigh_global_v4';
    const keyMode    = id => `mouseRacerHigh_${id}_v4`;
    const getInt = k => { const v = parseInt(localStorage.getItem(k) || '0', 10); return isFinite(v) ? v : 0; };
    const setInt = (k, v) => localStorage.setItem(k, String(v));

    // ══════════════════════════════════════
    //  HELPERS
    // ══════════════════════════════════════
    const fmtTime = ms => {
        const s = Math.max(0, Math.ceil(ms / 1000));
        return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
    };

    function getRank(score) {
        if (score >= 220) return { badge: '🏆 ЛЕГЕНДА', reward: 'Золота медаль героя',  icon: 'fa-trophy',      color: 'text-yellow-500' };
        if (score >= 140) return { badge: '🥇 ГЕРОЙ',   reward: 'Золота медаль',         icon: 'fa-medal',       color: 'text-yellow-500' };
        if (score >= 80)  return { badge: '🥈 ПОМІЧНИК',reward: 'Срібна медаль',          icon: 'fa-medal',       color: 'text-slate-400'  };
        if (score >= 30)  return { badge: '🥉 СТАЖЕР',  reward: 'Бронзова медаль',        icon: 'fa-medal',       color: 'text-orange-400' };
        return                   { badge: '⭐ НОВЕНЬКИЙ',reward: 'Почесна наліпка',        icon: 'fa-star',        color: 'text-blue-400'   };
    }

    function toast(msg, dur = 1400) {
        UI.toast.textContent = msg;
        UI.toast.classList.remove('hidden');
        clearTimeout(State.toastTimer);
        State.toastTimer = setTimeout(() => UI.toast.classList.add('hidden'), dur);
    }

    function confettiBurst(big) {
        if (typeof confetti !== 'function') return;
        const o = { origin: { y: 0.65 } };
        if (big) {
            confetti({ ...o, particleCount: 140, spread: 80, startVelocity: 45 });
            setTimeout(() => confetti({ ...o, particleCount: 90, spread: 70, startVelocity: 35 }), 250);
        } else {
            confetti({ ...o, particleCount: 55, spread: 55, startVelocity: 32 });
        }
    }

    function faSync(node) {
        try {
            if (window.FontAwesome?.dom?.i2svg) window.FontAwesome.dom.i2svg({ node });
        } catch (_) {}
    }

    function setIcon(wrap, cls, extra = '') {
        if (!wrap) return;
        wrap.innerHTML = `<i class="fa-solid ${cls} ${extra}"></i>`;
        faSync(wrap);
    }

    // Тимчасовий CSS-клас (видаляє себе після анімації)
    function flashClass(el, cls, ms) {
        el.classList.remove(cls);
        void el.offsetWidth; // reflow
        el.classList.add(cls);
        setTimeout(() => el.classList.remove(cls), ms);
    }

    // ══════════════════════════════════════
    //  METRICS
    // ══════════════════════════════════════
    const Metrics = {
        w: 0, h: 0, laneW: 0,
        playerW: 0, playerH: 0, playerBottom: 0, playerY: 0,
        measure() {
            this.w = UI.game.clientWidth;
            this.h = UI.game.clientHeight;
            this.laneW = this.w / BASE.lanes;
            this.playerW = UI.player.offsetWidth;
            this.playerH = UI.player.offsetHeight;
            this.playerBottom = parseFloat(getComputedStyle(UI.player).bottom || '0') || 0;
            this.playerY = this.h - this.playerBottom - this.playerH;
            Game.syncPlayerPos();
        }
    };

    // ══════════════════════════════════════
    //  STATE
    // ══════════════════════════════════════
    const State = {
        mode: null, s: null,
        running: false, paused: false,
        lane: 1, objects: [],
        lastSpawnLane: -1,
        score: 0, stars: 0, bolts: 0, crashes: 0,
        speed: 0, spawnMs: 0, minSpawnMs: 0, spawnAcc: 0,
        elapsed: 0, leftMs: 0,
        slowUntil: 0, invulnUntil: 0,
        lastT: 0, raf: null,
        lives: Infinity,
        globalHigh: getInt(KEY_GLOBAL),
        modeHigh: 0,
        toastTimer: null,
        confirmResumeAfterCancel: false,
        // HUD cache
        dirty: true, hudAcc: 0,
        cache: {}
    };

    // ══════════════════════════════════════
    //  GAME
    // ══════════════════════════════════════
    const Game = {

        init() {
            const kick = () => { Sound.init(); };
            window.addEventListener('pointerdown', kick, { once: true });
            window.addEventListener('keydown',     kick, { once: true });

            this.bindUI();
            this.bindInputs();
            this.showMenu();

            Metrics.measure();
            let rz;
            window.addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(() => Metrics.measure(), 120); });
            document.addEventListener('visibilitychange', () => {
                if (document.hidden && State.running && !State.paused) this.togglePause(true, true);
            });
        },

        bindUI() {
            UI.btns.pause.addEventListener('click',      () => this.togglePause());
            UI.btns.menuTop.addEventListener('click',    () => this.exitToMenu(true));
            UI.btns.resume.addEventListener('click',     () => this.togglePause(false));
            UI.btns.restart.addEventListener('click',    () => { if (State.mode) this.start(State.mode.id); });
            UI.btns.exitToMenu.addEventListener('click', () => this.exitToMenu(false));
            UI.confirm.yes.addEventListener('click',     () => { this.hideExitConfirm(); this.finish('exit'); });
            UI.confirm.no.addEventListener('click',      () => {
                this.hideExitConfirm();
                if (State.confirmResumeAfterCancel && State.running && State.paused) this.togglePause(false);
                State.confirmResumeAfterCancel = false;
            });

            UI.finish.playAgain.addEventListener('click',  () => { if (State.mode) this.start(State.mode.id); else this.showMenu(); });
            UI.finish.chooseMode.addEventListener('click', () => this.showMenu());

            UI.screens.start.querySelectorAll('[data-mode]').forEach(btn => {
                btn.addEventListener('click', () => this.start(btn.dataset.mode));
            });

            const bindMoveBtn = (btn, dir, sideNodes) => {
                if (!btn) return;
                btn.addEventListener('pointerdown', e => {
                    e.preventDefault();
                    if (!State.running || State.paused) return;
                    this.hilite(sideNodes, true);
                    this.move(dir);
                });
                const release = () => this.hilite(sideNodes, false);
                btn.addEventListener('pointerup', release);
                btn.addEventListener('pointercancel', release);
                btn.addEventListener('pointerleave', release);
            };
            bindMoveBtn(UI.btns.mobileLeft, -1, UI.visual.left);
            bindMoveBtn(UI.btns.mobileRight, 1, UI.visual.right);
        },

        bindInputs() {
            UI.game.addEventListener('contextmenu', e => e.preventDefault());

            document.addEventListener('keydown', e => {
                if (e.code === 'Space') { e.preventDefault(); this.togglePause(); return; }
                if (!State.running || State.paused) return;
                if (e.code === 'ArrowLeft'  || e.code === 'KeyA') this.move(-1);
                if (e.code === 'ArrowRight' || e.code === 'KeyD') this.move(1);
                if (e.code === 'Escape') this.exitToMenu(true);
            });

            UI.game.addEventListener('mousedown', e => {
                if (!State.running || State.paused) return;
                if (e.button === 0) { this.hilite(UI.visual.left,  true); this.move(-1); }
                if (e.button === 2) { this.hilite(UI.visual.right, true); this.move(1); }
            });
            document.addEventListener('mouseup', () => {
                this.hilite(UI.visual.left,  false);
                this.hilite(UI.visual.right, false);
            });

            let tx = 0;
            UI.game.addEventListener('touchstart', e => { tx = e.touches[0].clientX; }, { passive: true });
            UI.game.addEventListener('touchend',   e => {
                if (!State.running || State.paused) return;
                if (e.target?.closest?.('.mobile-move-btn')) return;
                const dx = e.changedTouches[0].clientX - tx;
                const rect = UI.game.getBoundingClientRect();
                const midX = rect.left + rect.width / 2;
                this.move(Math.abs(dx) > 35 ? (dx < 0 ? -1 : 1) : (e.changedTouches[0].clientX < midX ? -1 : 1));
            }, { passive: true });
        },

        showMenu() {
            this.stopLoop();
            State.running = false; State.paused = false;
            this.syncPauseIcon();

            UI.screens.pause.classList.add('hidden');
            UI.screens.finish.classList.add('hidden');
            UI.screens.start.classList.remove('hidden');
            this.hideExitConfirm();
            State.confirmResumeAfterCancel = false;

            UI.road.classList.add('paused');
            UI.slowmo.classList.add('hidden');
            UI.player.classList.remove('invulnerable');
            UI.timeBar.classList.add('hidden');

            this.clearObjects();

            State.mode = null; State.s = null;
            State.score = 0; State.stars = 0; State.bolts = 0; State.crashes = 0;
            State.lives = Infinity; State.elapsed = 0; State.leftMs = 0;
            State.globalHigh = getInt(KEY_GLOBAL); State.modeHigh = 0;

            this.hud(true);
            Metrics.measure(); this.syncPlayerPos();
        },

        start(modeId) {
            Sound.init(); Sound.ambulance();

            State.mode = MODES[modeId] || MODES.beginner;
            State.s    = State.mode;
            State.globalHigh = getInt(KEY_GLOBAL);
            State.modeHigh   = getInt(keyMode(State.mode.id));

            this.resetRun(true);

            UI.screens.start.classList.add('hidden');
            UI.screens.finish.classList.add('hidden');
            UI.screens.pause.classList.add('hidden');
            this.hideExitConfirm();
            State.confirmResumeAfterCancel = false;

            State.running = true; State.paused = false;
            UI.road.classList.remove('paused');

            // таймер-смужка
            if (State.s.timeLimitSec) {
                UI.timeBar.classList.remove('hidden');
                UI.timeBar.style.transform = 'scaleX(1)';
                UI.timeBar.className = '';
            } else {
                UI.timeBar.classList.add('hidden');
            }

            this.syncPauseIcon();
            toast(`Режим: ${State.mode.name}`);

            State.lastT = performance.now();
            this.stopLoop();
            State.raf = requestAnimationFrame(t => this.loop(t));
        },

        resetRun(full) {
            this.clearObjects();
            State.lane = 1; this.syncPlayerPos();
            State.slowUntil = 0; State.invulnUntil = 0;
            UI.player.classList.remove('invulnerable');
            UI.slowmo.classList.add('hidden');

            State.speed    = State.s.baseSpeed;
            State.spawnMs  = State.s.spawnMs;
            State.minSpawnMs = State.s.minSpawnMs;
            State.spawnAcc = 0;
            State.lastSpawnLane = -1;
            State.elapsed  = 0;
            State.leftMs   = State.s.timeLimitSec ? State.s.timeLimitSec * 1000 : 0;
            State.lives    = State.s.lives;

            if (full) { State.score = 0; State.stars = 0; State.bolts = 0; State.crashes = 0; }

            this.hud(true);
            Metrics.measure();
        },

        exitToMenu(withConfirm) {
            if (withConfirm && State.running) {
                this.showExitConfirm();
                return;
            }
            if (State.running) { this.finish('exit'); return; }
            this.showMenu();
        },

        showExitConfirm() {
            if (!State.running) return;
            State.confirmResumeAfterCancel = !State.paused;
            if (!State.paused) this.togglePause(true);
            UI.confirm.screen.classList.remove('hidden');
        },

        hideExitConfirm() {
            UI.confirm.screen.classList.add('hidden');
        },

        togglePause(force, auto = false) {
            if (!State.running) return;
            State.paused = typeof force === 'boolean' ? force : !State.paused;
            this.syncPauseIcon();

            if (State.paused) {
                UI.screens.pause.classList.remove('hidden');
                UI.road.classList.add('paused');
                this.stopLoop();
                if (auto) toast('⏸ Пауза');
            } else {
                this.hideExitConfirm();
                UI.screens.pause.classList.add('hidden');
                UI.road.classList.remove('paused');
                State.lastT = performance.now();
                this.stopLoop();
                State.raf = requestAnimationFrame(t => this.loop(t));
            }
        },

        syncPauseIcon() { setIcon(UI.pauseIconWrap, State.paused ? 'fa-play' : 'fa-pause', 'text-lg'); },

        stopLoop() {
            if (State.raf) cancelAnimationFrame(State.raf);
            State.raf = null;
        },

        // ── Рух ──
        move(dir) {
            const next = State.lane + dir;
            if (next < 0 || next >= BASE.lanes) return;
            State.lane = next;
            this.syncPlayerPos();
            Sound.move();
        },

        syncPlayerPos() {
            const lw  = 100 / BASE.lanes;
            const pct = State.lane * lw + lw / 2;
            UI.player.style.left      = `${pct}%`;
            UI.player.style.transform = 'translateX(-50%)';
        },

        hilite(nodes, on) { nodes.forEach(n => n?.classList.toggle('mouse-btn-active', on)); },

        // ── Спавн ──
        weightedPick() {
            const tutorialOn = State.s?.tutorialMs && State.elapsed < State.s.tutorialMs;
            if (tutorialOn) {
                const bonusOnly = OBJECTS.filter(o => o.type === 'bonus');
                return bonusOnly[Math.floor(Math.random() * bonusOnly.length)];
            }
            const { obstacleMult, bonusMult } = State.s;
            const items = OBJECTS.map(o => ({ ...o, _w: o.type === 'obstacle' ? o.weight * obstacleMult : o.weight * bonusMult }));
            const total = items.reduce((a, o) => a + o._w, 0);
            let r = Math.random() * total;
            for (const it of items) { r -= it._w; if (r <= 0) return it; }
            return items[0];
        },

        spawn() {
            let lane = Math.floor(Math.random() * BASE.lanes);
            if (BASE.lanes > 1 && lane === State.lastSpawnLane) {
                const candidates = Array.from({ length: BASE.lanes }, (_, i) => i).filter(l => l !== State.lastSpawnLane);
                lane = candidates[Math.floor(Math.random() * candidates.length)];
            }
            const data = this.weightedPick();
            const lw   = 100 / BASE.lanes;
            const pct  = lane * lw + lw / 2;

            const el = document.createElement('div');
            el.className = 'game-object absolute top-0 w-16 h-16 flex items-center justify-center z-10';
            el.style.left = `${pct}%`;
            el.style.transform = 'translate(-50%, -80px)';

            const icon = document.createElement('i');
            icon.className = `fa-solid ${data.icon} fa-3x ${data.color} ${data.shadow ? 'game-shadow' : 'drop-shadow-md'}`;
            if (data.transform) icon.style.transform = data.transform;
            el.appendChild(icon);

            UI.objects.appendChild(el);
            State.objects.push({ el, lane, y: -80, data, passed: false });
            State.lastSpawnLane = lane;
        },

        addScore(pts) {
            const prev = State.score;
            State.score = Math.max(0, State.score + pts);
            const step = State.s.speedStep;
            if (Math.floor(State.score / step) > Math.floor(prev / step)) State.speed += State.s.speedInc;
            State.dirty = true;

            // анімація лічильника
            flashClass(UI.score, 'score-bump', 300);
        },

        popText(pct, y, txt, cls) {
            const d = document.createElement('div');
            d.className = `absolute font-extrabold text-2xl z-20 bonus-pop ${cls}`;
            d.style.left = `${pct}%`; d.style.top = `${y}px`;
            d.style.transform = 'translate(-50%, 0)';
            d.textContent = txt;
            UI.game.appendChild(d);
            setTimeout(() => d.remove(), 480);
        },

        collect(idx) {
            const obj = State.objects[idx];
            const lw  = 100 / BASE.lanes;
            const pct = obj.lane * lw + lw / 2;

            if (obj.data.kind === 'star') {
                State.stars++;
                Sound.star();
                this.popText(pct, obj.y, `+${obj.data.points}⭐`, 'text-yellow-300');
            } else if (obj.data.kind === 'bolt') {
                State.bolts++;
                Sound.bonus();
                this.popText(pct, obj.y, `+${obj.data.points}⚡`, 'text-purple-200');
            }

            this.addScore(obj.data.points);

            if (obj.data.effect === 'slow') {
                State.slowUntil = performance.now() + State.s.slowMs;
                // Короткочасна невразливість — ЗАПОБІГАЄ перестрибуванню смуги після болта
                this.grantInvuln(600);
                toast('⚡ СЛОУ-МО!');
            }

            obj.el.remove();
            State.objects.splice(idx, 1);
            State.dirty = true;
        },

        grantInvuln(ms) {
            const until = performance.now() + ms;
            if (until > State.invulnUntil) {
                State.invulnUntil = until;
                UI.player.classList.add('invulnerable');
                setTimeout(() => {
                    if (performance.now() >= State.invulnUntil - 20)
                        UI.player.classList.remove('invulnerable');
                }, ms);
            }
        },

        crash() {
            Sound.crash();
            State.crashes++;

            // Візуальний флеш + тряска
            flashClass(UI.flash,      'active', 400);
            flashClass(UI.game,       'shake',  420);

            if (State.mode.id === 'free') {
                State.score = Math.max(0, State.score - 3);
                toast('Аварія! -3 очки');
                this.respawn();
                State.dirty = true;
                return;
            }

            State.lives = Math.max(0, State.lives - 1);
            State.dirty = true;

            if (State.lives <= 0) { this.finish('lives'); return; }

            toast(`-1 ❤️  Залишилось: ${State.lives}`);
            this.respawn();
        },

        respawn() {
            this.clearObjects();
            this.grantInvuln(1200);
            State.speed   = Math.max(State.s.baseSpeed * 0.9, State.speed * 0.92);
            State.spawnMs = Math.min(State.s.spawnMs, State.spawnMs + 100);
            // НЕ скидаємо смугу — машина залишається де була
            State.dirty = true;
        },

        clearObjects() {
            UI.objects.innerHTML = '';
            State.objects = [];
        },

        // ── Завершення ──
        finish(reason) {
            State.running = false; State.paused = false;
            this.stopLoop(); this.syncPauseIcon();
            UI.road.classList.add('paused');
            UI.screens.pause.classList.add('hidden');
            UI.timeBar.classList.add('hidden');
            this.hideExitConfirm();
            State.confirmResumeAfterCancel = false;

            let newGlobal = false, newMode = false;
            if (State.score > State.globalHigh) { State.globalHigh = State.score; setInt(KEY_GLOBAL, State.globalHigh); newGlobal = true; }
            if (State.score > State.modeHigh && State.mode) { State.modeHigh = State.score; setInt(keyMode(State.mode.id), State.modeHigh); newMode = true; }

            const r = getRank(State.score);

            // Фінальний екран
            UI.finish.score.textContent   = String(State.score);
            UI.finish.high.textContent    = String(State.modeHigh);
            UI.finish.stars.textContent   = String(State.stars);
            UI.finish.bolts.textContent   = String(State.bolts);
            UI.finish.crashes.textContent = String(State.crashes);
            UI.finish.rewardTxt.textContent = `${r.badge}: ${r.reward}`;

            let didPlayWin = false;
            if (reason === 'time') {
                UI.finish.iconBg.style.background = '#d1fae5';
                setIcon(UI.finish.iconWrap, 'fa-flag-checkered', 'text-3xl text-emerald-600');
                UI.finish.title.textContent = 'Час вийшов!';
                UI.finish.sub.textContent   = 'Молодець — заїзд завершено!';
                Sound.win();
                didPlayWin = true;
            } else if (reason === 'lives') {
                UI.finish.iconBg.style.background = '#fee2e2';
                setIcon(UI.finish.iconWrap, 'fa-heart-crack', 'text-3xl text-red-500');
                UI.finish.title.textContent = 'Аварія!';
                UI.finish.sub.textContent   = 'Спробуй ще раз — ти зможеш краще!';
            } else {
                UI.finish.iconBg.style.background = '#f1f5f9';
                setIcon(UI.finish.iconWrap, 'fa-door-open', 'text-3xl text-slate-500');
                UI.finish.title.textContent = 'Заїзд зупинено';
                UI.finish.sub.textContent   = 'Статистика збережена';
            }

            UI.screens.finish.classList.remove('hidden');

            if (newGlobal || newMode) { confettiBurst(true); if (reason !== 'exit' && !didPlayWin) Sound.win(); }
            else confettiBurst(false);

            this.hud(true);
        },

        // ── HUD ──
        hud(force = false) {
            if (!force) {
                if (!State.dirty) return;
                if (State.hudAcc < 85) return;
            }
            State.hudAcc = 0; State.dirty = false;

            const upd = (el, val) => { if (el.textContent !== val) el.textContent = val; };

            upd(UI.score, String(State.score));
            upd(UI.high,  String(State.mode ? State.modeHigh : State.globalHigh));
            upd(UI.stars, String(State.stars));
            upd(UI.bolts, String(State.bolts));

            // Час — текст у HUD
            if (State.mode && !State.s.timeLimitSec) {
                UI.timeTextWrap.classList.remove('hidden');
                upd(UI.timeText, fmtTime(State.elapsed));
            } else if (State.mode && State.s.timeLimitSec) {
                UI.timeTextWrap.classList.remove('hidden');
                upd(UI.timeText, fmtTime(State.leftMs));
            } else {
                UI.timeTextWrap.classList.add('hidden');
            }

            // Життя
            const nextLivesKey = State.mode
                ? (State.lives === Infinity ? 'inf' : `${State.lives}/${State.s.lives}`)
                : 'none';
            if (State.cache.livesKey !== nextLivesKey) {
                const frag = document.createDocumentFragment();
                if (State.mode) {
                    if (State.lives === Infinity) {
                        const icon = document.createElement('i');
                        icon.className = 'fa-solid fa-infinity text-slate-500 text-sm';
                        frag.appendChild(icon);
                    } else {
                        const max = State.s.lives;
                        for (let i = 0; i < max; i++) {
                            const icon = document.createElement('i');
                            icon.className = `fa-solid fa-heart ${i < State.lives ? 'heart' : 'empty'} text-sm`;
                            frag.appendChild(icon);
                        }
                    }
                }
                UI.lives.replaceChildren(frag);
                State.cache.livesKey = nextLivesKey;
            }
        },

        // ── Таймер-смужка ──
        updateTimeBar() {
            if (!State.s?.timeLimitSec || !State.running) return;
            const ratio = Math.max(0, State.leftMs / (State.s.timeLimitSec * 1000));
            UI.timeBar.style.transform = `scaleX(${ratio})`;
            // Колір залежно від залишку
            UI.timeBar.classList.toggle('warn',   ratio < 0.4 && ratio >= 0.2);
            UI.timeBar.classList.toggle('danger', ratio < 0.2);
        },

        // ── Головний цикл ──
        loop(t) {
            if (!State.running || State.paused) return;

            const dt = t - State.lastT;
            State.lastT = t;

            if (dt > 150) { State.raf = requestAnimationFrame(tt => this.loop(tt)); return; }

            const now  = performance.now();
            const slow = now < State.slowUntil;
            UI.slowmo.classList.toggle('hidden', !slow);
            const sf = slow ? State.s.slowFactor : 1;

            // Час
            State.elapsed += dt;
            if (State.s.timeLimitSec) {
                State.leftMs -= dt;
                this.updateTimeBar();
                if (State.leftMs <= 0) { this.finish('time'); return; }
            }

            // Спавн (сповільнюємо разом зі світом)
            State.spawnAcc += dt * sf;
            if (State.spawnAcc >= State.spawnMs) {
                this.spawn();
                State.spawnAcc = 0;
                if (State.spawnMs > State.minSpawnMs) {
                    State.spawnMs = Math.max(State.minSpawnMs, State.spawnMs - State.s.tighten);
                }
                State.dirty = true;
            }

            // Рух об'єктів + зіткнення
            const step    = (State.speed * dt * sf) / 1000;
            const invuln  = now < State.invulnUntil;
            const carTop  = Metrics.playerY;
            const carBot  = Metrics.playerY + Metrics.playerH;
            const laneCenterX = lane => (lane + 0.5) * Metrics.laneW;
            const carHalfW = Math.min(Metrics.laneW * 0.32, Metrics.playerW * 0.4);
            const objHalfW = Math.min(Metrics.laneW * 0.32, BASE.objSize * 0.4);

            for (let i = State.objects.length - 1; i >= 0; i--) {
                const o = State.objects[i];
                o.y += step;
                o.el.style.transform = `translate(-50%, ${o.y}px)`;

                const xOverlap = Math.abs(laneCenterX(o.lane) - laneCenterX(State.lane)) < (carHalfW + objHalfW);
                if (!invuln && xOverlap) {
                    const buf = o.data.type === 'bonus' ? BASE.bonusBuf : BASE.hitBuf;
                    if ((o.y + BASE.objSize - buf) > (carTop + buf) && (o.y + buf) < (carBot - buf)) {
                        if (o.data.type === 'obstacle') { this.crash(); break; }
                        else { this.collect(i); continue; }
                    }
                }

                // Пройшов
                if (o.y > Metrics.h) {
                    if (!o.passed && o.data.type === 'obstacle') {
                        o.passed = true;
                        this.addScore(1);
                    }
                    o.el.remove();
                    State.objects.splice(i, 1);
                    State.dirty = true;
                }
            }

            State.hudAcc += dt;
            this.hud(false);

            State.raf = requestAnimationFrame(tt => this.loop(tt));
        }
    };

    Game.init();
})();
