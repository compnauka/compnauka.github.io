const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

async function loadModule() {
  const modUrl = pathToFileURL(path.join(__dirname, '..', 'modules', 'check-list-ui.mjs')).href + '?test=' + Date.now();
  return import(modUrl);
}

function makeRow() {
  return {
    disabled: false,
    listeners: new Map(),
    addEventListener(type, fn) { this.listeners.set(type, fn); },
  };
}

test('bindCheckIssueRow binds click for issues with node target', async () => {
  const { bindCheckIssueRow, hasCheckIssueTarget } = await loadModule();
  let focused = null;
  const row = makeRow();
  const issue = { nodeId: 'n7' };
  assert.equal(hasCheckIssueTarget(issue), true);
  bindCheckIssueRow(row, issue, { onFocusIssue: id => { focused = id; } });
  row.listeners.get('click')();
  assert.equal(focused, 'n7');
  assert.equal(row.disabled, false);
});

test('bindCheckIssueRow disables rows without node target', async () => {
  const { bindCheckIssueRow, hasCheckIssueTarget } = await loadModule();
  const row = makeRow();
  const issue = { nodeId: null };
  assert.equal(hasCheckIssueTarget(issue), false);
  bindCheckIssueRow(row, issue, { onFocusIssue: () => {} });
  assert.equal(row.disabled, true);
  assert.equal(row.listeners.has('click'), false);
});
