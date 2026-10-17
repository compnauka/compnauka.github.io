window.ComponentRegistry = window.ComponentRegistry || {};
window.ComponentRegistry.safetyScenarios = (root, config, ctx) => {
  let roundIndex = 0;
  let points = 0;
  const rounds = config.rounds || [];

  function renderRound() {
    const round = rounds[roundIndex];
    let tries = 0;
    let locked = false;

    root.innerHTML = `
      <div class="lesson-content stage-box">
        <div class="stage-heading centered-heading">
          <div>
            <span class="eyebrow">${config.instruction || 'ЩО ЗРОБИШ?'}</span>
            <h2>${config.title || 'Безпечна дія'}</h2>
            <p>${round.prompt || 'Обери безпечну дію.'}</p>
          </div>
          ${ctx.listenButton?.(`${config.title}. ${round.scene}. ${round.prompt || ''}`) || ''}
        </div>
        <div class="task-progress">${roundIndex + 1} / ${rounds.length}</div>
        <article class="scenario-card" data-tone="${round.tone || 'online'}">
          <div class="scenario-art" aria-hidden="true">${AppIcons.svg(round.icon || 'message')}</div>
          <div class="scenario-copy">
            ${round.where ? `<span class="scenario-place">${round.where}</span>` : ''}
            <strong>${round.scene}</strong>
          </div>
        </article>
        <div class="scenario-options" role="group" aria-label="Варіанти дій">
          ${round.options.map((option, i) => `<button class="scenario-option" type="button" data-index="${i}"><span aria-hidden="true">${AppIcons.svg(option.icon || 'check')}</span><span>${option.text}</span></button>`).join('')}
        </div>
        <p class="activity-feedback" data-feedback aria-live="polite"></p>
        <div class="stage-actions">${ctx.allowBack ? '<button class="secondary-btn" type="button" data-step-back>Назад</button>' : ''}</div>
      </div>`;

    const feedback = root.querySelector('[data-feedback]');
    root.querySelectorAll('[data-index]').forEach(button => {
      button.addEventListener('click', () => {
        if (locked) return;
        tries++;
        const option = round.options[Number(button.dataset.index)];
        if (option.correct) {
          locked = true;
          button.classList.add('correct');
          points += tries === 1 ? 2 : 1;
          feedback.textContent = option.feedback || round.success || 'Так, це безпечна дія.';
          setTimeout(() => {
            roundIndex++;
            if (roundIndex < rounds.length) renderRound();
            else ctx.onComplete?.({ points, max: rounds.length * 2 });
          }, 900);
        } else {
          button.classList.add('wrong');
          feedback.textContent = option.feedback || 'Спробуй іншу дію.';
          setTimeout(() => button.classList.remove('wrong'), 320);
        }
      });
    });
    root.querySelector('[data-step-back]')?.addEventListener('click', ctx.onBack);
    ctx.bindListenButtons?.(root);
  }

  if (!rounds.length) return ctx.onComplete?.({ points: 0, max: 0 });
  renderRound();
};
