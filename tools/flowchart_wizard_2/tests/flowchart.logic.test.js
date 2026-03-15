const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { pathToFileURL } = require('node:url');

function between(src, startMarker, endMarker) {
  const start = src.indexOf(startMarker);
  if (start === -1) throw new Error(`Start marker not found: ${startMarker}`);
  const end = src.indexOf(endMarker, start);
  if (end === -1) throw new Error(`End marker not found: ${endMarker}`);
  return src.slice(start, end);
}

async function loadLogic() {
  const root = path.join(__dirname, '..');
  const examplesMod = await import(pathToFileURL(path.join(root, 'modules', 'examples.mjs')).href);
  const graphMod = await import(pathToFileURL(path.join(root, 'modules', 'graph.mjs')).href);
  const validationMod = await import(pathToFileURL(path.join(root, 'modules', 'validation.mjs')).href);
  const mascotMod = await import(pathToFileURL(path.join(root, 'modules', 'mascot.mjs')).href);
  const src = fs.readFileSync(path.join(root, 'app.mjs'), 'utf8');

  const S = { nodes: {}, edges: [], root: null, cnt: 0, wiz: { open: false, step: 'type', pid: null, plbl: null } };
  const edgeCache = graphMod.createEdgeCacheState();
  const invalidateEdgeCache = () => graphMod.invalidateEdgeCache(edgeCache);
  const outEdges = id => graphMod.outEdges(S, edgeCache, id);
  const inEdges = id => graphMod.inEdges(S, edgeCache, id);
  const ancestors = id => graphMod.ancestors(S, edgeCache, id);
  const descendants = startId => graphMod.descendants(S, edgeCache, startId);
  const openEnds = () => graphMod.openEnds(S, edgeCache);
  const isDone = () => graphMod.isDone(S, edgeCache);
  const hasIncompleteIf = () => graphMod.hasIncompleteIf(S, edgeCache);
  const findBackEdges = () => graphMod.findBackEdges(S, edgeCache);
  const collectIssues = () => validationMod.collectIssues(S, { inEdges, outEdges, findBackEdges });

  const mascotNode = { innerHTML: '' };
  const sandbox = {
    module: { exports: {} },
    exports: {},
    console,
    S,
    $, 
    openEnds,
    isDone,
    hasIncompleteIf,
    findBackEdges,
    getMascotHtml: mascotMod.getMascotHtml,
  };

  function $(id) {
    if (id === 'mascot-msg') return mascotNode;
    throw new Error(`Unexpected DOM lookup in test: ${id}`);
  }

  const mascotCode = between(src, 'function mascot()', "$('mascot-toggle').addEventListener") + '\nmodule.exports = { mascot };';
  vm.runInNewContext(mascotCode, sandbox, { filename: 'app.mjs' });

  return {
    EXAMPLES: examplesMod.EXAMPLES,
    S,
    invalidateEdgeCache,
    openEnds,
    isDone,
    collectIssues,
    findBackEdges,
    ancestors,
    descendants,
    mascot: sandbox.module.exports.mascot,
    __mascotNode: mascotNode,
  };
}

function loadExample(api, id) {
  const ex = api.EXAMPLES.find(item => item.id === id);
  assert.ok(ex, `Example ${id} should exist`);
  api.S.nodes = Object.fromEntries(ex.nodes.map(node => [node.id, { ...node }]));
  api.S.edges = ex.edges.map(edge => ({ ...edge }));
  api.S.root = ex.root;
  api.invalidateEdgeCache();
  return ex;
}

test('existing linear and merge examples remain valid', async () => {
  const api = await loadLogic();

  loadExample(api, 'ex-linear');
  assert.equal(api.collectIssues().issues.length, 0);

  loadExample(api, 'ex-merge');
  assert.equal(api.collectIssues().issues.length, 0);
});

test('subroutine example exists and validates cleanly', async () => {
  const api = await loadLogic();

  const ex = loadExample(api, 'ex-sub');
  assert.equal(api.collectIssues().issues.length, 0);
  assert.equal(ex.nodes.some(node => node.type === 'subroutine'), true);
});

test('cycle examples exist in EXAMPLES and validate cleanly', async () => {
  const api = await loadLogic();

  for (const id of ['ex-while', 'ex-dowhile', 'ex-for']) {
    loadExample(api, id);
    assert.equal(api.findBackEdges().size > 0, true, `${id} should contain a back-edge`);
    assert.equal(api.collectIssues().issues.length, 0, `${id} should not report validation issues`);
  }
});

