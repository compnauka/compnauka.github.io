'use strict';

// ================================================================
// KLAVIО — ui.js
// DOM updates: stats, progress, text display, hands, modal, toast
// ================================================================

// ----------------------------------------------------------------
// Text display
// ----------------------------------------------------------------
function updateTextDisplay() {
  const full = exercises[state.taskNum - 1];
  const done = full.substring(0, state.correctChars);
  const cursor = state.taskString[0] || '';
  const todo   = state.taskString.substring(1, 42);

  document.getElementById('td-done').textContent   = done.slice(-22);
  document.getElementById('td-cursor').textContent = cursor === ' ' ? '␣' : cursor;
  document.getElementById('td-todo').textContent   = todo;
}

// ----------------------------------------------------------------
// Progress bar
// ----------------------------------------------------------------
function updateProgress() {
  const pct = state.totalChars > 0
    ? (state.correctChars / state.totalChars * 100).toFixed(1)
    : 0;
  document.getElementById('progress-fill').style.width = pct + '%';
}

// ----------------------------------------------------------------
// Stats strip
// ----------------------------------------------------------------
function calcWPM() {
  if (!state.timeStart || state.correctChars < 2) return 0;
  const secs = Math.max(1, Math.floor(Date.now() / 1000) - state.timeStart);
  return Math.round(state.correctChars / secs * 60);
}

function updateStats() {
  document.getElementById('wpm-value').textContent    = calcWPM();
  document.getElementById('streak-value').textContent = state.streak;
  document.getElementById('lesson-num').textContent   = state.taskNum;

  const total = state.correctChars + state.incorrectChars;
  if (total > 0) {
    const acc = Math.round(state.correctChars / total * 100);
    document.getElementById('acc-value').textContent = acc + '%';
  } else {
    document.getElementById('acc-value').textContent = '—';
  }
}

// ----------------------------------------------------------------
// Hand finger highlights
// ----------------------------------------------------------------
function clearHandHighlights() {
  document.querySelectorAll('.finger.active').forEach(el => el.classList.remove('active'));
  ['left-finger-name','right-finger-name'].forEach(id => {
    const el = document.getElementById(id);
    if (el) { el.textContent = ''; el.classList.remove('visible'); }
  });
}

function highlightFinger(keyId) {
  clearHandHighlights();
  if (!DIFFICULTIES[state.difficulty].handHint) return;
  const info = FINGER_MAP[keyId];
  if (!info) return;
  const [hand, fingerId, fingerName] = info;
  const fingerEl = document.getElementById(fingerId);
  if (fingerEl) fingerEl.classList.add('active');
  const badge = document.getElementById(hand + '-finger-name');
  if (badge) {
    badge.textContent = fingerName;
    badge.classList.add('visible');
  }
}

// ----------------------------------------------------------------
// Modal
// ----------------------------------------------------------------
function openModal(title, bodyHTML) {
  document.getElementById('modal-header').innerHTML  = title;
  document.getElementById('modal-body').innerHTML    = bodyHTML;
  document.getElementById('modal-overlay').classList.add('open');
  const box = document.getElementById('modal-box');
  box.style.opacity   = '0';
  box.style.transform = 'translate(-50%, -50%) scale(0.88)';
  box.style.display   = 'block';
  requestAnimationFrame(() => {
    box.style.transition = 'opacity 0.22s ease, transform 0.28s cubic-bezier(0.34,1.56,0.64,1)';
    box.style.opacity    = '1';
    box.style.transform  = 'translate(-50%, -50%) scale(1)';
  });
}

function closeModal() {
  document.getElementById('modal-overlay').classList.remove('open');
  const box = document.getElementById('modal-box');
  box.style.opacity   = '0';
  box.style.transform = 'translate(-50%, -50%) scale(0.88)';
  setTimeout(() => { box.style.display = 'none'; }, 250);
}

// ----------------------------------------------------------------
// Lesson select modal
// ----------------------------------------------------------------
function showLessonSelect() {
  const items = lessonNames.map((name, i) => {
    const isCurrent = (i + 1 === state.taskNum);
    return `<li class="${isCurrent ? 'current' : ''}"
               onclick="startTyping(${i + 1}); closeModal();">${name}</li>`;
  }).join('');
  openModal('<i class="fas fa-book"></i> Оберіть вправу',
    `<ul class="lesson-list">${items}</ul>`);
}

