// ---- Основна логіка додатку ----
// ---- Отримання основних DOM-елементів ----
const searchBox = document.getElementById("searchBox");
const searchBtn = document.getElementById("searchBtn");
const luckyBtn = document.getElementById("luckyBtn");
const searchContainer = document.getElementById("searchContainer");
const logo = document.getElementById("logo");
const searchBoxContainer = document.getElementById("searchBoxContainer");
const resultsContainer = document.getElementById("resultsContainer");
const resultsContent = document.getElementById("resultsContent");
const resultsHeaderInfo = document.getElementById("resultsHeaderInfo");
const resultsCountEl = document.getElementById("resultsCount");
const searchTimeEl = document.getElementById("searchTime");
const searchButtonsContainer = document.getElementById(
  "searchButtonsContainer"
);
const backButtonContainer = document.getElementById("backButtonContainer");
const backBtn = document.getElementById("backBtn");

const addressBarHostPathEl = document.getElementById("addressBarHostPath");

const lessonSelect = document.getElementById("lessonSelect");
const startLessonBtn = document.getElementById("startLessonBtn");
const lessonModal = document.getElementById("lessonModal");
const modalTitle = document.getElementById("modalTitle");
const modalBody = document.getElementById("modalBody");
const modalBtn = document.getElementById("modalBtn");
const closeModalBtn = document.getElementById("closeModal");

const helpToggle = document.getElementById("helpToggle");
const helpPanel = document.getElementById("helpPanel");

const BASE_URL = "https://shukaryk.fun";

// ---- Дані для симуляції результатів пошуку ----
const searchResultsData = {
  "столиця україни": [
    {
      title: "Київ — столиця України - Вікіпедія",
      url: "https://uk.wikipedia.org/wiki/Київ",
      description:
        "Київ — столиця та найбільше місто України, одне з найбільших і найстаріших міст Європи. Розташований у середній течії Дніпра, у північній Наддніпрянщині. Офіційною датою заснування вважається 482 рік.",
    },
    {
      title: "10 цікавих фактів про Київ - Офіційний портал міста",
      url: "https://kyivcity.gov.ua/facts",
      description:
        "Київ є столицею України з 1934 року. Місто має багату історію, що налічує понад 1500 років. Тут знаходиться Києво-Печерська Лавра, Софійський собор та багато інших пам'яток.",
    },
  ],
  "погода київ сьогодні": [
    {
      title: "Погода у Києві сьогодні - Gismeteo",
      url: "https://www.gismeteo.ua/weather-kyiv-4944/",
      description:
        "Прогноз погоди у Києві на сьогодні: температура повітря вдень +15°C, вночі +8°C. Опади: можливий невеликий дощ.",
    },
  ],
  "що таке фотосинтез": [
    {
      title: "Фотосинтез - Вікіпедія",
      url: "https://uk.wikipedia.org/wiki/Фотосинтез",
      description:
        "Фотосинтез — процес перетворення енергії світла на енергію хімічних зв'язків органічних речовин за участю фотосинтетичних пігментів.",
    },
    {
      title: "Фотосинтез: суть процесу та його значення - Біологія",
      url: "https://biology.org.ua/photosynthesis",
      description:
        "Фотосинтез - це складний біохімічний процес, під час якого зелені рослини синтезують органічні речовини.",
    },
  ],
  "поясни простими словами, як працює фотосинтез, і чому він важливий для планети?":
    [
      // Приклад для ШІ-запиту
      {
        title: "ШІ-Відповідь: Фотосинтез для дітей та дорослих",
        url: `${BASE_URL}/ai-answer/photosynthesis`,
        description:
          "Уявіть, що рослинка – це маленький чарівний кухар! Вона бере сонячне світло (як енергію від сонечка), воду (яку п'є корінцями з землі) та повітря (а саме вуглекислий газ, який ми видихаємо) і все це перетворює на смачну їжу для себе (цукор, глюкозу) та кисень! Цей кисень дуже важливий, бо ним дихаємо ми, тваринки, і взагалі все живе на Землі. Без фотосинтезу не було б кисню, а отже, і життя, яким ми його знаємо. Також рослини, завдяки фотосинтезу, забирають з повітря вуглекислий газ, допомагаючи очищувати нашу планету. Ось такий важливий цей процес!",
      },
      {
        title: "Фотосинтез - детально (Вікіпедія)",
        url: "https://uk.wikipedia.org/wiki/Фотосинтез",
        description:
          "Класичне посилання на детальну статтю для тих, хто хоче знати більше.",
      },
    ],
  default: [
    {
      title: "Результати за вашим запитом - Навчальний портал Шукарик",
      url: `${BASE_URL}/search-results`,
      description:
        "Це приклад результату пошуку. У реальній пошуковій системі тут ви побачили б сторінки, що відповідають вашому запиту. Спробуйте ввести більш конкретний запит!",
    },
    {
      title: "Основи роботи з пошуковими системами - Цифрова грамотність",
      url: "https://osvita.diia.gov.ua/digital-literacy/search-basics",
      description:
        "Навчальні матеріали про те, як ефективно використовувати пошукові системи.",
    },
  ],
};

