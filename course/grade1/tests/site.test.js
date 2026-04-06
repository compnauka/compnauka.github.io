const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const htmlFiles = ['index.html', 'lesson_1_1.html', 'lesson_1_2.html', 'offline.html'];
const cssFiles = ['style.css', 'style_lesson.css', 'tokens.css'];
const jsFiles = ['i18n.js', 'main.js', 'lesson_1_1.js', 'sw.js'];
const mojibakePattern = /(?:\u0420[\u00B0\u00B1\u0406\u0407\u0404\u0403\u0453\u045C\u045F]|\u0421[\u2013\u2014\u0403\u201A\u201E\u045C\u045F]|\u0432\u0402|\u00D1|\uFFFD)/u;

function read(file) {
    return fs.readFileSync(path.join(root, file), 'utf8');
}

test('all project files decode as utf8 without mojibake markers', () => {
    [...htmlFiles, ...cssFiles, ...jsFiles, 'manifest.json'].forEach((file) => {
        const content = read(file);
        assert.ok(content.length > 0, `${file} should not be empty`);
        assert.equal(mojibakePattern.test(content), false, `${file} contains mojibake-like text`);
    });
});

test('critical ukrainian phrases are preserved in source or i18n files', () => {
    const translations = read('i18n.js');
    assert.equal(translations.includes("\\u041A\\u043E\\u043C\\u043F'\\u044E\\u0442\\u0435\\u0440\\u043D\\u0456"), true);
    assert.equal(translations.includes("\\u041F\\u0440\\u0438\\u0432\\u0456\\u0442, \\u043C\\u0430\\u043B\\u0435\\u043D\\u044C\\u043A\\u0456 \\u0434\\u043E\\u0441\\u043B\\u0456\\u0434\\u043D\\u0438\\u043A\\u0438!"), true);
    assert.equal(translations.includes("\\u0429\\u043E \\u0442\\u0430\\u043A\\u0435 \\u043A\\u043E\\u043C\\u043F'\\u044E\\u0442\\u0435\\u0440?"), true);
    assert.equal(translations.includes("\\u0414\\u043B\\u044F \\u0447\\u043E\\u0433\\u043E \\u043F\\u043E\\u0442\\u0440\\u0456\\u0431\\u0435\\u043D \\u043A\\u043E\\u043C\\u043F'\\u044E\\u0442\\u0435\\u0440?"), true);
});

test('every html page has language, title and skip link where applicable', () => {
    htmlFiles.forEach((file) => {
        const content = read(file);
        assert.match(content, /<html lang="uk"/);
        assert.match(content, /<title>[^<]+<\/title>/);
        if (file !== 'offline.html') {
            assert.match(content, /class="skip-link"/);
            assert.match(content, /id="main-content"/);
        }
    });
});

test('pages load i18n before app scripts', () => {
    const index = read('index.html');
    const lesson = read('lesson_1_1.html');
    const lesson2 = read('lesson_1_2.html');
    const offline = read('offline.html');

    assert.match(index, /<script src="i18n\.js" defer><\/script>\s*<script src="main\.js" defer><\/script>/);
    assert.match(lesson, /<script src="i18n\.js" defer><\/script>\s*<script src="lesson_1_1\.js" defer><\/script>/);
    assert.match(lesson2, /<script src="i18n\.js" defer><\/script>\s*<script src="main\.js" defer><\/script>/);
    assert.match(offline, /<script src="i18n\.js" defer><\/script>\s*<script src="main\.js" defer><\/script>/);
});

test('home page avoids fake links and inline event handlers', () => {
    const content = read('index.html');
    assert.doesNotMatch(content, /href="#"/);
    assert.doesNotMatch(content, /\sonclick=/);
});

test('lesson page has accessible video, canvas fallback and dnd live region', () => {
    const content = read('lesson_1_1.html');
    assert.match(content, /iframe[\s\S]*data-i18n-title="video_title"/);
    assert.match(content, /canvas[\s\S]*data-i18n-aria-label="canvas_aria"/);
    assert.match(content, /id="canvas-a11y-layer"[\s\S]*aria-live="polite"/);
    assert.match(content, /<textarea id="canvas-description"[\s\S]*data-i18n-placeholder="canvas_placeholder"/);
    assert.match(content, /id="drop-feedback"[\s\S]*aria-live="polite"/);
    assert.doesNotMatch(content, /\sonclick=/);
});

test('scripts use i18n helper for runtime strings', () => {
    const lessonScript = read('lesson_1_1.js');
    const mainScript = read('main.js');
    assert.match(lessonScript, /const \{ t, applyTranslations \}/);
    assert.match(lessonScript, /t\('quiz_pool_q1'\)/);
    assert.match(lessonScript, /t\('canvas_updated'\)/);
    assert.match(mainScript, /applyTranslations\(\)/);
});

test('styles define focus-visible and reduced-motion support', () => {
    const combined = cssFiles.map(read).join('\n');
    assert.match(combined, /:focus-visible/);
    assert.match(combined, /prefers-reduced-motion: reduce/);
    assert.match(combined, /prefers-contrast: high/);
});

test('pwa shell files exist and are wired', () => {
    const indexHtml = read('index.html');
    const lessonHtml = read('lesson_1_1.html');
    const manifest = JSON.parse(read('manifest.json'));
    const sw = read('sw.js');

    assert.match(indexHtml, /<link rel="manifest" href="manifest.json">/);
    assert.match(lessonHtml, /<link rel="manifest" href="manifest.json">/);
    assert.equal(manifest.lang, 'uk');
    assert.match(sw, /offline\.html/);
});
