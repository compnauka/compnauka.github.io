import { curriculum as rawCurriculum } from './data.js';

function normalizeCurriculum(curr) {
  const fallbackQuiz = { question: "Матеріал засвоєно?", options: ["Ні", "Так", "Частково"], correct: 1 };
  return curr.map(m => ({
    ...m,
    lessons: m.lessons.map(l => ({ ...l, quiz: l.quiz ? l.quiz : fallbackQuiz }))
  }));
}

const curriculum = normalizeCurriculum(rawCurriculum);
const allLessonIds = new Set(curriculum.flatMap(m => m.lessons.map(l => l.id)));

const state = {
  currentView: 'landing',
  activeModuleId: null,
  activeLessonId: null,
  completedLessons: loadCompleted(),
  searchQuery: ''
};

function loadCompleted() {
  try {
    const raw = JSON.parse(localStorage.getItem('cs_completed') || '[]');
    if (!Array.isArray(raw)) return [];
    return raw.filter(id => typeof id === 'string' && allLessonIds.has(id));
  } catch {
    return [];
  }
}
function saveCompleted() {
  localStorage.setItem('cs_completed', JSON.stringify(state.completedLessons));
}

const dom = {
  content: document.getElementById('contentArea'),
  headerTitle: document.getElementById('headerTitle'),
  backBtn: document.getElementById('backBtn'),
  themeToggle: document.getElementById('themeToggle'),
};

function initTheme() {
  const isDark =
    localStorage.theme === 'dark' ||
    (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.classList.toggle('dark', isDark);
}

dom.themeToggle.addEventListener('click', () => {
  document.documentElement.classList.toggle('dark');
  localStorage.theme = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
});

function clear(node) { while (node.firstChild) node.removeChild(node.firstChild); }

function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v === null || v === undefined) continue;
    if (k === 'class') node.className = String(v);
    else if (k === 'text') node.textContent = String(v);
    else if (k === 'html') node.innerHTML = String(v); // тільки для власних статичних шматків
    else node.setAttribute(k, String(v));
  }
  for (const child of children) {
    if (child === null || child === undefined) continue;
    node.appendChild(typeof child === 'string' ? document.createTextNode(child) : child);
  }
  return node;
}
function icon(className) { return el('i', { class: className }); }

function calculateProgress() {
  const total = curriculum.reduce((acc, m) => acc + m.lessons.length, 0);
  const done = state.completedLessons.length;
  return total ? Math.round((done / total) * 100) : 0;
}

function filterCurriculum(query) {
  if (!query) return curriculum;
  const q = query.toLowerCase();
  return curriculum
    .map(mod => {
      const modMatch = mod.title.toLowerCase().includes(q);
      const lessonsMatch = mod.lessons.filter(l =>
        l.title.toLowerCase().includes(q) || l.id.toLowerCase().includes(q)
      );
      if (modMatch || lessonsMatch.length) return { ...mod, lessons: lessonsMatch.length ? lessonsMatch : mod.lessons };
      return null;
    })
    .filter(Boolean);
}

const router = {
  landing: renderLanding,
  home: renderHome,
  lesson: renderLessonView
};

dom.content.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-action]');
  if (!btn) return;
  const action = btn.getAttribute('data-action');

  if (action === 'go-home') return router.home();
  if (action === 'toggle-module') {
    const id = Number(btn.getAttribute('data-module-id'));
    state.activeModuleId = state.activeModuleId === id ? null : id;
    return renderHome();
  }
  if (action === 'open-lesson') {
    const id = btn.getAttribute('data-lesson-id');
    if (id) return router.lesson(id);
  }
  if (action === 'go-prev' || action === 'go-next') {
    const id = btn.getAttribute('data-lesson-id');
    if (id) return router.lesson(id);
  }
  if (action === 'finish-course') return router.home();
  if (action === 'select-answer') {
    const lessonId = btn.getAttribute('data-lesson-id');
    const idx = Number(btn.getAttribute('data-index'));
    if (lessonId && Number.isFinite(idx)) return checkAnswer(lessonId, idx);
  }
});

dom.content.addEventListener('input', (e) => {
  const t = e.target;
  if (t instanceof HTMLInputElement && t.id === 'searchInput') debounceSearch(t.value);
});

dom.backBtn.addEventListener('click', () => router.home());

