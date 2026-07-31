'use strict';

// ================================================================
// KLAVIО — ui.js
// ================================================================

function updateTextDisplay() {
  const full = exercises[state.taskNum - 1] || '';
  const cursorIndex = state.correctChars;
  const VISIBLE = 60, CARET_AT = 28;
  const padded = full + ' '.repeat(CARET_AT + 2);
  const maxStart = Math.max(0, padded.length - VISIBLE);
  const start = Math.min(maxStart, Math.max(0, cursorIndex - CARET_AT));
  const end   = Math.min(padded.length, start + VISIBLE);
  const win   = padded.slice(start, end);
  const local = cursorIndex - start;

  const doneEl = document.getElementById('td-done');
  const curEl  = document.getElementById('td-cursor');
  const todoEl = document.getElementById('td-todo');

  if (doneEl) doneEl.textContent = win.slice(0, Math.max(0, local));
  if (todoEl) todoEl.textContent = win.slice(Math.min(win.length, local + 1));
  if (curEl) {
    const ch = win[local] ?? ' ';
    const isSpace = ch === ' ';
    curEl.textContent = isSpace ? '\u00A0' : ch;
    curEl.classList.toggle('is-space', isSpace);
  }
}

function updateProgress() {
  const pct = state.totalChars > 0
    ? (state.correctChars / state.totalChars * 100).toFixed(1) : 0;
  const fill = document.getElementById('progress-fill');
  if (fill) fill.style.width = pct + '%';
}

function calcCPM() {
  if (!state.timeStart || state.correctChars < 2) return 0;
  const secs = Math.max(1, Math.floor(Date.now() / 1000) - state.timeStart);
  return Math.round(state.correctChars / secs * 60);
}

function calcWPM() {
  return calcCPM();
}

function updateStats() {
  const wpmEl    = document.getElementById('wpm-value');
  const streakEl = document.getElementById('streak-value');
  const lessonEl = document.getElementById('lesson-num');
  const accEl    = document.getElementById('acc-value');
  if (wpmEl)    wpmEl.textContent    = calcCPM();
  if (streakEl) streakEl.textContent = state.streak;
  if (lessonEl) lessonEl.textContent = state.taskNum;
  const total = state.correctChars + state.incorrectChars;
  if (accEl)
    accEl.textContent = total > 0
      ? Math.round(state.correctChars / total * 100) + '%' : '—';
}

// ----------------------------------------------------------------
// Hand finger highlights
// ----------------------------------------------------------------

// finger-id  →  [circle-class, number-id]  for each hand
const FINGER_CIRCLE = {
  'lh-pinky':  ['fc-pinky',  'lh-pinky-n'],
  'lh-ring':   ['fc-ring',   'lh-ring-n'],
  'lh-middle': ['fc-middle', 'lh-middle-n'],
  'lh-index':  ['fc-index',  'lh-index-n'],
  'lh-thumb':  ['fc-thumb',  'lh-thumb-n'],
  'rh-index':  ['fc-index',  'rh-index-n'],
  'rh-middle': ['fc-middle', 'rh-middle-n'],
  'rh-ring':   ['fc-ring',   'rh-ring-n'],
  'rh-pinky':  ['fc-pinky',  'rh-pinky-n'],
  'rh-thumb':  ['fc-thumb',  'rh-thumb-n'],
};

function clearHandHighlights() {
  document.querySelectorAll('.finger.active').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.fnum.active').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.fnum-circle.active').forEach(el => el.classList.remove('active'));
  ['left-finger-name', 'right-finger-name'].forEach(id => {
    const el = document.getElementById(id);
    if (el) { el.textContent = ''; el.classList.remove('visible'); }
  });
}

