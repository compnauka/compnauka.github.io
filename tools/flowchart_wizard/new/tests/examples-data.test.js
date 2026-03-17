const test = require('node:test');
const assert = require('node:assert/strict');
const core = require('../flowchart-core.js');
const { EXAMPLE_PROJECTS } = require('../examples-data.js');

test('example projects are available for the kid editor', () => {
  assert.ok(Array.isArray(EXAMPLE_PROJECTS));
  assert.ok(EXAMPLE_PROJECTS.length >= 5);
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
