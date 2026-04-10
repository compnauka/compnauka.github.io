import { createLessonData } from "./lesson-data.js";
import { createInitialState, loadPersistedState } from "./state.js";
import {
  applyMode,
  createFeedbackController,
  escapeHtml,
  registerServiceWorker,
  syncSoundToggle,
  toggleMode,
  toggleSound,
  updateProgress
} from "./shared.js";
import { renderSections } from "./sections.js";
import { renderDrawTask, setupDrawTask } from "./task-draw.js";
import { renderClassifyTask, setupClassifyTask } from "./task-classify.js";
import { renderTrueFalseTask, setupTrueFalseTask } from "./task-truefalse.js";
import { renderPickTask, setupPickTask } from "./task-pick.js";
import { renderFillTask, setupFillTask } from "./task-fill.js";
import { renderScenariosTask, setupScenariosTask } from "./task-scenarios.js";
import { renderQuiz, setupQuiz } from "./quiz.js";
import { renderReflection, setupReflection } from "./reflection.js";

const lessonData = createLessonData();
const state = createInitialState(loadPersistedState());

const refs = {
  body: document.body,
  title: document.getElementById("lesson-title"),
  summary: document.getElementById("lesson-summary"),
  meta: document.getElementById("lesson-meta"),
  goal: document.getElementById("lesson-goal"),
  goalNote: document.getElementById("goal-note"),
  objectives: document.getElementById("learning-objectives"),
  sections: document.getElementById("sections-container"),
  activities: document.getElementById("activities-container"),
  quizForm: document.getElementById("quiz-form"),
  quizResult: document.getElementById("quiz-result"),
  reflection: document.getElementById("reflection-container"),
  progressBar: document.getElementById("progress-bar"),
  progressLabel: document.getElementById("progress-label"),
  modeStudent: document.getElementById("mode-student"),
  modeTeacher: document.getElementById("mode-teacher"),
  soundToggle: document.getElementById("sound-toggle"),
  toast: document.getElementById("feedback-toast"),
  toastIcon: document.getElementById("feedback-icon"),
  toastMessage: document.getElementById("feedback-message"),
  live: document.getElementById("live-region")
};

const showFeedback = createFeedbackController(state, refs);

document.addEventListener("DOMContentLoaded", async () => {
  bindGlobalEvents();
  renderApp();
  await registerServiceWorker();
});

function bindGlobalEvents() {
  refs.modeStudent.addEventListener("click", () => toggleMode("student", state, refs));
  refs.modeTeacher.addEventListener("click", () => toggleMode("teacher", state, refs));
  refs.soundToggle.addEventListener("click", () => toggleSound(state, refs));
}

function renderApp() {
  refs.title.textContent = lessonData.title;
  refs.summary.textContent = lessonData.summary;
  refs.goal.textContent = lessonData.goal;
  refs.goalNote.textContent = lessonData.goalNote;
  refs.meta.innerHTML = lessonData.meta.map((item) => `<span class="meta-chip">${escapeHtml(item)}</span>`).join("");
  refs.objectives.innerHTML = lessonData.objectives.map((item) => `<li>${escapeHtml(item)}</li>`).join("");
  applyMode(state, refs);
  syncSoundToggle(state, refs);
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

function renderActivities() {
  refs.activities.innerHTML = lessonData.activities.map((activity) => {
    if (activity.type === "draw") return renderDrawTask(activity, state);
    if (activity.type === "classify") return renderClassifyTask(activity, state);
    if (activity.type === "truefalse") return renderTrueFalseTask(activity, state);
    if (activity.type === "pick") return renderPickTask(activity, state);
    if (activity.type === "fill") return renderFillTask(activity, state);
    if (activity.type === "scenarios") return renderScenariosTask(activity, state);
    return "";
  }).join("");

  lessonData.activities.forEach((activity) => {
    if (activity.type === "draw") setupDrawTask(activity, state, refs, showFeedback);
    if (activity.type === "classify") setupClassifyTask(activity, state, refs, showFeedback, renderActivities);
    if (activity.type === "truefalse") setupTrueFalseTask(activity, state, refs, showFeedback, renderActivities);
    if (activity.type === "pick") setupPickTask(activity, state, refs, showFeedback, renderActivities);
    if (activity.type === "fill") setupFillTask(activity, state, refs, showFeedback);
    if (activity.type === "scenarios") setupScenariosTask(activity, state, refs, showFeedback, renderActivities);
  });
}
