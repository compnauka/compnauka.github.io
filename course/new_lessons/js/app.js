import { createLessonData } from "./lesson-data.js";
import { createInitialState, loadPersistedState } from "./state.js";
import { lessonCatalog, resolveLessonConfig } from "./lessons/catalog.js";
import {
  applyMode,
  createFeedbackController,
  escapeHtml,
  registerServiceWorker,
  renderRichText,
  syncSoundToggle,
  toggleMode,
  toggleSound,
  updateProgress
} from "./shared.js";
import { renderOverview, renderSections } from "./sections.js";
import { createActivityRegistry } from "./activity-registry.js";
import { renderQuiz, setupQuiz } from "./quiz.js";
import { renderReflection, setupReflection } from "./reflection.js";

const selectedLessonId = document.body.dataset.lessonId
  || new URLSearchParams(window.location.search).get("lesson")
  || lessonCatalog[0].id;
const selectedLesson = resolveLessonConfig(selectedLessonId);
const lessonData = createLessonData(selectedLesson.template);
const state = createInitialState(loadPersistedState(), lessonData);

const refs = {
  body: document.body,
  title: document.getElementById("lesson-title"),
  studentHook: document.getElementById("lesson-student-hook"),
  teacherOverview: document.getElementById("lesson-teacher-overview"),
  studentMeta: document.getElementById("lesson-student-meta"),
  teacherMeta: document.getElementById("lesson-teacher-meta"),
  goal: document.getElementById("lesson-goal"),
  goalNote: document.getElementById("goal-note"),
  objectives: document.getElementById("learning-objectives"),
  overviewSection: document.getElementById("overview-section"),
  overviewLabel: document.getElementById("overview-label"),
  overviewTitle: document.getElementById("overview-title"),
  overview: document.getElementById("overview-container"),
  sections: document.getElementById("sections-container"),
  activities: document.getElementById("activities-container"),
  quizForm: document.getElementById("quiz-form"),
  quizResult: document.getElementById("quiz-result"),
  reflection: document.getElementById("reflection-container"),
  progressBar: document.getElementById("progress-bar"),
  progressLabel: document.getElementById("progress-label"),
  lessonSelect: document.getElementById("lesson-select"),
  modeStudent: document.getElementById("mode-student"),
  modeTeacher: document.getElementById("mode-teacher"),
  soundToggle: document.getElementById("sound-toggle"),
  toast: document.getElementById("feedback-toast"),
  toastIcon: document.getElementById("feedback-icon"),
  toastMessage: document.getElementById("feedback-message"),
  live: document.getElementById("live-region")
};

const showFeedback = createFeedbackController(state, refs);
const activityById = new Map(lessonData.activities.map((activity) => [activity.id, activity]));
const activityRegistry = createActivityRegistry(state, refs, showFeedback);

document.addEventListener("DOMContentLoaded", async () => {
  bindGlobalEvents();
  renderApp();
  await registerServiceWorker(showFeedback);
});

function bindGlobalEvents() {
  refs.lessonSelect.addEventListener("change", () => switchLesson(refs.lessonSelect.value));
  refs.modeStudent.addEventListener("click", () => toggleMode("student", state, refs));
  refs.modeTeacher.addEventListener("click", () => toggleMode("teacher", state, refs));
  refs.soundToggle.addEventListener("click", () => toggleSound(state, refs));
}

function renderApp() {
  renderStaticContent();
  renderOverview(refs.overview, lessonData.overview, {
    section: refs.overviewSection,
    label: refs.overviewLabel,
    title: refs.overviewTitle
  });
  renderSections(refs.sections, lessonData.sections);
  renderActivities();
  renderQuiz(lessonData.quiz, state, refs.quizForm);
  setupQuiz(lessonData.quiz, state, refs, showFeedback);
  document.getElementById("check-quiz").onclick = refs.checkQuizHandler;
  document.getElementById("reset-quiz").onclick = refs.resetQuizHandler;
  renderReflection(lessonData.reflection, state, refs.reflection);
  setupReflection(lessonData.reflection, state, refs, showFeedback);
  updateProgress(state, refs);
}

function renderStaticContent() {
  document.title = `Інтерактивний урок | ${lessonData.title}`;
  refs.title.textContent = lessonData.title;
  refs.studentHook.textContent = lessonData.studentHook;
  refs.teacherOverview.innerHTML = renderRichText(lessonData.teacherOverview);
  refs.goal.textContent = lessonData.goal;
  refs.goalNote.innerHTML = lessonData.goalNote ? renderRichText(lessonData.goalNote) : "";
  refs.goalNote.hidden = !lessonData.goalNote;
  refs.studentMeta.innerHTML = lessonData.studentMeta.map((item) => `<span class="meta-chip">${escapeHtml(item)}</span>`).join("");
  refs.teacherMeta.innerHTML = lessonData.teacherMeta.map((item) => `<span class="meta-chip">${escapeHtml(item)}</span>`).join("");
  refs.objectives.innerHTML = lessonData.objectives.map((item) => `<li>${escapeHtml(item)}</li>`).join("");
  refs.lessonSelect.innerHTML = lessonCatalog
    .map((lesson) => `<option value="${escapeHtml(lesson.id)}">${escapeHtml(lesson.label)}</option>`)
    .join("");
  refs.lessonSelect.value = selectedLesson.id;
  applyMode(state, refs);
  syncSoundToggle(state, refs);
}

function switchLesson(nextLessonId) {
  const nextLesson = resolveLessonConfig(nextLessonId);
  if (nextLesson.url) {
    const target = new URL(nextLesson.url, window.location.href);
    window.location.assign(target.toString());
    return;
  }

  const fallbackUrl = new URL(window.location.href);
  fallbackUrl.searchParams.set("lesson", nextLesson.id);
  window.location.assign(fallbackUrl.toString());
}

function renderActivities() {
  refs.activities.innerHTML = lessonData.activities
    .map((activity) => `<div data-activity-slot="${activity.id}"></div>`)
    .join("");

  lessonData.activities.forEach((activity) => renderActivity(activity.id));
}

function renderActivity(activityId, focusSelector = null) {
  const activity = activityById.get(activityId);
  const slot = refs.activities.querySelector(`[data-activity-slot="${activityId}"]`);

  if (!activity || !slot) return;

  const entry = activityRegistry[activity.type];
  if (!entry) {
    slot.innerHTML = `
      <article class="task-card">
        <p class="task-feedback is-danger">Для цього типу завдання ще не підключено рендерер.</p>
      </article>
    `;
    return;
  }

  slot.innerHTML = entry.render(activity, state);
  entry.setup(activity, (selector) => renderActivity(activityId, selector));

  if (focusSelector) {
    requestAnimationFrame(() => {
      const focusTarget = slot.querySelector(focusSelector);
      if (focusTarget instanceof HTMLElement) {
        focusTarget.focus();
      }
    });
  }
}
