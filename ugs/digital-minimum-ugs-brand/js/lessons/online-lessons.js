window.OnlineLessons = {
  8: {
    id: 8,
    rememberTitle: 'Посилання веде на іншу сторінку',
    watch: {
      kicker: 'Дивись',
      title: 'Як переходити сторінками',
      intro: 'Натисни посилання, щоб відкрити іншу сторінку. «Назад» повертає назад.',
      frames: [
        { icon: 'browser', title: 'Сайт', text: 'На сайті може бути багато сторінок.', cue: 'Сайт → сторінки' },
        { icon: 'webpage', title: 'Сторінка', text: 'На сторінці є текст, картинки, кнопки й посилання.', cue: 'Сторінка — частина сайту' },
        { icon: 'link', title: 'Посилання', text: 'Посилання відкриває іншу сторінку.', cue: 'Натисни → перейди' },
        { icon: 'back', title: 'Назад', text: 'Натисни «Назад», щоб повернутися.', cue: 'Назад → попередня сторінка' }
      ]
    },
    remember: [
      { icon: 'webpage', title: 'Сторінка', text: 'Це одна частина сайту.' },
      { icon: 'link', title: 'Посилання', text: 'Відкриває іншу сторінку.' },
      { icon: 'back', title: 'Назад', text: 'Повертає на попередню сторінку.' }
    ],
    try: {
      kind: 'browserSim',
      title: 'Знайди сторінку про тварин',
      instruction: 'ВІДКРИЙ ПОСИЛАННЯ',
      rounds: [
        {
          task: 'На головній сторінці відкрий «Тварини».',
          start: 'home', goal: { page: 'animals' }, idealAttempts: 1,
          pages: {
            home: { title: 'Світ знань', icon: 'globe', address: 'navchannia.local', links: [
              { to: 'animals', label: 'Тварини', icon: 'cat' },
              { to: 'space', label: 'Космос', icon: 'star' },
              { to: 'plants', label: 'Рослини', icon: 'tree' }
            ]},
            animals: { title: 'Тварини', icon: 'cat', address: 'navchannia.local/tvaryny', body: 'Тут сторінка про тварин.' },
            space: { title: 'Космос', icon: 'star', address: 'navchannia.local/kosmos', body: 'Тут сторінка про космос.' },
            plants: { title: 'Рослини', icon: 'tree', address: 'navchannia.local/roslyny', body: 'Тут сторінка про рослини.' }
          }
        }
      ]
    },
    practice: {
      kind: 'browserSim',
      title: 'Відкрий і повернися',
      instruction: 'ВІДКРИЙ І ПОВЕРНИСЯ',
      rounds: [
        {
          task: 'Відкрий «Динозаври», а потім натисни «Назад».',
          start: 'home', goal: { page: 'home', requireBack: true }, idealAttempts: 2,
          pages: {
            home: { title: 'Цікаві теми', icon: 'globe', links: [
              { to: 'dino', label: 'Динозаври', icon: 'dino' },
              { to: 'ocean', label: 'Океан', icon: 'water' },
              { to: 'robots', label: 'Роботи', icon: 'robot' }
            ]},
            dino: { title: 'Динозаври', icon: 'dino', body: 'Ти відкрив сторінку про динозаврів.' },
            ocean: { title: 'Океан', icon: 'water', body: 'Ти відкрив сторінку про океан.' },
            robots: { title: 'Роботи', icon: 'robot', body: 'Ти відкрив сторінку про роботів.' }
          }
        },
        {
          task: 'Відкрий «Планети», а потім «Марс».',
          start: 'home', goal: { page: 'mars' }, idealAttempts: 2,
          pages: {
            home: { title: 'Космос', icon: 'star', links: [
              { to: 'planets', label: 'Планети', icon: 'planet' },
              { to: 'stars', label: 'Зорі', icon: 'star' },
              { to: 'rockets', label: 'Ракети', icon: 'rocket' }
            ]},
            planets: { title: 'Планети', icon: 'planet', links: [
              { to: 'mars', label: 'Марс', icon: 'planet' },
              { to: 'earth', label: 'Земля', icon: 'globe' }
            ]},
            stars: { title: 'Зорі', icon: 'star', body: 'Сторінка про зорі.' },
            rockets: { title: 'Ракети', icon: 'rocket', body: 'Сторінка про ракети.' },
            mars: { title: 'Марс', icon: 'planet', body: 'Ти дійшов до сторінки про Марс.' },
            earth: { title: 'Земля', icon: 'globe', body: 'Сторінка про Землю.' }
          }
        }
      ]
    },
    assessment: {
      kind: 'browserSim',
      title: 'Покажи, що вмієш',
      instruction: 'ЗНАЙДИ СТОРІНКУ',
      rounds: [
        {
          task: 'Відкрий «Погода», потім повернися назад.',
          start: 'home', goal: { page: 'home', requireBack: true }, idealAttempts: 2,
          pages: {
            home: { title: 'Мій день', icon: 'globe', links: [
              { to: 'weather', label: 'Погода', icon: 'sun' },
              { to: 'games', label: 'Ігри', icon: 'game' },
              { to: 'books', label: 'Книжки', icon: 'book' }
            ]},
            weather: { title: 'Погода', icon: 'sun', body: 'Сторінка про погоду.' },
            games: { title: 'Ігри', icon: 'game', body: 'Сторінка про ігри.' },
            books: { title: 'Книжки', icon: 'book', body: 'Сторінка про книжки.' }
          }
        },
        {
          task: 'Відкрий «Тварини», а потім «Лев».',
          start: 'home', goal: { page: 'lion' }, idealAttempts: 2,
          pages: {
            home: { title: 'Енциклопедія', icon: 'book', links: [
              { to: 'animals', label: 'Тварини', icon: 'cat' },
              { to: 'plants', label: 'Рослини', icon: 'tree' },
              { to: 'space', label: 'Космос', icon: 'star' }
            ]},
            animals: { title: 'Тварини', icon: 'cat', links: [
              { to: 'lion', label: 'Лев', icon: 'lion' },
              { to: 'dog', label: 'Пес', icon: 'dog' }
            ]},
            plants: { title: 'Рослини', icon: 'tree', body: 'Сторінка про рослини.' },
            space: { title: 'Космос', icon: 'star', body: 'Сторінка про космос.' },
            lion: { title: 'Лев', icon: 'lion', body: 'Ти знайшов сторінку про лева.' },
            dog: { title: 'Пес', icon: 'dog', body: 'Сторінка про пса.' }
          }
        }
      ]
    }
  },

  9: {
    id: 9,
    rememberTitle: 'Пиши в пошуку головні слова',
    watch: {
      kicker: 'Дивись',
      title: 'Шукай точніше',
      intro: 'Напиши, що саме хочеш знайти.',
      frames: [
        { icon: 'search', title: 'Що хочеш знайти?', text: 'Спочатку подумай, що шукаєш.', cue: 'Що хочу знайти?' },
        { icon: 'keyword', title: 'Візьми головні слова', text: 'Залиш найважливіші слова.', cue: 'жирафа + де живе' },
        { icon: 'results', title: 'Обери відповідь', text: 'Обери те, що відповідає твоєму питанню.', cue: 'Питання ↔ результат' },
        { icon: 'adult', title: 'Щось дивне? Скажи дорослому', text: 'Не відкривай те, що лякає або здається дивним.', cue: 'Сумніваєшся → запитай дорослого' }
      ]
    },
    remember: [
      { icon: 'search', title: 'Напиши, що шукаєш', text: 'Краще кілька точних слів.' },
      { icon: 'keyword', title: 'Головні слова', text: 'Вони допомагають знайти потрібне.' },
      { icon: 'results', title: 'Подивись на відповідь', text: 'Чи це те, що ти шукав?' }
    ],
    try: {
      kind: 'searchSim', title: 'Що краще написати?', instruction: 'ОБЕРИ',
      rounds: [
        {
          task: 'Хочеш дізнатися, де живе жирафа.', question: 'Що краще написати?', icon: 'giraffe',
          resultTitle: 'Добре! Тут є і «жирафа», і твоє питання.',
          options: [
            { text: 'де живе жирафа', correct: true },
            { text: 'тварини' },
            { text: 'жирафа гра' },
            { text: 'де живе' }
          ]
        }
      ]
    },
    practice: {
      kind: 'searchSim', title: 'Обирай головні слова', instruction: 'ОБЕРИ',
      rounds: [
        {
          task: 'Ти хочеш дізнатися, скільки ніг у павука.', question: 'Що краще написати?', icon: 'spider',
          options: [
            { text: 'скільки ніг у павука', correct: true },
            { text: 'павук' },
            { text: 'ноги' },
            { text: 'страшні тварини' }
          ]
        },
        {
          task: 'Хочеш побачити, як росте соняшник.', question: 'Що краще написати?', icon: 'flower',
          options: [
            { text: 'як росте соняшник', correct: true },
            { text: 'квіти' },
            { text: 'сонце' },
            { text: 'зелений' }
          ]
        }
      ]
    },
    assessment: {
      kind: 'searchSim', title: 'Покажи, що вмієш', instruction: 'ОБЕРИ',
      rounds: [
        {
          task: 'Потрібно дізнатися, чим харчується панда.', question: 'Що краще написати?', icon: 'panda',
          options: [
            { text: 'панда' },
            { text: 'чим харчується панда', correct: true },
            { text: 'тварини їжа' },
            { text: 'що їсти' }
          ]
        },
        {
          task: 'Потрібно дізнатися, чому йде дощ.', question: 'Що краще написати?', icon: 'rain',
          options: [
            { text: 'вода' },
            { text: 'погода сьогодні' },
            { text: 'чому йде дощ', correct: true },
            { text: 'хмара картинка' }
          ]
        }
      ]
    }
  },

  10: {
    id: 10,
    rememberTitle: 'Особисте — не для незнайомців',
    watch: {
      kicker: 'Дивись',
      title: 'Бережи особисте',
      intro: 'Адресу, телефон, пароль і місце, де ти буваєш, не надсилай незнайомцям.',
      frames: [
        { icon: 'privacy', title: 'Особисте', text: 'Не надсилай незнайомцям адресу, телефон, пароль або назву школи.', cue: 'Особисте → бережи' },
        { icon: 'game', title: 'Незнайомець у грі', text: 'Аватар не означає, що ти знаєш цю людину.', cue: 'Аватар ≠ знайома людина' },
        { icon: 'footprint', title: 'Онлайн може залишитися', text: 'Фото або повідомлення можуть зберегти чи переслати.', cue: 'Надіслав → може залишитися' },
        { icon: 'think', title: 'Подумай перед відправкою', text: 'Чи можна це показувати? Не впевнений — запитай дорослого.', cue: 'Зупинись → подумай → надішли' }
      ]
    },
    remember: [
      { icon: 'privacy', title: 'Бережи особисте', text: 'Адреса, телефон, пароль і школа — не для незнайомців.' },
      { icon: 'footprint', title: 'Онлайн може залишитися', text: 'Те, що ти надіслав, можуть зберегти або переслати.' },
      { icon: 'think', title: 'Спочатку подумай', text: 'Перед відправкою подумай: це безпечно?' }
    ],
    try: {
      kind: 'safetyScenario', title: 'Що безпечніше?', instruction: 'ОБЕРИ ДІЮ',
      rounds: [
        {
          where: 'Чат у грі', icon: 'game', scene: 'Незнайомий гравець питає: «Напиши свою домашню адресу».', prompt: 'Що зробиш?',
          options: [
            { text: 'Напишу адресу', icon: 'message' },
            { text: 'Напишу лише номер будинку', icon: 'message' },
            { text: 'Не надішлю адресу й скажу дорослому', icon: 'adult', correct: true },
            { text: 'Запитаю його адресу у відповідь', icon: 'message' }
          ]
        }
      ]
    },
    practice: {
      kind: 'safetyScenario', title: 'Подумай перед відправкою', instruction: 'ЩО БЕЗПЕЧНІШЕ?',
      rounds: [
        {
          where: 'Онлайн-гра', icon: 'game', scene: 'Гравець, якого ти не знаєш у житті, просить номер телефону.', prompt: 'Що безпечніше?',
          options: [
            { text: 'Надіслати номер', icon: 'phone' },
            { text: 'Не надсилати. Сказати дорослому', icon: 'adult', correct: true },
            { text: 'Надіслати номер друга', icon: 'phone' },
            { text: 'Написати, де навчаюся', icon: 'school' }
          ]
        },
        {
          where: 'Фото', icon: 'camera', scene: 'Хочеш викласти фото друга.', prompt: 'Що зробити спочатку?',
          options: [
            { text: 'Викласти одразу', icon: 'send' },
            { text: 'Додати адресу місця', icon: 'location' },
            { text: 'Спитати дозволу', icon: 'adult', correct: true },
            { text: 'Надіслати всім у чат', icon: 'message' }
          ]
        }
      ]
    },
    assessment: {
      kind: 'safetyScenario', title: 'Покажи, що вмієш', instruction: 'ОБЕРИ БЕЗПЕЧНУ ДІЮ',
      rounds: [
        {
          where: 'Чат', icon: 'message', scene: 'Незнайомець питає назву твоєї школи й коли ти йдеш додому.', prompt: 'Що зробиш?',
          options: [
            { text: 'Відповім на обидва питання', icon: 'school' },
            { text: 'Скажу лише назву школи', icon: 'school' },
            { text: 'Не відповім. Скажу дорослому', icon: 'adult', correct: true },
            { text: 'Надішлю фото школи', icon: 'camera' }
          ]
        },
        {
          where: 'Публікація', icon: 'send', scene: 'На фото видно табличку з твоєю домашньою адресою.', prompt: 'Що безпечніше?',
          options: [
            { text: 'Викласти як є', icon: 'send' },
            { text: 'Не викладати фото з адресою', icon: 'privacy', correct: true },
            { text: 'Додати своє ім’я', icon: 'message' },
            { text: 'Надіслати незнайомцю', icon: 'message' }
          ]
        }
      ]
    }
  },

  11: {
    id: 11,
    rememberTitle: 'СТОП → ЗАКРИЙ → СКАЖИ',
    watch: {
      kicker: 'Дивись',
      title: 'Дивне повідомлення? Не відповідай',
      intro: 'Якщо тебе лякають, просять фото, секрет або зустріч — зупинись.',
      frames: [
        { icon: 'stop', title: 'СТОП', text: 'Не відповідай і нічого не надсилай.', cue: '1. СТОП' },
        { icon: 'close', title: 'ЗАКРИЙ', text: 'Закрий чат, сторінку або гру.', cue: '2. ЗАКРИЙ' },
        { icon: 'adult', title: 'СКАЖИ ДОРОСЛОМУ', text: 'Покажи це дорослому, якому довіряєш.', cue: '3. СКАЖИ' },
        { icon: 'danger', title: 'Кажуть «нікому не кажи»?', text: 'Все одно скажи дорослому, якому довіряєш.', cue: 'Скажи дорослому' }
      ]
    },
    remember: [
      { icon: 'stop', title: 'СТОП', text: 'Не відповідай і не натискай.' },
      { icon: 'close', title: 'ЗАКРИЙ', text: 'Закрий чат, сторінку або гру.' },
      { icon: 'adult', title: 'СКАЖИ', text: 'Скажи дорослому, якому довіряєш.' }
    ],
    try: {
      kind: 'sequence', title: 'Склади правило', instruction: 'ПОСТАВ ПО ПОРЯДКУ',
      rounds: [
        {
          question: 'Що робити, якщо онлайн щось не так?',
          items: [
            { id: 'tell', label: 'Скажи дорослому', icon: 'adult' },
            { id: 'stop', label: 'Стоп', icon: 'stop' },
            { id: 'close', label: 'Закрий', icon: 'close' }
          ],
          correct: ['stop', 'close', 'tell']
        }
      ]
    },
    practice: {
      kind: 'safetyScenario', title: 'Що зробиш?', instruction: 'ОБЕРИ БЕЗПЕЧНУ ДІЮ',
      rounds: [
        {
          where: 'Чат у грі', icon: 'game', scene: 'Незнайомий гравець пише: «Надішли фото. Тільки нікому не кажи».', prompt: 'Що робиш?',
          options: [
            { text: 'Надішлю фото', icon: 'camera' },
            { text: 'Продовжу розмову', icon: 'message' },
            { text: 'Стоп, закрию чат і скажу дорослому', icon: 'adult', correct: true },
            { text: 'Попрошу його фото спочатку', icon: 'camera' }
          ]
        },
        {
          where: 'Повідомлення', icon: 'link', scene: 'Хтось надсилає незнайоме посилання і пише: «Терміново натисни!»', prompt: 'Що безпечніше?',
          options: [
            { text: 'Натиснути швидше', icon: 'link' },
            { text: 'Не відкривати. Сказати дорослому', icon: 'adult', correct: true },
            { text: 'Переслати друзям', icon: 'send' },
            { text: 'Відповісти своїм паролем', icon: 'key' }
          ]
        },
        {
          where: 'Коментар', icon: 'message', scene: 'Тобі пишуть образливі слова, і тобі неприємно.', prompt: 'Що зробиш?',
          options: [
            { text: 'Відповім образою', icon: 'message' },
            { text: 'Сховаю від усіх', icon: 'close' },
            { text: 'Зупинюся і скажу дорослому', icon: 'adult', correct: true },
            { text: 'Надішлю особисті дані', icon: 'privacy' }
          ]
        }
      ]
    },
    assessment: {
      kind: 'safetyScenario', title: 'Покажи, що вмієш', instruction: 'ОБЕРИ БЕЗПЕЧНУ ДІЮ',
      rounds: [
        {
          where: 'Гра', icon: 'game', scene: 'Незнайомець пропонує зустрітися без батьків.', prompt: 'Що зробиш?',
          options: [
            { text: 'Погоджуся і нікому не скажу', icon: 'location' },
            { text: 'Запитаю адресу зустрічі', icon: 'location' },
            { text: 'Не погоджуся. Скажу дорослому', icon: 'adult', correct: true },
            { text: 'Надішлю свій номер', icon: 'phone' }
          ]
        },
        {
          where: 'Сайт', icon: 'browser', scene: 'На екрані з’явилася дивна страшна сторінка.', prompt: 'Що найкраще зробити?',
          options: [
            { text: 'Закрити. Сказати дорослому', icon: 'adult', correct: true },
            { text: 'Натискати всі кнопки', icon: 'tap' },
            { text: 'Надіслати її друзям', icon: 'send' },
            { text: 'Ввести свій пароль', icon: 'key' }
          ]
        }
      ]
    }
  },

  12: {
    id: 12,
    rememberTitle: 'Пароль — секретний ключ',
    themeComplete: 'Супер! Ти пройшов тему про Інтернет і безпеку.',
    watch: {
      kicker: 'Дивись',
      title: 'Пароль захищає твій вхід',
      intro: 'Пароль має бути важко вгадати. Не бери ім’я або дату народження.',
      frames: [
        { icon: 'key', title: 'Пароль — як ключ', text: 'Пароль захищає вхід у гру, сайт або застосунок.', cue: 'Пароль = ключ' },
        { icon: 'danger', title: 'Не бери просте', text: '«123456», ім’я або дата народження — легко вгадати.', cue: 'Просте → легко вгадати' },
        { icon: 'lock', title: 'Довше — краще', text: 'Кілька незвичних слів вгадати важче.', cue: 'Довше → важче вгадати' },
        { icon: 'adult', title: 'Не надсилай пароль', text: 'Потрібна допомога? Поклич дорослого, якому довіряєш.', cue: 'Потрібна допомога → дорослий' }
      ]
    },
    remember: [
      { icon: 'key', title: 'Пароль — це ключ', text: 'Він захищає твій вхід.' },
      { icon: 'lock', title: 'Важко вгадати', text: 'Не бери прості числа, ім’я або дату народження.' },
      { icon: 'privacy', title: 'Не надсилай незнайомцям', text: 'Тут не вводь свій справжній пароль.' }
    ],
    try: {
      kind: 'passwordGame', title: 'Який важче вгадати?', instruction: 'ОБЕРИ',
      rounds: [
        {
          task: 'Це лише приклади. Який важче вгадати?',
          options: [
            { text: '123456', level: 1, hint: 'дуже поширений' },
            { text: 'Марко2018', level: 1, hint: 'ім’я + рік' },
            { text: 'Кіт', level: 1, hint: 'дуже короткий' },
            { text: 'Лама-Ракета-Хмара-47!', level: 3, hint: 'довга незвична фраза', correct: true }
          ]
        }
      ]
    },
    practice: {
      kind: 'passwordGame', title: 'Який важче вгадати?', instruction: 'ОБЕРИ',
      rounds: [
        {
          task: 'Який важче вгадати?',
          options: [
            { text: 'password', level: 1, hint: 'поширене слово' },
            { text: '000000', level: 1, hint: 'повтор цифр' },
            { text: 'Сова-Човен-Місяць-82', level: 3, hint: 'довга фраза', correct: true },
            { text: 'Анна', level: 1, hint: 'ім’я' }
          ]
        },
        {
          task: 'Який не схожий на особисті дані?',
          options: [
            { text: 'Школа27', level: 1, hint: 'назва/номер школи' },
            { text: '2017-05-03', level: 1, hint: 'схоже на дату' },
            { text: 'Три-Веселі-Роботи-91!', level: 3, hint: 'довга незвична фраза', correct: true },
            { text: 'Іван', level: 1, hint: 'ім’я' }
          ]
        }
      ]
    },
    assessment: {
      kind: 'passwordGame', title: 'Покажи, що вмієш', instruction: 'ОБЕРИ',
      rounds: [
        {
          task: 'Який важче вгадати?',
          options: [
            { text: 'qwerty', level: 1, hint: 'послідовність клавіш' },
            { text: 'Синя-Комета-Їде-73!', level: 3, hint: 'довга фраза', correct: true },
            { text: '123123', level: 1, hint: 'повтор цифр' },
            { text: 'Олег10', level: 1, hint: 'ім’я + число' }
          ]
        },
        {
          task: 'Хтось просить твій пароль. Що робити?', mode: 'rule',
          options: [
            { text: 'Надіслати, якщо людина просить ввічливо', level: 1 },
            { text: 'Надіслати лише другу з гри', level: 1 },
            { text: 'Не надсилати. Потрібна допомога — покликати дорослого', level: 3, correct: true },
            { text: 'Викласти пароль, а потім змінити', level: 1 }
          ]
        }
      ]
    }
  }
};
