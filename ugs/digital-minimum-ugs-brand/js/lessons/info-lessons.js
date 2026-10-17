window.InfoLessons = {
  4: {
    id: 4,
    rememberTitle: 'Текст, зображення, звук і відео',
    watch: {
      kicker: 'Дивись',
      title: 'Інформація буває різною',
      intro: 'Інформацію можна читати, бачити, чути або дивитися.',
      frames: [
        { icon: 'textinfo', title: 'Текст', text: 'Текст — це букви й слова.', cue: 'Букви й слова → текст' },
        { icon: 'photo', title: 'Зображення', text: 'Зображення — це фото, малюнок або схема.', cue: 'Фото або малюнок → зображення' },
        { icon: 'speaker', title: 'Звук', text: 'Звук — це голос, музика або сигнал.', cue: 'Чуємо → звук' },
        { icon: 'video', title: 'Відео', text: 'Відео показує рух. Часто в ньому є звук.', cue: 'Рухомі кадри → відео' }
      ]
    },
    remember: [
      { icon: 'textinfo', title: 'Текст', text: 'Букви, слова, речення.' },
      { icon: 'photo', title: 'Зображення', text: 'Фото, малюнок, схема.' },
      { icon: 'speaker', title: 'Звук', text: 'Голос, музика, сигнал.' },
      { icon: 'video', title: 'Відео', text: 'Рух і часто звук.' }
    ],
    try: {
      kind: 'media',
      title: 'Що це?',
      instruction: 'ПОДИВИСЬ АБО ПОСЛУХАЙ',
      rounds: [
        { stimulus: { kind: 'image', icon: 'apple', label: 'Малюнок яблука' }, answer: 'image' }
      ]
    },
    practice: {
      kind: 'media',
      title: 'Що це?',
      instruction: 'ОБЕРИ',
      rounds: [
        { stimulus: { kind: 'text', text: 'КІТ' }, answer: 'text' },
        { stimulus: { kind: 'sound', tone: 523 }, answer: 'sound' },
        { stimulus: { kind: 'image', icon: 'tree', label: 'Малюнок дерева' }, answer: 'image' },
        { stimulus: { kind: 'video', icon: 'bus', label: 'Автобус рухається' }, answer: 'video' }
      ]
    },
    assessment: {
      kind: 'media',
      title: 'Покажи, що вмієш',
      instruction: 'ОБЕРИ',
      rounds: [
        { stimulus: { kind: 'sound', tone: 660 }, answer: 'sound' },
        { stimulus: { kind: 'video', icon: 'bicycle', label: 'Велосипед рухається' }, answer: 'video' },
        { stimulus: { kind: 'text', text: 'ДІМ' }, answer: 'text' },
        { stimulus: { kind: 'image', icon: 'cat', label: 'Малюнок кота' }, answer: 'image' }
      ]
    }
  },

  5: {
    id: 5,
    rememberTitle: 'Схоже — разом',
    watch: {
      kicker: 'Дивись',
      title: 'Сортуй схожі речі разом',
      intro: 'Сортування допомагає навести порядок.',
      frames: [
        { icon: 'sort', title: 'Що тут спільного?', text: 'Подивись, що в цих предметів спільного.', cue: 'Схоже → разом' },
        { icon: 'cat', title: 'Знайди схоже', text: 'Кіт і пес — тварини. Автобус і велосипед — транспорт.', cue: 'Схоже → разом' },
        { icon: 'media', title: 'Сортуй і інформацію', text: 'Фото — до фото, звуки — до звуків.', cue: 'Тип інформації → група' }
      ]
    },
    remember: [
      { icon: 'sort', title: 'Що спільного?', text: 'Подивись, що спільного.' },
      { icon: 'cat', title: 'Схожі разом', text: 'Схожі речі клади в одну групу.' },
      { icon: 'check', title: 'Перевір', text: 'Перевір, чи все на своєму місці.' }
    ],
    try: {
      kind: 'sort',
      title: 'Розклади по двох групах',
      instruction: 'ОБЕРИ ПРЕДМЕТ → ОБЕРИ ГРУПУ',
      rounds: [
        {
          question: 'Де тварини, а де транспорт?',
          bins: [
            { id: 'animals', label: 'Тварини', icon: 'cat' },
            { id: 'transport', label: 'Транспорт', icon: 'bus' }
          ],
          items: [
            { id: 'cat', label: 'Кіт', icon: 'cat', bin: 'animals' },
            { id: 'bus', label: 'Автобус', icon: 'bus', bin: 'transport' },
            { id: 'dog', label: 'Пес', icon: 'dog', bin: 'animals' },
            { id: 'bike', label: 'Велосипед', icon: 'bicycle', bin: 'transport' }
          ]
        }
      ]
    },
    practice: {
      kind: 'sort',
      title: 'Сортуй ще',
      instruction: 'РОЗКЛАДИ',
      rounds: [
        {
          question: 'Що можна з’їсти, а що допомагає їхати?',
          bins: [
            { id: 'food', label: 'Їжа', icon: 'apple' },
            { id: 'transport', label: 'Транспорт', icon: 'bicycle' }
          ],
          items: [
            { id: 'apple', label: 'Яблуко', icon: 'apple', bin: 'food' },
            { id: 'carrot', label: 'Морква', icon: 'carrot', bin: 'food' },
            { id: 'bus', label: 'Автобус', icon: 'bus', bin: 'transport' },
            { id: 'bike', label: 'Велосипед', icon: 'bicycle', bin: 'transport' }
          ]
        },
        {
          question: 'Розклади за видом інформації',
          bins: [
            { id: 'picture', label: 'Зображення', icon: 'photo' },
            { id: 'sound', label: 'Звук', icon: 'speaker' }
          ],
          items: [
            { id: 'photo-cat', label: 'Фото кота', icon: 'cat', bin: 'picture' },
            { id: 'drawing-tree', label: 'Малюнок дерева', icon: 'tree', bin: 'picture' },
            { id: 'music', label: 'Музика', icon: 'speaker', bin: 'sound' },
            { id: 'voice', label: 'Голос', icon: 'headphones', bin: 'sound' }
          ]
        }
      ]
    },
    assessment: {
      kind: 'sort',
      title: 'Покажи, що вмієш',
      instruction: 'РОЗКЛАДИ БЕЗ ПІДКАЗКИ',
      rounds: [
        {
          question: 'Знайди тварин і їжу',
          bins: [
            { id: 'animals', label: 'Тварини', icon: 'dog' },
            { id: 'food', label: 'Їжа', icon: 'carrot' }
          ],
          items: [
            { id: 'dog', label: 'Пес', icon: 'dog', bin: 'animals' },
            { id: 'apple', label: 'Яблуко', icon: 'apple', bin: 'food' },
            { id: 'cat', label: 'Кіт', icon: 'cat', bin: 'animals' },
            { id: 'carrot', label: 'Морква', icon: 'carrot', bin: 'food' }
          ]
        },
        {
          question: 'Що читаємо, а що слухаємо?',
          bins: [
            { id: 'text', label: 'Текст', icon: 'textinfo' },
            { id: 'sound', label: 'Звук', icon: 'speaker' }
          ],
          items: [
            { id: 'word', label: 'Слово', icon: 'textinfo', bin: 'text' },
            { id: 'voice', label: 'Голос', icon: 'speaker', bin: 'sound' },
            { id: 'sentence', label: 'Речення', icon: 'textinfo', bin: 'text' },
            { id: 'music', label: 'Музика', icon: 'headphones', bin: 'sound' }
          ]
        }
      ]
    }
  },

  6: {
    id: 6,
    rememberTitle: 'Спочатку → потім → в кінці',
    watch: {
      kicker: 'Дивись',
      title: 'Що спочатку, а що потім?',
      intro: 'Деякі дії треба робити по черзі.',
      frames: [
        { icon: 'sequence', title: 'Знайди початок', text: 'Подумай, що було спочатку.', cue: 'Спочатку → потім' },
        { icon: 'sprout', title: 'Подивись, що змінюється', text: 'Насінина стає паростком, а паросток — рослиною.', cue: 'Насінина → паросток → рослина' },
        { icon: 'cameraopen', title: 'Дії теж ідуть по черзі', text: 'Щоб зробити фото: відкрий камеру, наведи й натисни кнопку.', cue: 'Відкрив → навів → сфотографував' }
      ]
    },
    remember: [
      { icon: 'sequence', title: 'Початок', text: 'Знайди перший крок.' },
      { icon: 'route', title: 'Середина', text: 'Постав наступний крок.' },
      { icon: 'check', title: 'Кінець', text: 'Перевір увесь порядок.' }
    ],
    try: {
      kind: 'sequence',
      title: 'Що було спочатку?',
      instruction: 'НАТИСКАЙ ПО ЧЕРЗІ',
      rounds: [
        {
          question: 'Як росте рослина?',
          items: [
            { id: 'tree', label: 'Рослина', icon: 'tree' },
            { id: 'seed', label: 'Насінина', icon: 'seed' },
            { id: 'sprout', label: 'Паросток', icon: 'sprout' }
          ],
          correct: ['seed', 'sprout', 'tree']
        }
      ]
    },
    practice: {
      kind: 'sequence',
      title: 'Що за чим?',
      instruction: 'ПОСТАВ ПО ПОРЯДКУ',
      rounds: [
        {
          question: 'Збираємося до школи',
          items: [
            { id: 'bag', label: 'Взяти рюкзак', icon: 'backpack' },
            { id: 'wake', label: 'Прокинутися', icon: 'wake' },
            { id: 'shirt', label: 'Одягнутися', icon: 'shirt' },
            { id: 'brush', label: 'Почистити зуби', icon: 'toothbrush' }
          ],
          correct: ['wake', 'brush', 'shirt', 'bag']
        },
        {
          question: 'Робимо фотографію',
          items: [
            { id: 'photo', label: 'Побачити фото', icon: 'photo' },
            { id: 'open', label: 'Відкрити камеру', icon: 'cameraopen' },
            { id: 'aim', label: 'Навести камеру', icon: 'aim' },
            { id: 'tap', label: 'Натиснути кнопку', icon: 'shutter' }
          ],
          correct: ['open', 'aim', 'tap', 'photo']
        }
      ]
    },
    assessment: {
      kind: 'sequence',
      title: 'Покажи, що вмієш',
      instruction: 'ПОСТАВ ПО ПОРЯДКУ',
      rounds: [
        {
          question: 'Як з’являється цифровий малюнок?',
          items: [
            { id: 'save', label: 'Зберегти', icon: 'save' },
            { id: 'draw', label: 'Намалювати', icon: 'pencil' },
            { id: 'open', label: 'Відкрити малювання', icon: 'photo' }
          ],
          correct: ['open', 'draw', 'save']
        },
        {
          question: 'Що відбувається з рослиною?',
          items: [
            { id: 'sprout', label: 'Паросток', icon: 'sprout' },
            { id: 'tree', label: 'Рослина', icon: 'tree' },
            { id: 'seed', label: 'Насінина', icon: 'seed' }
          ],
          correct: ['seed', 'sprout', 'tree']
        }
      ]
    }
  },

  7: {
    id: 7,
    rememberTitle: 'Створи → збережи → знайди',
    themeComplete: 'Супер! Ти пройшов тему про інформацію.',
    watch: {
      kicker: 'Дивись',
      title: 'Як не загубити свою роботу',
      intro: 'Після роботи її треба зберегти. Іноді програма зберігає сама.',
      frames: [
        { icon: 'pencil', title: 'Створи', text: 'Спочатку зроби свою роботу.', cue: 'Створи роботу' },
        { icon: 'save', title: 'Збережи', text: 'Натисни «Зберегти» або зачекай, поки програма збереже сама.', cue: 'Збережи' },
        { icon: 'gallery', title: 'Знайди', text: 'Потім знайди її у «Моїх роботах», галереї або файлах.', cue: 'Знайди свою роботу' }
      ]
    },
    remember: [
      { icon: 'pencil', title: 'Створи', text: 'Зроби роботу.' },
      { icon: 'save', title: 'Збережи', text: 'Подивись, чи робота збереглася.' },
      { icon: 'gallery', title: 'Знайди', text: 'Знайди місце, де лежать твої роботи.' }
    ],
    try: {
      kind: 'saveFind',
      title: 'Створи й знайди свою роботу',
      instruction: 'СТВОРИ → ЗБЕРЕЖИ → ЗНАЙДИ',
      rounds: [
        { target: { id: 'tree', label: 'Дерево', icon: 'tree' }, choices: [
          { id: 'tree', label: 'Дерево', icon: 'tree' },
          { id: 'cat', label: 'Кіт', icon: 'cat' },
          { id: 'apple', label: 'Яблуко', icon: 'apple' }
        ], saveMode: 'manual' }
      ]
    },
    practice: {
      kind: 'saveFind',
      title: 'Збережи двома способами',
      instruction: 'СТВОРИ І ЗНАЙДИ',
      rounds: [
        { target: { id: 'cat', label: 'Кіт', icon: 'cat' }, choices: [
          { id: 'cat', label: 'Кіт', icon: 'cat' },
          { id: 'bus', label: 'Автобус', icon: 'bus' },
          { id: 'tree', label: 'Дерево', icon: 'tree' }
        ], saveMode: 'manual' },
        { target: { id: 'apple', label: 'Яблуко', icon: 'apple' }, choices: [
          { id: 'apple', label: 'Яблуко', icon: 'apple' },
          { id: 'dog', label: 'Пес', icon: 'dog' },
          { id: 'bicycle', label: 'Велосипед', icon: 'bicycle' }
        ], saveMode: 'auto' }
      ]
    },
    assessment: {
      kind: 'saveFind',
      title: 'Покажи, що вмієш',
      instruction: 'СПРОБУЙ САМ',
      rounds: [
        { target: { id: 'bus', label: 'Автобус', icon: 'bus' }, choices: [
          { id: 'bus', label: 'Автобус', icon: 'bus' },
          { id: 'tree', label: 'Дерево', icon: 'tree' },
          { id: 'cat', label: 'Кіт', icon: 'cat' }
        ], saveMode: 'manual' },
        { target: { id: 'dog', label: 'Пес', icon: 'dog' }, choices: [
          { id: 'dog', label: 'Пес', icon: 'dog' },
          { id: 'apple', label: 'Яблуко', icon: 'apple' },
          { id: 'bicycle', label: 'Велосипед', icon: 'bicycle' }
        ], saveMode: 'auto' }
      ]
    }
  }
};
