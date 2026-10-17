window.ComponentRegistry = window.ComponentRegistry || {};

window.ComponentRegistry.repeatRunner = function mountRepeatRunner(container, config = {}, ctx = {}) {
  const rounds = config.rounds || [];
  let roundIndex = 0;
  let totalPoints = 0;

  function renderRound() {
    const round = rounds[roundIndex];
    if (!round) {
      ctx.onComplete?.({ points: totalPoints, max: rounds.length * 2 });
      return;
    }

    const size = round.size || 5;
    const obstacles = round.obstacles || [];
    let direction = '';
    let count = 0;
    let robot = [...round.start];
    let trail = [[...round.start]];
    let checks = 0;
    let running = false;
    let solved = false;

    container.innerHTML = `
      <div class="lesson-content stage-box robot-stage" data-component="repeat-runner">
        <div class="stage-heading centered-heading">
          <div>
            <span class="eyebrow">${config.instruction || 'СКОРОТИ ПОВТОРЕННЯ'}</span>
            <div class="task-progress" aria-label="Завдання ${roundIndex + 1} з ${rounds.length}">${roundIndex + 1} / ${rounds.length}</div>
            <h2>${round.question || 'Скороти однакові стрілки'}</h2>
            <p>${round.hint || 'Обери стрілку й число.'}</p>
          </div>
          ${ctx.listenButton ? ctx.listenButton(`${round.question || 'Скороти однакові стрілки'}. Обери команду та кількість повторів.`) : ''}
        </div>
        <div class="expanded-repeat" aria-label="Довгий запис">
          <span class="expanded-label">Було:</span>
          <div class="expanded-program">${Array.from({ length: round.repeatCount }, () => `<span class="program-chip"><span class="program-arrow" aria-hidden="true">${RobotUI.dirs[round.direction].symbol}</span><span class="sr-only">${RobotUI.dirs[round.direction].label}</span></span>`).join('')}</div>
        </div>
        <div class="robot-board-wrap" data-board></div>
        <div class="repeat-builder">
          <div>
            <strong>1. Команда</strong>
            <div class="robot-command-pad" role="group" aria-label="Стрілка для повтору">${RobotUI.commandButtons()}</div>
          </div>
          <div>
            <strong>2. Скільки разів?</strong>
            <div class="repeat-counts" role="group" aria-label="Кількість повторів">
              ${[2,3,4,5].map(n => `<button class="repeat-count" type="button" data-count="${n}" aria-pressed="false">${n}</button>`).join('')}
            </div>
          </div>
        </div>
        <div class="repeat-block" data-block aria-live="polite"><span>Повтори</span><strong>?</strong><span>разів</span><b>?</b></div>
        <div class="program-tools">
          <button class="primary-btn compact-btn" type="button" data-run disabled>${AppIcons.svg('play')}<span>Запустити</span></button>
        </div>
        <div class="feedback" data-feedback role="status" aria-live="polite">Спочатку обери команду і кількість повторів.</div>
        <div class="stage-actions">
          ${ctx.allowBack !== false ? '<button class="secondary-btn" type="button" data-prev>Назад</button>' : ''}
          <button class="primary-btn" type="button" data-next hidden>${roundIndex === rounds.length - 1 ? (config.finishLabel || 'Готово') : 'Наступне'}</button>
        </div>
      </div>`;

    const board = container.querySelector('[data-board]');
    const block = container.querySelector('[data-block]');
    const feedback = container.querySelector('[data-feedback]');
    const run = container.querySelector('[data-run]');
    const next = container.querySelector('[data-next]');
    const commandButtons = [...container.querySelectorAll('[data-command]')];
    const countButtons = [...container.querySelectorAll('[data-count]')];

    function sync() {
      board.innerHTML = RobotUI.gridHtml({ size, start: round.start, goal: round.goal, obstacles, robot, trail });
      commandButtons.forEach(b => {
        const active = b.dataset.command === direction;
        b.classList.toggle('selected', active);
        b.setAttribute('aria-pressed', String(active));
        b.disabled = running || solved;
      });
      countButtons.forEach(b => {
        const active = Number(b.dataset.count) === count;
        b.classList.toggle('selected', active);
        b.setAttribute('aria-pressed', String(active));
        b.disabled = running || solved;
      });
      const dirMeta = RobotUI.dirs[direction];
      block.innerHTML = `<span>Повтори</span><strong>${count || '?'}</strong><span>разів</span><b aria-label="${dirMeta?.label || 'команда не обрана'}">${dirMeta?.symbol || '?'}</b>`;
      run.disabled = running || solved || !direction || !count;
    }

    async function execute() {
      if (running || solved || !direction || !count) return;
      running = true;
      checks += 1;
      robot = [...round.start];
      trail = [[...round.start]];
      feedback.textContent = 'Виконуємо блок повторення…';
      sync();
      const program = Array.from({ length: count }, () => direction);
      const delay = RobotUI.prefersReducedMotion() ? 0 : 240;
      let collision = '';
      for (const command of program) {
        const result = RobotUI.move(robot, command, size, obstacles);
        if (!result.valid) { collision = result.reason; break; }
        robot = result.position;
        trail.push([...robot]);
        sync();
        if (delay) await new Promise(resolve => setTimeout(resolve, delay));
      }
      running = false;
      if (!collision && RobotUI.same(robot, round.goal) && direction === round.direction && count === round.repeatCount) {
        solved = true;
        totalPoints += checks === 1 ? 2 : 1;
        feedback.textContent = config.assessment ? 'Так! Повтор правильний.' : `Так! Тепер коротше.`;
        next.hidden = false;
        sync();
        next.focus({ preventScroll: true });
      } else {
        feedback.textContent = collision ? 'Робі йде не туди. Перевір стрілку й число.' : 'Робі не біля зірки. Перевір стрілку й число.';
        robot = [...round.start];
        trail = [[...round.start]];
        sync();
      }
    }

    commandButtons.forEach(button => button.addEventListener('click', () => { if (!running && !solved) { direction = button.dataset.command; feedback.textContent = count ? 'Блок готовий. Можеш запустити.' : 'Стрілку обрано. Тепер обери число.'; sync(); } }));
    countButtons.forEach(button => button.addEventListener('click', () => { if (!running && !solved) { count = Number(button.dataset.count); feedback.textContent = direction ? 'Блок готовий. Можеш запустити.' : 'Число обрано. Тепер обери стрілку.'; sync(); } }));
    run.addEventListener('click', execute);
    container.querySelector('[data-prev]')?.addEventListener('click', () => ctx.onBack?.());
    next.addEventListener('click', () => { roundIndex += 1; renderRound(); ctx.focusHeading?.(); });
    ctx.bindListenButtons?.(container);
    sync();
  }

  renderRound();
};
