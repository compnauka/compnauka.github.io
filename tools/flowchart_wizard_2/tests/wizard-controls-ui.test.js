const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

async function loadModule() {
  const modUrl = pathToFileURL(path.join(__dirname, '..', 'modules', 'wizard-controls-ui.mjs')).href + '?test=' + Date.now();
  return import(modUrl);
}

function makeElement(dataset = {}) {
  return {
    dataset,
    listeners: new Map(),
    addEventListener(type, fn) { this.listeners.set(type, fn); },
  };
}

test('bindWizardControls wires type cards navigation and input shortcuts', async () => {
  const { bindWizardControls } = await loadModule();
  const typeA = makeElement({ type: 'process' });
  const typeB = makeElement({ type: 'decision' });
  const connectExistingButton = makeElement();
  const cancelButton = makeElement();
  const backTextButton = makeElement();
  const backExistingButton = makeElement();
  const okButton = makeElement();
  const textInput = makeElement();
  const calls = [];

  bindWizardControls({
    typeCards: [typeA, typeB],
    connectExistingButton,
    cancelButton,
    backTextButton,
    backExistingButton,
    okButton,
    textInput,
    onChooseType: type => calls.push(['type', type]),
    onOpenExisting: () => calls.push(['existing']),
    onCancel: () => calls.push(['cancel']),
    onBackText: () => calls.push(['back-text']),
    onBackExisting: () => calls.push(['back-existing']),
    onConfirm: () => calls.push(['confirm']),
    onInputCancel: () => calls.push(['input-cancel']),
  });

  typeA.listeners.get('click')();
  typeB.listeners.get('click')();
  connectExistingButton.listeners.get('click')();
  cancelButton.listeners.get('click')();
  backTextButton.listeners.get('click')();
  backExistingButton.listeners.get('click')();
  okButton.listeners.get('click')();
  textInput.listeners.get('keydown')({ key: 'Enter' });
  textInput.listeners.get('keydown')({ key: 'Escape' });

  assert.deepEqual(calls, [
    ['type', 'process'],
    ['type', 'decision'],
    ['existing'],
    ['cancel'],
    ['back-text'],
    ['back-existing'],
    ['confirm'],
    ['confirm'],
    ['input-cancel'],
  ]);
});
