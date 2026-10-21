window.ComponentRegistry = window.ComponentRegistry || {};

window.ComponentRegistry.sort = function mountSort(container, config = {}, ctx = {}) {
  const helpId = `sortHelp-${window.ugsSortId = (window.ugsSortId || 0) + 1}`;
  const rounds = config.rounds || [];
  let roundIndex = 0;
  let totalPoints = 0;

  function renderRound() {
    const round = rounds[roundIndex];
    if (!round) {
      const max = rounds.reduce((sum, r) => sum + (r.items?.length || 0) * 2, 0);
      ctx.onComplete?.({ points: totalPoints, max });
      return;
    }

    let selectedId = null;
    const placed = new Set();
    const itemMistakes = new Map();

    container.innerHTML = `
      <div class="lesson-content stage-box sort-stage" data-component="sort">
        <div class="stage-heading centered-heading">
          <div>
            <span class="eyebrow">${config.instruction || 'РОЗКЛАДИ'}</span>
            <div class="task-progress" aria-label="Завдання ${roundIndex + 1} з ${rounds.length}">${roundIndex + 1} / ${rounds.length}</div>
            <h2>${round.question}</h2>
            <p>Перетягни або обери картку.</p>
          </div>
          ${ctx.listenButton ? ctx.listenButton(`${round.question}. Обери картку, потім групу.`) : ''}
        </div>
        <div class="sort-pool" role="group" aria-label="Картки для сортування">
          ${LessonUI.shuffle(round.items).map(item => `<button class="sort-item" type="button" data-item="${item.id}" aria-pressed="false" aria-describedby="${helpId}"><span aria-hidden="true">${AppIcons.svg(item.icon || 'info')}</span><strong>${item.label}</strong></button>`).join('')}
        </div>
        <div class="sort-bins" role="group" aria-label="Групи">
          ${round.bins.map(bin => `<button class="sort-bin" type="button" data-bin="${bin.id}"><span class="sort-bin-icon" aria-hidden="true">${AppIcons.svg(bin.icon || 'sort')}</span><strong>${bin.label}</strong><span class="sort-bin-count" data-count="${bin.id}">0</span><span class="sort-bin-items" data-bin-items="${bin.id}" aria-hidden="true"></span></button>`).join('')}
        </div>
        <p class="micro-hint" id="${helpId}">Клавіатура: обери картку клавішею Enter, потім перейди до групи й натисни Enter.</p>
        <div class="feedback" data-feedback role="status" aria-live="polite">Обери першу картку.</div>
        <div class="stage-actions">
          ${ctx.allowBack !== false ? '<button class="secondary-btn" type="button" data-prev>Назад</button>' : ''}
          <button class="primary-btn" type="button" data-next hidden>${roundIndex === rounds.length - 1 ? (config.finishLabel || 'Готово') : 'Наступне'}</button>
        </div>
      </div>`;

    const feedback = container.querySelector('[data-feedback]');
    const next = container.querySelector('[data-next]');
    const itemButtons = [...container.querySelectorAll('[data-item]')];
    const binButtons = [...container.querySelectorAll('[data-bin]')];

    function updateSelection() {
      itemButtons.forEach(button => {
        const selected = button.dataset.item === selectedId;
        button.classList.toggle('selected', selected);
        button.setAttribute('aria-pressed', String(selected));
      });
    }

    itemButtons.forEach(button => button.addEventListener('click', () => {
      if (placed.has(button.dataset.item)) return;
      selectedId = button.dataset.item;
      updateSelection();
      const item = round.items.find(i => i.id === selectedId);
      feedback.textContent = `${item.label}: тепер обери групу.`;
    }));

    function place(binButton) {
      if (!selectedId) {
        feedback.textContent = 'Спочатку обери картку.';
        return;
      }
      const item = round.items.find(i => i.id === selectedId);
      if (!item) return;
      if (item.bin !== binButton.dataset.bin) {
        itemMistakes.set(item.id, (itemMistakes.get(item.id) || 0) + 1);
        binButton.classList.remove('wrong');
        void binButton.offsetWidth;
        binButton.classList.add('wrong');
        feedback.textContent = config.assessment ? 'Спробуй іншу групу.' : 'Не сюди. Спробуй іншу групу.';
        return;
      }

      placed.add(item.id);
      totalPoints += itemMistakes.get(item.id) ? 1 : 2;
      const itemButton = container.querySelector(`[data-item="${CSS.escape(item.id)}"]`);
      if (itemButton) {
        itemButton.disabled = true;
        itemButton.classList.add('placed');
      }
      const count = container.querySelector(`[data-count="${CSS.escape(item.bin)}"]`);
      if (count) count.textContent = String(Number(count.textContent || 0) + 1);
      const mini = container.querySelector(`[data-bin-items="${CSS.escape(item.bin)}"]`);
      if (mini) mini.insertAdjacentHTML('beforeend', `<span title="${item.label}">${AppIcons.svg(item.icon || 'info')}</span>`);
      binButton.classList.add('has-item');
      selectedId = null;
      updateSelection();

      if (placed.size === round.items.length) {
        feedback.textContent = config.assessment ? 'Так! Усе на місці.' : 'Чудово! Усе на своїх місцях.';
        next.hidden = false;
        next.focus({ preventScroll: true });
      } else {
        feedback.textContent = 'Добре. Обери наступну картку.';
      }
    }

    binButtons.forEach(button => button.addEventListener('click', () => place(button)));
    itemButtons.forEach(button => {
      let drag = null;
      let suppressClick = false;
      button.addEventListener('click', event => {
        if (suppressClick) { event.stopImmediatePropagation(); suppressClick = false; }
      }, true);
      button.addEventListener('pointerdown', event => {
        if (event.button !== 0 || placed.has(button.dataset.item)) return;
        drag = { id: event.pointerId, x: event.clientX, y: event.clientY, moved: false };
        button.setPointerCapture(event.pointerId);
      });
      button.addEventListener('pointermove', event => {
        if (!drag || drag.id !== event.pointerId) return;
        const dx = event.clientX - drag.x, dy = event.clientY - drag.y;
        if (Math.hypot(dx, dy) > 8) drag.moved = true;
        if (!drag.moved) return;
        button.classList.add('dragging');
        button.style.transform = `translate(${dx}px, ${dy}px)`;
        binButtons.forEach(bin => {
          const r = bin.getBoundingClientRect();
          bin.classList.toggle('drop-active', event.clientX >= r.left && event.clientX <= r.right && event.clientY >= r.top && event.clientY <= r.bottom);
        });
      });
      function endDrag(event, cancelled = false) {
        if (!drag) return;
        suppressClick = drag.moved;
        if (drag.moved && !cancelled) {
          const target = binButtons.find(bin => {
            const r = bin.getBoundingClientRect();
            return event.clientX >= r.left && event.clientX <= r.right && event.clientY >= r.top && event.clientY <= r.bottom;
          });
          selectedId = button.dataset.item;
          updateSelection();
          if (target) place(target);
          else feedback.textContent = 'Перемісти картку в групу або натисни групу.';
        }
        button.style.transform = '';
        button.classList.remove('dragging');
        binButtons.forEach(bin => bin.classList.remove('drop-active'));
        if (button.hasPointerCapture(event.pointerId)) button.releasePointerCapture(event.pointerId);
        drag = null;
      }
      button.addEventListener('pointerup', event => endDrag(event));
      button.addEventListener('pointercancel', event => endDrag(event, true));
    });

    container.querySelector('[data-prev]')?.addEventListener('click', () => ctx.onBack?.());
    next?.addEventListener('click', () => { roundIndex += 1; renderRound(); ctx.focusHeading?.(); });
    ctx.bindListenButtons?.(container);
  }

  renderRound();
};
