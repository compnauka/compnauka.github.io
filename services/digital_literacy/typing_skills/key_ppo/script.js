/**
         * === 1. КОНФІГУРАЦІЯ ТА ДАНІ ===
         */
        const WORDS_DB = [
            "ДІМ", "ЧАС", "РІК", "СВІТ", "РУКА", "ОКО", "СИЛА", "ВОДА", "ТАТО", "МАМА",
            "ДРУГ", "НІЧ", "ДЕНЬ", "КРОВ", "ЗОРЯ", "МОВА", "ДУША", "ЛИЦЕ", "СИН", "ДІД",
            "САД", "ЛІС", "ПОЛЕ", "КІНЬ", "ХЛІБ", "СІЛЬ", "МЕЧ", "ЩИТ", "НЕБО", "МОРЕ",
            "РІКА", "ГОРА", "СТЕП", "ШЛЯХ", "КРАЙ", "МІСТ", "СЕЛО", "ЗИМА", "ЛІТО", "ОСІНЬ",
            "ВЕСНА", "КВІТ", "ПТАХ", "РИБА", "ЗВІР", "ГРІХ", "СМІХ", "ПЛАЧ", "ЗВУК", "КОЛІР",
            "НАРОД", "ЗЕМЛЯ", "СОНЦЕ", "СЕРЦЕ", "ЖИТТЯ", "СЛОВО", "ПРАЦЯ", "РОЗУМ", "КНИГА", "ШКОЛА",
            "ВІТЕР", "ГОЛОС", "ДЕРЕВО", "ТРАВА", "ХМАРА", "МІСТО", "ВУЛИЦЯ", "ВІКНО", "ДВЕРІ", "СТІНА",
            "КІМНАТА", "ЛЮБОВ", "НАДІЯ", "ВІРА", "ПРАВДА", "ДОЛЯ", "МРІЯ", "ДУМКА", "ПІСНЯ", "КАЗКА",
            "ІСТОРІЯ", "ПАМЯТЬ", "РОДИНА", "БАТЬКО", "МАТИ", "БРАТ", "СЕСТРА", "ДОНЬКА", "ДИТИНА", "ЛЮДИНА",
            "ХЛОПЕЦЬ", "ДІВЧИНА", "КОЗАК", "ГЕРОЙ", "ВОЇН", "ЗБРОЯ", "ПЕРЕМОГА", "СЛАВА", "ВОЛЯ", "ЧЕСТЬ"
        ];

        const CONFIG = {
            beginner: { baseSpeed: 45, spawnRate: 2500, chars: "АБВГДЕЖЗИІКЛМНОПРСТУФХЦЧШЮЯ", maxHealth: 20 },
            easy: { baseSpeed: 90, spawnRate: 2000, chars: "АБВГДЕЖЗИІКЛМНОПРСТУФХЦЧШЮЯ", maxHealth: 10 },
            medium: { baseSpeed: 170, spawnRate: 1500, chars: "АБВГДЕЄЖЗИІЇЙКЛМНОПРСТУФХЦЧШЩЬЮЯ1234567890", maxHealth: 10 },
            hard: { baseSpeed: 140, spawnRate: 2400, mode: "words", maxHealth: 10 }
        };
        const GAME_TUNING = {
            laneHeight: 90,
            laneMarginTop: 150,
            laneMarginBottom: 50,
            laneReserveFactor: 0.45,
            spawnStartX: -150,
            spawnPaddingX: 200,
            speedVarMin: 0.9,
            speedVarRange: 0.2,
            wallOffset: 80,
            wallHitOffset: 40,
            spawnMinInterval: 800,
            difficultyUp: 0.015,
            difficultyDown: -0.1,
            resizeDebounceMs: 120,
            missFlashMs: 100,
            warningMs: 2000,
            comboGlowMs: 300,
            laserFadeMs: 150,
            explosionMs: 350,
            debrisMs: 1000
        };

        /**
         * === 2. АУДІО СИСТЕМА ===
         */
        const AudioController = {
            ctx: null,
            enabled: true,
            init() {
                if (!this.ctx) this.ctx = new (window.AudioContext || window.webkitAudioContext)();
            },
            bindControl(selectEl) {
                if (!selectEl) return;
                this.enabled = selectEl.value !== 'off';
                selectEl.addEventListener('change', () => {
                    this.enabled = selectEl.value !== 'off';
                });
            },
            play(type) {
                if (!this.enabled) return;
                if (!this.ctx) this.init();
                if (this.ctx.state === 'suspended') this.ctx.resume();

                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.connect(gain);
                gain.connect(this.ctx.destination);
                const now = this.ctx.currentTime;

                const presets = {
                    shoot: { type: 'sawtooth', f1: 600, f2: 100, dur: 0.1, vol: 0.08 },
                    hit: { type: 'square', f1: 150, f2: 40, dur: 0.2, vol: 0.1 },
                    damage: { type: 'sawtooth', f1: 80, f2: 20, dur: 0.4, vol: 0.3 },
                    miss: { type: 'triangle', f1: 150, f2: 100, dur: 0.15, vol: 0.1 }
                };

                const s = presets[type];
                if (!s) return;

                osc.type = s.type;
                osc.frequency.setValueAtTime(s.f1, now);
                if (type === 'damage' || type === 'miss') {
                    osc.frequency.linearRampToValueAtTime(s.f2, now + s.dur);
                } else {
                    osc.frequency.exponentialRampToValueAtTime(s.f2, now + s.dur);
                }

                gain.gain.setValueAtTime(s.vol, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + s.dur);

                osc.start(now);
                osc.stop(now + s.dur);
            }
        };

        /**
         * === 3. МЕНЕДЖЕР ЛІНІЙ (Уникнення накладання) ===
         */
        class LaneManager {
            constructor(totalHeight, laneHeight, marginTop, marginBottom) {
                this.lanes = [];
                const availableHeight = totalHeight - marginTop - marginBottom;
                const count = Math.floor(availableHeight / laneHeight);
                for (let i = 0; i < count; i++) {
                    this.lanes.push({ y: marginTop + (i * laneHeight), busyUntil: 0 });
                }
            }

            getFreeLane(now) {
                const candidates = this.lanes.filter(l => l.busyUntil < now);
                if (candidates.length === 0) return null;
                return candidates[Math.floor(Math.random() * candidates.length)];
            }

            reserveLane(lane, duration, now) {
                lane.busyUntil = now + duration;
            }
        }

        /**
         * === 4. ІГРОВИЙ ДВИГУН ===
         */
        const game = {
            active: false,
            paused: false,
            hasSeenTutorial: false,

            // Стан гри
            enemies: [],
            score: 0,
            health: 10,
            maxHealth: 10,
            combo: 0,
            maxCombo: 0,
            shotsFired: 0,
            shotsHit: 0,
            layoutErrors: 0,
            combatMisses: 0,
            timeLeft: 60,
            wordTargetId: null,

            // Системні змінні
            levelConfig: {},
            laneManager: null,
            rafId: null,
            lastTime: 0,
            nextSpawnTime: 0,
            difficultyMultiplier: 1.0,
            warningTimeout: null,
            resizeTimer: null,
            nextEnemyId: 1,
            cleanupTimers: [],

            // Кеш DOM елементів
            dom: {
                area: document.getElementById('game-area'),
                wall: document.getElementById('the-wall'),
                overlay: document.getElementById('damage-overlay'),
                warning: document.getElementById('layout-warning'),

                // Статистика
                score: document.getElementById('score-val'),
                health: document.getElementById('health-text'),
                timer: document.getElementById('timer-val'),
                comboBox: document.getElementById('combo-display'),
                comboVal: document.getElementById('combo-val'),

                // Меню
                start: document.getElementById('start-menu'),
                tutorial: document.getElementById('tutorial-screen'),
                over: document.getElementById('game-over-screen'),
                pause: document.getElementById('pause-menu'),

                // Екран результатів
                endTitle: document.getElementById('game-over-title'),
                endScore: document.getElementById('final-score'),
                endAcc: document.getElementById('final-accuracy'),
                endCombo: document.getElementById('final-combo'),
                endHigh: document.getElementById('high-score-display')
            },

            // --- ЗАПУСК ТА УПРАВЛІННЯ ---

            start() {
                AudioController.init();

                if (!this.hasSeenTutorial) {
                    this.dom.start.classList.add('hidden');
                    this.dom.tutorial.classList.remove('hidden');
                    return;
                }

                this._realStart();
            },

            confirmTutorial() {
                this.hasSeenTutorial = true;
                this.dom.tutorial.classList.add('hidden');
                this._realStart();
            },

            _realStart() {
                const level = document.getElementById('level-select').value;
                this.levelConfig = CONFIG[level];
                this.maxHealth = this.levelConfig.maxHealth;
                this.health = this.maxHealth;
                this.difficultyMultiplier = 1.0;

                // Налаштування ліній (верхній відступ для HUD)
                this.laneManager = new LaneManager(
                    window.innerHeight,
                    GAME_TUNING.laneHeight,
                    GAME_TUNING.laneMarginTop,
                    GAME_TUNING.laneMarginBottom
                );

                this.reset();
                this.active = true;
                this.paused = false;

                this.dom.start.classList.add('hidden');
                this.dom.over.classList.add('hidden');
                this.dom.pause.classList.add('hidden');

                this.lastTime = performance.now();
                this.nextSpawnTime = this.lastTime + 1000;
                this.rafId = requestAnimationFrame(this.loop.bind(this));
            },

            trackTimeout(fn, ms) {
                let id = null;
                id = setTimeout(() => {
                    this.cleanupTimers = this.cleanupTimers.filter(t => t !== id);
                    fn();
                }, ms);
                this.cleanupTimers.push(id);
                return id;
            },

            cancelTrackedTimeout(id) {
                if (!id) return;
                clearTimeout(id);
                this.cleanupTimers = this.cleanupTimers.filter(t => t !== id);
            },

            clearTransientTimers() {
                this.cleanupTimers.forEach(clearTimeout);
                this.cleanupTimers = [];
                this.warningTimeout = null;
                clearTimeout(this.resizeTimer);
                this.resizeTimer = null;
            },

            triggerScreenShake() {
                document.body.classList.remove('screen-shake');
                void document.body.offsetWidth;
                document.body.classList.add('screen-shake');
            },

            handleViewportChange() {
                clearTimeout(this.resizeTimer);
                this.resizeTimer = setTimeout(() => {
                    if (!this.active) return;
                    this.laneManager = new LaneManager(
                        window.innerHeight,
                        GAME_TUNING.laneHeight,
                        GAME_TUNING.laneMarginTop,
                        GAME_TUNING.laneMarginBottom
                    );
                }, GAME_TUNING.resizeDebounceMs);
            },

            reset() {
                this.score = 0;
                this.shotsFired = 0;
                this.shotsHit = 0;
                this.layoutErrors = 0;
                this.combatMisses = 0;
                this.combo = 0;
                this.maxCombo = 0;
                this.timeLeft = 60;

                // Очистка
                this.enemies.forEach(e => e.el.remove());
                this.enemies = [];
                this.wordTargetId = null;
                this.clearTransientTimers();
                document.body.classList.remove('miss-flash', 'screen-shake');
                this.dom.area.querySelectorAll('.laser, .explosion, .wall-debris').forEach(el => el.remove());

                // Скидання візуалів
                this.dom.wall.innerHTML = '';
                this.dom.wall.className = '';
                this.dom.overlay.style.background = 'radial-gradient(circle, transparent 50%, rgba(239, 68, 68, 0) 100%)';
                this.dom.comboBox.classList.add('hidden');
                this.dom.timer.classList.remove('timer-warning');

                if (this.rafId) cancelAnimationFrame(this.rafId);
                this.updateUI();
            },

            restart() {
                this.health = this.maxHealth; // Відновлення здоров'я
                this.reset();
                this.active = true;
                this.dom.over.classList.add('hidden');
                this.lastTime = performance.now();
                this.nextSpawnTime = this.lastTime + 1000;
                this.difficultyMultiplier = 1.0;
                this.rafId = requestAnimationFrame(this.loop.bind(this));
            },

            togglePause() {
                if (!this.active) return;
                this.paused = !this.paused;

                if (this.paused) {
                    this.dom.pause.classList.remove('hidden');
                    cancelAnimationFrame(this.rafId);
                } else {
                    this.dom.pause.classList.add('hidden');
                    this.lastTime = performance.now();
                    this.rafId = requestAnimationFrame(this.loop.bind(this));
                }
            },

            quit() {
                this.active = false;
                this.paused = false;
                this.dom.pause.classList.add('hidden');
                this.dom.start.classList.remove('hidden');
                this.reset();
            },

            // --- ЛОГІКА ГРИ ---

            spawnEnemy() {
                const now = performance.now();
                const lane = this.laneManager.getFreeLane(now);
                if (!lane) return;

                let content, type;
                if (this.levelConfig.mode === 'words') {
                    content = WORDS_DB[Math.floor(Math.random() * WORDS_DB.length)];
                    type = 'rocket';
                } else {
                    const chars = this.levelConfig.chars;
                    content = chars[Math.floor(Math.random() * chars.length)];
                    type = 'shahed';
                }

                // Створення DOM
                const el = document.createElement('div');
                el.className = 'enemy';
                el.style.transform = `translate3d(${GAME_TUNING.spawnStartX}px, ${lane.y}px, 0)`;

                if (type === 'shahed') {
                    el.innerHTML = `<div class="enemy-shahed-body"><div class="enemy-label">${content}</div></div>`;
                } else {
                    let html = `<div class="rocket-body"><div class="rocket-flame"></div><div class="rocket-text">`;
                    for (let char of content) html += `<span class="word-char">${char}</span>`;
                    html += `</div></div>`;
                    el.innerHTML = html;
                }

                this.dom.area.appendChild(el);

                // Бронювання лінії
                const currentSpeed = this.levelConfig.baseSpeed * this.difficultyMultiplier;
                const travelTime = (window.innerWidth + GAME_TUNING.spawnPaddingX) / currentSpeed * 1000;
                this.laneManager.reserveLane(lane, travelTime * GAME_TUNING.laneReserveFactor, now);

                this.enemies.push({
                    id: this.nextEnemyId++,
                    el,
                    x: GAME_TUNING.spawnStartX,
                    y: lane.y,
                    content,
                    typedIndex: 0,
                    speed: currentSpeed * (GAME_TUNING.speedVarMin + Math.random() * GAME_TUNING.speedVarRange),
                    type
                });
            },

            handleInput(key) {
                if (!this.active || this.paused) return;

                key = key.toUpperCase();

                // Валідація розкладки
                if (/[A-Z]/.test(key) && !/[А-ЯІЇЄҐ]/.test(key)) {
                    this.layoutErrors++;
                    this.dom.warning.classList.add('visible');
                    this.cancelTrackedTimeout(this.warningTimeout);
                    this.warningTimeout = this.trackTimeout(() => this.dom.warning.classList.remove('visible'), GAME_TUNING.warningMs);
                    return;
                }
                if (!/[А-ЯІЇЄҐ0-9]/.test(key)) return;
                this.shotsFired++;

                let hit = false;

                if (this.levelConfig.mode === 'words') {
                    // Режим слів (Ракети)
                    if (this.wordTargetId) {
                        const enemy = this.enemies.find(e => e.id === this.wordTargetId);
                        if (!enemy) { this.wordTargetId = null; return; }

                        if (key === enemy.content[enemy.typedIndex]) {
                            this.processHit(enemy);
                            enemy.typedIndex++;

                            const chars = enemy.el.querySelectorAll('.word-char');
                            if (chars[enemy.typedIndex - 1]) {
                                chars[enemy.typedIndex - 1].classList.add('done');
                                chars[enemy.typedIndex - 1].classList.remove('active');
                            }
                            if (chars[enemy.typedIndex]) chars[enemy.typedIndex].classList.add('active');

                            if (enemy.typedIndex >= enemy.content.length) this.destroyEnemy(enemy);
                            hit = true;
                        } else {
                            this.resetWordProgress(enemy);
                            this.processMiss();
                        }
                    } else {
                        // Пошук нового слова
                        const candidates = this.enemies
                            .filter(e => e.content.startsWith(key))
                            .sort((a, b) => b.x - a.x);

                        if (candidates.length > 0) {
                            const enemy = candidates[0];
                            this.wordTargetId = enemy.id;

                            enemy.el.classList.add('locked-target');
                            this.enemies.forEach(e => { if (e.id !== enemy.id) e.el.classList.add('dimmed'); });

                            enemy.typedIndex = 1;
                            const chars = enemy.el.querySelectorAll('.word-char');
                            chars[0].classList.add('done');
                            if (chars[1]) chars[1].classList.add('active');

                            this.processHit(enemy);
                            if (enemy.content.length === 1) this.destroyEnemy(enemy);
                            hit = true;
                        }
                    }
                } else {
                    // Режим символів (Шахеди)
                    const match = this.enemies
                        .filter(e => e.content === key)
                        .sort((a, b) => b.x - a.x)[0];

                    if (match) {
                        this.processHit(match);
                        this.destroyEnemy(match);
                        hit = true;
                    }
                }

                this.maybeProcessMiss(hit);
            },

            // In word mode, while target is locked we handle misses inside the lock-branch.
            maybeProcessMiss(hit) {
                if (!hit && !this.wordTargetId) this.processMiss();
            },

            processHit(enemy) {
                this.shotsHit++;
                this.combo++;
                if (this.combo > this.maxCombo) this.maxCombo = this.combo;
                AudioController.play('shoot');
                this.spawnLaser(enemy.el);
                this.updateUI();
            },

            processMiss() {
                this.combatMisses++;
                this.combo = 0;
                AudioController.play('miss');
                document.body.classList.add('miss-flash');
                this.trackTimeout(() => document.body.classList.remove('miss-flash'), GAME_TUNING.missFlashMs);
                this.updateUI();
            },

            resetWordProgress(enemy) {
                enemy.typedIndex = 0;
                const chars = enemy.el.querySelectorAll('.word-char');
                chars.forEach(c => c.classList.remove('done', 'active'));
                this.wordTargetId = null;
                this.enemies.forEach(e => e.el.classList.remove('dimmed', 'locked-target'));
            },

            destroyEnemy(enemy) {
                AudioController.play('hit');
                const rect = enemy.el.getBoundingClientRect();
                this.spawnExplosion(rect.left + rect.width / 2 - 40, enemy.y);

                this.adjustDifficulty(GAME_TUNING.difficultyUp);
                enemy.el.remove();
                this.enemies = this.enemies.filter(e => e.id !== enemy.id);

                if (this.wordTargetId === enemy.id) {
                    this.wordTargetId = null;
                    this.enemies.forEach(e => e.el.classList.remove('dimmed'));
                }
            },

            takeDamage(yPos) {
                if (this.health <= 0) return;

                this.health--;
                this.combo = 0;
                AudioController.play('damage');
                this.adjustDifficulty(GAME_TUNING.difficultyDown);
                this.updateUI();

                const size = 30 + Math.random() * 40;
                const crater = document.createElement('div');
                crater.className = 'impact-crater';
                crater.style.width = size + 'px';
                crater.style.height = size + 'px';
                crater.style.top = yPos + 'px';
                crater.style.left = (Math.random() * 30 - 10) + 'px';
                crater.style.transform = `translate(-50%, -50%) rotate(${Math.random() * 360}deg)`;
                this.dom.wall.appendChild(crater);

                this.spawnDebris(yPos);
                this.triggerScreenShake();

                if (this.health <= 0) this.gameOver(false);
            },

            adjustDifficulty(change) {
                this.difficultyMultiplier += change;
                this.difficultyMultiplier = Math.max(0.5, Math.min(2.5, this.difficultyMultiplier));
            },

            // --- ЕФЕКТИ ---

            spawnLaser(targetEl) {
                const rect = targetEl.getBoundingClientRect();
                const tx = rect.left + rect.width / 2;
                const ty = rect.top + rect.height / 2;
                const sx = window.innerWidth;
                const sy = window.innerHeight;

                const dist = Math.hypot(tx - sx, ty - sy);
                const angle = Math.atan2(ty - sy, tx - sx) * 180 / Math.PI;

                const laser = document.createElement('div');
                laser.className = 'laser';
                laser.style.width = dist + 'px';
                laser.style.top = sy + 'px';
                laser.style.left = sx + 'px';
                laser.style.transform = `rotate(${angle}deg)`;

                this.dom.area.appendChild(laser);
                requestAnimationFrame(() => {
                    laser.style.opacity = 0;
                    this.trackTimeout(() => laser.remove(), GAME_TUNING.laserFadeMs);
                });
            },

            spawnExplosion(x, y) {
                const exp = document.createElement('div');
                exp.className = 'explosion';
                exp.style.left = x + 'px';
                exp.style.top = y + 'px';
                this.dom.area.appendChild(exp);
                this.trackTimeout(() => exp.remove(), GAME_TUNING.explosionMs);
            },

            spawnDebris(y) {
                const rect = this.dom.wall.getBoundingClientRect();
                for (let i = 0; i < 8; i++) {
                    const deb = document.createElement('div');
                    deb.className = 'wall-debris';
                    deb.style.left = (rect.left + Math.random() * 10) + 'px';
                    deb.style.top = (y - 20 + Math.random() * 40) + 'px';

                    const s = 4 + Math.random() * 6;
                    deb.style.width = s + 'px'; deb.style.height = s + 'px';
                    deb.style.backgroundColor = Math.random() > 0.5 ? '#334155' : '#1e293b';
                    deb.style.animationDuration = (0.5 + Math.random() * 0.5) + 's';

                    this.dom.area.appendChild(deb);
                    this.trackTimeout(() => deb.remove(), GAME_TUNING.debrisMs);
                }
            },

            // --- ЦИКЛ ГРИ ---

            updateUI() {
                this.dom.score.textContent = this.shotsHit;
                this.dom.health.textContent = `${this.health}/${this.maxHealth}`;
                this.dom.timer.textContent = Math.ceil(this.timeLeft);

                if (this.timeLeft <= 10) this.dom.timer.classList.add('timer-warning');
                else this.dom.timer.classList.remove('timer-warning');

                if (this.combo >= 3) {
                    this.dom.comboBox.classList.remove('hidden');
                    this.dom.comboVal.textContent = "x" + this.combo;
                    if (this.combo >= 10) {
                        this.dom.comboVal.classList.add('combo-glow');
                        this.trackTimeout(() => this.dom.comboVal.classList.remove('combo-glow'), GAME_TUNING.comboGlowMs);
                    }
                } else {
                    this.dom.comboBox.classList.add('hidden');
                }

                const ratio = this.health / this.maxHealth;
                if (ratio > 0.5) {
                    this.dom.health.style.color = 'var(--col-success)';
                    this.dom.wall.className = '';
                    this.dom.overlay.style.background = 'radial-gradient(circle, transparent 60%, rgba(239, 68, 68, 0) 100%)';
                } else if (ratio > 0.2) {
                    this.dom.health.style.color = 'var(--col-warning)';
                    this.dom.wall.className = '';
                    this.dom.overlay.style.background = 'radial-gradient(circle, transparent 50%, rgba(239, 68, 68, 0.3) 100%)';
                } else {
                    this.dom.health.style.color = 'var(--col-danger)';
                    this.dom.wall.className = 'critical';
                    this.dom.overlay.style.background = 'radial-gradient(circle, transparent 30%, rgba(239, 68, 68, 0.6) 100%)';
                }
            },

            loop(timestamp) {
                if (!this.active || this.paused) return;

                const dt = timestamp - this.lastTime;
                this.lastTime = timestamp;

                this.timeLeft -= dt / 1000;
                if (this.timeLeft <= 0) {
                    this.timeLeft = 0;
                    this.updateUI();
                    this.gameOver(true);
                    return;
                }

                this.updateUI();

                if (timestamp >= this.nextSpawnTime) {
                    this.spawnEnemy();
                    const currentRate = this.levelConfig.spawnRate / Math.sqrt(this.difficultyMultiplier);
                    this.nextSpawnTime = timestamp + Math.max(GAME_TUNING.spawnMinInterval, currentRate);
                }

                const wallPos = window.innerWidth - GAME_TUNING.wallOffset;
                for (let i = this.enemies.length - 1; i >= 0; i--) {
                    const e = this.enemies[i];
                    e.x += e.speed * (dt / 1000);
                    e.el.style.transform = `translate3d(${e.x}px, ${e.y}px, 0)`;

                    if (e.x >= wallPos - GAME_TUNING.wallHitOffset) {
                        this.takeDamage(e.y);
                        this.spawnExplosion(e.x + GAME_TUNING.wallHitOffset, e.y);
                        e.el.remove();
                        this.enemies.splice(i, 1);

                        if (e.id === this.wordTargetId) {
                            this.wordTargetId = null;
                            this.enemies.forEach(en => en.el.classList.remove('dimmed'));
                        }
                    }
                }

                this.rafId = requestAnimationFrame(this.loop.bind(this));
            },

            gameOver(timeUp) {
                this.active = false;
                cancelAnimationFrame(this.rafId);

                if (timeUp) {
                    this.dom.endTitle.innerHTML = '<i class="fa-solid fa-flag-checkered"></i> ЧАС ВИЙШОВ';
                    this.dom.endTitle.style.color = 'var(--col-warning)';
                } else {
                    this.dom.endTitle.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i> ПРОРИВ';
                    this.dom.endTitle.style.color = 'var(--col-danger)';
                }

                this.dom.endScore.textContent = this.shotsHit;
                this.dom.endCombo.textContent = this.maxCombo;
                const acc = this.shotsFired > 0 ? Math.round((this.shotsHit / this.shotsFired) * 100) : 0;
                this.dom.endAcc.textContent = acc + '%';

                if (acc >= 90) this.dom.endAcc.style.color = 'var(--col-success)';
                else if (acc >= 70) this.dom.endAcc.style.color = 'var(--col-warning)';
                else this.dom.endAcc.style.color = 'var(--col-danger)';

                const key = `cityDef_hs_${document.getElementById('level-select').value}`;
                const saved = localStorage.getItem(key) || 0;
                if (this.shotsHit > saved) {
                    localStorage.setItem(key, this.shotsHit);
                    this.dom.endHigh.textContent = `НОВИЙ РЕКОРД! (ПОПЕРЕДНІЙ: ${saved})`;
                } else {
                    this.dom.endHigh.textContent = `РЕКОРД: ${saved}`;
                }

                this.dom.over.classList.remove('hidden');
            }
        };

        // --- 5. ГЛОБАЛЬНІ ПОДІЇ ---
        document.getElementById('pause-btn').addEventListener('click', () => game.togglePause());
        document.getElementById('stop-btn').addEventListener('click', () => game.quit());
        AudioController.bindControl(document.getElementById('sound-select'));
        window.addEventListener('resize', () => game.handleViewportChange());
        window.addEventListener('orientationchange', () => game.handleViewportChange());

        window.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                if (game.active) game.togglePause();
                return;
            }
            if (!game.active) return;
            if (e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
                game.handleInput(e.key);
            }
        });
