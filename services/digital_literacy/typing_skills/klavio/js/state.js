'use strict';

// ================================================================
// KLAVIО — state.js
// Single source of truth + localStorage persistence
// ================================================================

let state = {
  taskNum:        1,
  taskString:     '',
  totalChars:     0,
  correctChars:   0,
  incorrectChars: 0,
  streak:         0,
  maxStreak:      0,
  started:        false,
  timeStart:      0,
  lang:           'ua',
  capsState:      false,
  shiftId:        null,
  difficulty:     0,        // 0=beginner 1=student 2=master
  wpmInterval:    null,
  lessonCompleted:false,
};

// ---- Persist lesson number and difficulty across page reloads ----
function saveProgress() {
  try {
    localStorage.setItem('klavio_lesson', state.taskNum);
    localStorage.setItem('klavio_diff',   state.difficulty);
  } catch (e) {}
}

function loadProgress() {
  try {
    const lesson = parseInt(localStorage.getItem('klavio_lesson'), 10);
    const diff   = parseInt(localStorage.getItem('klavio_diff'),   10);
    if (lesson >= 1 && lesson <= exercises.length) state.taskNum   = lesson;
    if (diff   >= 0 && diff   <= 2)                state.difficulty = diff;
  } catch (e) {}
}

function resetLessonState(n) {
  state.taskNum        = n;
  state.taskString     = exercises[n - 1];
  state.totalChars     = state.taskString.length;
  state.correctChars   = 0;
  state.incorrectChars = 0;
  state.streak         = 0;
  state.maxStreak      = 0;
  state.started        = false;
  state.timeStart      = 0;
  state.lang           = 'ua';
  state.capsState      = false;
  state.shiftId        = null;
  state.lessonCompleted = false;
  saveProgress();
}
