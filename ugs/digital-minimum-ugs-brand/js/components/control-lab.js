window.ComponentRegistry = window.ComponentRegistry || {};

window.ComponentRegistry.controlLab = function mountControlLab(container, config = {}, ctx = {}) {
  const isAssessment = config.assessment === true;
  const mode = config.mode || 'lab';
  const tasks = mode === 'tap'
    ? [{ type: 'tap', target: 'mouse', question: 'Натисни картку з мишею.', options: ['mouse', 'tablet', 'headphones'] }]
    : isAssessment
      ? [
          { type: 'tap', target: 'tablet', question: 'Натисни картку з планшетом.', options: ['camera', 'tablet', 'printer'] },
          { type: 'move', item: 'photo', question: 'Перемісти картку в рамку.' },
          { type: 'scroll', target: 'camera', question: 'Прокрути список і натисни картку з камерою.', items: ['headphones','printer','tablet','mouse','camera'] },
          { type: 'choice', question: 'Що краще зробити після довгої роботи за екраном?', options: [
            { icon:'break', label:'Зробити коротку перерву', correct:true },
            { icon:'tablet', label:'Продовжити без паузи' }
          ]}
        ]
      : [
          { type: 'tap', target: 'mouse', question: 'Натисни картку з мишею.', options: ['mouse', 'tablet', 'headphones'] },
          { type: 'move', item: 'photo', question: 'Перемісти картку в рамку.' },
          { type: 'scroll', target: 'printer', question: 'Прокрути список і натисни картку з принтером.', items: ['camera','tablet','headphones','mouse','printer'] },
          { type: 'choice', question: 'Який варіант безпечніший?', options: [
            { icon:'posture', label:'Сиджу зручно й не притискаю обличчя до екрана', correct:true },
            { icon:'phone', label:'Тримаю екран зовсім близько до очей' }
          ]}
        ];

  let index = 0;
  let totalPoints = 0;
  let mistakes = 0;
  let finished = false;

  const iconLabels = {
    mouse: 'миша', tablet: 'планшет', headphones: 'навушники', camera: 'камера', printer: 'принтер', photo: 'картка'
  };

  function scoreAndContinue() {
    totalPoints += mistakes === 0 ? 2 : 1;
    finished = true;
    const feedback = container.querySelector('[data-feedback]');
    if (feedback) feedback.textContent = isAssessment ? 'Так! Далі.' : 'Чудово!';
    const next = container.querySelector('[data-next]');
    if (next) {
      next.hidden = false;
      next.focus({ preventScroll: true });
    }
  }

  function renderTap(task) {
    return `
      <div class="control-choice-row" role="group" aria-label="Вибір картки">
        ${task.options.map(icon => `
          <button class="control-card" type="button" data-tap-icon="${icon}">
            <span class="control-card-icon" aria-hidden="true">${AppIcons.svg(icon)}</span>
            <span>${iconLabels[icon] || icon}</span>
          </button>`).join('')}
      </div>`;
  }

  function renderMove(task) {
    return `
      <div class="move-lab" data-move-lab>
        <div class="move-source">
          <button class="move-object" type="button" data-move-object aria-pressed="false">
            <span aria-hidden="true">${AppIcons.svg(task.item || 'photo')}</span>
            <span>Картка</span>
          </button>
          <p class="micro-hint">Перетягни або обери картку й рамку.</p>
        </div>
        <button class="drop-target" type="button" data-drop-target>
          <span class="drop-target-icon" aria-hidden="true">${AppIcons.svg('devices')}</span>
          <span>Рамка</span>
        </button>
      </div>`;
  }

  function renderScroll(task) {
    return `
      <div class="scroll-lab" tabindex="0" aria-label="Прокручуваний список. Прокрути вниз, щоб знайти потрібну картку.">
        ${task.items.map((icon, i) => icon === task.target
          ? `<button class="scroll-find-card target" type="button" data-scroll-target="${icon}"><span aria-hidden="true">${AppIcons.svg(icon)}</span><span>${iconLabels[icon]}</span></button>`
          : `<button class="scroll-find-card" type="button" data-scroll-decoy="${icon}"><span aria-hidden="true">${AppIcons.svg(icon)}</span><span>${iconLabels[icon]}</span></button>`
        ).join('')}
      </div>
      <p class="micro-hint">Прокручуй пальцем, колесом миші або стрілками.</p>`;
  }

  function renderChoice(task) {
    return `
      <div class="safety-choice-grid" role="group" aria-label="Варіанти відповіді">
        ${task.options.map((option, i) => `
          <button class="safety-choice" type="button" data-choice="${i}">
            <span class="safety-choice-icon" aria-hidden="true">${AppIcons.svg(option.icon)}</span>
            <span>${option.label}</span>
          </button>`).join('')}
      </div>`;
  }

  function bindMove() {
    const object = container.querySelector('[data-move-object]');
    const target = container.querySelector('[data-drop-target]');
    if (!object || !target) return;

    let selected = false;
    let pointerActive = false;
    let moved = false;
    let startX = 0;
    let startY = 0;

    const complete = () => {
      if (finished) return;
      target.classList.add('completed');
      object.classList.add('completed');
      object.disabled = true;
      target.disabled = true;
      object.style.transform = '';
      scoreAndContinue();
    };

    object.addEventListener('click', () => {
      if (moved || finished) { moved = false; return; }
      selected = !selected;
      object.setAttribute('aria-pressed', String(selected));
      object.classList.toggle('selected', selected);
      const feedback = container.querySelector('[data-feedback]');
      if (feedback) feedback.textContent = selected ? 'Картку обрано. Тепер натисни рамку.' : 'Картку не обрано.';
    });

    target.addEventListener('click', () => {
      if (finished) return;
      if (selected) complete();
      else {
        mistakes += 1;
        const feedback = container.querySelector('[data-feedback]');
        if (feedback) feedback.textContent = 'Спочатку обери картку, а потім рамку.';
      }
    });

    object.addEventListener('pointerdown', (event) => {
      if (finished) return;
      pointerActive = true;
      moved = false;
      startX = event.clientX;
      startY = event.clientY;
      object.setPointerCapture?.(event.pointerId);
    });

    object.addEventListener('pointermove', (event) => {
      if (!pointerActive || finished) return;
      const dx = event.clientX - startX;
      const dy = event.clientY - startY;
      if (Math.abs(dx) + Math.abs(dy) > 8) moved = true;
      if (moved) object.style.transform = `translate(${dx}px, ${dy}px)`;
    });

    object.addEventListener('pointerup', (event) => {
      if (!pointerActive || finished) return;
      pointerActive = false;
      object.releasePointerCapture?.(event.pointerId);
      const rect = target.getBoundingClientRect();
      const inside = event.clientX >= rect.left && event.clientX <= rect.right && event.clientY >= rect.top && event.clientY <= rect.bottom;
      object.style.transform = '';
      if (moved) {
        if (inside) complete();
        else {
          mistakes += 1;
          const feedback = container.querySelector('[data-feedback]');
          if (feedback) feedback.textContent = 'Майже. Перемісти картку в рамку.';
        }
      }
    });
  }

  function bindTask(task) {
    if (task.type === 'tap') {
      container.querySelectorAll('[data-tap-icon]').forEach(button => button.addEventListener('click', () => {
        if (finished) return;
        if (button.dataset.tapIcon === task.target) {
          button.classList.add('correct');
          scoreAndContinue();
        } else {
          mistakes += 1;
          button.classList.remove('wrong'); void button.offsetWidth; button.classList.add('wrong');
          container.querySelector('[data-feedback]').textContent = 'Не ця. Знайди потрібну картку.';
        }
      }));
    }

    if (task.type === 'move') bindMove();

    if (task.type === 'scroll') {
      container.querySelector('[data-scroll-target]')?.addEventListener('click', (event) => {
        if (finished) return;
        event.currentTarget.classList.add('correct');
        scoreAndContinue();
      });
      container.querySelectorAll('[data-scroll-decoy]').forEach(button => button.addEventListener('click', () => {
        if (finished) return;
        mistakes += 1;
        button.classList.remove('wrong'); void button.offsetWidth; button.classList.add('wrong');
        container.querySelector('[data-feedback]').textContent = 'Шукай далі.';
      }));
    }

    if (task.type === 'choice') {
      container.querySelectorAll('[data-choice]').forEach(button => button.addEventListener('click', () => {
        if (finished) return;
        const option = task.options[Number(button.dataset.choice)];
        if (option.correct) {
          button.classList.add('correct');
          scoreAndContinue();
        } else {
          mistakes += 1;
          button.classList.remove('wrong'); void button.offsetWidth; button.classList.add('wrong');
          container.querySelector('[data-feedback]').textContent = 'Спробуй інший варіант.';
        }
      }));
    }
  }

  function render() {
    const task = tasks[index];
    if (!task) {
      ctx.onComplete?.({ points: totalPoints, max: tasks.length * 2 });
      return;
    }
    mistakes = 0;
    finished = false;

    const content = task.type === 'tap' ? renderTap(task)
      : task.type === 'move' ? renderMove(task)
      : task.type === 'scroll' ? renderScroll(task)
      : renderChoice(task);

    container.innerHTML = `
      <div class="lesson-content stage-box control-stage" data-component="control-lab">
        <div class="stage-heading centered-heading">
          <div>
            <span class="eyebrow">${config.instruction || 'СПРОБУЙ'}</span>
            <div class="task-progress" aria-label="Завдання ${index + 1} з ${tasks.length}">${index + 1} / ${tasks.length}</div>
            <h2>${task.question}</h2>
          </div>
          ${ctx.listenButton ? ctx.listenButton(task.question) : ''}
        </div>
        ${content}
        <div class="feedback" data-feedback role="status" aria-live="polite"></div>
        <div class="stage-actions">
          ${ctx.allowBack !== false ? '<button class="secondary-btn" type="button" data-prev>Назад</button>' : ''}
          <button class="primary-btn" type="button" data-next hidden>${index === tasks.length - 1 ? 'Готово' : 'Наступне'}</button>
        </div>
      </div>`;

    bindTask(task);
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
