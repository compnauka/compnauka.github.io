const test = require('node:test');
const assert = require('node:assert/strict');
const core = require('../flowchart-core.js');

test('getDefaultText switches second terminator to Кінець', () => {
  const shapes = [{ id: 'shape-1', type: 'start-end', textRaw: 'Початок' }];
  assert.equal(core.getDefaultText('start-end', shapes), 'Кінець');
  assert.equal(core.getDefaultText('process', shapes), 'Дія');
});

test('smartWrapText keeps decision text compact and truncates overflow', () => {
  const wrapped = core.smartWrapText('перевірити дуже довгу умову для повторення циклу', 'decision');
  const lines = wrapped.split('\n');
  assert.ok(lines.length <= 4);
  assert.ok(lines.every((line) => line.length <= 12));
  assert.ok(wrapped.includes('…'));
});

test('resolveConnectionLabel keeps automatic yes/no labels and allows custom text', () => {
  assert.equal(core.resolveConnectionLabel({ type: 'yes', label: null }), 'Так');
  assert.equal(core.resolveConnectionLabel({ type: 'no', label: undefined }), 'Ні');
  assert.equal(core.resolveConnectionLabel({ type: 'yes', label: 'Мій варіант' }), 'Мій варіант');
  assert.equal(core.resolveConnectionLabel({ type: null, label: '  ' }), '');
});

test('getDecisionBranchRoute connects upward loop branches to target sides', () => {
  const decision = { left: 220, top: 320, width: 140, height: 140, type: 'decision' };
  const target = { left: 250, top: 120, width: 150, height: 84, type: 'process' };

  const yesRoute = core.getDecisionBranchRoute(decision, target, 'left', 2);
  const noRoute = core.getDecisionBranchRoute(decision, target, 'right', 2);

  assert.equal(yesRoute.entry, 'left');
  assert.equal(noRoute.entry, 'right');
  assert.equal(yesRoute.pts.at(-1).x, target.left);
  assert.equal(noRoute.pts.at(-1).x, target.left + target.width);
  assert.ok(Math.abs(yesRoute.pts[1].x - yesRoute.pts[0].x) >= 72);
  assert.ok(Math.abs(noRoute.pts[1].x - noRoute.pts[0].x) >= 72);
});

test('getConnectionLabelPosition keeps yes/no label on outer loop segment', () => {
  const yesPoints = [
    { x: 290, y: 390 },
    { x: 170, y: 390 },
    { x: 170, y: 232 },
    { x: 250, y: 232 },
  ];
  const noPoints = [
    { x: 430, y: 390 },
    { x: 520, y: 390 },
    { x: 520, y: 232 },
    { x: 400, y: 232 },
  ];

  assert.deepEqual(core.getConnectionLabelPosition(yesPoints, 'yes'), { x: 248, y: 382 });
  assert.deepEqual(core.getConnectionLabelPosition(noPoints, 'no'), { x: 472, y: 382 });
});

test('resolveConnectionLabelOverlap nudges close labels without changing side anchor', () => {
  const baseYes = { x: 152, y: 311 };
  const baseNo = { x: 538, y: 311 };

  assert.deepEqual(
    core.resolveConnectionLabelOverlap(baseYes, 'yes', [{ x: 152, y: 311 }]),
    { x: 152, y: 263 },
  );
  assert.deepEqual(
    core.resolveConnectionLabelOverlap(baseNo, 'no', [{ x: 538, y: 311 }, { x: 538, y: 287 }]),
    { x: 538, y: 359 },
  );
});

test('routeOrthogonal chooses bottom-to-top path for stacked blocks in auto mode', () => {
  const from = { left: 100, top: 100, width: 150, height: 84, type: 'process' };
  const to = { left: 100, top: 300, width: 150, height: 84, type: 'process' };
  const routed = core.routeOrthogonal(from, to, 'auto');

  assert.equal(routed.exit, 'bottom');
  assert.equal(routed.entry, 'top');
  assert.deepEqual(routed.pts, [
    { x: 175, y: 184, side: 'bottom' },
    { x: 175, y: 300, side: 'top' },
  ]);
});