dom.content.addEventListener('keydown', (e) => {
  const rg = e.target.closest?.('[data-quiz-radiogroup="true"]');
  if (!rg) return;

  const buttons = Array.from(rg.querySelectorAll('button[role="radio"]'));
  if (!buttons.length) return;

  const currentIndex = buttons.findIndex(b => b === document.activeElement);
  const move = (nextIdx) => {
    const clamped = (nextIdx + buttons.length) % buttons.length;
    buttons[clamped].focus();
  };

  if (e.key === 'ArrowDown' || e.key === 'ArrowRight') { e.preventDefault(); move(currentIndex === -1 ? 0 : currentIndex + 1); }
  else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') { e.preventDefault(); move(currentIndex === -1 ? 0 : currentIndex - 1); }
  else if (e.key === 'Home') { e.preventDefault(); buttons[0].focus(); }
  else if (e.key === 'End') { e.preventDefault(); buttons[buttons.length - 1].focus(); }
  else if (e.key === 'Enter' || e.key === ' ') {
    if (document.activeElement?.getAttribute('role') === 'radio') { e.preventDefault(); document.activeElement.click(); }
  }
});

let searchT = null;
function debounceSearch(value) {
  clearTimeout(searchT);
  searchT = setTimeout(() => {
    state.searchQuery = value;
    renderHome({ keepSearchFocus: true });
  }, 120);
}

function renderLanding() {
  state.currentView = 'landing';
  state.activeLessonId = null;

  dom.backBtn.classList.add('hidden');
  dom.headerTitle.textContent = 'CS Course';
  dom.content.scrollTop = 0;

  clear(dom.content);

  const hasProgress = state.completedLessons.length > 0;

  const root = el('div', {
    class: 'flex flex-col items-center justify-center min-h-[85vh] p-6 text-center space-y-8 relative max-w-4xl mx-auto'
  });

  root.appendChild(el('div', {
    class: 'absolute top-1/4 left-1/2 -translate-x-1/2 w-64 h-64 md:w-96 md:h-96 bg-blue-400/20 dark:bg-blue-600/20 rounded-full blur-3xl animate-blob -z-10'
  }));

  root.appendChild(el('div', { class: 'relative transition-transform hover:scale-110 duration-500' }, [
    el('div', { class: 'w-24 h-24 md:w-32 md:h-32 bg-white dark:bg-slate-800 rounded-2xl shadow-xl flex items-center justify-center transform rotate-3' }, [
      icon('fa-solid fa-microchip text-5xl md:text-6xl text-blue-500')
    ])
  ]));

  root.appendChild(el('div', { class: 'space-y-4 max-w-lg mx-auto' }, [
    el('h1', { class: 'text-4xl md:text-6xl font-extrabold tracking-tight text-gray-900 dark:text-white leading-tight' }, [
      document.createTextNode("Комп'ютерна наука "),
      el('span', { class: 'text-blue-500 block mt-2', text: 'без болю' })
    ]),
    el('p', { class: 'text-lg md:text-xl text-gray-600 dark:text-gray-400 leading-relaxed', text: 'Твій гід у цифровому світі. Вертикальні відео, теорія без води та практика.' })
  ]));

  root.appendChild(el('button', {
    type: 'button',
    class: 'w-full max-w-sm bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xl font-bold py-4 rounded-2xl shadow-xl transition-all transform hover:scale-[1.02] active:scale-95 group',
    'data-action': 'go-home'
  }, [
    el('span', { class: 'relative z-10 flex items-center justify-center gap-2' }, [
      document.createTextNode(hasProgress ? 'Продовжити' : 'Почати навчання'),
      icon('fa-solid fa-arrow-right group-hover:translate-x-1 transition-transform')
    ])
  ]));

  root.appendChild(el('p', { class: 'text-xs text-gray-400', text: 'Без реєстрації • Прогрес зберігається' }));

  dom.content.appendChild(root);
}

