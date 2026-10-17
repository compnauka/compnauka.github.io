window.ComponentRegistry = window.ComponentRegistry || {};

window.ComponentRegistry.quizRounds = function mountQuizRounds(container, config = {}, ctx = {}) {
  const rounds = config.rounds || [];
  let index = 0;
  let totalPoints = 0;
  let mistakesThisRound = 0;
  let locked = false;

  function roundPoints() {
    return mistakesThisRound === 0 ? 2 : 1;
  }

  function render() {
    const round = rounds[index];
    if (!round) {
      ctx.onComplete?.({ points: totalPoints, max: rounds.length * 2 });
      return;
    }
    mistakesThisRound = 0;
    locked = false;

    container.innerHTML = `
      <div class="lesson-content stage-box quiz-stage" data-component="quiz-rounds">
        <div class="stage-heading centered-heading">
          <div>
            <span class="eyebrow">${config.instruction || 'ОБЕРИ'}</span>
            <div class="task-progress" aria-label="Завдання ${index + 1} з ${rounds.length}">${index + 1} / ${rounds.length}</div>
            <h2>${round.question}</h2>
          </div>
          ${ctx.listenButton ? ctx.listenButton(round.question) : ''}
        </div>
        <div class="picture-choice-grid" role="group" aria-label="Варіанти відповіді">
          ${round.options.map((option, i) => `
            <button class="picture-choice" type="button" data-option="${i}">
              <span class="picture-choice-icon" aria-hidden="true">${window.AppIcons?.svg(option.icon || 'devices') || ''}</span>
              <span>${option.label}</span>
            </button>`).join('')}
        </div>
        <div class="feedback" data-feedback role="status" aria-live="polite"></div>
        <div class="stage-actions">
          ${ctx.allowBack !== false ? '<button class="secondary-btn" type="button" data-prev>Назад</button>' : ''}
          <button class="primary-btn" type="button" data-next hidden>${index === rounds.length - 1 ? (config.finishLabel || 'Готово') : 'Наступне'}</button>
        </div>
      </div>`;

    const feedback = container.querySelector('[data-feedback]');
    const next = container.querySelector('[data-next]');
    const buttons = [...container.querySelectorAll('[data-option]')];

    buttons.forEach(button => button.addEventListener('click', () => {
      if (locked) return;
      const option = round.options[Number(button.dataset.option)];
      if (option.correct) {
        locked = true;
        totalPoints += roundPoints();
        button.classList.add('correct');
        button.setAttribute('aria-pressed', 'true');
        buttons.forEach(b => b.disabled = true);
        feedback.textContent = config.assessment ? 'Так! Далі.' : 'Так! Підходить.';
        next.hidden = false;
        next.focus({ preventScroll: true });
      } else {
        mistakesThisRound += 1;
        button.classList.remove('wrong');
        void button.offsetWidth;
        button.classList.add('wrong');
        feedback.textContent = config.assessment ? 'Спробуй ще.' : 'Спробуй ще раз.';
      }
    }));

    container.querySelector('[data-prev]')?.addEventListener('click', () => ctx.onBack?.());
    next?.addEventListener('click', () => {
      index += 1;
      render();
      ctx.focusHeading?.();
    });
    ctx.bindListenButtons?.(container);
  }

  render();
};
