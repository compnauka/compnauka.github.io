/**
 * Конфігураційний файл гри
 * Містить всі налаштування, константи та параметри гри
 */

export const GAME_CONFIG = {
    // === ПАРАМЕТРИ ГРАВЦЯ ===
    baseDamage: 20,        // Базова шкода від зброї
    baseArmor: 8,          // Базовий захист від броні
    potionHealth: 25,      // Здоров'я від зілля
    baseHealth: 100,       // Початкове здоров'я
  
    // === ПАРАМЕТРИ АНІМАЦІЇ ===
    stepMs: 360,           // Затримка між кроками (мс)
    battleRoundMs: 650,    // Затримка між раундами бою (мс)
    collectAnimMs: 200,    // Тривалість анімації збору предмету (мс)
  
    // === ПАРАМЕТРИ СІТКИ ===
    defaultGridSize: 8,    // Розмір сітки за замовчуванням
  
    // === ЗВУКИ ===
    soundUrls: {
      victory: 'https://www.soundjay.com/misc/sounds/success-fanfare-trumpets.mp3',
      defeat: 'https://www.soundjay.com/misc/sounds/fail-buzzer-02.mp3',
      bump: 'https://www.soundjay.com/misc/sounds/thud-01.mp3',
      collect: 'https://www.soundjay.com/misc/sounds/bell-ring-01.mp3',
      step: 'https://www.soundjay.com/misc/sounds/click-03.mp3'
    },
    defaultSoundVolume: 0.32,
  
    // === ІНТЕРФЕЙС ===
    maxLoopCount: 10,      // Максимальна кількість повторень циклу
    minLoopCount: 1,       // Мінімальна кількість повторень циклу
  
    // === ГЕНЕРАЦІЯ РІВНІВ (для майбутнього) ===
    levelGenerator: {
      minMonsterHealth: 10,
      maxMonsterHealth: 150,
      minMonsterDamage: 0,
      maxMonsterDamage: 30,
      weaponsProbability: 0.6,
      armorProbability: 0.5,
      potionsProbability: 0.4,
      obstaclesProbability: 0.3
    }
  };
  
  // === ЕМОДЖІ ІКОНКИ ===
  export const ICONS = {
    hero: '🦸',
    obstacle: '🌲',
    weapon: '⚔️',
    armor: '🛡️',
    potion: '🧪',
    monsters: {
      scarecrow: '👻',
      goblin: '💀',
      orc: '👹',
      troll: '👿',
      skeleton: '💀',
      dragon: '🐉'
    }
  };
  
  // === ТИПИ КОМАНД ===
  export const COMMAND_TYPES = {
    MOVE: 'move',
    LOOP: 'loop'
  };
  
  // === НАПРЯМКИ РУХУ ===
  export const DIRECTIONS = {
    UP: 'up',
    DOWN: 'down',
    LEFT: 'left',
    RIGHT: 'right'
  };
  
  // === КЛАСИ CSS ДЛЯ ТИПІВ КЛІТИНОК ===
  export const CELL_CLASSES = {
    base: 'cell aspect-square flex items-center justify-center rounded border',
    hero: 'bg-blue-200 border-blue-500 shadow-lg z-10',
    monster: 'bg-red-200 border-red-500 monster-pulse',
    obstacle: 'bg-gray-600 border-gray-800',
    empty: 'bg-green-100 border-green-300',
    collected: 'opacity-30'
  };
  