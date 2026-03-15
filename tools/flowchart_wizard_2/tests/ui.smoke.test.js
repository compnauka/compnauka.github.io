const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

function makeClassList(owner) {
  const set = new Set();
  return {
    add: (...names) => { names.forEach(name => set.add(name)); owner.className = [...set].join(' '); },
    remove: (...names) => { names.forEach(name => set.delete(name)); owner.className = [...set].join(' '); },
    toggle: (name, force) => {
      if (force === true) set.add(name);
      else if (force === false) set.delete(name);
      else if (set.has(name)) set.delete(name);
      else set.add(name);
      owner.className = [...set].join(' ');
      return set.has(name);
    },
    contains: name => set.has(name),
  };
}

function makeElement(doc, tag = 'div') {
  return {
    tagName: tag.toUpperCase(), ownerDocument: doc, children: [], parentNode: null, style: {}, dataset: {}, attributes: {},
    eventListeners: new Map(), className: '', innerHTML: '', textContent: '', value: '', disabled: false,
    offsetWidth: 180, offsetHeight: 54, offsetParent: {}, clientWidth: 1280, clientHeight: 720, scrollLeft: 0, scrollTop: 0,
    appendChild(child) { child.parentNode = this; this.children.push(child); return child; },
    insertBefore(child, before) { child.parentNode = this; const i = this.children.indexOf(before); if (i === -1) this.children.push(child); else this.children.splice(i, 0, child); return child; },
    removeChild(child) { const i = this.children.indexOf(child); if (i !== -1) this.children.splice(i, 1); child.parentNode = null; return child; },
    remove() { if (this.parentNode) this.parentNode.removeChild(this); },
    setAttribute(name, value) { const next = String(value); this.attributes[name] = next; if (name === 'id') this.id = next; if (name.startsWith('data-')) this.dataset[name.slice(5).replace(/-([a-z])/g, (_, c) => c.toUpperCase())] = next; },
    getAttribute(name) { return this.attributes[name]; },
    hasAttribute(name) { return Object.prototype.hasOwnProperty.call(this.attributes, name); },
    removeAttribute(name) { delete this.attributes[name]; },
    addEventListener(type, listener) { const list = this.eventListeners.get(type) || []; list.push(listener); this.eventListeners.set(type, list); },
    dispatch(type, event = {}) { (this.eventListeners.get(type) || []).forEach(listener => listener({ target: this, currentTarget: this, preventDefault() {}, stopPropagation() {}, ...event })); },
    querySelector(selector) { return this.querySelectorAll(selector)[0] || null; },
    querySelectorAll(selector) {
      const out = [];
      const match = node => selector === '[data-plus]' ? Object.hasOwn(node.attributes, 'data-plus') : selector === '[data-nid]' ? Object.hasOwn(node.attributes, 'data-nid') : selector.startsWith('[data-comment-for="') ? node.attributes['data-comment-for'] === selector.slice(19, -2) : selector.startsWith('[data-nid="') ? node.attributes['data-nid'] === selector.slice(11, -2) : selector.startsWith('.') ? node.classList.contains(selector.slice(1)) : false;
      const walk = node => node.children.forEach(child => { if (match(child)) out.push(child); walk(child); });
      walk(this); return out;
    },
    closest(selector) { let node = this; while (node) { if (selector === '[data-plus]' && Object.hasOwn(node.attributes, 'data-plus')) return node; if (selector === '[data-nid]' && Object.hasOwn(node.attributes, 'data-nid')) return node; if (selector === '[data-comment-for]' && Object.hasOwn(node.attributes, 'data-comment-for')) return node; node = node.parentNode; } return null; },
    focus() { if (doc) doc.activeElement = this; }, select() {}, setPointerCapture() {},
    getBoundingClientRect() { return { left: 0, top: 0, width: this.offsetWidth, height: this.offsetHeight }; },
    getBBox() { return { x: 760, y: 120, width: 220, height: 56 }; },
    scrollTo(options = {}) { if (typeof options.left === 'number') this.scrollLeft = options.left; if (typeof options.top === 'number') this.scrollTop = options.top; },
  };
}

