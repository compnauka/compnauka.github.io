import { createEmbeddedToolBridge } from "../shared/tool-bridge.js";

const goalSelect = document.getElementById("search-goal");
const querySelect = document.getElementById("search-query");
const goalText = document.getElementById("goal-text");
const goalHint = document.getElementById("goal-hint");
const resultsList = document.getElementById("results-list");
const previewChoice = document.getElementById("preview-choice");
const resetButton = document.getElementById("reset-search");
const finishButton = document.getElementById("finish-search");
const status = document.getElementById("studio-status");
const notifyLessonCompleted = createEmbeddedToolBridge("search-studio");

const searchSets = {
  lion: {
    goal: "Знайти зображення лева.",
    correctQuery: "лев",
    correctId: "lion-image",
    results: [
      { id: "lion-image", type: "Зображення", title: "Лев у савані", text: "Велике фото лева для уроку про тварин." },
      { id: "lion-cake", type: "Рецепт", title: "Торт левеня", text: "Святковий десерт із фігуркою тварини." },
      { id: "lion-story", type: "Казка", title: "Лев і мишка", text: "Текст для читання, а не картинка." }
    ]
  },
  weather: {
    goal: "Дізнатися погоду.",
    correctQuery: "погода",
    correctId: "weather-today",
    results: [
      { id: "weather-today", type: "Погода", title: "Сьогодні: сонячно, +18", text: "Короткий прогноз на день." },
      { id: "weather-drawing", type: "Малюнок", title: "Хмаринка з олівців", text: "Картинка для розмальовки." },
      { id: "weather-song", type: "Пісня", title: "Пісенька про дощик", text: "Весела музика про погоду." }
    ]
  },
  schedule: {
    goal: "Знайти розклад гуртка.",
    correctQuery: "розклад гуртка",
    correctId: "schedule-club",
    results: [
      { id: "schedule-club", type: "Розклад", title: "Гурток малювання: вівторок, 15:00", text: "Час і день заняття." },
      { id: "schedule-poster", type: "Афіша", title: "Запрошуємо на свято класу", text: "Оголошення про подію, не розклад." },
      { id: "schedule-paints", type: "Список", title: "Фарби, пензлі, альбом", text: "Речі для заняття, але не час." }
    ]
  }
};

const defaults = {
  goal: "lion",
  query: "лев"
};

let selectedResultId = "";

function renderResults() {
  const currentSet = searchSets[goalSelect.value];
  resultsList.innerHTML = "";

  currentSet.results.forEach((result) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "result-card";
    button.dataset.resultId = result.id;
    button.innerHTML = `
      <span class="result-card__type">${result.type}</span>
      <div class="result-card__title">${result.title}</div>
      <p class="result-card__text">${result.text}</p>
    `;

    if (result.id === selectedResultId) {
      button.classList.add("is-selected");
    }

    button.addEventListener("click", () => {
      selectedResultId = result.id;
      previewChoice.textContent = `${result.type}: ${result.title}`;
      status.textContent = "Результат обрано. Тепер перевір, чи він відповідає меті.";
      renderResults();
    });

    resultsList.appendChild(button);
  });
}

function syncScene() {
  const currentSet = searchSets[goalSelect.value];
  const queryMatches = querySelect.value === currentSet.correctQuery;

  goalText.textContent = currentSet.goal;
  goalHint.textContent = queryMatches
    ? "Запит підходить до мети. Тепер уважно обери правильний результат."
    : "Схоже, запит поки не дуже підходить. Спробуй коротше й точніше.";

  if (!currentSet.results.some((result) => result.id === selectedResultId)) {
    selectedResultId = "";
    previewChoice.textContent = "Поки що нічого не вибрано.";
  }

  renderResults();
}

function resetStudio() {
  goalSelect.value = defaults.goal;
  querySelect.value = defaults.query;
  selectedResultId = "";
  previewChoice.textContent = "Поки що нічого не вибрано.";
  status.textContent = "Почни з мети, короткого запиту й уважного вибору.";
  syncScene();
}

function finishPractice() {
  const currentSet = searchSets[goalSelect.value];

  if (querySelect.value !== currentSet.correctQuery) {
    status.textContent = "Спершу підбери запит, який справді підходить до мети.";
    querySelect.focus();
    return;
  }

  if (selectedResultId !== currentSet.correctId) {
    status.textContent = "Зараз обраний результат не зовсім підходить. Переглянь картки ще раз.";
    return;
  }

  const selectedCard = resultsList.querySelector(`[data-result-id="${selectedResultId}"]`);
  if (selectedCard) {
    selectedCard.classList.add("is-correct");
  }

  notifyLessonCompleted();
  status.textContent = "Готово. Ти склав(-ла) влучний запит і вибрав(-ла) правильний результат.";
}

goalSelect.addEventListener("change", syncScene);
querySelect.addEventListener("change", syncScene);
resetButton.addEventListener("click", resetStudio);
finishButton.addEventListener("click", finishPractice);

syncScene();
