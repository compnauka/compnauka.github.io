// data.js

const CATEGORIES = [
  {
    id: "offline-activities",
    name: "Безкомп'ютерні активності",
    iconClass: "fas fa-child", // Іконка для категорії
    services: [
      { name: 'Паперові алгоритми: Залізниця', description: "Допоможи побудувати залізницю.", link: "pdfs/Pre_Coding_Activity_Potyag_UA.pdf", image: "images/42.jpg", tags: ["1-2 класи"] },
      { name: "Паперові алгоритми: Автомобіль", description: "Проклади маршрут додому.", link: "pdfs/Pre_Coding_Activity_Auto_UA.pdf", image: "images/40.jpg", tags: ["1-2 класи"] },
      { name: "Паперові алгоритми: Равлик", description: "Допоможи Равлику знайти шлях до смаколика.", link: "pdfs/Pre_CodingActivity_Ravlyk_UA.pdf", image: "images/41.jpg", tags: ["1-2 класи"] }
    ]
  },
  {
    id: "digital-literacy",
    name: "Цифрова грамотність",
    iconClass: "fas fa-laptop", // Іконка для категорії
    services: [
      { name: "Мишачі перегони", description: "Тренажер для роботи з мишкою.", link: "services/click.html", image: "images/10.jpg", tags: ["2-3 класи"] },
      { name: "Гарячі клавіши", description: "Інтерактивний урок про роботу з клавіатурою.", link: "services/typing.html", image: "images/18.jpg", tags: ["2-4 класи"] },
      { name: "Спритні пальчики", description: "Веселий тренажер для роботи з клавіатурою.", link: "services/keys.html", image: "images/11.jpg", tags: ["2-4 класи"] },
      { name: "Веселі адреси", description: "Практичний тренажер для введення URL-адрес.", link: "services/urls.html", image: "images/38.jpg", tags: ["3-5 класи"] },
      { name: "Шукаємо в Інтернеті", description: "Інтерактивне опанування пошукових систем.", link: "services/se/index.html", image: "images/39.jpg", tags: ["3-5 класи"] }
    ]
  },
  {
    id: "computational-thinking",
    name: "Обчислювальне мислення",
    iconClass: "fas fa-brain", // Іконка для категорії
    services: [
      { name: "Обчислювальне мислення", description: "Простими словами про обчислювальне мислення.", link: "services/compthinking.html", image: "images/1.jpg", tags: ["3-7 класи"] },
      { name: "Абстракція для дітей", description: "Інтерактивний урок про рівні абстракції.", link: "services/abstraction.html", image: "images/22.jpg", tags: ["5-7 класи"] },
      { name: "Виявлення шаблонів", description: "Інтерактивний урок про виявлення шаблонів.", link: "services/patterns.html", image: "images/23.jpg", tags: ["5-7 класи"] },
      { name: "Декомпозиція для дітей", description: "Інтерактивний урок про декомпозицію.", link: "services/decomposition.html", image: "images/24.jpg", tags: ["5-7 класи"] }
    ]
  },
  {
    id: "programming",
    name: "Алгоритми та програмування",
    iconClass: "fas fa-code", // Іконка для категорії
    services: [
      { name: "Алгоритми для дітей", description: "Як програмувати роботів та комп'ютери.", link: "services/algorithm.html", image: "images/12.jpg", tags: ["3-5 класи"] },
      { name: "Конструктор блок-схем", description: "Простий редактор для створення блок-схем.", link: "services/blocks/index.html", image: "images/37.jpg", tags: ["5-7 класи"] },
      { name: "Програмування з Равликом", description: "Онлайн редактор для текстової мови програмування РАВЛИК", link: "https://ravlyk.org", image: "images/2.jpg", tags: ["2-3 класи"] },
      { name: "Посібник з програмування Равлика", description: "Знайомство з мовою програмування РАВЛИК.", link: "https://ravlyk.org/manual.html", image: "images/3.jpg", tags: ["2-3 класи"] },
      { name: "Фермер Бот", description: "Програмування робота за допомогою блоків.", link: "services/farmbot/index.html", image: "images/25.jpg", tags: ["2-3 класи"] },
      { name: "Фермер Бот Плюс", description: "Програмування робота за допомогою текстових команд.", link: "services/farmbot_plus/index.html", image: "images/26.jpg", tags: ["3-5 класи"] },
      { name: "Що таке змінні", description: "Інтерактивний урок про змінні в програмуванні.", link: "services/variables.html", image: "images/33.jpg", tags: ["5-7 класи"] },
      { name: "Що таке типи даних", description: "Інтерактивний урок про типи даних в програмуванні.", link: "services/types.html", image: "images/34.jpg", tags: ["5-7 класи"] },
      { name: "Основи Python", description: "Курс з основ програмування на Python.", link: "/python", image: "images/46.jpg", tags: ["5-7 класи"] }
    ]
  },
  {
    id: "safety-info",
    name: "Безпека та інформація",
    iconClass: "fas fa-shield-alt", // Іконка для категорії
    services: [
      { name: "Кібербезпека для дітей", description: "Дізнайся, як захистити себе в інтернеті.", link: "services/cyber.html", image: "images/9.jpg", tags: ["2-5 класи"] },
      { name: "Криптографія для дітей", description: "Інтерактивний сайт про шифрування інформації.", link: "services/crypto.html", image: "images/8.jpg", tags: ["4-6 класи"] },
      { name: "Шифр Цезаря", description: "Зашифруй своє повідомлення одним з найдавніших шифрів.", link: "services/caesar_encrypt.html", image: "images/6.jpg", tags: ["4-7 класи"] },
      { name: "Розшифрування шифру Цезаря", description: "Розшифруй повідомлення, яке було зашифроване шифром Цезаря.", link: "services/caesar_decrypt.html", image: "images/7.jpg", tags: ["4-7 класи"] },
      { name: "Перевіряй інформацію!", description: "Інтерактивний тренажер з критичного оцінювання інформації.", link: "services/critic.html", image: "images/13.jpg", tags: ["2-4 класи"] }
    ]
  },
  {
    id: "ai",
    name: "Штучний інтелект",
    iconClass: "fas fa-robot", // Іконка для категорії
    services: [
      { name: "Штучний інтелект", description: "Інтерактивний сайт про те, як працює ШІ.", link: "services/ai.html", image: "images/32.jpg", tags: ["4-6 класи"] },
      { name: "Привіт, ШІ!", description: "Інтерактивна книга для дітей про штучний інтелект.", link: "https://pryvitshi.github.io/", image: "images/4.jpg", tags: ["3-4 класи"] }
    ]
  },
  {
    id: "digital-tools",
    name: "Цифрові інструменти",
    iconClass: "fas fa-tools", // Іконка для категорії
    services: [
      { name: "Друкарик", description: "Веселий текстовий редактор для дітей.", link: "services/drukaryk.html", image: "images/28.jpg", tags: ["2- класи"] },
      { name: "Піксель", description: "Простий піксельний графічний редактор для дітей.", link: "services/pixel.html", image: "images/36.jpg", tags: ["1 класи"] },
      { name: "Пензлик", description: "Яскравий графічний редактор для дітей.", link: "services/penslyk.html", image: "images/27.jpg", tags: ["2-4 класи"] },
      { name: "Пензлик Плюс", description: "Функціональний графічний редактор для дітей.", link: "services/penslykplus.html", image: "images/35.jpg" , tags: ["3-5 класи"] },
      { name: "Бітовий конвертер", description: "Простий конвертер з двійкової в десяткову систему.", link: "services/bitconverter.html", image: "images/5.jpg", tags: ["8-9 класи"] }
    ]
  },
  {
    id: "experiments",
    name: "Експерименти",
    iconClass: "fas fa-flask", // Іконка для категорії
    services: [
      { name: "Пікселізатор", description: "Вивчай абстракцію за допомогою пікселів!", link: "services/pixels.html", image: "images/29.jpg", },
      { name: "Розпізнавач облич", description: "Інтерактивна демонстрація комп'ютерного зору", link: "services/facedetector.html", image: "images/30.jpg", },
      { name: "Фейс ту смайл", description: "Доповнена реальність і смайлики!", link: "services/facemask.html", image: "images/31.jpg", }
    ]
  },
  {
    id: "useful-links",
    name: "Корисні посилання",
    iconClass: "fas fa-link", // Іконка для категорії
    services: [
      { name: "micro:bit для вчителів та учнів", description: "Знайомство з micro:bit та його основними компонентами та можливостями.", link: "microbit/", image: "images/45.png", tags: [] },
      { name: "Інструменти для вчителя інформатики", description: "Добірка корисних інструментів для вчителя інформатики.", link: "outer/", image: "images/44.jpg", tags: [] },
      { name: "Освітні застосунки для дітей", description: "Добірка перевірених освітніх застосунків для дітей.", link: "apps/", image: "images/43.jpg", tags: [] }
    ]
  }
];
