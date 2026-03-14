const NOTE_NAMES_SHARP = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const NOTE_NAMES_FLAT = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];
const BLACK_PCS = new Set([1, 3, 6, 8, 10]);
const NATURAL_INDEX = { C: 0, D: 1, E: 2, F: 3, G: 4, A: 5, B: 6 };
const STAFF_BASE_Y = 150; // E4
const STAFF_BASE_STEP = 30; // E4 step index

const keyboardEl = document.getElementById('keyboard');
const noteGroupEl = document.getElementById('note-group');
const sequenceArrowEl = document.getElementById('sequence-arrow');
const coachMessageEl = document.getElementById('coach-message');
const labelTipEl = document.getElementById('label-tip');
const perNoteStatsEl = document.getElementById('per-note-stats');
const weakNotesEl = document.getElementById('weak-notes');
const chartEl = document.getElementById('last20-chart');

const progressMainEl = document.getElementById('progress-main');
const progressSubEl = document.getElementById('progress-sub');
const levelMainEl = document.getElementById('level-main');
const levelSubEl = document.getElementById('level-sub');
const reactionMainEl = document.getElementById('reaction-main');

const modeFreeBtn = document.getElementById('mode-free');
const modeTrainBtn = document.getElementById('mode-train');
const modeDictationBtn = document.getElementById('mode-dictation');

const learningPanelEl = document.getElementById('learning-panel');
const dictationPanelEl = document.getElementById('dictation-panel');

const moduleSelectEl = document.getElementById('module-select');
const labelModeEl = document.getElementById('label-mode');
const accidentalModeEl = document.getElementById('accidental-mode');
const sessionBtnEl = document.getElementById('session-btn');
const skipBtnEl = document.getElementById('skip-btn');

const dictationStartBtnEl = document.getElementById('dictation-start');
const dictationReplayBtnEl = document.getElementById('dictation-replay');
const dictationMessageEl = document.getElementById('dictation-message');

const keyElsByMidi = new Map();
const keysData = [];

let audioCtx = null;
let toneSampler = null;
let toneReady = false;
let toneTried = false;

const state = {
    mode: 'free',
    module: 1,
    sessionActive: false,
    task: null,
    progressIndex: 0,
    awaitingCorrection: false,
    correctionTargetMidi: null,
    correctionTaskSnapshot: null,
    isRepeatTask: false,
    taskStartMs: 0,
    totalCounted: 0,
    correctCounted: 0,
    recentWindow10: [],
    recent20: [],
    reactionTimesMs: [],
    noteStats: {},
    module1Counts: {},
    module1Completed: false,
    module2Stage: 0, // 0 lines, 1 spaces, 2 accidentals
    module2Window10: [],
    sequenceLevel: 2,
    dictationActive: false,
    dictationTargetMidi: null,
    dictationStage: 0,
    dictationWindow10: [],
    pressedKeyboardKeys: new Set()
};

const MODULE1_POOL = [60, 62, 64, 65, 67, 69, 71]; // C4..B4 naturals
const MODULE2_LINES = [64, 67, 71, 74, 77]; // E4 G4 B4 D5 F5
const MODULE2_SPACES = [65, 69, 72]; // F4 A4 C5
const BLACK_4_5 = [61, 63, 66, 68, 70, 73, 75, 78];
const MODULE3_BASE_NATURAL = [64, 65, 67, 69, 71, 72, 74, 76, 77];
const MODULE4_LOW_OCTAVE = [48, 50, 52, 53, 55, 57, 59];

const KEYBOARD_MAP = {
    a: 60, w: 61, s: 62, e: 63, d: 64, f: 65, t: 66, g: 67, y: 68, h: 69, u: 70, j: 71,
    z: 48, x: 50, c: 52, v: 53, b: 55, n: 57, m: 59
};

function midiToPitch(midi) {
    const pc = ((midi % 12) + 12) % 12;
    const octave = Math.floor(midi / 12) - 1;
    return { pc, octave };
}

function midiToNameSharp(midi) {
    const { pc, octave } = midiToPitch(midi);
    return `${NOTE_NAMES_SHARP[pc]}${octave}`;
}

function midiToNameFlat(midi) {
    const { pc, octave } = midiToPitch(midi);
    return `${NOTE_NAMES_FLAT[pc]}${octave}`;
}

function midiToDisplayName(midi, accidentalMode, allowBothRandom = false) {
    const { pc, octave } = midiToPitch(midi);
    const sharpName = NOTE_NAMES_SHARP[pc];
    const flatName = NOTE_NAMES_FLAT[pc];
    const black = BLACK_PCS.has(pc);
    if (!black) {
        return `${sharpName}${octave}`;
    }
    if (accidentalMode === 'sharp') {
        return `${sharpName}${octave}`;
    }
    if (accidentalMode === 'flat') {
        return `${flatName}${octave}`;
    }
    if (allowBothRandom) {
        const label = Math.random() < 0.5 ? sharpName : flatName;
        return `${label}${octave}`;
    }
    return `${sharpName}${octave}/${flatName}${octave}`;
}

