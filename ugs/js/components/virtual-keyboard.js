window.ComponentRegistry = window.ComponentRegistry || {};

window.ComponentRegistry.virtualKeyboard = function mountVirtualKeyboard(container, config = {}, ctx = {}) {
  const tasks = config.tasks || [];
  const isAssessment = config.assessment === true;
  let index = 0;
  let totalPoints = 0;
  let currentValue = '';
  let mistakes = 0;
  let finished = false;

  function normalize(value) { return String(value ?? '').replace(/\r/g, ''); }
  function visibleValue(value) { return value || ' '; }

  function taskInstruction(task) {
    if (task.type === 'backspace') return `Є зайва літера. Натисни Backspace, щоб отримати ${task.target}.`;
    if (task.type === 'enter') return `Натисни Enter, щоб продовження почалося з нового рядка.`;
    return `Набери: ${task.target.replace(/\n/g, ' / ')}`;
  }

  function keyboardMarkup(task) {
    const keys = task.keys || [];
    const special = task.special || [];
    return `
      <div class="training-keyboard" role="group" aria-label="Навчальна клавіатура">
        ${keys.map(key => `<button class="key-button" type="button" data-key="${key}" aria-label="Клавіша ${key}">${key}</button>`).join('')}
        ${special.includes('space') ? `<button class="key-button special space" type="button" data-special="space">${AppIcons.svg('spacekey')}<span>Пробіл</span></button>` : ''}
        ${special.includes('backspace') ? `<button class="key-button special" type="button" data-special="backspace">${AppIcons.svg('backspace')}<span>Backspace</span></button>` : ''}
        ${special.includes('enter') ? `<button class="key-button special" type="button" data-special="enter">${AppIcons.svg('enterkey')}<span>Enter</span></button>` : ''}
      </div>`;
  }

  function updateDisplay() {
    const output = container.querySelector('[data-typing-output]');
    if (output) output.textContent = visibleValue(currentValue);
  }

  function completeTask() {
    if (finished) return;
    finished = true;
    totalPoints += mistakes === 0 ? 2 : 1;
    const feedback = container.querySelector('[data-feedback]');
    if (feedback) feedback.textContent = isAssessment ? 'Так! Далі.' : 'Вийшло!';
    const next = container.querySelector('[data-next]');
    if (next) {
      next.hidden = false;
      next.focus({ preventScroll: true });
    }
  }

  function handleCharacter(task, key) {
    if (finished) return;
    if (task.type === 'backspace' || task.type === 'enter') {
      mistakes += 1;
      container.querySelector('[data-feedback]').textContent = task.type === 'backspace' ? 'Тут потрібна клавіша Backspace.' : 'Тут потрібна клавіша Enter.';
      return;
    }
    const expected = normalize(task.target).charAt(currentValue.length);
    if (key === expected) {
      currentValue += key;
      updateDisplay();
      if (currentValue === normalize(task.target)) completeTask();
    } else {
      mistakes += 1;
      container.querySelector('[data-feedback]').textContent = 'Подивись на зразок і спробуй іншу клавішу.';
    }
  }

  function handleSpecial(task, special) {
    if (finished) return;
    if (special === 'space') {
      const expected = normalize(task.target).charAt(currentValue.length);
      if (expected === ' ') {
        currentValue += ' ';
        updateDisplay();
        if (currentValue === normalize(task.target)) completeTask();
      } else {
        mistakes += 1;
        container.querySelector('[data-feedback]').textContent = 'Пробіл потрібен між словами.';
      }
      return;
    }

    if (special === 'backspace') {
      currentValue = currentValue.slice(0, -1);
      updateDisplay();
      if (currentValue === normalize(task.target)) completeTask();
      else if (task.type !== 'backspace') {
        mistakes += 1;
        container.querySelector('[data-feedback]').textContent = 'Стерто.';
      }
      return;
    }

    if (special === 'enter') {
      if (task.type === 'enter') {
        currentValue = normalize(task.target);
        updateDisplay();
        completeTask();
      } else {
        const expected = normalize(task.target).charAt(currentValue.length);
        if (expected === '\n') {
          currentValue += '\n';
          updateDisplay();
          if (currentValue === normalize(task.target)) completeTask();
        } else {
          mistakes += 1;
          container.querySelector('[data-feedback]').textContent = 'Enter потрібен для нового рядка.';
        }
      }
    }
  }

  function renderOptionalRealKeyboard() {
    container.innerHTML = `
      <div class="lesson-content stage-box keyboard-stage">
        <div class="stage-heading centered-heading">
          <div>
            <span class="eyebrow">ДОДАТКОВО</span>
            <h2>Спробуй клавіатуру пристрою</h2>
            <p>Хочеш? Натисни поле й напиши коротке слово.</p>
          </div>
          ${ctx.listenButton ? ctx.listenButton('Спробуй клавіатуру пристрою.') : ''}
        </div>
        <label class="real-keyboard-card">
          <span>Напиши коротке слово</span>
          <input type="text" inputmode="text" autocomplete="off" maxlength="12" placeholder="Наприклад: КІТ" aria-describedby="realKeyboardHint">
        </label>
        <p class="micro-hint" id="realKeyboardHint">Натисни поле, щоб відкрити клавіатуру.</p>
        <div class="stage-actions">
          <button class="primary-btn" type="button" data-finish-practice>Далі</button>
        </div>
      </div>`;
    container.querySelector('[data-finish-practice]')?.addEventListener('click', () => ctx.onComplete?.({ points: totalPoints, max: tasks.length * 2 }));
    ctx.bindListenButtons?.(container);
  }

  function render() {
    const task = tasks[index];
    if (!task) {
      if (config.optionalRealKeyboard && !isAssessment) {
        renderOptionalRealKeyboard();
      } else {
        ctx.onComplete?.({ points: totalPoints, max: tasks.length * 2 });
      }
      return;
    }

    mistakes = 0;
    finished = false;
    currentValue = normalize(task.start || '');
    const instruction = taskInstruction(task);

    container.innerHTML = `
      <div class="lesson-content stage-box keyboard-stage" data-component="virtual-keyboard">
        <div class="stage-heading centered-heading">
          <div>
            <span class="eyebrow">${config.instruction || 'НАТИСКАЙ КЛАВІШІ'}</span>
            <div class="task-progress" aria-label="Завдання ${index + 1} з ${tasks.length}">${index + 1} / ${tasks.length}</div>
            <h2>${instruction}</h2>
          </div>
          ${ctx.listenButton ? ctx.listenButton(instruction) : ''}
        </div>

        <div class="typing-sample" aria-label="Зразок">
          <span>Зразок</span>
          <strong>${normalize(task.target).replace(/\n/g, '<br>')}</strong>
        </div>

        <div class="typing-output-wrap">
          <span class="typing-label">На екрані</span>
          <pre class="typing-output" data-typing-output aria-live="polite">${visibleValue(currentValue)}</pre>
        </div>

        ${keyboardMarkup(task)}

        <div class="feedback" data-feedback role="status" aria-live="polite"></div>
        <div class="stage-actions">
          ${ctx.allowBack !== false ? '<button class="secondary-btn" type="button" data-prev>Назад</button>' : ''}
          <button class="primary-btn" type="button" data-next hidden>${index === tasks.length - 1 ? 'Готово' : 'Наступне'}</button>
        </div>
      </div>`;

    container.querySelectorAll('[data-key]').forEach(button => button.addEventListener('click', () => handleCharacter(task, button.dataset.key)));
    container.querySelectorAll('[data-special]').forEach(button => button.addEventListener('click', () => handleSpecial(task, button.dataset.special)));
    container.querySelector('[data-prev]')?.addEventListener('click', () => ctx.onBack?.());
    container.querySelector('[data-next]')?.addEventListener('click', () => {
      index += 1;
      render();
      ctx.focusHeading?.();
    });
    ctx.bindListenButtons?.(container);
  }

  render();
};