function highlightFinger(keyId) {
  clearHandHighlights();
  if (!DIFFICULTIES[state.difficulty].handHint) return;

  const info = FINGER_MAP[keyId];
  if (!info) return;
  const entries = Array.isArray(info[0]) ? info : [info];

  for (const [hand, fingerId, fingerName] of entries) {
    // Light up finger body
    const fingerEl = document.getElementById(fingerId);
    if (fingerEl) fingerEl.classList.add('active');

    // Light up number text
    const fc = FINGER_CIRCLE[fingerId];
    if (fc) {
      const numEl = document.getElementById(fc[1]);
      if (numEl) numEl.classList.add('active');

      // Light up the circle — find it inside the correct hand container
      const container = document.getElementById(hand + '-hand-container');
      if (container) {
        const circEl = container.querySelector('.' + fc[0]);
        if (circEl) circEl.classList.add('active');
      }
    }

    // Show badge
    const badge = document.getElementById(hand + '-finger-name');
    if (badge) { badge.textContent = fingerName; badge.classList.add('visible'); }
  }
}

// ----------------------------------------------------------------
// Modal helpers
// ----------------------------------------------------------------
function openModal(title, bodyHTML, variant) {
  const overlay = document.getElementById('modal-overlay');
  const box     = document.getElementById('modal-box');
  if (!overlay || !box) return;
  if (closeModalTimer) {
    clearTimeout(closeModalTimer);
    closeModalTimer = null;
  }
  box.classList.remove('modal-onboarding');
  if (variant === 'onboarding') box.classList.add('modal-onboarding');
  document.getElementById('modal-header').innerHTML = title;
  document.getElementById('modal-body').innerHTML   = bodyHTML;
  overlay.classList.add('open');
  box.style.display   = 'block';
  box.style.opacity   = '0';
  box.style.transform = 'translate(-50%,-50%) scale(0.88)';
  requestAnimationFrame(() => {
    box.style.transition = 'opacity 0.22s ease, transform 0.28s cubic-bezier(0.34,1.56,0.64,1)';
    box.style.opacity    = '1';
    box.style.transform  = 'translate(-50%,-50%) scale(1)';
  });
}

function closeModal() {
  const overlay = document.getElementById('modal-overlay');
  const box     = document.getElementById('modal-box');
  if (!overlay || !box) return;
  overlay.classList.remove('open');
  box.style.opacity   = '0';
  box.style.transform = 'translate(-50%,-50%) scale(0.88)';
  if (closeModalTimer) clearTimeout(closeModalTimer);
  closeModalTimer = setTimeout(() => {
    box.style.display = 'none';
    closeModalTimer = null;
  }, 250);
}

let modalConfirmAction = null;

function hasProgressToLose() {
  return !state.lessonCompleted && (state.correctChars + state.incorrectChars) > 0;
}

function confirmProgressLoss(message, confirmLabel, onConfirm) {
  modalConfirmAction = typeof onConfirm === 'function' ? onConfirm : null;
  openModal('<i class="fa-solid fa-triangle-exclamation"></i> Підтвердження дії', `
    <p>${message}</p>
    <div class="modal-actions">
      <button class="btn-retry" type="button" onclick="cancelModalConfirm()">
        Скасувати
      </button>
      <button class="btn-next btn-danger" type="button" onclick="acceptModalConfirm()">
        ${confirmLabel}
      </button>
    </div>
  `);
}

function acceptModalConfirm() {
  const action = modalConfirmAction;
  modalConfirmAction = null;
  closeModal();
  if (action) setTimeout(action, 0);
}

function cancelModalConfirm() {
  modalConfirmAction = null;
  closeModal();
}

function confirmResetProgress() {
  if (!hasProgressToLose()) {
    resetProgress();
    return;
  }
  confirmProgressLoss('Ця дія скине поточну статистику та поверне на першу вправу.', 'Скинути', () => {
    resetProgress();
  });
}

function selectLessonWithGuard(n) {
  const go = () => {
    startTyping(n);
    closeModal();
  };
  if (n === state.taskNum || !hasProgressToLose()) {
    go();
    return;
  }
  confirmProgressLoss('Перехід на іншу вправу скине статистику поточної вправи.', 'Перейти', go);
}

function showLessonSelect() {
  const items = lessonNames.map((name, i) => {
    const n = i + 1;
    const isCurrent = n === state.taskNum;
    const isDone    = n < state.taskNum;
    return `<li class="${isCurrent ? 'current' : ''} ${isDone ? 'done' : ''}"
               role="button"
               tabindex="0"
               onclick="selectLessonWithGuard(${n});">
               ${isDone ? '<i class="fa-solid fa-check"></i> ' : ''}${name}
             </li>`;
  }).join('');
  openModal('<i class="fas fa-book"></i> Оберіть вправу',
    `<ul class="lesson-list">${items}</ul>`);
}

