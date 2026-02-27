'use strict';

// ─── CONFIG ──────────────────────────────────────────────────
const CFG = {
  AUDIO_RAMP:           0.001,
  RESIZE_DELAY:         250,
  FIRST_CELL_DELAY:     900,
  SETUP_DELAY:          350,
  ANIM_FRAME_DELAY:     50,
  CELL_ANIM_MS:         420,
  MIN_CELL_PX:          28,
  GRID_PAD:             20,
  MISSED_REPLAY_RATIO:  0.45,
};

// ─── LEVELS ───────────────────────────────────────────────────
const LEVELS = [
  {
    id: 0,
    name: 'Повільний',
    icon: 'fa-solid fa-gauge',
    size: 4, cellSize: 90,
    cellTimeLimit: null, targets: 8,
    overallTimeLimit: null,
  },
  {
    id: 1,
    name: 'Швидкий',
    icon: 'fa-solid fa-gauge-high',
    size: 6, cellSize: 68,
    cellTimeLimit: 2000, targets: 15,
    overallTimeLimit: 30,
  },
  {
    id: 2,
    name: 'Блискавка',
    icon: 'fa-solid fa-bolt',
    size: 8, cellSize: 50,
    cellTimeLimit: 1500, targets: 20,
    overallTimeLimit: 45,
  },
];

// ─── PROGRESS PERSISTENCE ────────────────────────────────────
const STORAGE_KEY = 'mouseRaces_unlockedLevel';

function getUnlockedLevel() {
  try { return parseInt(localStorage.getItem(STORAGE_KEY) || '0', 10); }
  catch { return 0; }
}
function setUnlockedLevel(lvl) {
  try { localStorage.setItem(STORAGE_KEY, String(lvl)); } catch {}
}
function hasPlayedBefore() {
  // "has played before" = localStorage key exists at all
  try { return localStorage.getItem(STORAGE_KEY) !== null; }
  catch { return false; }
}

// ─── AUDIO ────────────────────────────────────────────────────
let audioCtx = null;
try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch {}

function playTone(freq, dur, type = 'sine', vol = 0.1) {
  if (!audioCtx) return;
  if (audioCtx.state === 'suspended') audioCtx.resume().catch(() => {});
  try {
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.connect(g); g.connect(audioCtx.destination);
    o.frequency.setValueAtTime(freq, audioCtx.currentTime);
    o.type = type;
    g.gain.setValueAtTime(vol, audioCtx.currentTime);
    g.gain.exponentialRampToValueAtTime(CFG.AUDIO_RAMP, audioCtx.currentTime + dur);
    o.start(audioCtx.currentTime); o.stop(audioCtx.currentTime + dur);
  } catch {}
}

const SFX = {
  correct: ()       => { playTone(880, 0.08, 'square', 0.08); },
  wrong:   ()       => { playTone(220, 0.15, 'sawtooth', 0.1); },
  missed:  ()       => { playTone(160, 0.2,  'triangle', 0.1); },
  levelOk: ()       => { playTone(660, 0.35, 'sine', 0.11); setTimeout(() => playTone(880, 0.35, 'sine', 0.11), 180); },
  timeUp:  ()       => { playTone(300, 0.5,  'triangle', 0.13); },
};

// ─── STATE ────────────────────────────────────────────────────
const S = {
  currentLevel:      0,
  score:             0,
  missedTotal:       0,
  missedThisLevel:   0,
  targetsClicked:    0,
  currentTarget:     null,
  isWaiting:         true,
  isPaused:          false,

  cellTimerId:       null,
  cellAnimId:        null,
  levelInterval:     null,
  highlightStart:    null,
  cellTimeLeft:      null,   // remaining ms on pause
  levelTimeLeft:     null,
};

function resetState() {
  clearAllTimers();
  Object.assign(S, {
    currentLevel: 0, score: 0, missedTotal: 0,
    missedThisLevel: 0, targetsClicked: 0,
    currentTarget: null, isWaiting: true, isPaused: false,
    highlightStart: null, cellTimeLeft: null, levelTimeLeft: null,
  });
}

