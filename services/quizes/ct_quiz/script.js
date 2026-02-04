// Глобальні змінні стану тесту (передбачається, що NUM_QUESTIONS визначено в questions.js)
let currentGrade = null;
let selectedQuestions = [];
let currentQuestionIndex = 0;
let userAnswers = []; // Зберігає індекс відповіді, або null якщо пропущено
let score = 0;

// --- ЛОГІКА ТЕСТУ ---

/**
 * Перемішує масив.
 * @param {Array} array
 */
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

/**
 * Ініціалізація та відображення кнопок вибору класу.
 */
function setupClassSelection() {
    const classButtonsContainer = document.getElementById('class-buttons');
    classButtonsContainer.innerHTML = ''; // Очистка

    // Оновлена мапа класів/рівнів
    const gradeMap = {
        '2': 'Початковий рівень (2 кл.) 🐣',
        '3': 'Середній рівень (3 кл.) 🦁',
        '4': 'Просунутий рівень (4 кл.) 🚀'
    };

    Object.keys(questionBank).forEach(grade => {
        const button = document.createElement('button');
        button.textContent = gradeMap[grade];
        // Висококонтрастні кнопки рівнів (Refactored to use centralized CSS classes)
        const colorClass = `btn-grade-${grade}`;

        button.className = `grade-button ${colorClass}`;
        button.onclick = () => startQuiz(grade);
        classButtonsContainer.appendChild(button);
    });
}

/**
 * Початок тесту.
 * @param {string} grade - Обраний клас (2, 3, 4).
 */
function startQuiz(grade) {
    currentGrade = grade;
    currentQuestionIndex = 0;
    userAnswers = Array(NUM_QUESTIONS).fill(null); // Ініціалізуємо null для пропущених
    score = 0;

    const availableQuestions = questionBank[grade];
    shuffleArray(availableQuestions);

    // Вибираємо NUM_QUESTIONS (10) випадкових питань
    selectedQuestions = availableQuestions.slice(0, NUM_QUESTIONS);

    // Оновлюємо UI
    document.getElementById('class-selection').classList.add('hidden');
    document.getElementById('results-container').classList.add('hidden');
    document.getElementById('quiz-container').classList.remove('hidden');

    // Відображаємо назву рівня
    const levelMap = {
        '2': 'Початковий',
        '3': 'Середній',
        '4': 'Просунутий'
    };
    document.getElementById('current-grade').textContent = levelMap[grade];

    renderQuestion();
    updateReviewButton();
}

/**
 * Рендеринг поточного питання.
 * @param {number} index - Необов'язковий індекс питання для переходу.
 */
