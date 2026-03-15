const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

async function loadModule() {
  const modUrl = pathToFileURL(path.join(__dirname, '..', 'modules', 'wizard-panel-ui.mjs')).href + '?test=' + Date.now();
  return import(modUrl);
}

function makeClassList() {
  return {
    added: new Set(),
    removed: new Set(),
    toggled: [],
    add(name) { this.added.add(name); },
    remove(name) { this.removed.add(name); },
    toggle(name, force) { this.toggled.push([name, force]); },
  };
}

test('wizard panel ui renders badge and step visibility', async () => {
  const { renderWizardBadge, showWizardStepUi } = await loadModule();
  const badgeEl = { textContent: '', className: '', classList: makeClassList() };
  const steps = {
    'step-type': { classList: makeClassList(), attrs: {}, setAttribute(name, value) { this.attrs[name] = value; } },
    'step-explain': { classList: makeClassList(), attrs: {}, setAttribute(name, value) { this.attrs[name] = value; } },
    'step-existing': { classList: makeClassList(), attrs: {}, setAttribute(name, value) { this.attrs[name] = value; } },
  };
  const liveEl = { textContent: '' };

  renderWizardBadge(badgeEl, { text: '+ branch', className: 'badge-yes' });
  assert.equal(badgeEl.textContent, '+ branch');
  assert.equal(badgeEl.className, 'badge-yes');
  assert.ok(badgeEl.classList.removed.has('hidden'));

  showWizardStepUi({
    stepIds: ['step-type', 'step-explain', 'step-existing'],
    currentStep: 'explain',
    getElement: id => steps[id],
    liveEl,
    liveText: 'Explain step',
  });

  assert.deepEqual(steps['step-type'].classList.toggled[0], ['hidden', true]);
  assert.deepEqual(steps['step-explain'].classList.toggled[0], ['hidden', false]);
  assert.equal(steps['step-explain'].attrs['aria-hidden'], 'false');
  assert.equal(liveEl.textContent, 'Explain step');
});

test('wizard panel ui opens and closes panel with mascot state', async () => {
  const { openWizardPanelUi, closeWizardPanelUi } = await loadModule();
  const panel = { style: {}, attrs: {}, offsetHeight: 240, setAttribute(name, value) { this.attrs[name] = value; } };
  const mascotEl = { style: {}, classList: makeClassList() };
  const mascotToggleEl = { style: {} };
  const calls = [];

  openWizardPanelUi({
    panel,
    mascotEl,
    mascotToggleEl,
    focusTarget: { id: 'input' },
    activateFocus: (el, focusTarget) => calls.push(['open', el, focusTarget]),
    measure: fn => fn(),
  });

  assert.equal(panel.style.transform, 'translateY(0)');
  assert.equal(panel.attrs['aria-hidden'], 'false');
  assert.ok(mascotEl.classList.added.has('wiz-open'));
  assert.equal(mascotToggleEl.style.opacity, '0');
  assert.equal(mascotEl.style.bottom, '250px');
  assert.equal(mascotToggleEl.style.bottom, '250px');
  assert.equal(calls[0][0], 'open');

  closeWizardPanelUi({
    panel,
    mascotEl,
    mascotToggleEl,
    deactivateFocus: el => calls.push(['close', el]),
  });

  assert.equal(panel.style.transform, 'translateY(110%)');
  assert.ok(mascotEl.classList.removed.has('wiz-open'));
  assert.equal(mascotEl.style.bottom, '18px');
  assert.equal(mascotToggleEl.style.bottom, '16px');
  assert.equal(calls[1][0], 'close');
});

