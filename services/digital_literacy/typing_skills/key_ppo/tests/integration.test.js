const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const indexHtml = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const scriptJs = fs.readFileSync(path.join(__dirname, '..', 'script.js'), 'utf8');
const gameCore = fs.readFileSync(path.join(__dirname, '..', 'game-core.js'), 'utf8');

test('start menu exposes direction and word-set selectors', () => {
    assert.match(indexHtml, /id="direction-select"/u);
    assert.match(indexHtml, /ЗЛІВА НАПРАВО/u);
    assert.match(indexHtml, /СПРАВА НАЛІВО/u);
    assert.match(indexHtml, /id="word-set-select"/u);
});

test('default start settings match the beginner classroom profile', () => {
    assert.match(indexHtml, /<option value="beginner" selected>/u);
    assert.match(indexHtml, /<option value="ltr" selected>/u);
    assert.match(indexHtml, /<option value="foundation" selected>/u);
    assert.match(indexHtml, /<option value="on">УВІМКНЕНО<\/option>/u);
});

test('result screen reports the compact set of learning metrics', () => {
    assert.match(indexHtml, /id="final-score"/u);
    assert.match(indexHtml, /id="final-accuracy"/u);
    assert.match(indexHtml, /id="final-combo"/u);
    assert.match(indexHtml, /id="final-misses"/u);
    assert.equal(/id="final-layout-errors"/.test(indexHtml), false);
});

test('exit confirmation modal is present for the stop button flow', () => {
    assert.match(indexHtml, /id="exit-confirm-menu"/u);
    assert.match(indexHtml, /id="cancel-exit-btn"/u);
    assert.match(indexHtml, /id="confirm-exit-btn"/u);
});

test('layout assist modal is present for repeated wrong keyboard layout input', () => {
    assert.match(indexHtml, /id="layout-assist-menu"/u);
    assert.match(indexHtml, /id="layout-restart-btn"/u);
    assert.match(indexHtml, /id="layout-menu-btn"/u);
});

test('html loads the words data before game-core and script', () => {
    const wordsIdx = indexHtml.indexOf('words-data.js');
    const coreIdx = indexHtml.indexOf('game-core.js');
    const scriptIdx = indexHtml.indexOf('script.js');

    assert.equal(wordsIdx >= 0, true);
    assert.equal(coreIdx > wordsIdx, true);
    assert.equal(scriptIdx > coreIdx, true);
});

test('inline onclick handlers are removed from the HTML shell', () => {
    assert.equal(/onclick\s*=/.test(indexHtml), false);
});

test('runtime script uses session storage, anti-repeat helpers, and exit confirm flow', () => {
    assert.match(scriptJs, /sessionStorage/u);
    assert.match(scriptJs, /pickRandomEntry/u);
    assert.match(scriptJs, /pushRecentEntry/u);
    assert.match(scriptJs, /openExitConfirm/u);
    assert.match(scriptJs, /closeExitConfirm/u);
    assert.match(scriptJs, /openLayoutAssist/u);
    assert.match(scriptJs, /layoutAssistThreshold/u);
});

test('game core depends on shared word data instead of embedding the full dictionary', () => {
    assert.match(gameCore, /global\.WORD_COLLECTIONS/u);
    assert.match(gameCore, /require\("\.\/words-data\.js"\)/u);
    assert.equal(gameCore.includes('Базові слова'), false);
});