function showProgress() {
  const secs = state.timeStart
    ? Math.floor(Date.now() / 1000) - state.timeStart : 0;
  const total = state.correctChars + state.incorrectChars;
  const acc   = total > 0 ? Math.round(state.correctChars / total * 100) : 100;
  openModal('<i class="fas fa-chart-bar"></i> Поточний поступ', `
    <table class="stats-table">
      <tr><td><i class="fas fa-clock"></i> Час</td>
          <td><b>${Math.floor(secs/60)}хв ${secs%60}с</b></td></tr>
      <tr><td><i class="fas fa-keyboard"></i> Символів</td>
          <td><b>${state.correctChars} / ${state.totalChars}</b></td></tr>
      <tr><td><i class="fas fa-tachometer-alt"></i> Швидкість</td>
          <td><b>${calcCPM()} симв/хв</b></td></tr>
      <tr><td><i class="fas fa-bullseye"></i> Точність</td>
          <td><b>${acc}%</b></td></tr>
      <tr><td><i class="fas fa-fire"></i> Серія (макс)</td>
          <td><b>${state.streak} / ${state.maxStreak}</b></td></tr>
      <tr><td><i class="fas fa-times-circle"></i> Помилок</td>
          <td><b>${state.incorrectChars}</b></td></tr>
      <tr><td><i class="fas fa-list-ol"></i> Вправа</td>
          <td><b>${state.taskNum} / ${exercises.length}</b></td></tr>
    </table>
  `);
}

function showAbout() {
  openModal('<i class="fas fa-keyboard"></i> Про Клавіо', `
    <div class="about-content">
      <p><b>Клавіо</b> — безкоштовний онлайн-тренажер для навчання сліпого методу
         друку на українській розкладці. Вправи охоплюють весь алфавіт від
         простих комбінацій до зв'язних текстів.</p>
      <h4>Режими складності</h4>
      <div class="diff-list">
        <div><i class="fas fa-seedling" style="color:var(--c-index1)"></i>
             <b>Новачок</b> — підсвічує клавішу та палець</div>
        <div><i class="fas fa-graduation-cap" style="color:var(--c-ring)"></i>
             <b>Учень</b> — лише підказка пальця</div>
        <div><i class="fas fa-fire" style="color:var(--c-pinky)"></i>
             <b>Майстер</b> — без жодних підказок</div>
      </div>
      <h4>Кольори пальців</h4>
      <div class="color-legend">
        <span class="cl-pinky">■ Мізинець</span>
        <span class="cl-ring">■ Безіменний</span>
        <span class="cl-middle">■ Середній</span>
        <span class="cl-index">■ Вказівний</span>
        <span class="cl-thumb">■ Великий</span>
      </div>
      <p class="about-credit">Автор тренажеру: пан Артем, на основі Тиканки Г. Громко.</p>
    </div>
  `);
}

function showLessonComplete(stats) {
  let iconClass;
  if (stats.acc >= 98) iconClass = 'fa-trophy';
  else if (stats.acc >= 90) iconClass = 'fa-star';
  else if (stats.acc >= 75) iconClass = 'fa-thumbs-up';
  else iconClass = 'fa-dumbbell';

  const lcIcon = document.getElementById('lc-icon');
  if (lcIcon) lcIcon.innerHTML = `<i class="fas ${iconClass}"></i>`;

  const lcStats = document.getElementById('lc-stats');
  if (lcStats) lcStats.innerHTML = `
    <tr><td><i class="fas fa-clock"></i> Час</td>
        <td><span>${stats.mins}хв ${stats.sec}с</span></td></tr>
    <tr><td><i class="fas fa-keyboard"></i> Символів</td>
        <td><span>${stats.chars}</span></td></tr>
    <tr><td><i class="fas fa-tachometer-alt"></i> Швидкість</td>
        <td><span>${stats.wpm} симв/хв</span></td></tr>
    <tr><td><i class="fas fa-bullseye"></i> Точність</td>
        <td><span>${stats.acc}%</span></td></tr>
    <tr><td><i class="fas fa-fire"></i> Макс. серія</td>
        <td><span>${stats.maxStreak}</span></td></tr>
  `;

  const lc = document.getElementById('level-complete');
  if (lc) lc.classList.add('show');
}

