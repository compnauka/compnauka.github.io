const test = require('node:test');
const assert = require('node:assert/strict');
const core = require('../flowchart-core.js');
const { EXAMPLE_PROJECTS } = require('../examples-data.js');

test('example projects are available for the kid editor', () => {
  assert.ok(Array.isArray(EXAMPLE_PROJECTS));
  assert.ok(EXAMPLE_PROJECTS.length >= 7);
});

test('example projects keep the intended teaching order', () => {
  assert.deepEqual(
    EXAMPLE_PROJECTS.map((example) => example.id),
    [
      'example-morning',
      'example-umbrella',
      'example-hat',
      'example-transport',
      'example-icecream',
      'example-password',
      'example-porridge',
    ],
  );
});

test('every example project parses cleanly and keeps valid ids', () => {
  for (const example of EXAMPLE_PROJECTS) {
    const parsed = core.parseProject(example.project);
    const sizedShapes = parsed.shapes.map((shape) => ({
      ...shape,
      ...core.getShapeSize(shape.type),
    }));
    const shapeIds = new Set(sizedShapes.map((shape) => shape.id));
    const shapesById = new Map(sizedShapes.map((shape) => [shape.id, shape]));
    const minLeft = Math.min(...sizedShapes.map((shape) => shape.left));

    assert.equal(parsed.diagramTitle, example.title);
    assert.ok(sizedShapes.some((shape) => shape.type === 'start-end' && shape.textRaw === 'Початок'));
    assert.ok(parsed.connections.length > 0);
    assert.ok(minLeft >= 220);
    assert.ok(parsed.connections.every((conn) => shapeIds.has(conn.from) && shapeIds.has(conn.to)));

    parsed.connections.forEach((conn) => {
      const from = shapesById.get(conn.from);
      const to = shapesById.get(conn.to);
      assert.ok(from);
      assert.ok(to);

      const routed = from.type === 'decision' && (conn.type === 'yes' || conn.type === 'no')
        ? core.getDecisionBranchRoute(from, to, conn.type === 'yes' ? 'left' : 'right', 2)
        : core.routeOrthogonal(from, to, conn.routeMode || 'auto');

      assert.ok(Array.isArray(routed.pts));
      assert.ok(routed.pts.length >= 2);
      assert.ok(routed.pts.every((pt) => Number.isFinite(pt.x) && Number.isFinite(pt.y)));
    });
  }
});

test('password example models a retry loop instead of ending on error', () => {
  const example = EXAMPLE_PROJECTS.find((item) => item.id === 'example-password');
  assert.ok(example);

  const parsed = core.parseProject(example.project);
  assert.equal(parsed.shapes.length, 6);
  assert.equal(parsed.shapes.filter((shape) => shape.textRaw === 'Кінець').length, 1);

  const shapesById = new Map(parsed.shapes.map((shape) => [
    shape.id,
    { ...shape, ...core.getShapeSize(shape.type) },
  ]));
  const retryConn = parsed.connections.find((conn) => conn.id === 'conn-shape-5-shape-2');
  assert.ok(retryConn);
  assert.equal(retryConn.from, 'shape-5');
  assert.equal(retryConn.to, 'shape-2');
  assert.equal(retryConn.routeMode, 'bypass-right');

  const route = core.routeOrthogonal(
    shapesById.get(retryConn.from),
    shapesById.get(retryConn.to),
    retryConn.routeMode,
  );
  const decision = shapesById.get('shape-3');

  assert.equal(route.exit, 'right');
  assert.equal(route.entry, 'right');
  assert.equal(route.pts.at(-1).x, shapesById.get('shape-2').left + shapesById.get('shape-2').width);
  assert.ok(route.pts[1].x > decision.left + decision.width);
});

test('password retry connection preserves bypass-right in project data', () => {
  const example = EXAMPLE_PROJECTS.find((item) => item.id === 'example-password');
  assert.ok(example);

  const parsed = core.parseProject(example.project);
  const retryConn = parsed.connections.find((conn) => conn.id === 'conn-shape-5-shape-2');
  assert.ok(retryConn);
  assert.equal(retryConn.routeMode, 'bypass-right');
});

test('hat example demonstrates an incomplete branch with a shared next step', () => {
  const example = EXAMPLE_PROJECTS.find((item) => item.id === 'example-hat');
  assert.ok(example);

  const parsed = core.parseProject(example.project);
  assert.equal(parsed.shapes.length, 6);

  const noConn = parsed.connections.find((conn) => conn.id === 'conn-shape-3-shape-5-no');
  const mergeConn = parsed.connections.find((conn) => conn.id === 'conn-shape-4-shape-5');
  assert.ok(noConn);
  assert.ok(mergeConn);
  assert.equal(noConn.to, 'shape-5');
  assert.equal(mergeConn.routeMode, 'bypass-right');
});

test('porridge example demonstrates a while loop with a left-side return path', () => {
  const example = EXAMPLE_PROJECTS.find((item) => item.id === 'example-porridge');
  assert.ok(example);

  const parsed = core.parseProject(example.project);
  assert.equal(parsed.shapes.length, 4);

  const loopConn = parsed.connections.find((conn) => conn.id === 'conn-shape-3-shape-2');
  assert.ok(loopConn);
  assert.equal(loopConn.routeMode, 'bypass-left');
  assert.equal(loopConn.from, 'shape-3');
  assert.equal(loopConn.to, 'shape-2');
});
