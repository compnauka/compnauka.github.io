const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

const root = path.join(__dirname, '..');

test('wizard state factories return stable state shapes', async () => {
  const wizardState = await import(pathToFileURL(path.join(root, 'modules', 'wizard-state.mjs')).href);

  assert.deepEqual(wizardState.createClosedWizardState(), {
    open: false,
    step: 'type',
    pid: null,
    plbl: null,
    type: null,
    editId: null,
  });

  assert.deepEqual(wizardState.createInsertWizardState('n2', 'yes'), {
    open: true,
    step: 'type',
    pid: 'n2',
    plbl: 'yes',
    type: null,
    editId: null,
  });

  assert.deepEqual(wizardState.createEditWizardState('process', 'n4'), {
    open: true,
    step: 'explain',
    pid: null,
    plbl: null,
    type: 'process',
    editId: 'n4',
  });
});