// ---- Функція для показу/приховування підказок ----
// Динамічне позиціонування tooltip
function showTooltip(icon, tooltip) {
  // Спочатку робимо tooltip видимим, але не на екрані
  tooltip.style.cssText = `
        display: block !important;
        top: -9999px !important;
        left: -9999px !important;
        z-index: 9999 !important;
        visibility: visible !important;
        opacity: 1 !important;
    `;

  // Отримуємо розміри іконки та tooltip
  const iconRect = icon.getBoundingClientRect();
  const tooltipRect = tooltip.getBoundingClientRect();

  // Отримуємо розміри вікна браузера
  const windowWidth = window.innerWidth;
  const windowHeight = window.innerHeight;

  // Розраховуємо доступний простір з кожного боку іконки
  const spaceAbove = iconRect.top;
  const spaceBelow = windowHeight - iconRect.bottom;
  const spaceLeft = iconRect.left;
  const spaceRight = windowWidth - iconRect.right;

  // Розраховуємо позицію для кожного варіанту розміщення
  let position, top, left, transform;

  // 1. Спробуємо розмістити внизу (перший пріоритет)
  if (spaceBelow >= tooltipRect.height + 10 || spaceBelow >= spaceAbove) {
    position = "bottom";
    top = iconRect.bottom + 10;
    left = iconRect.left + iconRect.width / 2;
    transform = "translateX(-50%)";
  }
  // 2. Спробуємо розмістити вгорі
  else if (spaceAbove >= tooltipRect.height + 10) {
    position = "top";
    top = iconRect.top - tooltipRect.height - 10;
    left = iconRect.left + iconRect.width / 2;
    transform = "translateX(-50%)";
  }
  // 3. Спробуємо розмістити справа
  else if (spaceRight >= tooltipRect.width + 10) {
    position = "right";
    top = iconRect.top + iconRect.height / 2;
    left = iconRect.right + 10;
    transform = "translateY(-50%)";
  }
  // 4. Спробуємо розмістити зліва
  else if (spaceLeft >= tooltipRect.width + 10) {
    position = "left";
    top = iconRect.top + iconRect.height / 2;
    left = iconRect.left - tooltipRect.width - 10;
    transform = "translateY(-50%)";
  }
  // 5. Запасний варіант - розміщуємо найкраще як можемо
  else {
    position = "center";
    // Встановлюємо по центру екрану
    top = (windowHeight - tooltipRect.height) / 2;
    left = (windowWidth - tooltipRect.width) / 2;
    transform = "translate(0, 0)";
  }

  // Перевіряємо чи tooltip не виходить за межі екрану та коригуємо якщо потрібно
  if (position === "bottom" || position === "top") {
    // Перевірка чи не виходить за правий край
    if (left + tooltipRect.width / 2 > windowWidth - 10) {
      left = windowWidth - tooltipRect.width - 10;
      transform = "translate(0, 0)";
    }
    // Перевірка чи не виходить за лівий край
    if (left - tooltipRect.width / 2 < 10) {
      left = 10;
      transform = "translate(0, 0)";
    }
  }

  // Застосовуємо фінальні стилі
  tooltip.style.cssText = `
        display: block !important;
        top: ${top}px !important;
        left: ${left}px !important;
        transform: ${transform} !important;
        z-index: 9999 !important;
        visibility: visible !important;
        opacity: 1 !important;
    `;

  console.log(`🌟 Толтіп розміщено: ${position}`, { top, left, transform });
}

function toggleTooltip(id) {
  console.log("🔔 toggleTooltip викликано для", id);

  const tooltip = document.getElementById(id);

  if (!tooltip) {
    console.error("⚠️ Не знайдено tooltip елемент з id:", id);
    return;
  }

  // Перевіряємо поточний стан (видимий/невидимий)
  const computedStyle = window.getComputedStyle(tooltip);
  const isVisible = computedStyle.display !== "none";

  console.log(
    "🔍 Поточний computed style:",
    computedStyle.display,
    isVisible ? "Видимий" : "Невидимий"
  );

  // Закриваємо всі інші tooltip
  document.querySelectorAll(".tooltip").forEach((tip) => {
    if (tip.id !== id) {
      tip.style.cssText = "display: none !important;";
      tip.setAttribute("aria-hidden", "true");
    }
  });

  // Отримуємо іконку, пов'язану з цим tooltip
  const icon = document.querySelector(`[data-tooltip-id='${id}']`);
  if (!icon) {
    console.warn("⚠️ Не знайдено іконку для tooltip:", id);
  }

  // Якщо tooltip видимий - ховаємо його
  if (isVisible) {
    tooltip.style.cssText = "display: none !important;";
    tooltip.setAttribute("aria-hidden", "true");
    if (icon) icon.setAttribute("aria-expanded", "false");
    console.log("📚 Сховано tooltip:", id);
  }
  // Якщо невидимий - показуємо його
  else {
    // Спочатку встановлюємо display:block, а потім позиціонуємо
    tooltip.setAttribute("aria-hidden", "false");
    if (icon) icon.setAttribute("aria-expanded", "true");
    console.log("📝 Показуємо tooltip:", id);

    // Показуємо з невеликим таймаутом, щоб DOM оновився
    setTimeout(() => {
      tooltip.style.cssText = `
                display: block !important;
                visibility: visible !important;
                opacity: 1 !important;
            `;

      // Перевіряємо, чи це підказка для пошукового рядка
      const isSearchBoxTip = id === "searchBoxTip";

      // Якщо це підказка пошукового рядка, використовуємо спеціальне позиціонування
      if (isSearchBoxTip) {
        // Отримуємо контейнер пошукового рядка
        const searchBox = document.getElementById("searchBox");
        const searchBoxRect = searchBox.getBoundingClientRect();

        tooltip.style.cssText += `
                    position: fixed !important;
                    top: ${searchBoxRect.bottom + 10}px !important;
                    left: ${
                      searchBoxRect.left + searchBoxRect.width / 2
                    }px !important;
                    transform: translateX(-50%) !important;
                    z-index: 9999 !important;
                    max-width: ${Math.min(
                      400,
                      window.innerWidth - 20
                    )}px !important;
                `;
        console.log("🔎 Спеціальне позиціонування для searchBoxTip");
      }
      // Для всіх інших підказок використовуємо звичайне позиціонування
      else if (icon) {
        showTooltip(icon, tooltip);
      } else {
        // Якщо немає іконки, просто показуємо tooltip по центру екрану
        tooltip.style.cssText += `
                    top: 50% !important;
                    left: 50% !important;
                    transform: translate(-50%, -50%) !important;
                    z-index: 9999 !important;
                `;
      }
    }, 50);
  }
}

