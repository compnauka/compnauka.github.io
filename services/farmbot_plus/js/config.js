/**
 * Конфігурація гри "Фермер Бот Плюс"
 */

// Константи налаштувань
const CONFIG = {
  ANIMATION_SPEED: 500, // мс
  TOAST_DURATION: 3000, // мс
  MAX_CONSOLE_LINES: 20, // Максимальна кількість рядків у консолі
  NEXT_LEVEL_DELAY: 2000, // мс
  DEFAULT_GRID_SIZE: 6
};

// Команди, які розпізнає робот
const COMMANDS = {
  UP: "вгору",
  DOWN: "вниз",
  LEFT: "вліво",
  RIGHT: "вправо"
};

// Типи повідомлень у консолі
const MESSAGE_TYPES = {
  INFO: "info",
  ERROR: "error",
  SUCCESS: "success"
};

// Конфігурація рівнів
const LEVELS = [
  {
    id: 1,
    gridSize: 4,
    robotStart: { x: 0, y: 0 },
    collectiblesCount: 2,
    collectibleType: "🍎",
    walls: [],
    description: "Рівень 1: Поле 4x4. Збери всі яблука.",
    maxSteps: 20
  },
  {
    id: 2,
    gridSize: 5,
    robotStart: { x: 0, y: 0 },
    collectiblesCount: 3,
    collectibleType: "🍎",
    walls: [{ x: 2, y: 1 }],
    description: "Рівень 2: Поле 5x5. Збери всі яблука, обходячи стіну.",
    maxSteps: 25
  },
  {
    id: 3,
    gridSize: 6,
    robotStart: { x: 0, y: 0 },
    collectiblesCount: 4,
    collectibleType: "🍎",
    walls: [
      { x: 2, y: 0 },
      { x: 2, y: 1 },
      { x: 2, y: 2 }
    ],
    description: "Рівень 3: Поле 6x6. Більше перешкод, більше яблук.",
    maxSteps: 30
  },
  {
    id: 4,
    gridSize: 7,
    robotStart: { x: 0, y: 0 },
    collectiblesCount: 5,
    collectibleType: "🍎",
    walls: [
      { x: 3, y: 1 },
      { x: 3, y: 2 },
      { x: 3, y: 3 }
    ],
    description: "Рівень 4: Поле 7x7. Використовуй текстові команди, щоб обійти стіни.",
    maxSteps: 35
  },
  {
    id: 5,
    gridSize: 7,
    robotStart: { x: 3, y: 3 },
    collectiblesCount: 6,
    collectibleType: "🍎",
    walls: [
      { x: 1, y: 1 },
      { x: 1, y: 5 },
      { x: 5, y: 1 },
      { x: 5, y: 5 }
    ],
    description: "Рівень 5: Найскладніший рівень. Поле 7x7 з додатковими перешкодами.",
    maxSteps: 40
  },
  {
    id: 6,
    gridSize: 8,
    robotStart: { x: 0, y: 0 },
    collectiblesCount: 5,
    collectibleType: "🍐",
    walls: [
      { x: 2, y: 1 },
      { x: 2, y: 2 },
      { x: 2, y: 3 },
      { x: 2, y: 4 },
      { x: 2, y: 5 },
      { x: 3, y: 5 },
      { x: 4, y: 5 },
      { x: 5, y: 5 },
      { x: 6, y: 5 }
    ],
    description: "Рівень 6: Поле 8x8. Збери груші, пройшовши через лабіринт.",
    maxSteps: 45
  },
  {
    id: 7,
    gridSize: 8,
    robotStart: { x: 4, y: 4 },
    collectiblesCount: 6,
    collectibleType: "🍊",
    walls: [
      { x: 1, y: 1 },
      { x: 2, y: 1 },
      { x: 1, y: 2 },
      { x: 6, y: 6 },
      { x: 6, y: 7 },
      { x: 7, y: 6 },
      { x: 3, y: 3 },
      { x: 3, y: 4 },
      { x: 3, y: 5 },
      { x: 5, y: 3 },
      { x: 5, y: 4 },
      { x: 5, y: 5 }
    ],
    description: "Рівень 7: Поле 8x8. Збери апельсини з кількох ізольованих секцій.",
    maxSteps: 50
  },
  {
    id: 8,
    gridSize: 9,
    robotStart: { x: 0, y: 0 },
    collectiblesCount: 8,
    collectibleType: "🍌",
    walls: [
      { x: 2, y: 2 },
      { x: 2, y: 3 },
      { x: 2, y: 4 },
      { x: 2, y: 5 },
      { x: 2, y: 6 },
      { x: 3, y: 6 },
      { x: 4, y: 6 },
      { x: 5, y: 6 },
      { x: 6, y: 6 },
      { x: 6, y: 5 },
      { x: 6, y: 4 },
      { x: 6, y: 3 },
      { x: 6, y: 2 },
      { x: 5, y: 2 },
      { x: 4, y: 2 },
      { x: 3, y: 2 }
    ],
    description: "Рівень 8: Поле 9x9. Збери банани, обходячи складний квадратний лабіринт.",
    maxSteps: 55
  },
  {
    id: 9,
    gridSize: 9,
    robotStart: { x: 4, y: 4 },
    collectiblesCount: 10,
    collectibleType: "🍓",
    walls: [
      { x: 2, y: 2 },
      { x: 2, y: 6 },
      { x: 6, y: 2 },
      { x: 6, y: 6 },
      { x: 3, y: 3 },
      { x: 3, y: 4 },
      { x: 3, y: 5 },
      { x: 4, y: 3 },
      { x: 4, y: 5 },
      { x: 5, y: 3 },
      { x: 5, y: 4 },
      { x: 5, y: 5 },
      { x: 0, y: 4 },
      { x: 8, y: 4 },
      { x: 4, y: 0 },
      { x: 4, y: 8 }
    ],
    description: "Рівень 9: Поле 9x9. Знайди полуниці, які розкидані між перешкодами.",
    maxSteps: 60
  },
  {
    id: 10,
    gridSize: 10,
    robotStart: { x: 0, y: 0 },
    collectiblesCount: 12,
    collectibleType: "🥕",
    walls: [
      { x: 1, y: 1 },
      { x: 1, y: 3 },
      { x: 1, y: 5 },
      { x: 1, y: 7 },
      { x: 1, y: 9 },
      { x: 3, y: 1 },
      { x: 3, y: 3 },
      { x: 3, y: 5 },
      { x: 3, y: 7 },
      { x: 3, y: 9 },
      { x: 5, y: 1 },
      { x: 5, y: 3 },
      { x: 5, y: 5 },
      { x: 5, y: 7 },
      { x: 5, y: 9 },
      { x: 7, y: 1 },
      { x: 7, y: 3 },
      { x: 7, y: 5 },
      { x: 7, y: 7 },
      { x: 7, y: 9 },
      { x: 9, y: 1 },
      { x: 9, y: 3 },
      { x: 9, y: 5 },
      { x: 9, y: 7 }
    ],
    description: "Рівень 10: Фінальний виклик! Поле 10x10. Збери всі морквини, перетинаючи численні перешкоди.",
    maxSteps: 70
  }
];

