window.InfoLessons = {
  "4": {
    "id": 4,
    "rememberTitle": "Текст, зображення, звук і відео",
    "watch": {
      "kicker": "Дивись",
      "title": "Інформація буває різною",
      "intro": "Про ту саму подію можна прочитати, почути або побачити. Спробуй їх розрізнити.",
      "frames": [
        {
          "icon": "textinfo",
          "title": "Це можна прочитати",
          "text": "Напис «Привіт!» — це текст."
        },
        {
          "icon": "photoScene",
          "title": "Це можна розглянути",
          "text": "Фотографія показує один момент. Малюнок теж є зображенням."
        },
        {
          "icon": "voiceScene",
          "title": "Це можна почути",
          "text": "Голос, музика й дзвінок — звуки. Натисни динамік, коли захочеш послухати."
        },
        {
          "icon": "video",
          "title": "Тут можна побачити рух",
          "text": "У відео кадри змінюються: видно, як хтось іде, стрибає або малює."
        }
      ]
    },
    "remember": [
      {
        "icon": "textinfo",
        "title": "Текст",
        "text": "Букви, слова, речення."
      },
      {
        "icon": "photo",
        "title": "Зображення",
        "text": "Фото, малюнок, схема."
      },
      {
        "icon": "speaker",
        "title": "Звук",
        "text": "Голос, музика, сигнал."
      },
      {
        "icon": "video",
        "title": "Відео",
        "text": "Рух і часто звук."
      }
    ],
    "try": {
      "kind": "media",
      "title": "Що це?",
      "instruction": "ПОДИВИСЬ АБО ПОСЛУХАЙ",
      "rounds": [
        {
          "stimulus": {
            "kind": "image",
            "icon": "apple",
            "label": "Малюнок яблука"
          },
          "answer": "image"
        }
      ]
    },
    "practice": {
      "kind": "media",
      "title": "Що це?",
      "instruction": "ОБЕРИ",
      "rounds": [
        {
          "stimulus": {
            "kind": "text",
            "text": "КІТ"
          },
          "answer": "text"
        },
        {
          "stimulus": {
            "kind": "sound",
            "tone": 523
          },
          "answer": "sound"
        },
        {
          "stimulus": {
            "kind": "image",
            "icon": "tree",
            "label": "Малюнок дерева"
          },
          "answer": "image"
        },
        {
          "stimulus": {
            "kind": "video",
            "icon": "bus",
            "label": "Автобус рухається"
          },
          "answer": "video"
        }
      ]
    },
    "assessment": {
      "kind": "media",
      "title": "Покажи, що вмієш",
      "instruction": "ОБЕРИ",
      "rounds": [
        {
          "stimulus": {
            "kind": "sound",
            "tone": 660
          },
          "answer": "sound"
        },
        {
          "stimulus": {
            "kind": "video",
            "icon": "bicycle",
            "label": "Велосипед рухається"
          },
          "answer": "video"
        },
        {
          "stimulus": {
            "kind": "text",
            "text": "ДІМ"
          },
          "answer": "text"
        },
        {
          "stimulus": {
            "kind": "image",
            "icon": "cat",
            "label": "Малюнок кота"
          },
          "answer": "image"
        }
      ]
    }
  },
  "5": {
    "id": 5,
    "rememberTitle": "Схоже — разом",
    "watch": {
      "kicker": "Дивись",
      "title": "Сортуй схожі речі разом",
      "intro": "Допоможи Юні навести лад. Знайди, що спільного між предметами.",
      "frames": [
        {
          "icon": "cat",
          "title": "Шукай спільну ознаку",
          "text": "Кіт і пес різні, але обидва — тварини. Їх можна покласти в одну групу."
        },
        {
          "icon": "bus",
          "title": "Для чого це потрібно?",
          "text": "Автобус і велосипед допомагають пересуватися. Це транспорт."
        },
        {
          "icon": "folder",
          "title": "Розкладай зручним способом",
          "text": "Перетягни картку в групу. Або спочатку натисни картку, а потім групу."
        }
      ]
    },
    "remember": [
      {
        "icon": "sort",
        "title": "Що спільного?",
        "text": "Подивись, що спільного."
      },
      {
        "icon": "cat",
        "title": "Схожі разом",
        "text": "Схожі речі клади в одну групу."
      },
      {
        "icon": "check",
        "title": "Перевір",
        "text": "Перевір, чи все на своєму місці."
      }
    ],
    "try": {
      "kind": "sort",
      "title": "Розклади по двох групах",
      "instruction": "ПЕРЕТЯГНИ АБО ОБЕРИ",
      "rounds": [
        {
          "question": "Що допомагає вводити, а що — слухати?",
          "bins": [
            {
              "id": "input",
              "label": "Вводимо",
              "icon": "sort"
            },
            {
              "id": "listen",
              "label": "Слухаємо",
              "icon": "sort"
            }
          ],
          "items": [
            {
              "id": "keyboard",
              "label": "Клавіатура",
              "icon": "keyboard",
              "bin": "input"
            },
            {
              "id": "mic",
              "label": "Мікрофон",
              "icon": "microphone",
              "bin": "input"
            },
            {
              "id": "headphones",
              "label": "Навушники",
              "icon": "headphones",
              "bin": "listen"
            },
            {
              "id": "speakers",
              "label": "Колонки",
              "icon": "speaker",
              "bin": "listen"
            }
          ]
        }
      ]
    },
    "practice": {
      "kind": "sort",
      "title": "Сортуй ще",
      "instruction": "ПЕРЕТЯГНИ АБО ОБЕРИ",
      "rounds": [
        {
          "question": "Допоможи Юні розділити тварин і транспорт.",
          "bins": [
            {
              "id": "animals",
              "label": "Тварини",
              "icon": "sort"
            },
            {
              "id": "transport",
              "label": "Транспорт",
              "icon": "sort"
            }
          ],
          "items": [
            {
              "id": "cat",
              "label": "Кіт",
              "icon": "cat",
              "bin": "animals"
            },
            {
              "id": "dog",
              "label": "Пес",
              "icon": "dog",
              "bin": "animals"
            },
            {
              "id": "bus",
              "label": "Автобус",
              "icon": "bus",
              "bin": "transport"
            },
            {
              "id": "bike",
              "label": "Велосипед",
              "icon": "bicycle",
              "bin": "transport"
            }
          ]
        },
        {
          "question": "Де текст, а де зображення?",
          "bins": [
            {
              "id": "text",
              "label": "Текст",
              "icon": "sort"
            },
            {
              "id": "image",
              "label": "Зображення",
              "icon": "sort"
            }
          ],
          "items": [
            {
              "id": "word",
              "label": "Напис «Школа»",
              "icon": "textinfo",
              "bin": "text"
            },
            {
              "id": "note",
              "label": "Текстова нотатка",
              "icon": "textinfo",
              "bin": "text"
            },
            {
              "id": "picture",
              "label": "Фотографія",
              "icon": "photo",
              "bin": "image"
            },
            {
              "id": "drawing",
              "label": "Малюнок",
              "icon": "photo",
              "bin": "image"
            }
          ]
        }
      ]
    },
    "assessment": {
      "kind": "sort",
      "title": "Покажи, що вмієш",
      "instruction": "ПЕРЕТЯГНИ АБО ОБЕРИ",
      "rounds": [
        {
          "question": "Що записує голос, а що відтворює звук?",
          "bins": [
            {
              "id": "record",
              "label": "Записуємо голос",
              "icon": "sort"
            },
            {
              "id": "play",
              "label": "Відтворюємо звук",
              "icon": "sort"
            }
          ],
          "items": [
            {
              "id": "mic",
              "label": "Мікрофон",
              "icon": "microphone",
              "bin": "record"
            },
            {
              "id": "headphones",
              "label": "Навушники",
              "icon": "headphones",
              "bin": "play"
            },
            {
              "id": "speakers",
              "label": "Колонки",
              "icon": "speaker",
              "bin": "play"
            }
          ]
        },
        {
          "question": "Розклади збережені роботи за видом інформації.",
          "bins": [
            {
              "id": "text",
              "label": "Читаємо",
              "icon": "sort"
            },
            {
              "id": "video",
              "label": "Дивимося рухомі кадри",
              "icon": "sort"
            }
          ],
          "items": [
            {
              "id": "note",
              "label": "Нотатка",
              "icon": "textinfo",
              "bin": "text"
            },
            {
              "id": "story",
              "label": "Текст казки",
              "icon": "textinfo",
              "bin": "text"
            },
            {
              "id": "clip",
              "label": "Відео зі свята",
              "icon": "video",
              "bin": "video"
            },
            {
              "id": "movie",
              "label": "Відеопояснення",
              "icon": "video",
              "bin": "video"
            }
          ]
        }
      ]
    }
  },
  "6": {
    "id": 6,
    "rememberTitle": "Спочатку → потім → в кінці",
    "watch": {
      "kicker": "Дивись",
      "title": "Що спочатку, а що потім?",
      "intro": "Що треба зробити спочатку, щоб отримати бажаний результат?",
      "frames": [
        {
          "icon": "printScene",
          "title": "Спочатку відкрий малюнок",
          "text": "Щоб надрукувати малюнок, його спершу треба відкрити."
        },
        {
          "icon": "printer",
          "title": "Потім надішли на друк",
          "text": "Натисни «Друк». Принтер почне друкувати аркуш."
        },
        {
          "icon": "photoScene",
          "title": "Тепер перевір результат",
          "text": "У завданнях обирай картинки по порядку. Щось не так? Картку можна повернути."
        }
      ]
    },
    "remember": [
      {
        "icon": "sequence",
        "title": "Початок",
        "text": "Знайди перший крок."
      },
      {
        "icon": "route",
        "title": "Середина",
        "text": "Постав наступний крок."
      },
      {
        "icon": "check",
        "title": "Кінець",
        "text": "Перевір увесь порядок."
      }
    ],
    "try": {
      "kind": "sequence",
      "title": "Що було спочатку?",
      "instruction": "НАТИСКАЙ ПО ЧЕРЗІ",
      "rounds": [
        {
          "question": "Допоможи Юні надрукувати листівку.",
          "items": [
            {
              "id": "take",
              "label": "Забрати листівку",
              "icon": "printScene"
            },
            {
              "id": "open",
              "label": "Відкрити листівку",
              "icon": "workScene"
            },
            {
              "id": "print",
              "label": "Натиснути «Друк»",
              "icon": "printer"
            }
          ],
          "correct": [
            "open",
            "print",
            "take"
          ]
        }
      ]
    },
    "practice": {
      "kind": "sequence",
      "title": "Що за чим?",
      "instruction": "ПОСТАВ ПО ПОРЯДКУ",
      "rounds": [
        {
          "question": "Як надрукувати готовий малюнок?",
          "items": [
            {
              "id": "take",
              "label": "Забрати надрукований аркуш",
              "icon": "photo"
            },
            {
              "id": "open",
              "label": "Відкрити малюнок",
              "icon": "gallery"
            },
            {
              "id": "print",
              "label": "Натиснути «Друк»",
              "icon": "printer"
            }
          ],
          "correct": [
            "open",
            "print",
            "take"
          ]
        },
        {
          "question": "Робимо фотографію",
          "items": [
            {
              "id": "photo",
              "label": "Побачити фото",
              "icon": "photo"
            },
            {
              "id": "open",
              "label": "Відкрити камеру",
              "icon": "cameraopen"
            },
            {
              "id": "aim",
              "label": "Навести камеру",
              "icon": "aim"
            },
            {
              "id": "tap",
              "label": "Натиснути кнопку",
              "icon": "shutter"
            }
          ],
          "correct": [
            "open",
            "aim",
            "tap",
            "photo"
          ]
        }
      ]
    },
    "assessment": {
      "kind": "sequence",
      "title": "Покажи, що вмієш",
      "instruction": "ПОСТАВ ПО ПОРЯДКУ",
      "rounds": [
        {
          "question": "Як з’являється цифровий малюнок?",
          "items": [
            {
              "id": "save",
              "label": "Зберегти",
              "icon": "save"
            },
            {
              "id": "draw",
              "label": "Намалювати",
              "icon": "pencil"
            },
            {
              "id": "open",
              "label": "Відкрити малювання",
              "icon": "gallery"
            }
          ],
          "correct": [
            "open",
            "draw",
            "save"
          ]
        },
        {
          "question": "Як записати голосове повідомлення?",
          "items": [
            {
              "id": "listen",
              "label": "Прослухати запис",
              "icon": "headphones"
            },
            {
              "id": "start",
              "label": "Почати запис",
              "icon": "microphone"
            },
            {
              "id": "stop",
              "label": "Зупинити запис",
              "icon": "stop"
            }
          ],
          "correct": [
            "start",
            "stop",
            "listen"
          ]
        }
      ]
    }
  },
  "7": {
    "id": 7,
    "rememberTitle": "Створи → збережи → знайди",
    "themeComplete": "Тему про інформацію завершено!",
    "watch": {
      "kicker": "Дивись",
      "title": "Як не загубити свою роботу",
      "intro": "Зроби власну листівку й навчися відкривати її знову.",
      "frames": [
        {
          "icon": "workScene",
          "title": "Створи свою листівку",
          "text": "Придумай назву, додай короткий підпис і вибери колір."
        },
        {
          "icon": "save",
          "title": "Збережи, перш ніж закривати",
          "text": "Натисни «Зберегти». Деякі програми зберігають роботу самі — вони про це повідомляють."
        },
        {
          "icon": "gallery",
          "title": "Відкрий свою роботу знову",
          "text": "Зазирни в «Мої роботи». Знайди свою листівку за назвою."
        }
      ]
    },
    "remember": [
      {
        "icon": "pencil",
        "title": "Створи",
        "text": "Зроби роботу."
      },
      {
        "icon": "save",
        "title": "Збережи",
        "text": "Подивись, чи робота збереглася."
      },
      {
        "icon": "gallery",
        "title": "Знайди",
        "text": "Знайди місце, де лежать твої роботи."
      }
    ],
    "try": {
      "kind": "saveFind",
      "title": "Створи й знайди свою роботу",
      "instruction": "СТВОРИ → ЗБЕРЕЖИ → ЗНАЙДИ",
      "rounds": [
        {
          "target": {
            "id": "tablet",
            "label": "Планшет",
            "icon": "tablet"
          },
          "choices": [
            {
              "id": "tablet",
              "label": "Планшет",
              "icon": "tablet"
            },
            {
              "id": "camera",
              "label": "Камера",
              "icon": "camera"
            },
            {
              "id": "headphones",
              "label": "Навушники",
              "icon": "headphones"
            }
          ],
          "saveMode": "manual"
        }
      ]
    },
    "practice": {
      "kind": "saveFind",
      "title": "Збережи двома способами",
      "instruction": "СТВОРИ І ЗНАЙДИ",
      "rounds": [
        {
          "target": {
            "id": "camera",
            "label": "Камера",
            "icon": "camera"
          },
          "choices": [
            {
              "id": "tablet",
              "label": "Планшет",
              "icon": "tablet"
            },
            {
              "id": "camera",
              "label": "Камера",
              "icon": "camera"
            },
            {
              "id": "headphones",
              "label": "Навушники",
              "icon": "headphones"
            }
          ],
          "saveMode": "manual"
        },
        {
          "target": {
            "id": "headphones",
            "label": "Навушники",
            "icon": "headphones"
          },
          "choices": [
            {
              "id": "tablet",
              "label": "Планшет",
              "icon": "tablet"
            },
            {
              "id": "camera",
              "label": "Камера",
              "icon": "camera"
            },
            {
              "id": "headphones",
              "label": "Навушники",
              "icon": "headphones"
            }
          ],
          "saveMode": "auto"
        }
      ]
    },
    "assessment": {
      "kind": "saveFind",
      "title": "Покажи, що вмієш",
      "instruction": "СПРОБУЙ САМ",
      "rounds": [
        {
          "target": {
            "id": "printer",
            "label": "Принтер",
            "icon": "printer"
          },
          "choices": [
            {
              "id": "tablet",
              "label": "Планшет",
              "icon": "tablet"
            },
            {
              "id": "camera",
              "label": "Камера",
              "icon": "camera"
            },
            {
              "id": "printer",
              "label": "Принтер",
              "icon": "printer"
            }
          ],
          "saveMode": "manual"
        },
        {
          "target": {
            "id": "keyboard",
            "label": "Клавіатура",
            "icon": "keyboard"
          },
          "choices": [
            {
              "id": "tablet",
              "label": "Планшет",
              "icon": "tablet"
            },
            {
              "id": "camera",
              "label": "Камера",
              "icon": "camera"
            },
            {
              "id": "keyboard",
              "label": "Клавіатура",
              "icon": "keyboard"
            }
          ],
          "saveMode": "auto"
        }
      ]
    }
  }
};
