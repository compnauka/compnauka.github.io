import { bookSections } from './bookSections.js';
import { saveProgress, loadSavedIndex } from './storage.js';
import { initMenu } from './menu.js';
import { renderNav } from './navigation.js';
import { appendMessage } from './renderers.js';
import { validateSections } from './validator.js';

// ---------- INIT ----------

const errors = validateSections(bookSections);
if (errors.length) {
  console.warn('[bookSections] Помилки валідації:\n' + errors.join('\n'));
}

const sectionKeys = Object.keys(bookSections);
let currentSectionIndex = 0;
let messageTimers = [];

// ---------- DOM ----------

const chatWindow     = document.getElementById('chatWindow');
const appMain        = document.getElementById('main-content');
const navContainer   = document.getElementById('navContainer');
const prevBtn        = document.getElementById('prevBtn');
const nextBtn        = document.getElementById('nextBtn');
const pageIndicator  = document.getElementById('pageIndicator');
const totalPages     = document.getElementById('totalPages');
const menuBtn        = document.getElementById('menuBtn');
const closeMenuBtn   = document.getElementById('closeMenuBtn');
const sidebar        = document.getElementById('sidebar');
const overlay        = document.getElementById('overlay');
const bottomNav      = document.getElementById('bottomNav');
const a11yAnnouncer  = document.getElementById('a11y-announcer');

totalPages.textContent = sectionKeys.length;

// ---------- MENU ----------

const { close: closeMenu } = initMenu({ menuBtn, closeMenuBtn, sidebar, overlay });

// ---------- PROGRESS ----------

function saveAndUpdateProgress(index) {
  currentSectionIndex = index;
  saveProgress(index);
}

// ---------- TIMERS ----------

function clearMessageTimers() {
  messageTimers.forEach(id => clearTimeout(id));
  messageTimers = [];
}

// ---------- SECTION LOAD ----------

function loadSection(index) {
  // Exit-анімація якщо розділ вже завантажений
  if (chatWindow.children.length > 0) {
    clearMessageTimers();
    chatWindow.classList.add('chat-window--exit');
    const id = setTimeout(() => _renderSection(index), 180);
    messageTimers.push(id);
    return;
  }
  _renderSection(index);
}

function _renderSection(index) {
  chatWindow.classList.remove('chat-window--exit');
  chatWindow.classList.add('chat-window--enter');
  chatWindow.addEventListener('animationend', () => {
    chatWindow.classList.remove('chat-window--enter');
  }, { once: true });

  clearMessageTimers();
  saveAndUpdateProgress(index);

  const sectionKey = sectionKeys[index];
  const data = bookSections[sectionKey];

  // Bottom nav + chat padding — обкладинка без нижньої панелі
  if (index === 0) {
    bottomNav.classList.add('bottom-nav--hidden');
    chatWindow.classList.add('chat-window--cover');
  } else {
    bottomNav.classList.remove('bottom-nav--hidden');
    chatWindow.classList.remove('chat-window--cover');
  }

  // Buttons + indicator
  pageIndicator.textContent = index + 1;
  prevBtn.disabled = index === 0;
  nextBtn.disabled = index === sectionKeys.length - 1;

  // Clear chat
  chatWindow.innerHTML = '';
  appMain.scrollTop = 0;

  // Announce section to screen readers (replaces aria-live on chatWindow)
  a11yAnnouncer.textContent = '';
  requestAnimationFrame(() => {
    a11yAnnouncer.textContent = index === 0 ? 'Обкладинка' : `Розділ: ${data.title}`;
  });

  // Nav highlight
  renderNav({
    navContainer,
    bookSections,
    sectionKeys,
    currentIndex: index,
    onSelect: (i) => {
      loadSection(i);
      closeMenu();
    }
  });

  // Section heading (skip cover)
  if (index !== 0) {
    const titleDiv = document.createElement('div');
    titleDiv.className = 'section-heading';
    const h2 = document.createElement('h2');
    h2.className = 'section-heading__title';
    h2.textContent = data.title;
    titleDiv.appendChild(h2);
    chatWindow.appendChild(titleDiv);
  }

  // Staggered messages
  // Повільніший темп: дітям легше встигати читати репліки.
  // При prefers-reduced-motion всі повідомлення з'являються одразу.
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const MESSAGE_DELAY_MS = prefersReducedMotion ? 0 : 650;
  let delay = prefersReducedMotion ? 0 : 150;

  data.messages.forEach((msg) => {
    const id = setTimeout(() => {
      appendMessage(msg, chatWindow, () => nextBtn.click());
    }, delay);
    messageTimers.push(id);
    delay += MESSAGE_DELAY_MS;
  });

  // Random quiz
  if (data.quizzes && data.quizzes.length > 0) {
    const quiz = data.quizzes[Math.floor(Math.random() * data.quizzes.length)];
    const id = setTimeout(() => {
      appendMessage({ type: 'quiz', content: quiz }, chatWindow);
    }, delay + 450);
    messageTimers.push(id);
  }
}

// ---------- NAVIGATION ----------

prevBtn.addEventListener('click', () => {
  if (currentSectionIndex > 0) loadSection(currentSectionIndex - 1);
});

nextBtn.addEventListener('click', () => {
  if (currentSectionIndex < sectionKeys.length - 1) loadSection(currentSectionIndex + 1);
});

// ---------- START ----------

loadSection(loadSavedIndex(sectionKeys.length));
