const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

async function loadModule() {
  const modUrl = pathToFileURL(path.join(__dirname, '..', 'modules', 'save-modal-ui.mjs')).href + '?test=' + Date.now();
  return import(modUrl);
}

test('bindSaveModalControls wires confirm, cancel and keyboard handlers', async () => {
  const { bindSaveModalControls } = await loadModule();
  let confirmed = 0;
  let closed = 0;
  const confirmButton = {};
  const cancelButton = {};
  const input = {};

  bindSaveModalControls({
    confirmButton,
    cancelButton,
    input,
    onConfirm: () => { confirmed += 1; },
    onClose: () => { closed += 1; },
  });

  confirmButton.onclick();
  cancelButton.onclick();
  input.onkeydown({ key: 'Enter', preventDefault() {} });
  input.onkeydown({ key: 'Escape', preventDefault() {} });

  assert.equal(confirmed, 2);
  assert.equal(closed, 2);
});
