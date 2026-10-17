window.AlgoLessons = {
  13: {
    id: 13,
    rememberTitle: 'Одна стрілка — один крок',
    watch: {
      kicker: 'Дивись',
      title: 'Познайомся з Робі',
      intro: 'Робі рухається тільки за твоїми командами.',
      frames: [
        { icon: 'robot', title: 'Робі слухає команду', text: 'Натисни стрілку — Робі зробить один крок.', cue: 'Команда → дія' },
        { icon: 'command', title: 'Одна стрілка — один крок', text: 'Кожна стрілка показує напрям одного кроку.', cue: '1 команда = 1 крок' },
        { icon: 'aim', title: 'Знайди зірку', text: 'Подивись, де зірка, і обери напрям.', cue: 'Подивись → обери' },
        { icon: 'check', title: 'Помилився? Спробуй ще', text: 'Якщо Робі пішов не туди, обери іншу стрілку.', cue: 'Точна команда' }
      ]
    },
    remember: [
      { icon: 'robot', title: 'Є Робі', text: 'Робі робить те, що показує стрілка.' },
      { icon: 'command', title: 'Стрілка — це команда', text: 'Кожна стрілка рухає Робі на одну клітинку.' },
      { icon: 'aim', title: 'Дивись на ціль', text: 'Обирай напрям від робота до зірки.' }
    ],
    try: {
      kind: 'commandLab', instruction: 'ДАЙ ОДНУ КОМАНДУ',
      rounds: [
        { size: 3, start: [1,1], goal: [1,2], question: 'Зірка праворуч. Яку команду дати Робі?', hint: 'Потрібен лише один крок.' }
      ]
    },
    practice: {
      kind: 'commandLab', instruction: 'ОБЕРИ ТОЧНУ КОМАНДУ',
      rounds: [
        { size: 3, start: [2,1], goal: [1,1], question: 'Куди має зробити крок Робі?', hint: 'Зірка на одну клітинку вище.' },
        { size: 3, start: [0,2], goal: [1,2], question: 'Тепер зірка нижче. Яка команда?', hint: 'Один крок — одна команда.' },
        { size: 3, start: [1,1], goal: [1,0], question: 'Яка команда приведе до зірки?', hint: 'Подивись, з якого боку ціль.' }
      ]
    },
    assessment: {
      kind: 'commandLab', instruction: 'ПОКАЖИ, ЩО ВМІЄШ',
      rounds: [
        { size: 3, start: [2,2], goal: [2,1], question: 'Обери команду для одного точного кроку.' },
        { size: 3, start: [0,0], goal: [1,0], question: 'Куди рухатися Робі?' },
        { size: 3, start: [1,0], goal: [0,0], question: 'Остання команда — яка?' }
      ]
    }
  },

  14: {
    id: 14,
    rememberTitle: 'Кілька команд — маршрут',
    watch: {
      kicker: 'Дивись',
      title: 'Допоможи Робі дістатися зірки',
      intro: 'Склади стрілки по черзі. Потім запусти.',
      frames: [
        { icon: 'route', title: 'Знайди Робі та зірку', text: 'Подивись на поле й перешкоди.', cue: 'Старт → ціль' },
        { icon: 'sequence', title: 'Алгоритм', text: 'Кілька команд по черзі — це алгоритм.', cue: 'Порядок важливий' },
        { icon: 'play', title: 'Запусти', text: 'Подивись, куди прийде Робі.', cue: 'Склади → запусти' },
        { icon: 'think', title: 'Шляхів може бути кілька', text: 'Головне — дістатися зірки й не зайти на блок.', cue: 'Головне — результат' }
      ]
    },
    remember: [
      { icon: 'sequence', title: 'Команди по черзі', text: 'Алгоритм — це команди по черзі.' },
      { icon: 'route', title: 'Обходь перешкоди', text: 'Подивись на перешкоди.' },
      { icon: 'play', title: 'Запускай і перевіряй', text: 'Перевір, чи Робі дійшов до зірки.' }
    ],
    try: {
      kind: 'routeRunner', instruction: 'СКЛАДИ МАРШРУТ',
      rounds: [
        { size: 4, start: [3,0], goal: [2,2], obstacles: [[3,1]], maxCommands: 4, question: 'Допоможи Робі обійти блок і дістатися зірки.', hint: 'Додай команди, потім натисни «Запустити».' }
      ]
    },
    practice: {
      kind: 'routeRunner', instruction: 'СКЛАДИ МАРШРУТ',
      rounds: [
        { size: 4, start: [3,0], goal: [0,2], obstacles: [[2,1],[1,1]], maxCommands: 6, question: 'Знайди шлях угору і до зірки.', hint: 'Перешкоди не можна проходити.' },
        { size: 4, start: [0,0], goal: [3,3], obstacles: [[0,2],[1,2],[2,0]], maxCommands: 7, question: 'Проведи Робі до нижнього правого кута.', hint: 'Шлях не обов’язково прямий.' }
      ]
    },
    assessment: {
      kind: 'routeRunner', instruction: 'СКЛАДИ МАРШРУТ',
      rounds: [
        { size: 4, start: [3,3], goal: [0,1], obstacles: [[2,2],[1,2]], maxCommands: 6, question: 'Склади новий маршрут до зірки.' },
        { size: 4, start: [0,3], goal: [3,0], obstacles: [[1,2],[1,1],[2,1]], maxCommands: 7, question: 'Дістанься цілі, не заходячи на блоки.' }
      ]
    }
  },

  15: {
    id: 15,
    rememberTitle: 'Запусти → знайди → виправ → перевір',
    watch: {
      kicker: 'Дивись',
      title: 'Знайди помилку',
      intro: 'Робі пішов не туди? Знайди неправильний крок і виправ його.',
      frames: [
        { icon: 'play', title: '1. Запусти', text: 'Подивись, куди йде Робі.', cue: 'Запусти' },
        { icon: 'debug', title: '2. Знайди помилку', text: 'На якому кроці Робі пішов не туди?', cue: 'Знайди' },
        { icon: 'command', title: '3. Виправ команду', text: 'Зміни тільки неправильний крок.', cue: 'Виправ' },
        { icon: 'check', title: '4. Перевір', text: 'Запусти ще раз.', cue: 'Виправ → перевір' }
      ]
    },
    remember: [
      { icon: 'debug', title: 'Помилятися можна', text: 'Помилка показує, що треба змінити.' },
      { icon: 'think', title: 'Знайди крок', text: 'Знайди місце, де Робі пішов не туди.' },
      { icon: 'check', title: 'Виправ і перевір', text: 'Запусти ще раз.' }
    ],
    try: {
      kind: 'debugRunner', instruction: 'ЗНАЙДИ ОДНУ ПОМИЛКУ',
      rounds: [
        { size: 4, start: [3,0], goal: [1,2], program: ['up','right','down','right'], question: 'У цьому алгоритмі одна команда веде Робі не туди.', hint: 'Спочатку запусти. Потім зміни лише один крок.' }
      ]
    },
    practice: {
      kind: 'debugRunner', instruction: 'ВИПРАВ АЛГОРИТМ',
      rounds: [
        { size: 4, start: [0,0], goal: [2,2], program: ['right','left','down','down'], question: 'Робі мав дістатися нижче і праворуч. Де помилка?' },
        { size: 4, start: [3,3], goal: [1,1], program: ['left','left','down','up'], question: 'Один крок веде за край поля. Виправ його.' }
      ]
    },
    assessment: {
      kind: 'debugRunner', instruction: 'ВИПРАВ ПОМИЛКУ',
      rounds: [
        { size: 4, start: [2,0], goal: [0,2], program: ['right','down','up','up'], question: 'Знайди та виправ одну неправильну команду.' },
        { size: 4, start: [0,3], goal: [2,1], program: ['down','down','right','left'], question: 'Знайди ще одну помилку.' }
      ]
    }
  },

  16: {
    id: 16,
    rememberTitle: 'Одна дія багато разів → повтор',
    themeComplete: 'Готово! Ти пройшов усі цифрові суперсили.',
    watch: {
      kicker: 'Дивись',
      title: 'Однакові команди можна скоротити',
      intro: 'Якщо одна стрілка повторюється, запиши її один раз і додай число.',
      frames: [
        { icon: 'sequence', title: 'Знайди однакові стрілки', text: '→ → → → — це чотири однакові кроки.', cue: '→ → → →' },
        { icon: 'repeat', title: 'Додай число', text: 'Запиши коротше: «4 рази →».', cue: 'Повтори 4 × →' },
        { icon: 'check', title: 'Робі має прийти туди ж', text: 'Короткий запис має привести Робі до тієї самої зірки.', cue: 'Коротше, але те саме' },
        { icon: 'think', title: 'Порахуй повтори', text: 'Обери стрілку й число.', cue: 'Команда + кількість' }
      ]
    },
    remember: [
      { icon: 'repeat', title: 'Повтор = стрілка + число', text: 'Обери стрілку й число повторів.' },
      { icon: 'sequence', title: 'Шукай однакові команди', text: 'Використовуй повтор для однакових кроків.' },
      { icon: 'check', title: 'Перевір результат', text: 'Робі має прийти туди ж.' }
    ],
    try: {
      kind: 'repeatRunner', instruction: 'СКОРОТИ ОДНАКОВІ КОМАНДИ',
      rounds: [
        { size: 4, start: [2,0], goal: [2,3], direction: 'right', repeatCount: 3, question: 'Як коротко записати три кроки праворуч?', hint: 'Обери команду та число повторів.' }
      ]
    },
    practice: {
      kind: 'repeatRunner', instruction: 'СКОРОТИ',
      rounds: [
        { size: 5, start: [4,2], goal: [1,2], direction: 'up', repeatCount: 3, question: 'Скороти три однакові кроки вгору.' },
        { size: 5, start: [0,0], goal: [0,4], direction: 'right', repeatCount: 4, question: 'Заміни чотири стрілки одним повтором.' }
      ]
    },
    assessment: {
      kind: 'repeatRunner', instruction: 'СКОРОТИ',
      rounds: [
        { size: 5, start: [1,4], goal: [4,4], direction: 'down', repeatCount: 3, question: 'Створи короткий запис для цього маршруту.' },
        { size: 5, start: [4,3], goal: [4,0], direction: 'left', repeatCount: 3, question: 'Останнє завдання: скороти однакові команди.' }
      ]
    }
  }
};
