/**
 * ІНТЕРАКТИВНИЙ УРОК: ДАНІ ТА ІНФОРМАЦІЯ
 * Скрипти для 3–4 класів
 */

'use strict';

// ============================================
// МОБІЛЬНЕ МЕНЮ
// ============================================

const mobileMenuBtn = document.getElementById('mobile-menu-btn');
const mobileMenu = document.getElementById('mobile-menu');

function setMobileMenuState(isOpen) {
    if (!mobileMenu || !mobileMenuBtn) return;

    mobileMenu.classList.toggle('hidden', !isOpen);
    mobileMenuBtn.setAttribute('aria-expanded', String(isOpen));

    const icon = mobileMenuBtn.querySelector('i');
    if (icon) {
        icon.className = isOpen ? 'fas fa-times' : 'fas fa-bars';
    }
}

if (mobileMenuBtn && mobileMenu) {
    mobileMenuBtn.addEventListener('click', () => {
        const isExpanded = mobileMenuBtn.getAttribute('aria-expanded') === 'true';
        setMobileMenuState(!isExpanded);
    });
}

function closeMobileMenu() {
    setMobileMenuState(false);
}

// Закриття меню при кліку поза ним.
document.addEventListener('click', (e) => {
    if (!mobileMenu || !mobileMenuBtn || mobileMenu.classList.contains('hidden')) return;
    if (!mobileMenu.contains(e.target) && !mobileMenuBtn.contains(e.target)) {
        closeMobileMenu();
    }
});

// Закриття меню по Escape.
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeMobileMenu();
    }
});

// ============================================
// КНОПКА "ВГОРУ"
// ============================================

const scrollTopBtn = document.getElementById('scroll-top-btn');

function handleScroll() {
    if (!scrollTopBtn) return;
    scrollTopBtn.classList.toggle('hidden', window.scrollY <= 300);
}

window.addEventListener('scroll', handleScroll, { passive: true });
handleScroll();

if (scrollTopBtn) {
    scrollTopBtn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}

// ============================================
// ЛОГІКА МІНІ-КВІЗІВ
// ============================================

function checkQuiz(id, isCorrect, btn, feedbackText) {
    const feedbackEl = document.getElementById(`quiz${id}-feedback`);
    const optionsContainer = document.getElementById(`quiz${id}-options`);

    if (!feedbackEl || !optionsContainer || !btn) return;

    const buttons = optionsContainer.querySelectorAll('button');

    buttons.forEach((button) => {
        button.disabled = true;
        button.classList.add('opacity-60', 'cursor-not-allowed');
        button.setAttribute('aria-pressed', 'false');
    });

    btn.classList.remove('opacity-60', 'cursor-not-allowed');
    btn.setAttribute('aria-pressed', 'true');

    if (isCorrect) {
        btn.classList.add('bg-green-100', 'border-green-500', 'text-green-900', 'correct-anim');
        feedbackEl.innerHTML = `<i class="fas fa-check-circle mr-2" aria-hidden="true"></i> ${escapeHtml(feedbackText)}`;
        feedbackEl.className = 'mt-4 text-base md:text-lg font-bold p-4 rounded-xl bg-green-100 text-green-800 animate-fade-in';
    } else {
        btn.classList.add('bg-red-100', 'border-red-500', 'text-red-900', 'wrong-anim');
        feedbackEl.innerHTML = `<i class="fas fa-times-circle mr-2" aria-hidden="true"></i> ${escapeHtml(feedbackText)}`;
        feedbackEl.className = 'mt-4 text-base md:text-lg font-bold p-4 rounded-xl bg-red-100 text-red-800 animate-fade-in';
    }

    feedbackEl.classList.remove('hidden');

    window.setTimeout(() => {
        if (feedbackEl.querySelector('.reset-btn')) return;

        const resetBtn = document.createElement('button');
        resetBtn.type = 'button';
        resetBtn.innerText = 'Спробувати ще раз';
        resetBtn.className = 'reset-btn block mt-3 text-sm underline text-slate-500 hover:text-slate-800 cursor-pointer focus:outline-none focus:text-indigo-600';
        resetBtn.onclick = () => resetQuiz(id);
        feedbackEl.appendChild(resetBtn);
    }, 800);
}

