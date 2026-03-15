const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

const root = path.join(__dirname, '..');

test('empty workspace state resets editor-owned collections', async () => {
  const workspace = await import(pathToFileURL(path.join(root, 'modules', 'workspace-state.mjs')).href);
  const state = workspace.createEmptyWorkspaceState();

  assert.deepEqual(state.nodes, {});
  assert.deepEqual(state.edges, []);
  assert.equal(state.root, null);
  assert.equal(state.cnt, 0);
  assert.deepEqual(state.comments, {});
  assert.deepEqual(state.undo, []);
  assert.equal(state.wiz.open, false);
  assert.equal(state.wiz.step, 'type');
});
