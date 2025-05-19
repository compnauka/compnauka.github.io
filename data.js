// data.js

const CATEGORIES = [
  {
    id: "digital-literacy",
    name: "Цифрова грамотність",
    iconClass: "fas fa-laptop", // Іконка для категорії
    services: [
      { name: "Мишачі перегони", description: "Тренажер для роботи з мишкою.", link: "services/click.html", image: "images/10.jpg" },
      { name: "Гарячі клавіши", description: "Інтерактивний урок про роботу з клавіатурою.", link: "services/typing.html", image: "images/18.jpg" },
      { name: "Спритні пальчики", description: "Веселий тренажер для роботи з клавіатурою.", link: "services/keys.html", image: "images/11.jpg" },
      { name: "Веселі адреси", description: "Практичний тренажер для введення URL-адрес.", link: "services/urls.html", image: "images/38.jpg" },
      { name: "Шукаємо в Інтернеті", description: "Інтерактивне опанування пошукових систем.", link: "services/se/index.html", image: "images/39.jpg" }
    ]
  },
  {
    id: "computational-thinking",
    name: "Обчислювальне мислення",
    iconClass: "fas fa-brain", // Іконка для категорії
    services: [
      { name: "Обчислювальне мислення", description: "Простими словами про обчислювальне мислення.", link: "services/compthinking.html", image: "images/1.jpg" },
      { name: "Абстракція для дітей", description: "Інтерактивний урок про рівні абстракції.", link: "services/abstraction.html", image: "images/22.jpg" },
      { name: "Виявлення шаблонів", description: "Інтерактивний урок про виявлення шаблонів.", link: "services/patterns.html", image: "images/23.jpg" },
      { name: "Декомпозиція для дітей", description: "Інтерактивний урок про декомпозицію.", link: "services/decomposition.html", image: "images/24.jpg" }
    ]
  },
  {
    id: "programming",
    name: "Алгоритми та програмування",
    iconClass: "fas fa-code", // Іконка для категорії
    services: [
      { name: "Алгоритми для дітей", description: "Як програмувати роботів та комп'ютери.", link: "services/algorithm.html", image: "images/12.jpg" },
      { name: "Конструктор блок-схем", description: "Простий редактор для створення блок-схем.", link: "services/blocks/index.html", image: "images/37.jpg" },
      { name: "Програмування з Равликом", description: "Онлайн редактор для текстової мови програмування РАВЛИК", link: "https://ravlyk.org", image: "images/2.jpg" },
      { name: "Посібник з програмування Равлика", description: "Знайомство з мовою програмування РАВЛИК.", link: "https://ravlyk.org/manual.html", image: "images/3.jpg" },
      { name: "Фермер Бот", description: "Програмування робота за допомогою блоків.", link: "services/farmbot/index.html", image: "images/25.jpg" },
      { name: "Фермер Бот Плюс", description: "Програмування робота за допомогою текстових команд.", link: "services/farmbot_plus/index.html", image: "images/26.jpg" },
      { name: "Що таке змінні", description: "Інтерактивний урок про змінні в програмуванні.", link: "services/variables.html", image: "images/33.jpg" },
      { name: "Що таке типи даних", description: "Інтерактивний урок про типи даних в програмуванні.", link: "services/types.html", image: "images/34.jpg" }
    ]
  },
  {
    id: "safety-info",
    name: "Безпека та інформація",
    iconClass: "fas fa-shield-alt", // Іконка для категорії
    services: [
      { name: "Кібербезпека для дітей", description: "Дізнайся, як захистити себе в інтернеті.", link: "services/cyber.html", image: "images/9.jpg" },
      { name: "Криптографія для дітей", description: "Інтерактивний сайт про шифрування інформації.", link: "services/crypto.html", image: "images/8.jpg" },
      { name: "Шифр Цезаря", description: "Зашифруй своє повідомлення одним з найдавніших шифрів.", link: "services/caesar_encrypt.html", image: "images/6.jpg" },
      { name: "Розшифрування шифру Цезаря", description: "Розшифруй повідомлення, яке було зашифроване шифром Цезаря.", link: "services/caesar_decrypt.html", image: "images/7.jpg" },
      { name: "Перевіряй інформацію!", description: "Інтерактивний тренажер з критичного оцінювання інформації.", link: "services/critic.html", image: "images/13.jpg" }
    ]
  },
  {
    id: "ai",
    name: "Штучний інтелект",
    iconClass: "fas fa-robot", // Іконка для категорії
    services: [
      { name: "Штучний інтелект", description: "Інтерактивний сайт про те, як працює ШІ.", link: "services/ai.html", image: "images/32.jpg" },
      { name: "Привіт, ШІ!", description: "Інтерактивна книга для дітей про штучний інтелект.", link: "https://pryvitshi.github.io/", image: "images/4.jpg" }
    ]
  },
  {
    id: "digital-tools",
    name: "Цифрові інструменти",
    iconClass: "fas fa-tools", // Іконка для категорії
    services: [
      { name: "Друкарик", description: "Веселий текстовий редактор для дітей.", link: "services/drukaryk.html", image: "images/28.jpg" },
      { name: "Піксель", description: "Простий піксельний графічний редактор для дітей.", link: "services/pixel.html", image: "images/36.jpg" },
      { name: "Пензлик", description: "Яскравий графічний редактор для дітей.", link: "services/penslyk.html", image: "images/27.jpg" },
      { name: "Пензлик Плюс", description: "Функціональний графічний редактор для дітей.", link: "services/penslykplus.html", image: "images/35.jpg" },
      { name: "Бітовий конвертер", description: "Простий конвертер з двійкової в десяткову систему.", link: "services/bitconverter.html", image: "images/5.jpg" }
    ]
  },
  {
    id: "experiments",
    name: "Експерименти",
    iconClass: "fas fa-flask", // Іконка для категорії
    services: [
      { name: "Пікселізатор", description: "Вивчай абстракцію за допомогою пікселів!", link: "services/pixels.html", image: "images/29.jpg" },
      { name: "Розпізнавач облич", description: "Інтерактивна демонстрація комп'ютерного зору", link: "services/facedetector.html", image: "images/30.jpg" },
      { name: "Фейс ту смайл", description: "Доповнена реальність і смайлики!", link: "services/facemask.html", image: "images/31.jpg" }
    ]
  }
];