function resetQuiz(id) {
    const optionsContainer = document.getElementById(`quiz${id}-options`);
    const feedbackEl = document.getElementById(`quiz${id}-feedback`);

    if (!optionsContainer || !feedbackEl) return;

    feedbackEl.classList.add('hidden');
    feedbackEl.innerHTML = '';

    optionsContainer.querySelectorAll('button').forEach((button) => {
        button.disabled = false;
        button.classList.remove(
            'opacity-60', 'cursor-not-allowed',
            'bg-green-100', 'border-green-500', 'text-green-900', 'correct-anim',
            'bg-red-100', 'border-red-500', 'text-red-900', 'wrong-anim'
        );
        button.setAttribute('aria-pressed', 'false');
    });
}

// ============================================
// ПРИКЛАДИ: ДАНІ / ІНФОРМАЦІЯ
// ============================================

function toggleExample(card) {
    const answer = card?.querySelector('.example-answer');
    if (!answer) return;

    const isHidden = answer.classList.toggle('hidden');
    card.classList.toggle('ring-2', !isHidden);
    card.classList.toggle('ring-blue-300', !isHidden);
}

// ============================================
// ГРА "СОРТУВАННЯ ДАНИХ"
// ============================================

let selectedSortChip = null;
let draggedSortChip = null;

function getSortFeedback() {
    return document.getElementById('sort-feedback');
}

function showSortFeedback(message, type = 'info') {
    const feedback = getSortFeedback();
    if (!feedback) return;

    const colorClass = type === 'success'
        ? 'text-green-700'
        : type === 'error'
            ? 'text-red-700'
            : 'text-purple-700';

    feedback.textContent = message;
    feedback.className = `mt-3 text-center font-bold ${colorClass} animate-fade-in`;
    feedback.classList.remove('hidden');
}

function clearSortFeedback() {
    const feedback = getSortFeedback();
    if (!feedback) return;
    feedback.classList.add('hidden');
    feedback.textContent = '';
}

function clearSelectedSortChip() {
    if (!selectedSortChip) return;
    selectedSortChip.classList.remove('selected');
    selectedSortChip.setAttribute('aria-pressed', 'false');
    selectedSortChip = null;
}

function selectSortChip(eventOrChip, maybeChip) {
    const event = maybeChip ? eventOrChip : window.event;
    const chip = maybeChip || eventOrChip;
    if (event?.stopPropagation) event.stopPropagation();
    if (!chip || chip.classList.contains('sorted')) return;

    if (selectedSortChip === chip) {
        clearSelectedSortChip();
        clearSortFeedback();
        return;
    }

    clearSelectedSortChip();
    selectedSortChip = chip;
    chip.classList.add('selected');
    chip.setAttribute('aria-pressed', 'true');
    showSortFeedback('Тепер натисни на правильну колонку для цієї картки.', 'info');
}

// Backward-compatible wrapper for older inline calls.
function moveSort(chip, type) {
    if (!chip) return;
    placeSortChip(chip, type);
}

function dragSort(ev) {
    const chip = ev.currentTarget;
    if (!chip || chip.classList.contains('sorted')) {
        ev.preventDefault();
        return;
    }

    draggedSortChip = chip;
    ev.dataTransfer.effectAllowed = 'move';
    ev.dataTransfer.setData('text/plain', chip.dataset.sortType || '');
    chip.style.opacity = '0.5';
}

function finishSortDrag(ev) {
    if (ev?.currentTarget) {
        ev.currentTarget.style.opacity = '1';
    }
    draggedSortChip = null;
}

function allowDrop(ev) {
    ev.preventDefault();
    const zone = ev.currentTarget;
    if (zone) zone.classList.add('drag-over');
}

function dropSort(ev, zoneType) {
    ev.preventDefault();
    const zone = ev.currentTarget;
    if (zone) zone.classList.remove('drag-over');

    const chip = draggedSortChip;
    if (!chip) return;

    chip.style.opacity = '1';
    placeSortChip(chip, zoneType, zone);
    draggedSortChip = null;
}

function placeSelectedSort(zoneType) {
    if (!selectedSortChip) {
        showSortFeedback('Спочатку обери картку, яку хочеш покласти в цю колонку.', 'info');
        return;
    }
    placeSortChip(selectedSortChip, zoneType);
}