// ─── DOM ─────────────────────────────────────────────────────
const el = id => document.getElementById(id);
const qs = sel => document.querySelector(sel);

// Cache key elements
let DOM = {};
function cacheDOM() {
  DOM = {
    screens: {
      start:         qs('.start-screen'),
      game:          qs('.game-screen'),
      levelComplete: qs('.level-complete-screen'),
      gameComplete:  qs('.game-complete-screen'),
    },
    // start screen dynamic sections
    firstTimeView:   el('first-time-view'),
    returningView:   el('returning-view'),
    startBtn:        el('start-btn'),
    // game HUD
    chipLevel:    el('chip-level'),
    chipScore:    el('chip-score'),
    chipMissed:   el('chip-missed'),
    chipTime:     el('chip-time'),
    chipProgress: el('chip-progress'),
    grid:         el('game-grid'),
    progressFill: el('progress-fill'),
    progressLbl:  el('progress-label'),
    pauseBtn:     el('pause-btn'),
    // pause overlay
    pauseOverlay: el('pause-overlay'),
    resumeBtn:    el('resume-btn'),
    menuFromPause:el('menu-from-pause'),
    // level complete
    lcStars:   el('lc-stars'),
    lcIcon:    el('lc-icon'),
    lcTitle:   el('lc-title'),
    lcBody:    el('lc-body'),
    lcStats:   el('lc-stats'),
    lcReplay:  el('lc-replay'),   // replay callout div
    lcBtn:     el('lc-btn'),
    lcReplayBtn: el('lc-replay-btn'),
    // game complete
    gcScore:   el('gc-score'),
    gcMsg:     el('gc-msg'),
    gcMissed:  el('gc-missed'),
  };
}

// ─── SCREEN ───────────────────────────────────────────────────
function showScreen(name) {
  Object.values(DOM.screens).forEach(s => s && s.classList.remove('active'));
  if (DOM.screens[name]) DOM.screens[name].classList.add('active');
}

// ─── MESSAGE (removed — audio-only feedback) ────────────────

// ─── TIMERS ───────────────────────────────────────────────────
function clearCellTimers() {
  clearTimeout(S.cellTimerId); clearTimeout(S.cellAnimId);
  S.cellTimerId = S.cellAnimId = null;
  S.highlightStart = null;
}

function clearAllTimers() {
  clearCellTimers();
  clearInterval(S.levelInterval); S.levelInterval = null;
  // clean up highlighted cell visually
  if (S.currentTarget !== null && DOM.grid) {
    const c = DOM.grid.children[S.currentTarget];
    if (c) { c.classList.remove('highlighted'); const b = c.querySelector('.timer-bar'); if (b) b.remove(); }
  }
  S.currentTarget = null; S.isWaiting = true; S.cellTimeLeft = null;
}

// ─── HUD ─────────────────────────────────────────────────────
function updateHUD() {
  const lv = LEVELS[S.currentLevel]; if (!lv) return;
  DOM.chipLevel    && (DOM.chipLevel.innerHTML    = `<i class="${lv.icon}"></i> ${lv.name}`);
  DOM.chipScore    && (DOM.chipScore.innerHTML    = `<i class="fa-solid fa-star"></i> ${S.score}`);
  DOM.chipMissed   && (DOM.chipMissed.innerHTML   = `<i class="fa-solid fa-xmark"></i> ${S.missedTotal}`);
  DOM.chipProgress && (DOM.chipProgress.innerHTML = `<i class="fa-solid fa-bullseye"></i> ${S.targetsClicked}/${lv.targets}`);
  updateTimeChip();
  updateProgressBar();
}

function updateTimeChip() {
  const lv = LEVELS[S.currentLevel]; if (!DOM.chipTime) return;
  if (lv && lv.overallTimeLimit && S.levelTimeLeft !== null) {
    DOM.chipTime.innerHTML = `<i class="fa-solid fa-clock"></i> ${S.levelTimeLeft}с`;
    DOM.chipTime.classList.toggle('urgent', S.levelTimeLeft <= 5);
  } else {
    DOM.chipTime.innerHTML = `<i class="fa-solid fa-clock"></i> ∞`;
    DOM.chipTime.classList.remove('urgent');
  }
}

