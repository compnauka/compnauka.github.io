(() => {
  'use strict';

  const $ = id => document.getElementById(id);
  const grid = $('skillGrid');
  const categoryCards = $('categoryCards');
  const progressText = $('overallProgress');
  const progressBar = $('progressBar');
  const progressFill = $('progressFill');
  const progressMeta = $('progressMeta');
  const filterAnnouncement = $('filterAnnouncement');
  const visibleSkillsPill = $('visibleSkillsPill');
  const filterReset = $('filterReset');
  const continueTitle = $('continueTitle');
  const continueDescription = $('continueDescription');
  const continueIcon = $('continueIcon');
  const continueLink = $('continueLink');
  const audioToggle = $('audioToggle');
  const audioIcon = $('audioIcon');

  let activeCategory = 'all';
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const statusMap = {
    new: { label:'Нове', symbol:'○' },
    training: { label:'Тренуюсь', symbol:'◐' },
    almost: { label:'Майже!', symbol:'◒' },
    mastered: { label:'Вмію', symbol:'✓' }
  };

  function categoryById(id) { return AppData.categories.find(c => c.id === id); }
  function statusInfo(status) { return statusMap[status] || statusMap.new; }
  function countLabel(n) {
    if (n === 1) return '1 завдання';
    if (n >= 2 && n <= 4) return `${n} завдання`;
    return `${n} завдань`;
  }

  function setCategory(categoryId, { scroll = false } = {}) {
    activeCategory = categoryId;
    renderCategoryCards();
    renderSkills();
    syncFilterReset();
    if (scroll) $('skills')?.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' });
  }

  function renderCategoryCards() {
    categoryCards.innerHTML = AppData.categories.map(category => `
      <button class="category-card" type="button" data-category="${category.id}" data-theme="${category.id}"
        aria-pressed="${activeCategory === category.id}" aria-label="${category.shortLabel}: ${category.description}. ${countLabel(category.count)}">
        <span class="category-icon" aria-hidden="true">${AppIcons.svg(category.icon)}</span>
        <span>
          <strong>${category.shortLabel}</strong>
          <small>${category.description}</small>
        </span>
      </button>`).join('');

    categoryCards.querySelectorAll('[data-category]').forEach(button => {
      button.addEventListener('click', () => setCategory(button.dataset.category, { scroll: true }));
    });
  }

  function syncFilterReset() {
    const isAll = activeCategory === 'all';
    filterReset.setAttribute('aria-pressed', String(isAll));
    filterReset.textContent = isAll ? 'Усі' : 'Показати всі';
  }

  function renderSkills() {
    const items = AppData.skills.filter(skill => activeCategory === 'all' || skill.category === activeCategory);
    grid.innerHTML = items.map(skill => {
      const status = ProgressStore.get(skill.id);
      const info = statusInfo(status);
      const category = categoryById(skill.category);
      return `
        <li>
          <a class="skill-card" data-category="${skill.category}" href="skill.html?id=${skill.id}"
             aria-label="${skill.title}. ${info.label}.">
            <div class="skill-art" aria-hidden="true">${AppIcons.svg(skill.icon)}</div>
            <div class="skill-body">
              <span class="skill-number">${String(skill.id).padStart(2, '0')} · ${category.label}</span>
              <h3>${skill.title}</h3>
              <p>${skill.short}</p>
              <div class="skill-footer">
                <span class="skill-action" aria-hidden="true">${status === 'new' ? 'Почати' : 'Продовжити'} <span class="skill-action-arrow">→</span></span>
                <span class="status-badge ${status}"><span aria-hidden="true">${info.symbol}</span>${info.label}</span>
              </div>
            </div>
          </a>
        </li>`;
    }).join('');

    visibleSkillsPill.textContent = countLabel(items.length);
    filterAnnouncement.textContent = activeCategory === 'all'
      ? `Показано ${countLabel(items.length)}.`
      : `Показано ${countLabel(items.length)}: ${categoryById(activeCategory)?.shortLabel}.`;
  }

  function renderProgress() {
    const statuses = AppData.skills.map(skill => ProgressStore.get(skill.id));
    const mastered = statuses.filter(s => s === 'mastered').length;
    const almost = statuses.filter(s => s === 'almost').length;
    const training = statuses.filter(s => s === 'training').length;
    const fresh = statuses.filter(s => s === 'new').length;
    const percent = Math.round((mastered / AppData.skills.length) * 100);

    progressText.textContent = `${mastered} / ${AppData.skills.length}`;
    progressBar.setAttribute('aria-valuenow', String(mastered));
    progressBar.setAttribute('aria-valuetext', `${mastered} з ${AppData.skills.length} завдань завершено`);
    progressFill.style.width = `${percent}%`;
    progressMeta.innerHTML = `
      <span>✓ ${mastered} вмію</span>
      <span>◒ ${almost} майже</span>
      <span>◐ ${training} тренуюсь</span>
      <span>○ ${fresh} нові</span>`;
  }

  function renderContinue() {
    const inProgress = AppData.skills.find(skill => ['training', 'almost'].includes(ProgressStore.get(skill.id)));
    const fresh = AppData.skills.find(skill => ProgressStore.get(skill.id) === 'new');
    const nextSkill = inProgress || fresh || AppData.skills[0];
    const allDone = AppData.skills.every(skill => ProgressStore.get(skill.id) === 'mastered');

    continueTitle.textContent = allDone ? 'Усе пройдено!' : nextSkill.title;
    continueDescription.textContent = allDone ? 'Можеш повторити будь-яке завдання.' : nextSkill.short;
    continueIcon.innerHTML = AppIcons.svg(allDone ? 'repeat' : nextSkill.icon);
    continueLink.href = allDone ? '#skills' : `skill.html?id=${nextSkill.id}`;
    continueLink.innerHTML = allDone ? 'Повторити <span aria-hidden="true">↻</span>' : `${inProgress ? 'Продовжити' : 'Почати'} <span aria-hidden="true">→</span>`;
  }

  function setupAudioPreference() {
    const key = 'digital-minimum-audio-enabled';
    let enabled = true;
    try {
      const stored = localStorage.getItem(key);
      enabled = stored === null ? true : stored === 'true';
    } catch { enabled = true; }

    const sync = () => {
      audioToggle.setAttribute('aria-pressed', String(enabled));
      audioToggle.setAttribute('aria-label', enabled ? 'Озвучення увімкнено. Вимкнути' : 'Озвучення вимкнено. Увімкнути');
      audioIcon.textContent = enabled ? '🔊' : '🔇';
    };

    audioToggle.addEventListener('click', () => {
      enabled = !enabled;
      try { localStorage.setItem(key, String(enabled)); } catch { /* ignore */ }
      sync();
    });
    sync();
  }

  filterReset.addEventListener('click', () => setCategory('all'));
  renderCategoryCards();
  renderSkills();
  renderProgress();
  renderContinue();
  syncFilterReset();
  setupAudioPreference();

  if ('serviceWorker' in navigator && (location.protocol === 'https:' || ['localhost','127.0.0.1'].includes(location.hostname))) {
    addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}));
  }
})();
