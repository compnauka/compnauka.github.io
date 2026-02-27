'use strict';

// ================================================================
// KLAVIО — trainer.js
// Core training logic: start lesson, handle keys, complete lesson
// ================================================================

// ----------------------------------------------------------------
// Detect which character to highlight next
// ----------------------------------------------------------------
function nextKey() {
  if (!state.taskString.length) return;
  const ch = state.taskString[0];

  // Sync layout language
  if      (/[a-zA-Z]/.test(ch))             state.lang = 'eng';
  else if (/[а-яіїєґА-ЯІЇЄҐ]/.test(ch))    state.lang = 'ua';

  layoutLow();

  const keyId = getKeyId(ch);
  if (keyId) {
    highlightKey(keyId);
    highlightFinger(keyId);
  }
}

// ----------------------------------------------------------------
// Start a lesson
// ----------------------------------------------------------------
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

  state.wpmInterval = setInterval(updateStats, 1500);
  nextKey();

  document.getElementById('level-complete').classList.remove('show');
}

// ----------------------------------------------------------------
// Correct keystroke
// ----------------------------------------------------------------
function onCorrectKey(ch) {
  Audio.keyClick();
  if (ch === ' ') Audio.spaceKey();

  state.correctChars++;
  state.streak++;
  state.maxStreak = Math.max(state.maxStreak, state.streak);

  // Streak milestone every 20 correct
  if (state.streak > 0 && state.streak % 20 === 0) {
    showStreakBurst(state.streak);
    Audio.streak(Math.floor(state.streak / 20));
  }

  state.taskString = state.taskString.slice(1);
  updateTextDisplay();
  updateProgress();
  updateStats();
  clearKeySelection();

  if (state.correctChars >= state.totalChars) {
    onLessonComplete();
  } else {
    nextKey();
  }
}

// ----------------------------------------------------------------
// Wrong keystroke
// ----------------------------------------------------------------
function onWrongKey(pressedEl) {
  Audio.error();
  state.incorrectChars++;
  state.streak = 0;
  updateStats();

  // Flash text display
  const flash = document.getElementById('error-flash');
  flash.classList.add('flash');
  setTimeout(() => flash.classList.remove('flash'), 200);

  // Shake the pressed key
  if (pressedEl) {
    pressedEl.classList.add('error');
    setTimeout(() => pressedEl.classList.remove('error'), 300);
  }
}

// ----------------------------------------------------------------
// Lesson complete
// ----------------------------------------------------------------
function onLessonComplete() {
  clearInterval(state.wpmInterval);
  clearKeySelection();
  clearHandHighlights();
  Audio.levelUp();

  const secs = state.timeStart
    ? Math.floor(Date.now() / 1000) - state.timeStart
    : 0;
  const total = state.correctChars + state.incorrectChars;
  const acc   = total > 0 ? Math.round(state.correctChars / total * 100) : 100;

  showLessonComplete({
    mins:      Math.floor(secs / 60),
    sec:       secs % 60,
    chars:     state.correctChars,
    wpm:       calcWPM(),
    acc,
    maxStreak: state.maxStreak,
  });
}

// ----------------------------------------------------------------
// Proceed to next lesson
// ----------------------------------------------------------------
function startNextLesson() {
  startTyping(state.taskNum + 1);
}

// ----------------------------------------------------------------
// Cycle difficulty
// ----------------------------------------------------------------
function cycleDifficulty() {
  state.difficulty = (state.difficulty + 1) % DIFFICULTIES.length;
  updateDifficultyBtn();
  showToast(`<i class="fas ${DIFFICULTIES[state.difficulty].iconClass}"></i> Режим: ${DIFFICULTIES[state.difficulty].label}`);
  nextKey();   // re-apply (or remove) hints with new difficulty
}

// ----------------------------------------------------------------
// Bootstrap on DOM ready
// ----------------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
  layoutLow();
  updateDifficultyBtn();
  initKeyboardEvents();
  startTyping(1);
});