function updateProgressBar() {
  const lv = LEVELS[S.currentLevel]; if (!lv || !DOM.progressFill) return;
  const pct = Math.round((S.targetsClicked / lv.targets) * 100);
  DOM.progressFill.style.width = `${pct}%`;
  if (DOM.progressLbl) DOM.progressLbl.textContent = `${S.targetsClicked} / ${lv.targets}`;
}

// ─── GRID ─────────────────────────────────────────────────────
function buildGrid(lv) {
  if (!DOM.grid || !DOM.screens.game) return;
  const area = DOM.grid.closest('.game-area');
  const aw   = area ? area.clientWidth - 28 : 500;
  const maxW = Math.floor((aw - (lv.size - 1) * 5) / lv.size);
  const cell = Math.max(Math.min(lv.cellSize, maxW), CFG.MIN_CELL_PX);

  DOM.grid.style.gridTemplateColumns = `repeat(${lv.size}, ${cell}px)`;
  DOM.grid.innerHTML = '';
  for (let i = 0; i < lv.size * lv.size; i++) {
    const d = document.createElement('div');
    d.className = 'cell';
    d.style.cssText = `width:${cell}px;height:${cell}px`;
    d.addEventListener('click', () => onCellClick(i));
    DOM.grid.appendChild(d);
  }
}

// ─── HIGHLIGHT ────────────────────────────────────────────────
function highlightNext() {
  if (S.isPaused || !DOM.screens.game.classList.contains('active')) return;
  const lv = LEVELS[S.currentLevel]; if (!lv || !DOM.grid) return;

  // Guards
  if (lv.overallTimeLimit && S.levelTimeLeft <= 0) { if (!S.levelInterval) handleTimeUp(); return; }
  if (S.targetsClicked >= lv.targets) { completeLevel(); return; }

  // Register miss for previous cell if still highlighted
  if (S.currentTarget !== null) {
    const prev = DOM.grid.children[S.currentTarget];
    if (prev && prev.classList.contains('highlighted') && S.isWaiting) {
      prev.classList.remove('highlighted');
      const b = prev.querySelector('.timer-bar'); if (b) b.remove();
      S.missedTotal++; S.missedThisLevel++;
      SFX.missed(); updateHUD();
    }
  }
  clearCellTimers();

  // Pick new cell
  const cells = DOM.grid.children;
  let idx;
  do { idx = Math.floor(Math.random() * cells.length); }
  while (idx === S.currentTarget && cells.length > 1);

  S.currentTarget = idx; S.isWaiting = true;
  const cell = cells[idx]; if (!cell) return;
  cell.classList.add('highlighted');

  // Per-cell countdown
  if (lv.cellTimeLimit) {
    S.highlightStart = Date.now();
    const bar = document.createElement('div'); bar.className = 'timer-bar'; cell.appendChild(bar);
    S.cellAnimId = setTimeout(() => {
      if (!cell.classList.contains('highlighted') || S.isPaused) return;
      bar.style.transition = `transform ${lv.cellTimeLimit/1000}s linear`;
      bar.style.transform  = 'scaleX(0)';
    }, CFG.ANIM_FRAME_DELAY);
    S.cellTimerId = setTimeout(() => {
      if (S.isPaused || !cell.classList.contains('highlighted')) return;
      highlightNext();
    }, lv.cellTimeLimit);
  }
}

