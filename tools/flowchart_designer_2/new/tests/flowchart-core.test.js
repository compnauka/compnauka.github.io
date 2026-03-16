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

  assert.deepEqual(core.getConnectionLabelPosition(yesPoints, 'yes'), { x: 152, y: 311 });
  assert.deepEqual(core.getConnectionLabelPosition(noPoints, 'no'), { x: 538, y: 311 });
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
