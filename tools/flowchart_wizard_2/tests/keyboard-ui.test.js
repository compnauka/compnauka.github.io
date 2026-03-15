const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

async function loadModule() {
  const modUrl = pathToFileURL(path.join(__dirname, '..', 'modules', 'keyboard-ui.mjs')).href + '?test=' + Date.now();
  return import(modUrl);
}

test('keyboard ui helpers detect blocked and delete shortcuts', async () => {
  const { shouldIgnoreGlobalKeydown, shouldTriggerDeleteShortcut } = await loadModule();
  assert.equal(shouldIgnoreGlobalKeydown({ textInput: 1, activeElement: 1, activeDialog: null }), true);
  assert.equal(shouldIgnoreGlobalKeydown({ textInput: 1, activeElement: 2, activeDialog: {} }), true);
  assert.equal(shouldIgnoreGlobalKeydown({ textInput: 1, activeElement: 2, activeDialog: null }), false);
  assert.equal(shouldTriggerDeleteShortcut({ key: 'Delete', selectionId: 'n1', wizardOpen: false }), true);
  assert.equal(shouldTriggerDeleteShortcut({ key: 'Backspace', selectionId: 'n1', wizardOpen: true }), false);
  assert.equal(shouldTriggerDeleteShortcut({ key: 'Enter', selectionId: 'n1', wizardOpen: false }), false);
});

test('keyboard ui closes all editor overlays in fixed order', async () => {
  const { closeAllEditorOverlays } = await loadModule();
  const calls = [];
  closeAllEditorOverlays({
    closeWizard: () => calls.push('wiz'),
    hideToolbar: () => calls.push('tb'),
    closeModal: id => calls.push(id),
  });
  assert.deepEqual(calls, ['wiz', 'tb', 'del-modal', 'reset-modal', 'ex-modal', 'save-modal', 'check-modal']);
});