function showStreakBurst(n) {
  const el = document.getElementById('streak-burst');
  if (!el) return;
  el.innerHTML = `<i class="fas fa-fire"></i> ${n} поспіль!`;
  el.classList.remove('pop'); void el.offsetWidth; el.classList.add('pop');
}

let toastTimer = null;
function showToast(htmlMsg, duration = 2500) {
  const toast = document.getElementById('global-toast');
  if (!toast) return;
  toast.innerHTML = htmlMsg;
  toast.classList.add('show');
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), duration);
}

function updateDifficultyBtn() {
  const d   = DIFFICULTIES[state.difficulty];
  const lbl = document.getElementById('difficulty-label');
  const icon = document.getElementById('difficulty-icon');
  if (icon) icon.className = `fa-solid ${d.iconClass}`;
  if (lbl) lbl.textContent = d.label;
}

const THEME_KEY = 'klavio_theme';
const ONBOARDING_KEY = 'klavio_onboarding_seen_v1';
const HAND_DEBUG = false;
const HAND_COORDS_KEY = 'klavio_hand_coords_v2';
let closeModalTimer = null;

const HAND_FINGERS = {
  left: ['lh-pinky', 'lh-ring', 'lh-middle', 'lh-index', 'lh-thumb'],
  right: ['rh-index', 'rh-middle', 'rh-ring', 'rh-pinky', 'rh-thumb'],
};

const DEFAULT_HAND_COORDS = {
  'lh-pinky':  { left: '8%', top: '23.86%', width: '14%', height: '31%' },
  'lh-ring':   { left: '22.54%', top: '8.86%', width: '14%', height: '35%' },
  'lh-middle': { left: '38.13%', top: '4.13%', width: '14%', height: '41%' },
  'lh-index':  { left: '53.13%', top: '10.13%', width: '14%', height: '35%' },
  'lh-thumb':  { left: '71.43%', top: '33%', width: '26%', height: '26%' },
  'rh-index':  { left: '33.13%', top: '9.54%', width: '14%', height: '35%' },
  'rh-middle': { left: '48.13%', top: '3.71%', width: '14%', height: '41%' },
  'rh-ring':   { left: '63.13%', top: '10.13%', width: '14%', height: '35%' },
  'rh-pinky':  { left: '77%', top: '22.29%', width: '14%', height: '31%' },
  'rh-thumb':  { left: '2.27%', top: '32.98%', width: '26%', height: '26%' },
};

function parsePctValue(v, fallback = 0) {
  if (typeof v === 'number') return v;
  if (typeof v !== 'string') return fallback;
  const n = parseFloat(v.replace('%', '').trim());
  return Number.isFinite(n) ? n : fallback;
}

function clamp(n, min, max) {
  return Math.min(max, Math.max(min, n));
}

function sanitizeCoord(id, value) {
  const isThumb = id.endsWith('thumb');
  const wMin = isThumb ? 18 : 10;
  const wMax = isThumb ? 26 : 18;
  const hMin = isThumb ? 16 : 24;
  const hMax = isThumb ? 26 : 45;

  const width = clamp(parsePctValue(value.width, parsePctValue(DEFAULT_HAND_COORDS[id].width, 14)), wMin, wMax);
  const height = clamp(parsePctValue(value.height, parsePctValue(DEFAULT_HAND_COORDS[id].height, 35)), hMin, hMax);
  const left = clamp(parsePctValue(value.left, parsePctValue(DEFAULT_HAND_COORDS[id].left, 0)), 0, 100 - width);
  const top = clamp(parsePctValue(value.top, parsePctValue(DEFAULT_HAND_COORDS[id].top, 0)), 0, 100 - height);

  return {
    left: left.toFixed(2) + '%',
    top: top.toFixed(2) + '%',
    width: width.toFixed(2) + '%',
    height: height.toFixed(2) + '%',
  };
}

