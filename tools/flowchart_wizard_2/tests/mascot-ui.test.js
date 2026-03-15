const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

async function loadModule() {
  const modUrl = pathToFileURL(path.join(__dirname, '..', 'modules', 'mascot-ui.mjs')).href + '?test=' + Date.now();
  return import(modUrl);
}

function makeElement() {
  const set = new Set();
  return {
    innerHTML: '',
    classList: {
      toggle(name) {
        if (set.has(name)) set.delete(name);
        else set.add(name);
      },
      contains(name) {
        return set.has(name);
      },
    },
  };
}

test('renderMascotMessage writes html into target element', async () => {
  const { renderMascotMessage } = await loadModule();
  const el = makeElement();
  renderMascotMessage(el, '<b>demo</b>');
  assert.equal(el.innerHTML, '<b>demo</b>');
});

test('toggleMascotVisibility toggles visible class and returns current state', async () => {
  const { toggleMascotVisibility } = await loadModule();
  const el = makeElement();
  assert.equal(toggleMascotVisibility(el), true);
  assert.equal(el.classList.contains('visible'), true);
  assert.equal(toggleMascotVisibility(el), false);
  assert.equal(el.classList.contains('visible'), false);
});
