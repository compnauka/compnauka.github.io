const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

test('history snapshot restores comments and nodes', async () => {
  const root = path.join(__dirname, '..');
  const history = await import(pathToFileURL(path.join(root, 'modules', 'history.mjs')).href);

  const S = {
    nodes: { n1: { id: 'n1', text: 'A' } },
    edges: [],
    root: 'n1',
    cnt: 1,
    title: 'Flow',
    manual: {},
    baseX: {},
    baseY: {},
    rankY: {},
    rankH: {},
    pos: { n1: { x: 1, y: 2 } },
    ranks: {},
    comments: { n1: 'memo' },
    commentPos: { n1: { x: 22, y: 14 } },
    undo: [],
    sel: 'n1',
    issues: [{ code: 'x' }],
    issuesByNode: { n1: { code: 'x' } },
  };

  const snapshot = history.createStateSnapshot(S);
  history.pushUndoSnapshot(S, snapshot, 40);

  S.nodes = {};
  S.comments = {};
  S.commentPos = {};
  S.title = 'Changed';

  const prev = history.popUndoSnapshot(S);
  history.restoreStateSnapshot(S, prev);

  assert.equal(S.nodes.n1.text, 'A');
  assert.equal(S.comments.n1, 'memo');
  assert.deepEqual(S.commentPos.n1, { x: 22, y: 14 });
  assert.equal(S.title, 'Flow');
  assert.equal(S.sel, null);
  assert.deepEqual(S.issues, []);
});

