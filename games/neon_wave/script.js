(() => {
    "use strict";

    const TILE = {
        EMPTY: 0,
        BLOCK: 1,
        SPIKE_UP: 2,
        SPIKE_DOWN: 3,
        FINISH: 9
    };

    const STATE = {
        MENU: "menu",
        PLAYING: "playing",
        GAMEOVER: "gameover",
        WIN: "win",
        PAUSED: "paused"
    };

    const DIFFICULTY = {
        beginner: {
            id: "beginner",
            label: "Початківець",
            levelLength: 480,
            tileSize: 38,
            levelHeight: 22,
            baseSpeed: 220,
            speedRamp: 120,
            gravity: 1020,
            thrust: 1380,
            maxVy: 500,
            startGap: 9,
            endGap: 6,
            drift: 0.7,
            obstacleStart: 0.08,
            obstacleEnd: 0.22,
            minSpacing: 7
        },
        master: {
            id: "master",
            label: "Майстер",
            levelLength: 620,
            tileSize: 36,
            levelHeight: 24,
            baseSpeed: 260,
            speedRamp: 200,
            gravity: 1160,
            thrust: 1500,
            maxVy: 560,
            startGap: 8,
            endGap: 4,
            drift: 1.1,
            obstacleStart: 0.12,
            obstacleEnd: 0.34,
            minSpacing: 5
        }
    };

    const canvas = document.getElementById("gameCanvas");
    const ctx = canvas.getContext("2d", { alpha: false });

    const ui = {
        menuPanel: document.getElementById("menu-panel"),
        resultPanel: document.getElementById("result-panel"),
        resultTitle: document.getElementById("result-title"),
        resultSubtitle: document.getElementById("result-subtitle"),
        startBeginner: document.getElementById("start-beginner"),
        startMaster: document.getElementById("start-master"),
        retryBtn: document.getElementById("retry-btn"),
        menuBtn: document.getElementById("menu-btn"),
        muteBtn: document.getElementById("mute-btn"),
        pauseBtn: document.getElementById("pause-btn"),
        exitBtn: document.getElementById("exit-btn"),
        hud: document.getElementById("hud"),
        hudDifficulty: document.getElementById("hud-difficulty"),
        hudProgress: document.getElementById("hud-progress"),
        hudScore: document.getElementById("hud-score"),
        hudReward: document.getElementById("hud-reward")
    };

    const stars = [];
    const medals = [25, 50, 75, 100];
    const rewardLabels = {
        25: "Бронзовий ривок",
        50: "Срібний пілот",
        75: "Золота хвиля",
        100: "Легенда тунелю"
    };

    const game = {
        state: STATE.MENU,
        config: DIFFICULTY.beginner,
        world: {
            levelMap: [],
            corridorCenter: [],
            levelLength: 0,
            levelHeight: 0,
            tileSize: 38
        },
        player: {
            x: 0,
            y: 0,
            vy: 0,
            radius: 11,
            inputActive: false,
            trail: []
        },
        camera: {
            x: 0,
            y: 0
        },
        runtime: {
            time: 0,
            score: 0,
            progress: 0,
            focusTime: 0,
            rewardedMilestones: new Set(),
            lastRewardText: "-",
            flash: 0,
            particles: [],
            elapsedFrames: 0
        },
        audio: {
            ctx: null,
            muted: false,
            ambientTick: 0
        },
        loop: {
            lastTs: 0
        },
        screen: {
            width: window.innerWidth,
            height: window.innerHeight
        }
    };

    function clamp(v, min, max) {
        return Math.max(min, Math.min(max, v));
    }

    function lerp(a, b, t) {
        return a + (b - a) * t;
    }

    function randomRange(min, max) {
        return min + Math.random() * (max - min);
    }

    function ensureAudioContext() {
        if (!game.audio.ctx) {
            game.audio.ctx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (game.audio.ctx.state === "suspended") {
            game.audio.ctx.resume().catch(() => {});
        }
    }

    function playTone(freq, type, duration, volume = 0.08) {
        if (game.audio.muted) return;
        ensureAudioContext();
        const audioCtx = game.audio.ctx;
        if (!audioCtx) return;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
        gain.gain.setValueAtTime(volume, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + duration);
    }

    function playJumpSound() {
        playTone(230, "triangle", 0.08, 0.09);
        setTimeout(() => playTone(450, "sine", 0.06, 0.04), 35);
    }

    function playCrashSound() {
        playTone(160, "sawtooth", 0.28, 0.15);
        setTimeout(() => playTone(95, "square", 0.22, 0.08), 70);
    }

    function playWinSound() {
        playTone(392, "sine", 0.18, 0.1);
        setTimeout(() => playTone(523, "sine", 0.2, 0.11), 140);
        setTimeout(() => playTone(659, "sine", 0.3, 0.12), 290);
    }

    function playRewardSound() {
        playTone(660, "triangle", 0.12, 0.09);
        setTimeout(() => playTone(880, "triangle", 0.12, 0.08), 80);
    }

    function ambientPulse(dt) {
        if (game.state !== STATE.PLAYING || game.audio.muted) return;
        game.audio.ambientTick += dt;
        if (game.audio.ambientTick >= 1.7) {
            game.audio.ambientTick = 0;
            playTone(70, "sine", 0.26, 0.018);
        }
    }

    function updateMuteLabel() {
        ui.muteBtn.textContent = game.audio.muted ? "Звук: Вимк" : "Звук: Увімк";
    }

    function resize() {
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        game.screen.width = window.innerWidth;
        game.screen.height = window.innerHeight;
        canvas.width = Math.floor(game.screen.width * dpr);
        canvas.height = Math.floor(game.screen.height * dpr);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        seedStars();
    }

    function seedStars() {
        stars.length = 0;
        const count = clamp(Math.floor((game.screen.width * game.screen.height) / 6000), 55, 220);
        for (let i = 0; i < count; i += 1) {
            stars.push({
                x: Math.random() * game.screen.width,
                y: Math.random() * game.screen.height,
                size: Math.random() * 2 + 0.7,
                speed: Math.random() * 35 + 20,
                alpha: Math.random() * 0.6 + 0.15
            });
        }
    }

    function resetRuntime() {
        game.runtime.time = 0;
        game.runtime.score = 0;
        game.runtime.progress = 0;
        game.runtime.focusTime = 0;
        game.runtime.rewardedMilestones.clear();
        game.runtime.lastRewardText = "-";
        game.runtime.flash = 0;
        game.runtime.particles = [];
        game.runtime.elapsedFrames = 0;
        game.audio.ambientTick = 0;
    }

    function resetPlayer() {
        const tile = game.world.tileSize;
        const startX = tile * 5;
        const startY = (game.world.levelHeight / 2) * tile;
        game.player.x = startX;
        game.player.y = startY;
        game.player.vy = 0;
        game.player.trail = [];
        game.player.inputActive = false;
        game.player.radius = Math.max(8, tile * 0.23);
        game.camera.x = 0;
        game.camera.y = 0;
    }

    function createLevel(config) {
        const levelLength = config.levelLength;
        const levelHeight = config.levelHeight;
        const tileSize = config.tileSize;

        game.world.levelLength = levelLength;
        game.world.levelHeight = levelHeight;
        game.world.tileSize = tileSize;
        game.world.levelMap = Array.from({ length: levelLength }, () => new Array(levelHeight).fill(TILE.EMPTY));
        game.world.corridorCenter = new Array(levelLength).fill(levelHeight / 2);

        const levelMap = game.world.levelMap;
        let center = levelHeight / 2;
        let lastObstacleX = -999;

        for (let x = 0; x < levelLength; x += 1) {
            levelMap[x][0] = TILE.BLOCK;
            levelMap[x][levelHeight - 1] = TILE.BLOCK;
        }

        const introSafe = 28;
        const outroSafe = 26;

        for (let x = 1; x < levelLength - 1; x += 1) {
            const progress = x / levelLength;
            const gap = Math.max(4, Math.round(lerp(config.startGap, config.endGap, progress)));
            const maxCenter = levelHeight - 2 - Math.ceil(gap / 2);
            const minCenter = 1 + Math.ceil(gap / 2);

            const driftPower = (Math.random() - 0.5) * config.drift;
            center = clamp(center + driftPower, minCenter, maxCenter);

            const ceiling = clamp(Math.round(center - gap / 2), 1, levelHeight - 3);
            const floor = clamp(ceiling + gap, 2, levelHeight - 2);
            game.world.corridorCenter[x] = (ceiling + floor) * 0.5;

            for (let y = 1; y < levelHeight - 1; y += 1) {
                if (y < ceiling || y > floor) {
                    levelMap[x][y] = TILE.BLOCK;
                }
            }

            if (x < introSafe || x > levelLength - outroSafe) continue;

            const obstacleChance = lerp(config.obstacleStart, config.obstacleEnd, progress);
            const canPlaceObstacle = x - lastObstacleX >= config.minSpacing;

            if (canPlaceObstacle && Math.random() < obstacleChance) {
                const roll = Math.random();
                const corridorHeight = floor - ceiling;

                if (roll < 0.43) {
                    levelMap[x][floor] = TILE.SPIKE_UP;
                } else if (roll < 0.86) {
                    levelMap[x][ceiling] = TILE.SPIKE_DOWN;
                } else if (corridorHeight >= 6) {
                    const blockY = Math.round((floor + ceiling) * 0.5);
                    if (levelMap[x][blockY - 1] === TILE.EMPTY && levelMap[x][blockY] === TILE.EMPTY) {
                        levelMap[x][blockY] = TILE.BLOCK;
                    }
                }

                lastObstacleX = x;
            }
        }

        const finishX = levelLength - 6;
        for (let x = finishX - 2; x <= finishX + 1; x += 1) {
            for (let y = 1; y < levelHeight - 1; y += 1) {
                levelMap[x][y] = TILE.EMPTY;
            }
        }

        for (let y = 1; y < levelHeight - 1; y += 1) {
            levelMap[finishX][y] = TILE.FINISH;
        }
    }

    function setState(nextState) {
        game.state = nextState;
        const playing = nextState === STATE.PLAYING;
        const canTogglePause = nextState === STATE.PLAYING || nextState === STATE.PAUSED;
        ui.hud.classList.toggle("hidden", !playing);
        ui.pauseBtn.disabled = !canTogglePause;
    }

    function showMenu() {
        setState(STATE.MENU);
        ui.menuPanel.classList.remove("hidden");
        ui.resultPanel.classList.add("hidden");
        ui.pauseBtn.textContent = "Пауза";
    }

    function showResult(title, subtitle) {
        ui.resultTitle.textContent = title;
        ui.resultSubtitle.textContent = subtitle;
        ui.menuPanel.classList.add("hidden");
        ui.resultPanel.classList.remove("hidden");
    }

    function startGame(modeId) {
        game.config = DIFFICULTY[modeId];
        createLevel(game.config);
        resetPlayer();
        resetRuntime();
        ui.menuPanel.classList.add("hidden");
        ui.resultPanel.classList.add("hidden");
        setState(STATE.PLAYING);
        updateHud();
    }

    function leaveToMenu() {
        showMenu();
    }

    function pauseToggle() {
        if (game.state === STATE.PLAYING) {
            setState(STATE.PAUSED);
            ui.pauseBtn.textContent = "Продовжити";
            showResult("ПАУЗА", "Натисніть Продовжити або поверніться в меню.");
        } else if (game.state === STATE.PAUSED) {
            setState(STATE.PLAYING);
            ui.resultPanel.classList.add("hidden");
            ui.pauseBtn.textContent = "Пауза";
        }
    }

    function updateHud() {
        const progressPercent = Math.floor(game.runtime.progress * 100);
        ui.hudDifficulty.textContent = "Складність: " + game.config.label;
        ui.hudProgress.textContent = "Прогрес: " + progressPercent + "%";
        ui.hudScore.textContent = "Очки: " + Math.floor(game.runtime.score);
        ui.hudReward.textContent = "Нагорода: " + game.runtime.lastRewardText;
    }

    function handleInput(active) {
        if (game.state !== STATE.PLAYING) return;
        if (active && !game.player.inputActive) playJumpSound();
        game.player.inputActive = active;
    }

    function addParticles(x, y, count, color) {
        for (let i = 0; i < count; i += 1) {
            const angle = Math.random() * Math.PI * 2;
            const speed = randomRange(60, 280);
            game.runtime.particles.push({
                x,
                y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: randomRange(0.5, 1.3),
                size: randomRange(2, 6),
                color
            });
        }
        if (game.runtime.particles.length > 500) {
            game.runtime.particles.splice(0, game.runtime.particles.length - 500);
        }
    }

    function checkRewards() {
        const progressPercent = Math.floor(game.runtime.progress * 100);
        for (const m of medals) {
            if (progressPercent >= m && !game.runtime.rewardedMilestones.has(m)) {
                game.runtime.rewardedMilestones.add(m);
                game.runtime.lastRewardText = rewardLabels[m];
                game.runtime.score += 120 * (m / 25);
                game.runtime.flash = 0.5;
                playRewardSound();
                addParticles(game.player.x, game.player.y, 24, m < 75 ? "#00f7ff" : "#45ff7c");
            }
        }
    }

    function worldBoundsCollision() {
        const worldHeightPx = game.world.levelHeight * game.world.tileSize;
        return game.player.y < game.player.radius || game.player.y > worldHeightPx - game.player.radius;
    }

    function tileAt(tx, ty) {
        if (tx < 0 || tx >= game.world.levelLength || ty < 0 || ty >= game.world.levelHeight) {
            return TILE.BLOCK;
        }
        return game.world.levelMap[tx][ty];
    }

    function checkCollision() {
        if (worldBoundsCollision()) return TILE.BLOCK;

        const tileSize = game.world.tileSize;
        const r = game.player.radius * 0.78;
        const samples = [
            { x: game.player.x + r, y: game.player.y },
            { x: game.player.x - r, y: game.player.y },
            { x: game.player.x, y: game.player.y - r },
            { x: game.player.x, y: game.player.y + r },
            { x: game.player.x + r * 0.72, y: game.player.y - r * 0.72 },
            { x: game.player.x + r * 0.72, y: game.player.y + r * 0.72 }
        ];

        for (const p of samples) {
            const tx = Math.floor(p.x / tileSize);
            const ty = Math.floor(p.y / tileSize);
            const t = tileAt(tx, ty);
            if (t !== TILE.EMPTY) return t;
        }
        return TILE.EMPTY;
    }

    function onCrash() {
        if (game.state !== STATE.PLAYING) return;
        setState(STATE.GAMEOVER);
        playCrashSound();
        addParticles(game.player.x, game.player.y, 70, "#ff4df7");
        const secs = game.runtime.time.toFixed(1);
        showResult("РОЗБИТО", "Час польоту: " + secs + " с. Очки: " + Math.floor(game.runtime.score));
    }

    function onWin() {
        if (game.state !== STATE.PLAYING) return;
        setState(STATE.WIN);
        playWinSound();
        game.runtime.lastRewardText = rewardLabels[100];
        game.runtime.score += game.config.id === "master" ? 800 : 500;
        addParticles(game.player.x, game.player.y, 95, "#45ff7c");
        const secs = game.runtime.time.toFixed(1);
        showResult("РІВЕНЬ ПРОЙДЕНО", "Час: " + secs + " с. Підсумок: " + Math.floor(game.runtime.score));
        updateHud();
    }

    function updatePlayer(dt) {
        const progress = clamp(game.player.x / (game.world.levelLength * game.world.tileSize), 0, 1);
        const speedX = game.config.baseSpeed + game.config.speedRamp * progress;

        game.player.x += speedX * dt;
        const accel = game.player.inputActive ? -game.config.thrust : game.config.gravity;
        game.player.vy = clamp(game.player.vy + accel * dt, -game.config.maxVy, game.config.maxVy);
        game.player.y += game.player.vy * dt;

        game.player.trail.push({ x: game.player.x, y: game.player.y });
        if (game.player.trail.length > 30) {
            game.player.trail.shift();
        }
    }

    function updateScore(dt) {
        const tileSize = game.world.tileSize;
        const tx = clamp(Math.floor(game.player.x / tileSize), 0, game.world.levelLength - 1);
        const centerY = game.world.corridorCenter[tx] * tileSize;
        const distanceFromCenter = Math.abs(game.player.y - centerY);
        const centerBand = tileSize * 1.3;

        if (distanceFromCenter <= centerBand) {
            game.runtime.focusTime = Math.min(12, game.runtime.focusTime + dt);
        } else {
            game.runtime.focusTime = Math.max(0, game.runtime.focusTime - dt * 1.4);
        }

        const controlMultiplier = 1 + Math.min(1.5, game.runtime.focusTime / 8);
        game.runtime.score += dt * 65 * controlMultiplier;
    }

    function updateCamera(dt) {
        const tileSize = game.world.tileSize;
        const worldHeightPx = game.world.levelHeight * tileSize;
        const targetX = game.player.x - game.screen.width * 0.28;
        const targetY = game.player.y - game.screen.height * 0.5;
        game.camera.x += (targetX - game.camera.x) * Math.min(1, dt * 6.8);
        game.camera.y += (targetY - game.camera.y) * Math.min(1, dt * 6.5);

        const maxX = game.world.levelLength * tileSize - game.screen.width;
        const maxY = worldHeightPx - game.screen.height;
        game.camera.x = clamp(game.camera.x, 0, Math.max(0, maxX));
        game.camera.y = clamp(game.camera.y, -game.screen.height * 0.1, Math.max(0, maxY));
    }

    function updateParticles(dt) {
        for (let i = game.runtime.particles.length - 1; i >= 0; i -= 1) {
            const p = game.runtime.particles[i];
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.vx *= 0.95;
            p.vy *= 0.95;
            p.life -= dt;
            if (p.life <= 0) {
                game.runtime.particles.splice(i, 1);
            }
        }
    }

    function update(dt) {
        updateStars(dt);
        updateParticles(dt);

        if (game.state !== STATE.PLAYING) return;

        game.runtime.time += dt;
        game.runtime.elapsedFrames += 1;
        ambientPulse(dt);

        updatePlayer(dt);
        updateScore(dt);
        updateCamera(dt);

        game.runtime.progress = clamp(game.player.x / (game.world.levelLength * game.world.tileSize), 0, 1);
        checkRewards();

        const collision = checkCollision();
        if (collision === TILE.BLOCK || collision === TILE.SPIKE_DOWN || collision === TILE.SPIKE_UP) {
            onCrash();
            return;
        }

        if (collision === TILE.FINISH || game.runtime.progress >= 0.992) {
            onWin();
            return;
        }

        if (game.runtime.flash > 0) {
            game.runtime.flash = Math.max(0, game.runtime.flash - dt);
        }

        updateHud();
    }

    function updateStars(dt) {
        for (const s of stars) {
            s.x -= s.speed * dt;
            if (s.x < -2) {
                s.x = game.screen.width + 2;
                s.y = Math.random() * game.screen.height;
                s.alpha = Math.random() * 0.6 + 0.15;
                s.size = Math.random() * 2 + 0.7;
            }
        }
    }

    function drawBackground() {
        const pulse = 0.06 + Math.sin(game.runtime.time * 1.8) * 0.02;
        ctx.fillStyle = "#050010";
        ctx.fillRect(0, 0, game.screen.width, game.screen.height);

        const gradient = ctx.createLinearGradient(0, 0, 0, game.screen.height);
        gradient.addColorStop(0, "rgba(17, 8, 50, 0.55)");
        gradient.addColorStop(1, "rgba(2, 2, 16, 0.9)");
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, game.screen.width, game.screen.height);

        for (const s of stars) {
            ctx.globalAlpha = s.alpha + pulse;
            ctx.fillStyle = "#9ef8ff";
            ctx.fillRect(s.x, s.y, s.size, s.size);
        }
        ctx.globalAlpha = 1;

        if (game.runtime.flash > 0) {
            ctx.globalAlpha = game.runtime.flash * 0.5;
            ctx.fillStyle = "#35ff8f";
            ctx.fillRect(0, 0, game.screen.width, game.screen.height);
            ctx.globalAlpha = 1;
        }
    }

    function drawWorld() {
        const tileSize = game.world.tileSize;
        const levelMap = game.world.levelMap;
        const levelLength = game.world.levelLength;
        const levelHeight = game.world.levelHeight;
        const startCol = clamp(Math.floor(game.camera.x / tileSize) - 2, 0, levelLength - 1);
        const endCol = clamp(startCol + Math.ceil(game.screen.width / tileSize) + 4, 0, levelLength - 1);

        ctx.save();
        ctx.translate(-game.camera.x, -game.camera.y);

        for (let x = startCol; x <= endCol; x += 1) {
            for (let y = 0; y < levelHeight; y += 1) {
                const t = levelMap[x][y];
                if (t === TILE.EMPTY) continue;

                const px = x * tileSize;
                const py = y * tileSize;

                if (t === TILE.BLOCK) {
                    ctx.fillStyle = "#0f1026";
                    ctx.fillRect(px, py, tileSize, tileSize);
                    ctx.strokeStyle = "rgba(0, 247, 255, 0.5)";
                    ctx.lineWidth = 1.7;
                    ctx.strokeRect(px + 0.8, py + 0.8, tileSize - 1.6, tileSize - 1.6);
                } else if (t === TILE.SPIKE_UP) {
                    ctx.fillStyle = "#ff4df7";
                    ctx.shadowColor = "#ff4df7";
                    ctx.shadowBlur = 12;
                    ctx.beginPath();
                    ctx.moveTo(px, py + tileSize);
                    ctx.lineTo(px + tileSize / 2, py + 2);
                    ctx.lineTo(px + tileSize, py + tileSize);
                    ctx.fill();
                    ctx.shadowBlur = 0;
                } else if (t === TILE.SPIKE_DOWN) {
                    ctx.fillStyle = "#ff4df7";
                    ctx.shadowColor = "#ff4df7";
                    ctx.shadowBlur = 12;
                    ctx.beginPath();
                    ctx.moveTo(px, py);
                    ctx.lineTo(px + tileSize / 2, py + tileSize - 2);
                    ctx.lineTo(px + tileSize, py);
                    ctx.fill();
                    ctx.shadowBlur = 0;
                } else if (t === TILE.FINISH) {
                    ctx.fillStyle = "#45ff7c";
                    ctx.globalAlpha = 0.6 + Math.sin(game.runtime.time * 5 + x * 0.05) * 0.3;
                    ctx.fillRect(px, py, tileSize, tileSize);
                    ctx.globalAlpha = 1;
                }
            }
        }

        drawPlayer();
        drawParticles();
        ctx.restore();
    }

    function drawPlayer() {
        const p = game.player;

        if (p.trail.length > 2) {
            ctx.beginPath();
            ctx.moveTo(p.trail[0].x, p.trail[0].y);
            for (let i = 1; i < p.trail.length; i += 1) {
                ctx.lineTo(p.trail[i].x, p.trail[i].y);
            }
            ctx.lineWidth = Math.max(3, game.world.tileSize * 0.14);
            ctx.strokeStyle = "rgba(0, 247, 255, 0.45)";
            ctx.shadowColor = "#00f7ff";
            ctx.shadowBlur = 14;
            ctx.stroke();
            ctx.shadowBlur = 0;
        }

        ctx.save();
        ctx.translate(p.x, p.y);
        const tilt = Math.atan2(p.vy, 320);
        ctx.rotate(tilt);
        const shipW = Math.max(16, game.world.tileSize * 0.48);
        const shipH = Math.max(10, game.world.tileSize * 0.28);

        ctx.fillStyle = "#ffffff";
        ctx.shadowColor = "#00f7ff";
        ctx.shadowBlur = 24;
        ctx.beginPath();
        ctx.moveTo(shipW * 0.75, 0);
        ctx.lineTo(-shipW * 0.6, shipH * 0.85);
        ctx.lineTo(-shipW * 0.2, 0);
        ctx.lineTo(-shipW * 0.6, -shipH * 0.85);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = "#00f7ff";
        ctx.beginPath();
        ctx.arc(-shipW * 0.08, 0, shipH * 0.35, 0, Math.PI * 2);
        ctx.fill();

        ctx.shadowBlur = 0;
        ctx.restore();
    }

    function drawParticles() {
        for (const p of game.runtime.particles) {
            ctx.globalAlpha = clamp(p.life, 0, 1);
            ctx.fillStyle = p.color;
            ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
        }
        ctx.globalAlpha = 1;
    }

    function drawPausedBadge() {
        if (game.state !== STATE.PAUSED) return;
        ctx.fillStyle = "rgba(4, 6, 20, 0.48)";
        ctx.fillRect(0, 0, game.screen.width, game.screen.height);
    }

    function render() {
        drawBackground();
        if (game.world.levelMap.length > 0) {
            drawWorld();
        }
        drawPausedBadge();
    }

    function gameLoop(ts) {
        if (!game.loop.lastTs) game.loop.lastTs = ts;
        const dt = Math.min(0.035, (ts - game.loop.lastTs) / 1000);
        game.loop.lastTs = ts;

        update(dt);
        render();
        requestAnimationFrame(gameLoop);
    }

    function bindInput() {
        window.addEventListener("keydown", (e) => {
            if (e.code === "Space" || e.code === "ArrowUp") {
                e.preventDefault();
                handleInput(true);
            }
            if (e.code === "Escape") {
                pauseToggle();
            }
        });

        window.addEventListener("keyup", (e) => {
            if (e.code === "Space" || e.code === "ArrowUp") {
                e.preventDefault();
                handleInput(false);
            }
        });

        window.addEventListener("mousedown", () => handleInput(true));
        window.addEventListener("mouseup", () => handleInput(false));

        window.addEventListener("touchstart", (e) => {
            e.preventDefault();
            handleInput(true);
        }, { passive: false });

        window.addEventListener("touchend", (e) => {
            e.preventDefault();
            handleInput(false);
        }, { passive: false });
    }

    function bindUi() {
        ui.startBeginner.addEventListener("click", () => {
            ensureAudioContext();
            startGame("beginner");
        });

        ui.startMaster.addEventListener("click", () => {
            ensureAudioContext();
            startGame("master");
        });

        ui.retryBtn.addEventListener("click", () => {
            startGame(game.config.id);
        });

        ui.menuBtn.addEventListener("click", leaveToMenu);
        ui.exitBtn.addEventListener("click", leaveToMenu);
        ui.pauseBtn.addEventListener("click", pauseToggle);

        ui.muteBtn.addEventListener("click", () => {
            game.audio.muted = !game.audio.muted;
            updateMuteLabel();
        });

        window.addEventListener("resize", resize);
    }

    function init() {
        resize();
        bindInput();
        bindUi();
        updateMuteLabel();
        showMenu();
        createLevel(game.config);
        resetPlayer();
        requestAnimationFrame(gameLoop);
    }

    init();
})();