function renderHome(opts = {}) {
  state.currentView = 'home';
  state.activeLessonId = null;

  dom.backBtn.classList.add('hidden');
  dom.headerTitle.textContent = 'Навчальний план';
  dom.content.scrollTop = 0;

  clear(dom.content);

  const progress = calculateProgress();
  const filteredData = filterCurriculum(state.searchQuery);

  const wrapper = el('div', { class: 'p-4 md:p-8 space-y-6 pb-12 animate-fade-in max-w-4xl mx-auto' });

  wrapper.appendChild(el('div', { class: 'bg-blue-500 text-white p-6 md:p-8 rounded-2xl shadow-lg relative overflow-hidden' }, [
    el('div', { class: 'absolute -right-4 -top-4 text-white/10 text-9xl' }, [ icon('fa-solid fa-chart-pie') ]),
    el('div', { class: 'relative z-10 max-w-2xl' }, [
      el('div', { class: 'flex justify-between items-end mb-2' }, [
        el('h2', { class: 'text-2xl md:text-3xl font-bold', text: 'Ваш прогрес' }),
        el('span', { class: 'text-3xl md:text-4xl font-bold', text: `${progress}%` })
      ]),
      el('div', { class: 'w-full bg-black/20 rounded-full h-3' }, [
        el('div', { class: 'bg-white h-3 rounded-full transition-all duration-1000 ease-out shadow-sm', style: `width: ${progress}%` })
      ])
    ])
  ]));

  wrapper.appendChild(el('div', { class: 'relative' }, [
    icon('fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-gray-400'),
    el('input', {
      id: 'searchInput',
      type: 'text',
      placeholder: 'Знайти урок...',
      value: state.searchQuery,
      class: 'w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all dark:text-white',
      'aria-label': 'Пошук уроків'
    })
  ]));

  const modulesCol = el('div', { class: 'flex flex-col gap-4 md:gap-5' });

  if (!filteredData.length) {
    modulesCol.appendChild(el('div', { class: 'text-center py-10 text-gray-500', text: 'Нічого не знайдено 😔' }));
  } else {
    filteredData.forEach(module => {
      const isOpen = state.activeModuleId === module.id || state.searchQuery.length > 0;
      const totalInModule = module.lessons.length;
      const completedInModule = module.lessons.filter(l => state.completedLessons.includes(l.id)).length;
      const modProgress = totalInModule ? (completedInModule / totalInModule) * 100 : 0;
      const isModuleDone = modProgress === 100;

      const panelId = `module-panel-${module.id}`;

      const moduleCard = el('div', {
        class: 'bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden transition-all duration-300'
      });

      const moduleBtn = el('button', {
        type: 'button',
        class: 'w-full text-left p-5 flex flex-col gap-2 active:bg-gray-50 dark:active:bg-slate-700 outline-none',
        'data-action': 'toggle-module',
        'data-module-id': String(module.id),
        'aria-expanded': String(isOpen),
        'aria-controls': panelId
      });

      moduleBtn.appendChild(el('div', { class: 'flex justify-between items-center w-full' }, [
        el('div', { class: 'flex items-center gap-2' }, [
          el('h3', { class: 'font-bold text-lg text-gray-800 dark:text-gray-100', text: module.title }),
          isModuleDone ? icon('fa-solid fa-circle-check text-green-500') : null
        ]),
        el('i', { class: `fa-solid fa-chevron-down text-gray-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`, 'aria-hidden': 'true' })
      ]));

      moduleBtn.appendChild(el('div', { class: 'w-full flex items-center gap-3' }, [
        el('div', { class: 'flex-1 bg-gray-100 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden' }, [
          el('div', { class: 'bg-green-500 h-full rounded-full transition-all', style: `width: ${modProgress}%` })
        ]),
        el('span', { class: 'text-xs text-gray-400 font-mono whitespace-nowrap', text: `${completedInModule}/${totalInModule}` })
      ]));

      const panel = el('div', {
        id: panelId,
        class: `${isOpen ? 'block' : 'hidden'} border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-slate-900/50`,
        role: 'region',
        'aria-label': `Уроки: ${module.title}`
      });

      module.lessons.forEach(lesson => {
        const isDone = state.completedLessons.includes(lesson.id);

        const lessonBtn = el('button', {
          type: 'button',
          class: 'w-full p-4 pl-6 text-left flex items-center gap-4 hover:bg-white dark:hover:bg-slate-800 border-b border-gray-100 dark:border-gray-800 last:border-0 transition-colors group',
          'data-action': 'open-lesson',
          'data-lesson-id': lesson.id,
          'aria-label': `Відкрити урок ${lesson.id}: ${lesson.title}`
        });

        lessonBtn.appendChild(el('div', {
          class: `flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
            isDone
              ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
              : 'bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-700 text-gray-400 group-hover:border-blue-500 group-hover:text-blue-500'
          }`
        }, [ el('i', { class: `fa-solid ${isDone ? 'fa-check' : 'fa-play'} text-xs`, 'aria-hidden': 'true' }) ]));

        lessonBtn.appendChild(el('div', { class: 'flex-1' }, [
          el('span', { class: 'block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5', text: `Урок ${lesson.id}` }),
          el('span', { class: 'font-medium text-gray-700 dark:text-gray-200 text-sm md:text-base', text: lesson.title })
        ]));

        lessonBtn.appendChild(el('i', { class: 'fa-solid fa-chevron-right text-gray-300 text-xs opacity-0 group-hover:opacity-100 transition-opacity', 'aria-hidden': 'true' }));

        panel.appendChild(lessonBtn);
      });

      moduleCard.appendChild(moduleBtn);
      moduleCard.appendChild(panel);
      modulesCol.appendChild(moduleCard);
    });
  }

  wrapper.appendChild(modulesCol);
  dom.content.appendChild(wrapper);

  if (opts.keepSearchFocus && state.searchQuery) {
    const input = document.getElementById('searchInput');
    if (input) {
      input.focus();
      input.setSelectionRange(input.value.length, input.value.length);
    }
  }
}

