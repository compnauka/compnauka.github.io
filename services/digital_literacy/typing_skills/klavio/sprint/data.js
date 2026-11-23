(function (root, factory) {
  "use strict";
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.KlavioSprintData = api;
})(typeof window !== "undefined" ? window : globalThis, function () {
  "use strict";
  // Англійські цілі: найчастіші літери, часті біграми й триграми, прості шкільні слова (A1–A2) без власних назв.
  const englishTargets = {
    keys: {
      easy: Array.from("etaoinsrhl"),
      medium: Array.from("abcdefghijklmnopqrstuvwxyz"),
      hard: Array.from("abcdefghijklmnopqrstuvwxyz1234567890")
    },
    combos: {
      easy: [
        "th", "he", "in", "er", "an", "re", "on", "at", "en", "nd", "ti", "es",
        "or", "te", "of", "ed", "is", "it", "al", "ar", "st", "to", "nt", "ng"
      ],
      medium: [
        "the", "ing", "and", "ion", "ent", "for", "her", "ter", "est", "ere", "ver", "tio",
        "con", "res", "ive", "ous", "ant", "you", "was", "one", "our", "out", "ate", "all"
      ],
      hard: [
        "tion", "ight", "ough", "ould", "ment", "ness", "able", "ally", "ever", "ture", "ther", "with",
        "that", "this", "they", "have", "from", "what", "when", "were", "your", "thro", "ship", "sion"
      ]
    },
    words: {
      easy: [
        "cat", "dog", "sun", "book", "tree", "fish", "milk", "bird", "home", "door",
        "hand", "star", "moon", "rain", "game", "ball", "cake", "road", "rice", "song",
        "snow", "frog", "hat", "pen", "cup", "bus", "map", "egg", "box", "leg"
      ],
      medium: [
        "school", "teacher", "pencil", "window", "garden", "family", "friend", "flower",
        "yellow", "orange", "summer", "winter", "morning", "evening", "kitchen", "animal",
        "button", "basket", "bridge", "candle", "doctor", "farmer", "pocket", "rabbit",
        "planet", "jacket", "market", "monkey"
      ],
      hard: [
        "keyboard", "computer", "homework", "yesterday", "beautiful", "favourite", "important",
        "adventure", "vegetable", "chocolate", "dangerous", "elephant", "different", "together",
        "question", "mountain", "umbrella", "breakfast", "neighbour", "holiday"
      ]
    }
  };

  return {
    durationSeconds: 60,
    modes: [
      { id: "keys", label: "Клавіші" },
      { id: "combos", label: "Сполучення" },
      { id: "words", label: "Слова" }
    ],
    difficulties: [
      { id: "easy", label: "Легко" },
      { id: "medium", label: "Звичайно" },
      { id: "hard", label: "Складно" }
    ],
    speeds: [
      { id: "slow", label: "Повільно", duration: 8500 },
      { id: "normal", label: "Середньо", duration: 6000 },
      { id: "fast", label: "Швидко", duration: 4200 }
    ],
    directions: [
      { id: "ltr", label: "Зліва" },
      { id: "rtl", label: "Справа" }
    ],
    getTargets: function (language) { return language === "en" ? englishTargets : this.targets; },
    // Набори навмисно широкі: за 60 секунд встигає пролетіти до 30 цілей,
    // а гра видає їх чергою без повторів, доки набір не вичерпається.
    targets: {
      keys: {
        easy: Array.from("аоіентсрвл"),
        medium: Array.from("абвгдеєжзиіїйклмнопрстуфхцчшщьюя"),
        hard: Array.from("абвгґдеєжзиіїйклмнопрстуфхцчшщьюя1234567890")
      },
      combos: {
        easy: [
          "ва", "ла", "на", "ти", "то", "ра", "ст", "ко", "по", "ми", "но", "ро",
          "ді", "ка", "ло", "ні", "се", "ту", "ме", "ви", "да", "за", "мо", "лі"
        ],
        medium: [
          "про", "при", "ний", "ого", "ати", "ення", "ість", "ува", "ере", "ово", "вся", "ться",
          "ити", "іль", "ань", "ове", "ста", "три", "між", "ові", "іка", "ель", "ють", "ент"
        ],
        hard: [
          "під", "над", "роз", "без", "ств", "ння", "зап", "ком", "швид", "клав", "трен", "друк",
          "ґан", "ґро", "вств", "зькі", "нськ", "хвил", "спів", "зроз", "пись", "штов", "джер", "щедр"
        ]
      },
      words: {
        easy: [
          "мама", "тато", "вода", "небо", "мова", "клас", "урок", "друг", "сила", "пісня",
          "сонце", "земля", "птах", "риба", "спорт", "хата", "поле", "ріка", "море", "гора",
          "село", "стіл", "хліб", "мрія", "день", "рука", "зима", "літо", "сніг", "казка"
        ],
        medium: [
          "школа", "учень", "зошит", "квітка", "дерево", "кімната", "учитель", "олівець",
          "природа", "музика", "дівчина", "малюнок", "хлопець", "вулиця", "корова", "дорога",
          "яблуко", "година", "робота", "книжка", "стежка", "ведмідь", "повітря", "зупинка",
          "колесо", "джерело", "пшениця", "веселка"
        ],
        hard: [
          "клавіатура", "комп'ютер", "підготовка", "результати", "знайомство", "організація",
          "суспільство", "продовжувати", "ґрунтовний", "математика", "бібліотека", "українська",
          "мандрівник", "обчислення", "повідомлення", "користувач", "несподіванка", "дослідження",
          "розповідати", "спостерігати"
        ]
      }
    }
  };
});
