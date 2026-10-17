window.ComponentRegistry = window.ComponentRegistry || {};
window.ComponentRegistry.browserSim = (root, config, ctx) => {
  let roundIndex = 0;
  let points = 0;
  let attempts = 0;

  const rounds = config.rounds || [];
  const total = rounds.length;

  function renderRound() {
    const round = rounds[roundIndex];
    let current = round.start || 'home';
    let history = [current];
    let done = false;

    root.innerHTML = `
      <div class="lesson-content stage-box">
        <div class="stage-heading centered-heading">
          <div>
            <span class="eyebrow">${config.instruction || 'СПРОБУЙ'}</span>
            <h2>${config.title || 'Користуйся сторінками'}</h2>
            <p>${round.task}</p>
          </div>
          ${ctx.listenButton?.(`${config.title}. ${round.task}`) || ''}
        </div>
        <div class="task-progress">${roundIndex + 1} / ${total}</div>
        <div class="browser-sim" data-browser>
          <div class="browser-toolbar" aria-label="Панель браузера">
            <button class="browser-back" type="button" data-back aria-label="Назад" disabled>${AppIcons.svg('back')}</button>
            <div class="browser-address" aria-hidden="true"><span>${AppIcons.svg('lock')}</span><span data-address></span></div>
          </div>
          <div class="browser-page" data-page tabindex="-1"></div>
        </div>
        <p class="activity-feedback" data-feedback aria-live="polite"></p>
        <div class="stage-actions">
          ${ctx.allowBack ? '<button class="secondary-btn" type="button" data-step-back>Назад</button>' : ''}
        </div>
      </div>`;

    const pageEl = root.querySelector('[data-page]');
    const addressEl = root.querySelector('[data-address]');
    const backBtn = root.querySelector('[data-back]');
    const feedback = root.querySelector('[data-feedback]');

    function pageData(id) { return round.pages[id]; }

    function showPage(id, { push = false } = {}) {
      if (push && id !== current) {
        history.push(id);
        current = id;
      } else {
        current = id;
      }
      const page = pageData(current);
      addressEl.textContent = page.address || `navchannia.local/${current}`;
      backBtn.disabled = history.length <= 1;
      pageEl.innerHTML = `
        <div class="browser-page-head">
          <span class="browser-page-icon" aria-hidden="true">${AppIcons.svg(page.icon || 'browser')}</span>
          <div><strong>${page.title}</strong>${page.subtitle ? `<small>${page.subtitle}</small>` : ''}</div>
        </div>
        <div class="browser-links">
          ${(page.links || []).map(link => `
            <button type="button" class="browser-link-card" data-link="${link.to}" aria-label="${link.label}">
              <span aria-hidden="true">${AppIcons.svg(link.icon || 'link')}</span>
              <span>${link.label}</span>
              <span class="browser-link-arrow" aria-hidden="true">→</span>
            </button>`).join('') || `<div class="browser-empty"><span aria-hidden="true">${AppIcons.svg(page.icon || 'browser')}</span><p>${page.body || 'Це сторінка сайту.'}</p></div>`}
        </div>`;

      pageEl.querySelectorAll('[data-link]').forEach(button => {
        button.addEventListener('click', () => {
          if (done) return;
          attempts++;
          showPage(button.dataset.link, { push: true });
          checkGoal('link');
        });
      });
      requestAnimationFrame(() => pageEl.focus({ preventScroll: true }));
    }

    function checkGoal(action) {
      const goal = round.goal || {};
      const reachedPage = !goal.page || current === goal.page;
      const usedBack = !goal.requireBack || action === 'back';
      if (reachedPage && usedBack) finish();
      else if (goal.page && current === goal.page && goal.requireBack) {
        feedback.textContent = 'Добре! Тепер повернися кнопкою «Назад».';
      }
    }

    function finish() {
      if (done) return;
      done = true;
      const ideal = round.idealAttempts || 1;
      points += attempts <= ideal ? 2 : 1;
      feedback.textContent = round.success || 'Так! Вийшло.';
      setTimeout(() => {
        roundIndex++;
        if (roundIndex < total) renderRound();
        else ctx.onComplete?.({ points, max: total * 2 });
      }, 650);
    }

    backBtn.addEventListener('click', () => {
      if (done || history.length <= 1) return;
      attempts++;
      history.pop();
      current = history[history.length - 1];
      showPage(current);
      checkGoal('back');
    });

    root.querySelector('[data-step-back]')?.addEventListener('click', ctx.onBack);
    ctx.bindListenButtons?.(root);
    showPage(current);
    checkGoal('load');
  }

  if (!total) return ctx.onComplete?.({ points: 0, max: 0 });
  renderRound();
};
