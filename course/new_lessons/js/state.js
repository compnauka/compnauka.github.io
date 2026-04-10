export const STORAGE_KEY = "interactive-lesson-v4";
export const MODE_KEY = "lesson-mode-v4";
export const SOUND_KEY = "lesson-sound-v4";

export function loadPersistedState() {
  localStorage.removeItem(STORAGE_KEY);
  return {};
}

export function createInitialState(persistedState) {
  return {
    mode: localStorage.getItem(MODE_KEY) || "student",
    soundOn: localStorage.getItem(SOUND_KEY) !== "off",
    chooseSelections: persistedState.chooseSelections || {},
    activityState: persistedState.activityState || {},
    quizAnswers: persistedState.quizAnswers || {},
    reflectionChoice: persistedState.reflectionChoice ?? null,
    completed: {
      draw: false,
      classify: false,
      truefalse: false,
      pick: false,
      fill: false,
      scenarios: false,
      quiz: false,
      reflection: false,
      ...persistedState.completed
    }
  };
}

export function persistState(state) {
  void state;
}
