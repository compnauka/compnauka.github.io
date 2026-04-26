/*
 * Математична машина — компактна версія з акцентом на завданнях.
 * Без зовнішніх бібліотек, без збереження учнівських відповідей на сервері.
 */

const MathPuzzles = (() => {
    const STORAGE_KEYS = {
        theme: 'mathPuzzlesTheme',
        sound: 'mathPuzzlesSound'
    };

    const state = {
        answers: {},
        puzzles: [],
        attempts: 0,
        hintsUsed: 0,
        soundEnabled: true,
        checkedOnce: false
    };

    const dom = {};
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function cacheDom() {
        Object.assign(dom, {
            html: document.documentElement,
            container: document.getElementById('puzzles-container'),
            level: document.getElementById('level'),
            taskCount: document.getElementById('task-count'),
            newSetBtn: document.getElementById('new-set-btn'),
            checkBtn: document.getElementById('check-btn'),
            globalHintBtn: document.getElementById('global-hint-btn'),
            solutionBtn: document.getElementById('solution-btn'),
            result: document.getElementById('result-summary'),
            solutionPanel: document.getElementById('solution-panel'),
            themeToggle: document.getElementById('theme-toggle'),
            soundToggle: document.getElementById('sound-toggle'),
            progressFill: document.getElementById('progress-fill'),
            progressLabel: document.getElementById('progress-label'),
            progressPercent: document.getElementById('progress-percent'),
            statHints: document.getElementById('stat-hints'),
            statAttempts: document.getElementById('stat-attempts'),
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

    function escapeHtml(value) {
        return String(value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    function addAnswer(id, value) {
        state.answers[id] = Number(value);
    }

    function inputMarkup(id, label) {
        return `<input class="game-input" id="${id}" data-answer-id="${id}" inputmode="numeric" autocomplete="off" maxlength="4" aria-label="${escapeHtml(label)}">`;
    }

    function valueBlock(value) {
        return `<div class="number-block">${value}</div>`;
    }

    function inputBlock(id, label) {
        return `<div class="number-block input-holder">${inputMarkup(id, label)}</div>`;
    }

    function symbolToken(label) {
        return `<span class="symbol-token" aria-label="Символ ${escapeHtml(label)}">${escapeHtml(label)}</span>`;
    }

    function levelConfig() {
        const level = dom.level.value;
        return {
            level,
            maxBase: level === 'easy' ? 12 : level === 'medium' ? 24 : 42,
            hiddenPyramid: level === 'easy' ? 1 : level === 'medium' ? 2 : 3,
            hiddenMagic: level === 'easy' ? 3 : level === 'medium' ? 4 : 5,
            hiddenSequence: level === 'easy' ? 1 : level === 'medium' ? 2 : 3,
            operationMax: level === 'easy' ? 25 : level === 'medium' ? 60 : 99
        };
    }

    function cardMarkup(puzzle, body) {
        return `
            <article class="puzzle-card" id="${puzzle.id}" data-puzzle-id="${puzzle.id}" data-status="idle" style="animation-delay:${puzzle.index * 35}ms">
                <header class="puzzle-header">
                    <span class="puzzle-number">${String(puzzle.index + 1).padStart(2, '0')}</span>
                    <div>
                        <h3 class="puzzle-title">${escapeHtml(puzzle.title)}</h3>
                        <p class="puzzle-desc">${escapeHtml(puzzle.description)}</p>
                    </div>
                    <span class="skill-pill">${escapeHtml(puzzle.skill)}</span>
                </header>
                <div class="puzzle-body">${body}</div>
                <div class="hint-box" id="hint-${puzzle.id}" aria-live="polite"></div>
                <footer class="puzzle-footer">
                    <button class="button button-ghost puzzle-hint-btn" type="button" data-hint-for="${puzzle.id}">Підказка</button>
                    <span class="inline-feedback" id="feedback-${puzzle.id}" aria-live="polite"></span>
                </footer>
            </article>
        `;
    }

    function createSequence(index, cfg) {
        const start = randomInt(2, cfg.level === 'easy' ? 14 : cfg.level === 'medium' ? 28 : 45);
        const step = randomInt(2, cfg.level === 'easy' ? 5 : cfg.level === 'medium' ? 9 : 15);
        const sequence = Array.from({ length: 5 }, (_, position) => start + position * step);
        const hiddenPositions = shuffle([0, 1, 2, 3, 4]).slice(0, cfg.hiddenSequence);
        const hiddenMap = new Map();

        hiddenPositions.forEach((position, localIndex) => {
            const id = `seq-${index}-${localIndex}`;
            addAnswer(id, sequence[position]);
            hiddenMap.set(position, id);
        });

        const nodes = sequence.map((value, position) => {
            const node = hiddenMap.has(position)
                ? `<div class="seq-node input-holder">${inputMarkup(hiddenMap.get(position), `Число ${position + 1}`)}</div>`
                : `<div class="seq-node">${value}</div>`;
            return position === 0 ? node : `<span class="seq-arrow">→</span>${node}`;
        }).join('');

        const puzzle = {
            id: `puzzle-sequence-${index}`,
            index,
            type: 'sequence',
            title: 'Числовий ланцюжок',
            skill: 'закономірності',
            description: 'Визнач правило зміни чисел і заповни пропуски.',
            answerIds: Array.from(hiddenMap.values()),
            hints: [
                'Порівняй два сусідні відомі числа. Наскільки вони відрізняються?',
                `У цьому ланцюжку щоразу додається ${step}.`,
                `Початок ланцюжка: ${sequence.slice(0, 3).join(', ')}...`
            ],
            solution: `Правило: щоразу додаємо ${step}. Повний ланцюжок: ${sequence.join(' → ')}.`
        };

        puzzle.markup = cardMarkup(puzzle, `<div class="sequence">${nodes}</div>`);
        return puzzle;
    }

    function createPyramid(index, cfg) {
        const a = randomInt(3, cfg.maxBase);
        const b = randomInt(3, cfg.maxBase);
        const c = randomInt(3, cfg.maxBase);
        const d = a + b;
        const e = b + c;
        const f = d + e;

        const candidates = [
            { id: `pyramid-${index}-top`, value: f, label: 'Верхня цеглинка' },
            { id: `pyramid-${index}-mid-left`, value: d, label: 'Ліва цеглинка другого ряду' },
            { id: `pyramid-${index}-bottom-right`, value: c, label: 'Права нижня цеглинка' }
        ];
        const hidden = shuffle(candidates).slice(0, cfg.hiddenPyramid);
        const hiddenIds = new Set(hidden.map(item => item.id));
        hidden.forEach(item => addAnswer(item.id, item.value));

        const cell = (id, value, label) => hiddenIds.has(id) ? inputBlock(id, label) : valueBlock(value);

        const body = `
            <div class="pyramid" role="group" aria-label="Математична піраміда">
                <div class="pyramid-row">${cell(`pyramid-${index}-top`, f, 'Верхня цеглинка')}</div>
                <div class="pyramid-row">
                    ${cell(`pyramid-${index}-mid-left`, d, 'Ліва цеглинка другого ряду')}
                    ${valueBlock(e)}
                </div>
                <div class="pyramid-row">
                    ${valueBlock(a)}
                    ${valueBlock(b)}
                    ${cell(`pyramid-${index}-bottom-right`, c, 'Права нижня цеглинка')}
                </div>
            </div>
        `;

        const puzzle = {
            id: `puzzle-pyramid-${index}`,
            index,
            type: 'pyramid',
            title: 'Математична піраміда',
            skill: 'додавання',
            description: 'Кожна верхня цеглинка — сума двох цеглинок під нею.',
            answerIds: hidden.map(item => item.id),
            hints: [
                'Працюй знизу вгору: дві сусідні цеглинки утворюють цеглинку над ними.',
                `Правий блок другого ряду: ${b} + ${c} = ${e}.`,
                'Якщо шукаєш нижню цеглинку, відніми від верхньої сусідню нижню.'
            ],
            solution: `Нижній ряд: ${a}, ${b}, ${c}. Другий ряд: ${a} + ${b} = ${d}, ${b} + ${c} = ${e}. Верх: ${d} + ${e} = ${f}.`
        };

        puzzle.markup = cardMarkup(puzzle, body);
        return puzzle;
    }

    function createBalance(index, cfg) {
        const max = cfg.level === 'easy' ? 25 : cfg.level === 'medium' ? 55 : 90;
        let leftKnown;
        let unknown;
        let rightA;
        let rightB;

        do {
            leftKnown = randomInt(4, max);
            unknown = randomInt(4, max);
            rightA = randomInt(4, max);
            rightB = leftKnown + unknown - rightA;
        } while (rightB <= 0 || rightB > max);

        const answerId = `balance-${index}`;
        addAnswer(answerId, unknown);

        const optionsSet = new Set([unknown]);
        let attempts = 0;
        while (optionsSet.size < 4 && attempts < 100) {
            const candidate = unknown + randomInt(-14, 14);
            if (candidate > 0 && candidate <= max) optionsSet.add(candidate);
            attempts++;
        }
        let fallback = 1;
        while (optionsSet.size < 4) {
            if (fallback !== unknown) optionsSet.add(fallback);
            fallback++;
        }

        const options = shuffle(Array.from(optionsSet));
        const optionButtons = options.map(value => `
            <button class="choice-button" type="button" data-choice-for="${answerId}" data-value="${value}" aria-label="Обрати ${value}">${value}</button>
        `).join('');

        const body = `
            <div class="balance-board">
                <div class="balance-equation" aria-label="Рівність на терезах">
                    ${valueBlock(leftKnown)}
                    <strong>+</strong>
                    <div id="${answerId}" class="choice-answer" data-answer-id="${answerId}">?</div>
                    <strong>=</strong>
                    ${valueBlock(rightA)}
                    <strong>+</strong>
                    ${valueBlock(rightB)}
                </div>
                <div class="choice-list" aria-label="Варіанти відповіді">
                    ${optionButtons}
                </div>
            </div>
        `;

        const puzzle = {
            id: `puzzle-balance-${index}`,
            index,
            type: 'balance',
            title: 'Рівність на терезах',
            skill: 'рівняння',
            description: 'Обери число, щоб ліва і права частини були рівними.',
            answerIds: [answerId],
            hints: [
                `Спочатку порахуй праву частину: ${rightA} + ${rightB}.`,
                `Права частина дорівнює ${rightA + rightB}. Тепер відніми ${leftKnown}.`,
                `Шукане число: ${rightA + rightB} − ${leftKnown}.`
            ],
            solution: `Права частина: ${rightA} + ${rightB} = ${rightA + rightB}. Тому невідоме число: ${rightA + rightB} − ${leftKnown} = ${unknown}.`
        };

        puzzle.markup = cardMarkup(puzzle, body);
        return puzzle;
    }

    function createSymbols(index, cfg) {
        const max = cfg.level === 'easy' ? 8 : cfg.level === 'medium' ? 15 : 24;
        const circle = randomInt(2, max);
        const triangle = randomInt(2, max);
        const square = randomInt(2, max);
        const answer = circle + triangle + square;
        const answerId = `symbols-${index}`;
        addAnswer(answerId, answer);

        const body = `
            <div class="symbol-board">
                <div class="equation-list">
                    <div class="equation-row">
                        <div class="equation-expression">${symbolToken('●')} + ${symbolToken('●')}</div>
                        <strong>=</strong>
                        <strong>${circle * 2}</strong>
                    </div>
                    <div class="equation-row">
                        <div class="equation-expression">${symbolToken('●')} + ${symbolToken('▲')}</div>
                        <strong>=</strong>
                        <strong>${circle + triangle}</strong>
                    </div>
                    <div class="equation-row">
                        <div class="equation-expression">${symbolToken('▲')} + ${symbolToken('■')}</div>
                        <strong>=</strong>
                        <strong>${triangle + square}</strong>
                    </div>
                    <div class="equation-row target-row">
                        <div class="equation-expression">${symbolToken('●')} + ${symbolToken('▲')} + ${symbolToken('■')}</div>
                        <strong>=</strong>
                        <div class="input-holder">${inputMarkup(answerId, 'Сума символів')}</div>
                    </div>
                </div>
            </div>
        `;

        const puzzle = {
            id: `puzzle-symbols-${index}`,
            index,
            type: 'symbols',
            title: 'Символьна логіка',
            skill: 'аналіз',
            description: 'Знайди значення символів і розв’яжи останній приклад.',
            answerIds: [answerId],
            hints: [
                'Почни з першого рядка: два однакові символи дають відому суму.',
                `Якщо ● + ● = ${circle * 2}, то ● = ${circle}.`,
                `Далі знайди ▲, потім ■, і лише після цього рахуй останній рядок.`
            ],
            solution: `● = ${circle}, бо ${circle} + ${circle} = ${circle * 2}. ▲ = ${triangle}, бо ${circle} + ${triangle} = ${circle + triangle}. ■ = ${square}, бо ${triangle} + ${square} = ${triangle + square}. Отже, ${circle} + ${triangle} + ${square} = ${answer}.`
        };

        puzzle.markup = cardMarkup(puzzle, body);
        return puzzle;
    }

    function rotateSquare(square) {
        return [
            [square[2][0], square[1][0], square[0][0]],
            [square[2][1], square[1][1], square[0][1]],
            [square[2][2], square[1][2], square[0][2]]
        ];
    }

    function createMagicSquare(index, cfg) {
        const shift = randomInt(1, cfg.level === 'easy' ? 3 : cfg.level === 'medium' ? 6 : 12);
        let square = [[8, 1, 6], [3, 5, 7], [4, 9, 2]].map(row => row.map(value => value + shift));
        const targetSum = 15 + shift * 3;

        const rotations = randomInt(0, 3);
        for (let i = 0; i < rotations; i++) square = rotateSquare(square);
        if (Math.random() > 0.5) square = square.map(row => [...row].reverse());

        const positions = shuffle([
            [0, 0], [0, 1], [0, 2],
            [1, 0], [1, 1], [1, 2],
            [2, 0], [2, 1], [2, 2]
        ]).slice(0, cfg.hiddenMagic);

        const hidden = new Map();
        positions.forEach(([row, col], localIndex) => {
            const id = `magic-${index}-${localIndex}`;
            addAnswer(id, square[row][col]);
            hidden.set(`${row},${col}`, id);
        });

        let cells = '';
        for (let row = 0; row < 3; row++) {
            for (let col = 0; col < 3; col++) {
                const key = `${row},${col}`;
                if (hidden.has(key)) {
                    cells += `<div class="magic-cell input-holder">${inputMarkup(hidden.get(key), `Клітинка ${row + 1}, ${col + 1}`)}</div>`;
                } else {
                    cells += `<div class="magic-cell">${square[row][col]}</div>`;
                }
            }
        }

        const puzzle = {
            id: `puzzle-magic-${index}`,
            index,
            type: 'magic',
            title: 'Магічний квадрат',
            skill: 'суми',
            description: `У кожному рядку, стовпчику й діагоналі сума має бути ${targetSum}.`,
            answerIds: Array.from(hidden.values()),
            hints: [
                `Шукай рядок або стовпчик, де невідоме лише одне число. Сума має бути ${targetSum}.`,
                'Щоб знайти пропуск, від магічної суми відніми два відомі числа.',
                'Перевір кожну відповідь у рядку і в стовпчику одночасно.'
            ],
            solution: `Магічна сума — ${targetSum}. Повний квадрат: ${square.map(row => row.join(', ')).join(' / ')}.`
        };

        puzzle.markup = cardMarkup(puzzle, `<div class="magic-square" aria-label="Магічний квадрат">${cells}</div>`);
        return puzzle;
    }

    function createMachine(index, cfg) {
        const operation = Math.random() > 0.5 ? 'add' : 'multiply';
        const start = randomInt(2, cfg.level === 'easy' ? 12 : cfg.level === 'medium' ? 25 : 45);
        const operand = operation === 'add'
            ? randomInt(3, cfg.level === 'easy' ? 12 : cfg.level === 'medium' ? 25 : 45)
            : randomInt(2, cfg.level === 'easy' ? 5 : cfg.level === 'medium' ? 8 : 11);
        const result = operation === 'add' ? start + operand : start * operand;
        const answerId = `machine-${index}`;
        addAnswer(answerId, result);

        const sign = operation === 'add' ? `+ ${operand}` : `× ${operand}`;
        const operationText = operation === 'add' ? 'додавання' : 'множення';

        const body = `
            <div class="machine" aria-label="Математична машина">
                <div class="machine-box">${start}</div>
                <span class="seq-arrow">→</span>
                <div class="operation-box">${sign}</div>
                <span class="seq-arrow">→</span>
                <div class="input-holder">${inputMarkup(answerId, 'Результат математичної машини')}</div>
            </div>
        `;

        const puzzle = {
            id: `puzzle-machine-${index}`,
            index,
            type: 'machine',
            title: 'Математична машина',
            skill: operationText,
            description: 'Виконай дію машини та запиши результат.',
            answerIds: [answerId],
            hints: [
                `Машина бере число ${start} і виконує дію ${sign}.`,
                operation === 'add' ? `Потрібно додати ${operand}.` : `Потрібно взяти ${start} по ${operand} разів.`,
                `Результат: ${start} ${operation === 'add' ? '+' : '×'} ${operand}.`
            ],
            solution: `Машина виконує дію ${start} ${operation === 'add' ? '+' : '×'} ${operand} = ${result}.`
        };

        puzzle.markup = cardMarkup(puzzle, body);
        return puzzle;
    }

    function generateSet() {
        state.answers = {};
        state.puzzles = [];
        state.attempts = 0;
        state.hintsUsed = 0;
        state.checkedOnce = false;

        dom.result.hidden = true;
        dom.result.className = 'result-summary';
        dom.result.textContent = '';
        dom.solutionPanel.hidden = true;
        dom.solutionPanel.innerHTML = '';
        dom.solutionBtn.disabled = true;

        const cfg = levelConfig();
        const count = Number(dom.taskCount.value || 4);
        const generators = shuffle([
            createSequence,
            createPyramid,
            createBalance,
            createSymbols,
            createMagicSquare,
            createMachine
        ]).slice(0, count);

        state.puzzles = generators.map((generator, index) => generator(index, cfg));
        dom.container.innerHTML = state.puzzles.map(puzzle => puzzle.markup).join('');

        bindDynamicControls();
        updateProgress();

        window.setTimeout(() => {
            const firstInput = dom.container.querySelector('.game-input');
            if (firstInput) firstInput.focus({ preventScroll: true });
        }, 80);
    }

    function bindDynamicControls() {
        dom.container.querySelectorAll('.game-input').forEach(input => {
            input.addEventListener('input', handleInput);
            input.addEventListener('keydown', handleInputKeydown);
        });

        dom.container.querySelectorAll('.choice-button').forEach(button => {
            button.addEventListener('click', handleChoiceClick);
        });

        dom.container.querySelectorAll('.puzzle-hint-btn').forEach(button => {
            button.addEventListener('click', () => showHint(button.dataset.hintFor));
        });
    }

    function handleInput(event) {
        initAudio();
        const input = event.currentTarget;
        const oldValue = input.value;
        input.value = input.value.replace(/[^0-9]/g, '');
        input.classList.remove('correct', 'wrong');
        const card = input.closest('.puzzle-card');
        if (card) {
            card.dataset.status = 'idle';
            const feedback = document.getElementById(`feedback-${card.dataset.puzzleId}`);
            if (feedback) {
                feedback.textContent = '';
                feedback.className = 'inline-feedback';
            }
        }
        if (input.value && input.value !== oldValue) playTone(640, 0.035, 'sine', 0.018);
    }

    function handleInputKeydown(event) {
        const inputs = Array.from(dom.container.querySelectorAll('.game-input:not([disabled])'));
        const index = inputs.indexOf(event.currentTarget);
        if (index === -1) return;

        const moveNext = () => {
            const next = inputs[index + 1];
            if (next) next.focus();
            else dom.checkBtn.focus();
        };

        const movePrevious = () => {
            const previous = inputs[index - 1];
            if (previous) previous.focus();
        };

        if (event.key === 'Enter' || event.key === 'ArrowRight' || event.key === 'ArrowDown') {
            event.preventDefault();
            moveNext();
        }
        if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
            event.preventDefault();
            movePrevious();
        }
    }

    function handleChoiceClick(event) {
        initAudio();
        const button = event.currentTarget;
        const answerId = button.dataset.choiceFor;
        const value = button.dataset.value;
        const target = document.getElementById(answerId);
        if (!target) return;

        const card = target.closest('.puzzle-card');
        card?.querySelectorAll(`.choice-button[data-choice-for="${answerId}"]`).forEach(item => {
            item.classList.toggle('selected', item === button);
        });

        target.textContent = value;
        target.dataset.userAnswer = value;
        target.classList.add('filled');
        target.classList.remove('correct', 'wrong');
        if (card) {
            card.dataset.status = 'idle';
            const feedback = document.getElementById(`feedback-${card.dataset.puzzleId}`);
            if (feedback) {
                feedback.textContent = '';
                feedback.className = 'inline-feedback';
            }
        }
        playTone(680, 0.05, 'sine', 0.02);
    }

    function getUserAnswer(id) {
        const element = document.getElementById(id);
        if (!element) return NaN;
        if (element.classList.contains('choice-answer')) return Number(element.dataset.userAnswer);
        return Number(element.value);
    }


    function getSolvedTaskCount() {
        return state.puzzles.filter(puzzle => puzzle.answerIds.every(id => getUserAnswer(id) === state.answers[id])).length;
    }

    function updateSoundButton() {
        if (!dom.soundToggle) return;
        dom.soundToggle.textContent = state.soundEnabled ? 'Звук: увімк.' : 'Звук: вимк.';
        dom.soundToggle.setAttribute('aria-pressed', String(state.soundEnabled));
    }

    function clearAnswerStyles() {
        dom.container.querySelectorAll('.game-input, .choice-answer').forEach(element => {
            element.classList.remove('correct', 'wrong');
        });
        dom.container.querySelectorAll('.puzzle-card').forEach(card => {
            card.dataset.status = 'idle';
        });
        dom.container.querySelectorAll('.inline-feedback').forEach(feedback => {
            feedback.textContent = '';
            feedback.className = 'inline-feedback';
        });
    }

    function checkAnswers() {
        initAudio();
        clearAnswerStyles();
        state.attempts++;
        state.checkedOnce = true;

        let correct = 0;
        let filled = 0;
        const total = Object.keys(state.answers).length;

        for (const [id, answer] of Object.entries(state.answers)) {
            const element = document.getElementById(id);
            const userAnswer = getUserAnswer(id);
            if (!element || Number.isNaN(userAnswer)) continue;
            filled++;
            if (userAnswer === answer) {
                correct++;
                element.classList.add('correct');
            } else {
                element.classList.add('wrong');
            }
        }

        state.puzzles.forEach(puzzle => {
            const card = document.getElementById(puzzle.id);
            const feedback = document.getElementById(`feedback-${puzzle.id}`);
            const answered = puzzle.answerIds.filter(id => !Number.isNaN(getUserAnswer(id))).length;
            const right = puzzle.answerIds.filter(id => getUserAnswer(id) === state.answers[id]).length;

            if (!card || !feedback) return;
            if (right === puzzle.answerIds.length) {
                card.dataset.status = 'correct';
                feedback.textContent = 'Правильно';
                feedback.classList.add('good');
            } else if (answered === 0) {
                card.dataset.status = 'idle';
                feedback.textContent = 'Очікує відповідь';
            } else {
                card.dataset.status = 'wrong';
                feedback.textContent = 'Перевір ще раз';
                feedback.classList.add('bad');
            }
        });

        const totalTasks = state.puzzles.length;
        const solvedTasks = getSolvedTaskCount();

        updateProgress();
        dom.solutionBtn.disabled = false;
        dom.result.hidden = false;
        dom.result.className = 'result-summary';

        if (correct === total && filled === total) {
            dom.result.classList.add('success');
            dom.result.innerHTML = `Готово: усі <strong>${totalTasks}</strong> завдань виконано правильно.`;
            playSuccess();
            launchConfetti();
        } else if (filled < total) {
            dom.result.classList.add('warning');
            dom.result.innerHTML = `Правильно виконано <strong>${solvedTasks} із ${totalTasks}</strong> завдань. Є порожні відповіді.`;
            playError();
        } else {
            dom.result.classList.add('error');
            dom.result.innerHTML = `Правильно виконано <strong>${solvedTasks} із ${totalTasks}</strong> завдань. Помилки підсвічені.`;
            playError();
        }
    }


    function updateProgress() {
        const totalTasks = state.puzzles.length;
        const solvedTasks = getSolvedTaskCount();
        const percent = totalTasks ? Math.round((solvedTasks / totalTasks) * 100) : 0;
        dom.progressFill.style.width = `${percent}%`;
        dom.progressLabel.textContent = `${solvedTasks} із ${totalTasks} завдань`;
        dom.progressPercent.textContent = `${percent}%`;
        dom.statHints.textContent = String(state.hintsUsed);
        dom.statAttempts.textContent = String(state.attempts);
    }

    function showHint(puzzleId) {
        initAudio();
        let puzzle = state.puzzles.find(item => item.id === puzzleId);

        if (!puzzle) {
            puzzle = state.puzzles.find(item => item.answerIds.some(id => getUserAnswer(id) !== state.answers[id])) || state.puzzles[0];
        }
        if (!puzzle) return;

        puzzle.hintIndex = puzzle.hintIndex || 0;
        const hint = puzzle.hints[Math.min(puzzle.hintIndex, puzzle.hints.length - 1)];
        puzzle.hintIndex++;
        state.hintsUsed++;

        const hintBox = document.getElementById(`hint-${puzzle.id}`);
        if (hintBox) {
            hintBox.textContent = hint;
            hintBox.scrollIntoView({ block: 'nearest', behavior: reduceMotion ? 'auto' : 'smooth' });
        }
        updateProgress();
        playTone(720, 0.12, 'sine', 0.025);
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
        const items = state.puzzles.map(puzzle => `
            <li>
                <strong>${escapeHtml(puzzle.title)}.</strong>
                <span>${escapeHtml(puzzle.solution)}</span>
            </li>
        `).join('');
        dom.solutionPanel.innerHTML = `
            <h2>Пояснення розв’язання</h2>
            <ul class="solution-list">${items}</ul>
        `;
    }

    function loadPreferences() {
        const savedTheme = localStorage.getItem(STORAGE_KEYS.theme) || 'light';
        const savedSound = localStorage.getItem(STORAGE_KEYS.sound);
        state.soundEnabled = savedSound === null ? true : savedSound === 'true';
        dom.html.setAttribute('data-theme', savedTheme);
        updateSoundButton();
    }

    function toggleTheme() {
        const current = dom.html.getAttribute('data-theme') || 'light';
        const next = current === 'dark' ? 'light' : 'dark';
        dom.html.setAttribute('data-theme', next);
        localStorage.setItem(STORAGE_KEYS.theme, next);
        playTone(620, 0.08);
    }

    function toggleSound() {
        state.soundEnabled = !state.soundEnabled;
        localStorage.setItem(STORAGE_KEYS.sound, String(state.soundEnabled));
        updateSoundButton();
        if (state.soundEnabled) playTone(620, 0.08);
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

    function bindStaticControls() {
        dom.newSetBtn.addEventListener('click', generateSet);
        dom.level.addEventListener('change', generateSet);
        dom.taskCount.addEventListener('change', generateSet);
        dom.checkBtn.addEventListener('click', checkAnswers);
        dom.globalHintBtn.addEventListener('click', () => showHint());
        dom.solutionBtn.addEventListener('click', toggleSolutions);
        dom.themeToggle.addEventListener('click', toggleTheme);
        dom.soundToggle.addEventListener('click', toggleSound);
    }

    function init() {
        cacheDom();
        loadPreferences();
        bindStaticControls();
        generateSet();
    }

    return { init };
})();

document.addEventListener('DOMContentLoaded', MathPuzzles.init);
