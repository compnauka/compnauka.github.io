window.ComponentRegistry = window.ComponentRegistry || {};

window.ComponentRegistry.memoryCards = function mountMemoryCards(container, config = {}, ctx = {}) {
  const cards = config.cards || [];
  container.innerHTML = `
    <div class="lesson-content stage-box memory-stage" data-component="memory-cards">
      <div class="stage-heading">
        <div>
          <span class="eyebrow">Запам’ятай</span>
          <h2>${config.title || 'Головне'}</h2>
          ${config.description ? `<p>${config.description}</p>` : ''}
        </div>
        ${ctx.listenButton ? ctx.listenButton(cards.map(c => `${c.title}. ${c.text}`).join('. ')) : ''}
      </div>
      <div class="memory-grid">
        ${cards.map(card => `
          <article class="memory-card">
            <div class="memory-icon" aria-hidden="true">${window.AppIcons?.svg(card.icon || 'devices') || ''}</div>
            <h3>${card.title}</h3>
            <p>${card.text}</p>
          </article>`).join('')}
      </div>
      <div class="stage-actions">
        <button class="secondary-btn" type="button" data-prev>Назад</button>
        <button class="primary-btn" type="button" data-next>Спробуй</button>
      </div>
    </div>`;

  container.querySelector('[data-prev]')?.addEventListener('click', () => ctx.onBack?.());
  container.querySelector('[data-next]')?.addEventListener('click', () => ctx.onComplete?.());
  ctx.bindListenButtons?.(container);
};
