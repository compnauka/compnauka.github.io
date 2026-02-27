'use strict';

// ================================================================
// KLAVIО — state.js
// Single source of truth for runtime state
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
  lang:           'ua',      // 'ua' | 'eng'
  capsState:      false,
  shiftId:        null,
  difficulty:     0,         // 0=beginner, 1=student, 2=master
  wpmInterval:    null,
};

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
}