document.querySelectorAll(".hint-icon").forEach((icon) => {
  const tooltipId = icon.dataset.tooltipId;
  if (!tooltipId) return;

  icon.addEventListener("click", (event) => {
    event.stopPropagation();
    toggleTooltip(tooltipId);
    // Динамічне позиціонування
    const tooltip = document.getElementById(tooltipId);
    if (tooltip && tooltip.style.display === "block") {
      showTooltip(icon, tooltip);
    }
  });
  icon.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      event.stopPropagation();
      toggleTooltip(tooltipId);
      // Динамічне позиціонування
      const tooltip = document.getElementById(tooltipId);
      if (tooltip && tooltip.style.display === "block") {
        showTooltip(icon, tooltip);
      }
    }
  });
});

document.addEventListener("click", function (event) {
  // Закриття help-panel при кліку поза нею і поза help-toggle
  if (helpPanel.classList.contains("visible")) {
    if (
      !event.target.closest(".help-panel") &&
      !event.target.closest(".help-toggle")
    ) {
      helpPanel.classList.remove("visible");
      helpToggle.setAttribute("aria-expanded", "false");
    }
  }
  const clickedElement = event.target;
  if (
    !clickedElement.closest(".hint-icon") &&
    !clickedElement.closest(".tooltip")
  ) {
    document
      .querySelectorAll(".tooltip")
      .forEach((tooltip) => (tooltip.style.display = "none"));
  }
});

// ---- Основна функція пошуку ----
function performSearch(isLucky = false) {
  const query = searchBox.value.trim().toLowerCase(); // Залишаємо toLowerCase для ключів в searchResultsData
  const originalQuery = searchBox.value.trim(); // Зберігаємо оригінальний запит для відображення

  if (!query && isLucky) {
    alert("Будь ласка, введіть запит, щоб спробувати 'Мені пощастить'!");
    return;
  }
  if (!query && !isLucky) {
    return;
  }

  if (addressBarHostPathEl) {
    addressBarHostPathEl.textContent = `${BASE_URL.replace(
      /^https?:\/\//,
      ""
    )}/search?q=${encodeURIComponent(originalQuery)}`;
  }

  searchContainer.classList.add("results-active");
  logo.classList.add("results-active");
  searchBoxContainer.classList.add("results-active");
  resultsContainer.style.display = "block";

  // Приховуємо кнопки пошуку і показуємо кнопку "Назад"
  searchButtonsContainer.style.display = "none";
  backButtonContainer.style.display = "flex";

  resultsContent.innerHTML = "";
  const results = searchResultsData[query] || searchResultsData["default"]; // Пошук за нормалізованим запитом

  resultsCountEl.textContent = results.length.toLocaleString("uk-UA");
  searchTimeEl.textContent = (Math.random() * 0.4 + 0.15).toFixed(2);

  if (isLucky && results.length > 0) {
    alert(
      `Мені пощастить! Симуляція переходу на сторінку:\n"${results[0].title}"\nURL: ${results[0].url}`
    );
  }

  displayResults(results, originalQuery); // Передаємо оригінальний запит для підсвічування

  if (!isLucky || results.length === 0) {
    resultsContainer.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

// ---- Відображення результатів пошуку ----
function displayResults(resultsToDisplay, originalQuery) {
  // originalQuery для підсвічування
  resultsContent.innerHTML = "";
  resultsToDisplay.forEach((result) => {
    const resultItem = document.createElement("div");
    resultItem.className = "result-item";

    const resultTitle = document.createElement("div");
    resultTitle.className = "result-title";
    resultTitle.textContent = result.title;
    resultTitle.tabIndex = 0;
    resultTitle.setAttribute("role", "link");
    const simulatedLinkAction = () => {
      alert(
        `Симуляція переходу на сторінку:\n"${result.title}"\nURL: ${result.url}\n\nУ реальному браузері ви б перейшли за цим посиланням.`
      );
    };
    resultTitle.addEventListener("click", simulatedLinkAction);
    resultTitle.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        simulatedLinkAction();
      }
    });

    const resultUrl = document.createElement("div");
    resultUrl.className = "result-url";
    resultUrl.textContent = result.url;

    const resultDesc = document.createElement("div");
    resultDesc.className = "result-description";

    let descHtml = result.description;
    if (originalQuery) {
      // Використовуємо originalQuery для підсвічування
      const queryWords = originalQuery
        .split(" ")
        .filter((word) => word.length > 0);
      queryWords.forEach((word) => {
        try {
          const escapedWord = word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
          const regex = new RegExp(
            `(${escapedWord.replace(/\s+/g, "\\s+")})`,
            "gi"
          ); // Дозволяємо пробіли у "слові" для фраз
          descHtml = descHtml.replace(regex, `<span class="keyword">$1</span>`);
        } catch (e) {
          console.warn("Regex error for word:", word, e);
        }
      });
    }
    resultDesc.innerHTML = descHtml;

    resultItem.appendChild(resultTitle);
    resultItem.appendChild(resultUrl);
    resultItem.appendChild(resultDesc);
    resultsContent.appendChild(resultItem);
  });
}

