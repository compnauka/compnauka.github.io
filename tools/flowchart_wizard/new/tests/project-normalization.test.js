const test = require('node:test');
const assert = require('node:assert/strict');
const core = require('../flowchart-core.js');

test('getDefaultText returns a dedicated label for subroutine blocks', () => {
  assert.equal(core.getDefaultText('subroutine', []), 'Підпрограма');
});

test('shape library exposes kid-friendly metadata including subroutine', () => {
  const library = core.getShapeLibrary();
  const subroutine = library.find((item) => item.type === 'subroutine');

  assert.ok(Array.isArray(library));
  assert.ok(library.length >= 6);
  assert.deepEqual(core.getShapeInfo('subroutine'), subroutine);
  assert.equal(subroutine.label, 'Підпрограма');
  assert.match(subroutine.description, /маленька команда/i);
  assert.equal(core.getTextPlaceholder('subroutine'), 'Намалювати будиночок');
});

test('getQuickAddTargets follows old constructor logic for open ends', () => {
  const shapes = [
    { id: 'shape-1', type: 'start-end', textRaw: 'Початок' },
    { id: 'shape-2', type: 'decision', textRaw: 'Є олівець?' },
    { id: 'shape-3', type: 'start-end', textRaw: 'Кінець' },
    { id: 'shape-4', type: 'process', textRaw: 'Записати відповідь' },
  ];
  const connections = [
    { from: 'shape-1', to: 'shape-2', type: null },
    { from: 'shape-2', to: 'shape-4', type: 'yes' },
  ];

  assert.deepEqual(core.getQuickAddTargets([], []), [
    { sourceId: null, branch: null, type: 'root' },
  ]);
  assert.deepEqual(core.getQuickAddTargets(shapes, connections), [
    { sourceId: 'shape-2', branch: 'no', type: 'branch' },
    { sourceId: 'shape-4', branch: null, type: 'linear' },
  ]);
});

test('getQuickAddPlacement positions branch children like the old plus buttons', () => {
  const parent = { type: 'decision', left: 400, top: 200, width: 140, height: 140 };

  assert.deepEqual(core.getQuickAddPlacement(parent, null, 'process'), { left: 388, top: 382 });
  assert.deepEqual(core.getQuickAddPlacement(parent, 'yes', 'process'), { left: 200, top: 384 });
  assert.deepEqual(core.getQuickAddPlacement(parent, 'no', 'subroutine'), { left: 600, top: 384 });
});

test('smartWrapText keeps subroutine text readable within the generic block limits', () => {
  const wrapped = core.smartWrapText('виконати допоміжну процедуру обчислення результату', 'subroutine');
  const lines = wrapped.split('\n');

  assert.ok(lines.length <= 3);
  assert.ok(lines.every((line) => line.length <= 18));
});

test('parseProject keeps subroutine shapes and clamps unsafe imported values', () => {
  const parsed = core.parseProject({
    version: 2,
    diagramTitle: 'Тест',
    shapeCounter: 9,
    lastShapeType: 'subroutine',
    baseColors: {
      subroutine: '#123456',
    },
    shapes: [
      {
        id: 'shape-1',
        type: 'subroutine',
        color: 'not-a-color',
        textRaw: 'Підпрограма для дуже довгого імпорту'.repeat(20),
        left: -40,
        top: 999999,
      },
      {
        id: 'shape-2',
        type: 'connector',
        color: '#abc',
        textRaw: 'A',
        left: 120,
        top: 220,
      },
    ],
    connections: [
      {
        id: 'conn-shape-1-shape-2',
        from: 'shape-1',
        to: 'shape-2',
        type: null,
        routeMode: 'bypass-right',
        label: 'Перехід до точки повернення',
      },
    ],
  });

  assert.equal(parsed.lastShapeType, 'subroutine');
  assert.equal(parsed.shapes[0].type, 'subroutine');
  assert.equal(parsed.shapes[0].color, core.DEFAULT_BASE_COLORS.subroutine);
  assert.equal(parsed.shapes[0].left, 0);
  assert.equal(parsed.shapes[0].top, 4000);
  assert.equal(parsed.shapes[0].textRaw.length, 200);
  assert.equal(parsed.shapes[1].type, 'connector');
  assert.equal(parsed.connections[0].routeMode, 'bypass-right');
  assert.equal(parsed.connections[0].label, 'Перехід до точки повернення');
});

test('parseProject falls back to process for unknown types and drops orphan connections', () => {
  const parsed = core.parseProject({
    version: 2,
    lastShapeType: 'mystery-type',
    shapes: [
      {
        id: 'shape-1',
        type: 'mystery-type',
        color: '#000000',
        textRaw: 'Щось',
        left: 10,
        top: 20,
      },
    ],
    connections: [
      {
        id: 'conn-shape-1-shape-999',
        from: 'shape-1',
        to: 'shape-999',
        type: null,
        routeMode: 'teleport',
        label: 'Зайвий звʼязок',
      },
    ],
  });

  assert.equal(parsed.lastShapeType, 'process');
  assert.equal(parsed.shapes[0].type, 'process');
  assert.equal(parsed.shapes[0].color, '#000000');
  assert.equal(parsed.connections.length, 0);
});

test('serializeProject and parseProject preserve subroutine projects end-to-end', () => {
  const state = {
    diagramTitle: 'Алгоритм з підпрограмою',
    shapeCounter: 3,
    lastShapeType: 'subroutine',
    baseColors: { ...core.DEFAULT_BASE_COLORS, subroutine: '#5e35b1' },
    shapes: [
      { id: 'shape-1', type: 'start-end', color: '#4caf50', textRaw: 'Початок', left: 100, top: 80 },
      { id: 'shape-2', type: 'subroutine', color: '#5e35b1', textRaw: 'Обчислити суму', left: 100, top: 220 },
      { id: 'shape-3', type: 'start-end', color: '#4caf50', textRaw: 'Кінець', left: 100, top: 360 },
    ],
    connections: [
      { id: 'conn-shape-1-shape-2', from: 'shape-1', to: 'shape-2', type: null, routeMode: 'auto', label: null },
      { id: 'conn-shape-2-shape-3', from: 'shape-2', to: 'shape-3', type: null, routeMode: 'vertical', label: 'Повернення' },
    ],
  };

  const serialized = core.serializeProject(state);
  const parsed = core.parseProject(JSON.stringify(serialized));

  assert.equal(parsed.diagramTitle, state.diagramTitle);
  assert.equal(parsed.lastShapeType, 'subroutine');
  assert.deepEqual(
    parsed.shapes.map((shape) => shape.type),
    ['start-end', 'subroutine', 'start-end'],
  );
  assert.deepEqual(
    parsed.connections.map((conn) => ({ id: conn.id, routeMode: conn.routeMode, label: conn.label })),
    [
      { id: 'conn-shape-1-shape-2', routeMode: 'auto', label: null },
      { id: 'conn-shape-2-shape-3', routeMode: 'vertical', label: 'Повернення' },
    ],
  );
});
