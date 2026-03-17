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
          shape('shape-2', 'process', 'Прокинутися', 510, 164),
          shape('shape-3', 'process', 'Вмитися і почистити зуби', 510, 258),
          shape('shape-4', 'process', 'Поснідати', 510, 352),
          shape('shape-5', 'process', 'Одягнутися', 510, 446),
          shape('shape-6', 'process', 'Вийти з дому', 510, 540),
          shape('shape-7', 'start-end', 'Кінець', 500, 642),
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
          shape('shape-2', 'process', 'Подивитися у вікно', 510, 164),
          shape('shape-3', 'decision', 'Іде дощ?', 515, 304),
          shape('shape-4', 'process', 'Взяти парасольку', 330, 458),
          shape('shape-5', 'process', 'Залишити парасольку вдома', 710, 458),
          shape('shape-6', 'start-end', 'Кінець', 320, 560),
          shape('shape-7', 'start-end', 'Кінець', 700, 560),
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
          shape('shape-2', 'decision', 'Є квиток на автобус?', 515, 220),
          shape('shape-3', 'process', 'Сісти в автобус', 350, 414),
          shape('shape-4', 'process', 'Іти пішки', 690, 414),
          shape('shape-5', 'process', 'Дістатися до школи', 510, 558),
          shape('shape-6', 'start-end', 'Кінець', 500, 660),
        ],
        connections: [
          conn('conn-shape-1-shape-2', 'shape-1', 'shape-2'),
          conn('conn-shape-2-shape-3-yes', 'shape-2', 'shape-3', 'yes'),
          conn('conn-shape-2-shape-4-no', 'shape-2', 'shape-4', 'no'),
          conn('conn-shape-3-shape-5', 'shape-3', 'shape-5', null, 'bypass-right'),
          conn('conn-shape-4-shape-5', 'shape-4', 'shape-5', null, 'bypass-left'),
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
          shape('shape-2', 'input-output', 'Порахувати гроші', 500, 164),
          shape('shape-3', 'decision', 'Вистачає грошей?', 515, 314),
          shape('shape-4', 'process', 'Підійти до кіоску', 330, 468),
          shape('shape-5', 'process', 'Повернутись додому', 700, 468),
          shape('shape-6', 'decision', 'Є шоколадне?', 330, 608),
          shape('shape-7', 'process', 'Купити шоколадне', 130, 762),
          shape('shape-8', 'process', 'Купити ванільне', 500, 762),
          shape('shape-9', 'process', 'З’їсти морозиво', 330, 890),
          shape('shape-10', 'start-end', 'Кінець', 330, 992),
          shape('shape-11', 'start-end', 'Кінець', 690, 570),
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
          conn('conn-shape-7-shape-9', 'shape-7', 'shape-9', null, 'bypass-right'),
          conn('conn-shape-8-shape-9', 'shape-8', 'shape-9', null, 'bypass-left'),
          conn('conn-shape-9-shape-10', 'shape-9', 'shape-10'),
        ],
      },
    },
    {
      id: 'example-password',
      title: 'Перевірка паролю',
      subtitle: 'Ввід, перевірка та вивід результату.',
      icon: 'fa-lock',
      project: {
        version: 2,
        diagramTitle: 'Перевірка паролю',
        shapeCounter: 7,
        lastShapeType: 'input-output',
        baseColors: { ...BASE_COLORS },
        shapes: [
          shape('shape-1', 'start-end', 'Початок', 500, 70),
          shape('shape-2', 'input-output', 'Ввести пароль', 500, 164),
          shape('shape-3', 'decision', 'Пароль правильний?', 515, 286),
          shape('shape-4', 'input-output', 'Показати: "Ласкаво просимо!"', 320, 440),
          shape('shape-5', 'input-output', 'Показати: "Помилка! Спробуй ще раз"', 650, 440),
          shape('shape-6', 'start-end', 'Кінець', 320, 542),
          shape('shape-7', 'start-end', 'Кінець', 650, 542),
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
  ];

  return {
    EXAMPLE_PROJECTS: EXAMPLE_PROJECTS.map((example) => ({
      ...example,
      project: shiftProject(example.project, 180, 0),
    })),
  };
}));
