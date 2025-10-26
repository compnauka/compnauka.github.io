/**
 * Модуль рівнів гри
 * Містить всі рівні та функції для генерації нових рівнів
 */

import { GAME_CONFIG, ICONS } from './config.js';

/**
 * Масив рівнів гри
 * Кожен рівень містить:
 * - size: розмір сітки
 * - hero: початкова позиція героя [row, col]
 * - monster: позиція монстра [row, col]
 * - items: об'єкт з масивами позицій предметів
 * - monsterStats: характеристики монстра
 * - obstacles: масив позицій перешкод
 * - desc: опис рівня
 * - par: цільова кількість блоків для медалей {gold, silver}
 */
export const levels = [
  // Рівень 1: Опудало (Туторіал - тільки права стрілка)
  {
    size: 8,
    hero: [3, 2],
    monster: [3, 5],
    items: { weapons: [], armor: [], potions: [] },
    monsterStats: { 
      health: 10, 
      damage: 0, 
      name: 'Опудало', 
      icon: ICONS.monsters.scarecrow 
    },
    obstacles: [
      [0,0],[0,1],[0,2],[0,3],[0,4],[0,5],[0,6],[0,7],
      [1,0],[1,1],[1,2],[1,3],[1,4],[1,5],[1,6],[1,7],
      [2,0],[2,1],[2,6],[2,7],
      [3,0],[3,1],[3,6],[3,7],
      [4,0],[4,1],[4,6],[4,7],
      [5,0],[5,1],[5,6],[5,7],
      [6,0],[6,1],[6,2],[6,3],[6,4],[6,5],[6,6],[6,7],
      [7,0],[7,1],[7,2],[7,3],[7,4],[7,5],[7,6],[7,7]
    ],
    desc: "Дійди до Опудала, використовуючи лише кнопку 'Праворуч'!",
    par: { gold: 3, silver: 4 }
  },

  // Рівень 2: Гоблін (Всі напрямки)
  {
    size: 8,
    hero: [5, 2],
    monster: [2, 5],
    items: { weapons: [], armor: [], potions: [] },
    monsterStats: { 
      health: 20, 
      damage: 5, 
      name: 'Гоблін', 
      icon: ICONS.monsters.goblin 
    },
    obstacles: [
      [0,0],[0,1],[0,2],[0,3],[0,4],[0,5],[0,6],[0,7],
      [1,0],[1,1],[1,2],[1,3],[1,4],[1,5],[1,6],[1,7],
      [2,0],[2,1],[2,6],[2,7],
      [3,0],[3,1],[3,3],[3,4],[3,6],[3,7],
      [4,0],[4,1],[4,3],[4,4],[4,5],[4,6],[4,7],
      [5,0],[5,1],[5,6],[5,7],
      [6,0],[6,1],[6,2],[6,3],[6,4],[6,5],[6,6],[6,7],
      [7,0],[7,1],[7,2],[7,3],[7,4],[7,5],[7,6],[7,7]
    ],
    desc: 'Обійди перешкоди, щоб дістатися до Гобліна!',
    par: { gold: 10, silver: 12 }
  },

  // Рівень 3: Орк (Зброя та броня)
  {
    size: 8,
    hero: [5, 2],
    monster: [2, 5],
    items: { 
      weapons: [[4, 3]], 
      armor: [[3, 4]], 
      potions: [] 
    },
    monsterStats: { 
      health: 50, 
      damage: 12, 
      name: 'Орк', 
      icon: ICONS.monsters.orc 
    },
    obstacles: [
      [0,0],[0,1],[0,2],[0,3],[0,4],[0,5],[0,6],[0,7],
      [1,0],[1,1],[1,2],[1,3],[1,4],[1,5],[1,6],[1,7],
      [2,0],[2,1],[2,6],[2,7],
      [3,0],[3,1],[3,6],[3,7],
      [4,0],[4,1],[4,2],[4,6],[4,7],
      [5,0],[5,1],[5,6],[5,7],
      [6,0],[6,1],[6,2],[6,3],[6,4],[6,5],[6,6],[6,7],
      [7,0],[7,1],[7,2],[7,3],[7,4],[7,5],[7,6],[7,7]
    ],
    desc: 'Збери зброю (⚔️) та броню (🛡️) на шляху до Орка!',
    par: { gold: 12, silver: 15 }
  },

  // Рівень 4: Троль (Всі предмети)
  {
    size: 8,
    hero: [5, 2],
    monster: [2, 5],
    items: { 
      weapons: [[4, 2], [2, 4]], 
      armor: [[3, 3]], 
      potions: [[4, 4]] 
    },
    monsterStats: { 
      health: 80, 
      damage: 18, 
      name: 'Троль', 
      icon: ICONS.monsters.troll 
    },
    obstacles: [
      [0,0],[0,1],[0,2],[0,3],[0,4],[0,5],[0,6],[0,7],
      [1,0],[1,1],[1,2],[1,3],[1,4],[1,5],[1,6],[1,7],
      [2,0],[2,1],[2,6],[2,7],
      [3,0],[3,1],[3,6],[3,7],
      [4,0],[4,1],[4,6],[4,7],
      [5,0],[5,1],[5,6],[5,7],
      [6,0],[6,1],[6,2],[6,3],[6,4],[6,5],[6,6],[6,7],
      [7,0],[7,1],[7,2],[7,3],[7,4],[7,5],[7,6],[7,7]
    ],
    desc: 'Збери все спорядження, включно з зіллям (🧪)!',
    par: { gold: 14, silver: 18 }
  },

  // Рівень 5: Скелет (Введення циклів)
  {
    size: 8,
    hero: [5, 2],
    monster: [2, 5],
    items: { 
      weapons: [[4, 2]], 
      armor: [[3, 2]], 
      potions: [[2, 2]] 
    },
    monsterStats: { 
      health: 50, 
      damage: 10, 
      name: 'Скелет', 
      icon: ICONS.monsters.skeleton 
    },
    obstacles: [
      [0,0],[0,1],[0,2],[0,3],[0,4],[0,5],[0,6],[0,7],
      [1,0],[1,1],[1,2],[1,3],[1,4],[1,5],[1,6],[1,7],
      [2,0],[2,1],[2,6],[2,7],
      [3,0],[3,1],[3,6],[3,7],
      [4,0],[4,1],[4,6],[4,7],
      [5,0],[5,1],[5,6],[5,7],
      [6,0],[6,1],[6,2],[6,3],[6,4],[6,5],[6,6],[6,7],
      [7,0],[7,1],[7,2],[7,3],[7,4],[7,5],[7,6],[7,7]
    ],
    desc: 'Нова механіка! Використай ЦИКЛИ, щоб пройти!',
    par: { gold: 5, silver: 8 }
  },

  // Рівень 6: Дракон (Фінальний виклик)
  {
    size: 8,
    hero: [7, 0],
    monster: [0, 7],
    items: { 
      weapons: [[6, 1], [5, 2], [4, 3], [3, 4]], 
      armor: [[2, 5]], 
      potions: [[6, 3], [6, 5]] 
    },
    monsterStats: { 
      health: 120, 
      damage: 25, 
      name: 'Дракон', 
      icon: ICONS.monsters.dragon 
    },
    obstacles: [[5,1],[5,2],[5,3],[5,4],[3,2],[3,4],[3,5],[1,2],[2,2]],
    desc: 'Фінальний виклик! Оптимізуй свій шлях за допомогою циклів.',
    par: { gold: 10, silver: 15 }
  }
];

