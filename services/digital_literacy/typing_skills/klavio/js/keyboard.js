'use strict';

// ================================================================
// KLAVIО — keyboard.js
// Layout rendering, key highlight, keyboard event handling
// ================================================================

// ----------------------------------------------------------------
// Layout rendering
// ----------------------------------------------------------------
function applyLayout(arr) {
  KEYS.forEach((id, i) => {
    const el = document.getElementById(id);
    if (el) el.textContent = arr[i] || '';
  });
}

function layoutLow() { applyLayout(state.lang === 'ua' ? CYR_LOW : ENG_LOW); }
function layoutUp()  { applyLayout(state.lang === 'ua' ? CYR_UP  : ENG_UP);  }

// ----------------------------------------------------------------
// Resolve key → HTML element id
// ----------------------------------------------------------------
function getKeyId(ch) {
  let i;
  i = CYR_UP.indexOf(ch);   if (i > -1) return KEYS[i];
  i = CYR_LOW.indexOf(ch);  if (i > -1) return KEYS[i];
  i = ENG_UP.indexOf(ch);   if (i > -1) return KEYS[i];
  i = ENG_LOW.indexOf(ch);  if (i > -1) return KEYS[i];
  return null;
}

// ----------------------------------------------------------------
// Key highlight
// ----------------------------------------------------------------
let selectedKeyId = null;

function clearKeySelection() {
  if (selectedKeyId) {
    const el = document.getElementById(selectedKeyId);
    if (el) el.classList.remove('selected');
    selectedKeyId = null;
  }
}

function highlightKey(keyId) {
  clearKeySelection();
  if (!DIFFICULTIES[state.difficulty].kbdHint) return;
  const el = document.getElementById(keyId);
  if (el) {
    el.classList.add('selected');
    selectedKeyId = keyId;
  }
}

// ----------------------------------------------------------------
// Keyboard event listeners
// ----------------------------------------------------------------
function initKeyboardEvents() {

  document.addEventListener('keydown', e => {
    // Prevent default for keys we handle
    if (['Tab','Space'].includes(e.code)) {
      e.preventDefault();
    }

    if (e.key === 'Shift') {
      const id = e.code === 'ShiftLeft' ? 'shiftleft' : 'shiftright';
      state.shiftId = id;
      const el = document.getElementById(id);
      if (el) el.classList.add('selected');
      layoutUp();
    }

    if (e.key === 'CapsLock') {
      state.capsState = !state.capsState;
      state.capsState ? layoutUp() : layoutLow();
    }
  });

  document.addEventListener('keyup', e => {
    // Start timer on first real keystroke
    if (!state.started && e.key.length === 1) {
      state.started  = true;
      state.timeStart = Math.floor(Date.now() / 1000);
    }

    const key = e.key;

    // Release shift
    if (key === 'Shift') {
      if (state.shiftId) {
        const el = document.getElementById(state.shiftId);
        if (el) el.classList.remove('selected');
        state.shiftId = null;
      }
      state.capsState ? layoutUp() : layoutLow();
      return;
    }

    // Ignore non-character keys
    const IGNORE = ['Control','Meta','Alt','AltGraph','Enter','Tab','Backspace',
                    'CapsLock','Escape','ArrowLeft','ArrowRight','ArrowUp',
                    'ArrowDown','GroupNext','Dead'];
    if (IGNORE.includes(key)) return;
    if (key.startsWith('F') && key.length <= 3) return;

    // Visual: animate the physically pressed key
    const pressedId = getKeyId(key);
    const pressedEl = pressedId ? document.getElementById(pressedId) : null;
    if (pressedEl) {
      pressedEl.classList.remove('hit');
      void pressedEl.offsetWidth;          // force reflow
      pressedEl.classList.add('hit');
      pressedEl.addEventListener('animationend',
        () => pressedEl.classList.remove('hit'), { once: true });
    }

    if (!state.taskString.length) return;

    const expected = state.taskString[0];

    if (key === expected) {
      onCorrectKey(key);
    } else {
      // Hint: wrong layout or case
      const expId = getKeyId(expected);
      if (expId === pressedId && key !== expected) {
        showToast('<i class="fas fa-arrow-up"></i> Змініть регістр!');
      } else if (pressedEl && isEng(key) && isCyr(expected)) {
        showToast('<i class="fas fa-language"></i> Перемкніть на Українську!');
      } else if (pressedEl && isCyr(key) && isEng(expected)) {
        showToast('<i class="fas fa-language"></i> Перемкніть на English!');
      }
      onWrongKey(pressedEl);
    }
  });
}

// Small helpers
function isEng(ch) { return /[a-zA-Z]/.test(ch); }
function isCyr(ch) { return /[а-яіїєґА-ЯІЇЄҐ]/.test(ch); }
