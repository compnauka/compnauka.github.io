const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

async function loadModule() {
  const modUrl = pathToFileURL(path.join(__dirname, '..', 'modules', 'examples-modal-ui.mjs')).href + '?test=' + Date.now();
  return import(modUrl);
}

test('createExampleCardButton builds button with html and click handler', async () => {
  const { createExampleCardButton } = await loadModule();
  let clicked = 0;
  const doc = {
    createElement(tag) {
      return {
        tagName: tag.toUpperCase(),
        className: '',
        innerHTML: '',
        listeners: new Map(),
        addEventListener(type, fn) { this.listeners.set(type, fn); },
      };
    },
  };

  const btn = createExampleCardButton(doc, {
    bg: 'bg-sky-50',
    border: 'border-sky-200',
  }, '<div>demo</div>', () => { clicked += 1; });

  assert.equal(btn.tagName, 'BUTTON');
  assert.match(btn.className, /ex-card/);
  assert.match(btn.className, /bg-sky-50/);
  assert.equal(btn.innerHTML, '<div>demo</div>');
  btn.listeners.get('click')();
  assert.equal(clicked, 1);
});

test('isBackdropClick only returns true for modal backdrop target', async () => {
  const { isBackdropClick } = await loadModule();
  const modal = { id: 'ex-modal' };
  assert.equal(isBackdropClick(modal, modal), true);
  assert.equal(isBackdropClick({ id: 'inner' }, modal), false);
  assert.equal(isBackdropClick(modal, null), false);
});
