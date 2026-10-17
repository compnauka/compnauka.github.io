window.ComponentRegistry = window.ComponentRegistry || {};

window.ComponentRegistry.commandLab = function mountCommandLab(container, config = {}, ctx = {}) {
  const rounds = config.rounds || [];
  let index = 0;
  let totalPoints = 0;

  function render() {
    const round = rounds[index];
    if (!round) {
      ctx.onComplete?.({ points: totalPoints, max: rounds.length * 2 });
      return;
    }
    let mistakes = 0;
    let locked = false;
    const size = round.size || 3;

    container.innerHTML = `
      <div class="lesson-content stage-box robot-stage" data-component="command-lab">
        <div class="stage-heading centered-heading">
          <div>
            <span class="eyebrow">${config.instruction || 'ДАЙ ОДНУ КОМАНДУ'}</span>
            <div class="task-progress" aria-label="Завдання ${index + 1} з ${rounds.length}">${index + 1} / ${rounds.length}</div>
            <h2>${round.question || 'Яка команда потрібна?'}</h2>
            <p>${round.hint || 'Обери одну стрілку до зірки.'}</p>
          </div>
          ${ctx.listenButton ? ctx.listenButton(`${round.question || 'Яка команда потрібна?'}. ${round.hint || 'Обери один крок до цілі.'}`) : ''}
        </div>
        <div class="robot-board-wrap" data-board>${RobotUI.gridHtml({ size, start: round.start, goal: round.goal, robot: round.start, obstacles: round.obstacles || [] })}</div>
        <div class="robot-command-pad" role="group" aria-label="Команди руху">${RobotUI.commandButtons()}</div>
        <div class="feedback" data-feedback role="status" aria-live="polite">Обери одну команду.</div>
        <div class="stage-actions">
          ${ctx.allowBack !== false ? '<button class="secondary-btn" type="button" data-prev>Назад</button>' : ''}
          <button class="primary-btn" type="button" data-next hidden>${index === rounds.length - 1 ? (config.finishLabel || 'Готово') : 'Наступне'}</button>
        </div>
      </div>`;

    const board = container.querySelector('[data-board]');
    const feedback = container.querySelector('[data-feedback]');
    const next = container.querySelector('[data-next]');
    const buttons = [...container.querySelectorAll('[data-command]')];

    buttons.forEach(button => button.addEventListener('click', () => {
      if (locked) return;
      const command = button.dataset.command;
      const result = RobotUI.move(round.start, command, size, round.obstacles || []);
      if (result.valid && RobotUI.same(result.position, round.goal)) {
        locked = true;
        totalPoints += mistakes === 0 ? 2 : 1;
        board.innerHTML = RobotUI.gridHtml({ size, start: round.start, goal: round.goal, robot: result.position, obstacles: round.obstacles || [], trail: [round.start, result.position] });
        button.classList.add('correct');
        buttons.forEach(b => b.disabled = true);
        feedback.textContent = config.assessment ? 'Так! Робі біля зірки.' : 'Так! Робі біля зірки.';
        next.hidden = false;
        next.focus({ preventScroll: true });
      } else {
        mistakes += 1;
        button.classList.remove('wrong');
        void button.offsetWidth;
        button.classList.add('wrong');
        feedback.textContent = result.valid ? 'Ця команда веде в інший бік. Спробуй ще.' : 'Так робот не може рухатися. Обери інший напрям.';
      }
    }));

    container.querySelector('[data-prev]')?.addEventListener('click', () => ctx.onBack?.());
    next.addEventListener('click', () => { index += 1; render(); ctx.focusHeading?.(); });
    ctx.bindListenButtons?.(container);
  }

  render();
};
