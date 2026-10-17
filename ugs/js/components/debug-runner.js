window.ComponentRegistry = window.ComponentRegistry || {};

window.ComponentRegistry.debugRunner = function mountDebugRunner(container, config = {}, ctx = {}) {
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
    const original = [...round.program];
    let program = [...original];
    let robot = [...round.start];
    let trail = [[...round.start]];
    let selectedIndex = -1;
    let runs = 0;
    let observed = false;
    let running = false;
    let solved = false;

    container.innerHTML = `
      <div class="lesson-content stage-box robot-stage" data-component="debug-runner">
        <div class="stage-heading centered-heading">
          <div>
            <span class="eyebrow">${config.instruction || 'ЗНАЙДИ ПОМИЛКУ'}</span>
            <div class="task-progress" aria-label="Завдання ${roundIndex + 1} з ${rounds.length}">${roundIndex + 1} / ${rounds.length}</div>
            <h2>${round.question || 'Одна команда неправильна'}</h2>
            <p>${round.hint || 'Спочатку запусти. Потім знайди неправильний крок.'}</p>
          </div>
          ${ctx.listenButton ? ctx.listenButton(`${round.question || 'Одна команда неправильна'}. Спочатку запусти алгоритм, потім знайди й виправ неправильний крок.`) : ''}
        </div>
        <div class="robot-board-wrap" data-board></div>
        <div class="program-panel">
          <div class="program-label"><strong>Готові команди</strong><span>Обери крок</span></div>
          <div class="robot-program editable-program" data-program aria-label="Команди Робі"></div>
        </div>
        <div class="debug-replace" data-replace hidden>
          <strong>Заміни вибраний крок:</strong>
          <div class="robot-command-pad" role="group" aria-label="Нова команда">${RobotUI.commandButtons({ disabled: true })}</div>
        </div>
        <div class="program-tools">
          <button class="secondary-btn compact-btn" type="button" data-reset>Повернути початковий</button>
          <button class="primary-btn compact-btn" type="button" data-run>${AppIcons.svg('play')}<span>Запустити</span></button>
        </div>
        <div class="feedback" data-feedback role="status" aria-live="polite">Спочатку запусти й подивись, куди піде Робі.</div>
        <div class="stage-actions">
          ${ctx.allowBack !== false ? '<button class="secondary-btn" type="button" data-prev>Назад</button>' : ''}
          <button class="primary-btn" type="button" data-next hidden>${roundIndex === rounds.length - 1 ? (config.finishLabel || 'Готово') : 'Наступне'}</button>
        </div>
      </div>`;

    const board = container.querySelector('[data-board]');
    const programEl = container.querySelector('[data-program]');
    const replaceBox = container.querySelector('[data-replace]');
    const feedback = container.querySelector('[data-feedback]');
    const run = container.querySelector('[data-run]');
    const reset = container.querySelector('[data-reset]');
    const next = container.querySelector('[data-next]');
    const replacementButtons = [...replaceBox.querySelectorAll('[data-command]')];

    function sync() {
      board.innerHTML = RobotUI.gridHtml({ size, start: round.start, goal: round.goal, obstacles, robot, trail });
      programEl.innerHTML = RobotUI.programHtml(program, { selectedIndex, editable: observed && !solved });
      replaceBox.hidden = !observed || solved;
      replacementButtons.forEach(b => b.disabled = !observed || solved || selectedIndex < 0 || running);
      run.disabled = running || solved;
      reset.disabled = running || solved || program.every((cmd, i) => cmd === original[i]);
      programEl.querySelectorAll('[data-program-index]').forEach(button => button.addEventListener('click', () => {
        if (!observed || solved || running) return;
        selectedIndex = Number(button.dataset.programIndex);
        feedback.textContent = `Обрано крок ${selectedIndex + 1}. Тепер вибери нову команду.`;
        sync();
      }));
    }

    async function execute() {
      if (running || solved) return;
      running = true;
      runs += 1;
      robot = [...round.start];
      trail = [[...round.start]];
      feedback.textContent = observed ? 'Перевіряємо…' : 'Дивимось, де помилка…';
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
      observed = true;
      if (!collision && RobotUI.same(robot, round.goal)) {
        solved = true;
        totalPoints += runs <= 2 ? 2 : 1;
        feedback.textContent = config.assessment ? 'Так! Помилку виправлено.' : 'Так! Ти виправив помилку.';
        next.hidden = false;
        sync();
        next.focus({ preventScroll: true });
      } else {
        feedback.textContent = collision ? 'Робі ще йде не туди. Зміни один крок.' : 'Робі ще не біля зірки. Зміни один крок.';
        robot = [...round.start];
        trail = [[...round.start]];
        selectedIndex = -1;
        sync();
      }
    }

    replacementButtons.forEach(button => button.addEventListener('click', () => {
      if (selectedIndex < 0 || running || solved) return;
      program[selectedIndex] = button.dataset.command;
      feedback.textContent = `Крок ${selectedIndex + 1} змінено. Запусти алгоритм і перевір.`;
      selectedIndex = -1;
      sync();
    }));

    reset.addEventListener('click', () => {
      program = [...original];
      selectedIndex = -1;
      robot = [...round.start];
      trail = [[...round.start]];
      feedback.textContent = 'Початкові команди повернуто.';
      sync();
    });
    run.addEventListener('click', execute);
    container.querySelector('[data-prev]')?.addEventListener('click', () => ctx.onBack?.());
    next.addEventListener('click', () => { roundIndex += 1; renderRound(); ctx.focusHeading?.(); });
    ctx.bindListenButtons?.(container);
    sync();
  }

  renderRound();
};
