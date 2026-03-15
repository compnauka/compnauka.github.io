const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

test('comment layout supports offsets and expands for multiple lines', async () => {
  const root = path.join(__dirname, '..');
  const comments = await import(pathToFileURL(path.join(root, 'modules', 'comments.mjs')).href);
  const wrapText = () => ['line 1', 'line 2', 'line 3', 'line 4'];

  const layout = comments.getCommentLayout({
    text: 'note',
    position: { x: 100, y: 200 },
    nodeWidth: 164,
    wrapText,
    offset: { x: 12, y: 18 },
  });

  assert.ok(layout);
  assert.equal(layout.connector.x1, 182);
  assert.equal(layout.connector.x2, 266);
  assert.equal(layout.connector.y2, 218);
  assert.equal(layout.box.x, 266);
  assert.equal(layout.box.y, 174);
  assert.equal(layout.box.height, 88);
  assert.equal(layout.lines.length, 4);
});

test('comment text and offset are normalized before rendering', async () => {
  const root = path.join(__dirname, '..');
  const comments = await import(pathToFileURL(path.join(root, 'modules', 'comments.mjs')).href);

  assert.equal(comments.normalizeCommentText('  one   two  '), 'one two');
  assert.equal(comments.normalizeCommentText(''), '');
  assert.deepEqual(comments.normalizeCommentOffset({ x: 12.7, y: '9' }), { x: 13, y: 9 });
  assert.deepEqual(comments.normalizeCommentOffset({ x: 'bad', y: null }), { x: 0, y: 0 });
});

