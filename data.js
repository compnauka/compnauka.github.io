// --- DATA (Категорії та сервіси) ---
const CATEGORIES = [
  {
    id: "offline-activities",
    name: "Безкомп'ютерні активності",
    iconClass: "fas fa-child",
    color: "#f97316",
    services: [
      { 
        name: 'Паперові алгоритми: Залізниця', 
        description: "Допоможи побудувати залізницю.", 
        link: "pdfs/Pre_Coding_Activity_Potyag_UA.pdf", 
        image: "images/42.jpg", 
        tags: ["1-2 класи"] 
      },
      { 
        name: "Паперові алгоритми: Автомобіль", 
        description: "Проклади маршрут додому.", 
        link: "pdfs/Pre_Coding_Activity_Auto_UA.pdf", 
        image: "images/40.jpg", 
        tags: ["1-2 класи"] 
      },
      { 
        name: "Паперові алгоритми: Равлик", 
        description: "Допоможи Равлику знайти шлях до смаколика.", 
        link: "pdfs/Pre_CodingActivity_Ravlyk_UA.pdf", 
        image: "images/41.jpg", 
        tags: ["1-2 класи"] 
      },
      { 
        name: "Паперовий Планшет", 
        description: "Створи власний планшет з улюбленими іграми та застосунками.", 
        link: "pdfs/Paper_Tablet_UA.pdf", 
        image: "images/60.jpg", 
        tags: ["1-2 класи"] 
      },
      { 
        name: "Паперовий Ноутбук", 
        description: "Збери та розфарбуй власний ноутбук.", 
        link: "pdfs/Paper_Laptop_UA.pdf", 
        image: "images/61.jpg", 
        tags: ["1-2 класи"] 
      },
      { 
        name: "Шифр Цезаря", 
        description: "Створи свій шифрувальний диск.", 
        link: "pdfs/Cesar_Cipher_Disk_UA.pdf", 
        image: "images/62.jpg", 
        tags: ["3-4 класи"] 
      },
      { 
        name: "Піксель Арт", 
        description: "Активність, що поєднує цифровий та реальний світ. Виконуй завдання з екрану та створюй шедеври на папері.", 
        link: "services/pixelart.html", 
        image: "images/65.jpg", 
        tags: ["1-2 класи", "3-4 класи"] 
      }
    ]
  },
  {
    id: "digital-literacy",
    name: "Цифрова грамотність",
    iconClass: "fas fa-laptop",
    color: "#3b82f6",
    services: [
      { 
        name: "Мишачі перегони", 
        description: "Тренажер для роботи з мишкою.", 
        link: "services/click.html", 
        image: "images/10.jpg", 
        tags: ["1-2 класи"] 
      },
      { 
        name: "Спіймай світлячка", 
        description: "Тренажер для роботи з мишкою. Перетягування об'єктів.", 
        link: "services/fireflies.html", 
        image: "images/58.jpg", 
        tags: ["1-2 класи"] 
      },
      { 
        name: "Полювання на медуз", 
        description: "Тренажер для роботи з мишкою. Перетягування об'єктів.", 
        link: "services/jailfish.html", 
        image: "images/59.jpg", 
        tags: ["1-2 класи"] 
      },
      { 
        name: "Перші клавіші", 
        description: "Тренажер для роботи з клавіатурою. Вивчаємо розташування клавіш.", 
        link: "services/kids_typing.html", 
        image: "images/56.jpg", 
        tags: ["1-2 класи"] 
      },
      { 
        name: "Швидкісні вікна", 
        description: "Тренажер для роботи з вікнами програм.", 
        link: "services/windows/index.html", 
        image: "images/48.jpg", 
        tags: ["1-2 класи"] 
      },
      { 
        name: "Права чи Ліва?", 
        description: "Тренажер для роботи з кнопками миші.", 
        link: "services/mouse_keys/index.html", 
        image: "images/49.jpg", 
        tags: ["1-2 класи"] 
      },
      { 
        name: "Чарівний лабіринт", 
        description: "Тренажер для роботи з перетягуванням об'єктів.", 
        link: "services/mouse_maze.html", 
        image: "images/57.jpg", 
        tags: ["1-2 класи"] 
      },
      { 
        name: "Гарячі клавіши", 
        description: "Інтерактивний урок про роботу з клавіатурою.", 
        link: "services/typing.html", 
        image: "images/18.jpg", 
        tags: ["3-4 класи"] 
      },
      { 
        name: "Спритні пальчики", 
        description: "Тренажер для роботи з клавіатурою.", 
        link: "services/keys.html", 
        image: "images/11.jpg", 
        tags: ["3-4 класи"] 
      },
      { 
        name: "Веселі адреси", 
        description: "Тренажер дляроботи з клавіатурою: введення URL-адрес.", 
        link: "services/urls.html", 
        image: "images/38.jpg", 
        tags: ["3-4 класи"] 
      },
      { 
        name: "Шукаємо в Інтернеті", 
        description: "Інтерактивне опанування пошукових систем.", 
        link: "services/se/index.html", 
        image: "images/39.jpg", 
        tags: ["3-4 класи"] 
      }
    ]
  },
  {
    id: "computational-thinking",
    name: "Обчислювальне мислення",
    iconClass: "fas fa-brain",
    color: "#8b5cf6",
    services: [
      { 
        name: "Обчислювальне мислення", 
        description: "Простими словами про обчислювальне мислення.", 
        link: "services/compthinking.html", 
        image: "images/1.jpg", 
        tags: ["3-4 класи"] 
      },
      { 
        name: "Алгоритми для дітей", 
        description: "Як програмувати роботів та комп'ютери.", 
        link: "services/algorithm.html", 
        image: "images/12.jpg", 
        tags: ["3-4 класи"] 
      },
      { 
        name: "Абстракція для дітей", 
        description: "Інтерактивний урок про рівні абстракції.", 
        link: "services/abstraction.html", 
        image: "images/22.jpg", 
        tags: ["3-4 класи"] 
      },
      { 
        name: "Виявлення шаблонів", 
        description: "Інтерактивний урок про виявлення шаблонів.", 
        link: "services/patterns.html", 
        image: "images/23.jpg", 
        tags: ["3-4 класи"] 
      },
      { 
        name: "Декомпозиція для дітей", 
        description: "Інтерактивний урок про декомпозицію.", 
        link: "services/decomposition.html", 
        image: "images/24.jpg", 
        tags: ["3-4 класи"] 
      },
      { 
        name: "Перевір себе", 
        description: "Тест з обчислювального мислення.", 
        link: "services/quiz.html", 
        image: "images/55.jpg", 
        tags: ["3-4 класи"] 
      }
    ]
  },
  {
    id: "programming",
    name: "Алгоритми та програмування",
    iconClass: "fas fa-code",
    color: "#10b981",
    services: [
      { 
        name: "Алгоритми для дітей", 
        description: "Як програмувати роботів та комп'ютери.", 
        link: "services/algorithm.html", 
        image: "images/12.jpg", 
        tags: ["3-4 класи"] 
      },
      { 
        name: "Конструктор блок-схем", 
        description: "Простий редактор для створення блок-схем.", 
        link: "services/blocks/index.html", 
        image: "images/37.jpg", 
        tags: ["3-4 класи", "5-7 класи"] 
      },
      { 
        name: "Програмування з Равликом", 
        description: "Онлайн редактор для текстової мови програмування РАВЛИК", 
        link: "https://ravlyk.org", 
        image: "images/2.jpg", 
        tags: ["3-4 класи"] 
      },
      { 
        name: "Посібник з програмування Равлика", 
        description: "Знайомство з мовою програмування РАВЛИК.", 
        link: "https://ravlyk.org/manual.html", 
        image: "images/3.jpg", 
        tags: ["3-4 класи"] 
      },
      { 
        name: "Фермер Бот", 
        description: "Програмування робота за допомогою блоків.", 
        link: "services/farmbot/index.html", 
        image: "images/25.jpg", 
        tags: ["1-2 класи"] 
      },
      { 
        name: "Фермер Бот Плюс", 
        description: "Програмування робота за допомогою текстових команд.", 
        link: "services/farmbot_plus/index.html", 
        image: "images/26.jpg", 
        tags: ["3-4 класи"] 
      },
      { 
        name: "Що таке змінні", 
        description: "Інтерактивний урок про змінні в програмуванні.", 
        link: "services/variables.html", 
        image: "images/33.jpg", 
        tags: ["5-7 класи"] 
      },
      { 
        name: "Що таке типи даних", 
        description: "Інтерактивний урок про типи даних в програмуванні.", 
        link: "services/types.html", 
        image: "images/34.jpg", 
        tags: ["5-7 класи"] 
      },
      { 
        name: "Основи Python", 
        description: "Курс з основ програмування на Python.", 
        link: "/python", 
        image: "images/46.jpg", 
        tags: ["5-7 класи"] 
      }
    ]
  },
  {
    id: "safety-info",
    name: "Безпека та інформація",
    iconClass: "fas fa-shield-alt",
    color: "#ef4444",
    services: [
      { 
        name: "Кібербезпека для дітей", 
        description: "Дізнайся, як захистити себе в інтернеті.", 
        link: "services/cyber.html", 
        image: "images/9.jpg", 
        tags: ["3-4 класи"] 
      },
      { 
        name: "Криптографія для дітей", 
        description: "Інтерактивний сайт про шифрування інформації.", 
        link: "services/crypto.html", 
        image: "images/8.jpg", 
        tags: ["3-4 класи"] 
      },
      { 
        name: "Шифр Цезаря", 
        description: "Зашифруй своє повідомлення одним з найдавніших шифрів.", 
        link: "services/caesar_encrypt.html", 
        image: "images/6.jpg", 
        tags: ["3-4 класи", "5-7 класи"] 
      },
      { 
        name: "Розшифрування шифру Цезаря", 
        description: "Розшифруй повідомлення, яке було зашифроване шифром Цезаря.", 
        link: "services/caesar_decrypt.html", 
        image: "images/7.jpg", 
        tags: ["4-7 класи", "5-7 класи"] 
      },
      { 
        name: "Перевіряй інформацію!", 
        description: "Інтерактивний тренажер з критичного оцінювання інформації.", 
        link: "services/critic.html", 
        image: "images/13.jpg", 
        tags: ["3-4 класи", "5-7 класи"] 
      }
    ]
  },
  {
    id: "ai",
    name: "Штучний інтелект",
    iconClass: "fas fa-robot",
    color: "#6366f1",
    services: [
      { 
        name: "ЕЛІЗА. Перший чат-бот", 
        description: "Дізнайтесь, якими були чат-боти на початку розвитку ШІ.", 
        link: "games/eliza.html", 
        image: "images/50.jpg", 
        tags: ["3-4 класи", "5-7 класи"] 
      },
      { 
        name: "Штучний інтелект", 
        description: "Інтерактивний сайт про те, як працює ШІ.", 
        link: "services/ai.html", 
        image: "images/32.jpg", 
        tags: ["3-4 класи", "5-7 класи"] 
      },
      { 
        name: "Привіт, ШІ!", 
        description: "Інтерактивна книга для дітей про штучний інтелект.", 
        link: "services/ai/pryvitshi/index.html", 
        image: "images/4.jpg", 
        tags: ["3-4 класи"] 
      }
    ]
  },
  {
    id: "digital-tools",
    name: "Цифрові інструменти",
    iconClass: "fas fa-tools",
    color: "#ec4899",
    services: [
      { 
        name: "Друкарик", 
        description: "Веселий текстовий редактор для дітей.", 
        link: "services/drukaryk.html", 
        image: "images/28.jpg", 
        tags: ["1-2 класи", "Текст"] 
      },
      { 
        name: "Піксель", 
        description: "Простий піксельний графічний редактор для дітей.", 
        link: "services/pixel.html", 
        image: "images/36.jpg", 
        tags: ["1-2 класи", "Графіка"] 
      },
      { 
        name: "Пензлик", 
        description: "Яскравий графічний редактор для дітей.", 
        link: "services/penslyk.html", 
        image: "images/27.jpg", 
        tags: ["1-2 класи", "Графіка"] 
      },
      { 
        name: "Пензлик Плюс", 
        description: "Функціональний графічний редактор для дітей.", 
        link: "services/penslykplus.html", 
        image: "images/35.jpg" , 
        tags: ["3-4 класи", "Графіка"] 
      },
      { 
        name: "Комірник", 
        description: "Спрощщений табличний процесор для дітей.", 
        link: "services/komirnyk/index.html", 
        image: "images/66.jpg" , 
        tags: ["3-4 класи", "Таблиці"] 
      },
      { 
        name: "Бітовий конвертер", 
        description: "Простий конвертер з двійкової в десяткову систему.", 
        link: "services/bitconverter.html", 
        image: "images/5.jpg", 
        tags: ["5-6 класи"] 
      }
    ]
  },
  {
    id: "games",
    name: "Ігри та експерименти",
    iconClass: "fas fa-gamepad",
    color: "#14b8a6",
    services: [
      { 
        name: "Змійка", 
        description: "Керуй змійкою, збирай їжу та ставай довшим. Розвиває швидкість реакції та координацію рухів.", 
        link: "games/snake.html", 
        image: "images/51.jpg", 
        tags: [] 
      },
      { 
        name: "Теніс", 
        description: "Динамічний пінг-понг для двох гравців. Тренує швидкість реакції та координацію.", 
        link: "games/tenis.html", 
        image: "images/52.jpg", 
        tags: [] 
      },
      { 
        name: "Морський бій", 
        description: "Класична онлайн-гра для двох гравців. Розвиває стратегічне та критичне мислення.", 
        link: "games/seabattle.html", 
        image: "images/54.jpg", 
        tags: [] 
      },
      { 
        name: "Космічні заарбники", 
        description: "Захищай космос від прибульців! Удосконалює точність кліків та швидкість реакції.", 
        link: "games/spaceinviders.html", 
        image: "images/53.jpg", 
        tags: [] 
      },
      { 
        name: "Руйнівник блоків", 
        description: "Класична аркада для одного гравця! Розвиває просторове мислення та швидкість реакції.", 
        link: "games/arkanoid.html", 
        image: "images/63.jpg", 
        tags: [] 
      },
      { 
        name: "Неонова хвиля", 
        description: "ТІЛЬКИ ДЛЯ ГРАВЦІВ З МІЦНИМИ НЕРВАМИ! Розвиває просторове мислення та швидкість реакції.", 
        link: "games/neon_wave.html", 
        image: "images/64.jpg", 
        tags: [] 
      },
      { 
        name: "Місія: Порятунок сервера", 
        description: "Допоможи відновити шкільний сервер з оцінками та домашніми завданнями.", 
        link: "services/quizes/save_server/index.html", 
        image: "images/64.jpg", 
        tags: ["Тест"] 
      },
      { 
        name: "Онлайн-дошка", 
        description: "Зручна мінімалістична онлайн-дошка з таймером та QR code генератором.", 
        link: "doshka/", 
        image: "images/47.jpg" 
      },
      { 
        name: "Пікселізатор", 
        description: "Вивчай абстракцію за допомогою пікселів!", 
        link: "services/pixels.html", 
        image: "images/29.jpg" 
      },
      { 
        name: "Розпізнавач облич", 
        description: "Інтерактивна демонстрація комп'ютерного зору", 
        link: "services/facedetector.html", 
        image: "images/30.jpg" 
      },
      { 
        name: "Фейс ту смайл", 
        description: "Доповнена реальність і смайлики!", 
        link: "services/facemask.html", 
        image: "images/31.jpg" 
      }
    ]
  },
  {
    id: "useful-links",
    name: "Корисні посилання",
    iconClass: "fas fa-link",
    color: "#64748b",
    services: [
      { 
        name: "micro:bit для вчителів та учнів", 
        description: "Знайомство з micro:bit та його основними компонентами та можливостями.", 
        link: "microbit/", 
        image: "images/45.png", 
        tags: [] 
      },
      { 
        name: "Інструменти для вчителя інформатики", 
        description: "Добірка корисних інструментів для вчителя інформатики.", 
        link: "outer/", 
        image: "images/44.jpg", 
        tags: [] 
      },
      { 
        name: "Освітні застосунки для дітей", 
        description: "Добірка перевірених освітніх застосунків для дітей.", 
        link: "apps/", 
        image: "images/43.jpg", 
        tags: [] 
      }
    ]
  },
  {
    id: "quiz",
    name: "Перевір знання",
    iconClass: "fas fa-clipboard-question",
    color: "#A3E635",
    services: [
      { 
        name: "Сортування 1", 
        description: "Відсортуй об'єкти за ознаками.", 
        link: "services/quizes/abc_sort.html", 
        image: "images/55.jpg", 
        tags: ["1-2 класи"] 
      },
      { 
        name: "Сортування 2", 
        description: "Відсортуй об'єкти за ознаками.", 
        link: "services/quizes/sort.html", 
        image: "images/55.jpg", 
        tags: ["1-2 класи"] 
      },
      { 
        name: "Сортування 3", 
        description: "Відсортуй об'єкти за ознаками.", 
        link: "services/infosort.html", 
        image: "images/55.jpg", 
        tags: ["1-2 класи"] 
      },
      { 
        name: "Перевір себе", 
        description: "Тест з обчислювального мислення.", 
        link: "services/quiz.html", 
        image: "images/55.jpg", 
        tags: ["1-2 класи", "3-4 класи"] 
      },
      { 
        name: "Місія: Порятунок сервера", 
        description: "Допоможи відновити шкільний сервер з оцінками та домашніми завданнями.", 
        link: "services/quizes/save_server/index.html", 
        image: "images/64.jpg", 
        tags: ["3-4 класи"] 
      }
    ]
  }
];
