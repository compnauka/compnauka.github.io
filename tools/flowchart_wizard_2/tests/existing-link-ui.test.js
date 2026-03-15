const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

async function loadModule() {
  const modUrl = pathToFileURL(path.join(__dirname, '..', 'modules', 'existing-link-ui.mjs')).href + '?test=' + Date.now();
  return import(modUrl);
}

test('buildExistingConnectionView returns empty state without candidates', async () => {
  const { buildExistingConnectionView } = await loadModule();
  const view = buildExistingConnectionView({
    candidates: [],
    ancestorIds: new Set(['n1']),
    typeMeta: { process: { fill: '#000', icon: 'fa-bolt', label: 'ĳ�' } },
    escHtml: value => value,
  });

  assert.equal(view.hasCandidates, false);
  assert.equal(view.hintHtml, '');
  assert.deepEqual(view.items, []);
});

test('buildExistingConnectionView includes cycle hint and escaped candidate HTML', async () => {
  const { buildExistingConnectionView } = await loadModule();
  const view = buildExistingConnectionView({
    candidates: [
      { id: 'n2', type: 'process', text: '<�������>' },
      { id: 'n3', type: 'decision', text: '�����' },
    ],
    ancestorIds: new Set(['n3']),
    typeMeta: {
      process: { fill: '#0ea5e9', icon: 'fa-bolt', label: 'ĳ�' },
      decision: { fill: '#f59e0b', icon: 'fa-question', label: '�������' },
    },
    escHtml: value => value.replaceAll('<', '&lt;').replaceAll('>', '&gt;'),
  });

  assert.equal(view.hasCandidates, true);
  assert.match(view.hintHtml, /\u0446\u0438\u043a\u043b/i);
  assert.equal(view.items.length, 2);
  assert.match(view.items[0].html, /&lt;�������&gt;/);
  assert.match(view.items[1].html, /�������/);
});

test('renderExistingConnectionView toggles empty state and binds item clicks', async () => {
  const { renderExistingConnectionView } = await loadModule();
  const listEl = {
    innerHTML: 'stale',
    children: [],
    classList: {
      removed: new Set(),
      added: new Set(),
      add(name) { this.added.add(name); },
      remove(name) { this.removed.add(name); },
    },
    appendChild(node) { this.children.push(node); },
  };
  const emptyEl = {
    classList: {
      removed: new Set(),
      added: new Set(),
      add(name) { this.added.add(name); },
      remove(name) { this.removed.add(name); },
    },
  };
  let picked = null;

  function createElement(tagName) {
    return {
      tagName,
      className: '',
      innerHTML: '',
      listeners: new Map(),
      addEventListener(type, fn) { this.listeners.set(type, fn); },
    };
  }

  renderExistingConnectionView({
    listEl,
    emptyEl,
    view: {
      hasCandidates: true,
      hintHtml: '<b>hint</b>',
      items: [{ id: 'n2', html: '<span>node</span>' }],
    },
    createElement,
    onSelect: id => { picked = id; },
  });

  assert.equal(listEl.innerHTML, '');
  assert.ok(emptyEl.classList.added.has('hidden'));
  assert.ok(listEl.classList.removed.has('hidden'));
  assert.equal(listEl.children.length, 2);
  assert.equal(listEl.children[0].tagName, 'p');
  assert.equal(listEl.children[1].tagName, 'button');
  listEl.children[1].listeners.get('click')();
  assert.equal(picked, 'n2');
});
