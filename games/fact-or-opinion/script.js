(() => {
  'use strict';

  const CONFIG = {
    totalQuestions: 10,
    factsPerRound: 5,
    opinionsPerRound: 5,
    maxSameTypeInRow: 2,
  };

  const TYPE_LABELS = {
    fact: 'Факт',
    opinion: 'Думка',
  };

  const state = {
    queue: [],
    currentIndex: 0,
    score: 0,
  };

  const elements = {};

  document.addEventListener('DOMContentLoaded', init);

  function init() {
    cacheDom();
    bindEvents();
    validateDataOrDisableGame();
  }

  function cacheDom() {
    elements.screens = {
      start: document.getElementById('start-screen'),
      game: document.getElementById('game-screen'),
      feedback: document.getElementById('feedback-screen'),
      end: document.getElementById('end-screen'),
    };

    elements.buttons = {
      start: document.getElementById('start-btn'),
      fact: document.getElementById('btn-fact'),
      opinion: document.getElementById('btn-opinion'),
      next: document.getElementById('next-btn'),
      restart: document.getElementById('restart-btn'),
    };

    elements.progressText = document.getElementById('progress-text');
    elements.scoreText = document.getElementById('score-text');
    elements.progressFill = document.getElementById('progress-fill');
    elements.statementCard = document.querySelector('.statement-card');
    elements.statementText = document.getElementById('statement-text');
    elements.feedbackMark = document.getElementById('feedback-mark');
    elements.feedbackTitle = document.getElementById('feedback-title');
    elements.feedbackType = document.getElementById('feedback-type');
    elements.feedbackStatement = document.getElementById('feedback-statement');
    elements.feedbackExplanation = document.getElementById('feedback-explanation');
    elements.feedbackSource = document.getElementById('feedback-source');
    elements.finalScore = document.getElementById('final-score');
    elements.endMessage = document.getElementById('end-message');
  }

  function bindEvents() {
    elements.buttons.start.addEventListener('click', startGame);
    elements.buttons.restart.addEventListener('click', startGame);
    elements.buttons.fact.addEventListener('click', () => handleAnswer('fact'));
    elements.buttons.opinion.addEventListener('click', () => handleAnswer('opinion'));
    elements.buttons.next.addEventListener('click', goToNextStep);
  }

  function validateDataOrDisableGame() {
    const facts = getItemsByType('fact');
    const opinions = getItemsByType('opinion');
    const hasEnoughData = facts.length >= CONFIG.factsPerRound && opinions.length >= CONFIG.opinionsPerRound;

    if (!hasEnoughData) {
      elements.buttons.start.disabled = true;
      elements.buttons.start.textContent = 'Недостатньо тверджень';
      console.error(
        `Для гри потрібно щонайменше ${CONFIG.factsPerRound} фактів і ${CONFIG.opinionsPerRound} думок. ` +
        `Зараз: фактів — ${facts.length}, думок — ${opinions.length}.`
      );
    }
  }

  function getItemsByType(type) {
    const source = type === 'fact' ? window.FACTS_DATA : window.OPINIONS_DATA;

    if (!Array.isArray(source)) {
      console.error(`Файл з даними для типу "${type}" не завантажився або має неправильний формат.`);
      return [];
    }

    return source
      .map((item, index) => normalizeItem(item, type, index))
      .filter(Boolean);
  }

  function normalizeItem(item, type, index) {
    if (!item || typeof item !== 'object') {
      console.warn(`Пропущено запис №${index + 1}: очікувався обʼєкт.`);
      return null;
    }

    const text = String(item.text || '').trim();
    const explanation = String(item.explanation || '').trim();

    if (!text || !explanation) {
      console.warn(`Пропущено запис №${index + 1}: потрібні поля text та explanation.`);
      return null;
    }

    const normalized = {
      id: String(item.id || `${type}-${index + 1}`).trim(),
      text,
      explanation,
      type,
    };

    if (type === 'fact') {
      normalized.sourceTitle = String(item.sourceTitle || 'Джерело').trim();
      normalized.sourceUrl = getSafeUrl(item.sourceUrl);
    }

    return normalized;
  }

  function getSafeUrl(value) {
    const raw = String(value || '').trim();
    if (!raw) return '';

    try {
      const url = new URL(raw);
      return ['http:', 'https:'].includes(url.protocol) ? url.href : '';
    } catch (error) {
      console.warn('Некоректне посилання на джерело:', raw);
      return '';
    }
  }

  function startGame() {
    const facts = shuffle(getItemsByType('fact')).slice(0, CONFIG.factsPerRound);
    const opinions = shuffle(getItemsByType('opinion')).slice(0, CONFIG.opinionsPerRound);

    state.queue = buildBalancedQueue(facts, opinions);
    state.currentIndex = 0;
    state.score = 0;

    updateScore();
    showQuestion();
    showScreen('game');
  }

  function buildBalancedQueue(facts, opinions) {
    const pools = {
      fact: shuffle(facts),
      opinion: shuffle(opinions),
    };
    const queue = [];

    while (pools.fact.length > 0 || pools.opinion.length > 0) {
      const nextType = chooseNextType(queue, pools);
      queue.push(pools[nextType].pop());
    }

    return queue;
  }

  function chooseNextType(queue, pools) {
    const availableTypes = ['fact', 'opinion'].filter(type => pools[type].length > 0);
    if (availableTypes.length === 1) return availableTypes[0];

    const lastTypes = queue.slice(-CONFIG.maxSameTypeInRow).map(item => item.type);
    const lastTypesAreSame =
      lastTypes.length === CONFIG.maxSameTypeInRow &&
      lastTypes.every(type => type === lastTypes[0]);

    if (lastTypesAreSame) {
      const forcedType = availableTypes.find(type => type !== lastTypes[0]);
      if (forcedType) return forcedType;
    }

    // Додатковий захист від «пачок»: якщо одного типу залишилося значно більше,
    // віддаємо йому пріоритет, але все одно не дозволяємо довгі серії однакових відповідей.
    const [firstType, secondType] = availableTypes;
    const firstCount = pools[firstType].length;
    const secondCount = pools[secondType].length;

    if (firstCount > secondCount + 1) return firstType;
    if (secondCount > firstCount + 1) return secondType;

    return availableTypes[Math.floor(Math.random() * availableTypes.length)];
  }

  function showQuestion() {
    const currentItem = getCurrentItem();
    if (!currentItem) return;

    setAnswerButtonsDisabled(false);
    elements.statementText.textContent = currentItem.text;
    elements.progressText.textContent = `Питання ${state.currentIndex + 1} з ${CONFIG.totalQuestions}`;
    elements.progressFill.style.width = `${((state.currentIndex + 1) / CONFIG.totalQuestions) * 100}%`;

    restartStatementAnimation();
  }

  function restartStatementAnimation() {
    elements.statementCard.classList.remove('is-changing');
    // Reflow потрібен, щоб браузер повторно запустив CSS-анімацію для нового твердження.
    void elements.statementCard.offsetWidth;
    elements.statementCard.classList.add('is-changing');
  }

  function handleAnswer(selectedType) {
    const currentItem = getCurrentItem();
    if (!currentItem) return;

    setAnswerButtonsDisabled(true);

    const isCorrect = selectedType === currentItem.type;
    if (isCorrect) state.score += 1;

    updateScore();
    showFeedback(currentItem, selectedType, isCorrect);
  }

  function showFeedback(item, selectedType, isCorrect) {
    showScreen('feedback');

    elements.feedbackMark.className = `feedback-mark ${isCorrect ? 'feedback-mark--correct' : 'feedback-mark--wrong'}`;
    elements.feedbackMark.textContent = isCorrect ? '✓' : '!';

    elements.feedbackTitle.className = isCorrect ? 'feedback-title--correct' : 'feedback-title--wrong';
    elements.feedbackTitle.textContent = isCorrect ? 'Правильно!' : 'Є помилка';

    elements.feedbackType.textContent = getFeedbackTypeText(item, selectedType, isCorrect);
    elements.feedbackStatement.textContent = `«${item.text}»`;
    elements.feedbackExplanation.textContent = item.explanation;

    renderSource(item);

    elements.buttons.next.textContent = isLastQuestion() ? 'Показати результат' : 'Далі';
    elements.buttons.next.focus();
  }

  function getFeedbackTypeText(item, selectedType, isCorrect) {
    if (isCorrect) {
      return `Це справді ${TYPE_LABELS[item.type].toLowerCase()}.`;
    }

    return `Ти обрав/обрала: ${TYPE_LABELS[selectedType].toLowerCase()}. Правильна відповідь: ${TYPE_LABELS[item.type].toLowerCase()}.`;
  }

  function renderSource(item) {
    elements.feedbackSource.replaceChildren();

    if (item.type !== 'fact') return;

    const prefix = document.createTextNode('Можна перевірити: ');
    elements.feedbackSource.append(prefix);

    if (!item.sourceUrl) {
      elements.feedbackSource.append(document.createTextNode(item.sourceTitle));
      return;
    }

    const link = document.createElement('a');
    link.href = item.sourceUrl;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.textContent = item.sourceTitle;
    elements.feedbackSource.append(link);
  }

  function goToNextStep() {
    state.currentIndex += 1;

    if (state.currentIndex >= CONFIG.totalQuestions) {
      showEndScreen();
      return;
    }

    showQuestion();
    showScreen('game');
  }

  function showEndScreen() {
    showScreen('end');
    elements.finalScore.textContent = `${state.score} з ${CONFIG.totalQuestions}`;
    elements.endMessage.textContent = getEndMessage(state.score);
    elements.buttons.restart.focus();
  }

  function getEndMessage(score) {
    if (score === CONFIG.totalQuestions) {
      return 'Відмінно! Ти дуже уважно відрізняєш перевірені факти від особистих думок.';
    }

    if (score >= 7) {
      return 'Гарний результат! Ти добре розпізнаєш факти, але іноді варто ще уважніше шукати ознаки думки.';
    }

    if (score >= 4) {
      return 'Непогано. Спробуй ще раз і звертай увагу на слова «найкращий», «смачніший», «завжди» та на прикмети.';
    }

    return 'Потрібне тренування. Памʼятай: факт можна перевірити, а думка часто показує смак, оцінку або вірування.';
  }

  function updateScore() {
    elements.scoreText.textContent = `Рахунок: ${state.score}`;
  }

  function showScreen(screenName) {
    Object.entries(elements.screens).forEach(([name, screen]) => {
      screen.classList.toggle('screen--active', name === screenName);
    });
  }

  function setAnswerButtonsDisabled(isDisabled) {
    elements.buttons.fact.disabled = isDisabled;
    elements.buttons.opinion.disabled = isDisabled;
  }

  function getCurrentItem() {
    return state.queue[state.currentIndex] || null;
  }

  function isLastQuestion() {
    return state.currentIndex === CONFIG.totalQuestions - 1;
  }

  function shuffle(items) {
    const copy = [...items];

    for (let i = copy.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }

    return copy;
  }
})();