function getNoteLetterAndAccidental(displayName) {
    const token = displayName.split('/')[0];
    const m = token.match(/^([A-G])([#b]?)(\d)$/);
    if (!m) {
        return { letter: 'C', accidental: '', octave: 4 };
    }
    return { letter: m[1], accidental: m[2], octave: Number(m[3]) };
}

function getDiatonicStep(letter, octave) {
    return octave * 7 + NATURAL_INDEX[letter];
}

function stepToY(step) {
    return STAFF_BASE_Y - (step - STAFF_BASE_STEP) * 10;
}

function getLedgerSteps(step) {
    const ledgers = [];
    if (step < 30) {
        for (let s = 28; s >= step; s -= 2) {
            ledgers.push(s);
        }
    }
    if (step > 38) {
        for (let s = 40; s <= step; s += 2) {
            ledgers.push(s);
        }
    }
    return ledgers;
}

function buildKeyboard() {
    keyboardEl.innerHTML = '';
    keyElsByMidi.clear();
    keysData.length = 0;

    let whiteCount = 0;
    for (let midi = 48; midi <= 83; midi++) {
        const { pc } = midiToPitch(midi);
        const isBlack = BLACK_PCS.has(pc);
        const keyEl = document.createElement('div');
        keyEl.className = `key ${isBlack ? 'black' : 'white'}`;
        keyEl.dataset.midi = String(midi);
        keyEl.innerHTML = '<span class="key-label"></span>';

        if (isBlack) {
            keyEl.style.left = `calc(${whiteCount} * var(--white-key-width) - var(--black-key-width) / 2)`;
        } else {
            whiteCount += 1;
        }

        keyEl.addEventListener('mousedown', (e) => {
            e.preventDefault();
            handleKeyPress(midi, keyEl);
        });
        keyEl.addEventListener('touchstart', (e) => {
            e.preventDefault();
            handleKeyPress(midi, keyEl);
        }, { passive: false });

        keyboardEl.appendChild(keyEl);
        keyElsByMidi.set(midi, keyEl);
        keysData.push({ midi, isBlack });
    }
}

function updateKeyLabels() {
    const mode = labelModeEl.value;
    keysData.forEach(({ midi, isBlack }) => {
        const keyEl = keyElsByMidi.get(midi);
        if (!keyEl) return;
        const labelEl = keyEl.querySelector('.key-label');
        if (!labelEl) return;
        if (mode === 'none') {
            labelEl.textContent = '';
            return;
        }
        if (mode === 'c-only') {
            const name = midiToNameSharp(midi);
            labelEl.textContent = name.startsWith('C') && !name.includes('#') ? name : '';
            return;
        }
        if (!isBlack) {
            labelEl.textContent = midiToNameSharp(midi);
            return;
        }
        const { pc } = midiToPitch(midi);
        const sharp = NOTE_NAMES_SHARP[pc];
        const flat = NOTE_NAMES_FLAT[pc];
        if (accidentalModeEl.value === 'both') {
            labelEl.innerHTML = `${sharp}<br>${flat}`;
            return;
        }
        labelEl.textContent = accidentalModeEl.value === 'flat' ? flat : sharp;
    });
}

async function initAudio() {
    if (toneTried) return;
    toneTried = true;
    try {
        if (window.Tone) {
            await Tone.start();
            toneSampler = new Tone.Sampler({
                urls: {
                    A0: 'A0.mp3', C1: 'C1.mp3', 'D#1': 'Ds1.mp3', 'F#1': 'Fs1.mp3', A1: 'A1.mp3',
                    C2: 'C2.mp3', 'D#2': 'Ds2.mp3', 'F#2': 'Fs2.mp3', A2: 'A2.mp3',
                    C3: 'C3.mp3', 'D#3': 'Ds3.mp3', 'F#3': 'Fs3.mp3', A3: 'A3.mp3',
                    C4: 'C4.mp3', 'D#4': 'Ds4.mp3', 'F#4': 'Fs4.mp3', A4: 'A4.mp3',
                    C5: 'C5.mp3', 'D#5': 'Ds5.mp3', 'F#5': 'Fs5.mp3', A5: 'A5.mp3',
                    C6: 'C6.mp3'
                },
                release: 1.2,
                baseUrl: 'https://gleitz.github.io/midi-js-soundfonts/MusyngKite/acoustic_grand_piano-mp3/'
            }).toDestination();
            await Tone.loaded();
            toneReady = true;
            return;
        }
    } catch (err) {
        toneReady = false;
    }
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
}

function midiToFreq(midi) {
    return 440 * Math.pow(2, (midi - 69) / 12);
}

function playFallbackPiano(midi, duration = 0.7, velocity = 0.75) {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    const now = audioCtx.currentTime;
    const attack = 0.01;
    const decay = 0.5;
    const sustain = 0.3;
    const release = 1.2;
    const freq = midiToFreq(midi);
    const gains = [0.9, 0.5, 0.25];
    const harmonics = [1, 2, 3];

    const master = audioCtx.createGain();
    master.gain.setValueAtTime(0.0001, now);
    master.gain.linearRampToValueAtTime(velocity, now + attack);
    master.gain.linearRampToValueAtTime(velocity * sustain, now + decay);
    master.gain.setValueAtTime(velocity * sustain, now + duration);
    master.gain.exponentialRampToValueAtTime(0.0001, now + duration + release);
    master.connect(audioCtx.destination);

    harmonics.forEach((h, idx) => {
        const osc = audioCtx.createOscillator();
        const g = audioCtx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq * h, now);
        g.gain.setValueAtTime(gains[idx], now);
        osc.connect(g).connect(master);
        osc.start(now);
        osc.stop(now + duration + release + 0.02);
    });
}

function playMidi(midi, duration = 0.7, velocity = 0.75) {
    if (toneReady && toneSampler) {
        toneSampler.triggerAttackRelease(Tone.Frequency(midi, 'midi'), duration, undefined, velocity);
    } else {
        playFallbackPiano(midi, duration, velocity);
    }
}

function playSuccessCue() {
    playMidi(76, 0.16, 0.5);
    setTimeout(() => playMidi(79, 0.2, 0.5), 120);
}

function playErrorCue() {
    playMidi(52, 0.16, 0.5);
    setTimeout(() => playMidi(50, 0.2, 0.45), 100);
}

function playTaskSequence(notes) {
    notes.forEach((n, i) => {
        setTimeout(() => playMidi(n.midi, 0.45, 0.48), i * 260);
    });
}

function setActiveTab(mode) {
    [modeFreeBtn, modeTrainBtn, modeDictationBtn].forEach(btn => btn.classList.remove('active'));
    if (mode === 'free') modeFreeBtn.classList.add('active');
    if (mode === 'train') modeTrainBtn.classList.add('active');
    if (mode === 'dictation') modeDictationBtn.classList.add('active');
}

function setMode(mode) {
    state.mode = mode;
    setActiveTab(mode);
    learningPanelEl.classList.toggle('hidden', mode !== 'train');
    dictationPanelEl.classList.toggle('hidden', mode !== 'dictation');
    state.sessionActive = false;
    state.dictationActive = false;
    clearTaskVisuals();
    if (mode === 'free') {
        coachMessageEl.textContent = 'Р’С–Р»СЊРЅР° РіСЂР°: РЅР°С‚РёСЃРєР°Р№ РєР»Р°РІС–С€С– Р°Р±Рѕ РєР»Р°РІС–Р°С‚СѓСЂСѓ РєРѕРјРїКјСЋС‚РµСЂР°.';
    }
}

function resetSessionStats() {
    state.totalCounted = 0;
    state.correctCounted = 0;
    state.recentWindow10 = [];
    state.recent20 = [];
    state.reactionTimesMs = [];
    state.noteStats = {};
    state.module1Counts = Object.fromEntries(MODULE1_POOL.map(m => [m, 0]));
    state.module2Window10 = [];
    state.dictationWindow10 = [];
}

function clearKeyStateClasses() {
    keyElsByMidi.forEach(el => {
        el.classList.remove('correct', 'wrong', 'hint', 'target', 'active');
    });
}

function clearTaskVisuals() {
    noteGroupEl.innerHTML = '';
    sequenceArrowEl.classList.add('hidden');
    clearKeyStateClasses();
}

function chooseFrom(pool) {
    return pool[Math.floor(Math.random() * pool.length)];
}

function pickUnique(pool, count) {
    const p = [...pool];
    const out = [];
    while (out.length < count && p.length > 0) {
        const idx = Math.floor(Math.random() * p.length);
        out.push(p.splice(idx, 1)[0]);
    }
    return out;
}

function currentModulePool() {
    const accidentalMode = accidentalModeEl.value;
    if (state.module === 1) {
        return MODULE1_POOL;
    }
    if (state.module === 2) {
        if (state.module2Stage === 0) return MODULE2_LINES;
        if (state.module2Stage === 1) return [...MODULE2_LINES, ...MODULE2_SPACES];
        const blacks = BLACK_4_5;
        if (accidentalMode === 'sharp' || accidentalMode === 'flat' || accidentalMode === 'both') {
            return [...MODULE2_LINES, ...MODULE2_SPACES, ...blacks];
        }
        return [...MODULE2_LINES, ...MODULE2_SPACES];
    }
    if (state.module === 3) {
        const base = [...MODULE3_BASE_NATURAL];
        if (['sharp', 'flat', 'both'].includes(accidentalMode)) {
            base.push(...BLACK_4_5);
        }
        return base;
    }
    const module4 = [...MODULE3_BASE_NATURAL, ...MODULE4_LOW_OCTAVE];
    if (accidentalMode === 'sharp' || accidentalMode === 'flat' || accidentalMode === 'both') {
        module4.push(...BLACK_4_5, 49, 51, 54, 56, 58);
    }
    return module4;
}

function buildTaskNotes(midis, allowRandomAccidental) {
    return midis.map(midi => ({
        midi,
        display: midiToDisplayName(midi, accidentalModeEl.value, allowRandomAccidental)
    }));
}

function createTask() {
    const pool = currentModulePool();
    if (state.module === 1) {
        const midi = chooseFrom(pool);
        return { notes: buildTaskNotes([midi], false), kind: 'keyboard-orientation' };
    }
    if (state.module === 2) {
        const midi = chooseFrom(pool);
        return { notes: buildTaskNotes([midi], true), kind: 'single-staff' };
    }
    if (state.module === 3) {
        const notes = pickUnique(pool, state.sequenceLevel);
        return { notes: buildTaskNotes(notes, true), kind: 'sequence' };
    }
    const len = state.sequenceLevel;
    const notes = pickUnique(pool, len);
    return { notes: buildTaskNotes(notes, true), kind: 'extended-range' };
}

function addSvg(tag, attrs) {
    const el = document.createElementNS('http://www.w3.org/2000/svg', tag);
    Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, String(v)));
    noteGroupEl.appendChild(el);
    return el;
}

