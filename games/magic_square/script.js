/*
 * Магічний квадрат — компактна версія у стилі «Математичної машини».
 * Без зовнішніх бібліотек і без збереження відповідей учнів на сервері.
 */

const MagicSquareGame = (() => {
    const BASE_SQUARE = [8, 1, 6, 3, 5, 7, 4, 9, 2];
    const STORAGE_KEYS = {
        theme: 'magicSquareTheme',
        sound: 'magicSquareSound'
    };

    const LEVELS = {
        easy: { hidden: 3, offsetMax: 5 },
        medium: { hidden: 5, offsetMax: 12 },
        hard: { hidden: 7, offsetMax: 20 }
    };

    const state = {
        solution: [],
        hiddenIndices: [],
        targetSum: 15,
        startTime: 0,
        timerId: null,
        hintsUsed: 0,
        gameOver: false,
        soundEnabled: true
    };

    const dom = {};
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function cacheDom() {
        Object.assign(dom, {
            html: document.documentElement,
            grid: document.getElementById('grid'),
            levelSelect: document.getElementById('level-select'),
            newGameBtn: document.getElementById('new-game-btn'),
            checkBtn: document.getElementById('check-btn'),
            hintBtn: document.getElementById('hint-btn'),
            solutionBtn: document.getElementById('solution-btn'),
            solutionPanel: document.getElementById('solution-panel'),
            message: document.getElementById('message'),
            targetSum: document.getElementById('target-sum'),
            targetSumLarge: document.getElementById('target-sum-large'),
            timer: document.getElementById('timer'),
            bestTime: document.getElementById('best-time'),
            hintCount: document.getElementById('hint-count'),
            progressLabel: document.getElementById('progress-label'),
            progressPercent: document.getElementById('progress-percent'),
            progressFill: document.getElementById('progress-fill'),
            soundToggle: document.getElementById('sound-toggle'),
            themeToggle: document.getElementById('theme-toggle'),
            canvas: document.getElementById('celebration-canvas')
        });
    }

    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    let audioCtx = null;

    function initAudio() {
        if (!state.soundEnabled || !AudioContextClass) return;
        if (!audioCtx) audioCtx = new AudioContextClass();
    }

    function playTone(freq, duration = 0.07, type = 'sine', volume = 0.03) {
        if (!state.soundEnabled) return;
        initAudio();
        if (!audioCtx) return;

        try {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type = type;
            osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
            gain.gain.setValueAtTime(volume, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.start();
            osc.stop(audioCtx.currentTime + duration);
        } catch (error) {
            // Sound is optional. Ignore browser audio restrictions.
        }
    }

    function playSuccess() {
        [523, 659, 784].forEach((freq, index) => {
            window.setTimeout(() => playTone(freq, 0.16), index * 80);
        });
    }

    function playError() {
        playTone(180, 0.18, 'triangle', 0.025);
    }

    function randomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    function shuffle(items) {
        const result = [...items];
        for (let i = result.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [result[i], result[j]] = [result[j], result[i]];
        }
        return result;
    }

    function formatTime(seconds) {
        const minutes = Math.floor(seconds / 60).toString().padStart(2, '0');
        const rest = (seconds % 60).toString().padStart(2, '0');
        return `${minutes}:${rest}`;
    }

    function getElapsedSeconds() {
        return Math.floor((Date.now() - state.startTime) / 1000);
    }

    function rotate90(values) {
        return [
            values[6], values[3], values[0],
            values[7], values[4], values[1],
            values[8], values[5], values[2]
        ];
    }

    function mirrorHorizontal(values) {
        return [
            values[2], values[1], values[0],
            values[5], values[4], values[3],
            values[8], values[7], values[6]
        ];
    }

    function transformSquare(values) {
        let result = [...values];
        const rotations = randomInt(0, 3);
        for (let i = 0; i < rotations; i++) result = rotate90(result);
        if (Math.random() > 0.5) result = mirrorHorizontal(result);
        return result;
    }

    function getBestTimeKey() {
        return `magicSquareBest_${dom.levelSelect.value}`;
    }

    function getBestTime() {
        const saved = localStorage.getItem(getBestTimeKey());
        return saved ? Number(saved) : null;
    }

    function saveBestTime(seconds) {
        const current = getBestTime();
        if (!current || seconds < current) {
            localStorage.setItem(getBestTimeKey(), String(seconds));
            return true;
        }
        return false;
    }

    function updateBestTimeDisplay() {
        const best = getBestTime();
        dom.bestTime.textContent = best ? formatTime(best) : '—';
    }

    function startTimer() {
        state.startTime = Date.now();
        window.clearInterval(state.timerId);
        state.timerId = window.setInterval(updateTimer, 1000);
        updateTimer();
    }

    function stopTimer() {
        window.clearInterval(state.timerId);
        state.timerId = null;
    }

    function updateTimer() {
        dom.timer.textContent = formatTime(getElapsedSeconds());
    }

    function loadPreferences() {
        const savedTheme = localStorage.getItem(STORAGE_KEYS.theme) || 'light';
        const savedSound = localStorage.getItem(STORAGE_KEYS.sound);
        state.soundEnabled = savedSound === null ? true : savedSound === 'true';
        dom.html.setAttribute('data-theme', savedTheme);
        updateSoundButton();
    }

    function updateSoundButton() {
        dom.soundToggle.textContent = state.soundEnabled ? 'Звук: увімк.' : 'Звук: вимк.';
        dom.soundToggle.setAttribute('aria-pressed', String(state.soundEnabled));
    }

    function toggleSound() {
        state.soundEnabled = !state.soundEnabled;
        localStorage.setItem(STORAGE_KEYS.sound, String(state.soundEnabled));
        updateSoundButton();
        if (state.soundEnabled) playTone(620, 0.08);
    }

    function toggleTheme() {
        const current = dom.html.getAttribute('data-theme') || 'light';
        const next = current === 'dark' ? 'light' : 'dark';
        dom.html.setAttribute('data-theme', next);
        localStorage.setItem(STORAGE_KEYS.theme, next);
        playTone(620, 0.08);
    }

    function createPuzzle() {
        const level = LEVELS[dom.levelSelect.value] || LEVELS.medium;
        const offset = randomInt(0, level.offsetMax);
        const shifted = BASE_SQUARE.map(value => value + offset);
        state.solution = transformSquare(shifted);
        state.targetSum = 15 + offset * 3;
        state.hiddenIndices = shuffle([0, 1, 2, 3, 4, 5, 6, 7, 8]).slice(0, level.hidden).sort((a, b) => a - b);
    }

    function renderGrid() {
        dom.grid.innerHTML = '';

        state.solution.forEach((value, index) => {
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.dataset.index = String(index);

            if (state.hiddenIndices.includes(index)) {
                cell.classList.add('input-cell');
                const input = document.createElement('input');
                input.type = 'text';
                input.inputMode = 'numeric';
                input.autocomplete = 'off';
                input.maxLength = '3';
                input.setAttribute('aria-label', `Клітинка ${Math.floor(index / 3) + 1}, ${index % 3 + 1}`);
                input.addEventListener('input', handleInput);
                input.addEventListener('keydown', handleKeydown);
                cell.appendChild(input);
            } else {
                cell.classList.add('filled');
                cell.textContent = String(value);
            }

            dom.grid.appendChild(cell);
        });

        window.setTimeout(() => {
            const firstInput = dom.grid.querySelector('input:not(:disabled)');
            if (firstInput) firstInput.focus({ preventScroll: true });
        }, 80);
    }

    function newGame() {
        initAudio();
        state.hintsUsed = 0;
        state.gameOver = false;
        hideMessage();
        dom.solutionPanel.hidden = true;
        dom.solutionPanel.innerHTML = '';
        dom.solutionBtn.textContent = 'Пояснення';
        dom.solutionBtn.disabled = true;
        dom.checkBtn.disabled = false;
        dom.hintBtn.disabled = false;

        createPuzzle();
        renderGrid();
        updateStaticStats();
        updateProgress();
        startTimer();
        updateBestTimeDisplay();
        playTone(440, 0.08);
    }

    function updateStaticStats() {
        dom.targetSum.textContent = String(state.targetSum);
        dom.targetSumLarge.textContent = String(state.targetSum);
        dom.hintCount.textContent = String(state.hintsUsed);
    }

    function getInputs() {
        return Array.from(dom.grid.querySelectorAll('input'));
    }

    function getFilledCount() {
        return getInputs().filter(input => input.value.trim() !== '').length;
    }

    function updateProgress() {
        const total = state.hiddenIndices.length;
        const filled = getFilledCount();
        const percent = total ? Math.round((filled / total) * 100) : 0;
        dom.progressLabel.textContent = `Заповнено ${filled} із ${total}`;
        dom.progressPercent.textContent = `${percent}%`;
        dom.progressFill.style.width = `${percent}%`;
        dom.hintCount.textContent = String(state.hintsUsed);
    }

    function handleInput(event) {
        initAudio();
        const input = event.currentTarget;
        const oldValue = input.value;
        input.value = input.value.replace(/[^0-9]/g, '');
        input.closest('.cell')?.classList.remove('wrong', 'correct');
        hideMessage();
        updateProgress();

        if (input.value && input.value !== oldValue) playTone(640, 0.035, 'sine', 0.018);
    }

    function handleKeydown(event) {
        const currentCell = event.currentTarget.closest('.cell');
        if (!currentCell) return;

        const currentIndex = Number(currentCell.dataset.index);
        const row = Math.floor(currentIndex / 3);
        const col = currentIndex % 3;
        let targetIndex = null;

        if (event.key === 'Enter') {
            event.preventDefault();
            moveFocusToNextInput(event.currentTarget);
            return;
        }

        if (event.key === 'Backspace' && event.currentTarget.value === '') {
            moveFocusToPreviousInput(event.currentTarget);
            return;
        }

        if (event.key === 'ArrowUp' && row > 0) targetIndex = currentIndex - 3;
        if (event.key === 'ArrowDown' && row < 2) targetIndex = currentIndex + 3;
        if (event.key === 'ArrowLeft' && col > 0) targetIndex = currentIndex - 1;
        if (event.key === 'ArrowRight' && col < 2) targetIndex = currentIndex + 1;

        if (targetIndex !== null) {
            event.preventDefault();
            const targetInput = dom.grid.querySelector(`.cell[data-index="${targetIndex}"] input:not(:disabled)`);
            if (targetInput) {
                targetInput.focus();
                playTone(560, 0.035, 'sine', 0.016);
            }
        }
    }

    function moveFocusToNextInput(currentInput) {
        const inputs = getInputs().filter(input => !input.disabled);
        const index = inputs.indexOf(currentInput);
        const next = inputs[index + 1];
        if (next) {
            next.focus();
        } else {
            checkAnswers(true);
        }
    }

    function moveFocusToPreviousInput(currentInput) {
        const inputs = getInputs().filter(input => !input.disabled);
        const index = inputs.indexOf(currentInput);
        const previous = inputs[index - 1];
        if (previous) previous.focus();
    }

    function readGridValues() {
        const values = [...state.solution];
        let complete = true;

        getInputs().forEach(input => {
            const index = Number(input.closest('.cell').dataset.index);
            const value = Number(input.value);
            if (input.value.trim() === '' || Number.isNaN(value)) {
                complete = false;
                values[index] = null;
            } else {
                values[index] = value;
            }
        });

        return { values, complete };
    }

    function getLineSums(values) {
        return [
            values[0] + values[1] + values[2],
            values[3] + values[4] + values[5],
            values[6] + values[7] + values[8],
            values[0] + values[3] + values[6],
            values[1] + values[4] + values[7],
            values[2] + values[5] + values[8],
            values[0] + values[4] + values[8],
            values[2] + values[4] + values[6]
        ];
    }

    function allLinesAreMagic(values) {
        return getLineSums(values).every(sum => sum === state.targetSum);
    }

    function markErrors() {
        getInputs().forEach(input => {
            const cell = input.closest('.cell');
            const index = Number(cell.dataset.index);
            const value = Number(input.value);
            cell.classList.remove('correct', 'wrong');

            if (value === state.solution[index]) {
                cell.classList.add('correct');
            } else if (input.value.trim() !== '') {
                cell.classList.add('wrong');
            }
        });
    }

    function checkAnswers(forceMessage = false) {
        if (state.gameOver) return;
        initAudio();

        const { values, complete } = readGridValues();
        markErrors();
        updateProgress();

        if (!complete) {
            if (forceMessage) {
                showMessage('Заповни всі порожні клітинки, а потім перевір ще раз.', 'warning');
                shakeGrid();
                playError();
            }
            return;
        }

        const allCorrect = state.hiddenIndices.every(index => values[index] === state.solution[index]);
        if (allCorrect && allLinesAreMagic(values)) {
            finishGame();
            return;
        }

        showMessage('Є помилки. Перевір рядки, стовпці та діагоналі.', 'error');
        dom.solutionBtn.disabled = false;
        playError();
    }

    function showHint() {
        if (state.gameOver) return;
        initAudio();

        const availableInputs = getInputs().filter(input => !input.disabled && input.value.trim() === '');
        const inputs = availableInputs.length ? availableInputs : getInputs().filter(input => !input.disabled);
        if (!inputs.length) return;

        const input = inputs[Math.floor(Math.random() * inputs.length)];
        const cell = input.closest('.cell');
        const index = Number(cell.dataset.index);

        input.value = String(state.solution[index]);
        input.disabled = true;
        cell.classList.remove('wrong');
        cell.classList.add('hint');
        state.hintsUsed++;
        updateProgress();
        playTone(720, 0.12, 'sine', 0.025);

        checkAnswers(false);
    }

    function finishGame() {
        state.gameOver = true;
        stopTimer();
        const elapsed = getElapsedSeconds();
        const isRecord = saveBestTime(elapsed);
        updateBestTimeDisplay();

        getInputs().forEach(input => {
            input.disabled = true;
            input.closest('.cell')?.classList.add('correct');
        });

        dom.checkBtn.disabled = true;
        dom.hintBtn.disabled = true;
        dom.solutionBtn.disabled = false;

        showMessage(`Готово! Час: ${formatTime(elapsed)}.${isRecord ? ' Новий рекорд.' : ''}${state.hintsUsed ? ` Підказки: ${state.hintsUsed}.` : ''}`, 'success');
        playSuccess();
        launchConfetti();
    }

    function showMessage(text, type) {
        dom.message.hidden = false;
        dom.message.className = `message ${type}`;
        dom.message.textContent = text;
    }

    function hideMessage() {
        dom.message.hidden = true;
        dom.message.className = 'message';
        dom.message.textContent = '';
    }

    function shakeGrid() {
        dom.grid.classList.add('shake-grid');
        window.setTimeout(() => dom.grid.classList.remove('shake-grid'), 500);
    }

    function toggleSolutions() {
        if (dom.solutionPanel.hidden) {
            renderSolutions();
            dom.solutionPanel.hidden = false;
            dom.solutionBtn.textContent = 'Сховати пояснення';
            dom.solutionPanel.scrollIntoView({ block: 'nearest', behavior: reduceMotion ? 'auto' : 'smooth' });
        } else {
            dom.solutionPanel.hidden = true;
            dom.solutionBtn.textContent = 'Пояснення';
        }
    }

    function renderSolutions() {
        const cells = state.solution.map(value => `<div class="solution-cell">${value}</div>`).join('');
        dom.solutionPanel.innerHTML = `
            <h2>Пояснення</h2>
            <div class="solution-grid" aria-label="Повний розв’язок магічного квадрата">${cells}</div>
            <p class="solution-text">Магічна сума дорівнює ${state.targetSum}. Щоб знайти пропуск, обери рядок, стовпець або діагональ із двома відомими числами та відніми їх від ${state.targetSum}.</p>
        `;
    }

    class Confetti {
        constructor(canvas) {
            this.canvas = canvas;
            this.ctx = canvas.getContext('2d');
            this.particles = [];
            this.frame = null;
            this.resize();
            window.addEventListener('resize', () => this.resize());
        }

        resize() {
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;
        }

        burst() {
            if (reduceMotion) return;
            const colors = ['#286f72', '#b66c24', '#18794e', '#5b6ee1'];
            const startX = this.canvas.width / 2;
            const startY = Math.min(this.canvas.height * 0.35, 260);

            for (let i = 0; i < 70; i++) {
                this.particles.push({
                    x: startX,
                    y: startY,
                    vx: (Math.random() - 0.5) * 11,
                    vy: (Math.random() - 0.85) * 10,
                    size: Math.random() * 5 + 3,
                    color: colors[Math.floor(Math.random() * colors.length)],
                    rotation: Math.random() * Math.PI,
                    rotationSpeed: (Math.random() - 0.5) * 0.25,
                    life: 1,
                    decay: Math.random() * 0.018 + 0.012
                });
            }

            if (!this.frame) this.animate();
        }

        animate() {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this.particles = this.particles.filter(particle => particle.life > 0);

            this.particles.forEach(particle => {
                particle.x += particle.vx;
                particle.y += particle.vy;
                particle.vy += 0.18;
                particle.rotation += particle.rotationSpeed;
                particle.life -= particle.decay;

                this.ctx.save();
                this.ctx.translate(particle.x, particle.y);
                this.ctx.rotate(particle.rotation);
                this.ctx.globalAlpha = Math.max(0, particle.life);
                this.ctx.fillStyle = particle.color;
                this.ctx.fillRect(-particle.size / 2, -particle.size / 2, particle.size, particle.size);
                this.ctx.restore();
            });

            if (this.particles.length) {
                this.frame = requestAnimationFrame(() => this.animate());
            } else {
                this.frame = null;
                this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            }
        }
    }

    let confetti = null;

    function launchConfetti() {
        if (!confetti) confetti = new Confetti(dom.canvas);
        confetti.burst();
    }

    function bindEvents() {
        dom.newGameBtn.addEventListener('click', newGame);
        dom.levelSelect.addEventListener('change', newGame);
        dom.checkBtn.addEventListener('click', () => checkAnswers(true));
        dom.hintBtn.addEventListener('click', showHint);
        dom.solutionBtn.addEventListener('click', toggleSolutions);
        dom.soundToggle.addEventListener('click', toggleSound);
        dom.themeToggle.addEventListener('click', toggleTheme);
    }

    function init() {
        cacheDom();
        loadPreferences();
        bindEvents();
        newGame();
    }

    return { init };
})();

document.addEventListener('DOMContentLoaded', MagicSquareGame.init);
