const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');

const checks = [
  {
    file: 'index.html',
    expectedAny: ['Блок-схемчик'],
    forbidden: ['Рџ', 'вЂ', '????????'],
  },
  {
    file: 'PROGRESS_REPORT_2026-03-14.md',
    expectedAny: ['Проміжний звіт'],
    forbidden: ['Рџ', 'вЂ'],
  },
  {
    file: 'modules/validation.mjs',
    expectedAny: ['Початок'],
    forbidden: ['Рџ', 'вЂ', '????????'],
  },
  {
    file: 'app.mjs',
    expectedAny: [
      "label: '\\u041f\\u0438\\u0442\\u0430\\u043d\\u043d\\u044f'",
      "label: '\\u0412\\u0432\\u0456\\u0434/\\u0412\\u0438\\u0432\\u0456\\u0434'",
      "label: '\\u041f\\u0456\\u0434\\u043f\\u0440\\u043e\\u0433\\u0440\\u0430\\u043c\\u0430'",
      "label: '\\u041a\\u0456\\u043d\\u0435\\u0446\\u044c'",
      "explain: '\\u041f\\u0435\\u0440\\u0435\\u0432\\u0456\\u0440\\u043a\\u0430 \\u0443\\u043c\\u043e\\u0432\\u0438. \\u0412\\u0456\\u0434\\u043f\\u043e\\u0432\\u0456\\u0434\\u044c \\u2014 \\u0442\\u0456\\u043b\\u044c\\u043a\\u0438 \\u00ab\\u0422\\u0430\\u043a\\u00bb \\u0430\\u0431\\u043e \\u00ab\\u041d\\u0456\\u00bb. \\u0421\\u0445\\u0435\\u043c\\u0430 \\u0440\\u043e\\u0437\\u0433\\u0430\\u043b\\u0443\\u0436\\u0443\\u0454\\u0442\\u044c\\u0441\\u044f.'",
    ],
    forbidden: ['Рџ', 'вЂ', '????????'],
  },
];

test('key ukrainian text files remain readable as UTF-8', () => {
  for (const { file, expectedAny, forbidden } of checks) {
    const text = fs.readFileSync(path.join(root, file), 'utf8');
    for (const expected of expectedAny) {
      assert.ok(text.includes(expected), `${file} should contain "${expected}" when read as UTF-8`);
    }
    assert.equal(text.includes('\uFFFD'), false, `${file} should not contain replacement characters`);
    for (const marker of forbidden) {
      assert.equal(text.includes(marker), false, `${file} should not contain mojibake marker "${marker}"`);
    }
  }
});