// ─── CLICK ────────────────────────────────────────────────────
function onCellClick(idx) {
  if (S.isPaused || !DOM.screens.game.classList.contains('active')) return;
  if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume().catch(() => {});

  const lv = LEVELS[S.currentLevel]; if (!lv) return;
  if (lv.overallTimeLimit && S.levelTimeLeft <= 0) return;
  if (S.targetsClicked >= lv.targets) return;
  if (!DOM.grid) return;
  const cell = DOM.grid.children[idx]; if (!cell) return;

  if (idx === S.currentTarget && S.isWaiting) {
    // ✅ Correct
    S.isWaiting = false; S.score++; S.targetsClicked++;
    clearCellTimers();
    cell.classList.remove('highlighted');
    const b = cell.querySelector('.timer-bar'); if (b) b.remove();
    cell.classList.add('correct');
      SFX.correct(); updateHUD();

    setTimeout(() => {
      if (cell) cell.classList.remove('correct');
      S.isWaiting = true;
      if (S.isPaused || !DOM.screens.game.classList.contains('active')) return;
      if (S.targetsClicked >= lv.targets) completeLevel();
      else if (lv.overallTimeLimit && S.levelTimeLeft <= 0) handleTimeUp();
      else highlightNext();
    }, CFG.CELL_ANIM_MS);

  } else if (idx !== S.currentTarget) {
    // ❌ Wrong
    if (cell.classList.contains('correct') || cell.classList.contains('wrong')) return;
    cell.classList.add('wrong');
      SFX.wrong();
    setTimeout(() => { if (cell) cell.classList.remove('wrong'); }, CFG.CELL_ANIM_MS);
  }
}

// ─── LEVEL TIMER ─────────────────────────────────────────────
function tickLevelTimer() {
  if (S.isPaused) return;
  if (S.levelTimeLeft === null) return;
  S.levelTimeLeft = Math.max(0, S.levelTimeLeft - 1);
  updateTimeChip();
  if (S.levelTimeLeft <= 0) {
    clearInterval(S.levelInterval); S.levelInterval = null;
    handleTimeUp();
  }
}

function handleTimeUp() {
  clearAllTimers(); SFX.timeUp();
  setTimeout(() => {
    const lv = LEVELS[S.currentLevel];
    if (S.currentLevel < LEVELS.length - 1) {
      renderLevelComplete(lv, true);
      showScreen('levelComplete');
    } else {
      renderGameComplete(); showScreen('gameComplete');
    }
  }, 1100);
}

// ─── PAUSE ────────────────────────────────────────────────────
function pauseGame() {
  if (S.isPaused) return;
  S.isPaused = true;

  const lv = LEVELS[S.currentLevel];
  if (lv && lv.cellTimeLimit && S.currentTarget !== null && S.highlightStart) {
    S.cellTimeLeft = Math.max(0, lv.cellTimeLimit - (Date.now() - S.highlightStart));
    const cell = DOM.grid && DOM.grid.children[S.currentTarget];
    if (cell && cell.classList.contains('highlighted')) {
      const bar = cell.querySelector('.timer-bar');
      if (bar) {
        const t = window.getComputedStyle(bar).transform;
        bar.style.transition = 'none';
        bar.style.transform  = (t && t !== 'none') ? t : 'scaleX(1)';
        bar.dataset.paused   = 'true';
      }
      clearTimeout(S.cellTimerId); S.cellTimerId = null;
      clearTimeout(S.cellAnimId);  S.cellAnimId  = null;
    }
  }

  if (DOM.pauseOverlay) DOM.pauseOverlay.classList.add('active');
}

function resumeGame() {
  if (!S.isPaused) return;
  S.isPaused = false;
  if (DOM.pauseOverlay) DOM.pauseOverlay.classList.remove('active');

  if (!DOM.screens.game.classList.contains('active')) return;
  const lv = LEVELS[S.currentLevel];

  // Resume per-cell timer if it had remaining time
  if (lv && lv.cellTimeLimit && S.currentTarget !== null &&
      typeof S.cellTimeLeft === 'number' && S.cellTimeLeft > 0) {
    const cell = DOM.grid && DOM.grid.children[S.currentTarget];
    if (cell && cell.classList.contains('highlighted')) {
      let bar = cell.querySelector('.timer-bar');
      if (!bar) { bar = document.createElement('div'); bar.className = 'timer-bar'; cell.appendChild(bar); }
      delete bar.dataset.paused;
      const remS = S.cellTimeLeft / 1000;
      requestAnimationFrame(() => {
        bar.style.transition = `transform ${remS}s linear`;
        requestAnimationFrame(() => { bar.style.transform = 'scaleX(0)'; });
      });
      S.highlightStart = Date.now() - (lv.cellTimeLimit - S.cellTimeLeft);
      S.cellTimerId = setTimeout(() => {
        if (S.isPaused || !cell.classList.contains('highlighted')) return;
        highlightNext();
      }, S.cellTimeLeft);
      S.cellTimeLeft = null;
      return;
    }
  }
  S.cellTimeLeft = null;
  if (S.currentTarget === null) highlightNext();
}

