window.ComponentRegistry = window.ComponentRegistry || {};

window.ComponentRegistry.sequence = function mountSequence(container, config = {}, ctx = {}) {
  const rounds = config.rounds || [];
  let roundIndex = 0;
  let totalPoints = 0;

  function renderRound() {
    const round = rounds[roundIndex];
    if (!round) {
      ctx.onComplete?.({ points: totalPoints, max: rounds.length * 2 });
      return;
    }
    let chosen = [];
    let checks = 0;

    container.innerHTML = `
      <div class="lesson-content stage-box sequence-stage" data-component="sequence">
        <div class="stage-heading centered-heading">
          <div>
            <span class="eyebrow">${config.instruction || 'ПОСТАВ ПО ПОРЯДКУ'}</span>
            <div class="task-progress" aria-label="Завдання ${roundIndex + 1} з ${rounds.length}">${roundIndex + 1} / ${rounds.length}</div>
            <h2>${round.question}</h2>
            <p>Натискай картки по черзі.</p>
          </div>
          ${ctx.listenButton ? ctx.listenButton(`${round.question}. Натискай картки в правильному порядку.`) : ''}
        </div>
        <div class="sequence-slots" data-slots aria-label="Твоя послідовність"></div>
        <div class="sequence-pool" role="group" aria-label="Картки">
          ${round.items.map(item => `<button class="sequence-item" type="button" data-item="${item.id}"><span aria-hidden="true">${AppIcons.svg(item.icon || 'sequence')}</span><strong>${item.label}</strong></button>`).join('')}
        </div>
        <div class="feedback" data-feedback role="status" aria-live="polite">Обери перший крок.</div>
        <div class="stage-actions">
          ${ctx.allowBack !== false ? '<button class="secondary-btn" type="button" data-prev>Назад</button>' : ''}
          <button class="secondary-btn" type="button" data-reset hidden>Почати спочатку</button>
          <button class="primary-btn" type="button" data-check disabled>Перевірити</button>
          <button class="primary-btn" type="button" data-next hidden>${roundIndex === rounds.length - 1 ? (config.finishLabel || 'Готово') : 'Наступне'}</button>
        </div>
      </div>`;

    const slots = container.querySelector('[data-slots]');
    const feedback = container.querySelector('[data-feedback]');
    const check = container.querySelector('[data-check]');
    const reset = container.querySelector('[data-reset]');
    const next = container.querySelector('[data-next]');
    const poolButtons = [...container.querySelectorAll('[data-item]')];

    function sync() {
      slots.innerHTML = round.correct.map((_, i) => {
        const id = chosen[i];
        const item = round.items.find(x => x.id === id);
        return item
          ? `<button class="sequence-slot filled" type="button" data-remove="${item.id}" aria-label="Крок ${i + 1}: ${item.label}. Натисни, щоб прибрати"><span class="slot-number">${i + 1}</span><span aria-hidden="true">${AppIcons.svg(item.icon || 'sequence')}</span><strong>${item.label}</strong></button>`
          : `<div class="sequence-slot empty" aria-label="Крок ${i + 1} порожній"><span class="slot-number">${i + 1}</span><span>?</span></div>`;
      }).join('');

      poolButtons.forEach(button => {
        const used = chosen.includes(button.dataset.item);
        button.disabled = used;
        button.classList.toggle('used', used);
      });
      reset.hidden = chosen.length === 0;
      check.disabled = chosen.length !== round.correct.length;

      slots.querySelectorAll('[data-remove]').forEach(button => button.addEventListener('click', () => {
        const id = button.dataset.remove;
        chosen = chosen.filter(x => x !== id);
        feedback.textContent = 'Картку повернуто.';
        sync();
      }));
    }

    poolButtons.forEach(button => button.addEventListener('click', () => {
      if (chosen.includes(button.dataset.item) || chosen.length >= round.correct.length) return;
      chosen.push(button.dataset.item);
      feedback.textContent = chosen.length === round.correct.length ? 'Готово. Перевір порядок.' : 'Добре. Обери наступний крок.';
      sync();
    }));

    reset.addEventListener('click', () => {
      chosen = [];
      feedback.textContent = 'Починаємо спочатку.';
      sync();
      poolButtons.find(b => !b.disabled)?.focus({ preventScroll: true });
    });

    check.addEventListener('click', () => {
      checks += 1;
      const correct = round.correct.every((id, i) => chosen[i] === id);
      if (correct) {
        totalPoints += checks === 1 ? 2 : 1;
        feedback.textContent = config.assessment ? 'Готово. Порядок правильний.' : 'Так! Порядок правильний.';
        check.hidden = true;
        reset.hidden = true;
        next.hidden = false;
        poolButtons.forEach(b => b.disabled = true);
        slots.querySelectorAll('button').forEach(b => b.disabled = true);
        next.focus({ preventScroll: true });
      } else {
        feedback.textContent = config.assessment ? 'Порядок не той. Спробуй ще.' : 'Майже. Що було раніше?';
        slots.classList.remove('wrong');
        void slots.offsetWidth;
        slots.classList.add('wrong');
      }
    });

    container.querySelector('[data-prev]')?.addEventListener('click', () => ctx.onBack?.());
    next.addEventListener('click', () => { roundIndex += 1; renderRound(); ctx.focusHeading?.(); });
    ctx.bindListenButtons?.(container);
    sync();
  }

  renderRound();
};
