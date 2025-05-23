let currentText = '';
const textDisplay = document.getElementById('textDisplay');
const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const keyboard = document.getElementById('keyboard');

// [AI: 1] Відновлюємо текст із localStorage, якщо такий є (опціонально, див. AI: 6)
if (window.localStorage && localStorage.getItem('savedText')) {
    currentText = localStorage.getItem('savedText');
}

// [AI: 2] Забороняємо вставку/копіювання/drag в текстовий дисплей
textDisplay.onpaste = e => e.preventDefault();
textDisplay.oncopy = e => e.preventDefault();
textDisplay.ondragstart = e => e.preventDefault();
textDisplay.onselectstart = e => e.preventDefault();

// [AI: 3] Блокуємо контекстне меню (на всю сторінку!)
document.addEventListener('contextmenu', e => e.preventDefault());

// [AI: 4] Змінні для throttle та захисту
const MAX_TEXT_LENGTH = 100;
let lastKeyPressTime = 0;
let lastSoundTime = 0;
const KEY_PRESS_COOLDOWN = 300;
const SOUND_COOLDOWN = 100;

// [AI: 5] Відстеження неактивності (idle)
let idleTimer = null;
function resetIdleTimer() {
    if (idleTimer) clearTimeout(idleTimer);
    idleTimer = setTimeout(() => {
        showFeedback("Почнемо спочатку? Натисни 🗑️", "info");
    }, 120000); // 2 хв
}
// Додаємо resetIdleTimer у всі взаємодії!

// [AI: 6] Збереження тексту в localStorage (опціонально)
function saveTextToStorage() {
    if (window.localStorage) localStorage.setItem('savedText', currentText);
}