function renderStaffTask() {
    noteGroupEl.innerHTML = '';
    if (!state.task || state.task.kind === 'keyboard-orientation') {
        sequenceArrowEl.classList.add('hidden');
        return;
    }
    const notes = state.task.notes;
    const spacing = 42;
    const startX = 250 - ((notes.length - 1) * spacing) / 2;
    sequenceArrowEl.classList.toggle('hidden', notes.length <= 1);

    notes.forEach((note, idx) => {
        const parsed = getNoteLetterAndAccidental(note.display);
        const step = getDiatonicStep(parsed.letter, parsed.octave);
        const y = stepToY(step);
        const x = startX + idx * spacing;

        getLedgerSteps(step).forEach(ls => {
            addSvg('line', {
                x1: x - 18,
                x2: x + 18,
                y1: stepToY(ls),
                y2: stepToY(ls),
                stroke: '#0f172a',
                'stroke-width': 2
            });
        });

        const fill = idx < state.progressIndex ? '#16a34a' : (idx === state.progressIndex ? '#0f172a' : '#9ca3af');
        const head = addSvg('ellipse', { cx: x, cy: y, rx: 11, ry: 8, fill });
        const stem = addSvg('line', {
            x1: x + 10,
            x2: x + 10,
            y1: y,
            y2: y - 34,
            stroke: fill,
            'stroke-width': 2
        });
        if (idx === state.progressIndex) {
            head.setAttribute('class', 'note-current');
            stem.setAttribute('class', 'note-current');
        }

        if (parsed.accidental) {
            addSvg('text', {
                x: x - 28,
                y: y + 6,
                fill: '#0f172a',
                'font-size': 24,
                'font-weight': 700
            }).textContent = parsed.accidental === '#' ? 'в™Ї' : 'в™­';
        }
    });
}

