const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');

const checks = [
  {
    file: 'index.html',
    expected: '\u0411\u043b\u043e\u043a-\u0441\u0445\u0435\u043c\u0447\u0438\u043a',
    forbidden: ['\u0420\u045f', '\u0432\u0402', '????????'],
  },
  {
    file: 'PROGRESS_REPORT_2026-03-14.md',
    expected: '\u041f\u0440\u043e\u043c\u0456\u0436\u043d\u0438\u0439 \u0437\u0432\u0456\u0442',
    forbidden: ['\u0420\u045f', '\u0432\u0402'],
  },
  {
    file: 'modules/validation.mjs',
    expected: '\u041f\u043e\u0447\u0430\u0442\u043e\u043a',
    forbidden: ['\u0420\u045f', '\u0432\u0402', '????????'],
  },
  {
    file: 'app.mjs',
    expected: '\u041f\u043e\u0447\u0430\u0442\u043e\u043a',
    forbidden: ['\u0420\u045f', '\u0432\u0402', '????????'],
  },
];

test('key ukrainian text files remain readable as UTF-8', () => {
  for (const { file, expected, forbidden } of checks) {
    const text = fs.readFileSync(path.join(root, file), 'utf8');
    assert.ok(text.includes(expected), `${file} should contain "${expected}" when read as UTF-8`);
    assert.equal(text.includes('\uFFFD'), false, `${file} should not contain replacement characters`);
    for (const marker of forbidden) {
      assert.equal(text.includes(marker), false, `${file} should not contain mojibake marker "${marker}"`);
    }
  }
});