window.renderQuestion = function (index = currentQuestionIndex) {
    // Перевірка на завершення тесту
    if (index >= selectedQuestions.length) {
        // Якщо ми викликали renderQuestion з індексом, який виходить за межі,
        // ми перевіряємо, чи всі питання відповідено, інакше повертаємося до першого пропущеного.
        const firstSkippedIndex = userAnswers.findIndex(answer => answer === null);
        if (firstSkippedIndex !== -1) {
            currentQuestionIndex = firstSkippedIndex;
            displayMessage("Кінець тесту. Повертаємося до пропущеного питання.", "info");
            // Рекурсивно викликаємо renderQuestion з новим індексом
            return renderQuestion(currentQuestionIndex);
        } else {
            showResults();
            return;
        }
    }

    // Оновлення індексу, якщо викликано з модального вікна
    currentQuestionIndex = index;

    const questionData = selectedQuestions[currentQuestionIndex];

    document.getElementById('current-question-index').textContent = currentQuestionIndex + 1;

    // ЗМІНА: Прибираємо концепцію з основного тексту питання (залишаємо лише Q)
    document.getElementById('question-text').textContent = questionData.q;

    const optionsContainer = document.getElementById('options-container');
    optionsContainer.innerHTML = '';

    // Варіанти відповідей завжди беруться з 'options'
    let optionsWithIndex = questionData.options.map((text, index) => ({
        text,
        index
    }));
    shuffleArray(optionsWithIndex);

    optionsWithIndex.forEach(option => {
        const button = document.createElement('button');

        // Використовуємо високу контрастність
        // Видалено p-3, rounded-xl, text-left, text-gray-800 бо це тепер є в .answer-option
        let buttonClasses = 'answer-option w-full text-left';

        button.textContent = option.text;
        button.className = buttonClasses;
        button.setAttribute('data-index', option.index); // Зберігаємо оригінальний індекс
        button.onclick = () => selectAnswer(button, option.index);

        // Позначаємо, якщо відповідь вже обрана
        if (userAnswers[currentQuestionIndex] !== null && userAnswers[currentQuestionIndex] === option.index) {
            button.classList.add('selected');
        }

        optionsContainer.appendChild(button);
    });

    // Встановлюємо стан кнопки "Далі"
    const nextButton = document.getElementById('next-button');
    const hasAnswer = userAnswers[currentQuestionIndex] !== null;
    nextButton.disabled = !hasAnswer;

    // Оновлюємо класи Tailwind для контрастності
    nextButton.classList.toggle('opacity-50', !hasAnswer);
    nextButton.classList.toggle('cursor-not-allowed', !hasAnswer);
    nextButton.classList.toggle('opacity-100', hasAnswer);
    nextButton.classList.toggle('cursor-pointer', hasAnswer);

    const allAnswered = userAnswers.every(answer => answer !== null);

    if (allAnswered) {
        nextButton.textContent = 'Завершити тест! 🏆';
    } else if (currentQuestionIndex === selectedQuestions.length - 1) {
        nextButton.textContent = 'Перейти до пропущених ➡️';
    } else {
        nextButton.textContent = 'Далі 🚀';
    }

    document.getElementById('skip-button').textContent = userAnswers[currentQuestionIndex] === null ? 'Пропустити 🤔' : 'Очистити вибір';

    updateReviewButton();
}

/**
 * Обробка вибору відповіді.
 * @param {HTMLElement} selectedButton - Кнопка, яку натиснув користувач.
 * @param {number} selectedIndex - Індекс обраної відповіді в оригінальному масиві options.
 */
function selectAnswer(selectedButton, selectedIndex) {
    // Очищаємо всі кнопки від класу 'selected'
    document.querySelectorAll('#options-container .answer-option').forEach(btn => {
        btn.classList.remove('selected');
    });

    // Позначаємо обрану кнопку
    selectedButton.classList.add('selected');

    // Зберігаємо відповідь
    userAnswers[currentQuestionIndex] = selectedIndex;

    // Активуємо кнопку "Далі"
    const nextButton = document.getElementById('next-button');
    nextButton.disabled = false;
    nextButton.classList.remove('opacity-50', 'cursor-not-allowed');
    nextButton.classList.add('opacity-100', 'cursor-pointer');

    // Оновлюємо кнопку "Пропустити"
    document.getElementById('skip-button').textContent = 'Очистити вибір';
    updateReviewButton();

    // Оновлюємо текст кнопки "Далі", оскільки це може бути останнє питання
    const allAnswered = userAnswers.every(answer => answer !== null);
    if (allAnswered) {
        nextButton.textContent = 'Завершити тест! 🏆';
    }
}

/**
 * Пропуск або очищення відповіді.
 */
window.skipQuestion = function () {
    if (userAnswers[currentQuestionIndex] !== null) {
        // Очистити вибір
        userAnswers[currentQuestionIndex] = null;
        renderQuestion(currentQuestionIndex); // Перерендерити для зняття виділення
        displayMessage("Вибір очищено. Питання пропущено.", "info");
    } else {
        // Пропустити
        // Якщо відповідь вже null, просто переходимо до наступного питання або до першого пропущеного
        displayMessage("Питання пропущено. Можеш повернутися до нього пізніше.", "info");

        let nextIndex = currentQuestionIndex + 1;

        if (nextIndex >= selectedQuestions.length) {
            // Якщо кінець списку, шукаємо перше пропущене, інакше завершуємо
            const firstSkippedIndex = userAnswers.findIndex(answer => answer === null);
            if (firstSkippedIndex !== -1) {
                currentQuestionIndex = firstSkippedIndex;
                displayMessage("Останнє питання пропущено. Повертаємося до першого пропущеного!", "info");
            } else {
                // Якщо пропущених немає (хоча це неможливо після skip), завершуємо
                showResults();
                return;
            }
        } else {
            currentQuestionIndex = nextIndex;
        }

        renderQuestion();
    }
    updateReviewButton();
}