function updateCoachMessage(text) {
    coachMessageEl.textContent = text;
}

function setHintKey(midi) {
    const keyEl = keyElsByMidi.get(midi);
    if (keyEl) keyEl.classList.add('hint');
}

function clearHintKey() {
    keyElsByMidi.forEach(el => el.classList.remove('hint'));
}

function markKeyClass(midi, cls, timeout = 320) {
    const el = keyElsByMidi.get(midi);
    if (!el) return;
    el.classList.add(cls);
    setTimeout(() => el.classList.remove(cls), timeout);
}

function activateCurrentTaskVisuals() {
    clearHintKey();
    keyElsByMidi.forEach(el => el.classList.remove('target'));
    if (!state.task) return;
    if (state.task.kind === 'keyboard-orientation') {
        const target = state.task.notes[0].midi;
        const keyEl = keyElsByMidi.get(target);
        if (keyEl) keyEl.classList.add('target');
    }
}

function recordNoteStat(midi, isCorrect, reactionMs) {
    const stat = state.noteStats[midi] || { attempts: 0, correct: 0, reactionTotal: 0 };
    stat.attempts += 1;
    if (isCorrect) stat.correct += 1;
    stat.reactionTotal += reactionMs;
    state.noteStats[midi] = stat;
}

function finalizeCountedTask(isCorrect, failedExpectedMidi = null) {
    state.totalCounted += 1;
    if (isCorrect) state.correctCounted += 1;
    state.recentWindow10.push(isCorrect);
    if (state.recentWindow10.length > 10) state.recentWindow10.shift();
    state.recent20.push(isCorrect);
    if (state.recent20.length > 20) state.recent20.shift();

    const reaction = performance.now() - state.taskStartMs;
    state.reactionTimesMs.push(reaction);

    if (isCorrect && state.task) {
        state.task.notes.forEach(n => recordNoteStat(n.midi, true, reaction));
    }
    if (!isCorrect && Number.isFinite(failedExpectedMidi)) {
        recordNoteStat(failedExpectedMidi, false, reaction);
    }
}

