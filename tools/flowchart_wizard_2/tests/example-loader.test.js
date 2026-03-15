const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

async function loadModule() {
  const modUrl = pathToFileURL(path.join(__dirname, '..', 'modules', 'example-loader.mjs')).href + '?test=' + Date.now();
  return import(modUrl);
}

test('example loader applies example state into workspace-owned fields', async () => {
  const { applyExampleState } = await loadModule();
  const state = {
    nodes: { old: 1 }, edges: [{ from: 'a', to: 'b' }], root: 'old', cnt: 9,
    undo: [1], sel: 'n1', pos: { n1: { x: 1, y: 2 } }, ranks: { n1: 1 },
    manual: { n1: { dx: 4 } }, baseX: { n1: 10 }, baseY: { n1: 20 }, rankY: { 1: 30 }, rankH: { 1: 40 },
    comments: { n1: 'old comment' }, commentPos: { n1: { x: 8, y: 9 } },
  };
  const exampleState = {
    nodes: { n1: { id: 'n1', type: 'start', text: 'start' } },
    edges: [{ from: 'n1', to: 'n2', label: null }],
    root: 'n1',
    cnt: 2,
    comments: { n1: 'new comment' },
  };

  applyExampleState(state, exampleState);

  assert.equal(state.nodes, exampleState.nodes);
  assert.equal(state.edges, exampleState.edges);
  assert.equal(state.root, 'n1');
  assert.equal(state.cnt, 2);
  assert.deepEqual(state.undo, []);
  assert.equal(state.sel, null);
  assert.deepEqual(state.pos, {});
  assert.deepEqual(state.ranks, {});
  assert.deepEqual(state.manual, {});
  assert.deepEqual(state.baseX, {});
  assert.deepEqual(state.baseY, {});
  assert.deepEqual(state.rankY, {});
  assert.deepEqual(state.rankH, {});
  assert.equal(state.comments, exampleState.comments);
  assert.deepEqual(state.commentPos, {});
});

test('example loader formats loaded toast text', async () => {
  const { getExampleLoadedToastText } = await loadModule();
  assert.equal(getExampleLoadedToastText('\u0420\u0430\u0445\u0443\u0454\u043c\u043e \u0434\u043e 5'), '\u041f\u0440\u0438\u043a\u043b\u0430\u0434 \u00ab\u0420\u0430\u0445\u0443\u0454\u043c\u043e \u0434\u043e 5\u00bb \u0437\u0430\u0432\u0430\u043d\u0442\u0430\u0436\u0435\u043d\u043e!');
});


