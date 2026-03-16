const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const suspiciousSequences = [
  'Р’С',
  'Р—Р±',
  'РџС',
  'РќРµ',
  'РЎРє',
  'вЂ”',
  'вЂ¦',
  'Р™Р',
  'С‰Р',
];

const filesToCheck = [
  'index.html',
  'script.js',
  'flowchart-core.js',
  'manual.html',
];

test('critical source files do not contain common mojibake sequences', () => {
  for (const relPath of filesToCheck) {
    const fullPath = path.join(__dirname, '..', relPath);
    const content = fs.readFileSync(fullPath, 'utf8');
    for (const sequence of suspiciousSequences) {
      assert.equal(
        content.includes(sequence),
        false,
        `Found suspicious sequence "${sequence}" in ${relPath}`,
      );
    }
  }
});
