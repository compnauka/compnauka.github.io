const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

const root = path.join(__dirname, '..');

test('check ui helpers build summary and icon metadata', async () => {
  const ui = await import(pathToFileURL(path.join(root, 'modules', 'check-ui.mjs')).href);

  assert.equal(
    ui.getCheckSummaryText({ issueCount: 0, errors: 0, warnings: 0 }),
    'Помилок не знайдено. Схема виглядає добре.'
  );
  assert.equal(
    ui.getCheckSummaryText({ issueCount: 3, errors: 1, warnings: 2 }),
    'Знайдено: 1 критичних, 2 підказок.'
  );
  assert.ok(ui.getCheckSuccessHtml().includes('fa-circle-check'));
  assert.equal(ui.getCheckIssueMeta('error').rowClass, 'error');
  assert.equal(ui.getCheckIssueMeta('warn').rowClass, 'warn');
});