// [AI: 7] Візуальний фідбек для дітей
function showFeedback(message, type = 'info') {
    const feedback = document.createElement('div');
    feedback.className = `feedback feedback-${type}`;
    feedback.textContent = message;
    feedback.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: #FFE4B5;
        color: #8B4513;
        padding: 20px;
        border-radius: 15px;
        font-size: 24px;
        font-weight: bold;
        z-index: 1000;
        box-shadow: 0 4px 8px rgba(0,0,0,0.3);
    `;
    document.body.appendChild(feedback);
    setTimeout(() => {
        // [AI: 8] Більш надійне видалення feedback (для старих браузерів)
        if (feedback.parentNode) feedback.parentNode.removeChild(feedback);
    }, 2000);
}

// [AI: 9] Робимо всі .key "неклікбельними" на час throttle
function disableTemporarily(el, duration = 300) {
    el.style.pointerEvents = "none";
    setTimeout(() => { el.style.pointerEvents = ""; }, duration);
}

// [AI: 10] Генерація клавіатури
function renderKeyboard() {
    keyboard.innerHTML = '';
    const keysGrid = document.createElement('div');
    keysGrid.className = 'keys-grid';
    keyboard.appendChild(keysGrid);

    const bottomRow = document.getElementById('bottom-keyboard-row');
    bottomRow.innerHTML = '';

    for (let i = 0; i < 24; i++) {
        const letter = alphabet[i];
        const key = document.createElement('div');
        key.className = 'key';
        key.textContent = letter;
        key.setAttribute('data-letter', letter);
        // [AI: 11] Додаємо блокування multi-tap через disableTemporarily
        key.addEventListener('click', function() {
            disableTemporarily(key);
            addLetter(letter);
        });
        keysGrid.appendChild(key);
    }
    // Y та Z
    ['Y','Z'].forEach(letter => {
        const key = document.createElement('div');
        key.className = 'key';
        key.textContent = letter;
        key.setAttribute('data-letter', letter);
        key.addEventListener('click', function() {
            disableTemporarily(key);
            addLetter(letter);
        });
        bottomRow.appendChild(key);
    });

    // Space
    const spaceKey = document.createElement('div');
    spaceKey.className = 'key space-key';
    spaceKey.textContent = '🚀 SPACE';
    spaceKey.addEventListener('click', function() {
        disableTemporarily(spaceKey);
        addSpace();
    });
    bottomRow.appendChild(spaceKey);

    // Backspace
    const backspaceKey = document.createElement('div');
    backspaceKey.className = 'key backspace-key';
    backspaceKey.textContent = '⬅️ DELETE';
    backspaceKey.addEventListener('click', function() {
        disableTemporarily(backspaceKey);
        backspace();
    });
    bottomRow.appendChild(backspaceKey);
}

// [AI: 12] Залишаємо addLetter як проксі для safeAddLetter (з фільтрацією)
let isProcessingInput = false;
function safeAddLetter(letter) {
    // [AI: 13] Пропускаємо все, окрім латинських літер
    if (!alphabet.includes(letter)) return;

    if (isProcessingInput) return;
    isProcessingInput = true;
    setTimeout(() => { isProcessingInput = false; }, KEY_PRESS_COOLDOWN);

    const now = Date.now();
    if (now - lastKeyPressTime < KEY_PRESS_COOLDOWN) return;

    if (currentText.length >= MAX_TEXT_LENGTH) {
        showFeedback('Текст занадто довгий! 😊');
        return;
    }
    lastKeyPressTime = now;
    currentText += letter;
    updateDisplay();
    animateKey(letter);
    playSound();
    saveTextToStorage(); // [AI: 14] Зберігаємо текст
    resetIdleTimer();    // [AI: 15] Скидаємо таймер неактивності

    // [AI: 16] Вібрація на мобільному!
    if (window.navigator.vibrate) window.navigator.vibrate(40);
}
function addLetter(letter) { safeAddLetter(letter); }

function addSpace() {
    const now = Date.now();
    if (now - lastKeyPressTime < KEY_PRESS_COOLDOWN) return;
    if (currentText.length >= MAX_TEXT_LENGTH) return;

    lastKeyPressTime = now;
    currentText += ' ';
    animateKey('SPACE');
    updateDisplay();
    playSound();
    saveTextToStorage();
    resetIdleTimer();
    if (window.navigator.vibrate) window.navigator.vibrate(30);
}

function typeWord(word) {
    const now = Date.now();
    if (now - lastKeyPressTime < KEY_PRESS_COOLDOWN) return;

    let wordToAppend = word;
    let textWithNewWordPreview = currentText;
    if (currentText.length > 0 && currentText[currentText.length - 1] !== ' ') {
        wordToAppend = ' ' + word;
    }
    textWithNewWordPreview += wordToAppend;

    if (textWithNewWordPreview.length > MAX_TEXT_LENGTH) {
        showFeedback('Слово не вміщується! 😢');
        return;
    }
    lastKeyPressTime = now;
    currentText += wordToAppend;
    updateDisplay();
    playEncouragementSound();
    saveTextToStorage();
    resetIdleTimer();
    if (window.navigator.vibrate) window.navigator.vibrate(60);
}

function backspace() {
    const now = Date.now();
    if (now - lastKeyPressTime < KEY_PRESS_COOLDOWN) return;
    lastKeyPressTime = now;
    if (currentText.length > 0) {
        currentText = currentText.slice(0, -1);
        animateKey('DELETE');
        updateDisplay();
        playDeleteSound();
        saveTextToStorage();
        resetIdleTimer();
        if (window.navigator.vibrate) window.navigator.vibrate(25);
    }
}

function clearText() {
    const now = Date.now();
    if (now - lastKeyPressTime < KEY_PRESS_COOLDOWN) return;
    lastKeyPressTime = now;
    currentText = '';
    updateDisplay();
    playClearSound();
    saveTextToStorage();
    resetIdleTimer();
    requestAnimationFrame(() => {
        const cursorElement = document.querySelector('.cursor');
        if (cursorElement) cursorElement.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'end' });
        textDisplay.scrollLeft = textDisplay.scrollWidth;
    });
}

function updateDisplay() {
    const displayText = currentText.replace(/ /g, '<span class="visible-space">&nbsp;</span>');
    textDisplay.innerHTML = displayText + '<span class="cursor"></span>';
    requestAnimationFrame(() => {
        const cursorElement = document.querySelector('.cursor');
        if (cursorElement) cursorElement.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'end' });
        textDisplay.scrollLeft = textDisplay.scrollWidth;
    });
}

// [AI: 17] Анімація клавіш (без змін)
const animatingKeys = new Set();
function animateKey(letter) {
    const keyId = letter + '_animation';
    if (animatingKeys.has(keyId)) return;
    animatingKeys.add(keyId);
    let keyEl = findKeyElement(letter);
    if (keyEl) {
        keyEl.classList.add('pressed');
        setTimeout(() => {
            keyEl.classList.remove('pressed');
            animatingKeys.delete(keyId);
        }, 300);
    } else {
        animatingKeys.delete(keyId);
    }
}
function findKeyElement(letter) {
    if (letter === 'SPACE') return document.querySelector('.space-key');
    if (letter === 'DELETE' || letter === 'BACKSPACE') return document.querySelector('.backspace-key');
    return document.querySelector(`.key[data-letter="${letter}"]`);
}

// [AI: 18] Глобальні змінні для аудіо
let audioContext = null;
let audioInitialized = false;
function initAudioContext() {
    if (audioInitialized) return true;
    try {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (!AudioContextClass) {
            showFeedback('Без звуку — спробуйте інший пристрій!', 'error');
            return false;
        }
        audioContext = new AudioContextClass();
        audioInitialized = true;
        return true;
    } catch (error) {
        showFeedback('Не вдалося запустити звук', 'error');
        return false;
    }
}
function playSound() {
    const now = Date.now();
    if (now - lastSoundTime < SOUND_COOLDOWN) return;
    lastSoundTime = now;
    if (!initAudioContext()) return;
    try {
        if (audioContext.state === 'suspended') audioContext.resume();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        oscillator.connect(gainNode); gainNode.connect(audioContext.destination);
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.1);
        // Дублюючий захист від memory leak
        setTimeout(() => {
            try { oscillator.disconnect(); } catch (e) {}
            try { gainNode.disconnect(); } catch (e) {}
        }, 120);
        // Дублюючий захист від memory leak
        setTimeout(() => {
            try { oscillator.disconnect(); } catch (e) {}
            try { gainNode.disconnect(); } catch (e) {}
        }, 120);
        // [AI: 19] Запобігаємо memory leak
        oscillator.onended = () => { oscillator.disconnect(); gainNode.disconnect(); };
    } catch (error) { console.error('Помилка відтворення звуку:', error); }
}
const ENCOURAGEMENT_SOUNDS = [
    { freq: 523, duration: 0.2 },
    { freq: 659, duration: 0.2 },
    { freq: 784, duration: 0.3 }
];
function playEncouragementSound() {
    if (!audioContext) return;
    ENCOURAGEMENT_SOUNDS.forEach((sound, index) => {
        setTimeout(() => {
            const osc = audioContext.createOscillator();
            const gain = audioContext.createGain();
            osc.connect(gain); gain.connect(audioContext.destination);
            osc.frequency.setValueAtTime(sound.freq, audioContext.currentTime);
            gain.gain.setValueAtTime(0.1, audioContext.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + sound.duration);
            osc.start(audioContext.currentTime);
            osc.stop(audioContext.currentTime + sound.duration);
            // [AI: 20] memory leak
            osc.onended = () => {
                try { osc.disconnect(); } catch (e) {}
                try { gain.disconnect(); } catch (e) {}
            };
            // Дублюючий захист від memory leak
            setTimeout(() => {
                try { osc.disconnect(); } catch (e) {}
                try { gain.disconnect(); } catch (e) {}
            }, (sound.duration + 0.05) * 1000);
        }, index * 100);
    });
}
function playDeleteSound() {
    const now = Date.now();
    if (now - lastSoundTime < SOUND_COOLDOWN) return;
    lastSoundTime = now;
    if (!initAudioContext()) return;
    try {
        if (audioContext.state === 'suspended') audioContext.resume();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        oscillator.connect(gainNode); gainNode.connect(audioContext.destination);
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(300, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(200, audioContext.currentTime + 0.15);
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15);
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.15);
        // Дублюючий захист від memory leak
        setTimeout(() => {
            try { oscillator.disconnect(); } catch (e) {}
            try { gainNode.disconnect(); } catch (e) {}
        }, 170);
        // [AI: 21] memory leak
        oscillator.onended = () => { oscillator.disconnect(); gainNode.disconnect(); };
    } catch (error) { console.error('Помилка відтворення звуку стирання:', error); }
}
function playClearSound() {
    const now = Date.now();
    if (now - lastSoundTime < SOUND_COOLDOWN) return;
    lastSoundTime = now;
    if (!initAudioContext()) return;
    try {
        if (audioContext.state === 'suspended') audioContext.resume();
        const startTime = audioContext.currentTime;
        const notes = [
            { freq: 400, time: 0, duration: 0.08 },
            { freq: 350, time: 0.05, duration: 0.08 },
            { freq: 300, time: 0.1, duration: 0.08 },
            { freq: 250, time: 0.15, duration: 0.08 },
            { freq: 200, time: 0.2, duration: 0.1 }
        ];
        notes.forEach(note => {
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            oscillator.connect(gainNode); gainNode.connect(audioContext.destination);
            oscillator.type = 'triangle';
            oscillator.frequency.value = note.freq;
            gainNode.gain.setValueAtTime(0.08, startTime + note.time);
            gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + note.time + note.duration);
            oscillator.start(startTime + note.time);
            oscillator.stop(startTime + note.time + note.duration);
            // [AI: 22] memory leak
            oscillator.onended = () => {
                try { oscillator.disconnect(); } catch (e) {}
                try { gainNode.disconnect(); } catch (e) {}
            };
            // Дублюючий захист від memory leak
            setTimeout(() => {
                try { oscillator.disconnect(); } catch (e) {}
                try { gainNode.disconnect(); } catch (e) {}
            }, (note.duration + 0.05) * 1000);
        });
    } catch (error) { console.error('Помилка відтворення звуку очищення:', error); }
}

// [AI: 23] Блокування затискання клавіш
const pressedKeys = new Set();
let keyboardEventHandler, touchEventHandler, touchEndHandler;

function cleanupEventListeners() {
    if (keyboardEventHandler) {
        document.removeEventListener('keydown', keyboardEventHandler);
        document.removeEventListener('keyup', keyboardEventHandler);
    }
    if (touchEventHandler) {
        document.removeEventListener('touchstart', touchEventHandler);
    }
    if (touchEndHandler) {
        document.removeEventListener('touchend', touchEndHandler);
    }
}

function setupEventListeners() {
    cleanupEventListeners();

    keyboardEventHandler = function(event) {
        const key = event.key.toUpperCase();
        if (event.type === 'keydown') {
            if (pressedKeys.has(event.code)) return;
            pressedKeys.add(event.code);
        }
        if (event.type === 'keyup') {
            pressedKeys.delete(event.code);
            return;
        }
        if (alphabet.includes(key)) { addLetter(key); }
        else if (event.code === 'Space') { event.preventDefault(); addSpace(); }
        else if (event.code === 'Backspace') { event.preventDefault(); backspace(); }
        resetIdleTimer();
    };

    let touchActiveKey = null;
    touchEventHandler = function handleTouch(e) {
        if (e.touches && e.touches.length > 1) return;
        e.preventDefault(); // Запобігає подвійним подіям і double-tap
        const target = e.target;
        if (!target.classList.contains('key')) return;
        target.style.transform = 'scale(0.95)';
        touchActiveKey = target;
        // Логіку натискання переносимо у touchend
        resetIdleTimer();
    };
    // touchend handler
    touchEndHandler = function handleTouchEnd(e) {
        if (touchActiveKey) {
            touchActiveKey.style.transform = '';
            const target = touchActiveKey;
            const letter = target.getAttribute('data-letter') || target.textContent.trim();
            if (target.classList.contains('space-key')) { addSpace(); }
            else if (target.classList.contains('backspace-key')) { backspace(); }
            else if (letter.length === 1) { safeAddLetter(letter); }
            touchActiveKey = null;
        }
        resetIdleTimer();
    };

    document.addEventListener('keydown', keyboardEventHandler);
    document.addEventListener('keyup', keyboardEventHandler);
    document.addEventListener('touchstart', touchEventHandler, { passive: false });
    document.addEventListener('touchend', touchEndHandler, { passive: false });
}

// [AI: 24] Безпечна ініціалізація

if (!Element.prototype.matches) {
    Element.prototype.matches = Element.prototype.msMatchesSelector || Element.prototype.webkitMatchesSelector;
}
if (!Element.prototype.closest) {
    Element.prototype.closest = function(s) {
        var el = this;
        do {
            if (el.matches(s)) return el;
            el = el.parentElement || el.parentNode;
        } while (el !== null && el.nodeType === 1);
        return null;
    };
}
function safeInitialize() {
    try {
        renderKeyboard();
        updateDisplay();
        setupEventListeners();
        resetIdleTimer();
        console.log('Клавіатуру успішно ініціалізовано з захисними механізмами');
    } catch (error) {
        showFeedback('Сталася помилка. Спробуйте оновити сторінку або зверніться до дорослого!', 'error');
        setTimeout(function() {
            renderKeyboard();
            updateDisplay();
            setupEventListeners();
        }, 1000);
    }
}
safeInitialize();

// [AI: 25] Глобальний моніторинг помилок + меседж для батьків
window.addEventListener('error', function(e) {
    console.error('Помилка в додатку:', e.error);
    setTimeout(() => {
        try {
            renderKeyboard();
            updateDisplay();
            showFeedback('Додаток відновлено! 🔧', 'info');
        } catch (recoveryError) {
            showFeedback('Маленька халепа! Оновіть сторінку або зверніться до дорослого.', 'error');
        }
    }, 1000);
});

// [AI: 26] Періодична перевірка інтерфейсу та очищення memory leak
setInterval(() => {
    try {
        if (!document.getElementById('textDisplay')) {
            throw new Error('Інтерфейс пошкоджено');
        }
        if (typeof animatingKeys !== 'undefined' && animatingKeys.size > 10) {
            animatingKeys.clear();
        }
    } catch (error) {
        safeInitialize();
    }
}, 30000);
