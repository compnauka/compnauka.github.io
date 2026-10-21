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
  const continueLink = $('continueLink');
  const startNote = $('startNote');
  const catalog = $('skills');
  const categoryCopy = {
    devices: { title: 'Користуватися пристроями', text: 'Натискати, писати й дбати про себе.' },
    info: { title: 'Працювати з інформацією', text: 'Розрізняти, сортувати, створювати й зберігати роботи.' },
    online: { title: 'Безпечно користуватися інтернетом', text: 'Шукати потрібне й берегти особисте.' },
    algo: { title: 'Складати команди й маршрути', text: 'Допомагати Юджі дістатися цілі та виправляти помилки.' }
  };

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
    if (n % 10 === 1 && n % 100 !== 11) return `${n} урок`;
    if ([2, 3, 4].includes(n % 10) && ![12, 13, 14].includes(n % 100)) return `${n} уроки`;
    return `${n} уроків`;
  }

  function setCategory(categoryId, { scroll = false } = {}) {
    activeCategory = categoryId;
    renderCategoryCards();
    renderSkills();
    syncFilterReset();
    if (scroll) {
      catalog.open = true;
      requestAnimationFrame(() => catalog.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' }));
    }
  }

  function renderCategoryCards() {
    categoryCards.innerHTML = AppData.categories.map(category => `
      <button class="category-card" type="button" data-category="${category.id}" data-theme="${category.id}"
        aria-pressed="${activeCategory === category.id}" aria-controls="skills" aria-label="${categoryCopy[category.id].title}. ${categoryCopy[category.id].text} ${countLabel(category.count)}">
        <span class="category-icon" aria-hidden="true">${AppIcons.svg(category.icon)}</span>
        <span>
          <strong>${categoryCopy[category.id].title}</strong>
          <small>${categoryCopy[category.id].text}</small>
          <span class="category-lesson-count">${countLabel(category.count)} <span aria-hidden="true">→</span></span>
        </span>
      </button>`).join('');

    categoryCards.querySelectorAll('[data-category]').forEach(button => {
      button.addEventListener('click', () => setCategory(button.dataset.category, { scroll: true }));
    });
  }

  function syncFilterReset() {
    const isAll = activeCategory === 'all';
    filterReset.setAttribute('aria-pressed', String(isAll));
    filterReset.textContent = isAll ? 'Усі теми' : 'Показати всі теми';
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
                <span class="skill-action" aria-hidden="true">${status === 'new' ? 'Відкрити' : 'Повторити'} <span class="skill-action-arrow">→</span></span>
                <span class="status-badge ${status}"><span aria-hidden="true">${info.symbol}</span>${info.label}</span>
              </div>
            </div>
          </a>
        </li>`;
    }).join('');

    visibleSkillsPill.textContent = countLabel(items.length);
    $('skillsTitle').textContent = activeCategory === 'all' ? 'Усі 16 уроків' : `${categoryById(activeCategory).label}: ${countLabel(items.length)}`;
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
    $('progress').hidden = fresh === AppData.skills.length;

    progressText.textContent = `${mastered} / ${AppData.skills.length}`;
    progressBar.setAttribute('aria-valuenow', String(mastered));
    progressBar.setAttribute('aria-valuetext', `${mastered} з ${AppData.skills.length} умінь уже виходять`);
    progressFill.style.width = `${percent}%`;
    progressMeta.innerHTML = `
      <span>✓ ${mastered} вмію</span>
      <span>◒ ${almost} майже</span>
      <span>◐ ${training} тренуюсь</span>`;
  }

  function renderContinue() {
    const inProgress = AppData.skills.find(skill => ['training', 'almost'].includes(ProgressStore.get(skill.id)));
    const fresh = AppData.skills.find(skill => ProgressStore.get(skill.id) === 'new');
    const nextSkill = inProgress || fresh || AppData.skills[0];
    const allDone = AppData.skills.every(skill => ProgressStore.get(skill.id) === 'mastered');

    continueLink.href = allDone ? '#skills' : `skill.html?id=${nextSkill.id}`;
    const started = AppData.skills.some(skill => ProgressStore.get(skill.id) !== 'new');
    continueLink.innerHTML = allDone ? 'Повторити уроки <span aria-hidden="true">↻</span>' : `${inProgress ? 'Повернутися до уроку' : started ? 'Наступний урок' : 'Почати навчання'} <span aria-hidden="true">→</span>`;
    startNote.textContent = allDone ? 'Усі 16 умінь уже виходять. Можна повторити будь-який урок.' : !started ? 'Почнемо з уроку про вибір пристрою для потрібної справи.' : `${inProgress ? 'Потренуймося ще' : 'Далі спробуємо'}: «${nextSkill.title}».`;
  }

  document.querySelectorAll('a[href="#skills"]').forEach(link => link.addEventListener('click', () => { catalog.open = true; }));
  continueLink.addEventListener('click', () => { if (continueLink.getAttribute('href') === '#skills') catalog.open = true; });
  if (location.hash === '#skills') catalog.open = true;
  document.querySelectorAll('.bottom-nav .nav-icon').forEach((element, index) => {
    element.innerHTML = AppIcons.symbol(['home', 'textinfo', 'adult'][index]);
  });

  window.addEventListener('ugs-progress-reset', () => { renderSkills(); renderProgress(); renderContinue(); });

  filterReset.addEventListener('click', () => setCategory('all'));
  renderCategoryCards();
  renderSkills();
  renderProgress();
  renderContinue();
  syncFilterReset();


  if ('serviceWorker' in navigator && (location.protocol === 'https:' || ['localhost','127.0.0.1'].includes(location.hostname))) {
    addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}));
  }
})();
