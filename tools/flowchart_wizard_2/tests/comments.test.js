const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

test('comment layout is computed to the right of a node', async () => {
  const root = path.join(__dirname, '..');
  const comments = await import(pathToFileURL(path.join(root, 'modules', 'comments.mjs')).href);
  const wrapText = text => [text];

  const layout = comments.getCommentLayout({
    text: 'note',
    position: { x: 100, y: 200 },
    nodeWidth: 164,
    wrapText,
  });

  assert.ok(layout);
  assert.equal(layout.connector.x1, 182);
  assert.equal(layout.connector.x2, 262);
  assert.equal(layout.box.x, 262);
  assert.equal(layout.box.y, 178);
  assert.equal(layout.lines.length, 1);
});

test('comment text is normalized before rendering', async () => {
  const root = path.join(__dirname, '..');
  const comments = await import(pathToFileURL(path.join(root, 'modules', 'comments.mjs')).href);

  assert.equal(comments.normalizeCommentText('  one   two  '), 'one two');
  assert.equal(comments.normalizeCommentText(''), '');
});
