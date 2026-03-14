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

test('cycle examples exist in EXAMPLES and validate cleanly', async () => {
  const api = await loadLogic();

  for (const id of ['ex-while', 'ex-dowhile', 'ex-for']) {
    loadExample(api, id);
    assert.equal(api.findBackEdges().size > 0, true, `${id} should contain a back-edge`);
    assert.equal(api.collectIssues().issues.length, 0, `${id} should not report validation issues`);
  }
});

test('back-edge targets are treated as reachable by validator', async () => {
  const api = await loadLogic();

  api.S.nodes = {
    n1: { id: 'n1', type: 'start', text: '???????' },
    n2: { id: 'n2', type: 'process', text: 'i = 1' },
    n3: { id: 'n3', type: 'decision', text: 'i ? 3?' },
    n4: { id: 'n4', type: 'process', text: '????????? i' },
    n5: { id: 'n5', type: 'end', text: '??????' },
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


test('render utils wrap long text with ellipsis', async () => {
  const root = path.join(__dirname, '..');
  const renderUtils = await import(pathToFileURL(path.join(root, 'modules', 'render-utils.mjs')).href);
  const wrapText = renderUtils.createWrapText();

  const lines = wrapText('very long text for checking wrapping inside flowchart nodes', 10, 2);
  assert.equal(lines.length, 2);
  assert.ok(lines[1].includes('\u2026')); 
});

test('current edge routing builds a route for upward loop edges', async () => {
  const root = path.join(__dirname, '..');
  const edgeRouting = await import(pathToFileURL(path.join(root, 'modules', 'edge-routing.mjs')).href);

  const S = {
    nodes: {
      n1: { id: 'n1', type: 'start', text: '???????' },
      n2: { id: 'n2', type: 'decision', text: 'i ? 3?' },
      n3: { id: 'n3', type: 'process', text: '???' },
      n4: { id: 'n4', type: 'end', text: '??????' },
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