// ─── LEVEL SETUP ─────────────────────────────────────────────
function setupLevel() {
  const lv = LEVELS[S.currentLevel]; if (!lv) { showScreen('start'); return; }
  clearAllTimers();

  S.targetsClicked  = 0;
  S.missedThisLevel = 0;
  S.currentTarget   = null;
  S.isWaiting       = true;
  S.isPaused        = false;
  S.levelTimeLeft   = lv.overallTimeLimit !== null ? lv.overallTimeLimit : null;

  buildGrid(lv); updateHUD();
  if (DOM.pauseOverlay) DOM.pauseOverlay.classList.remove('active');

  if (lv.overallTimeLimit) S.levelInterval = setInterval(tickLevelTimer, 1000);

  setTimeout(() => {
    if (S.isPaused || !DOM.screens.game.classList.contains('active')) return;
    setTimeout(highlightNext, CFG.FIRST_CELL_DELAY);
  }, CFG.SETUP_DELAY);
}

function completeLevel() {
  clearAllTimers(); SFX.levelOk();
  // Unlock next level
  const nextUnlock = Math.min(S.currentLevel + 1, LEVELS.length - 1);
  if (getUnlockedLevel() < nextUnlock) setUnlockedLevel(nextUnlock);

  const lv = LEVELS[S.currentLevel];
  setTimeout(() => {
    if (S.currentLevel < LEVELS.length - 1) {
      renderLevelComplete(lv, false); showScreen('levelComplete');
    } else {
      renderGameComplete(); showScreen('gameComplete');
    }
  }, 500);
}

// ─── LEVEL COMPLETE RENDER ────────────────────────────────────
function renderLevelComplete(lv, timeUp) {
  const tooManyMissed = S.missedThisLevel >= Math.round(lv.targets * CFG.MISSED_REPLAY_RATIO);
  const perfect       = !timeUp && S.missedThisLevel === 0;

  // Stars
  if (DOM.lcStars) {
    if (timeUp) {
      DOM.lcStars.innerHTML = `<i class="fa-solid fa-clock" style="color:#e17055;font-size:1.8rem"></i>`;
    } else if (perfect) {
      DOM.lcStars.innerHTML = Array(3).fill('<i class="fa-solid fa-star" style="color:#ffe04b"></i>').join('');
    } else if (S.missedThisLevel <= Math.round(lv.targets * 0.2)) {
      DOM.lcStars.innerHTML = '<i class="fa-solid fa-star" style="color:#ffe04b"></i>'.repeat(2)
        + '<i class="fa-regular fa-star" style="color:#ffe04b"></i>';
    } else {
      DOM.lcStars.innerHTML = '<i class="fa-solid fa-star" style="color:#ffe04b"></i>'
        + '<i class="fa-regular fa-star" style="color:#ffe04b"></i>'.repeat(2);
    }
  }

  // Icon
  if (DOM.lcIcon) {
    DOM.lcIcon.className = `result-icon ${timeUp ? 'time' : 'win'}`;
    DOM.lcIcon.innerHTML = timeUp
      ? '<i class="fa-solid fa-hourglass-end"></i>'
      : '<i class="fa-solid fa-flag-checkered"></i>';
  }

  if (DOM.lcTitle) DOM.lcTitle.textContent = timeUp
    ? `Час вийшов — рівень "${lv.name}"`
    : `Рівень "${lv.name}" пройдено!`;

  if (DOM.lcBody) DOM.lcBody.textContent = timeUp
    ? 'Не встиг, але не здавайся — наступного разу вдасться!'
    : (perfect ? 'Бездоганно — жодного промаху!' : '');

  if (DOM.lcStats) {
    DOM.lcStats.innerHTML = `
      <div class="result-stat score-stat"><i class="fa-solid fa-star"></i> Балів: ${S.score}</div>
      <div class="result-stat missed-stat"><i class="fa-solid fa-xmark"></i> Пропущено: ${S.missedThisLevel}</div>
      ${perfect ? '<div class="result-stat perfect-stat"><i class="fa-solid fa-medal"></i> Ідеально!</div>' : ''}
    `;
  }

  // Replay callout
  if (DOM.lcReplay) {
    if (tooManyMissed) {
      DOM.lcReplay.innerHTML = `
        <i class="fa-solid fa-triangle-exclamation"></i>
        Багато промахів! Краще зіграти рівень ще раз і потренуватись.
      `;
      DOM.lcReplay.style.display = 'flex';
    } else {
      DOM.lcReplay.style.display = 'none';
    }
  }
  if (DOM.lcReplayBtn) {
    DOM.lcReplayBtn.style.display = tooManyMissed ? 'inline-flex' : 'none';
  }

  // Next button
  const isLast = S.currentLevel >= LEVELS.length - 1;
  if (DOM.lcBtn) {
    DOM.lcBtn.innerHTML = isLast
      ? '<i class="fa-solid fa-trophy"></i> Фінальний результат'
      : '<i class="fa-solid fa-arrow-right"></i> Наступний рівень';
  }
}