test('dowhile example has output node on yes-branch before end', async () => {
  const api = await loadLogic();

  const ex = api.EXAMPLES.find(item => item.id === 'ex-dowhile');
  assert.ok(ex, 'ex-dowhile should exist');

  const yesEdge = ex.edges.find(e => e.label === 'yes');
  assert.ok(yesEdge, 'yes-edge should exist from decision');

  const yesTarget = ex.nodes.find(n => n.id === yesEdge.to);
  assert.ok(yesTarget, 'yes-branch target node should exist');
  assert.equal(
    yesTarget.type,
    'input-output',
    'yes-branch should lead to output node, not directly to end'
  );
  assert.ok(
    yesTarget.text.toLowerCase().includes('вгадав'),
    'yes-branch output should congratulate the user'
  );

  loadExample(api, 'ex-dowhile');
  assert.equal(api.collectIssues().issues.length, 0, 'ex-dowhile should have no validation issues');
});

test('back-edge targets are treated as reachable by validator', async () => {
  const api = await loadLogic();

  api.S.nodes = {
    n1: { id: 'n1', type: 'start', text: '\u041f\u043e\u0447\u0430\u0442\u043e\u043a' },
    n2: { id: 'n2', type: 'process', text: 'i = 1' },
    n3: { id: 'n3', type: 'decision', text: 'i ? 3?' },
    n4: { id: 'n4', type: 'process', text: '\u0412\u0438\u0432\u0435\u0441\u0442\u0438 i' },
    n5: { id: 'n5', type: 'end', text: '\u041a\u0456\u043d\u0435\u0446\u044c' },
  };
  api.S.edges = [
    { from: 'n1', to: 'n2', label: null },
    { from: 'n2', to: 'n3', label: null },
    { from: 'n3', to: 'n4', label: 'yes' },
    { from: 'n4', to: 'n3', label: null },
    { from: 'n3', to: 'n5', label: 'no' },
  ];
  api.S.root = 'n1';
  api.invalidateEdgeCache();

  const issues = api.collectIssues().issues.map(issue => issue.code);
  assert.equal(issues.includes('unreachable'), false);
  assert.equal(issues.includes('no-input'), false);
});

test('mascot mentions loops while an unfinished cycle is being built', async () => {
  const api = await loadLogic();

  loadExample(api, 'ex-while');
  api.S.edges = api.S.edges.filter(edge => !(edge.from === 'n3' && edge.label === 'no'));
  api.invalidateEdgeCache();

  api.mascot();
  assert.ok(api.__mascotNode.innerHTML.includes('fa-rotate')); 
});

test('incomplete if example validates and mascot explains it', async () => {
  const api = await loadLogic();

  loadExample(api, 'ex-if-only');
  assert.equal(api.collectIssues().issues.length, 0);

  api.mascot();
  assert.ok(api.__mascotNode.innerHTML.includes('fa-code-branch')); 
});


test('connectableNodes lets a missing decision branch merge into an existing end node', async () => {
  const root = path.join(__dirname, '..');
  const src = fs.readFileSync(path.join(root, 'app.mjs'), 'utf8');
  const graphMod = await import(pathToFileURL(path.join(root, 'modules', 'graph.mjs')).href);

  const S = {
    nodes: {
      n1: { id: 'n1', type: 'start', text: '\u041f\u043e\u0447\u0430\u0442\u043e\u043a' },
      n2: { id: 'n2', type: 'decision', text: '\u041a\u0456\u043c\u043d\u0430\u0442\u0430 \u0431\u0440\u0443\u0434\u043d\u0430?' },
      n3: { id: 'n3', type: 'process', text: '\u041f\u0440\u0438\u0431\u0440\u0430\u0442\u0438 \u043a\u0456\u043c\u043d\u0430\u0442\u0443' },
      n4: { id: 'n4', type: 'end', text: '\u041a\u0456\u043d\u0435\u0446\u044c' },
    },
    edges: [
      { from: 'n1', to: 'n2', label: null },
      { from: 'n2', to: 'n3', label: 'yes' },
      { from: 'n3', to: 'n4', label: null },
    ],
    ranks: { n1: 0, n2: 1, n3: 2, n4: 3 },
  };
  const edgeCache = graphMod.createEdgeCacheState();
  const sandbox = {
    module: { exports: {} },
    exports: {},
    S,
    descendants: startId => graphMod.descendants(S, edgeCache, startId),
    outEdges: id => graphMod.outEdges(S, edgeCache, id),
  };

  const code = between(src, 'function connectableNodes(pid, lbl) {', 'function pruneUnreachable()') + '\nmodule.exports = { connectableNodes };';
  vm.runInNewContext(code, sandbox, { filename: 'app.mjs' });

  const candidates = sandbox.module.exports.connectableNodes('n2', 'no');
  assert.ok(candidates.some(node => node.id === 'n4'));
});

