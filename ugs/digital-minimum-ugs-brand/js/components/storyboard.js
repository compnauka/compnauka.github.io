window.ComponentRegistry = window.ComponentRegistry || {};

window.ComponentRegistry.storyboard = function mountStoryboard(container, config = {}, ctx = {}) {
  const frames = config.frames || [];
  let index = 0;

  function render() {
    const frame = frames[index] || {};
    container.innerHTML = `
      <div class="lesson-content stage-box storyboard" data-component="storyboard">
        <div class="stage-heading">
          <div>
            <span class="eyebrow">${config.kicker || 'Дивись'}</span>
            <h2>${config.title || ''}</h2>
            <p>${config.intro || ''}</p>
          </div>
          ${ctx.listenButton ? ctx.listenButton(`${config.title || ''}. ${config.intro || ''}. ${frame.title || ''}. ${frame.text || ''}`) : ''}
        </div>

        <div class="story-card" aria-live="polite">
          <div class="story-visual lesson-illustration" aria-hidden="true">
            ${window.AppIcons?.svg(frame.icon || 'devices', 'story-svg') || ''}
          </div>
          <div class="story-copy">
            <span class="story-count">${index + 1} / ${frames.length}</span>
            <h3>${frame.title || ''}</h3>
            <p>${frame.text || ''}</p>
            ${frame.cue ? `<div class="cue-pill">${frame.cue}</div>` : ''}
          </div>
        </div>

        <div class="story-dots" aria-hidden="true">
          ${frames.map((_, i) => `<span class="story-dot ${i === index ? 'active' : ''}"></span>`).join('')}
        </div>

        <div class="stage-actions">
          ${index > 0 ? '<button class="secondary-btn" type="button" data-story-prev>Назад</button>' : ''}
          <button class="primary-btn" type="button" data-story-next>${index === frames.length - 1 ? 'Запам’ятай' : 'Далі'}</button>
        </div>
      </div>`;

    container.querySelector('[data-story-prev]')?.addEventListener('click', () => {
      index -= 1;
      render();
      ctx.focusHeading?.();
    });
    container.querySelector('[data-story-next]')?.addEventListener('click', () => {
      if (index < frames.length - 1) {
        index += 1;
        render();
        ctx.focusHeading?.();
      } else {
        ctx.onComplete?.();
      }
    });
    ctx.bindListenButtons?.(container);
  }

  render();
};
