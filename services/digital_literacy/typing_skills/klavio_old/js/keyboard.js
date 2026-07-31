'use strict';

// ================================================================
// KLAVIО — keyboard.js
// Layout rendering, key highlight, keyboard event handling
// ================================================================

function applyLayout(arr) {
  KEYS.forEach((id, i) => {
    const el = document.getElementById(id);
    if (el) el.textContent = arr[i] || '';
  });
}

function layoutLow() { applyLayout(state.lang === 'ua' ? CYR_LOW : ENG_LOW); }
function layoutUp()  { applyLayout(state.lang === 'ua' ? CYR_UP  : ENG_UP);  }

// ----------------------------------------------------------------
// Resolve character → key HTML element id
// ----------------------------------------------------------------
function getKeyId(ch) {
  let i;
  i = CYR_UP.indexOf(ch);  if (i > -1) return KEYS[i];
  i = CYR_LOW.indexOf(ch); if (i > -1) return KEYS[i];
  i = ENG_UP.indexOf(ch);  if (i > -1) return KEYS[i];
  i = ENG_LOW.indexOf(ch); if (i > -1) return KEYS[i];
  return null;
}

// ----------------------------------------------------------------
// Key highlight (keyboard hint)
// ----------------------------------------------------------------
const selectedKeyIds = new Set();

function clearKeySelection() {
  selectedKeyIds.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.remove('selected');
  });
  selectedKeyIds.clear();
}

function markKeySelected(keyId) {
  if (!keyId) return;
  const el = document.getElementById(keyId);
  if (!el) return;
  el.classList.add('selected');
  selectedKeyIds.add(keyId);
}

function keyRequiresShift(ch) {
  const maps = [
    [CYR_UP, CYR_LOW],
    [ENG_UP, ENG_LOW],
  ];
  for (const [up, low] of maps) {
    const i = up.indexOf(ch);
    if (i > -1 && low[i] !== ch) return true;
  }
  return false;
}

function pickOppositeShiftKey(keyId) {
  const info = FINGER_MAP[keyId];
  if (!info) return 'shiftright';
  const entry = Array.isArray(info[0]) ? info[0] : info;
  return entry[0] === 'left' ? 'shiftright' : 'shiftleft';
}

function highlightKey(keyId, expectedChar) {
  clearKeySelection();
  if (!DIFFICULTIES[state.difficulty].kbdHint) return;
  markKeySelected(keyId);
  if (expectedChar && keyRequiresShift(expectedChar)) {
    markKeySelected(pickOppositeShiftKey(keyId));
  }
}

// ----------------------------------------------------------------
// Keyboard event listeners
// ----------------------------------------------------------------
function initKeyboardEvents() {

  document.addEventListener('keydown', e => {
    if (['Tab', 'Space'].includes(e.code)) e.preventDefault();

    if (e.key === 'Shift') {
      const id = e.code === 'ShiftLeft' ? 'shiftleft' : 'shiftright';
      state.shiftId = id;
      const el = document.getElementById(id);
      if (el) el.classList.add('pressed');
      layoutUp();
    }

    if (e.key === 'CapsLock') {
      state.capsState = !state.capsState;
      state.capsState ? layoutUp() : layoutLow();
    }
  });

  document.addEventListener('keyup', e => {
    const key = e.key;

    // Release Shift
    if (key === 'Shift') {
      if (state.shiftId) {
        const el = document.getElementById(state.shiftId);
        if (el) el.classList.remove('pressed');
        state.shiftId = null;
      }
      state.capsState ? layoutUp() : layoutLow();
      return;
    }

    // Ignore non-character keys
    const IGNORE = ['Control','Meta','Alt','AltGraph','Enter','Tab','Backspace',
                    'CapsLock','Escape','ArrowLeft','ArrowRight','ArrowUp',
                    'ArrowDown','GroupNext','Dead','F1','F2','F3','F4','F5',
                    'F6','F7','F8','F9','F10','F11','F12'];
    if (IGNORE.includes(key)) return;
    if (key.length > 1) return;

    // Animate the physically pressed key
    const pressedId = getKeyId(key);
    const pressedEl = pressedId ? document.getElementById(pressedId) : null;
    if (pressedEl) {
      pressedEl.classList.remove('hit');
      void pressedEl.offsetWidth;
      pressedEl.classList.add('hit');
      pressedEl.addEventListener('animationend',
        () => pressedEl.classList.remove('hit'), { once: true });
    }

    if (state.lessonCompleted || !state.taskString.length) return;

    const expected = state.taskString[0];

    if (key === expected) {
      onCorrectKey(key);
    } else {
      // Hint messages for layout/case mismatch
      const expId = getKeyId(expected);
      if (expId === pressedId && key !== expected) {
        showToast('<i class="fas fa-arrow-up"></i> Змініть регістр!');
      } else if (pressedEl && isEng(key) && isCyr(expected)) {
        showToast('<i class="fas fa-language"></i> Перемкніть на Українську!');
      } else if (pressedEl && isCyr(key) && isEng(expected)) {
        showToast('<i class="fas fa-language"></i> Switch to English!');
      }
      onWrongKey(pressedEl);
    }
  });
}

function isEng(ch) { return /[a-zA-Z]/.test(ch); }
function isCyr(ch) { return /[а-яіїєґА-ЯІЇЄҐ]/.test(ch); }
