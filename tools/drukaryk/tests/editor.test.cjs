const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

function setup() {
    const elements = new Map();
    const writes = [];
    const commands = [];
    class Element {
        constructor() {
            this.children = [];
            this.dataset = {};
            this.style = { setProperty() {} };
            this.attributes = {};
            this.classes = new Set();
            this.classList = {
                toggle: (key, on) => on ? this.classes.add(key) : this.classes.delete(key),
                contains: key => this.classes.has(key),
                add: key => this.classes.add(key),
                remove: key => this.classes.delete(key)
            };
            this.innerHTML = '';
        }
        set innerHTML(value) { this.html = value; this.text = value.replace(/<[^>]*>/g, ''); }
        get innerHTML() { return this.html; }
        set innerText(value) { this.text = value; this.html = value.replace(/&/g, '&amp;').replace(/</g, '&lt;'); }
        get innerText() { return this.text; }
        get textContent() { return this.text; }
        set textContent(value) { this.innerText = String(value); }
        focus() { document.activeElement = this; }
        contains(node) { return node === this; }
        appendChild(node) { this.children.push(node); }
        setAttribute(key, value) { this.attributes[key] = value; }
        getAttribute(key) { return this.attributes[key]; }
        querySelectorAll() { return []; }
        addEventListener() {}
        click() {}
        remove() {}
    }
    const document = {
        activeElement: null,
        createElement: () => new Element(),
        getElementById(id) {
            if (!elements.has(id)) elements.set(id, new Element());
            return elements.get(id);
        },
        execCommand: (...args) => commands.push(args),
        queryCommandState: () => false,
        queryCommandValue: () => '',
        body: new Element()
    };
    const editor = document.getElementById('editor');
    editor.nodeType = 1;
    const range = { commonAncestorContainer: editor, cloneRange() { return this; } };
    let selected = '';
    let selectionResets = 0;
    const selection = {
        rangeCount: 1, isCollapsed: true,
        getRangeAt: () => range,
        toString: () => selected,
        removeAllRanges() { selectionResets++; },
        addRange() {}
    };
    const window = { addEventListener() {}, getSelection: () => selection };
    const context = vm.createContext({
        window, document, Blob,
        localStorage: { setItem: (...args) => writes.push(args) },
        setTimeout: () => 1, clearTimeout() {},
        URL: { createObjectURL(blob) { context.blob = blob; return 'blob:test'; }, revokeObjectURL() {} },
        FileReader: class { readAsText(file) { this.onload({ target: { result: file.content } }); } }
    });
    vm.runInContext(fs.readFileSync(path.join(__dirname, '../script.js'), 'utf8'), context);
    const { Editor, App, Config, Sanitizer } = window;
    Editor.el = editor;
    // These tests exercise controls and persistence orchestration, not HTML sanitization.
    Sanitizer.sanitize = value => value;
    App.toast = () => {};
    return { Editor, App, Config, editor, document, elements, writes, commands, context,
        select: value => { selected = value; }, resets: () => selectionResets };
}

test('formatting keeps a live caret so pending color survives the next command', () => {
    const t = setup();
    t.Editor.exec('foreColor', '#3B82F6');
    t.Editor.setSize('5');
    assert.equal(t.resets(), 0);
    assert.deepEqual(t.commands, [['foreColor', false, '#3B82F6'], ['fontSize', false, '5']]);
});

test('a full document still allows replacing selected text and rejects extra emoji', () => {
    const t = setup();
    t.editor.innerText = 'а'.repeat(t.Config.maxChars);
    assert.equal(t.Editor.canInsert('б'), false);
    t.Editor.insertEmoji('🐌');
    assert.equal(t.commands.length, 0);
    t.select('аа');
    assert.equal(t.Editor.canInsert('🐌'), true);
    t.Editor.insertEmoji('🐌');
    assert.deepEqual(t.commands[0], ['insertText', false, '🐌']);
});

test('the editor announces both inactive and active states', () => {
    const t = setup();
    t.Editor.updateFocusState();
    assert.equal(t.elements.get('editor-focus-text').textContent, 'Натисни тут, щоб друкувати');
    t.editor.focus();
    t.Editor.updateFocusState();
    assert.equal(t.elements.get('editor-focus-text').textContent, 'Можна друкувати');
    assert(t.elements.get('editor-shell').classes.has('is-focused'));
});

test('failed automatic saves can be retried and successful saves are deduplicated', () => {
    const t = setup();
    t.editor.innerText = 'Історія';
    vm.runInContext('localStorage.setItem = () => { throw new Error("quota"); }', t.context);
    t.App.saveToLocal();
    assert.equal(t.App._lastSaved, '');
    t.context.localStorage.setItem = (...args) => t.writes.push(args);
    t.App.saveToLocal();
    t.App.saveToLocal();
    assert.equal(t.writes.length, 1);
    assert.equal(t.writes[0][1], 'Історія');
});

test('file import asks before replacing a story and leaves it intact on rejection', () => {
    const t = setup();
    t.editor.innerText = 'Поточна історія';
    let actions;
    t.App.showModal = (_title, _message, choices) => { actions = choices; };
    t.App.loadFile({ target: { files: [{ name: 'story.txt', size: 20, content: 'Нова історія' }] } });
    assert.equal(t.editor.innerText, 'Поточна історія');
    actions[1].action();
    assert.equal(t.editor.innerText, 'Поточна історія');
    actions[0].action();
    assert.equal(t.editor.innerText, 'Нова історія');
});

test('oversized and unsupported files do not replace the current story', () => {
    const t = setup();
    t.editor.innerText = 'Залишити';
    for (const file of [
        { name: 'large.txt', size: 500001 },
        { name: 'image.png', size: 1 },
        { name: 'long.txt', size: 8000, content: 'а'.repeat(t.Config.maxChars + 1) }
    ]) t.App.loadFile({ target: { files: [file] } });
    assert.equal(t.editor.innerText, 'Залишити');
});

test('TXT and HTML exports contain the story and use their matching media types', async () => {
    const t = setup();
    t.editor.innerHTML = '<b>Моя історія</b>';
    t.App.download('txt');
    assert.equal(await t.context.blob.text(), 'Моя історія');
    assert.equal(t.context.blob.type, 'text/plain;charset=utf-8');
    t.App.download('html');
    assert.match(await t.context.blob.text(), /id="exported-content"[^>]*><b>Моя історія<\/b>/);
    assert.equal(t.context.blob.type, 'text/html;charset=utf-8');
});
