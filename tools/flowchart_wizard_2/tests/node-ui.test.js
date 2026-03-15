const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

const root = path.join(__dirname, '..');

test('computeToolbarPlacement keeps toolbar inside viewport and above node', async () => {
  const ui = await import(pathToFileURL(path.join(root, 'modules', 'node-ui.mjs')).href);
  const placement = ui.computeToolbarPlacement({
    rect: { left: 100, top: 120, width: 80, height: 40 },
    toolbarWidth: 200,
    toolbarHeight: 54,
    viewportWidth: 320,
  });

  assert.equal(placement.left, 40);
  assert.equal(placement.top, 56);
});

test('getDeleteNodeMessage adapts for decision blocks', async () => {
  const ui = await import(pathToFileURL(path.join(root, 'modules', 'node-ui.mjs')).href);

  assert.ok(ui.getDeleteNodeMessage('decision').includes('Питання'));
  assert.ok(ui.getDeleteNodeMessage('process').includes('наступні блоки'));
});
