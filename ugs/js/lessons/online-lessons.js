window.OnlineLessons = {
  "8": {
    "id": 8,
    "rememberTitle": "Посилання веде на іншу сторінку",
    "watch": {
      "kicker": "Дивись",
      "title": "Як переходити сторінками",
      "intro": "Допоможи Юджі відкрити потрібну сторінку й повернутися назад.",
      "frames": [
        {
          "icon": "browser",
          "title": "На сайті є різні сторінки",
          "text": "Наприклад, одна сторінка розповідає про тварин, а інша — про рослини."
        },
        {
          "icon": "laptop",
          "title": "Обери, що хочеш відкрити",
          "text": "Натисни посилання з потрібною назвою. Відкриється інша сторінка."
        },
        {
          "icon": "browser",
          "title": "Як повернутися?",
          "text": "Кнопка «Назад» повертає на попередню сторінку. Спробуй це у вправі."
        }
      ]
    },
    "remember": [
      {
        "icon": "webpage",
        "title": "Сторінка",
        "text": "Це одна частина сайту."
      },
      {
        "icon": "link",
        "title": "Посилання",
        "text": "Відкриває іншу сторінку."
      },
      {
        "icon": "back",
        "title": "Назад",
        "text": "Повертає на попередню сторінку."
      }
    ],
    "try": {
      "kind": "browserSim",
      "title": "Знайди сторінку про тварин",
      "instruction": "ВІДКРИЙ ПОСИЛАННЯ",
      "rounds": [
        {
          "task": "На головній сторінці відкрий «Тварини».",
          "start": "home",
          "goal": {
            "page": "animals"
          },
          "idealAttempts": 1,
          "pages": {
            "home": {
              "title": "Світ знань",
              "icon": "globe",
              "address": "navchannia.local",
              "links": [
                {
                  "to": "animals",
                  "label": "Тварини",
                  "icon": "cat"
                },
                {
                  "to": "space",
                  "label": "Космос",
                  "icon": "star"
                },
                {
                  "to": "plants",
                  "label": "Рослини",
                  "icon": "tree"
                }
              ]
            },
            "animals": {
              "title": "Тварини",
              "icon": "cat",
              "address": "navchannia.local/tvaryny",
              "body": "Тут сторінка про тварин."
            },
            "space": {
              "title": "Космос",
              "icon": "star",
              "address": "navchannia.local/kosmos",
              "body": "Тут сторінка про космос."
            },
            "plants": {
              "title": "Рослини",
              "icon": "tree",
              "address": "navchannia.local/roslyny",
              "body": "Тут сторінка про рослини."
            }
          }
        }
      ]
    },
    "practice": {
      "kind": "browserSim",
      "title": "Відкрий і повернися",
      "instruction": "ВІДКРИЙ І ПОВЕРНИСЯ",
      "rounds": [
        {
          "task": "Відкрий «Динозаври», а потім натисни «Назад».",
          "start": "home",
          "goal": {
            "page": "home",
            "requireBack": true,
            "visit": "dino"
          },
          "idealAttempts": 2,
          "pages": {
            "home": {
              "title": "Цікаві теми",
              "icon": "globe",
              "links": [
                {
                  "to": "dino",
                  "label": "Динозаври",
                  "icon": "dino"
                },
                {
                  "to": "ocean",
                  "label": "Океан",
                  "icon": "water"
                },
                {
                  "to": "robots",
                  "label": "Роботи",
                  "icon": "robot"
                }
              ]
            },
            "dino": {
              "title": "Динозаври",
              "icon": "dino",
              "body": "Це сторінка про динозаврів."
            },
            "ocean": {
              "title": "Океан",
              "icon": "water",
              "body": "Це сторінка про океан."
            },
            "robots": {
              "title": "Роботи",
              "icon": "robot",
              "body": "Це сторінка про роботів."
            }
          }
        },
        {
          "task": "Відкрий «Планети», а потім «Марс».",
          "start": "home",
          "goal": {
            "page": "mars"
          },
          "idealAttempts": 2,
          "pages": {
            "home": {
              "title": "Космос",
              "icon": "star",
              "links": [
                {
                  "to": "planets",
                  "label": "Планети",
                  "icon": "planet"
                },
                {
                  "to": "stars",
                  "label": "Зорі",
                  "icon": "star"
                },
                {
                  "to": "rockets",
                  "label": "Ракети",
                  "icon": "rocket"
                }
              ]
            },
            "planets": {
              "title": "Планети",
              "icon": "planet",
              "links": [
                {
                  "to": "mars",
                  "label": "Марс",
                  "icon": "planet"
                },
                {
                  "to": "earth",
                  "label": "Земля",
                  "icon": "globe"
                }
              ]
            },
            "stars": {
              "title": "Зорі",
              "icon": "star",
              "body": "Сторінка про зорі."
            },
            "rockets": {
              "title": "Ракети",
              "icon": "rocket",
              "body": "Сторінка про ракети."
            },
            "mars": {
              "title": "Марс",
              "icon": "planet",
              "body": "Це сторінка про Марс."
            },
            "earth": {
              "title": "Земля",
              "icon": "globe",
              "body": "Сторінка про Землю."
            }
          }
        }
      ]
    },
    "assessment": {
      "kind": "browserSim",
      "title": "Покажи, що вмієш",
      "instruction": "ЗНАЙДИ СТОРІНКУ",
      "rounds": [
        {
          "task": "Відкрий «Погода», потім повернися назад.",
          "start": "home",
          "goal": {
            "page": "home",
            "requireBack": true
          },
          "idealAttempts": 2,
          "pages": {
            "home": {
              "title": "Мій день",
              "icon": "globe",
              "links": [
                {
                  "to": "weather",
                  "label": "Погода",
                  "icon": "sun"
                },
                {
                  "to": "games",
                  "label": "Ігри",
                  "icon": "game"
                },
                {
                  "to": "books",
                  "label": "Книжки",
                  "icon": "book"
                }
              ]
            },
            "weather": {
              "title": "Погода",
              "icon": "sun",
              "body": "Сторінка про погоду."
            },
            "games": {
              "title": "Ігри",
              "icon": "game",
              "body": "Сторінка про ігри."
            },
            "books": {
              "title": "Книжки",
              "icon": "book",
              "body": "Сторінка про книжки."
            }
          }
        },
        {
          "task": "Відкрий «Тварини», а потім «Лев».",
          "start": "home",
          "goal": {
            "page": "lion"
          },
          "idealAttempts": 2,
          "pages": {
            "home": {
              "title": "Енциклопедія",
              "icon": "book",
              "links": [
                {
                  "to": "animals",
                  "label": "Тварини",
                  "icon": "cat"
                },
                {
                  "to": "plants",
                  "label": "Рослини",
                  "icon": "tree"
                },
                {
                  "to": "space",
                  "label": "Космос",
                  "icon": "star"
                }
              ]
            },
            "animals": {
              "title": "Тварини",
              "icon": "cat",
              "links": [
                {
                  "to": "lion",
                  "label": "Лев",
                  "icon": "lion"
                },
                {
                  "to": "dog",
                  "label": "Пес",
                  "icon": "dog"
                }
              ]
            },
            "plants": {
              "title": "Рослини",
              "icon": "tree",
              "body": "Сторінка про рослини."
            },
            "space": {
              "title": "Космос",
              "icon": "star",
              "body": "Сторінка про космос."
            },
            "lion": {
              "title": "Лев",
              "icon": "lion",
              "body": "Це сторінка про лева."
            },
            "dog": {
              "title": "Пес",
              "icon": "dog",
              "body": "Сторінка про пса."
            }
          }
        }
      ]
    }
  },
  "9": {
    "id": 9,
    "rememberTitle": "Пиши в пошуку головні слова",
    "watch": {
      "kicker": "Дивись",
      "title": "Шукай точніше",
      "intro": "Знайди саме те, що потрібно: фото для плаката або час шкільної події.",
      "frames": [
        {
          "icon": "lion",
          "title": "Спочатку виріши, що шукаєш",
          "text": "Потрібна фотографія лева? Для пошуку підійдуть слова «лев фото»."
        },
        {
          "icon": "laptop",
          "title": "Порівняй результати",
          "text": "Казка про лева й фото лева — різні результати. Обери те, що потрібне для завдання."
        },
        {
          "icon": "think",
          "title": "Не знаєш, що обрати?",
          "text": "Прочитай завдання ще раз. Якщо все одно незрозуміло, поклич дорослого."
        }
      ]
    },
    "remember": [
      {
        "icon": "search",
        "title": "Напиши, що шукаєш",
        "text": "Краще кілька точних слів."
      },
      {
        "icon": "keyword",
        "title": "Головні слова",
        "text": "Вони допомагають знайти потрібне."
      },
      {
        "icon": "results",
        "title": "Подивись на відповідь",
        "text": "Чи це потрібна відповідь?"
      }
    ],
    "try": {
      "kind": "searchSim",
      "title": "Що краще написати?",
      "instruction": "ОБЕРИ",
      "rounds": [
        {
          "task": "Знайди зображення лева для шкільної листівки.",
          "question": "Які слова допоможуть?",
          "icon": "search",
          "options": [
            {
              "text": "лев фото",
              "correct": true
            },
            {
              "text": "тварини"
            },
            {
              "text": "свято"
            }
          ],
          "results": [
            {
              "title": "Лев у савані",
              "text": "Фотографія лева для розглядання.",
              "correct": true
            },
            {
              "title": "Лев і мишка",
              "text": "Текст казки для читання."
            },
            {
              "title": "Торт «Левеня»",
              "text": "Рецепт святкового торта."
            }
          ]
        }
      ]
    },
    "practice": {
      "kind": "searchSim",
      "title": "Обирай головні слова",
      "instruction": "ОБЕРИ",
      "rounds": [
        {
          "task": "Дізнайся час гуртка малювання.",
          "question": "Які слова допоможуть?",
          "icon": "search",
          "options": [
            {
              "text": "гурток малювання розклад",
              "correct": true
            },
            {
              "text": "фарби пензлі"
            },
            {
              "text": "шкільне свято"
            }
          ],
          "results": [
            {
              "title": "Що взяти на малювання",
              "text": "Альбом, фарби й пензлі."
            },
            {
              "title": "Розклад гуртка",
              "text": "Малювання: вівторок, 15:00.",
              "correct": true
            },
            {
              "title": "Галерея малюнків",
              "text": "Роботи учнів за минулий тиждень."
            }
          ]
        },
        {
          "task": "Знайди відео, яке показує ріст соняшника.",
          "question": "Які слова допоможуть?",
          "icon": "search",
          "options": [
            {
              "text": "соняшник ріст відео",
              "correct": true
            },
            {
              "text": "квіти малюнки"
            },
            {
              "text": "сонце погода"
            }
          ],
          "results": [
            {
              "title": "Як росте соняшник",
              "text": "Відео від насінини до квітки.",
              "correct": true
            },
            {
              "title": "Соняшник олівцями",
              "text": "Картинка для розмальовування."
            },
            {
              "title": "Сонячний день",
              "text": "Оповідання про прогулянку."
            }
          ]
        }
      ]
    },
    "assessment": {
      "kind": "searchSim",
      "title": "Покажи, що вмієш",
      "instruction": "ОБЕРИ",
      "rounds": [
        {
          "task": "Потрібне фото панди для плаката.",
          "question": "Які слова допоможуть?",
          "icon": "search",
          "options": [
            {
              "text": "панда фото",
              "correct": true
            },
            {
              "text": "тварини їжа"
            },
            {
              "text": "панда казка"
            }
          ],
          "results": [
            {
              "title": "Панда в лісі",
              "text": "Фотографія панди серед бамбука.",
              "correct": true
            },
            {
              "title": "Пригоди панди",
              "text": "Текст вигаданої історії."
            },
            {
              "title": "Малюємо панду",
              "text": "Відеоурок малювання."
            }
          ]
        },
        {
          "task": "Дізнайся, о котрій почнеться шкільна вистава.",
          "question": "Які слова допоможуть?",
          "icon": "search",
          "options": [
            {
              "text": "шкільна вистава час",
              "correct": true
            },
            {
              "text": "театр костюми"
            },
            {
              "text": "наш клас фото"
            }
          ],
          "results": [
            {
              "title": "Фото акторів",
              "text": "Знімки з репетиції."
            },
            {
              "title": "Запрошення на виставу",
              "text": "Початок вистави — у п’ятницю о 12:00.",
              "correct": true
            },
            {
              "title": "Як зробити костюм",
              "text": "Інструкція для майстерні."
            }
          ]
        }
      ]
    }
  },
  "10": {
    "id": 10,
    "rememberTitle": "Подумай перед надсиланням",
    "watch": {
      "kicker": "Дивись",
      "title": "Бережи особисте",
      "intro": "Ти можеш спілкуватися онлайн й водночас берегти особисте.",
      "frames": [
        {
          "icon": "shield",
          "title": "Деякі речі треба берегти",
          "text": "Адресу дому, номер телефону й назву школи не надсилай без дозволу дорослого."
        },
        {
          "icon": "cat",
          "title": "А чим можна поділитися?",
          "text": "У навчальній грі з учителем можна обрати улюблений колір або вигаданий значок."
        },
        {
          "icon": "message",
          "title": "Зупинись перед надсиланням",
          "text": "Фото й повідомлення можуть переслати іншим. Сумніваєшся — запитай дорослого."
        }
      ]
    },
    "remember": [
      {
        "icon": "privacy",
        "title": "Бережи особисте",
        "text": "Адресу, телефон і назву школи не надсилай без дозволу дорослого. Пароль не надсилай іншим."
      },
      {
        "icon": "footprint",
        "title": "Онлайн може залишитися",
        "text": "Надіслане повідомлення можуть зберегти або переслати."
      },
      {
        "icon": "think",
        "title": "Спочатку подумай",
        "text": "Перед відправкою подумай: це безпечно?"
      }
    ],
    "try": {
      "kind": "sort",
      "instruction": "РОЗРІЗНЯЙ",
      "title": "Що можна повідомити в навчальній грі?",
      "rounds": [
        {
          "question": "Що можна обрати в грі з учителем?",
          "bins": [
            {
              "id": "ok",
              "label": "Можна обрати",
              "icon": "sort"
            },
            {
              "id": "private",
              "label": "Бережемо",
              "icon": "sort"
            }
          ],
          "items": [
            {
              "id": "color",
              "label": "Улюблений колір",
              "icon": "photo",
              "bin": "ok"
            },
            {
              "id": "story",
              "label": "Назва улюбленої казки",
              "icon": "textinfo",
              "bin": "ok"
            },
            {
              "id": "address",
              "label": "Адреса дому",
              "icon": "textinfo",
              "bin": "private"
            },
            {
              "id": "password",
              "label": "Пароль",
              "icon": "textinfo",
              "bin": "private"
            }
          ]
        }
      ]
    },
    "practice": {
      "kind": "safetyScenario",
      "title": "Подумай перед відправкою",
      "instruction": "ЩО БЕЗПЕЧНІШЕ?",
      "rounds": [
        {
          "where": "Онлайн-гра",
          "icon": "game",
          "scene": "Гравець, якого ти не знаєш у житті, просить номер телефону.",
          "prompt": "Що безпечніше?",
          "options": [
            {
              "text": "Надіслати номер",
              "icon": "message"
            },
            {
              "text": "Не надсилати. Сказати дорослому",
              "icon": "message",
              "correct": true
            },
            {
              "text": "Надіслати номер друга",
              "icon": "message"
            },
            {
              "text": "Написати, де навчаюся",
              "icon": "message"
            }
          ]
        },
        {
          "where": "Фото",
          "icon": "camera",
          "scene": "Хочеш викласти фото друга.",
          "prompt": "Що зробити спочатку?",
          "options": [
            {
              "text": "Викласти одразу",
              "icon": "message"
            },
            {
              "text": "Додати адресу місця",
              "icon": "message"
            },
            {
              "text": "Спитати дозволу",
              "icon": "message",
              "correct": true
            },
            {
              "text": "Надіслати всім у чат",
              "icon": "message"
            }
          ]
        },
        {
          "where": "Шкільна майстерня",
          "scene": "Учитель просить обрати колір рамки для листівки. Ім’я, фото й адресу додавати не треба.",
          "prompt": "Що можна зробити?",
          "options": [
            {
              "text": "Обрати синю рамку",
              "correct": true,
              "icon": "message"
            },
            {
              "text": "Написати домашню адресу",
              "icon": "message"
            },
            {
              "text": "Додати пароль замість підпису",
              "icon": "message"
            }
          ]
        }
      ]
    },
    "assessment": {
      "kind": "safetyScenario",
      "title": "Покажи, що вмієш",
      "instruction": "ОБЕРИ БЕЗПЕЧНУ ДІЮ",
      "rounds": [
        {
          "where": "Чат",
          "icon": "message",
          "scene": "Незнайомець питає назву твоєї школи й коли ти йдеш додому.",
          "prompt": "Що зробиш?",
          "options": [
            {
              "text": "Відповім на обидва питання",
              "icon": "message"
            },
            {
              "text": "Скажу лише назву школи",
              "icon": "message"
            },
            {
              "text": "Не відповім. Скажу дорослому",
              "icon": "message",
              "correct": true
            },
            {
              "text": "Надішлю фото школи",
              "icon": "message"
            }
          ]
        },
        {
          "where": "Публікація",
          "icon": "send",
          "scene": "На фото видно табличку з твоєю домашньою адресою.",
          "prompt": "Що безпечніше?",
          "options": [
            {
              "text": "Викласти як є",
              "icon": "message"
            },
            {
              "text": "Не викладати фото з адресою",
              "icon": "message",
              "correct": true
            },
            {
              "text": "Додати своє ім’я",
              "icon": "message"
            },
            {
              "text": "Надіслати незнайомцю",
              "icon": "message"
            }
          ]
        },
        {
          "where": "Навчальна гра",
          "scene": "У грі з учителем треба обрати вигаданий значок команди.",
          "prompt": "Що доречно?",
          "options": [
            {
              "text": "Обрати значок зірки",
              "correct": true,
              "icon": "message"
            },
            {
              "text": "Замість значка написати номер телефону",
              "icon": "message"
            },
            {
              "text": "Додати адресу дому",
              "icon": "message"
            }
          ]
        }
      ]
    }
  },
  "11": {
    "id": 11,
    "rememberTitle": "СТОП → ЗАКРИЙ → СКАЖИ",
    "watch": {
      "kicker": "Дивись",
      "title": "Дивне повідомлення? Не відповідай",
      "intro": "Неприємне повідомлення — привід звернутися по допомогу. Ти не мусиш вирішувати все самотужки.",
      "frames": [
        {
          "icon": "shield",
          "title": "Можна припинити розмову",
          "text": "Якщо повідомлення лякає або засмучує, не відповідай і відійди від чату."
        },
        {
          "icon": "think",
          "title": "Поклич того, кому довіряєш",
          "text": "Розкажи батькам, учителю або шкільному психологу, що сталося."
        },
        {
          "icon": "message",
          "title": "Покажи повідомлення дорослому",
          "text": "Не видаляй його, поки не покажеш. Дорослий допоможе обрати наступний крок."
        }
      ]
    },
    "remember": [
      {
        "icon": "stop",
        "title": "СТОП",
        "text": "Не відповідай і не натискай."
      },
      {
        "icon": "close",
        "title": "ЗАКРИЙ",
        "text": "Закрий чат, сторінку або гру."
      },
      {
        "icon": "adult",
        "title": "СКАЖИ",
        "text": "Скажи дорослому, якому довіряєш."
      },
      {
        "icon": "adult",
        "title": "Хто допоможе?",
        "text": "Батьки, учитель або шкільний психолог. Назви двох дорослих, до яких можна звернутися."
      }
    ],
    "try": {
      "kind": "sequence",
      "title": "Склади правило",
      "instruction": "ПОСТАВ ПО ПОРЯДКУ",
      "rounds": [
        {
          "question": "Що робити, якщо онлайн щось не так?",
          "items": [
            {
              "id": "tell",
              "label": "Скажи дорослому",
              "icon": "adult"
            },
            {
              "id": "stop",
              "label": "Стоп",
              "icon": "stop"
            },
            {
              "id": "close",
              "label": "Закрий",
              "icon": "close"
            }
          ],
          "correct": [
            "stop",
            "close",
            "tell"
          ]
        }
      ]
    },
    "practice": {
      "kind": "safetyScenario",
      "title": "Що зробиш?",
      "instruction": "ОБЕРИ БЕЗПЕЧНУ ДІЮ",
      "rounds": [
        {
          "where": "Чат у грі",
          "icon": "game",
          "scene": "Незнайомий гравець пише: «Надішли фото. Тільки нікому не кажи».",
          "prompt": "Що робиш?",
          "options": [
            {
              "text": "Надішлю фото",
              "icon": "message"
            },
            {
              "text": "Продовжу розмову",
              "icon": "message"
            },
            {
              "text": "Стоп, закрию чат і скажу дорослому",
              "icon": "message",
              "correct": true
            },
            {
              "text": "Попрошу його фото спочатку",
              "icon": "message"
            }
          ]
        },
        {
          "where": "Повідомлення",
          "icon": "link",
          "scene": "Хтось надсилає незнайоме посилання і пише: «Терміново натисни!»",
          "prompt": "Що безпечніше?",
          "options": [
            {
              "text": "Натиснути швидше",
              "icon": "message"
            },
            {
              "text": "Не відкривати. Сказати дорослому",
              "icon": "message",
              "correct": true
            },
            {
              "text": "Переслати друзям",
              "icon": "message"
            },
            {
              "text": "Відповісти своїм паролем",
              "icon": "message"
            }
          ]
        },
        {
          "where": "Коментар",
          "icon": "message",
          "scene": "Тобі пишуть образливі слова, і тобі неприємно.",
          "prompt": "Що зробиш?",
          "options": [
            {
              "text": "Відповім образою",
              "icon": "message"
            },
            {
              "text": "Сховаю від усіх",
              "icon": "message"
            },
            {
              "text": "Зупинюся і скажу дорослому",
              "icon": "message",
              "correct": true
            },
            {
              "text": "Надішлю особисті дані",
              "icon": "message"
            }
          ]
        }
      ]
    },
    "assessment": {
      "kind": "safetyScenario",
      "title": "Покажи, що вмієш",
      "instruction": "ОБЕРИ БЕЗПЕЧНУ ДІЮ",
      "rounds": [
        {
          "where": "Гра",
          "icon": "game",
          "scene": "Незнайомець пропонує зустрітися без батьків.",
          "prompt": "Що зробиш?",
          "options": [
            {
              "text": "Погоджуся і нікому не скажу",
              "icon": "message"
            },
            {
              "text": "Запитаю адресу зустрічі",
              "icon": "message"
            },
            {
              "text": "Не погоджуся. Скажу дорослому",
              "icon": "message",
              "correct": true
            },
            {
              "text": "Надішлю свій номер",
              "icon": "message"
            }
          ]
        },
        {
          "where": "Сайт",
          "icon": "browser",
          "scene": "На екрані з’явилася дивна страшна сторінка.",
          "prompt": "Що найкраще зробити?",
          "options": [
            {
              "text": "Закрити. Сказати дорослому",
              "icon": "message",
              "correct": true
            },
            {
              "text": "Натискати всі кнопки",
              "icon": "message"
            },
            {
              "text": "Надіслати її друзям",
              "icon": "message"
            },
            {
              "text": "Ввести свій пароль",
              "icon": "message"
            }
          ]
        }
      ]
    }
  },
  "12": {
    "id": 12,
    "rememberTitle": "Пароль — секретний ключ",
    "themeComplete": "Тему про Інтернет і безпеку завершено!",
    "watch": {
      "kicker": "Дивись",
      "title": "Пароль захищає твій вхід",
      "intro": "Пароль допомагає берегти твою роботу й доступ до ігор та сайтів.",
      "frames": [
        {
          "icon": "key",
          "title": "Пароль — твій секрет",
          "text": "Не надсилай пароль друзям або іншим людям у повідомленнях."
        },
        {
          "icon": "lock",
          "title": "Обирай те, що важко вгадати",
          "text": "Довге незвичне поєднання слів вгадати важче, ніж ім’я або ряд цифр."
        },
        {
          "icon": "password",
          "title": "Тут лише вигадані приклади",
          "text": "Справжній пароль придумай разом із дорослим поза цією грою."
        },
        {
          "icon": "workScene",
          "title": "Завершуєш роботу? Вийди",
          "text": "На спільному комп’ютері вийди зі свого акаунта, щоб ним не користувалися інші."
        }
      ]
    },
    "remember": [
      {
        "icon": "key",
        "title": "Пароль — це ключ",
        "text": "Він захищає твій вхід."
      },
      {
        "icon": "lock",
        "title": "Важко вгадати",
        "text": "Не бери прості числа, ім’я або дату народження."
      },
      {
        "icon": "privacy",
        "title": "Не передавай пароль",
        "text": "Справжній пароль придумай із дорослим поза цією грою."
      },
      {
        "icon": "close",
        "title": "Спільний комп’ютер",
        "text": "Після роботи вийди зі свого акаунта."
      }
    ],
    "try": {
      "kind": "passwordGame",
      "title": "Який важче вгадати?",
      "instruction": "ОБЕРИ",
      "rounds": [
        {
          "task": "Це лише приклади. Який важче вгадати?",
          "options": [
            {
              "text": "123456",
              "level": 1,
              "hint": "дуже поширений"
            },
            {
              "text": "Марко2018",
              "level": 1,
              "hint": "ім’я + рік"
            },
            {
              "text": "Кіт",
              "level": 1,
              "hint": "дуже короткий"
            },
            {
              "text": "Лама-Ракета-Хмара-47!",
              "level": 3,
              "hint": "довга незвична фраза",
              "correct": true
            }
          ]
        }
      ]
    },
    "practice": {
      "kind": "passwordGame",
      "title": "Який важче вгадати?",
      "instruction": "ОБЕРИ",
      "rounds": [
        {
          "task": "Який важче вгадати?",
          "options": [
            {
              "text": "password",
              "level": 1,
              "hint": "поширене слово"
            },
            {
              "text": "123456789012345678901234567890",
              "level": 1,
              "hint": "довго, але передбачувано"
            },
            {
              "text": "Сова-Човен-Місяць-82",
              "level": 3,
              "hint": "довга фраза",
              "correct": true
            },
            {
              "text": "Анна",
              "level": 1,
              "hint": "ім’я"
            }
          ]
        },
        {
          "task": "Який не схожий на особисті дані?",
          "options": [
            {
              "text": "Школа27",
              "level": 1,
              "hint": "назва/номер школи"
            },
            {
              "text": "2017-05-03",
              "level": 1,
              "hint": "схоже на дату"
            },
            {
              "text": "Три-Веселі-Роботи-91!",
              "level": 3,
              "hint": "довга незвична фраза",
              "correct": true
            },
            {
              "text": "Іван",
              "level": 1,
              "hint": "ім’я"
            }
          ]
        }
      ]
    },
    "assessment": {
      "kind": "passwordGame",
      "title": "Покажи, що вмієш",
      "instruction": "ОБЕРИ",
      "rounds": [
        {
          "task": "Який важче вгадати?",
          "options": [
            {
              "text": "qwerty",
              "level": 1,
              "hint": "послідовність клавіш"
            },
            {
              "text": "Синя-Комета-Їде-73!",
              "level": 3,
              "hint": "довга фраза",
              "correct": true
            },
            {
              "text": "123456789012345678901234567890",
              "level": 1,
              "hint": "передбачувана послідовність"
            },
            {
              "text": "Олег10",
              "level": 1,
              "hint": "ім’я + число"
            }
          ]
        },
        {
          "task": "Хтось просить твій пароль. Що робити?",
          "mode": "rule",
          "options": [
            {
              "text": "Надіслати, якщо людина просить ввічливо",
              "level": 1
            },
            {
              "text": "Надіслати лише другу з гри",
              "level": 1
            },
            {
              "text": "Не надсилати. Потрібна допомога — покликати дорослого",
              "level": 3,
              "correct": true
            },
            {
              "text": "Викласти пароль, а потім змінити",
              "level": 1
            }
          ]
        }
      ]
    }
  }
};
