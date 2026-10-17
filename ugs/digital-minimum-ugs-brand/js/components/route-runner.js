window.ComponentRegistry = window.ComponentRegistry || {};

window.ComponentRegistry.routeRunner = function mountRouteRunner(container, config = {}, ctx = {}) {
  const rounds = config.rounds || [];
  let roundIndex = 0;
  let totalPoints = 0;

  function renderRound() {
    const round = rounds[roundIndex];
    if (!round) {
      ctx.onComplete?.({ points: totalPoints, max: rounds.length * 2 });
      return;
    }

    const size = round.size || 4;
    const obstacles = round.obstacles || [];
    const maxCommands = round.maxCommands || 8;
    let program = [];
    let robot = [...round.start];
    let trail = [[...round.start]];
    let checks = 0;
    let running = false;
    let solved = false;

    container.innerHTML = `
      <div class="lesson-content stage-box robot-stage" data-component="route-runner">
        <div class="stage-heading centered-heading">
          <div>
            <span class="eyebrow">${config.instruction || 'СКЛАДИ МАРШРУТ'}</span>
            <div class="task-progress" aria-label="Завдання ${roundIndex + 1} з ${rounds.length}">${roundIndex + 1} / ${rounds.length}</div>
            <h2>${round.question || 'Допоможи Робі дістатися зірки'}</h2>
            <p>${round.hint || `Додай стрілки по черзі.`}</p>
          </div>
          ${ctx.listenButton ? ctx.listenButton(`${round.question || 'Допоможи Робі дістатися зірки'}. ${round.hint || 'Додай команди по черзі та запусти.'}`) : ''}
        </div>
        <div class="robot-board-wrap" data-board></div>
        <div class="program-panel">
          <div class="program-label"><strong>Мої команди</strong><span data-counter>0 / ${maxCommands}</span></div>
          <div class="robot-program" data-program aria-live="polite"></div>
        </div>
        <div class="robot-command-pad" role="group" aria-label="Додати команду">${RobotUI.commandButtons()}</div>
        <div class="program-tools">
          <button class="secondary-btn compact-btn" type="button" data-undo disabled>Прибрати останню</button>
          <button class="secondary-btn compact-btn" type="button" data-clear disabled>Очистити</button>
          <button class="primary-btn compact-btn" type="button" data-run disabled>${AppIcons.svg('play')}<span>Запустити</span></button>
        </div>
        <div class="feedback" data-feedback role="status" aria-live="polite">Додай першу команду.</div>
        <div class="stage-actions">
          ${ctx.allowBack !== false ? '<button class="secondary-btn" type="button" data-prev>Назад</button>' : ''}
          <button class="primary-btn" type="button" data-next hidden>${roundIndex === rounds.length - 1 ? (config.finishLabel || 'Готово') : 'Наступне'}</button>
        </div>
      </div>`;

    const board = container.querySelector('[data-board]');
    const programEl = container.querySelector('[data-program]');
    const counter = container.querySelector('[data-counter]');
    const feedback = container.querySelector('[data-feedback]');
    const run = container.querySelector('[data-run]');
    const undo = container.querySelector('[data-undo]');
    const clear = container.querySelector('[data-clear]');
    const next = container.querySelector('[data-next]');
    const commandButtons = [...container.querySelectorAll('[data-command]')];

    function sync() {
      board.innerHTML = RobotUI.gridHtml({ size, start: round.start, goal: round.goal, obstacles, robot, trail });
      programEl.innerHTML = RobotUI.programHtml(program);
      counter.textContent = `${program.length} / ${maxCommands}`;
      undo.disabled = running || solved || program.length === 0;
      clear.disabled = running || solved || program.length === 0;
      run.disabled = running || solved || program.length === 0;
      commandButtons.forEach(b => b.disabled = running || solved || program.length >= maxCommands);
    }

    async function execute() {
      if (!program.length || running || solved) return;
      running = true;
      checks += 1;
      robot = [...round.start];
      trail = [[...round.start]];
      feedback.textContent = 'Робі йде…';
      sync();
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
      if (!collision && RobotUI.same(robot, round.goal)) {
        solved = true;
        totalPoints += checks === 1 ? 2 : 1;
        feedback.textContent = config.assessment ? 'Так! Робі біля зірки.' : 'Супер! Робі дістався зірки.';
        next.hidden = false;
        sync();
        next.focus({ preventScroll: true });
      } else {
        if (collision === 'edge') feedback.textContent = 'Робі вперся в край. Зміни команди.';
        else if (collision === 'obstacle') feedback.textContent = 'На шляху перешкода. Знайди інший маршрут.';
        else feedback.textContent = 'Робі зупинився не біля зірки. Зміни команди й запусти ще раз.';
        robot = [...round.start];
        trail = [[...round.start]];
        sync();
      }
    }

    commandButtons.forEach(button => button.addEventListener('click', () => {
      if (running || solved || program.length >= maxCommands) return;
      program.push(button.dataset.command);
      feedback.textContent = program.length < maxCommands ? 'Команду додано. Можеш додати ще або запустити.' : 'Більше стрілок не можна. Запусти або зміни.';
      sync();
    }));
    undo.addEventListener('click', () => { if (!running && !solved) { program.pop(); feedback.textContent = 'Останню команду прибрано.'; sync(); } });
    clear.addEventListener('click', () => { if (!running && !solved) { program = []; feedback.textContent = 'Команди очищено. Почни знову.'; sync(); } });
    run.addEventListener('click', execute);
    container.querySelector('[data-prev]')?.addEventListener('click', () => ctx.onBack?.());
    next.addEventListener('click', () => { roundIndex += 1; renderRound(); ctx.focusHeading?.(); });
    ctx.bindListenButtons?.(container);
    sync();
  }

  renderRound();
};