function evaluateModuleProgress(isCorrect, expectedMidi = null) {
    if (state.module === 1) {
        if (isCorrect && state.task) {
            const midi = state.task.notes[0].midi;
            state.module1Counts[midi] = (state.module1Counts[midi] || 0) + 1;
            const completed = MODULE1_POOL.every(n => (state.module1Counts[n] || 0) >= 3);
            if (completed && !state.module1Completed) {
                state.module1Completed = true;
                labelTipEl.classList.remove('hidden');
                updateCoachMessage('Модуль 1 пройдено. Рекомендовано: "Тільки C" або "Без підписів".');
            }
        }
        if (!isCorrect && Number.isFinite(expectedMidi)) {
            state.module1Counts[expectedMidi] = 0;
            updateCoachMessage(`Помилка. Для ноти ${midiToDisplayName(expectedMidi, accidentalModeEl.value, false)} лічильник скинуто, інші ноти збережено.`);
        }
    }

    if (state.module === 2) {
        state.module2Window10.push(isCorrect);
        if (state.module2Window10.length > 10) state.module2Window10.shift();
        if (state.module2Window10.length === 10) {
            const acc = state.module2Window10.filter(Boolean).length / 10;
            if (acc >= 0.8 && state.module2Stage < 2) {
                state.module2Stage += 1;
                state.module2Window10 = [];
                updateCoachMessage(`Перехід до підмодуля ${state.module2Stage + 1} Модуля 2.`);
            } else if (acc < 0.5 && state.module2Stage > 0) {
                state.module2Stage -= 1;
                state.module2Window10 = [];
                updateCoachMessage('Повертаємось на попередній підмодуль Модуля 2.');
            }
        }
    }

    if (state.module === 3 || state.module === 4) {
        if (state.recentWindow10.length === 10) {
            const acc = state.recentWindow10.filter(Boolean).length / 10;
            if (acc >= 0.8 && state.sequenceLevel < 4) {
                state.sequenceLevel += 1;
                state.recentWindow10 = [];
                updateCoachMessage(`Рівень підвищено: тепер ${state.sequenceLevel} ноти у завданні.`);
            } else if (acc < 0.5 && state.sequenceLevel > 2) {
                state.sequenceLevel -= 1;
                state.recentWindow10 = [];
                updateCoachMessage('Повторімо попередній матеріал.');
            }
        }
    }
}

function evaluateDictationProgress(isCorrect) {
    state.dictationWindow10.push(isCorrect);
    if (state.dictationWindow10.length > 10) state.dictationWindow10.shift();
    if (state.dictationWindow10.length === 10) {
        const acc = state.dictationWindow10.filter(Boolean).length / 10;
        if (acc >= 0.8 && state.dictationStage < 2) {
            state.dictationStage += 1;
            state.dictationWindow10 = [];
            dictationMessageEl.textContent = `Перехід до підмодуля диктанту ${state.dictationStage + 1}.`;
        } else if (acc < 0.5 && state.dictationStage > 0) {
            state.dictationStage -= 1;
            state.dictationWindow10 = [];
            dictationMessageEl.textContent = 'Повторімо попередній матеріал диктанту.';
        }
    }
}

function getModule2StageLabel() {
    if (state.module2Stage === 0) return 'Підмодуль: лінії';
    if (state.module2Stage === 1) return 'Підмодуль: пробіли';
    return 'Підмодуль: хроматика';
}

function getDictationStageLabel() {
    if (state.dictationStage === 0) return 'Диктант: лінії';
    if (state.dictationStage === 1) return 'Диктант: пробіли';
    return 'Диктант: дієзи/бемолі';
}