searchBtn.addEventListener("click", () => performSearch(false));
luckyBtn.addEventListener("click", () => performSearch(true));
searchBox.addEventListener("keypress", function (e) {
  if (e.key === "Enter") {
    e.preventDefault();
    performSearch(false);
  }
});

// Функціонал кнопки "Назад"
backBtn.addEventListener("click", function () {
  // Повертаємо початковий вигляд інтерфейсу
  searchContainer.classList.remove("results-active");
  logo.classList.remove("results-active");
  searchBoxContainer.classList.remove("results-active");
  resultsContainer.style.display = "none";

  // Показуємо кнопки пошуку і приховуємо кнопку "Назад"
  searchButtonsContainer.style.display = "flex";
  backButtonContainer.style.display = "none";

  // Повертаємо початкову URL
  if (addressBarHostPathEl) {
    addressBarHostPathEl.textContent = `${BASE_URL.replace(
      /^https?:\/\//,
      ""
    )}`;
  }
});

// ---- Дані для навчальних модульів ----
const lessons = {
  intro: {
    title: "Ласкаво просимо до Шукарика!",
    content: `<p>Вітаємо у навчальній симуляції пошукової системи <strong>'Шукарик'</strong>! Тут ти навчишся легко і швидко знаходити цікаву інформацію в інтернеті.</p>
<p>У кожному модулі ми будемо пояснювати складні слова простими словами і наводити приклади з життя.</p>
<p><strong>Порада:</strong> Якщо бачиш незрозуміле слово — шукай підказку або запитуй у дорослих!</p>
<p>Оберіть модуль з випадаючого списку праворуч внизу та натисніть кнопку <strong>'Почати модуль'</strong>.</p>
<p>Або скористайся <strong>Навчальними завданнями</strong> — натисни на кнопку зі знаком питання (<strong>?</strong>) в лівому нижньому кутку екрана. Бажаємо успіхів у навчанні!</p>`,
  },
  addressBar: {
    title: "Модуль 1: Адресний рядок браузера",
    content: `<p><strong>Адресний рядок</strong> — це місце у верхній частині браузера, де написано адресу сайту. Це як адреса твого будинку, тільки для сайтів!</p>
<p><strong>Що таке URL?</strong> Це унікальна адреса сторінки в інтернеті. Наприклад: <code>https://www.pravda.com.ua</code></p>
<ul>
  <li><code>https://</code> — це <strong>протокол</strong>, тобто спосіб, яким комп'ютери "розмовляють" між собою. "s" означає, що з'єднання безпечне.</li>
  <li><code>www.pravda.com.ua</code> — це <strong>доменне ім'я</strong>, тобто ім'я сайту.</li>
  <li><code>/news/2024/05/06/example-article/</code> — це <strong>шлях</strong> до конкретної сторінки чи статті на сайті.</li>
</ul>
<p><strong>ВАЖЛИВО:</strong> Адресний рядок — це не пошуковий рядок! Якщо ти напишеш "рецепт борщу" в адресному рядку, браузер спробує знайти сайт з такою адресою, а не шукатиме рецепти. Для пошуку є спеціальний рядок (про нього — у наступному модулі).</p>
<p><em>Завдання:</em> Подивись на адресний рядок зараз. Яка адреса там написана? (Підказка: це адреса нашого "Шукарика"!)</p>`,
  },
  searchBox: {
    title: "Модуль 2: Пошуковий рядок",
    content: `<p><strong>Пошуковий рядок</strong> — це спеціальне поле, куди ти можеш ввести слова або питання, щоб знайти інформацію в інтернеті.</p>
<p><strong>Ключові слова</strong> — це головні слова твого питання. Наприклад, якщо ти хочеш дізнатися погоду, введи "погода Львів на завтра". Якщо шукаєш рецепт — "як приготувати піцу вдома". Якщо цікавить відома людина — "Тарас Шевченко біографія".</p>
<p>Після того, як ти написав свій запит і натиснув "Шукати" (або клавішу Enter), пошукова система шукає серед мільйонів сторінок і показує ті, які найкраще підходять до твого запиту.</p>
<p><strong>Порада:</strong> Не бійся ставити питання, навіть якщо вони здаються простими!</p>
<p><em>Завдання:</em> Спробуйте ввести в пошуковий рядок "Шукарика" запит "цікаві факти про котів" і натисніть "Шукати". Подивіться, що станеться. Зараз пошуковий рядок буде підсвічено.</p>`,
  },
  keywords: {
    title: "Модуль 3: Мистецтво ключових слів",
    content: `<p><strong>Ключові слова</strong> – це серце вашого пошукового запиту. Правильний вибір ключових слів значно підвищує шанси знайти саме те, що вам потрібно, і швидко!</p>
                          <p>Ось декілька порад, як формулювати ефективні запити:</p>
                          <ul>
                              <li><strong>Будьте конкретними:</strong> Замість просто "машина", спробуйте "купити червоний легковий автомобіль Київ". Чим більше деталей, тим точніший результат.
                                  <br><em>Приклад з життя:</em> Якщо ви шукаєте інформацію про конкретну породу собаки, краще написати "особливості догляду за лабрадором", а не просто "собаки".</li>
                              <li><strong>Використовуйте 2-4 ключових слова:</strong> Зазвичай цього достатньо. "Ремонт пральної машини Bosch Київ недорого" краще, ніж "ремонт".</li>
                              <li><strong>Подумайте, як би цю інформацію назвали інші:</strong> Які терміни використала б людина, яка створила сторінку з потрібною вам інформацією?
                                  <br><em>Приклад з життя:</em> Якщо у вас болить голова, ви можете шукати "причини головного болю", "як позбутися мігрені", "таблетки від голови".</li>
                              <li><strong>Не бійтеся використовувати запитання:</strong> "Скільки років тривала Друга світова війна?" або "Як видалити пляму від кави?".</li>
                              <li><strong>Додавайте уточнення:</strong> Якщо шукаєте щось локальне, додайте місто ("кав'ярні центр Львова"). Якщо потрібна свіжа інформація – рік ("новини технологій 2024").</li>
                          </ul>
                          <p><em>Завдання:</em> Уявіть, що ви хочете знайти рецепт вегетаріанської лазаньї, який підходить для початківців. Які ключові слова ви б використали? Спробуйте кілька варіантів у "Шукарику".</p>`,
  },
  luckyButton: {
    title: "Модуль 3.1: Кнопка 'Мені пощастить'",
    content: `<p>Кнопка <strong>"Мені пощастить"</strong> (в оригіналі "I'm Feeling Lucky") – це одна з найстаріших і найцікавіших функцій пошукових систем, зокрема Google.</p>
                          <p>Коли ви вводите запит у пошуковий рядок і замість кнопки "Шукати" натискаєте "Мені пощастить", пошукова система намагається <strong>пропустити сторінку з результатами пошуку</strong> і одразу перенаправити вас на ту веб-сторінку, яку вона вважає <strong>найпершим та найрелевантнішим</strong> результатом для вашого запиту.</p>
                          <p><strong>Коли це корисно?</strong></p>
                          <ul>
                              <li>Коли ви точно знаєте назву сайту, але не пам'ятаєте його точну адресу (наприклад, вводите "Facebook" і натискаєте "Мені пощастить").</li>
                              <li>Коли ви шукаєте дуже популярну і однозначну інформацію, де перший результат майже гарантовано буде правильним.</li>
                          </ul>
                          <p><strong>Приклад з життя:</strong> Ви хочете зайти на офіційний сайт ПриватБанку. Вводите в пошук "ПриватБанк" і тиснете "Мені пощастить". Є велика ймовірність, що ви одразу потрапите на потрібний сайт.</p>
                          <p>Однак, якщо ваш запит неоднозначний (наприклад, "цікаві факти"), результат може бути непередбачуваним, але часто веселим!</p>
                          <p><em>Завдання:</em> Введіть у пошуковий рядок "Шукарика" назву відомого сайту (наприклад, "Вікіпедія") і натисніть "Мені пощастить". Подивіться, що станеться (у нас це симуляція). Зараз кнопка "Мені пощастить" та поле пошуку будуть підсвічені.</p>`,
  },
  results: {
    title: "Модуль 4: Як аналізувати результати пошуку",
    content: `<p>Отже, ви ввели запит і отримали сторінку з результатами. Як зрозуміти, куди натискати?</p>
                          <p>Кожен результат пошуку (зазвичай їх 10 на сторінці) містить кілька важливих елементів:</p>
                          <ul>
                              <li><strong>Заголовок (Title):</strong> Це синій текст, який можна натиснути. Він дає загальне уявлення про зміст сторінки. Обирайте той, що найточніше відповідає вашому запиту.
                                  <br><em>Приклад:</em> Якщо шукали "як спекти яблучний пиріг", заголовок "Простий рецепт яблучного пирога з фото – Кулінарний блог" буде більш привабливим, ніж "Історія пирогів".</li>
                              <li><strong>URL-адреса (Веб-адреса):</strong> Зазвичай зеленого кольору, показує адресу сайту. Звертайте увагу на домен (наприклад, <code>.gov.ua</code> – державний сайт, <code>.edu.ua</code> – освітній, <code>wikipedia.org</code> – відома енциклопедія). Це допоможе оцінити надійність джерела.
                                  <br><em>Приклад:</em> Інформація про медичні симптоми з сайту Міністерства охорони здоров'я (<code>moz.gov.ua</code>) буде більш надійною, ніж з невідомого форуму.</li>
                              <li><strong>Опис (Snippet/Description):</strong> Короткий фрагмент тексту зі сторінки (зазвичай 1-2 речення), де часто підсвічуються ваші <span class="keyword">ключові слова</span>. Швидко прочитайте його, щоб зрозуміти, чи є на сторінці потрібна інформація.</li>
                          </ul>
                          <p><strong>Поради щодо вибору:</strong></p>
                          <ul>
                              <li>Не завжди перший результат є найкращим. Перегляньте кілька.</li>
                              <li>Остерігайтеся сайтів з великою кількістю реклами або підозрілими заголовками ("ШОК! Ви не повірите...").</li>
                              <li>Для важливої інформації (здоров'я, фінанси, наука) шукайте офіційні, авторитетні джерела.</li>
                          </ul>
                          <p><em>Завдання:</em> Зробіть пошук за запитом "користь зеленого чаю". Проаналізуйте перші 3-4 результати: їхні заголовки, URL та описи. Який з них ви б обрали і чому?</p>`,
  },
  classicSearch: {
    // НОВИЙ УРОК
    title: "Модуль 4.1: Класичний пошук – основа основ",
    content: `<p>Незважаючи на стрімкий розвиток технологій штучного інтелекту, <strong>класичні пошукові системи</strong> (такі як традиційний Google, DuckDuckGo, Brave Search та інші) залишаються фундаментальним інструментом для навігації в безмежному просторі Інтернету. Розуміння їхньої ролі та принципів роботи допоможе вам ефективніше знаходити потрібну інформацію.</p>

                          <h3>Як працює класичний пошук?</h3>
                          <p>В основі класичного пошуку лежать три ключові процеси:</p>
                          <ol>
                              <li><strong>Сканування (Crawling):</strong> Пошукові роботи (або "павуки") постійно обходять веб-сторінки в Інтернеті, переходячи за посиланнями.</li>
                              <li><strong>Індексація (Indexing):</strong> Знайдена інформація аналізується, систематизується та зберігається у величезних базах даних – індексах. Сторінки індексуються на основі їхнього контенту, ключових слів, метаданих тощо.</li>
                              <li><strong>Ранжування (Ranking):</strong> Коли ви вводите пошуковий запит, система аналізує його та, за допомогою складних алгоритмів, визначає, які сторінки з індексу найкраще відповідають вашому запиту та в якому порядку їх відобразити. Алгоритми враховують сотні факторів, включно з релевантністю ключових слів, авторитетністю сайту (наприклад, кількість та якість посилань на нього – концепція, подібна до PageRank), свіжістю контенту, зручністю для користувача та багатьма іншими.</li>
                          </ol>

                          <h3>Сильні сторони класичного пошуку:</h3>
                          <ul>
                              <li><strong>Величезний обсяг інформації:</strong> Доступ до мільярдів проіндексованих веб-сторінок.</li>
                              <li><strong>Швидкість для конкретних запитів:</strong> Дуже ефективний, коли ви шукаєте конкретний сайт, факт, документ або чітко сформульовану інформацію.</li>
                              <li><strong>Прямі посилання на джерела:</strong> Надає список посилань на оригінальні сторінки, дозволяючи вам самостійно оцінити інформацію та її контекст.</li>
                              <li><strong>Відносна прозорість:</strong> Хоча алгоритми є комерційною таємницею, основні принципи ранжування загалом відомі.</li>
                              <li><strong>Контроль користувача:</strong> Ви самі обираєте, на які посилання переходити та яким джерелам довіряти.</li>
                          </ul>

                          <h3>Обмеження та виклики:</h3>
                          <ul>
                              <li><strong>Залежність від ключових слів:</strong> Результати значною мірою залежать від того, наскільки точно ви сформулювали запит за допомогою ключових слів.</li>
                              <li><strong>Обробка природної мови:</strong> Може мати труднощі з розумінням складних, розмовних або неоднозначних запитів.</li>
                              <li><strong>Перевантаженість результатів:</strong> Іноді сторінка результатів може містити багато реклами або SEO-оптимізованих сторінок, які не завжди є найкориснішими.</li>
                              <li><strong>"Бульбашка фільтрів":</strong> Персоналізація результатів може призвести до того, що ви бачитимете переважно інформацію, яка підтверджує ваші існуючі погляди.</li>
                          </ul>

                          <h3>Роль класичного пошуку сьогодні (травень 2025):</h3>
                          <p>Навіть з появою ШІ-пошуку, класичні системи є незамінними для:</p>
                          <ul>
                              <li>Швидкого пошуку офіційних сайтів, конкретних документів, новинних статей.</li>
                              <li>Доступу до широкого спектру думок та першоджерел.</li>
                              <li>Перевірки фактів та інформації, наданої іншими системами (включно з ШІ).</li>
                              <li>Досліджень, де важливий контроль над вибором джерел та глибоке занурення в тему.</li>
                          </ul>
                          <p>Вміння ефективно користуватися як класичним, так і ШІ-пошуком – ключова навичка сучасної цифрової грамотності.</p>

                          <p><em>Завдання:</em> Спробуйте знайти інформацію про історію вашого міста, використовуючи спочатку дуже загальний запит (наприклад, "історія [назва міста]"), а потім більш конкретні запити з датами або ключовими подіями. Зверніть увагу, як змінюється якість та релевантність результатів у класичному пошуку "Шукарика".</p>`,
  },
  aiSearch: {
    // НОВИЙ УРОК
    title: "Модуль 5: ШІ-пошук – нова ера знаходження інформації",
    content: `<p>Ласкаво просимо у світ <strong>ШІ-пошуку</strong>! Це технологія, яка змінює наш підхід до пошуку інформації в інтернеті, використовуючи можливості штучного інтелекту.</p>

                          <h3>Що таке ШІ-пошук?</h3>
                          <p><strong>ШІ-пошук (AI Search)</strong> – це тип пошукової системи, яка використовує штучний інтелект, зокрема великі мовні моделі (LLM), для розуміння ваших запитів та надання відповідей. Замість простого списку посилань, ШІ-пошук часто намагається дати пряму, узагальнену відповідь на ваше запитання, зібрану з кількох джерел, іноді з можливістю діалогу.</p>

                          <h3>Чим ШІ-пошук відрізняється від класичного?</h3>
                          <ul>
                              <li><strong>Розуміння природної мови:</strong> ШІ краще розуміє складні, розмовні запити, а не лише ключові слова. Ви можете ставити запитання так, ніби спілкуєтеся з людиною.</li>
                              <li><strong>Генерація відповідей:</strong> ШІ-системи можуть генерувати текстові відповіді, узагальнюючи інформацію з різних веб-сторінок. Класичний пошук переважно дає посилання на ці сторінки.</li>
                              <li><strong>Контекст та діалог:</strong> Деякі ШІ-пошуковики можуть підтримувати діалог, уточнюючи ваш запит або відповідаючи на наступні запитання в контексті попередніх.</li>
                              <li><strong>Мультимодальність:</strong> Сучасні ШІ-системи можуть обробляти та генерувати не лише текст, а й зображення, аудіо та відео.</li>
                          </ul>
                          <p><em>Станом на травень 2025 року, яскравими прикладами є розширені можливості Google Search (з інтегрованими AI Overviews), Copilot від Microsoft Bing, Perplexity AI, You.com та інші спеціалізовані ШІ-асистенти.</em></p>

                          <h3>Переваги ШІ-пошуку:</h3>
                          <ul>
                              <li><strong>Швидкі комплексні відповіді:</strong> Можливість отримати узагальнену відповідь на складне питання одразу, без переходу по багатьох посиланнях.</li>
                              <li><strong>Ефективність для навчання та творчості:</strong> Може допомогти згенерувати ідеї, написати чернетку тексту, скласти план, пояснити складні концепції.</li>
                              <li><strong>Інтерактивність:</strong> Можливість вести діалог, уточнювати та розвивати тему пошуку.</li>
                          </ul>

                          <h3>Виклики та недоліки ШІ-пошуку:</h3>
                          <ul>
                              <li><strong>"Галюцинації" та точність:</strong> Іноді ШІ може генерувати неправдиву, неточну або вигадану інформацію, подаючи її як факт. Це вимагає ретельної перевірки.</li>
                              <li><strong>Прозорість джерел:</strong> Не завжди легко відстежити та перевірити джерела, на основі яких ШІ згенерував відповідь, хоча багато систем намагаються їх надавати.</li>
                              <li><strong>Упередженість (Bias):</strong> Відповіді ШІ можуть відображати упередження, наявні в даних, на яких він навчався.</li>
                              <li><strong>Актуальність:</strong> Інформація може бути не найсвіжішою, якщо знання моделі ШІ обмежені певною датою оновлення.</li>
                              <li><strong>"Чорна скринька":</strong> Механізми формування деяких відповідей ШІ можуть бути неочевидними для користувача.</li>
                          </ul>

                          <h3>Як ефективно та відповідально користуватися ШІ-пошуком?</h3>
                          <ol>
                              <li><strong>Формулюйте чіткі та детальні запити:</strong> Надавайте достатньо контексту, щоб ШІ краще зрозумів ваше завдання.</li>
                              <li><strong>Будьте критичними та перевіряйте:</strong> Завжди перевіряйте важливу інформацію, отриману від ШІ, за допомогою надійних джерел (включно з класичним пошуком!). Особливо це стосується фактів, медичних, фінансових та юридичних порад.</li>
                              <li><strong>Вивчайте джерела:</strong> Якщо ШІ-пошуковик надає посилання на джерела, перегляньте їх для підтвердження інформації.</li>
                              <li><strong>Використовуйте як інструмент, а не як абсолютну істину:</strong> ШІ-пошук – потужний помічник для натхнення, узагальнення та початкового дослідження, але не замінює власне критичне мислення.</li>
                              <li><strong>Комбінуйте з класичним пошуком:</strong> Використовуйте сильні сторони обох типів пошуку для досягнення найкращих результатів.</li>
                          </ol>

                          <p><em>Завдання:</em> Уявіть, що вам потрібно написати коротке есе про вплив зміни клімату на сільське господарство в Україні. Сформулюйте запит для ШІ-пошуку, який допоможе вам зібрати основні тези та структуру роботи. Потім подумайте, які запити ви б використали в класичному пошуку для знаходження конкретних статистичних даних або наукових звітів на цю тему.</p>`,
  },
};

