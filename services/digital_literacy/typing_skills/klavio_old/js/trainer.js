'use strict';

// ================================================================
// KLAVIРћ вЂ” trainer.js
// Core training logic
// ================================================================

// ----------------------------------------------------------------
// Determine which key to highlight next
// ----------------------------------------------------------------
function nextKey() {
  if (!state.taskString.length) return;

  // Skip unsupported symbols (typically from broken source encoding)
  // so the lesson can still be completed.
  let ch = state.taskString[0];
  let keyId = getKeyId(ch);
  while (state.taskString.length && keyId == null) {
    state.taskString = state.taskString.slice(1);
    state.correctChars++;
    updateTextDisplay();
    updateProgress();
    updateStats();
    if (!state.taskString.length || state.correctChars >= state.totalChars) {
      onLessonComplete();
      return;
    }
    ch = state.taskString[0];
    keyId = getKeyId(ch);
  }

  if      (/[a-zA-Z]/.test(ch)) state.lang = 'eng';
  else if (/[А-Яа-яІіЇїЄєҐґ]/.test(ch)) state.lang = 'ua';

  layoutLow();

  if (keyId) {
    highlightKey(keyId, ch);
    highlightFinger(keyId);
  }
}

// ----------------------------------------------------------------
// Start a lesson
// ----------------------------------------------------------------
function safeStartStatsInterval() {
  if (state.wpmInterval) clearInterval(state.wpmInterval);
  state.wpmInterval = null;
  state.wpmInterval = setInterval(updateStats, 1500);
}

function startTyping(n) {
  n = Math.max(1, Math.min(n, exercises.length));

  clearKeySelection();
  clearHandHighlights();

  if (state.wpmInterval) clearInterval(state.wpmInterval);

  resetLessonState(n);
  layoutLow();

  updateTextDisplay();
  updateProgress();
  updateStats();

  safeStartStatsInterval();
  nextKey();

  closeModal();
  const lc = document.getElementById('level-complete');
  if (lc) lc.classList.remove('show');
}

// ----------------------------------------------------------------
// Correct keystroke
// ----------------------------------------------------------------
function onCorrectKey(ch) {
  if (state.lessonCompleted) return;

  if (!state.started) {
    state.started = true;
    state.timeStart = Math.floor(Date.now() / 1000);
  }

  Audio.keyClick();
  if (ch === ' ') Audio.spaceKey();

  state.correctChars++;
  state.streak++;
  state.maxStreak = Math.max(state.maxStreak, state.streak);

  if (state.streak > 0 && state.streak % 20 === 0) {
    showStreakBurst(state.streak);
    Audio.streak(Math.floor(state.streak / 20));
  }

  state.taskString = state.taskString.slice(1);
  updateTextDisplay();
  updateProgress();
  updateStats();
  clearKeySelection();

  if (!state.taskString.length || state.correctChars >= state.totalChars) {
    onLessonComplete();
  } else {
    nextKey();
  }
}

// ----------------------------------------------------------------
// Wrong keystroke
// ----------------------------------------------------------------
function onWrongKey(pressedEl) {
  if (state.lessonCompleted) return;

  Audio.error();
  state.incorrectChars++;
  state.streak = 0;
  updateStats();

  const flash = document.getElementById('error-flash');
  if (flash) {
    flash.classList.add('flash');
    setTimeout(() => flash.classList.remove('flash'), 200);
  }

  if (pressedEl) {
    pressedEl.classList.add('error');
    setTimeout(() => pressedEl.classList.remove('error'), 300);
  }
}

// ----------------------------------------------------------------
// Lesson complete
// ----------------------------------------------------------------
function onLessonComplete() {
  if (state.lessonCompleted) return;
  state.lessonCompleted = true;

  clearInterval(state.wpmInterval);
  state.wpmInterval = null;
  clearKeySelection();
  clearHandHighlights();
  Audio.levelUp();

  const secs = state.timeStart
    ? Math.floor(Date.now() / 1000) - state.timeStart : 0;
  const total = state.correctChars + state.incorrectChars;
  const acc   = total > 0 ? Math.round(state.correctChars / total * 100) : 100;

  showLessonComplete({
    mins:      Math.floor(secs / 60),
    sec:       secs % 60,
    chars:     state.correctChars,
    wpm:       calcCPM(),
    acc,
    maxStreak: state.maxStreak,
  });
}

// ----------------------------------------------------------------
// Next lesson
// ----------------------------------------------------------------
function startNextLesson() {
  const next = state.taskNum + 1;
  if (next > exercises.length) {
    showToast('<i class="fas fa-star"></i> Усі вправи виконано! Чудова робота!');
    const lc = document.getElementById('level-complete');
    if (lc) lc.classList.remove('show');
    return;
  }
  startTyping(next);
}

function retryCurrentLesson() {
  startTyping(state.taskNum);
}

// ----------------------------------------------------------------
// Cycle difficulty
// ----------------------------------------------------------------
function cycleDifficulty() {
  state.difficulty = (state.difficulty + 1) % DIFFICULTIES.length;
  saveProgress();
  updateDifficultyBtn();
  const d = DIFFICULTIES[state.difficulty];
  showToast(`<i class="fas ${d.iconClass}"></i> Режим: ${d.label}`);
  nextKey();
}


function resetProgress() {
  if (state.wpmInterval) {
    clearInterval(state.wpmInterval);
    state.wpmInterval = null;
  }

  state.difficulty = 0;
  saveProgress();
  updateDifficultyBtn();

  startTyping(1);
  showToast('<i class="fas fa-rotate-left"></i> Статистику скинуто. Починаємо знову!');
}
// ----------------------------------------------------------------
// Bootstrap on DOM ready
// ----------------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
  loadProgress();            // restore saved lesson & difficulty
  initTheme();
  layoutLow();
  updateDifficultyBtn();
  initKeyboardEvents();
  startTyping(state.taskNum);
  if (shouldShowOnboarding()) showOnboarding();
});



