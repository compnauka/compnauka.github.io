const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

async function loadModule() {
  const modUrl = pathToFileURL(path.join(__dirname, '..', 'modules', 'reset-modal-ui.mjs')).href + '?test=' + Date.now();
  return import(modUrl);
}

function makeButton() {
  return {
    listeners: new Map(),
    addEventListener(type, fn) { this.listeners.set(type, fn); },
  };
}

test('bindResetModalControls wires open cancel and confirm buttons', async () => {
  const { bindResetModalControls } = await loadModule();
  const openButton = makeButton();
  const cancelButton = makeButton();
  const confirmButton = makeButton();
  let opened = 0;
  let canceled = 0;
  let confirmed = 0;

  bindResetModalControls({
    openButton,
    cancelButton,
    confirmButton,
    onOpen: () => { opened += 1; },
    onCancel: () => { canceled += 1; },
    onConfirm: () => { confirmed += 1; },
  });

  openButton.listeners.get('click')();
  cancelButton.listeners.get('click')();
  confirmButton.listeners.get('click')();

  assert.equal(opened, 1);
  assert.equal(canceled, 1);
  assert.equal(confirmed, 1);
});
