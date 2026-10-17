window.ComponentRegistry = window.ComponentRegistry || {};
window.ComponentRegistry.searchSim = (root, config, ctx) => {
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
            <span class="eyebrow">${config.instruction || 'ЗНАЙДИ'}</span>
            <h2>${config.title || 'Що краще написати?'}</h2>
            <p>${round.task}</p>
          </div>
          ${ctx.listenButton?.(`${config.title}. ${round.task}`) || ''}
        </div>
        <div class="task-progress">${roundIndex + 1} / ${rounds.length}</div>
        <div class="search-sim">
          <div class="search-question-card">
            <span class="search-question-icon" aria-hidden="true">${AppIcons.svg(round.icon || 'search')}</span>
            <strong>${round.question}</strong>
          </div>
          <div class="search-bar-mock" aria-hidden="true">${AppIcons.svg('search')}<span>Що шукаємо?</span></div>
          <div class="search-options" role="group" aria-label="Що можна написати">
            ${round.options.map((option, i) => `<button type="button" class="search-option" data-index="${i}"><span>${AppIcons.svg('search')}</span><span>${option.text}</span></button>`).join('')}
          </div>
          <div class="search-result-preview" data-result hidden></div>
        </div>
        <p class="activity-feedback" data-feedback aria-live="polite"></p>
        <div class="stage-actions">${ctx.allowBack ? '<button class="secondary-btn" type="button" data-step-back>Назад</button>' : ''}</div>
      </div>`;

    const feedback = root.querySelector('[data-feedback]');
    const preview = root.querySelector('[data-result]');
    root.querySelectorAll('[data-index]').forEach(button => {
      button.addEventListener('click', () => {
        if (locked) return;
        tries++;
        const option = round.options[Number(button.dataset.index)];
        if (option.correct) {
          locked = true;
          button.classList.add('correct');
          points += tries === 1 ? 2 : 1;
          feedback.textContent = option.feedback || 'Так! Це точний пошук.';
          preview.hidden = false;
          preview.innerHTML = `<span aria-hidden="true">${AppIcons.svg('check')}</span><div><strong>${round.resultTitle || 'Так буде легше знайти'}</strong><p>${round.resultText || 'Тут є головні слова.'}</p></div>`;
          setTimeout(() => {
            roundIndex++;
            if (roundIndex < rounds.length) renderRound();
            else ctx.onComplete?.({ points, max: rounds.length * 2 });
          }, 850);
        } else {
          button.classList.add('wrong');
          feedback.textContent = option.feedback || 'Спробуй написати точніше.';
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
