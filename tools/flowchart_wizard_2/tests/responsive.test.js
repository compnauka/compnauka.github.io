const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');

test('wizard type chooser keeps responsive 3-2-1 layout rules', () => {
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  const css = fs.readFileSync(path.join(root, 'style.css'), 'utf8');

  assert.ok(html.includes('id="type-card-grid" class="wizard-type-grid'));
  assert.ok((html.match(/wizard-command-card type-card/g) || []).length >= 5);

  assert.ok(css.includes('.wizard-type-grid {'));
  assert.ok(css.includes('grid-template-columns: repeat(3, minmax(0, 1fr));'));
  assert.ok(css.includes('@media (max-width: 1023px) {'));
  assert.ok(css.includes('grid-template-columns: repeat(2, minmax(0, 1fr));'));
  assert.ok(css.includes('@media (max-width: 639px) {'));
  assert.ok(css.includes('grid-template-columns: 1fr;'));
  assert.ok(css.includes('#toast {'));
  assert.ok(css.includes('max-width: min(560px, calc(100vw - 24px));'));
});
