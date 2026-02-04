// js/app.js
import { bookSections } from "./bookSections.js";

// Configuration
const sectionKeys = Object.keys(bookSections);
let currentSectionIndex = 0;

// DOM Elements
const chatWindow = document.getElementById("chatWindow");
const navContainer = document.getElementById("navContainer");
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
const pageIndicator = document.getElementById("pageIndicator");
const totalPages = document.getElementById("totalPages");
const menuBtn = document.getElementById("menuBtn");
const closeMenuBtn = document.getElementById("closeMenuBtn");
const sidebar = document.getElementById("sidebar");
const overlay = document.getElementById("overlay");
const bottomNav = document.getElementById("bottomNav");

// Масив для зберігання ID усіх таймерів, які показують повідомлення
let messageTimers = [];

// Скасувати всі відкладені покази повідомлень (коли переходимо між розділами)
function clearMessageTimers() {
  messageTimers.forEach(id => clearTimeout(id));
  messageTimers = [];
}


totalPages.textContent = sectionKeys.length.toString();

// ---------- LOCAL STORAGE LOGIC ----------
function saveProgress() {
  localStorage.setItem("aiBookProgress", currentSectionIndex);
}

function loadProgress() {
  const saved = localStorage.getItem("aiBookProgress");
  if (saved !== null) {
    const index = parseInt(saved, 10);
    if (index >= 0 && index < sectionKeys.length) {
      loadSection(index);
      return;
    }
  }
  loadSection(0);
}

// ---------- NAV RENDER ----------
function renderNav() {
  navContainer.innerHTML = "";
  sectionKeys.forEach((key, index) => {
    const btn = document.createElement("button");
    btn.className =
      "w-full text-left px-4 py-3.5 rounded-xl transition-all duration-200 text-sm font-bold flex items-center justify-between group border " +
      (index === currentSectionIndex
        ? "bg-indigo-50 text-indigo-800 border-indigo-200 shadow-sm"
        : "text-slate-600 border-transparent hover:bg-slate-100 hover:text-slate-900");

    btn.innerHTML = `
      <span>${bookSections[key].title}</span>
      ${index === currentSectionIndex
        ? '<div class="w-2.5 h-2.5 rounded-full bg-indigo-600"></div>'
        : ""
      }
    `;

    btn.onclick = () => {
      loadSection(index);
      closeMenu();
    };

    navContainer.appendChild(btn);
  });
}

// ---------- SECTION / CHAT RENDER ----------
function loadSection(index) {
  // 1. Спочатку скасовуємо всі старі таймери,
  // щоб попередній розділ не домальовувався
  clearMessageTimers();

  currentSectionIndex = index;
  // Зберегти прогрес при кожному переході
  saveProgress();

  const sectionKey = sectionKeys[index];
  const data = bookSections[sectionKey];

  // 2. Показ / приховування нижньої навігації:
  //    ховаємо на Обкладинці (index === 0), показуємо в інших розділах
  if (index === 0) {
    bottomNav.classList.add('translate-y-full'); // Hide
    bottomNav.classList.remove('translate-y-0');
  } else {
    bottomNav.classList.remove('translate-y-full'); // Show
    bottomNav.classList.add('translate-y-0');
  }

  // 3. Оновлення стану кнопок і індикатора сторінки
  pageIndicator.textContent = index + 1;
  // Назад вимкнено на Обкладинці (0) і Вступі (1)
  prevBtn.disabled = index <= 1;
  nextBtn.disabled = index === sectionKeys.length - 1;

  // 4. Очистити чат перед рендером нового розділу
  chatWindow.innerHTML = '';
  chatWindow.scrollTop = 0;

  // 5. Перемалювати навігацію з активним розділом
  renderNav();

  // 6. Заголовок розділу (крім Обкладинки)
  if (index !== 0) {
    const titleDiv = document.createElement('div');
    titleDiv.className = "text-center py-6 mb-6 border-b-2 border-dashed border-slate-200";
    titleDiv.innerHTML = `<h2 class="text-2xl font-extrabold text-slate-800 tracking-tight">${data.title}</h2>`;
    chatWindow.appendChild(titleDiv);
  }

  // 7. Плавне «виписування» повідомлень з затримкою
  let delay = 100;

  // Стандартні повідомлення
  data.messages.forEach((msg) => {
    const timerId = setTimeout(() => {
      appendMessage(msg);
    }, delay);

    // зберігаємо ID таймера, щоб потім можна було його скасувати
    messageTimers.push(timerId);

    delay += 300;
  });

  // 8. Випадковий квіз наприкінці, якщо є
  if (data.quizzes && data.quizzes.length > 0) {
    const randomQuiz = data.quizzes[Math.floor(Math.random() * data.quizzes.length)];

    const quizTimerId = setTimeout(() => {
      appendMessage({ type: 'quiz', content: randomQuiz });
    }, delay + 200);

    // теж зберігаємо ID
    messageTimers.push(quizTimerId);
  }
}


