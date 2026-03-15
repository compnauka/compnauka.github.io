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
      "label: 'Питання'",
      "label: 'Ввід/Вивід'",
      "label: 'Підпрограма'",
      "label: 'Кінець'",
      "explain: 'Перевірка умови. Відповідь — тільки «Так» або «Ні». Схема розгалужується.'",
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
