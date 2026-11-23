(function (root, factory) {
  "use strict";
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.KlavioWordsData = api;
})(typeof window !== "undefined" ? window : globalThis, function () {
  "use strict";

  const words = [
    "він", "вона", "вони", "час", "мій", "так", "щоб", "ще", "де", "як", "рік", "ніс", "ліс", "мир", "дім", "пес", "кіт", "лис", "рак",
    "люди", "коли", "було", "мене", "дуже", "мені", "тому", "тебе", "який", "себе", "може", "буде", "треба", "лише", "можна", "день", "тепер", "йому", "хочу", "куди", "тоді", "очі", "руки", "мама", "тато", "брат", "мова", "вода", "небо", "поле", "ріка", "море", "гора", "село", "хата", "стіл", "школа", "клас", "урок", "ручка", "друг", "сила", "воля", "пісня", "душа", "серце", "любов", "мрія", "надія", "віра", "правда", "краса", "добро", "успіх", "праця", "знати", "жити", "часто", "сонце", "земля", "хліб", "голова", "одяг", "дорога", "грати", "камінь", "птах", "риба", "кішка", "кінь", "курка", "яйце", "яблуко", "число", "один", "учень", "зошит", "файл", "гра", "спорт",
    "ґудзик", "ніхто", "кожен", "завжди", "ніколи", "батько", "сестра", "кімната", "молоко", "куртка", "пісок", "дерево", "квітка", "трава", "корова", "чотири", "школяр", "учитель", "олівець", "гумка", "мишка", "екран", "програма", "графіка", "кнопка", "меню", "папка", "вулиця", "хлопець", "дівчина", "малюнок", "вчора", "зустріч", "початок", "кінець", "думка", "слово", "речення", "відповідь", "сьогодні", "завтра", "природа", "тварина", "навчання", "робота", "музика", "собака", "просто", "багато", "зараз", "радість",
    "ґринджоли", "ґрунтовний", "клавіатура", "комп'ютер", "пам'ять", "сім'я", "м'яч", "п'ять", "суспільство", "підготовка", "результати", "знайомство", "продовжувати", "відчувати", "навколишній", "захоплення", "організація",
    "математика", "бібліотека", "мандрівник", "обчислення", "повідомлення", "користувач", "дослідження", "розповідати", "несподіванка", "спостерігати", "українська", "прикрашати", "вишиванка", "запам'ятати", "мандрівка", "перерахувати"
  ];

  // У вправі з речень раунд бере п'ять завдань, тож у кожному рівні їх
  // має бути помітно більше — інакше учень бачитиме той самий текст.
  const sentences = {
    easy: [
      "Мама читає книгу.", "Тато п'є чай.", "Кіт спить на столі.", "Учень пише у зошиті.",
      "На небі сяє сонце.", "Діти йдуть до школи.", "Пес біжить до хати.", "Бабуся пече хліб.",
      "У саду цвіте вишня.", "Ми малюємо весну.", "Риба пливе у річці.", "Настав теплий день.",
      "Брат грає у м'яч.", "Сестра співає пісню."
    ],
    medium: [
      "У класі тихо працюють учні.", "На екрані з'явилося нове завдання.",
      "Після уроку друзі грають у дворі.", "Маленька річка тече через зелене село.",
      "Учитель показує правильне положення рук.", "Точність допомагає поступово набирати швидкість.",
      "Восени дерева вдягають жовті листочки.", "Ми разом прибираємо шкільне подвір'я.",
      "Ранкове сонце заглядає у вікно кімнати.", "Бібліотека зберігає тисячі цікавих книжок.",
      "Кожен палець відповідає за свої клавіші.", "Мишка й клавіатура — головні помічники комп'ютера.",
      "Взимку діти катаються на ковзанах.", "Пташка звила гніздо на високій гілці."
    ],
    hard: [
      "Клавіатура допомагає швидко записувати власні думки.",
      "Щоденне коротке тренування формує впевнену навичку друку.",
      "Комп'ютер виконує команди, які уважно вводить користувач.",
      "Не поспішай: рівномірний ритм важливіший за випадкову швидкість.",
      "Під час роботи дивись на текст, а не шукай кожну клавішу очима.",
      "Правильне положення пальців зменшує втому під час тривалої роботи.",
      // У реченнях немає латинських назв клавіш: їх годі набрати,
      // не перемкнувши розкладку, а це вправа рахує помилкою.
      "Ґанок, ґудзик і ґринджоли пишемо через ґ — придивись до цієї літери.",
      "Спина рівна, лікті вільні, а зап'ястя не лежать на столі.",
      "Пробіл натискаємо великим пальцем, не відриваючи руки від клавіатури.",
      "Помилку варто виправити одразу, поки рядок іще короткий.",
      "Велику літеру набирають двома руками: одна тримає, друга натискає.",
      "Обчислення, повідомлення та дослідження — довгі слова для впевненого друку.",
      "Спостерігай за екраном: очі підказують пальцям наступний рух.",
      "Наприкінці кожного речення не забувай про крапку та пробіл."
    ]
  };

  const pools = {
    easy: words.filter(function (word) { return word.replace(/'/g, "").length <= 5; }),
    medium: words.filter(function (word) { const length = word.replace(/'/g, "").length; return length >= 6 && length <= 8; }),
    hard: words.filter(function (word) { return word.replace(/'/g, "").length >= 9; })
  };

  // Англійські слова (A1–A2, без власних назв): easy ≤5 літер, medium 6–8, hard ≥9.
  const englishWords = [
    "cat", "dog", "sun", "book", "tree", "fish", "milk", "bird", "home", "door", "hand", "star", "moon", "rain", "game", "ball",
    "cake", "road", "rice", "song", "snow", "frog", "hat", "pen", "cup", "bus", "map", "egg", "box", "leg", "red", "blue",
    "green", "pink", "gold", "gray", "black", "white", "day", "night", "year", "week", "time", "life", "work", "play", "read",
    "write", "walk", "run", "jump", "swim", "sing", "dance", "help", "love", "like", "want", "need", "make", "take", "give",
    "find", "look", "come", "see", "say", "ask", "tell", "know", "think", "feel", "hear", "live", "stay", "wait", "open",
    "close", "put", "get", "let", "try", "use", "eat", "drink", "sleep", "wake", "sit", "stand", "fall", "rise", "ride", "drive",
    "fly", "cook", "wash", "clean", "paint", "draw", "cut", "tie", "push", "pull", "catch", "throw", "hold", "keep", "lose",
    "win", "lost", "boy", "girl", "man", "woman", "baby", "kid", "mom", "dad", "son", "aunt", "uncle", "king", "queen", "farm",
    "barn", "pond", "lake", "sea", "hill", "rock", "sand", "wind", "fire", "ice", "cold", "hot", "warm", "cool", "wet", "dry",
    "soft", "hard", "loud", "quiet", "fast", "slow", "big", "small", "tall", "short", "long", "wide", "thin", "old", "new",
    "young", "good", "bad", "nice", "kind", "fun", "sad", "glad", "happy", "angry", "busy", "free", "full", "empty", "dirty",
    "near", "far", "high", "low", "top", "side", "back", "front", "left", "right", "down", "out", "off", "over", "under", "here",
    "there", "now", "then", "soon", "late", "early", "today", "often", "never", "always", "every", "each", "some", "many",
    "much", "more", "most", "few", "all", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "has",
    "had", "flag", "half", "glass", "shall", "flash", "flask", "salad", "add", "quit", "quite", "quote", "equal", "square",
    "zip", "zoo", "size", "lazy", "crazy", "puzzle", "prize", "jazz", "quiz", "maze", "gaze", "glaze", "dizzy", "mix", "fix",
    "tax", "fox", "wax", "exit", "text", "taxi", "exam", "extra", "relax", "explore", "expert", "excuse", "example", "very",
    "have", "river", "vase", "vest", "visit", "wall", "wish", "way", "with", "word", "world", "who", "toy", "yet", "wood",
    "yellow", "hair", "kiss", "kite", "jeep", "jelly", "jet", "just", "jar", "jam", "joke", "juice", "key", "knee", "silk",
    "skirt", "school", "teacher", "pencil", "window", "garden", "family", "friend", "flower", "orange", "purple", "summer",
    "winter", "autumn", "spring", "morning", "evening", "kitchen", "animal", "button", "basket", "bridge", "candle", "doctor",
    "farmer", "pocket", "rabbit", "planet", "jacket", "market", "monkey", "turtle", "spider", "insect", "forest", "island",
    "desert", "valley", "ocean", "beach", "cloud", "storm", "thunder", "rainbow", "sunshine", "weather", "season", "holiday",
    "picture", "story", "letter", "number", "answer", "lesson", "subject", "science", "history", "music", "sport", "player",
    "winner", "ticket", "station", "airport", "hotel", "street", "city", "village", "country", "church", "castle", "tower",
    "garage", "shop", "store", "bakery", "pizza", "bread", "butter", "cheese", "sugar", "honey", "cookie", "banana", "apple",
    "lemon", "tomato", "potato", "carrot", "onion", "soup", "coffee", "dinner", "lunch", "supper", "chicken", "turkey", "tiger",
    "lion", "zebra", "horse", "sheep", "goat", "mouse", "pigeon", "parrot", "dolphin", "whale", "shark", "bottle", "plate",
    "spoon", "fork", "knife", "table", "chair", "sofa", "carpet", "mirror", "clock", "shirt", "shoes", "socks", "dress", "scarf",
    "gloves", "helmet", "mother", "father", "sister", "brother", "cousin", "parent", "child", "people", "person", "police",
    "pilot", "driver", "nurse", "dentist", "artist", "singer", "writer", "cooker", "camera", "phone", "radio", "laptop",
    "screen", "printer", "paper", "eraser", "ruler", "marker", "crayon", "scissors", "bedroom", "bathroom", "hallway", "balcony",
    "beautiful", "important", "different", "difficult", "favourite", "breakfast", "adventure", "vegetable", "chocolate",
    "dangerous", "question", "wonderful", "afternoon", "classroom", "homework", "grandmother", "grandfather", "playground",
    "basketball", "football", "birthday", "sandwich", "newspaper", "telephone", "television", "computer", "keyboard", "hospital",
    "restaurant", "dictionary", "strawberry", "blueberry", "butterfly", "dinosaur", "crocodile", "kangaroo", "pineapple",
    "bicycle", "swimming", "dancing", "running", "reading", "writing", "painting", "cooking", "shopping", "climbing", "walking",
    "talking", "listening", "visiting", "travelling", "friendly", "careful", "careless", "powerful", "peaceful", "colourful",
    "helpful", "hopeful", "thankful", "beautifully", "carefully", "quickly", "quietly", "slowly", "happily", "luckily",
    "tomorrow", "yesterday", "weekend", "vacation", "something", "everything", "everyone", "everybody", "anything", "nothing",
    "sometimes", "together", "another", "whatever", "education", "information", "imagination", "celebration", "decoration",
    "invitation", "collection", "temperature", "experiment", "mathematics", "geography", "literature", "chemistry", "biology",
    "discovery", "explorer", "scientist", "engineer", "musician", "magician", "electric", "electronic", "underwater",
    "underground", "horizontal", "classmates", "timetable", "scoreboard", "blackboard", "whiteboard", "lunchtime", "playtime",
    "sunflower", "watermelon", "grapefruit", "raspberry", "cranberry", "cauliflower", "cucumber", "marshmallow", "spaghetti",
    "hamburger", "lemonade", "sunglasses", "headphones", "microphone", "microwave", "dishwasher", "refrigerator", "furniture",
    "staircase", "neighbourhood", "supermarket", "motorcycle", "helicopter", "passenger", "adventurous", "interesting",
    "surprising", "celebrate", "understand", "beginning", "language", "vocabulary", "paragraph", "knowledge"
  ];

  const englishSentences = {
      "easy": [
          "I like my cat.",
          "The sun is hot.",
          "We play in the park.",
          "She has a red bag.",
          "My dad reads a book.",
          "The dog runs fast.",
          "It is a nice day.",
          "He drinks cold milk.",
          "We eat lunch at school.",
          "The bird sings a song.",
          "Mom cooks rice today.",
          "I can see a big tree.",
          "They swim in the lake.",
          "Open the door, please.",
          "The moon is bright."
      ],
      "medium": [
          "My sister walks to school every morning.",
          "The teacher writes a new word on the board.",
          "After dinner we watch a funny film.",
          "There is a small garden behind our house.",
          "I always brush my teeth before bed.",
          "The children are playing football in the yard.",
          "My brother can ride a bicycle very fast.",
          "Please put your books on the table.",
          "It is raining, so we stay at home.",
          "She wants a glass of orange juice.",
          "Our family goes to the sea in summer.",
          "He is learning to play the piano.",
          "Do you like to read stories at night?",
          "What time does the train arrive?",
          "I don't know the answer to this question."
      ],
      "hard": [
          "Typing without looking at the keys is a useful skill.",
          "Every morning my grandmother makes a delicious breakfast for us.",
          "If you practise every day, your fingers will remember the keys.",
          "Remember to keep your wrists straight and your back relaxed.",
          "The library is open until six o'clock on weekdays.",
          "My favourite subject is science because we do experiments.",
          "We couldn't go to the beach because the weather was terrible.",
          "Please don't forget to bring your homework tomorrow!",
          "Can you tell me how to get to the train station?",
          "The new computer in our classroom is very fast and quiet.",
          "Learning a new language takes time, patience and plenty of practice.",
          "Yesterday we visited the museum and saw a huge dinosaur.",
          "It's important to drink water and to sleep well.",
          "Accuracy is more important than speed at the beginning.",
          "Press the space bar with your thumb after every word."
      ]
  };

  const englishPools = {
    easy: englishWords.filter(function (word) { return word.length <= 5; }),
    medium: englishWords.filter(function (word) { return word.length >= 6 && word.length <= 8; }),
    hard: englishWords.filter(function (word) { return word.length >= 9; })
  };

  return {
    words,
    pools,
    sentences,
    english: { words: englishWords, pools: englishPools, sentences: englishSentences },
    // Слова й речення потрібної мови друку ("uk" за замовчуванням).
    getContent: function (language) {
      return language === "en" ? this.english : { words: words, pools: pools, sentences: sentences };
    },
    difficulties: [
      { id: "easy", label: "Короткі" },
      { id: "medium", label: "Середні" },
      { id: "hard", label: "Складні" }
    ]
  };
});
