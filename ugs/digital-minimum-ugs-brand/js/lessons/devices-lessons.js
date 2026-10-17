window.DeviceLessons = {
  1: {
    id: 1,
    watch: {
      kicker: 'Дивись',
      title: 'Різні справи — різні помічники',
      intro: 'Кожен пристрій має свою роботу. Обери потрібний.',
      frames: [
        { icon: 'camera', title: 'Хочу зробити фото', text: 'Камера або смартфон роблять фото.', cue: 'Фото → камера' },
        { icon: 'headphones', title: 'Хочу послухати звук', text: 'У навушниках звук чуєш ти, а не всі навколо.', cue: 'Звук → навушники' },
        { icon: 'printer', title: 'Хочу отримати малюнок на папері', text: 'Принтер друкує на папері.', cue: 'На папір → принтер' },
        { icon: 'tablet', title: 'Хочу дивитися й виконувати вправи', text: 'Планшет або комп’ютер зручні для вправ і відео.', cue: 'Навчання → планшет або комп’ютер' }
      ]
    },
    remember: [
      { icon: 'camera', title: 'Камера', text: 'Фотографує та записує відео.' },
      { icon: 'headphones', title: 'Навушники', text: 'Допомагають слухати звук.' },
      { icon: 'printer', title: 'Принтер', text: 'Друкує на папері.' }
    ],
    try: {
      kind: 'quiz',
      title: 'Що допоможе надрукувати малюнок?',
      instruction: 'ОБЕРИ ПРИСТРІЙ',
      rounds: [
        {
          question: 'Що допоможе надрукувати малюнок?',
          options: [
            { icon: 'printer', label: 'Принтер', correct: true },
            { icon: 'camera', label: 'Камера' },
            { icon: 'headphones', label: 'Навушники' }
          ]
        }
      ]
    },
    practice: {
      kind: 'quiz',
      title: 'Підбери пристрій до справи',
      instruction: 'ОБЕРИ',
      rounds: [
        {
          question: 'Ти хочеш зробити фотографію. Що обереш?',
          options: [
            { icon: 'camera', label: 'Камера', correct: true },
            { icon: 'printer', label: 'Принтер' },
            { icon: 'headphones', label: 'Навушники' }
          ]
        },
        {
          question: 'Ти хочеш тихо послухати казку. Що допоможе?',
          options: [
            { icon: 'headphones', label: 'Навушники', correct: true },
            { icon: 'camera', label: 'Камера' },
            { icon: 'printer', label: 'Принтер' }
          ]
        },
        {
          question: 'Хочеш виконати вправу на екрані. Що обереш?',
          options: [
            { icon: 'tablet', label: 'Планшет', correct: true },
            { icon: 'printer', label: 'Принтер' },
            { icon: 'headphones', label: 'Навушники' }
          ]
        }
      ]
    },
    assessment: {
      kind: 'quiz',
      title: 'Покажи, що вмієш',
      instruction: 'ОБЕРИ',
      rounds: [
        {
          question: 'Хочеш сфотографувати малюнок. Що обереш?',
          options: [
            { icon: 'camera', label: 'Камера', correct: true },
            { icon: 'headphones', label: 'Навушники' },
            { icon: 'printer', label: 'Принтер' }
          ]
        },
        {
          question: 'Хочеш надрукувати текст. Що обереш?',
          options: [
            { icon: 'printer', label: 'Принтер', correct: true },
            { icon: 'tablet', label: 'Планшет' },
            { icon: 'camera', label: 'Камера' }
          ]
        },
        {
          question: 'Хочеш слухати тихо для інших. Що обереш?',
          options: [
            { icon: 'headphones', label: 'Навушники', correct: true },
            { icon: 'printer', label: 'Принтер' },
            { icon: 'camera', label: 'Камера' }
          ]
        },
        {
          question: 'Хочеш дивитися відео й натискати відповіді. Що обереш?',
          options: [
            { icon: 'tablet', label: 'Планшет', correct: true },
            { icon: 'printer', label: 'Принтер' },
            { icon: 'headphones', label: 'Лише навушники' }
          ]
        }
      ]
    }
  },

  2: {
    id: 2,
    watch: {
      kicker: 'Дивись',
      title: 'Керуй спокійно й безпечно',
      intro: 'Натискай, перетягуй і прокручуй. Час від часу відпочивай від екрана.',
      frames: [
        { icon: 'tap', title: 'Натисни', text: 'Коротко натисни на кнопку або предмет.', cue: 'Коротко натисни' },
        { icon: 'drag', title: 'Перетягни', text: 'Затисни предмет і перемісти його.', cue: 'Обери → перемісти' },
        { icon: 'scroll', title: 'Прокрути', text: 'Проведи пальцем або прокрути колесо миші.', cue: 'Прокрути сторінку' },
        { icon: 'break', title: 'Зроби коротку перерву', text: 'Відведи очі від екрана, випрямися й порухайся.', cue: 'Екран → пауза → рух' }
      ]
    },
    remember: [
      { icon: 'tap', title: 'Натисни', text: 'Короткий дотик або клік.' },
      { icon: 'drag', title: 'Перетягни', text: 'Перемісти об’єкт у потрібне місце.' },
      { icon: 'scroll', title: 'Прокрути', text: 'Подивись, що є нижче на сторінці.' },
      { icon: 'posture', title: 'Сиди зручно', text: 'Не тримай екран надто близько. Сиди зручно.' }
    ],
    try: {
      kind: 'control',
      mode: 'tap',
      title: 'Натисни потрібну картку',
      instruction: 'НАТИСНИ МИШУ'
    },
    practice: {
      kind: 'controlLab',
      title: 'Спробуй 4 дії',
      instruction: 'СПРОБУЙ'
    },
    assessment: {
      kind: 'controlAssessment',
      title: 'Покажи, що вмієш',
      instruction: 'ВИКОНАЙ 4 ЗАВДАННЯ'
    }
  },

  3: {
    id: 3,
    watch: {
      kicker: 'Дивись',
      title: 'Пишемо на клавіатурі',
      intro: 'Натискай літери й цифри. Пробіл розділяє слова, Backspace стирає, Enter починає новий рядок.',
      frames: [
        { icon: 'letterkey', title: 'Літери та цифри', text: 'Натисни клавішу — літера або цифра з’явиться на екрані.', cue: 'Клавіша → символ' },
        { icon: 'spacekey', title: 'Пробіл', text: 'Пробіл робить відстань між словами.', cue: 'Слово · слово' },
        { icon: 'backspace', title: 'Backspace', text: 'Стирає останню літеру, цифру або знак.', cue: 'Помилка → стерти' },
        { icon: 'enterkey', title: 'Enter', text: 'Починає новий рядок.', cue: 'Новий рядок' }
      ]
    },
    remember: [
      { icon: 'letterkey', title: 'Літера / цифра', text: 'Додає літеру, цифру або знак.' },
      { icon: 'spacekey', title: 'Пробіл', text: 'Розділяє слова.' },
      { icon: 'backspace', title: 'Backspace', text: 'Стирає останню літеру або знак.' },
      { icon: 'enterkey', title: 'Enter', text: 'Починає новий рядок.' }
    ],
    try: {
      kind: 'keyboard',
      title: 'Набери слово КІТ',
      instruction: 'НАТИСКАЙ КЛАВІШІ',
      tasks: [
        { type: 'type', target: 'КІТ', keys: ['К','І','Т','Д','М','А'] }
      ]
    },
    practice: {
      kind: 'keyboard',
      title: 'Спробуй клавіші',
      instruction: 'ВВОДЬ І ВИПРАВЛЯЙ',
      tasks: [
        { type: 'type', target: 'ДІМ', keys: ['Д','І','М','К','Т','А'] },
        { type: 'type', target: 'Я ТУТ', keys: ['Я','Т','У','І','К','М'], special: ['space'] },
        { type: 'backspace', start: 'КІТТ', target: 'КІТ', keys: ['К','І','Т'], special: ['backspace'] },
        { type: 'enter', start: 'ПРИВІТ', target: 'ПРИВІТ\nСВІТ', append: 'СВІТ', special: ['enter'] }
      ],
      optionalRealKeyboard: true
    },
    assessment: {
      kind: 'keyboard',
      title: 'Покажи, що вмієш',
      instruction: 'ВИКОНАЙ 4 ЗАВДАННЯ',
      tasks: [
        { type: 'type', target: 'КОД', keys: ['К','О','Д','І','Т','М'] },
        { type: 'type', target: 'Я ТУТ', keys: ['Я','Т','У','К','О','Д'], special: ['space'] },
        { type: 'backspace', start: 'ДІММ', target: 'ДІМ', keys: ['Д','І','М'], special: ['backspace'] },
        { type: 'enter', start: 'Я', target: 'Я\nТУТ', append: 'ТУТ', special: ['enter'] }
      ]
    }
  }
};
