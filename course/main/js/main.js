/* global window, document, localStorage, confetti */

(() => {
  "use strict";

  const curriculum = Array.isArray(window.CS_CURRICULUM) ? window.CS_CURRICULUM : [];

  // --- Robust defaults (як у тебе, але акуратніше) ---
  for (const m of curriculum) {
    for (const l of (m.lessons || [])) {
      if (!l.quiz) l.quiz = { question: "Матеріал засвоєно?", options: ["Ні", "Так", "Частково"], correct: 1 };
      if (!Array.isArray(l.quiz.options) || l.quiz.options.length < 2) l.quiz.options = ["Ні", "Так"];
      if (typeof l.quiz.correct !== "number") l.quiz.correct = 1;
    }
  }

  // --- Helpers ---
  const $ = (sel, root = document) => root.querySelector(sel);

  const escapeHtml = (str) =>
    String(str).replace(/[&<>"']/g, (ch) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[ch]));

  const normalizeLessonIdToFile = (lessonId) =>
    `lesson_${String(lessonId).replace(/\./g, "_").replace(/[^a-zA-Z0-9_]/g, "_")}.json`;

  const loadCompleted = () => {
    try {
      const raw = JSON.parse(localStorage.getItem("cs_completed") || "[]");
      return new Set(Array.isArray(raw) ? raw : []);
    } catch {
      return new Set();
    }
  };

  const saveCompleted = (set) => {
    localStorage.setItem("cs_completed", JSON.stringify([...set]));
  };

  const getAllLessonsFlat = () => curriculum.flatMap(m => (m.lessons || []).map(l => ({ ...l, moduleId: m.id, moduleTitle: m.title })));

  const findLessonBase = (lessonId) => getAllLessonsFlat().find(l => l.id === lessonId) || null;

  const state = {
    view: "landing",
    activeModuleId: null,
    activeLessonId: null,
    completed: loadCompleted(),
    searchQuery: ""
  };

  const dom = {
    content: $("#contentArea"),
    headerTitle: $("#headerTitle"),
    backBtn: $("#backBtn"),
    themeToggle: $("#themeToggle")
  };

  // --- Theme ---
  function initThemeToggle() {
    dom.themeToggle?.addEventListener("click", () => {
      document.documentElement.classList.toggle("dark");
      const isDark = document.documentElement.classList.contains("dark");
      localStorage.setItem("theme", isDark ? "dark" : "light");
    });
  }

  // --- Progress ---
  function calculateProgress() {
    const all = getAllLessonsFlat();
    if (!all.length) return 0;
    let done = 0;
    for (const l of all) if (state.completed.has(l.id)) done++;
    return Math.round((done / all.length) * 100) || 0;
  }

  // --- Search ---
  function filterCurriculum(query) {
    if (!query) return curriculum;

    const q = query.toLowerCase();
    return curriculum
      .map(mod => {
        const lessons = (mod.lessons || []).filter(l =>
          (l.title || "").toLowerCase().includes(q) || String(l.id).includes(q)
        );
        if ((mod.title || "").toLowerCase().includes(q) || lessons.length > 0) {
          return { ...mod, lessons: lessons.length ? lessons : mod.lessons };
        }
        return null;
      })
      .filter(Boolean);
  }

  // --- Lesson loading with JSON override (optional) ---
  const lessonCache = new Map(); // lessonId -> full lesson object

  async function getLesson(lessonId) {
    if (lessonCache.has(lessonId)) return lessonCache.get(lessonId);

    const base = findLessonBase(lessonId);
    if (!base) return null;

    const merged = { ...base };

    // Try fetch lesson JSON (if served over http/https)
    try {
      const file = normalizeLessonIdToFile(lessonId);
      const res = await fetch(`lessons/${file}`, { cache: "no-store" });
      if (res.ok) {
        const json = await res.json();
        // allow: {title, videoUrl, theoryHtml, quiz:{...}}
        Object.assign(merged, json);
        if (json.quiz) merged.quiz = { ...(base.quiz || {}), ...(json.quiz || {}) };
      }
    } catch {
      // ignore: works fine without server or without lesson files
    }

    // Final safety for quiz
    if (!merged.quiz) merged.quiz = { question: "Матеріал засвоєно?", options: ["Ні", "Так", "Частково"], correct: 1 };
    if (!Array.isArray(merged.quiz.options) || merged.quiz.options.length < 2) merged.quiz.options = ["Ні", "Так"];
    if (typeof merged.quiz.correct !== "number") merged.quiz.correct = 1;

    lessonCache.set(lessonId, merged);
    return merged;
  }

  // --- Routing (hash-based) ---
  function setHash(hash) {
    if (location.hash !== hash) location.hash = hash;
  }

  function parseHash() {
    const h = (location.hash || "").replace(/^#/, "");
    if (!h) return { view: "landing" };
    if (h === "home") return { view: "home" };
    if (h.startsWith("lesson=")) return { view: "lesson", id: decodeURIComponent(h.slice("lesson=".length)) };
    return { view: "landing" };
  }

  window.addEventListener("hashchange", () => {
    const r = parseHash();
    if (r.view === "home") renderHome();
    else if (r.view === "lesson" && r.id) renderLesson(r.id);
    else renderLanding();
  });

  // --- Render: Landing ---
  function renderLanding() {
    state.view = "landing";
    state.activeLessonId = null;
    dom.backBtn.classList.add("hidden");
    dom.headerTitle.textContent = "CS Course";
    dom.content.scrollTop = 0;

    const hasProgress = state.completed.size > 0;

    dom.content.innerHTML = `
      <div class="flex flex-col items-center justify-center min-h-[85vh] p-6 text-center space-y-8 relative max-w-4xl mx-auto">
        <div class="absolute top-1/4 left-1/2 -translate-x-1/2 w-64 h-64 md:w-96 md:h-96 bg-blue-400/20 dark:bg-blue-600/20 rounded-full blur-3xl animate-blob -z-10"></div>

        <div class="relative transition-transform hover:scale-110 duration-500">
          <div class="w-24 h-24 md:w-32 md:h-32 bg-white dark:bg-slate-800 rounded-2xl shadow-xl flex items-center justify-center transform rotate-3">
            <i class="fa-solid fa-microchip text-5xl md:text-6xl text-primary"></i>
          </div>
        </div>

        <div class="space-y-4 max-w-lg mx-auto">
          <h1 class="text-4xl md:text-6xl font-extrabold tracking-tight text-gray-900 dark:text-white leading-tight">
            Комп'ютерна наука <span class="text-primary block mt-2">без болю</span>
          </h1>
          <p class="text-lg md:text-xl text-gray-600 dark:text-gray-400 leading-relaxed">
            Твій гід у цифровому світі. Вертикальні відео, теорія без води та практика.
          </p>
        </div>

        <button data-action="go-home"
          class="w-full max-w-sm bg-dark dark:bg-white text-white dark:text-dark text-xl font-bold py-4 rounded-2xl shadow-xl transition-all transform hover:scale-[1.02] active:scale-95 group"
          type="button">
          <span class="relative z-10 flex items-center justify-center gap-2">
            ${hasProgress ? "Продовжити" : "Почати навчання"}
            <i class="fa-solid fa-arrow-right group-hover:translate-x-1 transition-transform"></i>
          </span>
        </button>

        <p class="text-xs text-gray-400">Без реєстрації • Прогрес зберігається</p>
      </div>
    `;
  }

  // --- Render: Home ---
  const searchDebounce = (() => {
    let t = null;
    return (fn, ms = 140) => {
      clearTimeout(t);
      t = setTimeout(fn, ms);
    };
  })();

  function renderHome() {
    state.view = "home";
    state.activeLessonId = null;
    dom.backBtn.classList.add("hidden");
    dom.headerTitle.textContent = "Навчальний план";
    dom.content.scrollTop = 0;

    const progress = calculateProgress();
    const filteredData = filterCurriculum(state.searchQuery);

    let html = `<div class="p-4 md:p-8 space-y-6 pb-12 animate-fade-in max-w-4xl mx-auto">`;

    // Progress Widget
    html += `
      <div class="bg-primary text-white p-6 md:p-8 rounded-2xl shadow-lg relative overflow-hidden">
        <div class="absolute -right-4 -top-4 text-white/10 text-9xl"><i class="fa-solid fa-chart-pie"></i></div>
        <div class="relative z-10 max-w-2xl">
          <div class="flex justify-between items-end mb-2">
            <h2 class="text-2xl md:text-3xl font-bold">Ваш прогрес</h2>
            <span class="text-3xl md:text-4xl font-bold">${progress}%</span>
          </div>
          <div class="w-full bg-black/20 rounded-full h-3">
            <div class="bg-white h-3 rounded-full transition-all duration-1000 ease-out shadow-sm" style="width: ${progress}%"></div>
          </div>
        </div>
      </div>
    `;

    // Search
    html += `
      <div class="relative">
        <i class="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"></i>
        <input type="text" id="searchInput" placeholder="Знайти урок..."
          class="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all dark:text-white"
          value="${escapeHtml(state.searchQuery)}">
      </div>
    `;

    // Modules
    html += `<div class="flex flex-col gap-4 md:gap-5">`;

    if (!filteredData.length) {
      html += `<div class="text-center py-10 text-gray-500">Нічого не знайдено 😔</div>`;
    } else {
      for (const module of filteredData) {
        const isOpen = state.activeModuleId === module.id || state.searchQuery.length > 0;
        const total = (module.lessons || []).length;
        let done = 0;
        for (const l of (module.lessons || [])) if (state.completed.has(l.id)) done++;
        const modProgress = total ? (done / total) * 100 : 0;
        const isDone = modProgress === 100;

        html += `
          <div class="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden transition-all duration-300">
            <button data-action="toggle-module" data-id="${module.id}"
              class="w-full text-left p-5 flex flex-col gap-2 active:bg-gray-50 dark:active:bg-slate-700 outline-none" type="button">
              <div class="flex justify-between items-center w-full">
                <div class="flex items-center gap-2">
                  <h3 class="font-bold text-lg text-gray-800 dark:text-gray-100">${escapeHtml(module.title)}</h3>
                  ${isDone ? '<i class="fa-solid fa-circle-check text-green-500"></i>' : ''}
                </div>
                <i class="fa-solid fa-chevron-down text-gray-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}"></i>
              </div>
              <div class="w-full flex items-center gap-3">
                <div class="flex-1 bg-gray-100 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                  <div class="bg-green-500 h-full rounded-full transition-all" style="width: ${modProgress}%"></div>
                </div>
                <span class="text-xs text-gray-400 font-mono whitespace-nowrap">${done}/${total}</span>
              </div>
            </button>

            <div class="${isOpen ? 'block' : 'hidden'} border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-slate-900/50">
              ${(module.lessons || []).map(lesson => {
                const lDone = state.completed.has(lesson.id);
                return `
                  <button data-action="open-lesson" data-lesson="${escapeHtml(lesson.id)}"
                    class="w-full p-4 pl-6 text-left flex items-center gap-4 hover:bg-white dark:hover:bg-slate-800 border-b border-gray-100 dark:border-gray-800 last:border-0 transition-colors group" type="button">
                    <div class="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                      lDone
                        ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-700 text-gray-400 group-hover:border-primary group-hover:text-primary'
                    }">
                      <i class="fa-solid ${lDone ? 'fa-check' : 'fa-play'} text-xs"></i>
                    </div>
                    <div class="flex-1">
                      <span class="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Урок ${escapeHtml(lesson.id)}</span>
                      <span class="font-medium text-gray-700 dark:text-gray-200 text-sm md:text-base">${escapeHtml(lesson.title)}</span>
                    </div>
                    <i class="fa-solid fa-chevron-right text-gray-300 text-xs opacity-0 group-hover:opacity-100 transition-opacity"></i>
                  </button>
                `;
              }).join("")}
            </div>
          </div>
        `;
      }
    }

    html += `</div></div>`;
    dom.content.innerHTML = html;

    const input = $("#searchInput");
    if (input) {
      input.addEventListener("input", (e) => {
        const v = e.target.value || "";
        searchDebounce(() => {
          state.searchQuery = v;
          renderHome();
        });
      });

      if (state.searchQuery) {
        input.focus();
        input.setSelectionRange(input.value.length, input.value.length);
      }
    }
  }

  // --- Render: Lesson ---
  async function renderLesson(lessonId) {
    state.view = "lesson";
    state.activeLessonId = lessonId;

    dom.backBtn.classList.remove("hidden");
    dom.headerTitle.textContent = lessonId;
    dom.content.scrollTop = 0;

    // Skeleton while loading
    dom.content.innerHTML = `
      <div class="p-6 md:p-10 max-w-5xl mx-auto animate-fade-in">
        <div class="bg-gray-100 dark:bg-slate-800 rounded-2xl p-6">
          <div class="h-6 w-40 bg-gray-200 dark:bg-slate-700 rounded mb-4"></div>
          <div class="h-4 w-full bg-gray-200 dark:bg-slate-700 rounded mb-2"></div>
          <div class="h-4 w-5/6 bg-gray-200 dark:bg-slate-700 rounded"></div>
        </div>
      </div>
    `;

    const lesson = await getLesson(lessonId);
    if (!lesson) {
      dom.content.innerHTML = `<div class="p-6 text-center text-gray-500">Урок не знайдено.</div>`;
      return;
    }

    const flat = getAllLessonsFlat();
    const idx = flat.findIndex(l => l.id === lessonId);
    const prev = idx > 0 ? flat[idx - 1] : null;
    const next = idx < flat.length - 1 ? flat[idx + 1] : null;

    const isCompleted = state.completed.has(lessonId);
    const theoryHtml = lesson.theoryHtml
      ? String(lesson.theoryHtml)
      : `
        <p class="mb-4">Тут міститься детальний конспект уроку <strong>${escapeHtml(lesson.title)}</strong>.</p>
        <div class="bg-yellow-50 dark:bg-yellow-900/20 p-6 rounded-xl border-l-4 border-yellow-400 text-sm md:text-base mt-6">
          <strong class="block mb-1 text-yellow-800 dark:text-yellow-200"><i class="fa-regular fa-lightbulb mr-2"></i>Важливо:</strong>
          Засвоївши цей матеріал, ви зможете перейти до наступного етапу.
        </div>
      `;

    dom.content.innerHTML = `
      <div class="animate-fade-in pb-10">
        <div class="flex flex-col md:grid md:grid-cols-12 md:gap-8 md:p-8 md:items-start max-w-7xl mx-auto">

          <!-- Video Section -->
          <div class="w-full md:col-span-4 lg:col-span-3 order-1 md:sticky md:top-6">
            <div class="w-full aspect-[9/16] bg-black relative flex items-center justify-center video-placeholder overflow-hidden shadow-2xl md:rounded-2xl group">
              <div class="absolute inset-0 bg-black/40 group-hover:bg-black/30 transition-colors"></div>
              <div class="absolute inset-0 flex flex-col items-center justify-center text-white p-6 text-center z-10">
                <div class="w-16 h-16 md:w-20 md:h-20 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center mb-6 shadow-2xl ring-4 ring-white/10 group-hover:scale-110 transition-transform duration-300">
                  <i class="fa-solid fa-play text-3xl pl-1"></i>
                </div>
                <h2 class="text-xl md:text-2xl font-bold drop-shadow-md px-4">${escapeHtml(lesson.title)}</h2>
                ${lesson.videoUrl ? `<a class="mt-3 text-xs underline underline-offset-4 opacity-90" href="${escapeHtml(lesson.videoUrl)}" target="_blank" rel="noopener">Відкрити відео</a>` : ""}
              </div>
            </div>
          </div>

          <!-- Theory Section -->
          <div class="md:col-span-8 lg:col-span-9 order-2 flex flex-col h-full">
            <div class="p-6 md:p-8 bg-white dark:bg-darkSec rounded-t-3xl md:rounded-2xl -mt-6 md:mt-0 relative z-20 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.3)] md:shadow-none md:bg-transparent md:dark:bg-transparent border-0 md:border md:border-gray-100 md:dark:border-gray-700">
              <div class="w-12 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full mx-auto mb-8 md:hidden"></div>

              <div class="mb-8">
                <div class="flex justify-between items-start">
                  <span class="inline-block px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-primary text-xs font-bold uppercase tracking-wider mb-3">Теорія</span>
                  ${isCompleted ? `<span class="hidden md:inline-flex px-4 py-1 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full font-bold text-xs items-center gap-2"><i class="fa-solid fa-circle-check"></i> Пройдено</span>` : ''}
                </div>

                <h1 class="text-2xl md:text-4xl font-bold mb-6 leading-tight text-gray-900 dark:text-white">${escapeHtml(lesson.title)}</h1>

                <div class="prose dark:prose-invert prose-lg text-gray-600 dark:text-gray-300 leading-relaxed max-w-none">
                  ${theoryHtml}
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Quiz & Navigation -->
        <div class="max-w-4xl mx-auto px-6 md:px-0 mt-8 md:mt-12 order-3">
          <div class="bg-gray-50 dark:bg-slate-800 p-6 md:p-10 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-sm">
            <h3 class="font-bold text-xl md:text-2xl flex items-center gap-3 mb-6">
              <span class="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center shadow-lg"><i class="fa-solid fa-brain"></i></span>
              Квіз: ${escapeHtml(lesson.quiz.question)}
            </h3>

            <div class="space-y-3" id="quizOptions">
              ${lesson.quiz.options.map((opt, i) => `
                <button type="button" data-action="answer" data-lesson="${escapeHtml(lessonId)}" data-correct="${i === lesson.quiz.correct ? "1" : "0"}"
                  class="w-full p-4 md:p-5 rounded-xl border-2 border-white dark:border-slate-600 bg-white dark:bg-slate-700 text-left hover:border-gray-200 dark:hover:border-gray-500 transition-all font-medium text-base shadow-sm relative group flex items-center gap-4">
                  <span class="w-8 h-8 rounded-full border-2 border-gray-200 dark:border-gray-500 flex items-center justify-center text-xs font-bold text-gray-400 group-hover:border-gray-400 dark:group-hover:border-gray-300">${String.fromCharCode(65 + i)}</span>
                  ${escapeHtml(opt)}
                </button>
              `).join("")}
            </div>

            <div id="quizFeedback" class="hidden mt-6 p-4 rounded-xl text-center font-bold text-base animate-bounce-in"></div>
          </div>

          <div class="flex flex-col md:flex-row justify-between items-center pt-8 border-t border-gray-100 dark:border-gray-800 mt-8 gap-4">
            ${prev ? `
              <button type="button" data-action="open-lesson" data-lesson="${escapeHtml(prev.id)}"
                class="w-full md:w-auto px-6 py-3 text-gray-500 hover:text-gray-900 dark:hover:text-white font-bold transition-colors flex items-center justify-center gap-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800">
                <i class="fa-solid fa-arrow-left"></i> ${escapeHtml(prev.title)}
              </button>
            ` : `<div></div>`}

            ${next ? `
              <button type="button" data-action="open-lesson" data-lesson="${escapeHtml(next.id)}"
                class="w-full md:w-auto px-6 py-3 bg-dark dark:bg-white text-white dark:text-dark rounded-xl font-bold shadow-lg hover:shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2">
                Наступний: ${escapeHtml(next.title)} <i class="fa-solid fa-arrow-right"></i>
              </button>
            ` : `
              <button type="button" data-action="go-home"
                class="w-full md:w-auto px-6 py-3 bg-green-500 text-white rounded-xl font-bold shadow-lg hover:shadow-xl active:scale-95 transition-all">
                Завершити курс <i class="fa-solid fa-flag-checkered ml-2"></i>
              </button>
            `}
          </div>
        </div>
      </div>
    `;
  }

  // --- Actions (delegated) ---
  function toggleModule(id) {
    state.activeModuleId = state.activeModuleId === id ? null : id;
    renderHome();
  }

  function checkAnswer(btn, isCorrect, lessonId) {
    const parent = $("#quizOptions");
    const feedback = $("#quizFeedback");
    if (!parent || !feedback) return;

    // lock options
    [...parent.children].forEach(child => {
      child.classList.add("opacity-60", "cursor-not-allowed");
      child.disabled = true;
      child.classList.remove("ring-2", "ring-green-500", "ring-red-500");
    });

    btn.classList.remove("opacity-60", "cursor-not-allowed");
    btn.classList.add("opacity-100");
    feedback.classList.remove("hidden");

    const badge = btn.querySelector("span");

    if (isCorrect) {
      btn.classList.add("ring-2", "ring-green-500", "bg-green-50", "dark:bg-green-900/30", "border-green-500");
      badge?.classList.add("bg-green-500", "text-white", "border-green-500");
      feedback.innerHTML = '<i class="fa-regular fa-face-smile text-2xl mb-2 block"></i> Правильно! Ти супер!';
      feedback.className = "mt-6 p-4 rounded-xl text-center font-bold text-base animate-bounce-in text-green-700 dark:text-green-300 bg-green-100 dark:bg-green-900/20";

      try { if (typeof confetti === "function") confetti({ particleCount: 90, spread: 70, origin: { y: 0.6 } }); } catch {}

      if (!state.completed.has(lessonId)) {
        state.completed.add(lessonId);
        saveCompleted(state.completed);
      }
    } else {
      btn.classList.add("ring-2", "ring-red-500", "bg-red-50", "dark:bg-red-900/30", "border-red-500");
      badge?.classList.add("bg-red-500", "text-white", "border-red-500");
      feedback.innerHTML = '<i class="fa-regular fa-face-frown text-2xl mb-2 block"></i> Спробуй ще раз.';
      feedback.className = "mt-6 p-4 rounded-xl text-center font-bold text-base animate-bounce-in text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-900/20";
    }
  }

  dom.content.addEventListener("click", async (e) => {
    const btn = e.target.closest("button");
    if (!btn) return;

    const action = btn.dataset.action;
    if (!action) return;

    if (action === "go-home") {
      setHash("#home");
      return;
    }

    if (action === "toggle-module") {
      const id = Number(btn.dataset.id);
      if (!Number.isNaN(id)) toggleModule(id);
      return;
    }

    if (action === "open-lesson") {
      const id = btn.dataset.lesson;
      if (id) setHash(`#lesson=${encodeURIComponent(id)}`);
      return;
    }

    if (action === "answer") {
      const isCorrect = btn.dataset.correct === "1";
      const id = btn.dataset.lesson;
      if (id) checkAnswer(btn, isCorrect, id);
      return;
    }
  });

  dom.backBtn.addEventListener("click", () => {
    // If user came from home/landing, history.back() is nicer; fallback to home
    if (history.length > 1) history.back();
    else setHash("#home");
  });

  // --- Init ---
  initThemeToggle();

  const route = parseHash();
  if (route.view === "home") renderHome();
  else if (route.view === "lesson" && route.id) renderLesson(route.id);
  else renderLanding();

})();