function handleSortZoneKey(event, zoneType) {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    placeSelectedSort(zoneType);
}

function placeSortChip(chip, zoneType, zoneEl = null) {
    if (!chip || chip.classList.contains('sorted')) return;

    const correctType = chip.dataset.sortType;
    const targetId = zoneType === 'cat' ? 'cat-items' : 'num-items';
    const target = document.getElementById(targetId);
    const zone = zoneEl || document.querySelector(`[data-zone-type="${zoneType}"]`);

    if (!target || !correctType) return;

    if (correctType !== zoneType) {
        if (zone) {
            zone.classList.add('wrong-drop');
            window.setTimeout(() => zone.classList.remove('wrong-drop'), 450);
        }
        showSortFeedback('Ще раз подумай: це назва чи кількість?', 'error');
        return;
    }

    chip.classList.remove('selected');
    chip.classList.add('sorted');
    chip.setAttribute('aria-pressed', 'false');
    chip.setAttribute('draggable', 'false');
    target.appendChild(chip);
    selectedSortChip = null;
    checkSortComplete();
}

['sort-cat-zone', 'sort-num-zone'].forEach((id) => {
    const zone = document.getElementById(id);
    if (!zone) return;

    zone.addEventListener('dragleave', () => zone.classList.remove('drag-over'));
    zone.addEventListener('dragover', allowDrop);
});

function checkSortComplete() {
    const source = document.getElementById('sort-source');
    if (!source) return;

    const remaining = source.querySelectorAll('.sort-chip:not(.sorted)');

    if (remaining.length === 0) {
        showSortFeedback('🎉 Супер! Ти правильно розсортував усі дані!', 'success');
    } else {
        showSortFeedback('Правильно! Обери наступну картку.', 'success');
    }
}

function resetSort() {
    const source = document.getElementById('sort-source');
    const catItems = document.getElementById('cat-items');
    const numItems = document.getElementById('num-items');

    if (!source || !catItems || !numItems) return;

    const allChips = [...source.children, ...catItems.children, ...numItems.children]
        .filter((el) => el.classList.contains('sort-chip'))
        .sort((a, b) => Number(a.dataset.sortOrder || 0) - Number(b.dataset.sortOrder || 0));

    clearSelectedSortChip();

    allChips.forEach((chip) => {
        chip.classList.remove('sorted', 'selected');
        chip.style.opacity = '1';
        chip.setAttribute('draggable', 'true');
        chip.setAttribute('aria-pressed', 'false');
        source.appendChild(chip);
    });

    clearSortFeedback();
}

// ============================================
// СИМУЛЯТОР ТАБЛИЦІ
// ============================================

function showCell(addr, type, val) {
    const infoBox = document.getElementById('cell-info');
    const addrDisplay = document.getElementById('cell-addr-display');
    const valDisplay = document.getElementById('cell-val-display');
    const typeDisplay = document.getElementById('cell-type-display');

    if (!infoBox || !addrDisplay || !valDisplay || !typeDisplay) return;

    infoBox.classList.remove('hidden');
    infoBox.classList.add('animate-fade-in');
    window.setTimeout(() => infoBox.classList.remove('animate-fade-in'), 500);

    addrDisplay.innerText = addr;
    valDisplay.innerText = val;
    typeDisplay.innerText = type;
}

function checkAddr(btn, isCorrect) {
    const feedback = document.getElementById('addr-feedback');
    const allBtns = document.querySelectorAll('.addr-btn');

    if (!feedback || !btn) return;

    allBtns.forEach((button) => {
        button.disabled = true;
        button.classList.add('opacity-50');
    });
    btn.classList.remove('opacity-50');

    if (isCorrect) {
        btn.classList.add('bg-green-100', 'border-green-500', 'text-green-900');
        feedback.innerHTML = '✅ Правильно! Ціна бананів у стовпці C, рядку 3 — адреса C3.';
        feedback.className = 'mt-3 font-bold text-green-700 animate-fade-in';
    } else {
        btn.classList.add('bg-red-100', 'border-red-500', 'text-red-900');
        feedback.innerHTML = '❌ Ні. Подумай: де знаходиться ціна? У стовпці C. А банани — у рядку 3.';
        feedback.className = 'mt-3 font-bold text-red-700 animate-fade-in';
    }
    feedback.classList.remove('hidden');

    window.setTimeout(() => {
        if (feedback.querySelector('.reset-addr')) return;

        const resetBtn = document.createElement('button');
        resetBtn.type = 'button';
        resetBtn.innerText = 'Спробувати ще раз';
        resetBtn.className = 'reset-addr block mt-2 text-sm underline text-slate-500 hover:text-slate-800 cursor-pointer';
        resetBtn.onclick = () => resetAddressExercise(allBtns, feedback);
        feedback.appendChild(resetBtn);
    }, 600);
}