function updateProgressUI() {
    const accuracy = state.totalCounted ? Math.round((state.correctCounted / state.totalCounted) * 100) : 0;
    progressMainEl.textContent = `${state.correctCounted} / ${state.totalCounted}`;
    progressSubEl.textContent = `Точність: ${accuracy}%`;

    if (state.mode === 'dictation') {
        levelMainEl.textContent = '1 нота';
        levelSubEl.textContent = getDictationStageLabel();
    } else if (state.module === 3 || state.module === 4) {
        levelMainEl.textContent = `${state.sequenceLevel} ${state.sequenceLevel === 1 ? 'нота' : 'ноти'}`;
        levelSubEl.textContent = 'Оцінка за останні 10 завдань';
    } else if (state.module === 2) {
        levelMainEl.textContent = '1 нота';
        levelSubEl.textContent = getModule2StageLabel();
    } else {
        levelMainEl.textContent = '1 нота';
        levelSubEl.textContent = 'Орієнтація на клавіатурі';
    }

    const avgReaction = state.reactionTimesMs.length
        ? state.reactionTimesMs.reduce((a, b) => a + b, 0) / state.reactionTimesMs.length / 1000
        : 0;
    reactionMainEl.textContent = `${avgReaction.toFixed(1)} с`;
}

function renderChart() {
    chartEl.innerHTML = '';
    const data = state.recent20.slice(-20);
    while (data.length < 20) data.unshift(null);
    data.forEach(item => {
        const bar = document.createElement('div');
        bar.className = 'chart-bar';
        if (item === null) {
            bar.style.height = '8px';
            bar.style.background = '#cbd5e1';
        } else if (item) {
            bar.style.height = '48px';
            bar.style.background = '#22c55e';
        } else {
            bar.style.height = '22px';
            bar.style.background = '#ef4444';
        }
        chartEl.appendChild(bar);
    });
}

function renderPerNoteStats() {
    const entries = Object.entries(state.noteStats)
        .map(([midi, stat]) => {
            const acc = stat.attempts ? Math.round((stat.correct / stat.attempts) * 100) : 0;
            return { midi: Number(midi), ...stat, acc };
        })
        .sort((a, b) => a.midi - b.midi);

    perNoteStatsEl.innerHTML = '';
    if (!entries.length) {
        perNoteStatsEl.textContent = 'Р©Рµ РЅРµРјР°С” РґР°РЅРёС… РїРѕ РЅРѕС‚Р°С….';
        weakNotesEl.textContent = 'РџСЂРѕР±Р»РµРјРЅС– РЅРѕС‚Рё: -';
        return;
    }

    entries.forEach(e => {
        const div = document.createElement('div');
        div.className = `note-stat ${e.acc < 60 ? 'bad' : ''}`;
        div.textContent = `${midiToDisplayName(e.midi, 'both', false)}: ${e.acc}% (${e.correct}/${e.attempts})`;
        perNoteStatsEl.appendChild(div);
    });

    const weak = entries
        .filter(e => e.attempts >= 2)
        .sort((a, b) => a.acc - b.acc)
        .slice(0, 3)
        .map(e => midiToDisplayName(e.midi, accidentalModeEl.value, false));
    weakNotesEl.textContent = weak.length ? `Р—РІРµСЂРЅРё СѓРІР°РіСѓ РЅР°: ${weak.join(', ')}` : 'РџСЂРѕР±Р»РµРјРЅС– РЅРѕС‚Рё: -';
}

function syncStatsUI() {
    updateProgressUI();
    renderChart();
    renderPerNoteStats();
}

function beginTask() {
    state.task = createTask();
    state.progressIndex = 0;
    state.awaitingCorrection = false;
    state.correctionTargetMidi = null;
    state.correctionTaskSnapshot = null;
    state.isRepeatTask = false;
    state.taskStartMs = performance.now();
    clearKeyStateClasses();
    activateCurrentTaskVisuals();
    renderStaffTask();
    if (state.task.kind === 'sequence' || state.task.kind === 'extended-range') {
        playTaskSequence(state.task.notes);
        updateCoachMessage('Р“СЂР°Р№ РЅРѕС‚Рё Р·Р»С–РІР° РЅР°РїСЂР°РІРѕ.');
    } else if (state.task.kind === 'single-staff') {
        updateCoachMessage('РќР°С‚РёСЃРЅРё РЅРѕС‚Сѓ, СЏРєР° РїРѕРєР°Р·Р°РЅР° РЅР° РЅРѕС‚РЅРѕРјСѓ СЃС‚Р°РЅС–.');
    } else {
        updateCoachMessage('Знайди підсвічену клавішу та натисни її.');
    }
}