test('app helpers keep validation and loop aliases wired', async () => {
  const root = path.join(__dirname, '..');
  const src = fs.readFileSync(path.join(root, 'app.mjs'), 'utf8');
  const wizardMod = await import(pathToFileURL(path.join(root, 'modules', 'wizard.mjs')).href);

  assert.ok(src.includes('function findBackEdges()'));
  assert.ok(src.includes('function collectIssues()'));
  assert.ok(src.includes('function issueColor(level)'));
  assert.ok(src.includes('function issueHint(issue)'));
  assert.ok(src.includes('function findSiblingOpenEnd(pid, lbl)'));
  assert.ok(src.includes('function connectableNodes(pid, lbl)'));
  assert.ok(src.includes("import { buildShape as buildSvgShape, pathSegments, createWrapText } from './modules/render-utils.mjs';"));
  assert.equal(src.includes('pathSegmentsImported'), false);
  assert.equal(wizardMod.getExplainBorderClass('subroutine'), 'border-teal-200 bg-teal-50');
});

test('render utils wrap long text with ellipsis', async () => {
  const root = path.join(__dirname, '..');
  const renderUtils = await import(pathToFileURL(path.join(root, 'modules', 'render-utils.mjs')).href);
  const wrapText = renderUtils.createWrapText();

  const lines = wrapText('very long text for checking wrapping inside flowchart nodes', 10, 2);
  assert.equal(lines.length, 2);
  assert.ok(lines[1].includes('\u2026')); 
});

test('render utils build subroutine shape with side rails', async () => {
  const root = path.join(__dirname, '..');
  const renderUtils = await import(pathToFileURL(path.join(root, 'modules', 'render-utils.mjs')).href);

  const makeNode = (tag, attrs = {}) => ({
    tagName: tag,
    attrs: { ...attrs },
    children: [],
    setAttribute(name, value) { this.attrs[name] = value; },
    appendChild(child) { this.children.push(child); },
  });

  const shape = renderUtils.buildShape(
    makeNode,
    { NODE_W: 164, NODE_H: 58, DIAMOND_HALF: 72, IO_W: 180 },
    'subroutine',
    100,
    200,
    '#0f766e',
    '#0d5f58',
    2.5
  );

  assert.equal(shape.tagName, 'g');
  assert.equal(shape.children.length, 3);
  assert.deepEqual(shape.children.map(child => child.tagName), ['rect', 'line', 'line']);
});

test('decision edge labels stay attached to the routed branch segment', async () => {
  const root = path.join(__dirname, '..');
  const wizardMod = await import(pathToFileURL(path.join(root, 'modules', 'wizard.mjs')).href);

  const horizontal = wizardMod.getDecisionEdgeLabelPosition({
    pts: [
      { x: 900, y: 300 },
      { x: 948, y: 300 },
      { x: 948, y: 560 },
    ]
  }, 'no');
  assert.deepEqual(horizontal, { x: 924, y: 300 });

  const vertical = wizardMod.getDecisionEdgeLabelPosition({
    pts: [
      { x: 760, y: 320 },
      { x: 760, y: 388 },
    ]
  }, 'yes');
  assert.deepEqual(vertical, { x: 732, y: 354 });
});

test('current edge routing builds a route for upward loop edges', async () => {
  const root = path.join(__dirname, '..');
  const edgeRouting = await import(pathToFileURL(path.join(root, 'modules', 'edge-routing.mjs')).href);

  const S = {
    nodes: {
      n1: { id: 'n1', type: 'start', text: '\u041f\u043e\u0447\u0430\u0442\u043e\u043a' },
      n2: { id: 'n2', type: 'decision', text: 'i ? 3?' },
      n3: { id: 'n3', type: 'process', text: '\u0414\u0456\u044f' },
      n4: { id: 'n4', type: 'end', text: '\u041a\u0456\u043d\u0435\u0446\u044c' },
    },
    edges: [
      { from: 'n1', to: 'n2', label: null },
      { from: 'n2', to: 'n3', label: 'yes' },
      { from: 'n3', to: 'n2', label: null },
      { from: 'n2', to: 'n4', label: 'no' },
    ],
    pos: {
      n1: { x: 850, y: 100 },
      n2: { x: 850, y: 250 },
      n3: { x: 560, y: 410 },
      n4: { x: 1140, y: 410 },
    }
  };

  const route = edgeRouting.computeEdgeRoute({
    S,
    e: { from: 'n3', to: 'n2', label: null },
    edgeOccupancy: [],
    nodeW: id => S.nodes[id]?.type === 'input-output' ? 180 : S.nodes[id]?.type === 'decision' ? 144 : 164,
    nodeH: id => S.nodes[id]?.type === 'decision' ? 144 : 58,
    constants: { CX: 850, DIAMOND_HALF: 72, EDGE_STUB: 28, EDGE_END_STUB: 36, EDGE_LANE_GAP: 92, EDGE_HIT_PAD: 18 },
  });

  assert.ok(route);
  assert.ok(Array.isArray(route.pts));
  assert.ok(route.pts.length >= 2);
});