startLessonBtn.addEventListener("click", function () {
  const lessonType = lessonSelect.value;
  const lesson = lessons[lessonType];
  if (!lesson) {
    // Якщо модуль не знайдено, можна показати стандартне повідомлення
    modalTitle.textContent = "Модуль не знайдено";
    modalBody.innerHTML =
      "<p>На жаль, обраний модуль наразі недоступний. Будь ласка, спробуйте інший.</p>";
    lessonModal.style.display = "flex";
    lessonModal.setAttribute("aria-hidden", "false");
    lessonModal.focus();
    setTimeout(() => {
      if (closeModalBtn && typeof closeModalBtn.focus === "function") {
        closeModalBtn.focus();
      }
    }, 0);
    return;
  }

  modalTitle.textContent = lesson.title;
  modalBody.innerHTML = lesson.content;
  lessonModal.style.display = "flex";
  lessonModal.setAttribute("aria-hidden", "false");

  lessonModal.focus();
  setTimeout(() => {
    if (closeModalBtn && typeof closeModalBtn.focus === "function") {
      closeModalBtn.focus();
    }
  }, 0);

  document
    .querySelectorAll(".highlight-area")
    .forEach((area) => (area.style.display = "none"));

  if (lessonType === "addressBar") {
    highlightElement("addressBar", "addressBarHighlight");
  } else if (lessonType === "searchBox" || lessonType === "keywords") {
    highlightElement("searchBox", "searchBoxHighlight");
  } else if (lessonType === "luckyButton") {
    highlightElement("searchBox", "searchBoxHighlight");
    highlightElement("luckyBtn", "luckyBtnHighlight");
  }
  // Для нових модульів 'classicSearch' та 'aiSearch' підсвічування поки не додаємо,
  // оскільки вони теоретичні. Можна додати, якщо є конкретні елементи для підсвітки.
});

