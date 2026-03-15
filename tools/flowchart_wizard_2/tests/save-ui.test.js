const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

const root = path.join(__dirname, '..');

test('save ui validates short titles and builds safe filenames', async () => {
  const ui = await import(pathToFileURL(path.join(root, 'modules', 'save-ui.mjs')).href);

  assert.equal(ui.validateSaveTitle('a').ok, false);
  assert.equal(ui.validateSaveTitle('  Назва ').value, 'Назва');
  assert.equal(ui.makeDownloadFileName(' Моя:схема? '), 'Моя_схема_.png');
  assert.equal(ui.makeDownloadFileName(''), 'блок-схема.png');
});