function resetAddressExercise(buttons, feedback) {
    buttons.forEach((button) => {
        button.disabled = false;
        button.classList.remove(
            'opacity-50',
            'bg-green-100', 'border-green-500', 'text-green-900',
            'bg-red-100', 'border-red-500', 'text-red-900'
        );
    });
    feedback.classList.add('hidden');
    feedback.innerHTML = '';
}

// ============================================
// ФІНАЛЬНИЙ ТЕСТ
// ============================================

const QUESTION_COUNT = 5;

const questionPool = [
    { q: "Що таке дані?", a: ["Це просто факти: числа, слова, картинки або звуки без пояснень", "Це готова історія", "Це мультфільм", "Це комп'ютерна гра"], correct: 0 },
    { q: "Щоб дані стали інформацією, нам потрібен...", a: ["Контекст — пояснення, що ці дані означають", "Ще більший шрифт", "Червона ручка", "Магія"], correct: 0 },
    { q: "На термометрі 38,6°C. Це стає інформацією, коли ми розуміємо, що...", a: ["Це температура людини, і вона може захворіти", "Це просто красиве число", "Це ціна морозива", "Це швидкість машини"], correct: 0 },
    { q: "Який тип даних відповідає на питання «Скільки?»", a: ["Числа-лічилки", "Слова-назви", "Кольори", "Звуки"], correct: 0 },
    { q: "Улюблений колір: синій, червоний, зелений — це...", a: ["Слова-назви", "Числа-лічилки", "Математика", "Геометрія"], correct: 0 },
    { q: "Як називається клітинка на перетині стовпця B і рядка 3?", a: ["B3", "3B", "Клітинка 3", "Третя"], correct: 0 },
    { q: "Навіщо YouTube запам'ятовує, що ти дивишся?", a: ["Щоб порадити цікаві відео", "Щоб насварити тебе", "Щоб видалити інтернет", "Просто так"], correct: 0 },
    { q: "Який графік схожий на піцу?", a: ["Кругова діаграма", "Стовпчикова діаграма", "Лінійний графік", "Таблиця"], correct: 0 },
    { q: "Для комп'ютера твоє фото — це...", a: ["Набір нулів та одиниць", "Маленька картинка всередині екрана", "Фарба", "Папір"], correct: 0 },
    { q: "Таблиці потрібні, щоб...", a: ["Тримати дані в порядку", "Малювати котиків", "Грати у футбол", "Плутати людей"], correct: 0 },
    { q: "Що з цього є інформацією?", a: ["Завтра буде дощ — візьми парасольку", "Слово «дощ»", "Крапля води", "Хмара"], correct: 0 },
    { q: "Дані: «5». Контекст: «оцінка в щоденнику». Інформація: ...", a: ["Я отримав гарну оцінку!", "Я отримав 5 яблук", "Зараз 5 годин", "Це просто цифра"], correct: 0 },
    { q: "Який графік показує зміни з часом?", a: ["Лінійний графік", "Кругова діаграма", "Таблиця", "Стовпчикова діаграма"], correct: 0 },
    { q: "Кількість учнів у класі — 25. Це...", a: ["Числа-лічилки", "Слова-назви", "Картинка", "Звук"], correct: 0 },
    { q: "Назва міста: Київ, Львів, Одеса — це...", a: ["Слова-назви", "Числа-лічилки", "Графік", "Таблиця"], correct: 0 },
    { q: "Що таке контекст для даних?", a: ["Пояснення, що означають цифри або слова", "Ще одне число", "Колір фону", "Розмір шрифту"], correct: 0 },
    { q: "У клітинці A1 написано «Яблуко». Що це?", a: ["Текстові дані", "Число", "Формула", "Гроші"], correct: 0 },
    { q: "Що робить обробка даних?", a: ["Перетворює їх на корисну інформацію", "Видаляє їх", "Збільшує шрифт", "Міняє колір"], correct: 0 },
    { q: "Який тип даних — «Так» або «Ні»?", a: ["Слова-назви", "Числа-лічилки", "Гроші", "Дата"], correct: 0 },
    { q: "Навіщо потрібні графіки?", a: ["Щоб швидко побачити закономірності", "Щоб заплутати людей", "Щоб зайняти місце", "Щоб малювати картини"], correct: 0 }
];

