/* global window */
window.CS_CURRICULUM = [
  {
    id: 0,
    title: "Модуль 0. Старт і правила",
    lessons: [
      { id: "0.1", title: "Як працює курс", quiz: { question: "Яка головна особливість курсу?", options: ["Довгі лекції", "Mobile-first практика", "Тільки текст"], correct: 1 } },
      { id: "0.2", title: "Навіщо комп’ютерна наука", quiz: { question: "CS - це...", options: ["Ремонт ПК", "Вирішення проблем", "Тільки кодинг"], correct: 1 } },
      { id: "0.3", title: "Мініпроєкт: як комп’ютер “рахує”", quiz: { question: "Базова система числення ПК?", options: ["Десяткова", "Двійкова", "Шістнадцяткова"], correct: 1 } }
    ]
  },
  {
    id: 1,
    title: "Модуль 1. Інформація і дані",
    lessons: [
      { id: "1.1", title: "Інформація крізь віки", quiz: { question: "Перший носій інформації?", options: ["Папірус", "Наскельні малюнки", "HDD"], correct: 1 } },
      { id: "1.2", title: "Дані vs інформація", quiz: { question: "Дані - це...", options: ["Оброблена інформація", "Сирі факти", "Знання"], correct: 1 } },
      { id: "1.3", title: "Моделі та правила", quiz: { question: "Модель - це...", options: ["Спрощення об'єкта", "Іграшка", "Тільки 3D"], correct: 0 } }
    ]
  },
  {
    id: 2,
    title: "Модуль 2. Комп’ютер як система",
    lessons: [
      { id: "2.1", title: "Input–Process–Output", quiz: { question: "Схема роботи ПК?", options: ["Input-Output", "Input-Process-Output", "Process-Input"], correct: 1 } },
      { id: "2.2", title: "Пристрої введення", quiz: { question: "Приклад введення?", options: ["Клавіатура", "Монітор", "Принтер"], correct: 0 } },
      { id: "2.3", title: "Пристрої виведення", quiz: { question: "Приклад виведення?", options: ["Мишка", "Екран", "Мікрофон"], correct: 1 } },
      { id: "2.4", title: "CPU / RAM / SSD", quiz: { question: "'Мозок' комп'ютера?", options: ["SSD", "CPU", "RAM"], correct: 1 } }
    ]
  },
  {
    id: 3,
    title: "Модуль 3. Кодування світу",
    lessons: [
      { id: "3.1", title: "Двійкова система", quiz: { question: "Символи двійкової системи?", options: ["0-9", "0 і 1", "A-Z"], correct: 1 } },
      { id: "3.2", title: "Біти, байти, мегабайти", quiz: { question: "1 Байт =", options: ["8 біт", "10 біт", "100 біт"], correct: 0 } },
      { id: "3.3", title: "Текст = числа (ASCII)", quiz: { question: "ASCII - це...", options: ["Мова", "Таблиця кодування", "Протокол"], correct: 1 } },
      { id: "3.4", title: "Зображення = пікселі", quiz: { question: "З чого складається растр?", options: ["Векторів", "Пікселів", "Хвиль"], correct: 1 } },
      { id: "3.5", title: "Звук = хвилі", quiz: { question: "Дискретизація - це...", options: ["Стиснення", "Оцифровка хвилі", "Видалення шуму"], correct: 1 } }
    ]
  },
  {
    id: 4,
    title: "Модуль 4. ОС, файли, хмара",
    lessons: [
      { id: "4.1", title: "Що робить ОС", quiz: { question: "Функція ОС?", options: ["Ресурс-менеджмент", "Створення сайтів", "Графіка"], correct: 0 } },
      { id: "4.2", title: "Файли, папки, формати", quiz: { question: "Що вказує на тип файлу?", options: ["Розмір", "Розширення", "Дата"], correct: 1 } },
      { id: "4.3", title: "Оновлення та бекапи", quiz: { question: "Мета бекапу?", options: ["Відновлення даних", "Очистка місця", "Прискорення"], correct: 0 } },
      { id: "4.4", title: "Хмара і синхронізація", quiz: { question: "'Хмара' - це...", options: ["Сервери в мережі", "Погода", "Локальний диск"], correct: 0 } }
    ]
  },
  {
    id: 5,
    title: "Модуль 5. Програми і побут",
    lessons: [
      { id: "5.1", title: "Hardware vs Software", quiz: { question: "Software - це...", options: ["Залізо", "Програми", "Корпус"], correct: 1 } },
      { id: "5.2", title: "Системне vs прикладне ПЗ", quiz: { question: "Браузер - це...", options: ["Системне ПЗ", "Прикладне ПЗ", "Драйвер"], correct: 1 } },
      { id: "5.3", title: "Встановлення і дозволи", quiz: { question: "Які дозволи давати?", options: ["Всі", "Мінімально необхідні", "Жодних"], correct: 1 } }
    ]
  },
  {
    id: 6,
    title: "Модуль 6. Обчислювальне мислення",
    lessons: [
      { id: "6.1", title: "Декомпозиція", quiz: { question: "Декомпозиція - це...", options: ["Об'єднання", "Розбиття на частини", "Видалення"], correct: 1 } },
      { id: "6.2", title: "Алгоритм = рецепт", quiz: { question: "Риса алгоритму?", options: ["Хаос", "Послідовність", "Складність"], correct: 1 } },
      { id: "6.3", title: "Умови (IF)", quiz: { question: "IF працює...", options: ["Завжди", "За умови істини", "Циклічно"], correct: 1 } },
      { id: "6.4", title: "Цикли (FOR/WHILE)", quiz: { question: "Цикли потрібні для...", options: ["Повторення", "Зупинки", "Краси"], correct: 0 } },
      { id: "6.5", title: "Debug", quiz: { question: "Дебагінг - це...", options: ["Створення багів", "Пошук помилок", "Компіляція"], correct: 1 } }
    ]
  },
  {
    id: 7,
    title: "Модуль 7. Програмування",
    lessons: [
      { id: "7.1", title: "Що таке програма", quiz: { question: "Виконавець програми?", options: ["Програміст", "Комп'ютер", "Мережа"], correct: 1 } },
      { id: "7.2", title: "Змінні та типи даних", quiz: { question: "Змінна зберігає...", options: ["Дані", "Екран", "Числа"], correct: 0 } },
      { id: "7.3", title: "Функції", quiz: { question: "Функції для...", options: ["Повторного використання", "Заплутування", "Видалення"], correct: 0 } },
      { id: "7.4", title: "Мініпроєкт: міні-бот", quiz: { question: "Бот працює за...", options: ["Настроєм", "Алгоритмом", "Випадковістю"], correct: 1 } }
    ]
  },
  {
    id: 8,
    title: "Модуль 8. Інтернет і веб",
    lessons: [
      { id: "8.1", title: "Клієнт і сервер", quiz: { question: "Хто шле запит?", options: ["Сервер", "Клієнт", "Провайдер"], correct: 1 } },
      { id: "8.2", title: "DNS і адреси", quiz: { question: "Роль DNS?", options: ["Домен -> IP", "Роздача Wi-Fi", "Блокування"], correct: 0 } },
      { id: "8.3", title: "HTTP/HTTPS", quiz: { question: "'S' в HTTPS?", options: ["Speed", "Secure", "Simple"], correct: 1 } },
      { id: "8.4", title: "Cookies і сесії", quiz: { question: "Cookies для...", options: ["Збереження стану", "Вірусів", "Очистки"], correct: 0 } }
    ]
  },
  {
    id: 9,
    title: "Модуль 9. Дані",
    lessons: [
      { id: "9.1", title: "Таблиці і фільтри", quiz: { question: "Фільтр...", options: ["Видаляє", "Відбирає потрібне", "Сортує"], correct: 1 } },
      { id: "9.2", title: "Графіки та діаграми", quiz: { question: "Візуалізація для...", options: ["Розуміння даних", "Краси", "Обфускації"], correct: 0 } },
      { id: "9.3", title: "Бази даних", quiz: { question: "Перевага БД над Excel?", options: ["Простота", "Масштабованість", "Ціна"], correct: 1 } }
    ]
  },
  {
    id: 10,
    title: "Модуль 10. ШІ та критичне мислення",
    lessons: [
      { id: "10.1", title: "Програма vs ШІ", quiz: { question: "Особливість ШІ?", options: ["Жорсткий код", "Навчання", "Нічого"], correct: 1 } },
      { id: "10.2", title: "Галюцинації ШІ", quiz: { question: "Галюцинація - це...", options: ["Вірус", "Вигаданий факт", "Збій"], correct: 1 } },
      { id: "10.3", title: "Безпечне користування ШІ", quiz: { question: "Вірити ШІ?", options: ["Завжди", "Перевіряти", "Ніколи"], correct: 1 } }
    ]
  },
  {
    id: 11,
    title: "Модуль 11. Безпека",
    lessons: [
      { id: "11.1", title: "Паролі та 2FA", quiz: { question: "Найнадійніше?", options: ["123456", "Пароль + 2FA", "Тільки пароль"], correct: 1 } },
      { id: "11.2", title: "Фішинг", quiz: { question: "Мета фішингу?", options: ["Дати приз", "Крадіжка даних", "Оновлення"], correct: 1 } },
      { id: "11.3", title: "Приватність", quiz: { question: "Приватні дані?", options: ["Погода", "Адреса", "Новини"], correct: 1 } },
      { id: "11.4", title: "Цифровий слід", quiz: { question: "Інформація в мережі...", options: ["Зникає", "Залишається", "Тимчасова"], correct: 1 } },
      { id: "11.5", title: "Медіаграмотність", quiz: { question: "Фактчекінг - це...", options: ["Перевірка фактів", "Читання", "Лайки"], correct: 0 } }
    ]
  },
  {
    id: 12,
    title: "Фінал",
    lessons: [
      { id: "F.1", title: "Капстоун-проєкт", quiz: { question: "Капстоун - це...", options: ["Тест", "Фінальний проєкт", "Лекція"], correct: 1 } }
    ]
  }
];