function appendMessage(msg) {
  // COVER
  if (msg.type === "cover") {
    const coverWrapper = document.createElement("div");
    coverWrapper.className =
      "flex flex-col items-center justify-start min-h-0 text-center px-4 py-6 md:py-8 fade-in";

    coverWrapper.innerHTML = `
      <div class="mb-4 md:mb-6 relative group max-w-md md:max-w-2xl w-full">
        <div class="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
        <img src="${msg.image}"
             alt="Обкладинка"
             class="relative rounded-xl shadow-2xl w-full h-auto object-contain border-4 border-white transform transition duration-500 hover:scale-105">
      </div>

      ${msg.content}

      <button
        id="coverStartBtn"
        class="mt-4 md:mt-6 px-6 md:px-8 py-3 md:py-4 bg-indigo-600 text-white text-base md:text-lg font-bold rounded-full shadow-lg hover:bg-indigo-700 hover:shadow-xl hover:shadow-indigo-500/30 transition-all transform hover:-translate-y-1 active:scale-95 flex items-center gap-2 md:gap-3">
        ${msg.action}
        <svg xmlns="http://www.w3.org/2000/svg"
             class="h-5 w-5 md:h-6 md:w-6"
             fill="none"
             viewBox="0 0 24 24"
             stroke="currentColor"
             aria-hidden="true">
          <path stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M14 5l7 7m0 0l-7 7m7-7H3"/>
        </svg>
      </button>
    `;


    // Додаємо event listener замість inline onclick
    chatWindow.appendChild(coverWrapper);
    const startBtn = document.getElementById('coverStartBtn');
    if (startBtn) {
      startBtn.addEventListener('click', () => {
        nextBtn.click();
      });
    }
    return;

  }

  // Default wrapper
  const wrapper = document.createElement("div");
  wrapper.className =
    "flex w-full fade-in-up mb-8 " +
    (msg.type === "user" ? "justify-end" : "justify-start");

  let avatarHtml = "";
  let bubbleClass = "";

  if (msg.type === "user") {
    avatarHtml =
      '<div class="w-10 h-10 rounded-full bg-purple-600 flex-shrink-0 flex items-center justify-center text-white text-sm font-bold shadow-md ml-3 order-2 border-2 border-white ring-1 ring-slate-200">Т</div>';
    bubbleClass =
      "bg-purple-600 text-white rounded-2xl rounded-tr-sm shadow-md shadow-purple-100/50";
  } else if (msg.type === "ai" || msg.type === "quiz") {
    avatarHtml =
      '<div class="w-10 h-10 rounded-full bg-indigo-600 flex-shrink-0 flex items-center justify-center text-white text-sm font-bold shadow-md mr-3 border-2 border-white ring-1 ring-slate-200">ШІ</div>';
    bubbleClass =
      "bg-white text-slate-800 border border-slate-200 rounded-2xl rounded-tl-sm shadow-sm";
  } else {
    wrapper.className =
      "flex w-full justify-center fade-in-up mb-8 px-2";
    bubbleClass =
      "bg-emerald-50 text-emerald-900 border border-emerald-200 rounded-xl max-w-2xl mx-auto shadow-sm";
  }

  const contentDiv = document.createElement("div");
  contentDiv.className =
    "flex flex-col max-w-[90%] md:max-w-[75%] " +
    (msg.type === "note" ? "w-full" : "");

  // QUIZ
  if (msg.type === "quiz") {
    const quizData = msg.content;
    const quizId = "quiz-" + Math.random().toString(36).slice(2);

    let optionsHtml = "";

    quizData.options.forEach((opt, index) => {
      optionsHtml += `
        <button
          data-quiz-id="${quizId}"
          data-is-correct="${opt.correct}"
          data-option-index="${index}"
          class="quiz-option w-full text-left p-3 rounded-lg border border-slate-200 hover:bg-slate-50 mb-2 font-medium text-slate-700 bg-white shadow-sm flex items-center justify-between group">
          <span>${opt.text}</span>
          <span class="status-icon hidden"></span>
        </button>
      `;
    });

    contentDiv.innerHTML = `
      <div class="flex items-end justify-start">
        ${avatarHtml}
        <div class="${bubbleClass} p-5 w-full">
          <h3 class="font-bold text-lg mb-3 text-indigo-700 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg"
                 class="h-5 w-5"
                 viewBox="0 0 20 20"
                 fill="currentColor"
                 aria-hidden="true">
              <path fill-rule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clip-rule="evenodd"/>
            </svg>
            Давай перевіримо твої знання:
          </h3>
          <p class="mb-4 text-lg font-medium">${quizData.question}</p>
          <div id="${quizId}" class="space-y-2">
            ${optionsHtml}
          </div>
          <div id="${quizId}-feedback"
               class="mt-4 hidden p-3 rounded-lg text-sm md:text-base bg-indigo-50 text-indigo-900 border border-indigo-100"></div>
        </div>
      </div>
    `;
    wrapper.appendChild(contentDiv);
    chatWindow.appendChild(wrapper);

    // Додаємо event listeners до кнопок квізу замість inline onclick
    const quizContainer = document.getElementById(quizId);
    const quizButtons = quizContainer.querySelectorAll('.quiz-option');
    quizButtons.forEach(btn => {
      btn.addEventListener('click', function () {
        const isCorrect = this.dataset.isCorrect === 'true';
        checkAnswer(this, isCorrect, quizId, quizData.explanation);
      });
    });

    return;
  }

  // IMAGE / AUDIO
  let mediaHtml = "";
  if (msg.image) {
    mediaHtml += `
      <img src="${msg.image}"
           alt="Ілюстрація"
           class="rounded-lg mt-4 w-full h-auto object-contain border border-slate-200 shadow-sm"
           loading="lazy"
           onerror="this.style.display='none';">
    `;
  }
  if (msg.audio) {
    mediaHtml += `
      <div class="mt-4 bg-slate-100 rounded-xl p-3 flex items-center gap-2 border border-slate-200">
        <audio controls class="w-full h-10 accent-indigo-600" src="${msg.audio}"></audio>
      </div>
    `;
  }

  if (msg.type === "note") {
    contentDiv.innerHTML = `
      <div class="${bubbleClass} p-5 md:p-6 flex gap-4 items-start">
        <div class="bg-emerald-100 p-2 rounded-full shrink-0 text-emerald-600 mt-1">
          <svg xmlns="http://www.w3.org/2000/svg"
               class="h-6 w-6"
               fill="none"
               viewBox="0 0 24 24"
               stroke="currentColor">
            <path stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
        </div>
        <div class="flex-1 text-base md:text-lg leading-relaxed">
          ${msg.content}
          ${mediaHtml}
        </div>
      </div>
    `;
  } else {
    const bubbleContent = `
      <div class="${bubbleClass} px-5 py-4 text-base md:text-lg leading-relaxed font-medium">
        <div class="prose prose-slate max-w-none text-inherit prose-p:my-0 prose-ul:my-2 prose-li:my-0">
          ${msg.content}
        </div>
        ${mediaHtml}
      </div>
    `;

    contentDiv.innerHTML = `
      <div class="flex items-end ${msg.type === "user" ? "justify-end" : ""}">
        ${msg.type !== "user" ? avatarHtml : ""}
        ${bubbleContent}
        ${msg.type === "user" ? avatarHtml : ""}
      </div>
    `;
  }

  wrapper.appendChild(contentDiv);
  chatWindow.appendChild(wrapper);
}