function nextLevel() {
  S.currentLevel++;
  showScreen('game');
  setupLevel();
}

function replayLevel() {
  // Keep score but reset level-specific state
  showScreen('game');
  setupLevel();
}

// ─── GAME COMPLETE RENDER ─────────────────────────────────────
function renderGameComplete() {
  const total = LEVELS.reduce((s,l) => s + l.targets, 0);
  const pct   = Math.round((S.score / total) * 100);
  let msg = pct >= 90 && S.missedTotal === 0 ? 'Абсолютний чемпіон! Бездоганна гра!'
          : pct >= 80  ? 'Чудова робота! Ти справжній гравець!'
          : pct >= 60  ? 'Дуже добре! Ще трохи — і будеш профі!'
          : pct >= 40  ? 'Непогано! Продовжуй тренуватися!'
          :              'Молодець, що спробував! Кожна спроба наближає до мети!';

  if (DOM.gcScore)  DOM.gcScore.textContent  = S.score;
  if (DOM.gcMsg)    DOM.gcMsg.textContent    = msg;
  if (DOM.gcMissed) DOM.gcMissed.innerHTML   = `<i class="fa-solid fa-xmark"></i> Пропущено: ${S.missedTotal}`;
}

function goToFinalFromLC() {
  renderGameComplete(); showScreen('gameComplete');
}

// ─── START SCREEN ────────────────────────────────────────────
function renderStartScreen() {
  if (!DOM.firstTimeView || !DOM.returningView) return;
  const played    = hasPlayedBefore();
  const unlocked  = getUnlockedLevel();

  DOM.firstTimeView.style.display  = played ? 'none' : '';
  DOM.returningView.style.display  = played ? '' : 'none';

  if (played) {
    // Render selectable level buttons
    DOM.returningView.innerHTML = '';
    const grid = document.createElement('div');
    grid.className = 'levels-grid';
    LEVELS.forEach((lv, i) => {
      const isLocked = i > unlocked;
      const btn = document.createElement('button');
      btn.className = 'level-select-btn';
      btn.disabled  = isLocked;
      btn.innerHTML = `
        ${isLocked
          ? `<span class="badge badge-locked"><i class="fa-solid fa-lock"></i> Заблоковано</span>`
          : `<span class="badge badge-unlocked"><i class="fa-solid fa-check"></i> Відкрито</span>`}
        <div class="lv-icon"><i class="${lv.icon}"></i></div>
        <div class="lv-name">${lv.name}</div>
        <div class="lv-desc">${levelDesc(lv)}</div>
      `;
      if (!isLocked) {
        btn.addEventListener('click', () => {
          if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume().catch(() => {});
          S.currentLevel = i;
          showScreen('game');
          setupLevel();
        });
      }
      grid.appendChild(btn);
    });
    DOM.returningView.appendChild(grid);

    // Add "start from beginning" button
    const freshBtn = document.createElement('button');
    freshBtn.className = 'btn btn-outline btn-start-fresh';
    freshBtn.innerHTML = '<i class="fa-solid fa-rotate-left"></i> Почати з першого рівня';
    freshBtn.addEventListener('click', startFromBeginning);
    DOM.returningView.appendChild(freshBtn);

  } else {
    // First time — just make sure start btn is visible
    if (DOM.startBtn) DOM.startBtn.style.display = 'inline-flex';
  }
}

