const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const suspiciousSequences = [
    'Р вЂ™РЎ',
    'Р вЂ”Р ',
    'Р СџР ',
    'Р СњР ',
    'Р РЋР ',
    'РІР‚вЂќ',
    'РІР‚В¦',
    'РІвЂћвЂ“',
    'Гђ',
    'Г‘',
    '\uFFFD'
];

const filesToCheck = [
    'index.html',
    'script.js',
    'style.css',
    'words-data.js',
    'game-core.js',
    'PROJECT_STANDARDS.md'
];

test('critical files do not contain common mojibake or replacement sequences', () => {
    for (const relPath of filesToCheck) {
        const fullPath = path.join(__dirname, '..', relPath);
        const content = fs.readFileSync(fullPath, 'utf8');

        for (const sequence of suspiciousSequences) {
            assert.equal(
                content.includes(sequence),
                false,
                `Found suspicious sequence "${sequence}" in ${relPath}`
            );
        }
    }
});

test('key files preserve expected Ukrainian phrases', () => {
    const indexHtml = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
    const wordsData = fs.readFileSync(path.join(__dirname, '..', 'words-data.js'), 'utf8');
    const gameCore = fs.readFileSync(path.join(__dirname, '..', 'game-core.js'), 'utf8');

    assert.match(indexHtml, /ЗАХИСНИКИ НЕБА/u);
    assert.match(indexHtml, /ЗЛІВА НАПРАВО/u);
    assert.match(indexHtml, /СПРАВА НАЛІВО/u);
    assert.match(wordsData, /УКРАЇНА/u);
    assert.match(wordsData, /КЛАВІАТУРА/u);
    assert.match(gameCore, /WORD_COLLECTIONS/u);
});