function renderLessonView(lessonId) {
  const module = curriculum.find(m => m.lessons.some(l => l.id === lessonId));
  if (!module) return renderHome();
  const lesson = module.lessons.find(l => l.id === lessonId);
  if (!lesson) return renderHome();

  const flat = curriculum.flatMap(m => m.lessons);
  const idx = flat.findIndex(l => l.id === lessonId);
  const prev = idx > 0 ? flat[idx - 1] : null;
  const next = idx < flat.length - 1 ? flat[idx + 1] : null;
  const isCompleted = state.completedLessons.includes(lessonId);

  state.currentView = 'lesson';
  state.activeLessonId = lessonId;

  dom.backBtn.classList.remove('hidden');
  dom.headerTitle.textContent = lesson.id;
  dom.content.scrollTop = 0;

  clear(dom.content);

  const page = el('div', { class: 'animate-fade-in pb-10' });
  const grid = el('div', { class: 'flex flex-col md:grid md:grid-cols-12 md:gap-8 md:p-8 md:items-start max-w-7xl mx-auto' });

  const videoCol = el('div', { class: 'w-full md:col-span-4 lg:col-span-3 order-1 md:sticky md:top-6' });
  const videoBox = el('div', { class: 'w-full aspect-[9/16] bg-black relative flex items-center justify-center video-placeholder overflow-hidden shadow-2xl md:rounded-2xl group' });

  videoBox.appendChild(el('div', { class: 'absolute inset-0 bg-black/40 group-hover:bg-black/30 transition-colors' }));

  const videoInner = el('div', { class: 'absolute inset-0 flex flex-col items-center justify-center text-white p-6 text-center z-10' });
  videoInner.appendChild(el('div', {
    class: 'w-16 h-16 md:w-20 md:h-20 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center mb-6 shadow-2xl ring-4 ring-white/10 group-hover:scale-110 transition-transform duration-300 cursor-pointer',
    role: 'button',
    tabindex: '0',
    'aria-label': 'Відтворити відео (плейсхолдер)'
  }, [ icon('fa-solid fa-play text-3xl pl-1') ]));
  videoInner.appendChild(el('h2', { class: 'text-xl md:text-2xl font-bold drop-shadow-md px-4', text: lesson.title }));
  videoBox.appendChild(videoInner);

  videoCol.appendChild(videoBox);
  grid.appendChild(videoCol);

  const theoryCol = el('div', { class: 'md:col-span-8 lg:col-span-9 order-2 flex flex-col h-full' });
  const theoryCard = el('div', {
    class: 'p-6 md:p-8 bg-white dark:bg-slate-800 rounded-t-3xl md:rounded-2xl -mt-6 md:mt-0 relative z-20 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.3)] md:shadow-none md:bg-transparent md:dark:bg-transparent border-0 md:border md:border-gray-100 md:dark:border-gray-700'
  });

  theoryCard.appendChild(el('div', { class: 'w-12 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full mx-auto mb-8 md:hidden', 'aria-hidden': 'true' }));

  const headerRow = el('div', { class: 'mb-8' });
  headerRow.appendChild(el('div', { class: 'flex justify-between items-start' }, [
    el('span', { class: 'inline-block px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-500 text-xs font-bold uppercase tracking-wider mb-3', text: 'Теорія' }),
    isCompleted ? el('span', { class: 'hidden md:inline-flex px-4 py-1 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full font-bold text-xs items-center gap-2' }, [
      icon('fa-solid fa-circle-check'), el('span', { text: 'Пройдено' })
    ]) : null
  ]));

  headerRow.appendChild(el('h1', { class: 'text-2xl md:text-4xl font-bold mb-6 leading-tight text-gray-900 dark:text-white', text: lesson.title }));

  const prose = el('div', { class: 'prose text-gray-600 dark:text-gray-300 max-w-none' });
  prose.appendChild(el('p', { class: 'mb-4' }, [
    document.createTextNode('Тут міститься детальний конспект уроку '),
    el('strong', { text: lesson.title }),
    document.createTextNode('. В реальному застосунку цей контент завантажується динамічно.')
  ]));
  prose.appendChild(el('div', { class: 'bg-yellow-50 dark:bg-yellow-900/20 p-6 rounded-xl border-l-4 border-yellow-400 text-sm md:text-base mt-6' }, [
    el('strong', { class: 'block mb-1 text-yellow-800 dark:text-yellow-200' }, [
      el('i', { class: 'fa-regular fa-lightbulb mr-2', 'aria-hidden': 'true' }),
      document.createTextNode('Важливо:')
    ]),
    el('span', { text: ' Засвоївши цей матеріал, ви зможете перейти до наступного етапу.' })
  ]));

  headerRow.appendChild(prose);
  theoryCard.appendChild(headerRow);
  theoryCol.appendChild(theoryCard);
  grid.appendChild(theoryCol);

  page.appendChild(grid);

  const bottomWrap = el('div', { class: 'max-w-4xl mx-auto px-6 md:px-0 mt-8 md:mt-12 order-3' });
  const quizCard = el('div', { class: 'bg-gray-50 dark:bg-slate-800 p-6 md:p-10 rounded-2xl border border-gray-200 dark:border-slate-700 shadow-sm' });

  quizCard.appendChild(el('h3', { class: 'font-bold text-xl md:text-2xl flex items-center gap-3 mb-6' }, [
    el('span', { class: 'w-10 h-10 rounded-xl bg-blue-500 text-white flex items-center justify-center shadow-lg' }, [ icon('fa-solid fa-brain') ]),
    el('span', { text: `Квіз: ${lesson.quiz.question}` })
  ]));

  const optionsWrap = el('div', {
    id: 'quizOptions',
    class: 'space-y-3',
    role: 'radiogroup',
    'aria-label': 'Варіанти відповіді',
    'data-quiz-radiogroup': 'true'
  });

  lesson.quiz.options.forEach((opt, i) => {
    const btn = el('button', {
      type: 'button',
      class: 'w-full p-4 md:p-5 rounded-xl border-2 border-white dark:border-slate-600 bg-white dark:bg-slate-700 text-left hover:border-gray-200 dark:hover:border-gray-500 transition-all font-medium text-base shadow-sm relative group flex items-center gap-4',
      role: 'radio',
      'aria-checked': 'false',
      'data-action': 'select-answer',
      'data-lesson-id': lessonId,
      'data-index': String(i)
    });

    btn.appendChild(el('span', {
      class: 'w-8 h-8 rounded-full border-2 border-gray-200 dark:border-gray-500 flex items-center justify-center text-xs font-bold text-gray-400 group-hover:border-gray-400 dark:group-hover:border-gray-300'
    }, [ String.fromCharCode(65 + i) ]));

    btn.appendChild(el('span', { text: String(opt) }));
    optionsWrap.appendChild(btn);
  });

  quizCard.appendChild(optionsWrap);

  const feedback = el('div', {
    id: 'quizFeedback',
    class: 'hidden mt-6 p-4 rounded-xl text-center font-bold text-base animate-bounce-in',
    role: 'status',
    'aria-live': 'polite'
  });
  quizCard.appendChild(feedback);

  bottomWrap.appendChild(quizCard);

  const navRow = el('div', { class: 'flex flex-col md:flex-row justify-between items-center pt-8 border-t border-gray-100 dark:border-gray-800 mt-8 gap-4' });

  if (prev) {
    navRow.appendChild(el('button', {
      type: 'button',
      class: 'w-full md:w-auto px-6 py-3 text-gray-500 hover:text-gray-900 dark:hover:text-white font-bold transition-colors flex items-center justify-center gap-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800',
      'data-action': 'go-prev',
      'data-lesson-id': prev.id,
      'aria-label': `Попередній урок: ${prev.title}`
    }, [ icon('fa-solid fa-arrow-left'), el('span', { text: prev.title }) ]));
  } else {
    navRow.appendChild(el('div'));
  }

  if (next) {
    navRow.appendChild(el('button', {
      type: 'button',
      class: 'w-full md:w-auto px-6 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-bold shadow-lg hover:shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2',
      'data-action': 'go-next',
      'data-lesson-id': next.id,
      'aria-label': `Наступний урок: ${next.title}`
    }, [ el('span', { text: `Наступний: ${next.title}` }), icon('fa-solid fa-arrow-right') ]));
  } else {
    navRow.appendChild(el('button', {
      type: 'button',
      class: 'w-full md:w-auto px-6 py-3 bg-green-500 text-white rounded-xl font-bold shadow-lg hover:shadow-xl active:scale-95 transition-all',
      'data-action': 'finish-course'
    }, [ el('span', { text: 'Завершити курс ' }), icon('fa-solid fa-flag-checkered ml-2') ]));
  }

  bottomWrap.appendChild(navRow);
  page.appendChild(bottomWrap);

  dom.content.appendChild(page);
}

