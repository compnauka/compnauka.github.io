const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

async function loadModule() {
  const modUrl = pathToFileURL(path.join(__dirname, '..', 'modules', 'delete-modal-ui.mjs')).href + '?test=' + Date.now();
  return import(modUrl);
}

function makeButton() {
  return {
    listeners: new Map(),
    addEventListener(type, fn) { this.listeners.set(type, fn); },
  };
}

test('getDeleteModalState blocks deleting root and builds message for regular nodes', async () => {
  const { getDeleteModalState } = await loadModule();
  const blocked = getDeleteModalState({ selectedId: 'n1', rootId: 'n1', nodeType: 'start', getDeleteMessage: () => 'x' });
  assert.equal(blocked.blocked, true);
  assert.match(blocked.blockedMessage, /Початок/);

  const regular = getDeleteModalState({ selectedId: 'n2', rootId: 'n1', nodeType: 'decision', getDeleteMessage: type => 'msg:' + type });
  assert.equal(regular.blocked, false);
  assert.equal(regular.message, 'msg:decision');
});

test('bindDeleteModalButtons wires cancel and confirm handlers', async () => {
  const { bindDeleteModalButtons } = await loadModule();
  let canceled = 0;
  let confirmed = 0;
  const cancelButton = makeButton();
  const confirmButton = {};
  bindDeleteModalButtons({
    cancelButton,
    confirmButton,
    onCancel: () => { canceled += 1; },
    onConfirm: () => { confirmed += 1; },
  });
  cancelButton.listeners.get('click')();
  confirmButton.onclick();
  assert.equal(canceled, 1);
  assert.equal(confirmed, 1);
});
