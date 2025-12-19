import { curriculum as rawCurriculum } from './data.js';
import { debounce, safeHttpUrl } from './utils.js';
import { renderLanding, renderHome, renderLessonView } from './renderers.js';
import { checkAnswer } from './quiz.js';

function normalizeCurriculum(curr) {
  return curr.map(m => ({
    ...m,
    lessons: m.lessons.map(l => ({
      id: String(l.id),
      title: String(l.title ?? l.id)
    }))
  }));
}

function loadCompleted(allLessonIds) {
  try {
    const raw = JSON.parse(localStorage.getItem('cs_completed') || '[]');
    if (!Array.isArray(raw)) return [];
    return raw.filter(id => typeof id === 'string' && allLessonIds.has(id));
  } catch {
    return [];
  }
}

export function initApp() {
  const curriculum = normalizeCurriculum(rawCurriculum);
  const allLessonIds = new Set(curriculum.flatMap(m => m.lessons.map(l => l.id)));

  const dom = {
    content: document.getElementById('contentArea'),
    headerTitle: document.getElementById('headerTitle'),
    backBtn: document.getElementById('backBtn'),
    themeToggle: document.getElementById('themeToggle')
  };

  const state = {
    currentView: 'landing',
    activeModuleId: null,
    activeLessonId: null,
    completedLessons: loadCompleted(allLessonIds),
    searchQuery: '',
    lessonContentById: new Map(),
    currentLessonContent: null
  };

  const ctx = { dom, state, curriculum };

  // sync aria-pressed to actual class changes
  if (dom.themeToggle) {
    const sync = () => dom.themeToggle.setAttribute('aria-pressed', String(document.documentElement.classList.contains('dark')));
    sync();
    const mo = new MutationObserver(sync);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
  }

  const router = {
    landing: () => renderLanding(ctx),
    home: (opts) => renderHome(ctx, opts),
    lesson: (id) => { void renderLessonView(ctx, id); }
  };

  // back button = home
  dom.backBtn.addEventListener('click', () => router.home());

  // CLICK delegation
  dom.content.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;

    const action = btn.getAttribute('data-action');
    if (!action) return;

    if (action === 'go-home') return router.home();

    if (action === 'toggle-module') {
      const id = Number(btn.getAttribute('data-module-id'));
      state.activeModuleId = (state.activeModuleId === id) ? null : id;
      return router.home();
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
      if (lessonId && Number.isFinite(idx)) {
        return checkAnswer({ lessonId, ctx, chosenIndex: idx });
      }
    }

    if (action === 'open-video') {
      const url = btn.getAttribute('data-video-url');
      const safe = url ? safeHttpUrl(url) : null;
      if (!safe) return;
      window.open(safe, '_blank', 'noopener,noreferrer');
      return;
    }
  });

  // INPUT delegation (search)
  const doSearch = debounce((value) => {
    state.searchQuery = value;
    router.home({ keepSearchFocus: true });
  }, 120);

  dom.content.addEventListener('input', (e) => {
    const t = e.target;
    if (t instanceof HTMLInputElement && t.id === 'searchInput') doSearch(t.value);
  });

  // Keyboard: video "button" + quiz radiogroup arrows
  dom.content.addEventListener('keydown', (e) => {
    const openVideo = e.target.closest?.('[data-action="open-video"][role="button"]');
    if (openVideo && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      openVideo.click();
      return;
    }

    const rg = e.target.closest?.('[data-quiz-radiogroup="true"]');
    if (!rg) return;

    const buttons = Array.from(rg.querySelectorAll('button[role="radio"]'));
    if (!buttons.length) return;

    const currentIndex = buttons.findIndex(b => b === document.activeElement);

    const move = (nextIdx) => {
      const clamped = (nextIdx + buttons.length) % buttons.length;
      buttons[clamped].focus();
    };

    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
      e.preventDefault();
      move(currentIndex === -1 ? 0 : currentIndex + 1);
    } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
      e.preventDefault();
      move(currentIndex === -1 ? 0 : currentIndex - 1);
    } else if (e.key === 'Home') {
      e.preventDefault();
      buttons[0].focus();
    } else if (e.key === 'End') {
      e.preventDefault();
      buttons[buttons.length - 1].focus();
    } else if (e.key === 'Enter' || e.key === ' ') {
      if (document.activeElement?.getAttribute('role') === 'radio') {
        e.preventDefault();
        document.activeElement.click();
      }
    }
  });

  // Init route
  router.landing();
}