function sanitizeHandCoords(coords) {
  const out = {};
  Object.keys(DEFAULT_HAND_COORDS).forEach(id => {
    out[id] = sanitizeCoord(id, coords[id] || DEFAULT_HAND_COORDS[id]);
  });
  return out;
}

function loadHandCoords() {
  try {
    const raw = localStorage.getItem(HAND_COORDS_KEY);
    if (!raw) return sanitizeHandCoords({ ...DEFAULT_HAND_COORDS });
    const parsed = JSON.parse(raw);
    return sanitizeHandCoords({ ...DEFAULT_HAND_COORDS, ...parsed });
  } catch (e) {
    return sanitizeHandCoords({ ...DEFAULT_HAND_COORDS });
  }
}

function saveHandCoords(coords) {
  try {
    localStorage.setItem(HAND_COORDS_KEY, JSON.stringify(sanitizeHandCoords(coords)));
  } catch (e) {}
}

function collectHandCoordsFromDom() {
  const out = {};
  Object.values(HAND_FINGERS).flat().forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    out[id] = {
      left: el.style.left || '',
      top: el.style.top || '',
      width: el.style.width || '',
      height: el.style.height || '',
    };
  });
  return out;
}

function applyHandCoords(coords) {
  Object.entries(coords).forEach(([id, value]) => {
    const el = document.getElementById(id);
    if (!el || !value) return;
    if (value.left) el.style.left = value.left;
    if (value.top) el.style.top = value.top;
    if (value.width) el.style.width = value.width;
    if (value.height) el.style.height = value.height;
  });
}

function pct(px, base) {
  if (!base) return 0;
  return +(px / base * 100).toFixed(2);
}

function ensurePercentStyle(el) {
  const parent = el.parentElement;
  if (!parent) return;
  const cs = window.getComputedStyle(el);
  const pw = parent.clientWidth || 1;
  const ph = parent.clientHeight || 1;

  const leftPx = parseFloat(cs.left) || 0;
  const topPx = parseFloat(cs.top) || 0;
  const widthPx = parseFloat(cs.width) || el.offsetWidth || 0;
  const heightPx = parseFloat(cs.height) || el.offsetHeight || 0;

  el.style.left = pct(leftPx, pw) + '%';
  el.style.top = pct(topPx, ph) + '%';
  el.style.width = pct(widthPx, pw) + '%';
  el.style.height = pct(heightPx, ph) + '%';
}

function renderHandCoords(side, outEl) {
  const lines = HAND_FINGERS[side].map(id => {
    const el = document.getElementById(id);
    if (!el) return '';
    const left = el.style.left || '-';
    const top = el.style.top || '-';
    const width = el.style.width || '-';
    const height = el.style.height || '-';
    return `${id}: l:${left} t:${top} w:${width} h:${height}`;
  }).filter(Boolean);
  outEl.textContent = lines.join('\n');
}

function initHandCalibrator() {
  applyHandCoords(loadHandCoords());
  if (!HAND_DEBUG) return;

  const outs = {};
  ['left', 'right'].forEach(side => {
    const container = document.getElementById(`${side}-hand-container`);
    if (!container) return;
    const out = document.createElement('pre');
    out.className = 'hand-coords';
    out.id = `${side}-hand-coords`;
    container.appendChild(out);
    outs[side] = out;
  });

  Object.values(HAND_FINGERS).flat().forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    ensurePercentStyle(el);
  });

  const rerenderAll = () => {
    if (outs.left) renderHandCoords('left', outs.left);
    if (outs.right) renderHandCoords('right', outs.right);
  };
  rerenderAll();

  let drag = null;
  document.addEventListener('pointerdown', e => {
    const target = e.target.closest('.finger');
    if (!target || !document.body.classList.contains('hand-debug')) return;

    const parent = target.parentElement;
    if (!parent) return;

    e.preventDefault();
    target.setPointerCapture(e.pointerId);

    drag = {
      target,
      parent,
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      left: parseFloat(target.style.left) || 0,
      top: parseFloat(target.style.top) || 0,
      width: parseFloat(target.style.width) || 0,
      height: parseFloat(target.style.height) || 0,
    };
  });

  document.addEventListener('pointermove', e => {
    if (!drag || e.pointerId !== drag.pointerId) return;

    const pr = drag.parent.getBoundingClientRect();
    const dxPct = pct(e.clientX - drag.startX, pr.width);
    const dyPct = pct(e.clientY - drag.startY, pr.height);

    const maxLeft = Math.max(0, 100 - drag.width);
    const maxTop = Math.max(0, 100 - drag.height);
    const nextLeft = Math.min(maxLeft, Math.max(0, drag.left + dxPct));
    const nextTop = Math.min(maxTop, Math.max(0, drag.top + dyPct));

    drag.target.style.left = nextLeft.toFixed(2) + '%';
    drag.target.style.top = nextTop.toFixed(2) + '%';
    rerenderAll();
  });

  const stopDrag = e => {
    if (!drag || e.pointerId !== drag.pointerId) return;
    try { drag.target.releasePointerCapture(e.pointerId); } catch (err) {}
    saveHandCoords(collectHandCoordsFromDom());
    drag = null;
  };

  document.addEventListener('pointerup', stopDrag);
  document.addEventListener('pointercancel', stopDrag);
}

