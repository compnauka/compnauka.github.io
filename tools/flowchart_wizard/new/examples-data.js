(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
    return;
  }
  root.FlowchartExamples = factory();
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const BASE_COLORS = {
    'start-end': '#4caf50',
    'process': '#03a9f4',
    'decision': '#ff9800',
    'input-output': '#3f51b5',
    'subroutine': '#7b1fa2',
    'connector': '#546e7a',
  };

  function shape(id, type, textRaw, left, top) {
    return {
      id,
      type,
      color: BASE_COLORS[type] || '#03a9f4',
      textRaw,
      left,
      top,
    };
  }

  function conn(id, from, to, type, routeMode, label) {
    return {
      id,
      from,
      to,
      type: type ?? null,
      routeMode: routeMode || 'auto',
      label: label ?? null,
    };
  }

  function shiftProject(project, offsetX, offsetY) {
    return {
      ...project,
      shapes: (project.shapes || []).map((item) => ({
        ...item,
        left: item.left + offsetX,
        top: item.top + offsetY,
      })),
    };
  }

  const EXAMPLE_PROJECTS = [
    {
      id: 'example-morning',
      title: 'Ранок школяра',
      subtitle: 'Лінійний алгоритм: дії йдуть одна за одною.',
      icon: 'fa-sun',
      project: {
        version: 2,
        diagramTitle: 'Ранок школяра',
        shapeCounter: 7,
        lastShapeType: 'process',
        baseColors: { ...BASE_COLORS },
        shapes: [
          shape('shape-1', 'start-end', 'Початок', 500, 70),
          shape('shape-2', 'process', 'Прокинутися', 500, 170),
          shape('shape-3', 'process', 'Вмитися і почистити зуби', 500, 270),
          shape('shape-4', 'process', 'Поснідати', 500, 370),
          shape('shape-5', 'process', 'Одягнутися', 500, 470),
          shape('shape-6', 'process', 'Вийти з дому', 500, 570),
          shape('shape-7', 'start-end', 'Кінець', 500, 680),
        ],
        connections: [
          conn('conn-shape-1-shape-2', 'shape-1', 'shape-2'),
          conn('conn-shape-2-shape-3', 'shape-2', 'shape-3'),
          conn('conn-shape-3-shape-4', 'shape-3', 'shape-4'),
          conn('conn-shape-4-shape-5', 'shape-4', 'shape-5'),
          conn('conn-shape-5-shape-6', 'shape-5', 'shape-6'),
          conn('conn-shape-6-shape-7', 'shape-6', 'shape-7'),
        ],
      },
    },
    {
      id: 'example-umbrella',
      title: 'Чи брати парасольку?',
      subtitle: 'Розгалуження: вибір дії залежить від умови.',
      icon: 'fa-umbrella',
      project: {
        version: 2,
        diagramTitle: 'Чи брати парасольку?',
        shapeCounter: 7,
        lastShapeType: 'decision',
        baseColors: { ...BASE_COLORS },
        shapes: [
          shape('shape-1', 'start-end', 'Початок', 500, 70),
          shape('shape-2', 'process', 'Подивитися у вікно', 500, 170),
          shape('shape-3', 'decision', 'Іде дощ?', 510, 320),
          shape('shape-4', 'process', 'Взяти парасольку', 260, 500),
          shape('shape-5', 'process', 'Залишити парасольку вдома', 760, 500),
          shape('shape-6', 'start-end', 'Кінець', 260, 620),
          shape('shape-7', 'start-end', 'Кінець', 760, 620),
        ],
        connections: [
          conn('conn-shape-1-shape-2', 'shape-1', 'shape-2'),
          conn('conn-shape-2-shape-3', 'shape-2', 'shape-3'),
          conn('conn-shape-3-shape-4-yes', 'shape-3', 'shape-4', 'yes'),
          conn('conn-shape-3-shape-5-no', 'shape-3', 'shape-5', 'no'),
          conn('conn-shape-4-shape-6', 'shape-4', 'shape-6'),
          conn('conn-shape-5-shape-7', 'shape-5', 'shape-7'),
        ],
      },
    },
    {
      id: 'example-hat',
      title: 'Вдягнути шапку',
      subtitle: 'Неповне розгалуження: гілка «Ні» не містить жодних дій.',
      icon: 'fa-snowflake',
      project: {
        version: 2,
        diagramTitle: 'Вдягнути шапку',
        shapeCounter: 6,
        lastShapeType: 'process',
        baseColors: { ...BASE_COLORS },
        shapes: [
          shape('shape-1', 'start-end', 'Початок', 500, 60),
          shape('shape-2', 'process', 'Глянути на термометр', 500, 160),
          shape('shape-3', 'decision', 'Нижче 0°?', 510, 310),
          shape('shape-4', 'process', 'Вдягнути шапку', 220, 520),
          shape('shape-5', 'process', 'Вийти на вулицю', 660, 780),
          shape('shape-6', 'start-end', 'Кінець', 660, 900),
        ],
        connections: [
          conn('conn-shape-1-shape-2', 'shape-1', 'shape-2'),
          conn('conn-shape-2-shape-3', 'shape-2', 'shape-3'),
          conn('conn-shape-3-shape-4-yes', 'shape-3', 'shape-4', 'yes'),
          conn('conn-shape-3-shape-5-no', 'shape-3', 'shape-5', 'no'),
          conn('conn-shape-4-shape-5', 'shape-4', 'shape-5', null, 'auto'),
          conn('conn-shape-5-shape-6', 'shape-5', 'shape-6'),
        ],
      },
    },
    {
      id: 'example-transport',
      title: 'Вибір транспорту',
      subtitle: 'Розгалуження зі сходженням: дві гілки знову об’єднуються.',
      icon: 'fa-bus',
      project: {
        version: 2,
        diagramTitle: 'Вибір транспорту',
        shapeCounter: 6,
        lastShapeType: 'decision',
        baseColors: { ...BASE_COLORS },
        shapes: [
          shape('shape-1', 'start-end', 'Початок', 500, 70),
          shape('shape-2', 'decision', 'Є квиток на автобус?', 510, 230),
          shape('shape-3', 'process', 'Сісти в автобус', 180, 470),
          shape('shape-4', 'process', 'Іти пішки', 840, 470),
          shape('shape-5', 'process', 'Дістатися до школи', 510, 860),
          shape('shape-6', 'start-end', 'Кінець', 510, 980),
        ],
        connections: [
          conn('conn-shape-1-shape-2', 'shape-1', 'shape-2'),
          conn('conn-shape-2-shape-3-yes', 'shape-2', 'shape-3', 'yes'),
          conn('conn-shape-2-shape-4-no', 'shape-2', 'shape-4', 'no'),
          conn('conn-shape-3-shape-5', 'shape-3', 'shape-5', null, 'auto'),
          conn('conn-shape-4-shape-5', 'shape-4', 'shape-5', null, 'auto'),
          conn('conn-shape-5-shape-6', 'shape-5', 'shape-6'),
        ],
      },
    },
    {
      id: 'example-icecream',
      title: 'Купівля морозива',
      subtitle: 'Складніший приклад з кількома умовами та сходженням.',
      icon: 'fa-ice-cream',
      project: {
        version: 2,
        diagramTitle: 'Купівля морозива',
        shapeCounter: 11,
        lastShapeType: 'decision',
        baseColors: { ...BASE_COLORS },
        shapes: [
          shape('shape-1', 'start-end', 'Початок', 500, 70),
          shape('shape-2', 'input-output', 'Порахувати гроші', 500, 170),
          shape('shape-3', 'decision', 'Вистачає грошей?', 510, 320),
          shape('shape-4', 'process', 'Підійти до кіоску', 200, 540),
          shape('shape-5', 'process', 'Повернутись додому', 900, 540),
          shape('shape-6', 'decision', 'Є шоколадне?', 200, 800),
          shape('shape-7', 'process', 'Купити шоколадне', 0, 1040),
          shape('shape-8', 'process', 'Купити ванільне', 470, 1040),
          shape('shape-9', 'process', 'З’їсти морозиво', 240, 1400),
          shape('shape-10', 'start-end', 'Кінець', 240, 1520),
          shape('shape-11', 'start-end', 'Кінець', 900, 700),
        ],
        connections: [
          conn('conn-shape-1-shape-2', 'shape-1', 'shape-2'),
          conn('conn-shape-2-shape-3', 'shape-2', 'shape-3'),
          conn('conn-shape-3-shape-4-yes', 'shape-3', 'shape-4', 'yes'),
          conn('conn-shape-3-shape-5-no', 'shape-3', 'shape-5', 'no'),
          conn('conn-shape-5-shape-11', 'shape-5', 'shape-11'),
          conn('conn-shape-4-shape-6', 'shape-4', 'shape-6'),
          conn('conn-shape-6-shape-7-yes', 'shape-6', 'shape-7', 'yes'),
          conn('conn-shape-6-shape-8-no', 'shape-6', 'shape-8', 'no'),
          conn('conn-shape-7-shape-9', 'shape-7', 'shape-9', null, 'auto'),
          conn('conn-shape-8-shape-9', 'shape-8', 'shape-9', null, 'auto'),
          conn('conn-shape-9-shape-10', 'shape-9', 'shape-10'),
        ],
      },
    },
    {
      id: 'example-password',
      title: 'Перевірка паролю',
      subtitle: 'Цикл while: програма повторює запит, поки пароль не правильний.',
      icon: 'fa-lock',
      project: {
        version: 2,
        diagramTitle: 'Перевірка паролю',
        shapeCounter: 6,
        lastShapeType: 'input-output',
        baseColors: { ...BASE_COLORS },
        shapes: [
          shape('shape-1', 'start-end', 'Початок', 500, 60),
          shape('shape-2', 'input-output', 'Ввести пароль', 500, 180),
          shape('shape-3', 'decision', 'Пароль правильний?', 510, 360),
          shape('shape-4', 'input-output', 'Ласкаво просимо!', 120, 600),
          shape('shape-5', 'input-output', 'Помилка! Спробуй ще раз', 880, 500),
          shape('shape-6', 'start-end', 'Кінець', 120, 740),
        ],
        connections: [
          conn('conn-shape-1-shape-2', 'shape-1', 'shape-2'),
          conn('conn-shape-2-shape-3', 'shape-2', 'shape-3'),
          conn('conn-shape-3-shape-4-yes', 'shape-3', 'shape-4', 'yes'),
          conn('conn-shape-3-shape-5-no', 'shape-3', 'shape-5', 'no'),
          conn('conn-shape-4-shape-6', 'shape-4', 'shape-6'),
          conn('conn-shape-5-shape-2', 'shape-5', 'shape-2', null, 'bypass-right'),
        ],
      },
    },
    {
      id: 'example-porridge',
      title: 'Доїсти кашу',
      subtitle: 'Цикл while: перевіряємо умову перед кожним повторенням дії.',
      icon: 'fa-utensils',
      project: {
        version: 2,
        diagramTitle: 'Доїсти кашу',
        shapeCounter: 4,
        lastShapeType: 'start-end',
        baseColors: { ...BASE_COLORS },
        shapes: [
          shape('shape-1', 'start-end', 'Початок', 500, 60),
          shape('shape-2', 'decision', 'Каша є в тарілці?', 510, 250),
          shape('shape-3', 'process', 'З’їсти ложку', 120, 500),
          shape('shape-4', 'start-end', 'Кінець', 900, 250),
        ],
        connections: [
          conn('conn-shape-1-shape-2', 'shape-1', 'shape-2'),
          conn('conn-shape-2-shape-3-yes', 'shape-2', 'shape-3', 'yes'),
          conn('conn-shape-2-shape-4-no', 'shape-2', 'shape-4', 'no'),
          conn('conn-shape-3-shape-2', 'shape-3', 'shape-2', null, 'auto'),
        ],
      },
    },
  ];

  return {
    EXAMPLE_PROJECTS: EXAMPLE_PROJECTS.map((example) => ({
      ...example,
      project: shiftProject(example.project, 180, 0),
    })),
  };
}));