document.addEventListener("DOMContentLoaded", () => {
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function smoothBehavior() {
    return prefersReducedMotion ? "auto" : "smooth";
  }

  function normalizeQuery(raw) {
    return raw
      .toLowerCase()
      .trim()
      .replace(/[’`]/g, "'")
      .replace(/ґ/g, "г")
      .replace(/\s+/g, " ");
  }

  /* --- БАЗА ДАНИХ ПОШУКУ --- */
  const searchDatabase = [
    {
      keys: ["київ", "столиця", "kyiv"],
      results: [
        {
          title: "Київ - Вікіпедія",
          url: "uk.wikipedia.org/wiki/Київ",
          description: "Київ - столиця України.",
          quality: "good",
          reason: "Вікіпедія - гарне джерело для загальних фактів. Перевір іще 1-2 джерела."
        },
        {
          title: "Динозаври в Києві!",
          url: "fake-news-ufo.com",
          description: "Шок! Динозавра помітили біля метро!",
          quality: "bad",
          reason: "Це вигадана новина (фейк) для привернення уваги."
        }
      ]
    },
    {
      keys: ["гра", "ігри", "ігр", "гта", "gta", "майнкрафт", "minecraft", "роблокс", "roblox"],
      results: [
        {
          title: "Steam: Ігри",
          url: "store.steampowered.com",
          description: "Офіційний магазин ігор.",
          quality: "good",
          reason: "Це офіційний магазин. Але все одно читай відгуки і перевіряй джерело."
        },
        {
          title: "Завантажити безкоштовно без реєстрації",
          url: "hacker-soft-free.net",
          description: "Всі нові ігри безкоштовно!",
          quality: "bad",
          reason: "Такі сайти часто містять віруси або крадуть дані."
        }
      ]
    },
    {
      keys: ["космос", "планети", "зірки", "наса", "nasa"],
      results: [
        {
          title: "NASA Space Place",
          url: "spaceplace.nasa.gov",
          description: "Сайт для дітей про космос.",
          quality: "good",
          reason: "Офіційний сайт від NASA (.gov) для навчання."
        }
      ]
    },
    {
      keys: ["айфон", "iphone", "телефон", "смартфон"],
      results: [
        {
          title: "Apple Україна",
          url: "www.apple.com/ua",
          description: "Офіційний сайт Apple.",
          quality: "good",
          reason: "Це офіційний сайт виробника."
        },
        {
          title: "Виграй iPhone 15 прямо зараз!",
          url: "lucky-winner-2025.xyz",
          description: "Ти став 1000-м відвідувачем! Забирай приз!",
          quality: "bad",
          reason: "Це шахрайство. Дорогу техніку просто так не роздають."
        }
      ]
    },
    {
      keys: ["безпека", "безпек", "кіберполіція", "поліція", "шахрайство"],
      results: [
        {
          title: "Кіберполіція України",
          url: "cyberpolice.gov.ua",
          description: "Правила безпеки в інтернеті.",
          quality: "good",
          reason: "Офіційний сайт урядової установи (.gov.ua)."
        }
      ]
    },
    {
      keys: ["default"],
      results: [
        {
          title: "Кіберполіція України",
          url: "cyberpolice.gov.ua",
          description: "Поради з цифрової безпеки для дітей і батьків.",
          quality: "good",
          reason: "Офіційне джерело. Перевіряй, хто автор і коли оновлено."
        },
        {
          title: "Як стати багатим за 5 хвилин",
          url: "easy-money-click.com",
          description: "Натисни сюди і стань мільйонером!",
          quality: "bad",
          reason: "Це клікбейт і маніпуляція."
        }
      ]
    }
  ];

  /* --- СЦЕНАРІЇ ГРИ --- */
  const gameScenarios = [
    {
      scenario: "Треба підготувати коротку доповідь про бджіл.",
      source: "Сайт National Geographic Kids або шкільна енциклопедія.",
      correctAnswer: "good",
      explanation: "Наукові джерела перевіряють факти перед публікацією."
    },
    {
      scenario: "📱 У TikTok пишуть: 'Натисни сюди і виграй мільйон за 30 секунд!' 🤑",
      source: "Коментар незнайомця без посилань.",
      correctAnswer: "bad",
      explanation: "Це клікбейт. Гроші за один клік - типова пастка."
    },
    {
      scenario: "Прийшло повідомлення: 'Твій Instagram заблоковано, введи пароль'.",
      source: "Посилання веде на security-support-123.com.",
      correctAnswer: "bad",
      explanation: "Це фішинг. Пароль на підозрілому сайті вводити не можна."
    },
    {
      scenario: "Хочеш дізнатися, чи корисні щеплення.",
      source: "Сайт МОЗ України (moz.gov.ua).",
      correctAnswer: "good",
      explanation: "Медичну інформацію краще брати з офіційних або наукових джерел."
    },
    {
      scenario: "Сайт пропонує платну гру безкоштовно без реєстрації.",
      source: "Super-Free-Games.xyz.",
      correctAnswer: "bad",
      explanation: "Такі сайти часто поширюють шкідливі файли."
    },
    {
      scenario: "Потрібен рецепт пирога на вихідні.",
      source: "Кулінарний сайт з фото кроків і відгуками.",
      correctAnswer: "good",
      explanation: "Для хобі і рецептів таке джерело може бути нормальним."
    },
    {
      scenario: "Новина: 'Шоколад допомагає схуднути на 10 кг за день'.",
      source: "Сайт із блимаючою рекламою 'чарівних засобів'.",
      correctAnswer: "bad",
      explanation: "Занадто гучна обіцянка - ознака маніпуляції."
    },
    {
      scenario: "Ти не впевнений, чи сайт безпечний.",
      source: "Сайт просить номер телефону та домашню адресу.",
      correctAnswer: "bad",
      explanation: "Золоте правило: одразу поклич дорослого."
    }
  ];

  /* --- ЗМІННІ СТАНУ --- */
  let currentScenarioIndex = 0;
  let score = 0;
  let currentQuestions = [];
  const btnShowCert = document.getElementById("btn-show-cert");

  function shuffle(array) {
    const arrCopy = [...array];
    for (let i = arrCopy.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [arrCopy[i], arrCopy[j]] = [arrCopy[j], arrCopy[i]];
    }
    return arrCopy;
  }

  function performSearch() {
    const input = document.getElementById("search-input");
    const query = normalizeQuery(input.value);
    const container = document.getElementById("search-results");
    const errorMsg = document.getElementById("search-error");

    if (!query) {
      errorMsg.style.display = "block";
      container.style.display = "none";
      return;
    }

    errorMsg.style.display = "none";
    let data = null;

    for (const topic of searchDatabase) {
      if (topic.keys.includes("default")) {
        continue;
      }
      if (topic.keys.some((key) => query.includes(key))) {
        data = topic.results;
        break;
      }
    }

    if (!data) {
      data = searchDatabase.find((topic) => topic.keys.includes("default")).results;
    }

    container.innerHTML = "";
    container.style.display = "block";

    data.forEach((item) => {
      const div = document.createElement("div");
      div.className = "result-item";
      const badge =
        item.quality === "good"
          ? '<span class="quality-badge good-source">✅ Надійне джерело</span>'
          : '<span class="quality-badge bad-source">❌ Підозріле джерело</span>';

      div.innerHTML = `
        <div class="result-title" role="link">${item.title}</div>
        <div class="result-url">${item.url}</div>
        <div class="result-description">${item.description}</div>
        ${badge}
        <div style="margin-top: 8px; font-size: 0.9rem; color: #555;"><em>💡 ${item.reason}</em></div>
      `;
      container.appendChild(div);
    });

    container.scrollIntoView({ behavior: smoothBehavior(), block: "start" });
  }

  function updateScoreDisplay() {
    document.getElementById("game-score").innerText = `Бали: ${score}`;
  }

  function enableAnswerButtons() {
    document.getElementById("btn-good").disabled = false;
    document.getElementById("btn-bad").disabled = false;
  }

  function disableAnswerButtons() {
    document.getElementById("btn-good").disabled = true;
    document.getElementById("btn-bad").disabled = true;
  }

  function startGame() {
    score = 0;
    currentScenarioIndex = 0;
    currentQuestions = shuffle(gameScenarios).slice(0, 5);

    updateScoreDisplay();
    document.getElementById("game-feedback").style.display = "none";

    document.getElementById("btn-start-game").style.display = "none";
    document.getElementById("btn-good").style.display = "inline-block";
    document.getElementById("btn-bad").style.display = "inline-block";
    document.getElementById("btn-next").style.display = "none";
    btnShowCert.style.display = "none";

    enableAnswerButtons();
    showScenario();
  }

  function showScenario() {
    if (currentScenarioIndex >= currentQuestions.length) {
      finishGame();
      return;
    }

    const q = currentQuestions[currentScenarioIndex];
    document.getElementById("scenario-display").innerHTML = `
      <p><strong>Питання ${currentScenarioIndex + 1} з ${currentQuestions.length}</strong></p>
      <p>${q.scenario}</p>
      <div class="source-box"><strong>Джерело:</strong> ${q.source}</div>
    `;

    document.getElementById("game-area").scrollIntoView({ behavior: smoothBehavior(), block: "center" });
  }

  function answerGame(ans) {
    const q = currentQuestions[currentScenarioIndex];
    const feedback = document.getElementById("game-feedback");
    const btnNext = document.getElementById("btn-next");

    feedback.style.display = "block";
    disableAnswerButtons();

    if (ans === q.correctAnswer) {
      score += 20;
      feedback.className = "feedback feedback-correct";
      feedback.innerHTML = `✅ Правильно!<br><small>${q.explanation}</small>`;
    } else {
      feedback.className = "feedback feedback-wrong";
      feedback.innerHTML = `❌ На жаль, помилка.<br><small>${q.explanation}</small>`;
    }

    updateScoreDisplay();

    if (currentScenarioIndex < currentQuestions.length - 1) {
      btnNext.style.display = "inline-flex";
      btnNext.focus();
    } else {
      setTimeout(finishGame, 3500);
    }
  }

  function nextQuestion() {
    currentScenarioIndex += 1;
    document.getElementById("game-feedback").style.display = "none";
    document.getElementById("btn-next").style.display = "none";

    enableAnswerButtons();
    showScenario();
  }

  function finishGame() {
    document.getElementById("scenario-display").innerHTML = `
      <h3>Гра завершена! 🎉</h3>
      <p>Твій рахунок: <strong>${score} з 100</strong></p>
    `;
    document.getElementById("btn-good").style.display = "none";
    document.getElementById("btn-bad").style.display = "none";
    document.getElementById("btn-next").style.display = "none";
    document.getElementById("game-feedback").style.display = "none";

    const btnStart = document.getElementById("btn-start-game");
    btnStart.style.display = "inline-block";

    if (score >= 80) {
      btnStart.innerText = "Грати знову";
      btnShowCert.style.display = "inline-block";
      setTimeout(openModal, 800);
    } else {
      btnStart.innerText = "Спробувати ще раз (Треба 80 балів)";
      btnShowCert.style.display = "none";
    }
  }

  function openModal() {
    const modal = document.getElementById("certificate-modal");
    modal.style.display = "flex";
    setTimeout(() => modal.classList.add("show"), 10);
    const closeBtn = document.getElementById("close-modal");
    if (closeBtn) {
      closeBtn.focus();
    }
  }

  function closeModal() {
    const modal = document.getElementById("certificate-modal");
    modal.classList.remove("show");
    setTimeout(() => {
      modal.style.display = "none";
    }, 300);
  }

  document.getElementById("btn-search").addEventListener("click", performSearch);
  document.getElementById("search-input").addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      performSearch();
    }
  });

  document.getElementById("btn-start-game").addEventListener("click", startGame);
  document.getElementById("btn-good").addEventListener("click", () => answerGame("good"));
  document.getElementById("btn-bad").addEventListener("click", () => answerGame("bad"));
  document.getElementById("btn-next").addEventListener("click", nextQuestion);
  btnShowCert.addEventListener("click", openModal);

  const closeBtn = document.getElementById("close-modal");
  closeBtn.addEventListener("click", closeModal);
  closeBtn.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      closeModal();
    }
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      const modal = document.getElementById("certificate-modal");
      if (modal.classList.contains("show") || modal.style.display === "flex") {
        closeModal();
      }
    }
  });

  window.addEventListener("click", (e) => {
    const modal = document.getElementById("certificate-modal");
    if (e.target === modal) {
      closeModal();
    }
  });

  document.getElementById("btn-generate-cert").addEventListener("click", () => {
    const nameInput = document.getElementById("player-name");
    const name = nameInput.value.trim();

    if (!name) {
      nameInput.style.borderColor = "#e53e3e";
      return;
    }

    nameInput.style.borderColor = "#cbd5e0";
    document.getElementById("cert-name-display").innerText = name;
    document.getElementById("cert-date").innerText = new Date().toLocaleDateString("uk-UA");

    document.getElementById("final-cert").style.display = "block";
    nameInput.style.display = "none";
    document.getElementById("btn-generate-cert").style.display = "none";
    document.querySelector(".certificate > p:nth-of-type(2)").style.display = "none";
  });

  document.getElementById("btn-print").addEventListener("click", () => window.print());
});
