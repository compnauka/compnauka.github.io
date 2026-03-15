const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

const root = path.join(__dirname, '..');

function makeClassList() {
  const set = new Set();
  return {
    add: (...names) => names.forEach(name => set.add(name)),
    remove: (...names) => names.forEach(name => set.delete(name)),
    contains: name => set.has(name),
  };
}

test('modal ui toggles aria-hidden and visibility classes', async () => {
  const modalUi = await import(pathToFileURL(path.join(root, 'modules', 'modal-ui.mjs')).href);
  const attrs = {};
  const el = {
    classList: makeClassList(),
    setAttribute(name, value) { attrs[name] = String(value); },
  };
  let activated = 0;
  let deactivated = 0;

  modalUi.showModalElement(el, () => { activated += 1; });
  assert.equal(attrs['aria-hidden'], 'false');
  assert.equal(el.classList.contains('hidden'), false);
  assert.equal(el.classList.contains('flex'), true);
  assert.equal(activated, 1);

  modalUi.hideModalElement(el, () => { deactivated += 1; });
  assert.equal(el.classList.contains('hidden'), true);
  assert.equal(el.classList.contains('flex'), false);
  assert.equal(deactivated, 1);
});
