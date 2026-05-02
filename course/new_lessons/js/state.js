// Progress persistence is intentionally disabled for shared school computers.
// Session-level UI preferences may be allowed elsewhere, but lesson answers and completion must reset.
export const STORAGE_KEY = "interactive-lesson-v4";
export const MODE_KEY = "lesson-mode-v4";
export const SOUND_KEY = "lesson-sound-v4";

export function loadPersistedState() {
  return {};
}

export function createInitialState(persistedState, lessonData) {
  const activityCompletion = Object.fromEntries(
    lessonData.activities.map((activity) => [activity.id, false])
  );

  return {
    lessonId: lessonData.id || document.body?.dataset?.lessonId || "default",
    mode: persistedState.mode === "teacher" ? "teacher" : "student",
    soundOn: typeof persistedState.soundOn === "boolean" ? persistedState.soundOn : true,
    chooseSelections: persistedState.chooseSelections || {},
    activityState: persistedState.activityState || {},
    quizAnswers: persistedState.quizAnswers || {},
    quizResults: persistedState.quizResults || {},
    reflectionChoice: persistedState.reflectionChoice ?? null,
    completed: {
      ...activityCompletion,
      quiz: false,
      reflection: false,
      ...persistedState.completed
    }
  };
}

export function persistState(state) {
  void state;
}