// ---------- QUIZ HANDLER ----------
function checkAnswer(btn, isCorrect, quizId, explanation) {
  // Заборонити повторні кліки
  if (btn.disabled) return;

  const parent = document.getElementById(quizId);
  const feedback = document.getElementById(quizId + "-feedback");
  const buttons = parent.querySelectorAll("button");

  if (isCorrect) {
    btn.classList.add("correct", "font-bold");
    btn.classList.remove("bg-white");
    const icon = btn.querySelector(".status-icon");
    icon.innerHTML = "✅";
    icon.classList.remove("hidden");

    feedback.innerHTML = `<strong>Супер! Молодець!</strong><br>${explanation}`;
    feedback.classList.remove("hidden", "bg-red-50", "text-red-900", "border-red-100");
    feedback.classList.add("bg-green-50", "text-green-900", "border-green-100");

    // Заблокувати всі кнопки після правильної відповіді
    buttons.forEach((b) => {
      b.disabled = true;
      if (b !== btn) b.classList.add("opacity-50");
    });
  } else {
    btn.classList.add("wrong");
    btn.classList.remove("bg-white");
    btn.disabled = true; // Заборонити повторний клік на неправильну відповідь
    const icon = btn.querySelector(".status-icon");
    icon.innerHTML = "❌";
    icon.classList.remove("hidden");

    feedback.innerHTML = `<strong>Не зовсім так.</strong> ${explanation} <br><span class="text-sm italic mt-1 block">Спробуй обрати інший варіант!</span>`;
    feedback.classList.remove("hidden", "bg-green-50", "text-green-900", "border-green-100");
    feedback.classList.add("bg-red-50", "text-red-900", "border-red-100");
  }
}

// ---------- MENU / RESIZE ----------
const toggleMenu = (show) => {
  if (show) {
    sidebar.classList.remove("-translate-x-full");
    overlay.classList.remove("hidden");
    setTimeout(() => overlay.classList.remove("opacity-0"), 10);
  } else {
    sidebar.classList.add("-translate-x-full");
    overlay.classList.add("opacity-0");
    setTimeout(() => overlay.classList.add("hidden"), 300);
  }
};

const closeMenu = () => toggleMenu(false);

menuBtn.addEventListener("click", () => toggleMenu(true));
closeMenuBtn.addEventListener("click", closeMenu);
overlay.addEventListener("click", closeMenu);

let resizeTimeout;
window.addEventListener("resize", () => {
  clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(() => {
    if (window.innerWidth >= 1024) {
      closeMenu();
    }
  }, 250);
});

prevBtn.addEventListener("click", () => {
  if (currentSectionIndex > 0) loadSection(currentSectionIndex - 1);
});

nextBtn.addEventListener("click", () => {
  if (currentSectionIndex < sectionKeys.length - 1) {
    loadSection(currentSectionIndex + 1);
  }
});

// ---------- START ----------
loadProgress();