test('routeOrthogonal keeps nearly aligned stacked blocks on a straight vertical path', () => {
  const from = { left: 480, top: 90, width: 180, height: 84, type: 'start-end' };
  const to = { left: 486, top: 300, width: 168, height: 84, type: 'process' };
  const routed = core.routeOrthogonal(from, to, 'auto');

  assert.equal(routed.exit, 'bottom');
  assert.equal(routed.entry, 'top');
  assert.deepEqual(routed.pts, [
    { x: 570, y: 174, side: 'bottom' },
    { x: 570, y: 300, side: 'top' },
  ]);
});

test('routeOrthogonal bypass-left creates an outer corridor left of both blocks', () => {
  const from = { left: 320, top: 440, width: 150, height: 84, type: 'process' };
  const to = { left: 300, top: 200, width: 140, height: 140, type: 'decision' };
  const routed = core.routeOrthogonal(from, to, 'bypass-left');
  const minLeftEdge = Math.min(from.left, to.left + to.width / 2 - core.decisionVertexDistance(to) - 2);

  assert.equal(routed.exit, 'left');
  assert.equal(routed.entry, 'left');
  assert.ok(routed.pts[1].x < minLeftEdge);
  assert.equal(routed.pts[1].x, routed.pts[2].x);
});

test('routeOrthogonal bypass-right creates an outer corridor right of both blocks', () => {
  const from = { left: 120, top: 440, width: 150, height: 84, type: 'process' };
  const to = { left: 300, top: 200, width: 140, height: 140, type: 'decision' };
  const routed = core.routeOrthogonal(from, to, 'bypass-right');
  const maxRightEdge = Math.max(from.left + from.width, to.left + to.width / 2 + core.decisionVertexDistance(to) + 2);

  assert.equal(routed.exit, 'right');
  assert.equal(routed.entry, 'right');
  assert.ok(routed.pts[1].x > maxRightEdge);
  assert.equal(routed.pts[1].x, routed.pts[2].x);
});


test('serializeProject and parseProject preserve exported connection ids', () => {
  const state = {
    diagramTitle: '????',
    shapeCounter: 5,
    lastShapeType: 'decision',
    baseColors: { ...core.DEFAULT_BASE_COLORS },
    shapes: [
      { id: 'shape-1', type: 'start-end', color: '#4caf50', textRaw: '???????', left: 479, top: 83 },
      { id: 'shape-2', type: 'start-end', color: '#4caf50', textRaw: '??????', left: 296, top: 525 },
      { id: 'shape-3', type: 'process', color: '#03a9f4', textRaw: '???', left: 479, top: 193 },
      { id: 'shape-4', type: 'process', color: '#03a9f4', textRaw: '???', left: 297, top: 427 },
      { id: 'shape-5', type: 'decision', color: '#ff9800', textRaw: '??????', left: 479, top: 311 },
    ],
    connections: [
      { id: 'conn-shape-1-shape-3', from: 'shape-1', to: 'shape-3', type: null, routeMode: 'auto', label: null },
      { id: 'conn-shape-3-shape-5', from: 'shape-3', to: 'shape-5', type: null, routeMode: 'auto', label: null },
      { id: 'conn-shape-5-shape-4-yes', from: 'shape-5', to: 'shape-4', type: 'yes', routeMode: 'auto', label: null },
      { id: 'conn-shape-5-shape-3-no', from: 'shape-5', to: 'shape-3', type: 'no', routeMode: 'auto', label: null },
      { id: 'conn-shape-4-shape-2', from: 'shape-4', to: 'shape-2', type: null, routeMode: 'auto', label: null },
    ],
  };

  const serialized = core.serializeProject(state);
  const parsed = core.parseProject(JSON.stringify(serialized));

  assert.equal(parsed.shapes.length, state.shapes.length);
  assert.equal(parsed.connections.length, state.connections.length);
  assert.deepEqual(
    parsed.connections.map((conn) => conn.id),
    state.connections.map((conn) => conn.id),
  );
  assert.deepEqual(
    parsed.connections.map((conn) => conn.type),
    state.connections.map((conn) => conn.type),
  );
});
