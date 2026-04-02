/**
 * Конфігураційний файл гри "Фермер Бот"
 *
 * Містить всі константи, налаштування рівнів, команди робота,
 * ключі для локального сховища та селектори DOM-елементів.
 *
 * Якщо потрібно додати новий рівень, змінити параметри анімації,
 * або додати нову команду — редагуй цей файл.
 */
const CONFIG = {
  // Налаштування анімації та інтерфейсу
  ANIMATION_SPEED: 500, // мс — швидкість анімації руху робота
  TOAST_DURATION: 3000, // мс — тривалість повідомлення про успіх
  MAX_COMMAND_REPEATS: 10, // максимальна кількість повторів однієї команди
  MAX_PROGRAM_STEPS: 50,  // максимальна кількість кроків програми
  
  // Повідомлення про помилки
  ERROR_MESSAGES: {
    WALL_COLLISION: "Робот не може рухатись у цьому напрямку — там стіна!",
    EDGE_COLLISION: "Робот не може вийти за межі поля!",
    COMPLEX_PROGRAM: "Програма занадто складна. Спробуйте спростити її."
  },

  // Ключі для локального сховища (localStorage)
  STORAGE_KEYS: {
    COMPLETED_LEVELS: "robotGame_completedLevels", // Збережені пройдені рівні
    SOUND_ENABLED_SESSION: "robotGame_soundEnabledSession"
  },

  // Команди робота (відповідають кнопкам керування)
  COMMANDS: {
    UP: "вгору",    // Рух вгору
    DOWN: "вниз",   // Рух вниз
    LEFT: "вліво",  // Рух вліво
    RIGHT: "вправо" // Рух вправо
  },

  // Easter seasonal replacement (2 weeks)
  SEASONAL_THEME: {
    enabled: true,
    startDate: "2026-04-02",
    endDate: "2026-04-16",
    eggAssets: [
      "eggs/krashenka_blue.svg",
      "eggs/krashenka_red.svg",
      "eggs/pysanka_cross.svg",
      "eggs/pysanka_dots.svg",
      "eggs/pysanka_rhomb.svg",
      "eggs/pysanka_solar.svg",
      "eggs/pysanka_star.svg",
      "eggs/pysanka_waves.svg"
    ]
  },

  // Конфігурація рівнів (масив об'єктів, кожен описує рівень)
  LEVELS: [
    // Кожен рівень має розмір поля, стартову позицію, кількість і тип предметів, стіни та опис
    {
      gridSize: 5, // Розмір поля (5x5)
      robotStart: { x: 0, y: 0 }, // Початкова позиція робота
      collectiblesCount: 3, // Кількість предметів для збирання
      collectibleType: "🍎", // Тип предмета (емодзі)
      walls: [], // Масив стін (координати)
      description: "Допоможи роботу зібрати всі яблука на полі 5x5!",
    },
    {
      gridSize: 5,
      robotStart: { x: 2, y: 2 },
      collectiblesCount: 4,
      collectibleType: "🍎",
      walls: [
        { x: 1, y: 1 },
        { x: 1, y: 3 },
        { x: 3, y: 1 },
        { x: 3, y: 3 },
      ],
      description:
        "Тепер на полі є стіни! Робот не може проходити крізь них.",
    },
    {
      gridSize: 6,
      robotStart: { x: 0, y: 0 },
      collectiblesCount: 5,
      collectibleType: "🍊",
      walls: [
        { x: 2, y: 0 },
        { x: 2, y: 1 },
        { x: 2, y: 2 },
        { x: 2, y: 4 },
        { x: 2, y: 5 },
      ],
      description:
        "Поле стало більшим (6x6)! Збери всі апельсини та обійди стіни.",
    },
    {
      gridSize: 6,
      robotStart: { x: 0, y: 0 },
      collectiblesCount: 6,
      collectibleType: "🍌",
      walls: [
        { x: 1, y: 1 },
        { x: 3, y: 3 },
        { x: 3, y: 4 },
        { x: 4, y: 1 },
        { x: 4, y: 2 },
      ],
      description:
        "Збери всі банани! Але будь обережний - на шляху багато перешкод.",
    },
    {
      gridSize: 7,
      robotStart: { x: 3, y: 3 },
      collectiblesCount: 8,
      collectibleType: "🍓",
      walls: [
        { x: 1, y: 1 },
        { x: 1, y: 5 },
        { x: 2, y: 3 },
        { x: 3, y: 1 },
        { x: 3, y: 5 },
        { x: 4, y: 3 },
        { x: 5, y: 1 },
        { x: 5, y: 5 },
      ],
      description:
        "Найскладніший рівень! Поле 7x7 з купою перешкод. Використовуй багато команд, щоб зібрати всі полуниці.",
    },
    {
      gridSize: 7,
      robotStart: { x: 0, y: 3 },
      collectiblesCount: 10,
      collectibleType: "🥕",
      walls: [
        { x: 1, y: 1 },
        { x: 1, y: 2 },
        { x: 1, y: 4 },
        { x: 1, y: 5 },
        { x: 2, y: 1 },
        { x: 2, y: 5 },
        { x: 3, y: 1 },
        { x: 3, y: 3 },
        { x: 3, y: 5 },
        { x: 4, y: 1 },
        { x: 4, y: 5 },
        { x: 5, y: 1 },
        { x: 5, y: 2 },
        { x: 5, y: 3 },
        { x: 5, y: 4 },
        { x: 5, y: 5 },
      ],
      description:
        "U-подібний лабіринт! Спробуй зібрати всі морквини, обходячи довгі стіни.",
    },
    {
      gridSize: 8,
      robotStart: { x: 0, y: 0 },
      collectiblesCount: 12,
      collectibleType: "🥦",
      walls: [
        { x: 1, y: 0 },
        { x: 2, y: 0 },
        { x: 3, y: 0 },
        { x: 4, y: 0 },
        { x: 5, y: 0 },
        { x: 6, y: 0 },
        { x: 6, y: 1 },
        { x: 6, y: 2 },
        { x: 6, y: 3 },
        { x: 6, y: 4 },
        { x: 6, y: 5 },
        { x: 5, y: 5 },
        { x: 4, y: 5 },
        { x: 3, y: 5 },
        { x: 2, y: 5 },
        { x: 2, y: 4 },
        { x: 2, y: 3 },
        { x: 2, y: 2 },
        { x: 3, y: 2 },
        { x: 4, y: 2 },
        { x: 4, y: 3 },
      ],
      description:
        "Спіральний лабіринт на полі 8x8! Збери всю брокколі, рухаючись по спіралі.",
    },
    {
      gridSize: 8,
      robotStart: { x: 0, y: 0 },
      collectiblesCount: 14,
      collectibleType: "🍇",
      walls: [
        { x: 1, y: 1 },
        { x: 1, y: 3 },
        { x: 1, y: 5 },
        { x: 1, y: 7 },
        { x: 2, y: 1 },
        { x: 3, y: 1 },
        { x: 3, y: 3 },
        { x: 3, y: 5 },
        { x: 3, y: 7 },
        { x: 4, y: 1 },
        { x: 5, y: 1 },
        { x: 5, y: 3 },
        { x: 5, y: 5 },
        { x: 5, y: 7 },
        { x: 6, y: 1 },
        { x: 7, y: 1 },
        { x: 7, y: 3 },
        { x: 7, y: 5 },
        { x: 7, y: 7 },
      ],
      description:
        "Лабіринт з вузькими проходами. Знайди шлях через паралельні стіни до всіх виноградин!",
    },
    {
      gridSize: 9,
      robotStart: { x: 0, y: 0 },
      collectiblesCount: 16,
      collectibleType: "🥝",
      walls: [
        { x: 2, y: 0 },
        { x: 2, y: 1 },
        { x: 2, y: 2 },
        { x: 2, y: 4 },
        { x: 2, y: 5 },
        { x: 2, y: 6 },
        { x: 2, y: 8 },
        { x: 4, y: 2 },
        { x: 4, y: 4 },
        { x: 4, y: 6 },
        { x: 4, y: 8 },
        { x: 6, y: 0 },
        { x: 6, y: 2 },
        { x: 6, y: 3 },
        { x: 6, y: 4 },
        { x: 6, y: 6 },
        { x: 7, y: 6 },
        { x: 8, y: 6 },
        { x: 8, y: 7 },
        { x: 8, y: 8 },
      ],
      description:
        "Ускладнений лабіринт з декількома шляхами. Розробіть оптимальний маршрут для збору всіх ківі!",
    },
    {
      gridSize: 10,
      robotStart: { x: 0, y: 0 },
      collectiblesCount: 20,
      collectibleType: "🍒",
      walls: [
        { x: 1, y: 1 },
        { x: 1, y: 3 },
        { x: 1, y: 5 },
        { x: 1, y: 7 },
        { x: 1, y: 9 },
        { x: 2, y: 1 },
        { x: 3, y: 1 },
        { x: 3, y: 3 },
        { x: 3, y: 5 },
        { x: 3, y: 7 },
        { x: 3, y: 8 },
        { x: 3, y: 9 },
        { x: 5, y: 0 },
        { x: 5, y: 1 },
        { x: 5, y: 2 },
        { x: 5, y: 3 },
        { x: 5, y: 5 },
        { x: 5, y: 7 },
        { x: 5, y: 9 },
        { x: 6, y: 5 },
        { x: 7, y: 1 },
        { x: 7, y: 2 },
        { x: 7, y: 3 },
        { x: 7, y: 5 },
        { x: 7, y: 7 },
        { x: 7, y: 9 },
        { x: 8, y: 7 },
        { x: 9, y: 1 },
        { x: 9, y: 3 },
        { x: 9, y: 5 },
        { x: 9, y: 7 },
      ],
      description:
        "Фінальний рівень! Величезне поле 10x10 з надскладним лабіринтом. Зберіть усі вишні, якщо зможете!",
    },
  ],

  // Селектори DOM-елементів (для зручності роботи з елементами сторінки)
  SELECTORS: {
    RUN_BUTTON: '#runBtn',
    CLEAR_BUTTON: '#clearBtn',
    RESET_BUTTON: '#resetBtn',
    STOP_BUTTON: '#stopBtn',
    SOUND_TOGGLE_BUTTON: '#soundToggleBtn',
    CONFIRM_CLEAR_MODAL: '#confirmClearModal',
    CONFIRM_CLEAR_OK_BUTTON: '#confirmClearOkBtn',
    CONFIRM_CLEAR_CANCEL_BUTTON: '#confirmClearCancelBtn',
    LEVEL_PROGRESS: '#levelProgress',
    PROGRAM: '#program',
    ROBOT_FIELD: '#robotField',
    COMMANDS_CONTAINER: '#commandsContainer',
    LEVEL_DESCRIPTION: '#levelDescription',
    TOAST: '#toast'
  }
}; 
