const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

async function loadModule() {
  const modUrl = pathToFileURL(path.join(__dirname, '..', 'modules', 'toolbar-ui.mjs')).href + '?test=' + Date.now();
  return import(modUrl);
}

function makeToolbar() {
  const classes = new Set(['hidden']);
  return {
    style: { display: '' },
    classList: {
      add(name) { classes.add(name); },
      remove(name) { classes.delete(name); },
      contains(name) { return classes.has(name); },
    },
  };
}

test('toolbar ui shows and hides toolbar element', async () => {
  const { showToolbarElement, hideToolbarElement } = await loadModule();
  const toolbar = makeToolbar();
  showToolbarElement(toolbar);
  assert.equal(toolbar.classList.contains('hidden'), false);
  assert.equal(toolbar.style.display, 'flex');
  hideToolbarElement(toolbar);
  assert.equal(toolbar.classList.contains('hidden'), true);
  assert.equal(toolbar.style.display, '');
});

test('toolbar ui detects empty canvas pointer that should hide toolbar', async () => {
  const { shouldHideToolbarOnCanvasPointer } = await loadModule();
  assert.equal(shouldHideToolbarOnCanvasPointer({ onNode: null, onPlus: null, hasSelection: true }), true);
  assert.equal(shouldHideToolbarOnCanvasPointer({ onNode: {}, onPlus: null, hasSelection: true }), false);
  assert.equal(shouldHideToolbarOnCanvasPointer({ onNode: null, onPlus: {}, hasSelection: true }), false);
  assert.equal(shouldHideToolbarOnCanvasPointer({ onNode: null, onPlus: null, hasSelection: false }), false);
});