function beginRepeatTask() {
    if (!state.correctionTaskSnapshot) return;
    state.task = {
        notes: state.correctionTaskSnapshot.notes.map(n => ({ ...n })),
        kind: state.correctionTaskSnapshot.kind
    };
    state.progressIndex = 0;
    state.awaitingCorrection = false;
    state.correctionTargetMidi = null;
    state.isRepeatTask = true;
    clearHintKey();
    clearKeyStateClasses();
    activateCurrentTaskVisuals();
    renderStaffTask();
    updateCoachMessage('РџРѕРІС‚РѕСЂРё С†Рµ Р¶ Р·Р°РІРґР°РЅРЅСЏ С‰Рµ СЂР°Р· (Р±РµР· РѕС†С–РЅРєРё).');
    if (state.task.notes.length > 1) {
        playTaskSequence(state.task.notes);
    }
}

function onTaskSuccess() {
    markKeyClass(state.task.notes[state.progressIndex - 1].midi, 'correct', 220);
    if (state.progressIndex >= state.task.notes.length) {
        if (state.module === 1 && state.task && state.task.notes.length === 1) {
            updateCoachMessage(`Так, це ${state.task.notes[0].display}.`);
        }
        playSuccessCue();
        if (!state.isRepeatTask) {
            finalizeCountedTask(true);
            evaluateModuleProgress(true, null);
            syncStatsUI();
        }
        setTimeout(beginTask, 260);
    } else {
        renderStaffTask();
    }
}

function onTaskWrong(expectedNote) {
    playErrorCue();
    state.awaitingCorrection = true;
    state.correctionTargetMidi = expectedNote.midi;
    state.correctionTaskSnapshot = state.task ? { kind: state.task.kind, notes: state.task.notes.map(n => ({ ...n })) } : null;
    clearHintKey();
    setHintKey(expectedNote.midi);
    updateCoachMessage(`Р¦Рµ Р±СѓР»Р° РЅРѕС‚Р° ${expectedNote.display}. Р—РЅР°Р№РґРё С—С— С‚Р° РЅР°С‚РёСЃРЅРё.`);
    if (!state.isRepeatTask) {
        finalizeCountedTask(false, expectedNote.midi);
        evaluateModuleProgress(false, expectedNote.midi);
        syncStatsUI();
    }
}

function handleTrainingPress(midi) {
    if (!state.sessionActive || !state.task) return;

    if (state.awaitingCorrection) {
        if (midi === state.correctionTargetMidi) {
            clearHintKey();
            markKeyClass(midi, 'correct', 320);
            updateCoachMessage('Р”РѕР±СЂРµ. РўРµРїРµСЂ РїРѕРІС‚РѕСЂРёРјРѕ Р·Р°РІРґР°РЅРЅСЏ С‰Рµ СЂР°Р·.');
            setTimeout(beginRepeatTask, 220);
        } else {
            markKeyClass(midi, 'wrong', 320);
        }
        return;
    }

    const expected = state.task.notes[state.progressIndex];
    if (!expected) return;

    if (midi === expected.midi) {
        state.progressIndex += 1;
        onTaskSuccess();
    } else {
        markKeyClass(midi, 'wrong', 320);
        onTaskWrong(expected);
    }
}

function startTrainingSession() {
    state.sessionActive = true;
    resetSessionStats();
    state.module1Completed = false;
    labelTipEl.classList.add('hidden');
    if (state.module === 2) {
        state.module2Stage = 0;
        state.module2Window10 = [];
    }
    if (state.module === 3 || state.module === 4) {
        state.sequenceLevel = 2;
    }
    sessionBtnEl.textContent = 'РџРµСЂРµР·Р°РїСѓСЃС‚РёС‚Рё СЃРµСЃС–СЋ';
    beginTask();
    syncStatsUI();
}

function skipTask() {
    if (!state.sessionActive || !state.task) return;
    const expected = state.task.notes[state.progressIndex];
    if (!state.isRepeatTask) {
        finalizeCountedTask(false, expected ? expected.midi : null);
        evaluateModuleProgress(false, expected ? expected.midi : null);
        syncStatsUI();
    }
    const skippedLabel = expected ? midiToDisplayName(expected.midi, accidentalModeEl.value, false) : '-';
    updateCoachMessage(`Завдання пропущено. Пропущено: ${skippedLabel}.`);
    beginTask();
}

function getDictationPool() {
    if (state.dictationStage === 0) {
        return MODULE2_LINES;
    }
    if (state.dictationStage === 1) {
        return [...MODULE2_LINES, ...MODULE2_SPACES];
    }
    return [...MODULE2_LINES, ...MODULE2_SPACES, ...BLACK_4_5];
}

function createDictationTask() {
    const pool = getDictationPool();
    const midi = chooseFrom(pool);
    state.dictationTargetMidi = midi;
    state.taskStartMs = performance.now();
    dictationMessageEl.textContent = 'РЎР»СѓС…Р°Р№ РЅРѕС‚Сѓ С– Р·РЅР°Р№РґРё С—С— РЅР° РєР»Р°РІС–Р°С‚СѓСЂС–.';
    playMidi(midi, 0.8, 0.8);
    syncStatsUI();
}

