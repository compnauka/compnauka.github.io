window.ComponentRegistry = window.ComponentRegistry || {};
window.ComponentRegistry.passwordGame = (root, config, ctx) => {
  let roundIndex = 0;
  let points = 0;
  const rounds = config.rounds || [];

  function meter(level) {
    const labels = ['слабкий', 'кращий', 'міцний'];
    return `<div class="password-meter" aria-label="Приклад пароля: ${labels[level - 1] || 'рівень'}">${[1,2,3].map(i => `<span class="${i <= level ? 'on' : ''}"></span>`).join('')}</div>`;
  }

  function renderRound() {
    const round = rounds[roundIndex];
    const ruleMode = round.mode === 'rule';
    let tries = 0;
    let locked = false;
    root.innerHTML = `
      <div class="lesson-content stage-box">
        <div class="stage-heading centered-heading">
          <div>
            <span class="eyebrow">${config.instruction || 'ОБЕРИ'}</span>
            <h2>${config.title || 'Який приклад кращий?'}</h2>
            <p>${round.task}</p>
          </div>
          ${ctx.listenButton?.(`${config.title}. ${round.task}`) || ''}
        </div>
        <div class="task-progress">${roundIndex + 1} / ${rounds.length}</div>
        <div class="password-warning"><span aria-hidden="true">${AppIcons.svg('danger')}</span><span><strong>Це лише вигадані приклади.</strong> Ніколи не вводь тут свій справжній пароль.</span></div>
        <div class="password-options" role="group" aria-label="${ruleMode ? 'Варіанти відповіді' : 'Приклади паролів'}">
          ${round.options.map((option, i) => ruleMode
            ? `<button class="password-option rule-mode" type="button" data-index="${i}"><span class="password-rule-copy">${option.text}</span></button>`
            : `<button class="password-option" type="button" data-index="${i}"><code>${option.text}</code>${meter(option.level || 1)}<small>${option.hint || ''}</small></button>`).join('')}
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
          feedback.textContent = option.feedback || 'Так! Це важче вгадати.';
          setTimeout(() => {
            roundIndex++;
            if (roundIndex < rounds.length) renderRound();
            else ctx.onComplete?.({ points, max: rounds.length * 2 });
          }, 900);
        } else {
          button.classList.add('wrong');
          feedback.textContent = option.feedback || 'Це легко вгадати. Спробуй інший.';
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