async function boot() {
  const elements = new Map();
  const confettiCtx = { clearRect() {}, fillRectCalls: 0, fillRect() { this.fillRectCalls += 1; }, scale() {}, drawImage() {}, save() {}, restore() {}, translate() {}, rotate() {} };
  const doc = {
    activeElement: null,
    getElementById(id) {
      if (!elements.has(id)) {
        const el = makeElement(doc);
        el.id = id; el.classList = makeClassList(el);
        if (id === 'fc') el.style.width = '1700px';
        if (id === 'canvas-area') { el.clientWidth = 1280; el.clientHeight = 720; }
        if (id === 'node-tb') { el.classList.add('hidden'); el.offsetWidth = 280; }
        if (id.endsWith('-modal') || id === 'wizard-panel') el.classList.add('hidden');
        if (id === 'prog-fill') el.style.width = '5%';
        if (id === 'cfc') el.getContext = () => confettiCtx;
        elements.set(id, el);
      }
      return elements.get(id);
    },
    querySelectorAll(selector) {
      if (selector !== '.type-card[data-type]') return [];
      return ['process', 'decision', 'input-output', 'subroutine', 'end'].map(type => { const btn = makeElement(doc, 'button'); btn.classList = makeClassList(btn); btn.dataset.type = type; return btn; });
    },
    createElement(tag) { const el = makeElement(doc, tag); el.classList = makeClassList(el); return el; },
    createElementNS(_ns, tag) { const el = makeElement(doc, tag); el.classList = makeClassList(el); return el; },
    addEventListener() {}, contains(node) { return Boolean(node); },
  };
  const prev = { document: global.document, window: global.window, HTMLElement: global.HTMLElement, requestAnimationFrame: global.requestAnimationFrame, setTimeout: global.setTimeout, clearTimeout: global.clearTimeout, innerWidth: global.innerWidth, innerHeight: global.innerHeight };
  global.document = doc;
  global.window = { document: doc, visualViewport: null, prompt(_m, value) { return value ?? ''; }, addEventListener() {}, removeEventListener() {} };
  global.HTMLElement = function HTMLElement() {};
  global.requestAnimationFrame = fn => { fn(); return 1; };
  global.setTimeout = fn => { fn(); return 1; };
  global.clearTimeout = () => {};
  global.innerWidth = 1280;
  global.innerHeight = 720;
  ['fc','svg-wrap','canvas-area','layer-title','layer-edges','layer-nodes','layer-plus','header-title-input','btn-undo','node-tb','mascot-msg','mascot-toggle','mascot','btn-edit-node','btn-comment-node','btn-del-node','step-type-badge','merge-suggestion','merge-hint-text','btn-merge-sibling','wizard-live','wizard-panel','text-inp','explain-content','step-type','step-explain','step-existing','btn-connect-exist','existing-list','no-exist-msg','btn-cancel-wiz','btn-back-text','btn-back-exist','btn-ok','btn-reset','reset-cancel','reset-confirm','del-modal','reset-modal','check-modal','save-modal','del-cancel','del-confirm','check-list','check-summary','btn-check-close','ex-list','btn-examples','btn-ex-close','ex-modal','btn-save','save-title-inp','save-confirm','save-cancel','btn-zi','btn-zo','btn-fit','prog-fill','toast','cfc','del-msg','btn-check'].forEach(id => doc.getElementById(id));
  const url = pathToFileURL(path.join(__dirname, '..', 'app.mjs')).href + '?smoke=' + Date.now() + Math.random();
  await import(url);
  return { doc, confettiCtx, cleanup() { Object.assign(global, prev); } };
}

test('bootstrap renders start node and plus', async () => {
  const env = await boot();
  try {
    assert.ok(env.doc.getElementById('layer-nodes').children.length >= 1);
    assert.ok(env.doc.getElementById('layer-plus').children.length >= 2);
  } finally { env.cleanup(); }
});

test('example click loads while example and closes modal', async () => {
  const env = await boot();
  try {
    const exList = env.doc.getElementById('ex-list');
    const whileCard = exList.children.find(child => child.innerHTML.includes('Рахуємо до 5'));
    assert.ok(whileCard);
    whileCard.dispatch('click');
    assert.equal(env.doc.getElementById('header-title-input').value, 'Рахуємо до 5');
    assert.ok(env.doc.getElementById('layer-nodes').children.length >= 6);
    assert.ok(env.doc.getElementById('layer-edges').children.length >= 6);
    assert.equal(env.doc.getElementById('ex-modal').classList.contains('hidden'), true);
  } finally { env.cleanup(); }
});

test('plus opens wizard', async () => {
  const env = await boot();
  try {
    const plusButton = env.doc.getElementById('layer-plus').children.find(child => child.attributes['data-plus'] === '1');
    assert.ok(plusButton);
    plusButton.dispatch('pointerdown');
    assert.equal(env.doc.getElementById('wizard-panel').style.transform, 'translateY(0)');
    assert.equal(env.doc.getElementById('wizard-panel').attributes['aria-hidden'], 'false');
    assert.equal(env.doc.getElementById('mascot').classList.contains('wiz-open'), true);
  } finally { env.cleanup(); }
});