function startFromBeginning() {
  if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume().catch(() => {});
  resetState();
  S.currentLevel = 0;
  showScreen('game');
  setupLevel();
}

function returnToMenu() {
  clearAllTimers();
  resetState();
  if (DOM.pauseOverlay) DOM.pauseOverlay.classList.remove('active');
  renderStartScreen();
  showScreen('start');
}

// ─── KEYBOARD ────────────────────────────────────────────────
document.addEventListener('keydown', e => {
  if (e.code === 'Space' || e.code === 'Escape') {
    e.preventDefault();
    if (!DOM.screens || !DOM.screens.game.classList.contains('active')) return;
    S.isPaused ? resumeGame() : pauseGame();
  }
});

// ─── RESIZE ──────────────────────────────────────────────────
let resizeTimer = null;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    if (!DOM.screens || !DOM.screens.game.classList.contains('active')) return;
    const lv = LEVELS[S.currentLevel]; if (!lv) return;
    clearCellTimers();
    if (S.currentTarget !== null && DOM.grid) {
      const c = DOM.grid.children[S.currentTarget];
      if (c) { c.classList.remove('highlighted'); const b = c.querySelector('.timer-bar'); if (b) b.remove(); }
    }
    S.currentTarget = null; S.isWaiting = true;
    buildGrid(lv); updateHUD();
    if (!S.isPaused) {
      const ok = (!lv.overallTimeLimit || S.levelTimeLeft > 0) && S.targetsClicked < lv.targets;
      if (ok) setTimeout(highlightNext, 600);
    }
  }, CFG.RESIZE_DELAY);
});

// ─── HELPERS ─────────────────────────────────────────────────
function levelDesc(lv) {
  const parts = [];
  if (lv.cellTimeLimit) parts.push(`${lv.cellTimeLimit/1000} с на клітинку`);
  else parts.push('Без обмежень часу');
  parts.push(`${lv.targets} цілей`);
  if (lv.overallTimeLimit) parts.push(`${lv.overallTimeLimit} с`);
  return parts.join(' · ');
}

// ─── INIT ────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  cacheDOM();

  // Start button (first-time player)
  if (DOM.startBtn) {
    DOM.startBtn.addEventListener('click', () => {
      if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume().catch(() => {});
      // Mark as played so next visit shows level selector
      if (!hasPlayedBefore()) setUnlockedLevel(0);
      S.currentLevel = 0;
      showScreen('game');
      setupLevel();
    });
  }

  // Pause / Resume
  if (DOM.pauseBtn)    DOM.pauseBtn.addEventListener('click', pauseGame);
  if (DOM.resumeBtn)   DOM.resumeBtn.addEventListener('click', resumeGame);
  if (DOM.menuFromPause) DOM.menuFromPause.addEventListener('click', returnToMenu);

  // Back to menu from topbar
  const backBtn = el('btn-back');
  if (backBtn) backBtn.addEventListener('click', () => {
    if (!S.isPaused) pauseGame();
    // Small delay so overlay shows, then allow menu click inside overlay
  });

  // Level complete buttons
  if (DOM.lcBtn) DOM.lcBtn.addEventListener('click', () => {
    if (S.currentLevel >= LEVELS.length - 1) goToFinalFromLC();
    else nextLevel();
  });
  if (DOM.lcReplayBtn) DOM.lcReplayBtn.addEventListener('click', replayLevel);

  // Menu buttons on result screens
  const menuBtns = document.querySelectorAll('.btn-to-menu');
  menuBtns.forEach(b => b.addEventListener('click', returnToMenu));

  // Restart
  const restartBtn = el('restart-btn');
  if (restartBtn) restartBtn.addEventListener('click', startFromBeginning);

  // Init start screen
  renderStartScreen();
  showScreen('start');
});