let currentQuestions = [];
let qIndex = 0;
let score = 0;
let userAnswers = [];
let answerTimer = null;

// Алгоритм Фішера-Йейтса.
function shuffle(array) {
    const arr = [...array];
    for (let currentIndex = arr.length - 1; currentIndex > 0; currentIndex -= 1) {
        const randomIndex = Math.floor(Math.random() * (currentIndex + 1));
        [arr[currentIndex], arr[randomIndex]] = [arr[randomIndex], arr[currentIndex]];
    }
    return arr;
}

function startFinalTest() {
    const startScreen = document.getElementById('start-screen');
    const resultScreen = document.getElementById('result-screen');
    const quizContainer = document.getElementById('quiz-container');

    window.clearTimeout(answerTimer);

    if (startScreen) startScreen.classList.add('hidden');
    if (resultScreen) resultScreen.classList.add('hidden');
    if (quizContainer) quizContainer.classList.remove('hidden');

    document.getElementById('test')?.scrollIntoView({ behavior: 'smooth', block: 'start' });

    score = 0;
    qIndex = 0;
    userAnswers = [];
    currentQuestions = shuffle(questionPool).slice(0, QUESTION_COUNT);
    updateProgressBar();
    showQuestion();
}

function updateProgressBar() {
    const bar = document.getElementById('progress-bar');
    if (!bar) return;

    const percent = Math.min(100, Math.round((qIndex / QUESTION_COUNT) * 100));
    bar.style.width = `${percent}%`;
}

function showQuestion() {
    const q = currentQuestions[qIndex];
    if (!q) return;

    const qNumber = document.getElementById('q-number');
    const scoreDisplay = document.getElementById('score-display');
    const questionText = document.getElementById('question-text');
    const area = document.getElementById('answers-area');

    if (qNumber) qNumber.innerText = qIndex + 1;
    if (scoreDisplay) scoreDisplay.innerText = score;
    if (questionText) questionText.innerText = q.q;

    if (!area) return;
    area.innerHTML = '';

    const answers = shuffle(q.a.map((text, i) => ({ text, i })));

    answers.forEach((ans) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'w-full text-left p-4 md:p-5 bg-slate-50 border-2 border-slate-200 rounded-2xl hover:bg-indigo-50 hover:border-indigo-400 transition text-base md:text-lg font-bold relative overflow-hidden group focus:ring-4 focus:ring-indigo-300 outline-none touch-manipulation';
        btn.innerHTML = `<span class="relative z-10 group-hover:text-indigo-900 transition">${escapeHtml(ans.text)}</span>`;
        btn.onclick = () => handleAnswer(ans.i === q.correct, btn, ans.i);
        area.appendChild(btn);
    });
}

