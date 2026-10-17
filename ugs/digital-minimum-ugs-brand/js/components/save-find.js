window.ComponentRegistry = window.ComponentRegistry || {};

window.ComponentRegistry.saveFind = function mountSaveFind(container, config = {}, ctx = {}) {
  const rounds = config.rounds || [];
  let roundIndex = 0;
  let totalPoints = 0;

  function renderRound() {
    const round = rounds[roundIndex];
    if (!round) {
      ctx.onComplete?.({ points: totalPoints, max: rounds.length * 2 });
      return;
    }

    let phase = 'create';
    let created = null;
    let saved = false;
    let mistakes = 0;

    function finishRound() {
      totalPoints += mistakes === 0 ? 2 : 1;
      phase = 'done';
      render();
    }

    function renderCreate() {
      return `
        <div class="workspace-window" aria-label="Редактор роботи">
          <div class="workspace-toolbar"><span class="workspace-tab active">Редактор</span><span class="workspace-tab">Мої роботи</span></div>
          <div class="workspace-canvas">
            <p class="workspace-task">Створи роботу: <strong>${round.target.label}</strong></p>
            <div class="creation-grid" role="group" aria-label="Що додати до роботи">
              ${round.choices.map(choice => `<button class="creation-choice" type="button" data-create="${choice.id}"><span aria-hidden="true">${AppIcons.svg(choice.icon)}</span><strong>${choice.label}</strong></button>`).join('')}
            </div>
          </div>
        </div>`;
    }

    function renderSave() {
      const auto = round.saveMode === 'auto';
      return `
        <div class="workspace-window" aria-label="Редактор роботи">
          <div class="workspace-toolbar"><span class="workspace-tab active">Редактор</span><button class="workspace-tab" type="button" data-open-gallery>Мої роботи</button></div>
          <div class="workspace-canvas saved-preview">
            <span class="work-preview" aria-hidden="true">${AppIcons.svg(round.target.icon)}</span>
            <h3>${round.target.label}</h3>
            ${auto
              ? `<div class="autosave-note">${AppIcons.svg('cloudsave')}<strong>Збережено</strong></div><p>Програма зберегла роботу сама.</p>`
              : `<p>Робота готова. Що треба зробити, щоб не загубити її?</p><button class="primary-btn" type="button" data-save>${AppIcons.svg('save')}<span>Зберегти</span></button>`}
          </div>
        </div>`;
    }

    function renderGallery() {
      const galleryChoices = [round.target, ...round.choices.filter(c => c.id !== round.target.id).slice(0, 2)];
      return `
        <div class="workspace-window" aria-label="Мої роботи">
          <div class="workspace-toolbar"><span class="workspace-tab">Редактор</span><span class="workspace-tab active">Мої роботи</span></div>
          <div class="workspace-canvas">
            <p class="workspace-task">Знайди роботу: <strong>${round.target.label}</strong></p>
            <div class="gallery-grid" role="group" aria-label="Збережені роботи">
              ${galleryChoices.map(choice => `<button class="gallery-work" type="button" data-find="${choice.id}"><span aria-hidden="true">${AppIcons.svg(choice.icon)}</span><strong>${choice.label}</strong></button>`).join('')}
            </div>
          </div>
        </div>`;
    }

    function renderDone() {
      return `
        <div class="workspace-window success-workspace">
          <div class="workspace-success" aria-hidden="true">${AppIcons.svg('check')}</div>
          <h3>Роботу знайдено!</h3>
          <p>${round.saveMode === 'auto' ? 'Ти знайшов збережену роботу.' : 'Ти зберіг і знайшов роботу.'}</p>
        </div>`;
    }

    function render() {
      container.innerHTML = `
        <div class="lesson-content stage-box save-find-stage" data-component="save-find">
          <div class="stage-heading centered-heading">
            <div>
              <span class="eyebrow">${config.instruction || 'СТВОРИ → ЗБЕРЕЖИ → ЗНАЙДИ'}</span>
              <div class="task-progress" aria-label="Завдання ${roundIndex + 1} з ${rounds.length}">${roundIndex + 1} / ${rounds.length}</div>
              <h2>${config.title || 'Створи й знайди роботу'}</h2>
            </div>
            ${ctx.listenButton ? ctx.listenButton(`Створи ${round.target.label}, збережи й знайди у «Моїх роботах».`) : ''}
          </div>
          ${phase === 'create' ? renderCreate() : phase === 'save' ? renderSave() : phase === 'gallery' ? renderGallery() : renderDone()}
          <div class="feedback" data-feedback role="status" aria-live="polite">${phase === 'create' ? `Обери ${round.target.label}.` : phase === 'save' ? (round.saveMode === 'auto' ? 'Робота вже збережена.' : 'Збережи роботу, а потім відкрий «Мої роботи».') : phase === 'gallery' ? 'Знайди створену роботу.' : 'Готово.'}</div>
          <div class="stage-actions">
            ${ctx.allowBack !== false && roundIndex === 0 && phase === 'create' ? '<button class="secondary-btn" type="button" data-prev>Назад</button>' : ''}
            ${phase === 'done' ? `<button class="primary-btn" type="button" data-next>${roundIndex === rounds.length - 1 ? (config.finishLabel || 'Готово') : 'Наступне'}</button>` : ''}
          </div>
        </div>`;

      const feedback = container.querySelector('[data-feedback]');

      container.querySelectorAll('[data-create]').forEach(button => button.addEventListener('click', () => {
        if (button.dataset.create !== round.target.id) {
          mistakes += 1;
          button.classList.remove('wrong');
          void button.offsetWidth;
          button.classList.add('wrong');
          feedback.textContent = `Потрібна робота «${round.target.label}». Спробуй ще.`;
          return;
        }
        created = round.target.id;
        saved = round.saveMode === 'auto';
        phase = 'save';
        render();
      }));

      container.querySelector('[data-save]')?.addEventListener('click', () => {
        saved = true;
        feedback.textContent = 'Збережено. Тепер відкрий «Мої роботи».';
        const button = container.querySelector('[data-save]');
        if (button) {
          button.disabled = true;
          button.innerHTML = `${AppIcons.svg('check')}<span>Збережено</span>`;
        }
      });

      container.querySelector('[data-open-gallery]')?.addEventListener('click', () => {
        if (!created) return;
        if (!saved) {
          mistakes += 1;
          feedback.textContent = 'Спочатку збережи роботу.';
          return;
        }
        phase = 'gallery';
        render();
      });

      container.querySelectorAll('[data-find]').forEach(button => button.addEventListener('click', () => {
        if (button.dataset.find !== round.target.id) {
          mistakes += 1;
          button.classList.remove('wrong');
          void button.offsetWidth;
          button.classList.add('wrong');
          feedback.textContent = 'Це інша робота. Подивись уважніше.';
          return;
        }
        finishRound();
      }));

      container.querySelector('[data-prev]')?.addEventListener('click', () => ctx.onBack?.());
      container.querySelector('[data-next]')?.addEventListener('click', () => { roundIndex += 1; renderRound(); ctx.focusHeading?.(); });
      ctx.bindListenButtons?.(container);
    }

    render();
  }

  renderRound();
};
