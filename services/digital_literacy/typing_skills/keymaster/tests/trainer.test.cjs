const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const html = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
const source = [...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)].at(-1)[1];

function element(tagName = 'DIV') {
  const classes = new Set();
  return {
    tagName, textContent: '', innerHTML: '', value: '', children: [], listeners: {},
    classList: {
      add: c => classes.add(c), remove: c => classes.delete(c),
      toggle(c, on) { on ? classes.add(c) : classes.delete(c); }
    },
    addEventListener(name, fn) { this.listeners[name] = fn; },
    appendChild(child) { this.children.push(child); },
    blur() { this.blurred = true; }, closest() { return null; },
    parentElement: { classList: { add() {}, remove() {} }, offsetWidth: 100 }
  };
}

function setup() {
  const nodes = new Map();
  const timers = new Map();
  let id = 0;
  const context = vm.createContext({
    document: {
      documentElement: element(),
      getElementById(name) {
        if (!nodes.has(name)) nodes.set(name, element());
        return nodes.get(name);
      },
      createElement: () => element(), addEventListener() {}
    },
    window: { addEventListener() {} }, navigator: { maxTouchPoints: 0 },
    setTimeout(fn, delay) { timers.set(++id, { fn, delay }); return id; },
    clearTimeout(id) { timers.delete(id); }
  });
  vm.runInContext(source + '\n globalThis.trainer = app; globalThis.shortcuts = SHORTCUTS;', context);
  return { app: context.trainer, shortcuts: context.shortcuts, nodes, timers };
}

function key(code, extra = {}) {
  return { code, ctrlKey: false, shiftKey: false, altKey: false, metaKey: false,
    repeat: false, target: element(), preventDefault() { this.prevented = true; }, ...extra };
}

test('Ctrl+N remains in reference but is excluded from every training pool', () => {
  const { app, shortcuts, nodes } = setup();
  const n = shortcuts.findIndex(s => s.keys.code === 'KeyN');
  assert.ok(nodes.get('reference-table').children.some(row => row.innerHTML.includes('Ctrl + N')));
  for (const cat of ['all', ...new Set(shortcuts.map(s => s.cat)), 'unknown']) {
    app.state.trainCategory = cat;
    assert.ok(!app.getPoolIndices().includes(n), cat);
    assert.ok(app.getPoolIndices().length);
  }
});

test('all trainable shortcuts accept exact modifiers and reject extra modifiers', () => {
  const { app, shortcuts } = setup();
  app.startNewGame();
  shortcuts.forEach((s, index) => {
    if (s.trainable === false) return;
    app.state.currentIndex = index;
    app.state.isBlocked = false;
    const input = key(s.keys.code, { ctrlKey: !!s.keys.ctrl, shiftKey: !!s.keys.shift, altKey: !!s.keys.alt });
    const correct = app.state.correctAttempts;
    app.handleGlobalKeyDown(key(s.keys.code, { ...input, shiftKey: !input.shiftKey }));
    assert.equal(app.state.correctAttempts, correct, s.label);
    app.handleGlobalKeyDown(input);
    assert.equal(app.state.correctAttempts, correct + 1, s.label);
  });
});

test('pausing a solved task cannot award points twice; unsolved task survives pause', () => {
  const { app, shortcuts, timers } = setup();
  app.startNewGame();
  const index = app.state.currentIndex;
  app.pauseGame(true);
  app.resumeGame();
  assert.equal(app.state.currentIndex, index);
  assert.equal(app.dom.catBadge.textContent, shortcuts[index].cat);
  app.handleSuccess();
  const score = app.state.score;
  app.pauseGame(true);
  assert.ok(![...timers.values()].some(t => t.delay === 1000));
  app.resumeGame();
  assert.notEqual(app.state.currentIndex, index);
  assert.equal(app.state.score, score);
  assert.equal(app.state.isBlocked, false);
});

test('category changes replace stale tasks during play, pause, and success delay', () => {
  for (const mode of ['playing', 'paused', 'solved']) {
    const { app, shortcuts, nodes } = setup();
    app.startNewGame();
    if (mode === 'paused') app.pauseGame(false);
    if (mode === 'solved') app.handleSuccess();
    const menu = nodes.get('train-category');
    menu.value = 'Робота з файлами';
    menu.listeners.change();
    assert.equal(menu.blurred, true);
    if (mode === 'paused') app.resumeGame();
    assert.equal(shortcuts[app.state.currentIndex].cat, menu.value);
    assert.equal(app.state.isBlocked, false);
  }
});

test('reference view cannot resume or score the hidden game', () => {
  const { app } = setup();
  app.startNewGame();
  app.switchTab('reference');
  const esc = key('Escape');
  app.handleGlobalKeyDown(esc);
  app.handleGlobalKeyDown(key('KeyA', { ctrlKey: true }));
  assert.equal(app.state.isPaused, true);
  assert.equal(app.state.totalAttempts, 0);
  assert.equal(esc.prevented, undefined);
});

test('repeat Escape, modifiers, lock keys, composition and focused controls do not score', () => {
  const { app } = setup();
  app.startNewGame();
  for (const code of ['ControlLeft', 'ShiftRight', 'AltLeft', 'MetaLeft', 'CapsLock', 'NumLock', 'ScrollLock']) {
    app.handleGlobalKeyDown(key(code));
  }
  app.handleGlobalKeyDown(key('Escape', { repeat: true }));
  app.handleGlobalKeyDown(key('KeyA', { ctrlKey: true, metaKey: true }));
  app.handleGlobalKeyDown(key('KeyA', { isComposing: true }));
  app.handleGlobalKeyDown(key('KeyA', { target: element('SELECT') }));
  app.handleGlobalKeyDown(key('Space', { target: { closest: () => element('BUTTON') } }));
  assert.equal(app.state.totalAttempts, 0);
  assert.equal(app.state.isPaused, false);
});

test('success timer advances once and held keys cannot score again', () => {
  const { app, shortcuts, timers } = setup();
  app.startNewGame();
  const old = app.state.currentIndex;
  const s = shortcuts[old];
  const input = key(s.keys.code, { ctrlKey: !!s.keys.ctrl, shiftKey: !!s.keys.shift, altKey: !!s.keys.alt });
  app.handleGlobalKeyDown(input);
  app.handleGlobalKeyDown(input);
  assert.equal(app.state.correctAttempts, 1);
  const next = [...timers.values()].find(t => t.delay === 1000);
  next.fn();
  assert.notEqual(app.state.currentIndex, old);
  app.handleGlobalKeyDown(key(shortcuts[app.state.currentIndex].keys.code, { repeat: true }));
  assert.equal(app.state.totalAttempts, 1);
});
