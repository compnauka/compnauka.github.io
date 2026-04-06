(function () {
    const i18n = window.APP_I18N || {
        t: (key, params = {}) => {
            let value = key;
            Object.entries(params).forEach(([paramKey, paramValue]) => {
                value = value.replaceAll(`{${paramKey}}`, String(paramValue));
            });
            return value;
        },
        applyTranslations: () => {}
    };
    const { t, applyTranslations } = i18n;
    const lessonKey = 'lesson_1_1';
    const canvas = document.getElementById('mainCanvas');
    const clearButton = document.getElementById('clear-canvas');
    const canvasStatus = document.getElementById('canvas-a11y-layer');
    const descriptionField = document.getElementById('canvas-description');
    const items = Array.from(document.querySelectorAll('.draggable-chip'));
    const zones = Array.from(document.querySelectorAll('.drop-zone'));
    const feedback = document.getElementById('drop-feedback');
    const startQuizButton = document.getElementById('start-quiz');
    const retryQuizButton = document.getElementById('retry-quiz');
    const quizStart = document.getElementById('quiz-start');
    const quizPlay = document.getElementById('quiz-play');
    const quizDone = document.getElementById('quiz-done');
    const quizStep = document.getElementById('quiz-step');
    const quizProgress = document.getElementById('quiz-progress');
    const quizQuestion = document.getElementById('quiz-q');
    const quizAnswers = document.getElementById('quiz-ans');
    const quizScoreText = document.getElementById('quiz-score-text');
    const quizEmoji = document.getElementById('quiz-emoji');
    const quizLiveRegion = document.getElementById('quiz-live-region');

    let drawing = false;
    let lastX = 0;
    let lastY = 0;
    let hasDrawn = false;
    let selectedItem = null;
    let draggedItem = null;
    let questions = [];
    let currentIndex = 0;
    let score = 0;
    let ctx = null;

    const pool = [
        { q: t('quiz_pool_q1'), a: [t('quiz_pool_q1_a1'), t('quiz_pool_q1_a2'), t('quiz_pool_q1_a3')], c: 0 },
        { q: t('quiz_pool_q2'), a: [t('quiz_pool_q2_a1'), t('quiz_pool_q2_a2'), t('quiz_pool_q2_a3')], c: 0 },
        { q: t('quiz_pool_q3'), a: [t('quiz_pool_q3_a1'), t('quiz_pool_q3_a2')], c: 0 },
        { q: t('quiz_pool_q4'), a: [t('quiz_pool_q4_a1'), t('quiz_pool_q4_a2'), t('quiz_pool_q4_a3')], c: 0 },
        { q: t('quiz_pool_q5'), a: [t('quiz_pool_q5_a1'), t('quiz_pool_q5_a2')], c: 0 },
        { q: t('quiz_pool_q6'), a: [t('quiz_pool_q6_a1'), t('quiz_pool_q6_a2'), t('quiz_pool_q6_a3')], c: 0 },
        { q: t('quiz_pool_q7'), a: [t('quiz_pool_q7_a1'), t('quiz_pool_q7_a2'), t('quiz_pool_q7_a3')], c: 0 },
        { q: t('quiz_pool_q8'), a: [t('quiz_pool_q8_a1'), t('quiz_pool_q8_a2')], c: 0 },
        { q: t('quiz_pool_q9'), a: [t('quiz_pool_q9_a1'), t('quiz_pool_q9_a2')], c: 0 },
        { q: t('quiz_pool_q10'), a: [t('quiz_pool_q10_a1'), t('quiz_pool_q10_a2')], c: 0 }
    ];

    applyTranslations();
    registerServiceWorker();
    setupCanvas();
    setupSorting();
    setupQuiz();
    restoreProgress();

    function registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('sw.js').catch(() => {
                    // Ignore registration errors in unsupported or local preview contexts.
                });
            });
        }
    }

    function setupCanvas() {
        if (!canvas || !clearButton || !descriptionField) {
            return;
        }

        ctx = canvas.getContext('2d');
        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);

        canvas.addEventListener('mousedown', startDrawing);
        canvas.addEventListener('mousemove', draw);
        window.addEventListener('mouseup', stopDrawing);
        canvas.addEventListener('mouseleave', stopDrawing);
        canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
        canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
        canvas.addEventListener('touchend', stopDrawing);
        canvas.addEventListener('touchcancel', stopDrawing);
        clearButton.addEventListener('click', clearCanvas);
        descriptionField.addEventListener('input', saveCanvasState);
    }

    function resizeCanvas() {
        if (!canvas || !ctx) {
            return;
        }

        const snapshot = hasDrawn ? canvas.toDataURL() : null;
        canvas.width = canvas.parentElement.clientWidth - 16;
        canvas.height = canvas.clientHeight;

        if (snapshot) {
            const image = new Image();
            image.onload = () => {
                ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
            };
            image.src = snapshot;
        }
    }

    function handleTouchStart(event) {
        event.preventDefault();
        startDrawing(event.touches[0]);
    }

    function handleTouchMove(event) {
        event.preventDefault();
        draw(event.touches[0]);
    }

    function startDrawing(event) {
        if (!ctx) {
            return;
        }

        drawing = true;
        const point = getPoint(event);
        lastX = point.x;
        lastY = point.y;
    }

    function draw(event) {
        if (!drawing || !ctx) {
            return;
        }

        const point = getPoint(event);
        ctx.lineWidth = 6;
        ctx.lineCap = 'round';
        ctx.strokeStyle = '#2563eb';
        ctx.beginPath();
        ctx.moveTo(lastX, lastY);
        ctx.lineTo(point.x, point.y);
        ctx.stroke();
        lastX = point.x;
        lastY = point.y;
        hasDrawn = true;
        canvasStatus.textContent = t('canvas_updated');
        saveCanvasState();
    }

    function stopDrawing() {
        drawing = false;
    }

    function getPoint(event) {
        const rect = canvas.getBoundingClientRect();
        return {
            x: event.clientX - rect.left,
            y: event.clientY - rect.top
        };
    }

    function clearCanvas() {
        if (!ctx) {
            return;
        }

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        hasDrawn = false;
        canvasStatus.textContent = t('canvas_cleared');
        saveCanvasState();
    }

    function saveCanvasState() {
        const progress = readProgress();
        progress.canvasDescription = descriptionField.value;
        progress.hasCanvasDrawing = hasDrawn;
        writeProgress(progress);
    }

    function setupSorting() {
        items.forEach((item) => {
            item.addEventListener('click', () => selectItem(item));
            item.addEventListener('dragstart', () => {
                draggedItem = item;
                selectItem(item);
            });
            item.addEventListener('dragend', () => {
                draggedItem = null;
            });
            item.setAttribute('draggable', 'true');
        });

        zones.forEach((zone) => {
            zone.addEventListener('click', () => placeSelectedItem(zone));
            zone.addEventListener('dragover', (event) => event.preventDefault());
            zone.addEventListener('dragenter', () => zone.classList.add('active'));
            zone.addEventListener('dragleave', () => zone.classList.remove('active'));
            zone.addEventListener('drop', (event) => {
                event.preventDefault();
                zone.classList.remove('active');
                if (draggedItem) {
                    placeItemInZone(draggedItem, zone);
                }
            });
        });
    }

    function selectItem(item) {
        if (selectedItem === item) {
            selectedItem = null;
        } else {
            selectedItem = item;
        }

        items.forEach((candidate) => {
            const isSelected = candidate === selectedItem;
            candidate.classList.toggle('is-selected', isSelected);
            candidate.setAttribute('aria-pressed', String(isSelected));
        });

        if (selectedItem) {
            feedback.textContent = t('select_item_instruction', { item: selectedItem.textContent.trim() });
        }
    }

    function placeSelectedItem(zone) {
        if (!selectedItem) {
            feedback.textContent = t('select_item_first');
            return;
        }

        placeItemInZone(selectedItem, zone);
    }

    function placeItemInZone(item, zone) {
        const isCorrect = item.dataset.type === zone.dataset.accept;

        if (isCorrect) {
            zone.classList.add('is-correct');
            zone.appendChild(item);
            item.disabled = true;
            item.classList.remove('is-selected');
            item.setAttribute('aria-pressed', 'false');
            selectedItem = null;
            feedback.textContent = t('drop_correct', { item: item.textContent.trim() });
            saveSortingState();
        } else {
            feedback.textContent = t('drop_wrong', { item: item.textContent.trim() });
        }
    }

    function saveSortingState() {
        const progress = readProgress();
        progress.sorting = {};

        zones.forEach((zone) => {
            const button = zone.querySelector('.draggable-chip');
            if (button) {
                progress.sorting[zone.dataset.accept] = button.dataset.type;
            }
        });

        writeProgress(progress);
    }

    function setupQuiz() {
        if (!startQuizButton || !retryQuizButton) {
            return;
        }

        startQuizButton.addEventListener('click', startQuiz);
        retryQuizButton.addEventListener('click', resetQuiz);
    }

    function startQuiz() {
        quizStart.classList.add('hidden');
        quizPlay.classList.remove('hidden');
        quizDone.classList.add('hidden');
        currentIndex = 0;
        score = 0;
        questions = shuffle(pool).slice(0, 5);
        saveQuizState();
        renderQuestion();
    }

    function renderQuestion() {
        const question = questions[currentIndex];
        quizStep.textContent = t('quiz_question_label', { current: currentIndex + 1, total: questions.length });
        quizProgress.style.width = `${(currentIndex / questions.length) * 100}%`;
        quizQuestion.textContent = question.q;
        quizAnswers.innerHTML = '';

        question.a.forEach((answer, index) => {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'quiz-option bg-slate-50 border-2 border-slate-100 p-5 rounded-[1.5rem] text-left font-bold text-slate-700 hover:bg-blue-50 hover:border-blue-200 active:scale-95';
            button.textContent = answer;
            button.addEventListener('click', () => answerQuestion(index));
            quizAnswers.appendChild(button);
        });

        quizLiveRegion.textContent = t('quiz_live_shown', { step: quizStep.textContent.toLowerCase() });
    }

    function answerQuestion(index) {
        if (index === questions[currentIndex].c) {
            score += 1;
            quizLiveRegion.textContent = t('quiz_correct');
        } else {
            quizLiveRegion.textContent = t('quiz_wrong');
        }

        currentIndex += 1;
        saveQuizState();

        if (currentIndex < questions.length) {
            renderQuestion();
            return;
        }

        finishQuiz();
    }

    function finishQuiz() {
        quizPlay.classList.add('hidden');
        quizDone.classList.remove('hidden');
        quizProgress.style.width = '100%';
        quizScoreText.textContent = t('quiz_score', { score, total: questions.length });
        quizEmoji.textContent = score === 5 ? '\u{1F3C5}' : score >= 3 ? '\u{1F948}' : '\u{1F4D8}';
        quizLiveRegion.textContent = t('quiz_finished', { score, total: questions.length });

        const progress = readProgress();
        progress.quiz = {
            started: true,
            currentIndex,
            score,
            completed: true
        };
        writeProgress(progress);

        const completedLessons = safeReadJson('completedLessons');
        completedLessons[lessonKey] = score >= 3;
        localStorage.setItem('completedLessons', JSON.stringify(completedLessons));
    }

    function resetQuiz() {
        const progress = readProgress();
        delete progress.quiz;
        writeProgress(progress);
        startQuiz();
    }

    function saveQuizState() {
        const progress = readProgress();
        progress.quiz = {
            started: true,
            currentIndex,
            score,
            completed: false
        };
        writeProgress(progress);
    }

    function restoreProgress() {
        const progress = readProgress();

        if (progress.canvasDescription && descriptionField) {
            descriptionField.value = progress.canvasDescription;
        }

        if (progress.sorting) {
            zones.forEach((zone) => {
                const expectedType = progress.sorting[zone.dataset.accept];
                const item = items.find((candidate) => candidate.dataset.type === expectedType);
                if (item) {
                    zone.appendChild(item);
                    item.disabled = true;
                    zone.classList.add('is-correct');
                }
            });
        }

        if (progress.quiz && progress.quiz.started) {
            currentIndex = progress.quiz.currentIndex || 0;
            score = progress.quiz.score || 0;
            questions = shuffle(pool).slice(0, 5);

            if (progress.quiz.completed) {
                finishQuiz();
            } else {
                quizStart.classList.add('hidden');
                quizPlay.classList.remove('hidden');
                renderQuestion();
            }
        }
    }

    function shuffle(source) {
        const copy = [...source];

        for (let i = copy.length - 1; i > 0; i -= 1) {
            const j = Math.floor(Math.random() * (i + 1));
            const temp = copy[i];
            copy[i] = copy[j];
            copy[j] = temp;
        }

        return copy;
    }

    function readProgress() {
        return safeReadJson(`${lessonKey}:progress`);
    }

    function writeProgress(value) {
        localStorage.setItem(`${lessonKey}:progress`, JSON.stringify(value));
    }

    function safeReadJson(key) {
        try {
            return JSON.parse(localStorage.getItem(key) || '{}');
        } catch {
            return {};
        }
    }
})();