function checkAnswer(lessonId, chosenIndex) {
  const module = curriculum.find(m => m.lessons.some(l => l.id === lessonId));
  if (!module) return;
  const lesson = module.lessons.find(l => l.id === lessonId);
  if (!lesson) return;

  const optionsWrap = document.getElementById('quizOptions');
  const feedback = document.getElementById('quizFeedback');
  if (!optionsWrap || !feedback) return;

  const buttons = Array.from(optionsWrap.querySelectorAll('button[role="radio"]'));
  const correctIndex = lesson.quiz.correct;
  const chosenBtn = buttons[chosenIndex];

  buttons.forEach((b, i) => b.setAttribute('aria-checked', String(i === chosenIndex)));
  feedback.classList.remove('hidden');

  buttons.forEach(btn => {
    btn.classList.remove('ring-2','ring-green-500','ring-red-500','bg-green-50','bg-red-50','border-green-500','border-red-500','dark:bg-green-900/30','dark:bg-red-900/30');
    const badge = btn.querySelector('span');
    badge?.classList.remove('bg-green-500','bg-red-500','text-white','border-green-500','border-red-500');
    btn.classList.remove('opacity-60','cursor-not-allowed');
  });

  const mark = (btn, kind) => {
    const badge = btn.querySelector('span');
    if (!badge) return;
    if (kind === 'correct') {
      btn.classList.add('ring-2','ring-green-500','bg-green-50','dark:bg-green-900/30','border-green-500');
      badge.classList.add('bg-green-500','text-white','border-green-500');
    } else {
      btn.classList.add('ring-2','ring-red-500','bg-red-50','dark:bg-red-900/30','border-red-500');
      badge.classList.add('bg-red-500','text-white','border-red-500');
    }
  };

  if (chosenIndex === correctIndex) {
    buttons.forEach(btn => { btn.disabled = true; btn.classList.add('opacity-60','cursor-not-allowed'); });
    if (chosenBtn) {
      chosenBtn.classList.remove('opacity-60','cursor-not-allowed');
      mark(chosenBtn, 'correct');
    }

    feedback.textContent = '';
    feedback.appendChild(icon('fa-regular fa-face-smile text-2xl mb-2 block'));
    feedback.appendChild(document.createTextNode(' Правильно! Ти супер!'));
    feedback.className = "mt-6 p-4 rounded-xl text-center font-bold text-base animate-bounce-in text-green-700 dark:text-green-300 bg-green-100 dark:bg-green-900/20";

    if (typeof window.confetti === 'function') {
      window.confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
    }

    if (!state.completedLessons.includes(lessonId)) {
      state.completedLessons.push(lessonId);
      saveCompleted();
    }
  } else {
    if (chosenBtn) {
      chosenBtn.disabled = true;
      chosenBtn.classList.add('opacity-60','cursor-not-allowed');
      mark(chosenBtn, 'wrong');
    }

    feedback.textContent = '';
    feedback.appendChild(icon('fa-regular fa-face-frown text-2xl mb-2 block'));
    feedback.appendChild(document.createTextNode(' Спробуй ще раз.'));
    feedback.className = "mt-6 p-4 rounded-xl text-center font-bold text-base animate-bounce-in text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-900/20";
  }
}

initTheme();
router.landing();
