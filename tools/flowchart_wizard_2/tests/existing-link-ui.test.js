const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

async function loadModule() {
  const modUrl = pathToFileURL(path.join(__dirname, '..', 'modules', 'existing-link-ui.mjs')).href + '?test=' + Date.now();
  return import(modUrl);
}

test('buildExistingConnectionView returns empty state without candidates', async () => {
  const { buildExistingConnectionView } = await loadModule();
  const view = buildExistingConnectionView({
    candidates: [],
    ancestorIds: new Set(['n1']),
    typeMeta: { process: { fill: '#000', icon: 'fa-bolt', label: 'Дія' } },
    escHtml: value => value,
  });

  assert.equal(view.hasCandidates, false);
  assert.equal(view.hintHtml, '');
  assert.deepEqual(view.items, []);
});

test('buildExistingConnectionView includes cycle hint and escaped candidate HTML', async () => {
  const { buildExistingConnectionView } = await loadModule();
  const view = buildExistingConnectionView({
    candidates: [
      { id: 'n2', type: 'process', text: '<Приклад>' },
      { id: 'n3', type: 'decision', text: 'Умова' },
    ],
    ancestorIds: new Set(['n3']),
    typeMeta: {
      process: { fill: '#0ea5e9', icon: 'fa-bolt', label: 'Дія' },
      decision: { fill: '#f59e0b', icon: 'fa-question', label: 'Питання' },
    },
    escHtml: value => value.replaceAll('<', '&lt;').replaceAll('>', '&gt;'),
  });

  assert.equal(view.hasCandidates, true);
  assert.match(view.hintHtml, /цикл/i);
  assert.equal(view.items.length, 2);
  assert.match(view.items[0].html, /&lt;Приклад&gt;/);
  assert.match(view.items[1].html, /Питання/);
});