// ----------------------------------------------------------------
// Progress modal
// ----------------------------------------------------------------
function showProgress() {
  const secs  = state.timeStart ? Math.floor(Date.now() / 1000) - state.timeStart : 0;
  const mins  = Math.floor(secs / 60);
  const sec   = secs % 60;
  const wpm   = calcWPM();
  const total = state.correctChars + state.incorrectChars;
  const acc   = total > 0 ? Math.round(state.correctChars / total * 100) : 100;

  openModal('<i class="fas fa-chart-bar"></i> Поточний поступ', `
    <table class="stats-table">
      <tr><td><i class="fas fa-clock"></i> Час</td>
          <td><b>${mins}хв ${sec}с</b></td></tr>
      <tr><td><i class="fas fa-keyboard"></i> Символів</td>
          <td><b>${state.correctChars} / ${state.totalChars}</b></td></tr>
      <tr><td><i class="fas fa-tachometer-alt"></i> Швидкість</td>
          <td><b>${wpm} симв/хв</b></td></tr>
      <tr><td><i class="fas fa-bullseye"></i> Точність</td>
          <td><b>${acc}%</b></td></tr>
      <tr><td><i class="fas fa-fire"></i> Серія</td>
          <td><b>${state.streak} (макс: ${state.maxStreak})</b></td></tr>
      <tr><td><i class="fas fa-times-circle"></i> Помилок</td>
          <td><b>${state.incorrectChars}</b></td></tr>
      <tr><td><i class="fas fa-list-ol"></i> Вправа</td>
          <td><b>${state.taskNum} / ${exercises.length}</b></td></tr>
    </table>
  `);
}

// ----------------------------------------------------------------
// About modal
// ----------------------------------------------------------------
function showAbout() {
  openModal('<i class="fas fa-keyboard"></i> Про Клавіо', `
    <div class="about-content">
      <p><b>Клавіо</b> — безкоштовний онлайн-тренажер для навчання сліпого методу
         друку. Вправи охоплюють весь алфавіт від простих комбінацій до зв'язних текстів.</p>
      <h4>Режими складності</h4>
      <div class="diff-list">
        <div><i class="fas fa-seedling" style="color:var(--c-index1)"></i>
             <b>Новачок</b> — підсвічує клавішу та палець</div>
        <div><i class="fas fa-graduation-cap" style="color:var(--c-ring)"></i>
             <b>Учень</b> — лише палець на руці</div>
        <div><i class="fas fa-fire" style="color:var(--c-pinky)"></i>
             <b>Майстер</b> — без підказок</div>
      </div>
      <h4>Кольори пальців</h4>
      <div class="color-legend">
        <span class="cl-pinky">■ Мізинець</span>
        <span class="cl-ring">■ Безіменний</span>
        <span class="cl-middle">■ Середній</span>
        <span class="cl-index">■ Вказівний</span>
        <span class="cl-thumb">■ Великий</span>
      </div>
      <p class="about-credit">Автор: Громко Г.Ю.</p>
    </div>
  `);
}

// ----------------------------------------------------------------
// Lesson complete overlay
// ----------------------------------------------------------------
function showLessonComplete(stats) {
  const iconMap = { trophy:'fa-trophy', star:'fa-star', thumbs:'fa-thumbs-up', dumbbell:'fa-dumbbell' };
  const iconKey = stats.acc >= 98 ? 'trophy' : stats.acc >= 90 ? 'star' : stats.acc >= 75 ? 'thumbs' : 'dumbbell';
  document.getElementById('lc-icon').className = `fas ${iconMap[iconKey]}`;
  document.getElementById('lc-stats').innerHTML = `
    <tr><td><i class="fas fa-clock"></i> Час</td><td><span>${stats.mins}хв ${stats.sec}с</span></td></tr>
    <tr><td><i class="fas fa-keyboard"></i> Символів</td><td><span>${stats.chars}</span></td></tr>
    <tr><td><i class="fas fa-tachometer-alt"></i> Швидкість</td><td><span>${stats.wpm} симв/хв</span></td></tr>
    <tr><td><i class="fas fa-bullseye"></i> Точність</td><td><span>${stats.acc}%</span></td></tr>
    <tr><td><i class="fas fa-fire"></i> Макс. серія</td><td><span>${stats.maxStreak}</span></td></tr>
  `;
  document.getElementById('level-complete').classList.add('show');
}

// ----------------------------------------------------------------
// Streak burst notification
// ----------------------------------------------------------------
function showStreakBurst(n) {
  const el = document.getElementById('streak-burst');
  el.innerHTML = `<i class="fas fa-fire"></i> ${n} поспіль!`;
  el.classList.remove('pop');
  void el.offsetWidth;
  el.classList.add('pop');
}

// ----------------------------------------------------------------
// Toast notification
// ----------------------------------------------------------------
let toastTimer = null;

function showToast(htmlMsg, duration = 2500) {
  let toast = document.getElementById('global-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'global-toast';
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.innerHTML = htmlMsg;
  toast.classList.add('show');
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), duration);
}

// ----------------------------------------------------------------
// Difficulty button label
// ----------------------------------------------------------------
function updateDifficultyBtn() {
  const d = DIFFICULTIES[state.difficulty];
  document.getElementById('difficulty-label').innerHTML =
    `<i class="fas ${d.iconClass}"></i> ${d.label}`;
}