/**
 * Перехід до наступного питання або завершення тесту.
 * Оновлена логіка: не завершує тест, доки всі питання не будуть відповідені.
 */
window.nextQuestion = function () {
    // 1. Перевірка, чи була обрана відповідь
    if (userAnswers[currentQuestionIndex] === null || userAnswers[currentQuestionIndex] === undefined) {
        displayMessage("Будь ласка, оберіть варіант відповіді, щоб продовжити.", "alert");
        return;
    }

    // 2. Перевіряємо, чи всі питання відповідено.
    const allAnswered = userAnswers.every(answer => answer !== null);

    if (allAnswered) {
        // Усі питання відповідено. Завершуємо тест.
        showResults();
        return;
    }

    // 3. Якщо не всі відповідено, визначаємо наступний крок.

    if (currentQuestionIndex < selectedQuestions.length - 1) {
        // Йдемо до наступного питання послідовно
        currentQuestionIndex++;
        renderQuestion();
    } else {
        // Ми на останньому питанні (але не всі відповідено) - переходимо до першого пропущеного
        let firstSkippedIndex = userAnswers.findIndex(answer => answer === null);

        if (firstSkippedIndex !== -1) {
            // Переходимо до першого пропущеного питання.
            currentQuestionIndex = firstSkippedIndex;
            renderQuestion();
            displayMessage("Ти пройшов увесь тест. Тепер повернемося до пропущених питань!", "info");
        } else {
            // Страхувальний випадок (має бути оброблено allAnswered), але на всяк випадок
            showResults();
        }
    }
    updateReviewButton();
}

/**
 * Оновлення стану та видимості кнопки "Переглянути пропущені питання".
 */
function updateReviewButton() {
    const skippedCount = userAnswers.filter(answer => answer === null).length;
    const reviewButton = document.getElementById('review-button');
    const skippedCountSpan = document.getElementById('skipped-count');

    // Кнопка перегляду відображається, якщо є пропущені питання
    if (skippedCount > 0) {
        reviewButton.style.display = 'block';
        skippedCountSpan.textContent = skippedCount;
    } else {
        reviewButton.style.display = 'none';
    }

    // Оновлюємо список у модальному вікні, якщо воно відкрите
    if (!document.getElementById('review-modal').classList.contains('hidden')) {
        populateReviewModal();
    }
}

/**
 * Відкриття модального вікна для перегляду пропущених питань.
 */
window.openReviewModal = function () {
    populateReviewModal();
    document.getElementById('review-modal').classList.remove('hidden');
}

/**
 * Заповнення списку питань у модальному вікні.
 */
function populateReviewModal() {
    const listContainer = document.getElementById('modal-question-list');
    listContainer.innerHTML = '';

    userAnswers.forEach((answer, index) => {
        const button = document.createElement('button');
        const isSkipped = answer === null;
        const isCurrent = index === currentQuestionIndex;

        button.textContent = index + 1;
        button.className = `p-3 rounded-xl font-bold transition duration-200 transform hover:scale-105 ${isCurrent
            ? 'bg-blue-600 text-white shadow-xl' // Поточне
            : isSkipped
                ? 'bg-yellow-200 text-yellow-800 hover:bg-yellow-300' // Пропущено
                : 'bg-green-200 text-green-800 hover:bg-green-300' // Відповідено
            }`;

        button.onclick = () => {
            closeReviewModal();
            renderQuestion(index);
        };
        listContainer.appendChild(button);
    });
}

/**
 * Закриття модального вікна.
 */
window.closeReviewModal = function () {
    document.getElementById('review-modal').classList.add('hidden');
}

/**
 * Відображає кастомне повідомлення (заміна alert).
 * @param {string} message - Текст повідомлення.
 * @param {string} type - Тип (info, alert).
 */
