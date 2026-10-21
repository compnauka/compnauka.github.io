window.ComponentRegistry = window.ComponentRegistry || {};
window.ComponentRegistry.virtualKeyboard = (root, config = {}, ctx = {}) => {
  const instance = window.ugsKeyboardId = (window.ugsKeyboardId || 0) + 1;
  const tasks = config.tasks || [];
  let index = 0, points = 0;
  const rows = ['1234567890', 'йцукенгшщзхї', 'фівапролджє', 'ячсмитьбюґ'];
  function render() {
    const task = tasks[index];
    if (!task) return ctx.onComplete?.({ points, max: tasks.length * 2 });
    let checks = 0, done = false, upper = true;
    const instruction = task.type === 'backspace' ? 'Прибери зайву літеру.' : task.type === 'enter' ? 'Додай новий рядок і допиши текст.' : 'Введи текст за зразком.';
    root.innerHTML = `<div class="lesson-content stage-box keyboard-stage" data-component="virtual-keyboard">
      <div class="stage-heading centered-heading"><div><span class="eyebrow">${config.instruction || 'ВВОДЬ ТЕКСТ'}</span><div class="task-progress">${index + 1} / ${tasks.length}</div><h2>${instruction}</h2></div>${ctx.listenButton?.(instruction) || ''}</div>
      <div class="typing-sample"><span>Зразок</span><strong data-sample></strong></div>
      <label class="typing-field"><span>Твій текст</span><textarea data-input rows="2" maxlength="80" autocomplete="off" autocapitalize="off" spellcheck="false" aria-describedby="keyboardHint-${instance}"></textarea></label>
      <p id="keyboardHint-${instance}" class="micro-hint">Торкнися поля й пиши. Зайве можна стерти.</p>
      <button class="secondary-btn keyboard-toggle" type="button" data-show-keys aria-expanded="true" aria-controls="lessonKeyboard-${instance}">Сховати клавіші</button>
      <div class="full-keyboard" id="lessonKeyboard-${instance}" role="group" aria-label="Українська клавіатура">
        ${rows.map(row => `<div class="keyboard-row">${[...row].map(key => `<button type="button" class="key-button" data-char="${key}">${key}</button>`).join('')}</div>`).join('')}
        <div class="keyboard-row keyboard-specials"><button type="button" class="key-button" data-shift aria-pressed="true">Великі літери</button><button type="button" class="key-button" data-char="'">Апостроф</button><button type="button" class="key-button" data-char=" ">Пробіл</button><button type="button" class="key-button" data-delete>Стерти</button><button type="button" class="key-button" data-enter>Новий рядок</button></div>
      </div>
      <p class="feedback" data-feedback role="status" aria-live="polite"></p>
      <div class="stage-actions">${ctx.allowBack ? '<button class="secondary-btn" data-back type="button">Назад</button>' : ''}<button class="primary-btn" data-check type="button">Перевірити</button><button class="primary-btn" data-next type="button" hidden>Далі</button></div>
    </div>`;
    const input = root.querySelector('[data-input]');
    const keys = root.querySelector('.full-keyboard');
    const toggle = root.querySelector('[data-show-keys]');
    function showKeys(show) {
      keys.hidden = !show;
      toggle.setAttribute('aria-expanded', String(show));
      toggle.textContent = show ? 'Сховати клавіші' : 'Показати клавіші';
    }
    showKeys(!matchMedia('(pointer: coarse)').matches);
    toggle.addEventListener('click', () => showKeys(keys.hidden));
    input.value = task.start || '';
    root.querySelector('[data-sample]').textContent = task.target;
    function insert(text) {
      if (done) return;
      input.setRangeText(text, input.selectionStart, input.selectionEnd, 'end');
      input.focus({ preventScroll: true });
    }
    function syncCase() {
      root.querySelectorAll('[data-char]').forEach(b => {
        if (/^[а-яіїєґ]$/u.test(b.dataset.char)) b.textContent = upper ? b.dataset.char.toUpperCase() : b.dataset.char;
      });
    }
    root.querySelectorAll('[data-char]').forEach(b => b.addEventListener('click', () => insert(upper ? b.dataset.char.toUpperCase() : b.dataset.char)));
    root.querySelector('[data-enter]').addEventListener('click', () => insert('\n'));
    root.querySelector('[data-delete]').addEventListener('click', () => {
      if (done) return;
      const start = input.selectionStart, end = input.selectionEnd;
      input.setRangeText('', start === end ? Math.max(0, start - 1) : start, end, 'end');
      input.focus({ preventScroll: true });
    });
    root.querySelector('[data-shift]').addEventListener('click', event => {
      upper = !upper;
      event.currentTarget.setAttribute('aria-pressed', String(upper));
      event.currentTarget.textContent = upper ? 'Великі літери' : 'Малі літери';
      syncCase();
    });
    root.querySelector('[data-check]').addEventListener('click', event => {
      if (done) return;
      checks++;
      if (input.value.replace(/\r/g, '') !== task.target) {
        root.querySelector('[data-feedback]').textContent = 'Порівняй зі зразком: перевір літери, пробіли й новий рядок.';
        input.focus({ preventScroll: true });
        return;
      }
      done = true;
      points += checks === 1 ? 2 : 1;
      input.readOnly = true;
      event.currentTarget.hidden = true;
      root.querySelector('[data-feedback]').textContent = 'Вийшло! Текст збігається.';
      root.querySelector('[data-next]').hidden = false;
      root.querySelector('[data-next]').focus({ preventScroll: true });
    });
    root.querySelector('[data-back]')?.addEventListener('click', ctx.onBack);
    root.querySelector('[data-next]').addEventListener('click', () => { index++; render(); ctx.focusHeading?.(); });
    syncCase();
    ctx.bindListenButtons?.(root);
  }
  render();
};