function handleAnswer(isCorrect, btn, answerIndex) {
    const area = document.getElementById('answers-area');
    if (!area || !btn) return;

    const buttons = area.querySelectorAll('button');
    const q = currentQuestions[qIndex];
    if (!q) return;

    buttons.forEach((button) => {
        button.disabled = true;
        button.classList.add('opacity-50', 'cursor-not-allowed');
    });
    btn.classList.remove('opacity-50', 'cursor-not-allowed');

    userAnswers.push({
        question: q.q,
        correct: isCorrect,
        userAnswer: q.a[answerIndex],
        correctAnswer: q.a[q.correct]
    });

    if (isCorrect) {
        score += 1;
        btn.classList.remove('bg-slate-50', 'border-slate-200');
        btn.classList.add('bg-green-100', 'border-green-500', 'text-green-900', 'correct-anim');
        btn.innerHTML += ' <i class="fas fa-check absolute right-4 md:right-6 top-1/2 -translate-y-1/2 text-green-600 text-xl md:text-2xl" aria-hidden="true"></i>';
    } else {
        btn.classList.remove('bg-slate-50', 'border-slate-200');
        btn.classList.add('bg-red-100', 'border-red-500', 'text-red-900', 'wrong-anim');
        btn.innerHTML += ' <i class="fas fa-times absolute right-4 md:right-6 top-1/2 -translate-y-1/2 text-red-600 text-xl md:text-2xl" aria-hidden="true"></i>';

        buttons.forEach((button) => {
            const btnText = button.querySelector('span')?.innerText;
            if (btnText === q.a[q.correct]) {
                button.classList.remove('opacity-50');
                button.classList.add('bg-green-50', 'border-green-300');
            }
        });
    }

    answerTimer = window.setTimeout(() => {
        qIndex += 1;
        updateProgressBar();
        if (qIndex < QUESTION_COUNT) {
            showQuestion();
        } else {
            showResult();
        }
    }, 1200);
}

function showResult() {
    const quizContainer = document.getElementById('quiz-container');
    const resultScreen = document.getElementById('result-screen');
    const finalScore = document.getElementById('final-score');
    const icon = document.getElementById('result-icon');
    const msg = document.getElementById('result-msg');
    const details = document.getElementById('result-details');
    const detailsList = document.getElementById('result-details-list');

    if (quizContainer) quizContainer.classList.add('hidden');
    if (resultScreen) resultScreen.classList.remove('hidden');
    if (finalScore) finalScore.innerText = score;

    if (detailsList) {
        detailsList.innerHTML = '';
        userAnswers.forEach((ans, idx) => {
            const div = document.createElement('div');
            div.className = `p-3 rounded-lg ${ans.correct ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`;
            div.innerHTML = `
                <p class="font-bold text-sm md:text-base text-slate-800">${idx + 1}. ${escapeHtml(ans.question)}</p>
                <p class="text-sm mt-1">
                    ${ans.correct
                    ? `<span class="text-green-700">✅ ${escapeHtml(ans.userAnswer)}</span>`
                    : `<span class="text-red-700">❌ ${escapeHtml(ans.userAnswer)}</span> <span class="text-green-700 ml-2">(Правильно: ${escapeHtml(ans.correctAnswer)})</span>`
                }
                </p>
            `;
            detailsList.appendChild(div);
        });
    }
    if (details) details.classList.remove('hidden');

    if (icon && msg) {
        if (score === QUESTION_COUNT) {
            icon.innerText = '🚀';
            msg.innerText = 'Неймовірно! Ти справжній майстер даних! Тобі можна довірити керування суперкомп’ютером.';
        } else if (score >= 3) {
            icon.innerText = '😎';
            msg.innerText = 'Хороша робота! Ти багато чого зрозумів, але можна ще трохи потренуватися.';
        } else {
            icon.innerText = '🌱';
            msg.innerText = 'Не засмучуйся! Прочитай урок ще раз, і наступного разу все вийде.';
        }
    }

    qIndex = QUESTION_COUNT;
    updateProgressBar();
}

function hideResult() {
    const resultScreen = document.getElementById('result-screen');
    if (resultScreen) resultScreen.classList.add('hidden');
}

// ============================================
// УТИЛІТИ
// ============================================

function escapeHtml(text) {
    const div = document.createElement('div');
    div.innerText = String(text ?? '');
    return div.innerHTML;
}

// Ініціалізація при завантаженні.
document.addEventListener('DOMContentLoaded', () => {
    const criticalIds = ['mobile-menu', 'mobile-menu-btn', 'quiz-container', 'result-screen'];
    criticalIds.forEach((id) => {
        if (!document.getElementById(id)) {
            console.warn(`Елемент #${id} не знайдено`);
        }
    });

    document.querySelectorAll('.sort-chip').forEach((chip) => {
        chip.setAttribute('aria-pressed', 'false');
    });
});