function displayMessage(message, type = 'info') {
    // Створюємо тимчасовий елемент повідомлення
    let msgDiv = document.createElement('div');
    msgDiv.textContent = message;
    msgDiv.className = `fixed top-4 right-4 p-4 rounded-xl shadow-lg text-white z-50 transition-all duration-300 transform translate-y-0`;

    if (type === 'alert') {
        msgDiv.classList.add('bg-red-700', 'animate-shake');
    } else {
        msgDiv.classList.add('bg-blue-700');
    }

    document.body.appendChild(msgDiv);

    // Видаляємо повідомлення через 3 секунди
    setTimeout(() => {
        msgDiv.classList.add('opacity-0', 'translate-y-[-20px]');
        msgDiv.addEventListener('transitionend', () => msgDiv.remove());
    }, 3000);
}

/**
 * Обчислення та відображення результатів.
 */
function showResults() {
    // 1. Обчислюємо результат
    score = 0;
    userAnswers.forEach((answerIndex, qIndex) => {
        if (answerIndex !== null && answerIndex === selectedQuestions[qIndex].correct) {
            score++;
        }
    });

    // 2. Обчислюємо унікальні концепції для підсумкового блоку
    const uniqueConcepts = [...new Set(selectedQuestions.map(q => q.concept))];
    document.getElementById('concept-list').textContent = uniqueConcepts.join(', ');

    // 3. Оновлюємо UI
    document.getElementById('quiz-container').classList.add('hidden');
    document.getElementById('results-container').classList.remove('hidden');

    document.getElementById('score-display').textContent = `${score}/${NUM_QUESTIONS}`;

    let messageText;
    if (score === NUM_QUESTIONS) {
        messageText = "Ти справжній IT-геній! 🚀";
    } else if (score >= NUM_QUESTIONS * 0.7) {
        messageText = "Дуже добре! Продовжуй вчитися! 🌟";
    } else if (score >= NUM_QUESTIONS * 0.5) {
        messageText = "Непогано! Але є над чим попрацювати. 💪";
    } else {
        messageText = "Треба ще трохи позайматися! 💡";
    }
    document.getElementById('result-message').textContent = messageText;

    // 4. Детальний аналіз
    const detailedResults = document.getElementById('detailed-results');
    detailedResults.innerHTML = '';

    selectedQuestions.forEach((qData, index) => {
        const userAnswerIndex = userAnswers[index];
        const isAnswered = userAnswerIndex !== null;
        const isCorrect = isAnswered && userAnswerIndex === qData.correct;

        const resultItem = document.createElement('div');

        let className = 'border-gray-300';
        let statusText = `<span class="text-gray-500 font-bold">⚠️ Пропущено (не відповів)</span>`;
        let answerText = '';

        if (isCorrect) {
            className = 'result-correct border-green-700';
            statusText = `<span class="text-green-700 font-bold">✅ Правильно!</span>`;
        } else if (isAnswered) {
            className = 'result-incorrect border-red-700';
            statusText = `<span class="text-red-700 font-bold">❌ Помилка!</span>`;

            answerText = `Твоя відповідь: <span class="italic text-red-700">${qData.options[userAnswerIndex]}</span>`;
        }

        resultItem.className = `p-4 rounded-xl border-2 transition-all duration-300 ${className}`;

        resultItem.innerHTML = `
            <p class="font-semibold text-lg mb-2">${index + 1}. ${qData.q}</p>
            <p class="mb-2">${statusText} ${answerText}</p>
            <p class="text-sm font-medium">Правильна відповідь: <span class="text-green-700">${qData.options[qData.correct]}</span></p>
            <p class="text-sm text-gray-700 mt-1">💡 Пояснення: ${qData.explanation}</p>
            <p class="text-xs text-gray-400 mt-2">Концепція: ${qData.concept}</p>
        `;
        detailedResults.appendChild(resultItem);
    });
}

/**
 * Скидання тесту та повернення до вибору класу.
 */
window.resetQuiz = function () {
    document.getElementById('results-container').classList.add('hidden');
    document.getElementById('class-selection').classList.remove('hidden');
    currentGrade = null;
    selectedQuestions = [];
    currentQuestionIndex = 0;
    userAnswers = [];
    score = 0;
    setupClassSelection(); // Переконатися, що кнопки класів знову налаштовані
}

// Запуск ініціалізації при завантаженні сторінки
document.addEventListener('DOMContentLoaded', setupClassSelection);
