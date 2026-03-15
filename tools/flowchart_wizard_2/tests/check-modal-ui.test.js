const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

async function loadModule() {
  const modUrl = pathToFileURL(path.join(__dirname, '..', 'modules', 'check-modal-ui.mjs')).href + '?test=' + Date.now();
  return import(modUrl);
}

function makeButton() {
  return {
    listeners: new Map(),
    addEventListener(type, fn) { this.listeners.set(type, fn); },
  };
}

test('bindCheckModalControls wires open and close button handlers', async () => {
  const { bindCheckModalControls } = await loadModule();
  const openButton = makeButton();
  const closeButton = makeButton();
  let opened = 0;
  let closed = 0;

  bindCheckModalControls({
    openButton,
    closeButton,
    onOpen: () => { opened += 1; },
    onClose: () => { closed += 1; },
  });

  openButton.listeners.get('click')();
  closeButton.listeners.get('click')();

  assert.equal(opened, 1);
  assert.equal(closed, 1);
});