function startDictation() {
    resetSessionStats();
    state.dictationActive = true;
    state.dictationStage = 0;
    state.dictationWindow10 = [];
    dictationStartBtnEl.textContent = 'Перезапустити диктант';
    createDictationTask();
}

function finalizeDictationAttempt(isCorrect, targetMidi) {
    state.totalCounted += 1;
    if (isCorrect) state.correctCounted += 1;
    state.recent20.push(isCorrect);
    if (state.recent20.length > 20) state.recent20.shift();
    const reaction = performance.now() - state.taskStartMs;
    state.reactionTimesMs.push(reaction);
    recordNoteStat(targetMidi, isCorrect, reaction);
    evaluateDictationProgress(isCorrect);
    syncStatsUI();
}

function handleDictationPress(midi) {
    if (!state.dictationActive || !state.dictationTargetMidi) return;
    if (midi === state.dictationTargetMidi) {
        markKeyClass(midi, 'correct', 320);
        playSuccessCue();
        finalizeDictationAttempt(true, state.dictationTargetMidi);
        dictationMessageEl.textContent = `Правильно. Була нота ${midiToDisplayName(midi, accidentalModeEl.value, true)}.`;
        setTimeout(createDictationTask, 800);
    } else {
        markKeyClass(midi, 'wrong', 320);
        const targetLabel = midiToDisplayName(state.dictationTargetMidi, accidentalModeEl.value, true);
        finalizeDictationAttempt(false, state.dictationTargetMidi);
        dictationMessageEl.textContent = `Це була нота ${targetLabel}. Слухай наступну.`;
        setTimeout(createDictationTask, 900);
    }
}

function handleKeyPress(midi, domEl) {
    initAudio();
    playMidi(midi, 0.65, 0.7);
    if (domEl) {
        domEl.classList.add('active');
        setTimeout(() => domEl.classList.remove('active'), 130);
    }

    if (state.mode === 'dictation') {
        handleDictationPress(midi);
        return;
    }
    if (state.mode === 'train') {
        handleTrainingPress(midi);
    }
}

function handleKeyboardDown(e) {
    const key = e.key.toLowerCase();
    if (!Object.prototype.hasOwnProperty.call(KEYBOARD_MAP, key)) return;
    if (state.pressedKeyboardKeys.has(key)) return;
    state.pressedKeyboardKeys.add(key);
    const midi = KEYBOARD_MAP[key];
    const keyEl = keyElsByMidi.get(midi);
    handleKeyPress(midi, keyEl);
}

function handleKeyboardUp(e) {
    const key = e.key.toLowerCase();
    state.pressedKeyboardKeys.delete(key);
}

function bindEvents() {
    modeFreeBtn.addEventListener('click', () => setMode('free'));
    modeTrainBtn.addEventListener('click', () => setMode('train'));
    modeDictationBtn.addEventListener('click', () => {
        setMode('dictation');
        syncStatsUI();
    });

    moduleSelectEl.addEventListener('change', () => {
        state.module = Number(moduleSelectEl.value);
        updateCoachMessage('РњРѕРґСѓР»СЊ Р·РјС–РЅРµРЅРѕ. Р—Р°РїСѓСЃС‚Рё Р°Р±Рѕ РїРµСЂРµР·Р°РїСѓСЃС‚Рё СЃРµСЃС–СЋ.');
        syncStatsUI();
    });

    labelModeEl.addEventListener('change', updateKeyLabels);
    accidentalModeEl.addEventListener('change', () => {
        updateKeyLabels();
        renderStaffTask();
        renderPerNoteStats();
    });

    sessionBtnEl.addEventListener('click', async () => {
        await initAudio();
        startTrainingSession();
    });
    skipBtnEl.addEventListener('click', skipTask);

    dictationStartBtnEl.addEventListener('click', async () => {
        await initAudio();
        startDictation();
    });
    dictationReplayBtnEl.addEventListener('click', () => {
        if (state.dictationTargetMidi) playMidi(state.dictationTargetMidi, 0.8, 0.8);
    });

    window.addEventListener('keydown', handleKeyboardDown);
    window.addEventListener('keyup', handleKeyboardUp);
}

function init() {
    buildKeyboard();
    bindEvents();
    updateKeyLabels();
    syncStatsUI();
    setMode('train');
    const wrapper = document.querySelector('.piano-wrapper');
    if (wrapper) {
        wrapper.scrollLeft = (wrapper.scrollWidth - wrapper.clientWidth) / 2;
    }
}

init();


