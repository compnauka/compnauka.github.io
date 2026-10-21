window.ComponentRegistry = window.ComponentRegistry || {};

window.ComponentRegistry.storyboard = function mountStoryboard(container, config = {}, ctx = {}) {
  const frames = config.frames || [];
  let index = 0;
  const media = config.media || {};
  const videoId = LessonUI.youtubeId(media.youtube);
  let videoOpen = false;

  function videoMarkup() {
    if (!videoId) return '<p class="video-soon">Відео ще готується. Зараз можна розглянути картинки.</p>';
    return `<section class="video-intro" aria-label="Відеопояснення">
      <h3>${LessonUI.escape(media.title || config.title)}</h3>
      ${videoOpen ? `<iframe src="https://www.youtube-nocookie.com/embed/${videoId}" title="${LessonUI.escape(media.title || config.title)}" loading="lazy" referrerpolicy="strict-origin-when-cross-origin" allow="encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe>` : `<button class="video-cover" type="button" data-open-video><span class="video-cover-art" aria-hidden="true">${AppIcons.svg('video')}</span><strong>▶ Дивитися пояснення</strong><span>YouTube · відкриється тут</span></button>`}
      <a class="video-external" href="https://www.youtube.com/watch?v=${videoId}" target="_blank" rel="noopener noreferrer">Відкрити на YouTube ↗</a>
    </section>`;
  }

  function render() {
    const frame = frames[index] || {};
    container.innerHTML = `
      <div class="lesson-content stage-box storyboard" data-component="storyboard">
        ${index === 0 && videoId ? videoMarkup() : ''}
        ${index === 0 ? `<p class="lesson-mission">${LessonUI.escape(config.intro || '')}</p>` : ''}
        <div class="stage-heading">
          <div>
            <span class="story-count">Картинка ${index + 1} з ${frames.length}</span>
            <h2>${LessonUI.escape(frame.title || config.title || '')}</h2>
          </div>
          ${ctx.listenButton ? ctx.listenButton(`${index === 0 ? config.intro || '' : ''} ${frame.title || ''}. ${frame.text || ''}`) : ''}
        </div>

        <div class="story-card" aria-live="polite">
          <div class="story-visual lesson-illustration" aria-hidden="true">
            ${window.AppIcons?.svg(frame.icon || 'devices', 'story-svg') || ''}
          </div>
          <div class="story-copy">
            <p>${LessonUI.escape(frame.text || '')}</p>
          </div>
        </div>

        <div class="story-dots" aria-hidden="true">
          ${frames.map((_, i) => `<span class="story-dot ${i === index ? 'active' : ''}"></span>`).join('')}
        </div>

        <div class="stage-actions">
          ${index > 0 ? '<button class="secondary-btn" type="button" data-story-prev>Назад</button>' : ''}
          <button class="primary-btn" type="button" data-story-next>${index === frames.length - 1 ? 'Спробуймо разом' : 'Далі'}</button>
        </div>
        ${index === 0 && !videoId ? videoMarkup() : ''}
      </div>`;

    container.querySelector('[data-open-video]')?.addEventListener('click', () => { videoOpen = true; render(); });
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
