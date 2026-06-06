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
            challengeMode: document.getElementById('challenge-mode'),
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
        return `<input class="game-input" id="${id}" data-answer-id="${id}" inputmode="numeric" autocomplete="off" maxlength="5" aria-label="${escapeHtml(label)}">`;
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

    const GRADE_PROFILES = {
        grade1: {
            grade: 1,
            maxBase: 10,
            pyramidMaxBase: 10,
            sequenceLength: 5,
            sequenceStepMin: 1,
            sequenceStepMax: 3,
            hiddenSequence: 1,
            pyramidRows: 3,
            hiddenPyramid: 1,
            balanceMax: 20,
            symbolMax: 6,
            symbolCount: 2,
            magicSize: 2,
            hiddenMagic: 2,
            machineMax: 20,
            machineSteps: 1,
            operations: ['add', 'subtract'],
            choiceSpread: 6
        },
        grade2: {
            grade: 2,
            maxBase: 18,
            pyramidMaxBase: 18,
            sequenceLength: 5,
            sequenceStepMin: 2,
            sequenceStepMax: 8,
            hiddenSequence: 2,
            pyramidRows: 3,
            hiddenPyramid: 2,
            balanceMax: 60,
            symbolMax: 12,
            symbolCount: 3,
            magicSize: 3,
            hiddenMagic: 3,
            machineMax: 100,
            machineSteps: 1,
            operations: ['add', 'subtract', 'multiply-small'],
            choiceSpread: 12
        },
        grade3: {
            grade: 3,
            maxBase: 28,
            pyramidMaxBase: 24,
            sequenceLength: 6,
            sequenceStepMin: 3,
            sequenceStepMax: 12,
            hiddenSequence: 2,
            pyramidRows: 3,
            hiddenPyramid: 3,
            balanceMax: 120,
            symbolMax: 18,
            symbolCount: 3,
            magicSize: 3,
            hiddenMagic: 4,
            machineMax: 250,
            machineSteps: 2,
            operations: ['add', 'subtract', 'multiply-small'],
            choiceSpread: 18
        },
        grade4: {
            grade: 4,
            maxBase: 38,
            pyramidMaxBase: 26,
            sequenceLength: 6,
            sequenceStepMin: 4,
            sequenceStepMax: 18,
            hiddenSequence: 3,
            pyramidRows: 4,
            hiddenPyramid: 4,
            balanceMax: 250,
            symbolMax: 24,
            symbolCount: 4,
            magicSize: 4,
            hiddenMagic: 6,
            machineMax: 900,
            machineSteps: 2,
            operations: ['add', 'subtract', 'multiply-small', 'divide'],
            choiceSpread: 24
        }
    };

    const CHALLENGE_PROFILES = {
        practice: {
            label: 'тренування',
            hiddenSequenceDelta: -1,
            hiddenPyramidDelta: -1,
            hiddenMagicDelta: -1,
            machineStepsDelta: -1,
            symbolCountDelta: 0,
            sequenceStepBonus: 0,
            choiceSpreadBonus: 0
        },
        challenge: {
            label: 'виклик',
            hiddenSequenceDelta: 0,
            hiddenPyramidDelta: 0,
            hiddenMagicDelta: 0,
            machineStepsDelta: 0,
            symbolCountDelta: 0,
            sequenceStepBonus: 0,
            choiceSpreadBonus: 0
        },
        olympiad: {
            label: 'олімпіадний',
            hiddenSequenceDelta: 1,
            hiddenPyramidDelta: 1,
            hiddenMagicDelta: 2,
            machineStepsDelta: 1,
            symbolCountDelta: 1,
            sequenceStepBonus: 4,
            choiceSpreadBonus: 8
        }
    };

    function clamp(value, min, max) {
        return Math.min(max, Math.max(min, value));
    }

    function levelConfig() {
        const gradeProfile = GRADE_PROFILES[dom.level.value] || GRADE_PROFILES.grade3;
        const modeKey = dom.challengeMode?.value || 'challenge';
        const modeProfile = CHALLENGE_PROFILES[modeKey] || CHALLENGE_PROFILES.challenge;
        const cfg = { ...gradeProfile, mode: modeKey, modeLabel: modeProfile.label };
        const pyramidCells = (cfg.pyramidRows * (cfg.pyramidRows + 1)) / 2;

        cfg.sequenceStepMax += modeProfile.sequenceStepBonus;
        cfg.choiceSpread += modeProfile.choiceSpreadBonus;
        cfg.hiddenSequence = clamp(cfg.hiddenSequence + modeProfile.hiddenSequenceDelta, 1, cfg.sequenceLength - 1);
        cfg.hiddenPyramid = clamp(cfg.hiddenPyramid + modeProfile.hiddenPyramidDelta, 1, pyramidCells - 1);
        cfg.machineSteps = clamp(cfg.machineSteps + modeProfile.machineStepsDelta, 1, 3);
        cfg.symbolCount = clamp(cfg.symbolCount + modeProfile.symbolCountDelta, 2, 4);

        if (cfg.mode === 'olympiad' && cfg.grade >= 3) {
            cfg.magicSize = 4;
        }
        if (cfg.mode === 'olympiad' && cfg.grade === 2) {
            cfg.magicSize = 3;
        }
        cfg.hiddenMagic = clamp(cfg.hiddenMagic + modeProfile.hiddenMagicDelta, 1, cfg.magicSize * cfg.magicSize - 1);

        return cfg;
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
        const step = randomInt(cfg.sequenceStepMin, cfg.sequenceStepMax);
        const isDescending = cfg.grade >= 3 && Math.random() > 0.65;
        const startMin = isDescending ? step * (cfg.sequenceLength - 1) + 2 : 2;
        const startMax = isDescending ? cfg.machineMax : Math.max(startMin, cfg.machineMax - step * (cfg.sequenceLength - 1));
        const start = randomInt(startMin, startMax);
        const sequence = Array.from({ length: cfg.sequenceLength }, (_, position) => start + (isDescending ? -1 : 1) * position * step);
        const hiddenPositions = shuffle(Array.from({ length: cfg.sequenceLength }, (_, position) => position)).slice(0, cfg.hiddenSequence);
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
                `У цьому ланцюжку щоразу ${isDescending ? 'віднімається' : 'додається'} ${step}.`,
                `Початок ланцюжка: ${sequence.slice(0, 3).join(', ')}...`
            ],
            solution: `Правило: щоразу ${isDescending ? 'віднімаємо' : 'додаємо'} ${step}. Повний ланцюжок: ${sequence.join(' → ')}.`
        };

        puzzle.markup = cardMarkup(puzzle, `<div class="sequence">${nodes}</div>`);
        return puzzle;
    }

    function createPyramid(index, cfg) {
        const bottom = Array.from({ length: cfg.pyramidRows }, () => randomInt(2, cfg.pyramidMaxBase || cfg.maxBase));
        const rows = [bottom];
        while (rows[rows.length - 1].length > 1) {
            const previous = rows[rows.length - 1];
            rows.push(previous.slice(0, -1).map((value, position) => value + previous[position + 1]));
        }

        const candidates = rows.flatMap((row, level) => row.map((value, col) => ({
            id: `pyramid-${index}-${level}-${col}`,
            value,
            level,
            col,
            label: `Ряд ${level + 1}, клітинка ${col + 1}`
        })));
        const hidden = shuffle(candidates).slice(0, cfg.hiddenPyramid);
        const hiddenIds = new Set(hidden.map(item => item.id));
        hidden.forEach(item => addAnswer(item.id, item.value));

        const cell = (item) => hiddenIds.has(item.id) ? inputBlock(item.id, item.label) : valueBlock(item.value);
        const pyramidRows = rows
            .map((row, level) => row.map((value, col) => ({ id: `pyramid-${index}-${level}-${col}`, value, level, col, label: `Ряд ${level + 1}, клітинка ${col + 1}` })))
            .reverse()
            .map(row => `<div class="pyramid-row">${row.map(cell).join('')}</div>`)
            .join('');

        const body = `
            <div class="pyramid" style="--pyramid-cols:${cfg.pyramidRows}" role="group" aria-label="Математична піраміда">
                ${pyramidRows}
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
                'Якщо пропуск зверху, додай дві цеглинки під ним. Якщо пропуск знизу, скористайся оберненою дією.',
                `Нижній ряд: ${bottom.join(', ')}.`
            ],
            solution: `Нижній ряд: ${bottom.join(', ')}. Повна піраміда знизу вгору: ${rows.map(row => row.join(', ')).join(' / ')}.`
        };

        puzzle.markup = cardMarkup(puzzle, body);
        return puzzle;
    }

    function createBalance(index, cfg) {
        const max = cfg.balanceMax;
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
            const candidate = unknown + randomInt(-cfg.choiceSpread, cfg.choiceSpread);
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
        const symbols = ['●', '▲', '■', '◆'].slice(0, cfg.symbolCount);
        const values = symbols.map(() => randomInt(2, cfg.symbolMax));

        // For 2 symbols: asking for the total sum is trivial (answer is directly shown
        // in equation row 1). Instead ask for the value of the second symbol.
        const useSingleTarget = cfg.symbolCount === 2;
        const answer = useSingleTarget ? values[1] : values.reduce((sum, value) => sum + value, 0);
        const answerId = `symbols-${index}`;
        addAnswer(answerId, answer);

        const equationRows = [
            `
                <div class="equation-row">
                    <div class="equation-expression">${symbolToken(symbols[0])} + ${symbolToken(symbols[0])}</div>
                    <strong>=</strong>
                    <strong>${values[0] * 2}</strong>
                </div>
            `,
            ...symbols.slice(1).map((symbol, position) => `
                <div class="equation-row">
                    <div class="equation-expression">${symbolToken(symbols[position])} + ${symbolToken(symbol)}</div>
                    <strong>=</strong>
                    <strong>${values[position] + values[position + 1]}</strong>
                </div>
            `)
        ].join('');

        const targetExpression = useSingleTarget
            ? symbolToken(symbols[1])
            : symbols.map(symbolToken).join(' + ');
        const targetLabel = useSingleTarget ? `Значення ${symbols[1]}` : 'Сума символів';

        const body = `
            <div class="symbol-board">
                <div class="equation-list">
                    ${equationRows}
                    <div class="equation-row target-row">
                        <div class="equation-expression">${targetExpression}</div>
                        <strong>=</strong>
                        <div class="input-holder">${inputMarkup(answerId, targetLabel)}</div>
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
                `Якщо ${symbols[0]} + ${symbols[0]} = ${values[0] * 2}, то ${symbols[0]} = ${values[0]}.`,
                useSingleTarget
                    ? `З другого рядка: ${symbols[0]} + ${symbols[1]} = ${values[0] + values[1]}. Відніми ${symbols[0]}.`
                    : 'Далі знаходь символи по черзі й лише після цього рахуй останній рядок.'
            ],
            solution: useSingleTarget
                ? `${symbols[0]} = ${values[0]}, тому ${symbols[1]} = ${values[0] + values[1]} − ${values[0]} = ${values[1]}.`
                : `${symbols.map((symbol, position) => `${symbol} = ${values[position]}`).join(', ')}. Отже, ${values.join(' + ')} = ${answer}.`
        };

        puzzle.markup = cardMarkup(puzzle, body);
        return puzzle;
    }

    function rotateSquare(square) {
        const size = square.length;
        return Array.from({ length: size }, (_, row) =>
            Array.from({ length: size }, (_, col) => square[size - 1 - col][row])
        );
    }

    function generateMagicSquare(size, shift) {
        if (size === 2) {
            const a = randomInt(2, 9);
            const b = randomInt(2, 9);
            return {
                square: [[a, b], [b, a]],
                targetSum: a + b,
                includesDiagonals: false
            };
        }

        if (size === 4) {
            const base = Array.from({ length: 4 }, (_, row) =>
                Array.from({ length: 4 }, (_, col) => {
                    const value = row * 4 + col + 1;
                    const keep = row % 4 === col % 4 || (row % 4) + (col % 4) === 3;
                    return (keep ? value : 17 - value) + shift;
                })
            );

            return {
                square: base,
                targetSum: 34 + shift * 4,
                includesDiagonals: true
            };
        }

        return {
            square: [[8, 1, 6], [3, 5, 7], [4, 9, 2]].map(row => row.map(value => value + shift)),
            targetSum: 15 + shift * 3,
            includesDiagonals: true
        };
    }

    function getMagicLines(size, includesDiagonals) {
        const rows = Array.from({ length: size }, (_, row) =>
            Array.from({ length: size }, (_, col) => `${row},${col}`)
        );
        const cols = Array.from({ length: size }, (_, col) =>
            Array.from({ length: size }, (_, row) => `${row},${col}`)
        );
        const lines = [...rows, ...cols];

        if (includesDiagonals) {
            lines.push(Array.from({ length: size }, (_, index) => `${index},${index}`));
            lines.push(Array.from({ length: size }, (_, index) => `${index},${size - 1 - index}`));
        }

        return lines;
    }

    function hasSolvingPath(size, hiddenKeys, includesDiagonals) {
        const unresolved = new Set(hiddenKeys);
        const lines = getMagicLines(size, includesDiagonals);

        while (unresolved.size > 0) {
            const nextLine = lines.find(line => line.filter(key => unresolved.has(key)).length === 1);
            if (!nextLine) return false;
            const nextKey = nextLine.find(key => unresolved.has(key));
            unresolved.delete(nextKey);
        }

        return true;
    }

    function chooseMagicHiddenPositions(size, count, includesDiagonals) {
        const allKeys = Array.from({ length: size }, (_, row) =>
            Array.from({ length: size }, (_, col) => `${row},${col}`)
        ).flat();

        for (let attempt = 0; attempt < 120; attempt++) {
            const hiddenKeys = [];
            for (const key of shuffle(allKeys)) {
                if (hiddenKeys.length >= count) break;
                const candidate = [...hiddenKeys, key];
                if (hasSolvingPath(size, candidate, includesDiagonals)) {
                    hiddenKeys.push(key);
                }
            }

            if (hiddenKeys.length === count) {
                return hiddenKeys.map(key => key.split(',').map(Number));
            }
        }

        return shuffle(allKeys).slice(0, count).map(key => key.split(',').map(Number));
    }

    function createMagicSquare(index, cfg) {
        const size = cfg.magicSize;
        const shift = randomInt(1, cfg.grade === 2 ? 4 : cfg.grade === 3 ? 8 : 12);
        const magic = generateMagicSquare(size, shift);
        let square = magic.square;
        const { targetSum, includesDiagonals } = magic;

        const rotations = randomInt(0, 3);
        for (let i = 0; i < rotations; i++) square = rotateSquare(square);
        if (Math.random() > 0.5) square = square.map(row => [...row].reverse());

        const positions = chooseMagicHiddenPositions(size, cfg.hiddenMagic, includesDiagonals);

        const hidden = new Map();
        positions.forEach(([row, col], localIndex) => {
            const id = `magic-${index}-${localIndex}`;
            addAnswer(id, square[row][col]);
            hidden.set(`${row},${col}`, id);
        });

        let cells = '';
        for (let row = 0; row < size; row++) {
            for (let col = 0; col < size; col++) {
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
            description: includesDiagonals
                ? `У кожному рядку, стовпчику й діагоналі сума має бути ${targetSum}.`
                : `У кожному рядку і стовпчику сума має бути ${targetSum}.`,
            answerIds: Array.from(hidden.values()),
            hints: [
                `Шукай рядок або стовпчик, де невідоме лише одне число. Сума має бути ${targetSum}.`,
                `Щоб знайти пропуск, від потрібної суми відніми відомі числа в цьому рядку або стовпчику.`,
                includesDiagonals ? 'Перевір відповідь у рядку, стовпчику й діагоналі, якщо клітинка на діагоналі.' : 'Перевір відповідь і в рядку, і в стовпчику.'
            ],
            solution: `Магічна сума — ${targetSum}. Повний квадрат: ${square.map(row => row.join(', ')).join(' / ')}.`
        };

        puzzle.markup = cardMarkup(puzzle, `<div class="magic-square" style="--magic-size:${size}" aria-label="Магічний квадрат">${cells}</div>`);
        return puzzle;
    }

    function createMachineStep(current, cfg) {
        const operation = shuffle(cfg.operations)[0];

        if (operation === 'subtract' && current > 2) {
            const operand = randomInt(1, Math.max(1, Math.min(current - 1, cfg.sequenceStepMax + 6)));
            return { label: `− ${operand}`, result: current - operand, text: `відняти ${operand}` };
        }

        if (operation === 'multiply-small') {
            const operand = randomInt(2, cfg.grade <= 2 ? 5 : 9);
            if (current * operand <= cfg.machineMax) {
                return { label: `× ${operand}`, result: current * operand, text: `помножити на ${operand}` };
            }
        }

        if (operation === 'divide') {
            const divisors = shuffle([2, 3, 4, 5, 6, 7, 8, 9]).filter(divisor => current % divisor === 0 && current / divisor > 1);
            if (divisors.length) {
                const operand = divisors[0];
                return { label: `÷ ${operand}`, result: current / operand, text: `поділити на ${operand}` };
            }
        }

        if (current >= cfg.machineMax) {
            const operand = randomInt(1, Math.max(1, Math.min(current - 1, cfg.sequenceStepMax + 8)));
            return { label: `− ${operand}`, result: current - operand, text: `відняти ${operand}` };
        }

        const maxOperand = Math.max(1, Math.min(cfg.sequenceStepMax + 8, cfg.machineMax - current));
        const operand = randomInt(1, maxOperand);
        return { label: `+ ${operand}`, result: current + operand, text: `додати ${operand}` };
    }

    function createMachine(index, cfg) {
        const start = randomInt(2, Math.max(3, Math.floor(cfg.machineMax / (cfg.grade >= 3 ? 5 : 3))));
        const steps = [];
        let result = start;

        for (let i = 0; i < cfg.machineSteps; i++) {
            const step = createMachineStep(result, cfg);
            steps.push(step);
            result = step.result;
        }

        const answerId = `machine-${index}`;
        addAnswer(answerId, result);

        const operationText = cfg.machineSteps > 1 ? 'кілька дій' : steps[0].text;
        const operationNodes = steps.map(step => `
            <span class="seq-arrow">→</span>
            <div class="operation-box">${step.label}</div>
        `).join('');

        const body = `
            <div class="machine" aria-label="Математична машина">
                <div class="machine-box">${start}</div>
                ${operationNodes}
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
                `Машина починає з числа ${start}. Виконуй дії зліва направо.`,
                `Кроки: ${steps.map(step => step.text).join(', ')}.`,
                `Після всіх дій результат дорівнює ${result}.`
            ],
            solution: `Починаємо з ${start}: ${steps.map(step => step.label).join(' → ')}. Результат: ${result}.`
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
        // Тему повністю контролює спільний хедер через body.dark-mode (динамічно).
        // data-theme тримаємо світлим, інакше гра «застрягне» темною при вимкненні теми.
        const savedSound = localStorage.getItem(STORAGE_KEYS.sound);
        state.soundEnabled = savedSound === null ? true : savedSound === 'true';
        dom.html.setAttribute('data-theme', 'light');
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
        dom.challengeMode.addEventListener('change', generateSet);
        dom.taskCount.addEventListener('change', generateSet);
        dom.checkBtn.addEventListener('click', checkAnswers);
        dom.globalHintBtn.addEventListener('click', () => showHint());
        dom.solutionBtn.addEventListener('click', toggleSolutions);
        dom.themeToggle?.addEventListener('click', toggleTheme);
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
