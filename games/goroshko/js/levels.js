/**
 * Модуль рівнів гри «Котигорошко»
 * Базові рівні мають наперед визначену складність, але персоналізуються
 * для кожного гравця завдяки перетворенням поля. Додатково існує
 * генератор нескінченних рівнів із тією ж складністю для кожного гравця,
 * але з унікальним розташуванням елементів.
 */

import { GAME_CONFIG, ICONS } from './config.js';

const BASE_LEVELS = [
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
    obstacles: [],
    desc: "Дійди до Опудала, використовуючи лише рух праворуч!",
    par: { gold: 3, silver: 4 }
  },
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
    desc: 'Збери зброю та броню на шляху до Орка!',
    par: { gold: 12, silver: 15 }
  },
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
    desc: 'Нова механіка! Використай цикли, щоб пройти!',
    par: { gold: 5, silver: 8 }
  },
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

const BASE_LEVEL_COUNT = BASE_LEVELS.length;

function structuredCloneSafe(value) {
  if (typeof structuredClone === 'function') {
    return structuredClone(value);
  }
  return JSON.parse(JSON.stringify(value));
}

function hashString(input) {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
    hash >>>= 0;
  }
  return hash >>> 0;
}

function createSeededRandom(seedKey) {
  let seed = hashString(seedKey) || 1;
  return function rng() {
    seed += 0x6D2B79F5;
    seed &= 0xffffffff;
    let t = seed;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function uniqueCoordinates(coords = []) {
  const seen = new Set();
  const result = [];
  coords.forEach(([row, col]) => {
    const key = `${row},${col}`;
    if (!seen.has(key)) {
      seen.add(key);
      result.push([row, col]);
    }
  });
  return result;
}

function transformCoordinate([row, col], size, rotation, mirror) {
  let r = row;
  let c = col;

  if (mirror) {
    c = size - 1 - c;
  }

  for (let i = 0; i < rotation; i += 1) {
    const newRow = c;
    const newCol = size - 1 - r;
    r = newRow;
    c = newCol;
  }

  return [r, c];
}

function personaliseTutorialLevel(template, seedKey) {
  const level = structuredCloneSafe(template);
  const rng = createSeededRandom(seedKey);
  const size = level.size;
  const baseLength = Math.max(2, template.monster[1] - template.hero[1]);
  const maxHeroCol = Math.max(1, size - baseLength - 2);
  const heroPositions = [];
  for (let col = 1; col <= maxHeroCol; col += 1) {
    heroPositions.push(col);
  }

  const corridorRow = 1 + Math.floor(rng() * (size - 2));
  const heroCol = heroPositions.length
    ? heroPositions[Math.floor(rng() * heroPositions.length)]
    : 1;
  const monsterCol = heroCol + baseLength;

  const obstacles = [];
  for (let r = 0; r < size; r += 1) {
    for (let c = 0; c < size; c += 1) {
      const isCorridor = r === corridorRow && c >= heroCol && c <= monsterCol;
      if (!isCorridor) {
        obstacles.push([r, c]);
      }
    }
  }

  level.hero = [corridorRow, heroCol];
  level.monster = [corridorRow, monsterCol];
  level.obstacles = obstacles;
  level.items = { weapons: [], armor: [], potions: [] };
  level.desc = `Дійди до Опудала, рухаючись праворуч ${monsterCol - heroCol} кроків!`;

  return level;
}

function personaliseRotationalLevel(template, seedKey, index) {
  const level = structuredCloneSafe(template);
  const rng = createSeededRandom(`${seedKey}|${index}`);
  const rotation = Math.floor(rng() * 4);
  const mirror = rng() > 0.5;
  const size = level.size;

  const transform = (coord) => transformCoordinate(coord, size, rotation, mirror);

  level.hero = transform(level.hero);
  level.monster = transform(level.monster);

  level.items = {
    weapons: level.items.weapons.map(transform),
    armor: level.items.armor.map(transform),
    potions: level.items.potions.map(transform)
  };

  level.obstacles = uniqueCoordinates(level.obstacles.map(transform));

  return level;
}

function personaliseBaseLevel(index, variantKey) {
  const template = BASE_LEVELS[index];
  if (index === 0) {
    return personaliseTutorialLevel(template, `${variantKey}|tutorial`);
  }
  return personaliseRotationalLevel(template, variantKey, index);
}

function pickRandomFrom(rng, list) {
  const index = Math.floor(rng() * list.length);
  return list[index % list.length];
}

function generateRandomLevel(difficulty = 1, variantKey = 'default', index = BASE_LEVEL_COUNT) {
  const size = 8;
  const config = GAME_CONFIG.levelGenerator;
  const rng = createSeededRandom(`${variantKey}|generated|${index}`);

  const diffScale = Math.min(difficulty / 10, 1);

  const monsterHealth = Math.floor(
    config.minMonsterHealth + (config.maxMonsterHealth - config.minMonsterHealth) * diffScale
  );
  const monsterDamage = Math.floor(
    config.minMonsterDamage + (config.maxMonsterDamage - config.minMonsterDamage) * diffScale
  );

  const heroPos = [Math.floor(rng() * size), Math.floor(rng() * size)];
  let monsterPos;
  do {
    monsterPos = [Math.floor(rng() * size), Math.floor(rng() * size)];
  } while (heroPos[0] === monsterPos[0] && heroPos[1] === monsterPos[1]);

  const obstacles = [];
  for (let r = 0; r < size; r += 1) {
    for (let c = 0; c < size; c += 1) {
      if ((r === heroPos[0] && c === heroPos[1]) || (r === monsterPos[0] && c === monsterPos[1])) {
        continue;
      }
      if (rng() < config.obstaclesProbability * diffScale) {
        obstacles.push([r, c]);
      }
    }
  }

  const weapons = [];
  const armor = [];
  const potions = [];
  const itemCount = Math.max(1, Math.floor(1 + difficulty / 2));

  for (let i = 0; i < itemCount; i += 1) {
    let pos;
    let attempts = 0;
    do {
      pos = [Math.floor(rng() * size), Math.floor(rng() * size)];
      attempts += 1;
      if (attempts > 40) break;
    } while (
      (pos[0] === heroPos[0] && pos[1] === heroPos[1]) ||
      (pos[0] === monsterPos[0] && pos[1] === monsterPos[1]) ||
      obstacles.some(([or, oc]) => or === pos[0] && oc === pos[1])
    );

    const roll = rng();
    if (roll < 0.4) weapons.push(pos);
    else if (roll < 0.7) armor.push(pos);
    else potions.push(pos);
  }

  const estimatedMoves = Math.abs(heroPos[0] - monsterPos[0]) + Math.abs(heroPos[1] - monsterPos[1]);
  const parGold = Math.max(3, Math.ceil(estimatedMoves * 0.8));
  const parSilver = Math.max(parGold + 1, Math.ceil(estimatedMoves * 1.2));

  const monsterNames = ['Істота', 'Демон', 'Привид', 'Вовк', 'Змій', 'Відьма'];
  const monsterIcons = ['👾', '👹', '👻', '🐺', '🐉', '🧙'];
  const monsterName = pickRandomFrom(rng, monsterNames);
  const monsterIcon = pickRandomFrom(rng, monsterIcons);

  return {
    size,
    hero: heroPos,
    monster: monsterPos,
    items: { weapons, armor, potions },
    monsterStats: {
      health: monsterHealth,
      damage: monsterDamage,
      name: monsterName,
      icon: monsterIcon
    },
    obstacles,
    desc: `Згенерований рівень складності ${difficulty}. Здолай ${monsterName}!`,
    par: { gold: parGold, silver: parSilver },
    isGenerated: true,
    difficulty
  };
}

export function getLevel(index, variantKey = 'default') {
  if (index < BASE_LEVEL_COUNT) {
    return personaliseBaseLevel(index, variantKey);
  }
  const difficulty = index - BASE_LEVEL_COUNT + 1;
  return generateRandomLevel(difficulty, variantKey, index);
}

export function getBaseLevelCount() {
  return BASE_LEVEL_COUNT;
}