test('examples are listed in the expected teaching order', async () => {
  const env = await boot();
  try {
    const titles = env.doc.getElementById('ex-list').children.map(child => {
      const match = child.innerHTML.match(/text-base">([^<]+)</);
      return match ? match[1] : '';
    });
    assert.deepEqual(titles, [
      'Ранок школяра',
      'Чи брати парасольку?',
      'Прибирання кімнати',
      'Вибір транспорту',
      'Перевірка паролю',
      'Купівля морозива',
      'Рахуємо до 5',
      'Вгадай число',
      'Таблиця множення на 2',
      'Знайти суму масиву',
    ]);
  } finally { env.cleanup(); }
});

test('completed examples validate cleanly and render teaching comments', async () => {
  const env = await boot();
  try {
    const exList = env.doc.getElementById('ex-list');

    const branchCard = exList.children.find(child => child.innerHTML.includes('Чи брати парасольку?'));
    assert.ok(branchCard);
    branchCard.dispatch('click');
    assert.ok(env.confettiCtx.fillRectCalls > 0, 'completed example should trigger confetti');
    assert.ok(env.doc.getElementById('layer-nodes').querySelector('[data-comment-for="n3"]'));
    env.doc.getElementById('btn-check').dispatch('click');
    assert.equal(env.doc.getElementById('check-summary').textContent, 'Помилок не знайдено. Схема виглядає добре.');

    const whileCard = exList.children.find(child => child.innerHTML.includes('Рахуємо до 5'));
    assert.ok(whileCard);
    whileCard.dispatch('click');
    assert.ok(env.doc.getElementById('layer-nodes').querySelector('[data-comment-for="n2"]'));
    assert.ok(env.doc.getElementById('layer-nodes').querySelector('[data-comment-for="n3"]'));
    assert.ok(env.doc.getElementById('layer-nodes').querySelector('[data-comment-for="n5"]'));

    const forCard = exList.children.find(child => child.innerHTML.includes('Таблиця множення на 2'));
    assert.ok(forCard);
    forCard.dispatch('click');
    assert.ok(env.doc.getElementById('layer-nodes').querySelector('[data-comment-for="n2"]'));
    assert.ok(env.doc.getElementById('layer-nodes').querySelector('[data-comment-for="n3"]'));
    assert.ok(env.doc.getElementById('layer-nodes').querySelector('[data-comment-for="n5"]'));

    const dowhileCard = exList.children.find(child => child.innerHTML.includes('Вгадай число'));
    assert.ok(dowhileCard);
    dowhileCard.dispatch('click');
    assert.equal(env.doc.getElementById('layer-nodes').querySelectorAll('[data-nid]').length >= 6, true);
    assert.ok(env.doc.getElementById('layer-nodes').querySelector('[data-comment-for="n2"]'));
    assert.ok(env.doc.getElementById('layer-nodes').querySelector('[data-comment-for="n3"]'));
    env.doc.getElementById('btn-check').dispatch('click');
    assert.equal(env.doc.getElementById('check-summary').textContent, 'Помилок не знайдено. Схема виглядає добре.');

    const linearCard = exList.children.find(child => child.innerHTML.includes('Ранок школяра'));
    assert.ok(linearCard);
    linearCard.dispatch('click');
    assert.equal(env.doc.getElementById('layer-nodes').querySelectorAll('[data-comment-for="n1"]').length, 0);
    assert.equal(env.doc.getElementById('layer-nodes').querySelectorAll('[data-comment-for="n2"]').length, 0);
    assert.equal(env.doc.getElementById('layer-nodes').querySelectorAll('[data-comment-for="n3"]').length, 0);
  } finally { env.cleanup(); }
});

test('clicking a rendered comment shows full comment text in toast', async () => {
  const env = await boot();
  try {
    const exList = env.doc.getElementById('ex-list');
    const subCard = exList.children.find(child => child.innerHTML.includes('Знайти суму масиву'));
    assert.ok(subCard);
    subCard.dispatch('click');

    const comment = env.doc.getElementById('layer-nodes').querySelector('[data-comment-for="n3"]');
    assert.ok(comment);

    env.doc.getElementById('fc').dispatch('pointerdown', { target: comment, clientX: 10, clientY: 10 });
    env.doc.getElementById('fc').dispatch('pointerup', { target: comment, clientX: 10, clientY: 10 });

    assert.equal(env.doc.getElementById('toast').textContent.includes('Підпрограма'), true);
  } finally { env.cleanup(); }
});