// Словник перекладів (для локалізації)
const TRANSLATIONS = {
  uk: {
    level: "Рівень",
    steps: "Кроків",
    run: "Запустити",
    stop: "Зупинити",
    reset: "Почати знову",
    programEmpty: "Програма порожня! Додай хоча б одну команду.",
    wallHit: "Стіна! Робот не може туди рухатись.",
    programStarted: "Програма запущена...",
    programStopped: "Програма зупинена",
    levelReset: "Рівень скинуто",
    levelCompleted: "Рівень завершено! Всі фрукти зібрано.",
    allLevelsCompleted: "Вітаємо! Всі рівні пройдено!",
    unknownCommand: "Невідома команда",
    executing: "Виконуємо",
    line: "рядок",
    fruitCollected: "Зібрано",
    remaining: "Залишилось",
    programCompleted: "Програма успішно завершена!",
    programIncomplete: "Програма завершена, але не всі фрукти зібрані!",
    programError: "Виконання програми зупинено через помилку",
    ready: "Готовий до виконання команд...",
    invalidIterations: "некоректна кількість повторень",
    stepsExceeded: "Увага: ти перевищив оптимальну кількість кроків",
    levelSuccess: "Молодець! Ти завершив рівень!",
    gameInitialized: "Гру ініціалізовано. Напиши програму і натисни 'Запустити'."
  },
  en: {
    level: "Level",
    steps: "Steps",
    run: "Run",
    stop: "Stop",
    reset: "Reset",
    programEmpty: "Program is empty! Add at least one command.",
    wallHit: "Wall! Robot cannot move there.",
    programStarted: "Program started...",
    programStopped: "Program stopped",
    levelReset: "Level reset",
    levelCompleted: "Level completed! All fruits collected.",
    allLevelsCompleted: "Congratulations! All levels completed!",
    unknownCommand: "Unknown command",
    executing: "Executing",
    line: "line",
    fruitCollected: "Collected",
    remaining: "Remaining",
    programCompleted: "Program successfully completed!",
    programIncomplete: "Program completed, but not all fruits collected!",
    programError: "Program execution stopped due to an error",
    ready: "Ready to execute commands...",
    invalidIterations: "invalid number of iterations",
    stepsExceeded: "Warning: you exceeded the optimal number of steps",
    levelSuccess: "Great job! You completed the level!",
    gameInitialized: "Game initialized. Write a program and press 'Run'."
  }
}; 
