const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

async function loadModule() {
  const modUrl = pathToFileURL(path.join(__dirname, '..', 'modules', 'feedback-ui.mjs')).href + '?test=' + Date.now();
  return import(modUrl);
}

function makeEl() {
  const classes = new Set();
  return {
    textContent: '',
    classList: {
      add(name) { classes.add(name); },
      remove(name) { classes.delete(name); },
      contains(name) { return classes.has(name); },
    },
  };
}

test('feedback ui computes progress percent for empty, partial and complete flow', async () => {
  const { getProgressPercent } = await loadModule();
  assert.equal(getProgressPercent({ hasRoot: false, nodeCount: 0, isComplete: false }), 5);
  assert.equal(getProgressPercent({ hasRoot: true, nodeCount: 1, isComplete: false }), 5);
  assert.equal(getProgressPercent({ hasRoot: true, nodeCount: 4, isComplete: false }), 44);
  assert.equal(getProgressPercent({ hasRoot: true, nodeCount: 30, isComplete: false }), 92);
  assert.equal(getProgressPercent({ hasRoot: true, nodeCount: 6, isComplete: true }), 100);
});

test('feedback ui shows and hides toast element', async () => {
  const { showToastElement, hideToastElement } = await loadModule();
  const el = makeEl();
  showToastElement(el, 'Готово');
  assert.equal(el.textContent, 'Готово');
  assert.equal(el.classList.contains('show'), true);
  hideToastElement(el);
  assert.equal(el.classList.contains('show'), false);
});

test('feedback ui formats runtime error messages safely', async () => {
  const { getRuntimeErrorMascotHtml, getRuntimeErrorToastText } = await loadModule();
  const html = getRuntimeErrorMascotHtml('<boom>', value => value.replaceAll('<', '&lt;').replaceAll('>', '&gt;'));
  assert.match(html, /Сталася помилка:/);
  assert.match(html, /&lt;boom&gt;/);
  assert.equal(getRuntimeErrorToastText('ReferenceError: x'), 'Помилка: ReferenceError: x');
});
