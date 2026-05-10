export function checkAnswer(btn, isCorrect, quizId, explanation) {
  if (btn.disabled) return;

  const parent = document.getElementById(quizId);
  const feedback = document.getElementById(quizId + '-feedback');
  const buttons = parent.querySelectorAll('button');

  const icon = btn.querySelector('.status-icon');

  if (isCorrect) {
    btn.classList.add('correct');
    icon.textContent = '✅';
    icon.classList.remove('status-icon--hidden');

    const strong = document.createElement('strong');
    strong.textContent = 'Супер! Молодець!';
    const br = document.createElement('br');
    feedback.replaceChildren(strong, br, document.createTextNode(explanation));
    feedback.classList.remove('quiz__feedback--hidden', 'quiz__feedback--wrong');
    feedback.classList.add('quiz__feedback--correct');

    buttons.forEach(b => {
      b.disabled = true;
      if (b !== btn) b.classList.add('quiz-option--dimmed');
    });
  } else {
    btn.classList.add('wrong');
    btn.disabled = true;
    icon.textContent = '❌';
    icon.classList.remove('status-icon--hidden');

    const strong = document.createElement('strong');
    strong.textContent = 'Не зовсім так.';
    const note = document.createElement('span');
    note.style.cssText = 'font-size:0.875rem;font-style:italic;margin-top:0.25rem;display:block';
    note.textContent = 'Спробуй обрати інший варіант!';
    const br = document.createElement('br');
    feedback.replaceChildren(strong, document.createTextNode(' ' + explanation + ' '), br, note);
    feedback.classList.remove('quiz__feedback--hidden', 'quiz__feedback--correct');
    feedback.classList.add('quiz__feedback--wrong');
  }
}

export function buildQuizElement(quizData, onAnswer) {
  const quizId = 'quiz-' + Math.random().toString(36).slice(2);

  const wrapper = document.createElement('div');
  wrapper.className = 'quiz fade-in-up';

  const contentDiv = document.createElement('div');
  contentDiv.className = 'quiz__col';

  const row = document.createElement('div');
  row.className = 'quiz__row';

  // Avatar
  const avatar = document.createElement('div');
  avatar.className = 'msg__avatar msg__avatar--ai';
  avatar.textContent = 'ШІ';

  // Bubble
  const bubble = document.createElement('div');
  bubble.className = 'quiz__bubble';

  // Header
  const header = document.createElement('h3');
  header.className = 'quiz__header';

  const iconSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  iconSvg.setAttribute('class', 'quiz__header-icon');
  iconSvg.setAttribute('viewBox', '0 0 20 20');
  iconSvg.setAttribute('fill', 'currentColor');
  iconSvg.setAttribute('aria-hidden', 'true');
  const svgPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  svgPath.setAttribute('fill-rule', 'evenodd');
  svgPath.setAttribute('d', 'M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z');
  svgPath.setAttribute('clip-rule', 'evenodd');
  iconSvg.appendChild(svgPath);
  header.appendChild(iconSvg);
  header.appendChild(document.createTextNode('Давай перевіримо твої знання:'));

  // Question
  const question = document.createElement('p');
  question.className = 'quiz__question';
  question.textContent = quizData.question;

  // Options
  const optionsContainer = document.createElement('div');
  optionsContainer.id = quizId;
  optionsContainer.className = 'quiz__options';

  quizData.options.forEach((opt, index) => {
    const btn = document.createElement('button');
    btn.className = 'quiz-option quiz-option--btn';
    btn.dataset.optionIndex = index;

    const textSpan = document.createElement('span');
    textSpan.textContent = opt.text;

    const statusIcon = document.createElement('span');
    statusIcon.className = 'status-icon status-icon--hidden';

    btn.appendChild(textSpan);
    btn.appendChild(statusIcon);
    btn.addEventListener('click', function () {
      onAnswer(this, opt.correct, quizId, quizData.explanation);
    });

    optionsContainer.appendChild(btn);
  });

  // Feedback
  const feedback = document.createElement('div');
  feedback.id = quizId + '-feedback';
  feedback.className = 'quiz__feedback quiz__feedback--hidden';

  bubble.appendChild(header);
  bubble.appendChild(question);
  bubble.appendChild(optionsContainer);
  bubble.appendChild(feedback);

  row.appendChild(avatar);
  row.appendChild(bubble);
  contentDiv.appendChild(row);
  wrapper.appendChild(contentDiv);

  return wrapper;
}
