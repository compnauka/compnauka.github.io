const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

const root = path.join(__dirname, '..');

test('focus ui computes scroll target around node center', async () => {
  const ui = await import(pathToFileURL(path.join(root, 'modules', 'focus-ui.mjs')).href);
  const scroll = ui.getNodeFocusScroll({
    position: { x: 900, y: 500 },
    scale: 1,
    viewportWidth: 1200,
    viewportHeight: 800,
  });

  assert.deepEqual(scroll, {
    top: 164,
    left: 300,
    behavior: 'smooth',
  });
});
