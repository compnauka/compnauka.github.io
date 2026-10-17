window.ComponentRegistry = window.ComponentRegistry || {};

window.ComponentRegistry.mediaLab = function mountMediaLab(container, config = {}, ctx = {}) {
  const rounds = config.rounds || [];
  const typeOptions = [
    { id: 'text', label: 'Текст', icon: 'textinfo' },
    { id: 'image', label: 'Зображення', icon: 'photo' },
    { id: 'sound', label: 'Звук', icon: 'speaker' },
    { id: 'video', label: 'Відео', icon: 'video' }
  ];
  let index = 0;
  let totalPoints = 0;
  let mistakes = 0;
  let locked = false;

  function scoreRound() { return mistakes === 0 ? 2 : 1; }

  function playTone(freq = 523) {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ac = new AudioCtx();
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    gain.gain.setValueAtTime(0.0001, ac.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.18, ac.currentTime + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + 0.5);
    osc.connect(gain).connect(ac.destination);
    osc.start();
    osc.stop(ac.currentTime + 0.55);
    setTimeout(() => ac.close().catch(() => {}), 700);
  }

  function stimulusMarkup(stimulus = {}) {
    if (stimulus.kind === 'text') {
      return `<div class="media-stimulus text-stimulus" aria-label="Приклад інформації"><strong>${stimulus.text || 'КІТ'}</strong></div>`;
    }
    if (stimulus.kind === 'image') {
      return `<div class="media-stimulus image-stimulus" aria-label="Приклад інформації"><span aria-hidden="true">${AppIcons.svg(stimulus.icon || 'photo')}</span><small>${stimulus.label || ''}</small></div>`;
    }
    if (stimulus.kind === 'sound') {
      return `<div class="media-stimulus playable-stimulus" aria-label="Приклад інформації">
        <button class="play-sample" type="button" data-play-sound aria-label="Відтворити приклад">${AppIcons.svg('play')}<span>Відтворити</span></button>
        <div class="sound-wave" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></div>
      </div>`;
    }
    return `<div class="media-stimulus playable-stimulus video-stimulus" aria-label="Приклад інформації">
      <button class="play-sample" type="button" data-play-video aria-label="Відтворити приклад">${AppIcons.svg('play')}<span>Відтворити</span></button>
      <div class="video-window" aria-hidden="true"><span class="video-object">${AppIcons.svg(stimulus.icon || 'bus')}</span><span class="video-track"></span></div>
    </div>`;
  }

  function render() {
    const round = rounds[index];
    if (!round) {
      ctx.onComplete?.({ points: totalPoints, max: rounds.length * 2 });
      return;
    }
    mistakes = 0;
    locked = false;

    container.innerHTML = `
      <div class="lesson-content stage-box media-lab-stage" data-component="media-lab">
        <div class="stage-heading centered-heading">
          <div>
            <span class="eyebrow">${config.instruction || 'ОБЕРИ ВИД'}</span>
            <div class="task-progress" aria-label="Завдання ${index + 1} з ${rounds.length}">${index + 1} / ${rounds.length}</div>
            <h2>${config.title || 'Що це?'}</h2>
            <p>Подивись або послухай.</p>
          </div>
        </div>
        ${stimulusMarkup(round.stimulus)}
        <div class="media-type-grid" role="group" aria-label="Види інформації">
          ${typeOptions.map(option => `<button class="media-type-choice" type="button" data-type="${option.id}"><span aria-hidden="true">${AppIcons.svg(option.icon)}</span><strong>${option.label}</strong></button>`).join('')}
        </div>
        <div class="feedback" data-feedback role="status" aria-live="polite"></div>
        <div class="stage-actions">
          ${ctx.allowBack !== false ? '<button class="secondary-btn" type="button" data-prev>Назад</button>' : ''}
          <button class="primary-btn" type="button" data-next hidden>${index === rounds.length - 1 ? (config.finishLabel || 'Готово') : 'Наступне'}</button>
        </div>
      </div>`;

    const feedback = container.querySelector('[data-feedback]');
    const next = container.querySelector('[data-next]');
    const choices = [...container.querySelectorAll('[data-type]')];
    const videoWindow = container.querySelector('.video-window');

    container.querySelector('[data-play-sound]')?.addEventListener('click', () => {
      playTone(round.stimulus?.tone || 523);
      const wave = container.querySelector('.sound-wave');
      wave?.classList.remove('is-playing');
      void wave?.offsetWidth;
      wave?.classList.add('is-playing');
    });

    container.querySelector('[data-play-video]')?.addEventListener('click', () => {
      videoWindow?.classList.remove('is-playing');
      void videoWindow?.offsetWidth;
      videoWindow?.classList.add('is-playing');
      setTimeout(() => videoWindow?.classList.remove('is-playing'), 1800);
    });

    choices.forEach(button => button.addEventListener('click', () => {
      if (locked) return;
      if (button.dataset.type === round.answer) {
        locked = true;
        totalPoints += scoreRound();
        button.classList.add('correct');
        choices.forEach(b => b.disabled = true);
        feedback.textContent = config.assessment ? 'Так! Далі.' : 'Так!';
        next.hidden = false;
        next.focus({ preventScroll: true });
      } else {
        mistakes += 1;
        button.classList.remove('wrong');
        void button.offsetWidth;
        button.classList.add('wrong');
        feedback.textContent = config.assessment ? 'Спробуй інший варіант.' : 'Це текст, зображення, звук чи відео?';
      }
    }));

    container.querySelector('[data-prev]')?.addEventListener('click', () => ctx.onBack?.());
    next?.addEventListener('click', () => { index += 1; render(); ctx.focusHeading?.(); });
  }

  render();
};
