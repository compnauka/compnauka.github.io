window.RobotUI = (() => {
  'use strict';

  const dirs = {
    up:    { dr: -1, dc: 0, symbol: '↑', label: 'Вгору' },
    right: { dr: 0, dc: 1, symbol: '→', label: 'Праворуч' },
    down:  { dr: 1, dc: 0, symbol: '↓', label: 'Вниз' },
    left:  { dr: 0, dc: -1, symbol: '←', label: 'Ліворуч' }
  };

  const key = ([r, c]) => `${r},${c}`;
  const same = (a, b) => a[0] === b[0] && a[1] === b[1];

  function move(position, command, size, obstacles = []) {
    const meta = dirs[command];
    if (!meta) return { position: [...position], valid: false, reason: 'unknown' };
    const next = [position[0] + meta.dr, position[1] + meta.dc];
    if (next[0] < 0 || next[0] >= size || next[1] < 0 || next[1] >= size) {
      return { position: [...position], valid: false, reason: 'edge' };
    }
    const blocked = new Set(obstacles.map(key));
    if (blocked.has(key(next))) return { position: [...position], valid: false, reason: 'obstacle' };
    return { position: next, valid: true, reason: '' };
  }

  function simulate(start, program, size, obstacles = []) {
    let position = [...start];
    const trail = [[...position]];
    for (let i = 0; i < program.length; i += 1) {
      const result = move(position, program[i], size, obstacles);
      if (!result.valid) return { position, trail, collision: result.reason, collisionIndex: i };
      position = result.position;
      trail.push([...position]);
    }
    return { position, trail, collision: '', collisionIndex: -1 };
  }

  function gridHtml({ size = 4, start = [0, 0], goal = [0, 0], obstacles = [], robot = start, trail = [] } = {}) {
    const obstacleSet = new Set(obstacles.map(key));
    const trailSet = new Set(trail.map(key));
    const obstacleText = obstacles.length ? ` Перешкоди: ${obstacles.map(([r,c]) => `рядок ${r + 1}, стовпчик ${c + 1}`).join('; ')}.` : ' Перешкод немає.';
    const summary = `Поле ${size} на ${size}. Робот: рядок ${robot[0] + 1}, стовпчик ${robot[1] + 1}. Ціль: рядок ${goal[0] + 1}, стовпчик ${goal[1] + 1}.${obstacleText}`;
    let cells = '';
    for (let r = 0; r < size; r += 1) {
      for (let c = 0; c < size; c += 1) {
        const pos = [r, c];
        const isRobot = same(pos, robot);
        const isGoal = same(pos, goal);
        const isObstacle = obstacleSet.has(key(pos));
        const isTrail = trailSet.has(key(pos));
        cells += `<div class="robot-cell${isGoal ? ' is-goal' : ''}${isObstacle ? ' is-obstacle' : ''}${isTrail ? ' is-trail' : ''}${isRobot ? ' is-robot' : ''}" aria-hidden="true">
          ${isObstacle ? `<span class="robot-obstacle">${AppIcons.svg('block')}</span>` : ''}
          ${isGoal ? `<span class="robot-goal">${AppIcons.svg('star')}</span>` : ''}
          ${isRobot ? `<span class="robot-token">${AppIcons.svg('robot')}</span>` : ''}
        </div>`;
      }
    }
    return `<div class="robot-grid" style="--robot-grid-size:${size}" role="img" aria-label="${summary}">${cells}</div>`;
  }

  function commandButtons({ selected = '', disabled = false } = {}) {
    return Object.entries(dirs).map(([id, meta]) => `
      <button class="robot-command${selected === id ? ' selected' : ''}" type="button" data-command="${id}" ${disabled ? 'disabled' : ''} aria-pressed="${selected === id}">
        <span class="robot-arrow" aria-hidden="true">${meta.symbol}</span><span>${meta.label}</span>
      </button>`).join('');
  }

  function programHtml(program = [], { selectedIndex = -1, editable = false } = {}) {
    if (!program.length) return '<div class="robot-program-empty">Додай команди</div>';
    return program.map((cmd, index) => {
      const meta = dirs[cmd];
      const body = `<span class="program-index">${index + 1}</span><span class="program-arrow" aria-hidden="true">${meta?.symbol || '?'}</span><span class="sr-only">${meta?.label || 'Команда'}</span>`;
      return editable
        ? `<button class="program-chip${selectedIndex === index ? ' selected' : ''}" type="button" data-program-index="${index}" aria-pressed="${selectedIndex === index}" aria-label="Крок ${index + 1}: ${meta?.label || 'команда'}. Натисни, щоб змінити">${body}</button>`
        : `<span class="program-chip" aria-label="Крок ${index + 1}: ${meta?.label || 'команда'}">${body}</span>`;
    }).join('');
  }

  function prefersReducedMotion() {
    return !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  }

  return { dirs, same, move, simulate, gridHtml, commandButtons, programHtml, prefersReducedMotion };
})();