/**
 * Генератор випадкових рівнів
 * Використовується для створення нескінченних рівнів після проходження базових
 * @param {number} difficulty - Рівень складності (1-10)
 * @returns {Object} - Згенерований рівень
 */
export function generateRandomLevel(difficulty = 1) {
  const size = 8;
  const config = GAME_CONFIG.levelGenerator;
  
  // Масштабування складності
  const diffScale = Math.min(difficulty / 10, 1);
  
  // Генерація характеристик монстра
  const monsterHealth = Math.floor(
    config.minMonsterHealth + 
    (config.maxMonsterHealth - config.minMonsterHealth) * diffScale
  );
  const monsterDamage = Math.floor(
    config.minMonsterDamage + 
    (config.maxMonsterDamage - config.minMonsterDamage) * diffScale
  );

  // Випадкові позиції
  const heroPos = [Math.floor(Math.random() * size), Math.floor(Math.random() * size)];
  let monsterPos;
  do {
    monsterPos = [Math.floor(Math.random() * size), Math.floor(Math.random() * size)];
  } while (heroPos[0] === monsterPos[0] && heroPos[1] === monsterPos[1]);

  // Генерація перешкод
  const obstacles = [];
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if ((r === heroPos[0] && c === heroPos[1]) || 
          (r === monsterPos[0] && c === monsterPos[1])) continue;
      
      if (Math.random() < config.obstaclesProbability * diffScale) {
        obstacles.push([r, c]);
      }
    }
  }

  // Генерація предметів
  const weapons = [];
  const armor = [];
  const potions = [];
  const itemCount = Math.floor(1 + difficulty / 2);

  for (let i = 0; i < itemCount; i++) {
    let pos;
    do {
      pos = [Math.floor(Math.random() * size), Math.floor(Math.random() * size)];
    } while (
      (pos[0] === heroPos[0] && pos[1] === heroPos[1]) ||
      (pos[0] === monsterPos[0] && pos[1] === monsterPos[1]) ||
      obstacles.some(o => o[0] === pos[0] && o[1] === pos[1])
    );

    const rand = Math.random();
    if (rand < 0.4) weapons.push(pos);
    else if (rand < 0.7) armor.push(pos);
    else potions.push(pos);
  }

  // Розрахунок par (цільової кількості блоків)
  const estimatedMoves = Math.abs(heroPos[0] - monsterPos[0]) + Math.abs(heroPos[1] - monsterPos[1]);
  const parGold = Math.ceil(estimatedMoves * 0.8);
  const parSilver = Math.ceil(estimatedMoves * 1.2);

  const monsterNames = ['Істота', 'Демон', 'Привид', 'Вовк', 'Змій', 'Відьма'];
  const monsterIcons = ['👾', '👹', '👻', '🐺', '🐉', '🧙'];
  const randomIndex = Math.floor(Math.random() * monsterNames.length);

  return {
    size,
    hero: heroPos,
    monster: monsterPos,
    items: { weapons, armor, potions },
    monsterStats: {
      health: monsterHealth,
      damage: monsterDamage,
      name: monsterNames[randomIndex],
      icon: monsterIcons[randomIndex]
    },
    obstacles,
    desc: `Згенерований рівень складності ${difficulty}. Здолай ${monsterNames[randomIndex]}!`,
    par: { gold: parGold, silver: parSilver },
    isGenerated: true, // Маркер для відслідковування згенерованих рівнів
    difficulty
  };
}

/**
 * Отримання рівня за індексом
 * Якщо індекс виходить за межі базових рівнів, генерується новий
 * @param {number} index - Індекс рівня
 * @returns {Object} - Об'єкт рівня
 */
export function getLevel(index) {
  if (index < levels.length) {
    return levels[index];
  } else {
    // Генеруємо новий рівень з наростаючою складністю
    const difficulty = index - levels.length + 1;
    return generateRandomLevel(difficulty);
  }
}

/**
 * Отримання загальної кількості базових рівнів
 * @returns {number} - Кількість рівнів
 */
export function getBaseLevelCount() {
  return levels.length;
}