// ---- Функція підсвічування елементів інтерфейсу ----
function highlightElement(elementId, highlightId) {
  const element = document.getElementById(elementId);
  const highlight = document.getElementById(highlightId);

  if (element && highlight) {
    const rect = element.getBoundingClientRect();
    highlight.style.top = rect.top + window.scrollY + "px";
    highlight.style.left = rect.left + window.scrollX + "px";
    highlight.style.width = rect.width + "px";
    highlight.style.height = rect.height + "px";
    highlight.style.display = "block";
  }
}

// ---- Закриття модального вікна ----
function closeModal() {
  lessonModal.style.display = "none";
  lessonModal.setAttribute("aria-hidden", "true");
  document
    .querySelectorAll(".highlight-area")
    .forEach((area) => (area.style.display = "none"));
  if (startLessonBtn && typeof startLessonBtn.focus === "function") {
    startLessonBtn.focus();
  }
}

modalBtn.addEventListener("click", closeModal);
closeModalBtn.addEventListener("click", closeModal);
closeModalBtn.addEventListener("keydown", (e) => {
  if (e.key === "Enter" || e.key === " ") {
    e.preventDefault();
    closeModal();
  }
});

window.addEventListener("click", function (event) {
  if (event.target === lessonModal) closeModal();
});

window.addEventListener("keydown", function (event) {
  if (event.key === "Escape") {
    if (lessonModal.style.display === "flex") {
      closeModal();
    }
    if (helpPanel.classList.contains("visible")) {
      helpPanel.classList.remove("visible");
      helpToggle.setAttribute("aria-expanded", "false");
      if (helpToggle && typeof helpToggle.focus === "function") {
        helpToggle.focus();
      }
    }
  }
});

helpToggle.addEventListener("click", function () {
  const isVisible = helpPanel.classList.toggle("visible");
  helpToggle.setAttribute("aria-expanded", isVisible.toString());
  if (isVisible) {
    helpPanel.focus();
  } else {
    if (helpToggle && typeof helpToggle.focus === "function") {
      helpToggle.focus();
    }
  }
});

lessonSelect.value = "intro";