function getEffectiveTheme() {
  const root = document.documentElement;
  const forced = root.getAttribute('data-theme');
  if (forced === 'light' || forced === 'dark') return forced;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function renderThemeToggle() {
  const btn = document.getElementById('theme-toggle-btn');
  const icon = document.getElementById('theme-icon');
  if (!btn || !icon) return;
  const theme = getEffectiveTheme();
  if (theme === 'dark') {
    icon.className = 'fa-solid fa-sun';
    btn.title = 'Світла тема';
  } else {
    icon.className = 'fa-solid fa-moon';
    btn.title = 'Темна тема';
  }
}

function applyTheme(theme) {
  const root = document.documentElement;
  if (theme === 'light' || theme === 'dark') root.setAttribute('data-theme', theme);
  else root.removeAttribute('data-theme');
  renderThemeToggle();
}

function initTheme() {
  let saved = null;
  try { saved = localStorage.getItem(THEME_KEY); } catch (e) {}
  applyTheme(saved);
}

function toggleTheme() {
  const next = getEffectiveTheme() === 'dark' ? 'light' : 'dark';
  applyTheme(next);
  try { localStorage.setItem(THEME_KEY, next); } catch (e) {}
}

function shouldShowOnboarding() {
  return true;
}

function markOnboardingSeen() {
  // Intentionally no-op: on shared school computers onboarding must be
  // visible for every new visitor after page reload.
}

function startOnboardingTraining() {
  markOnboardingSeen();
  closeModal();
}

function showOnboarding() {
  openModal('<i class="fas fa-hand-sparkles"></i> Ласкаво просимо до Клавіо', `
    <div class="about-content">
      <p><b>Клавіо</b> — безкоштовний онлайн-тренажер для навчання сліпого друку на українській розкладці.</p>
      <h4>Режими складності</h4>
      <div class="diff-list">
        <div><i class="fas fa-seedling" style="color:var(--c-index1)"></i>
             <b>Новачок</b> — підсвічує клавішу та палець</div>
        <div><i class="fas fa-graduation-cap" style="color:var(--c-ring)"></i>
             <b>Учень</b> — лише підказка пальця</div>
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
      <h4>Як пройти першу вправу</h4>
      <ul class="onboarding-list">
        <li>Почніть у режимі <b>Новачок</b> і друкуйте символ під курсором.</li>
        <li>Слідкуйте за точністю, швидкість прийде поступово.</li>
        <li>Якщо помиляєтесь часто, повторіть поточну вправу.</li>
      </ul>
      <div class="modal-actions">
        <button class="btn-next" type="button" onclick="startOnboardingTraining()">
          Почати навчання <i class="fa-solid fa-arrow-right"></i>
        </button>
      </div>
    </div>
  `, 'onboarding');
}

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    closeModal();
  }
  if (e.target && e.target.matches('.lesson-list li') && (e.key === 'Enter' || e.key === ' ')) {
    e.preventDefault();
    e.target.click();
  }
});

document.addEventListener('DOMContentLoaded', () => {
  if (HAND_DEBUG) document.body.classList.add('hand-debug');
  initHandCalibrator();
});
