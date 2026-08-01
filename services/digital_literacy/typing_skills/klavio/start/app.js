(function () {
  "use strict";

  const data = window.KlavioStartData;
  const metricsApi = window.KlavioMetrics;
  const runtime = window.KlavioRuntime;
  const layouts = window.KlavioLayouts;
  const input = window.KlavioInput;
  const keyboardApi = window.KlavioKeyboard;
  const soundApi = window.KlavioSound;
  const settings = window.KlavioSettings;

  if (!data || !metricsApi || !runtime || !layouts || !input || !keyboardApi || !soundApi || !settings) {
    throw new Error("Не вдалося завантажити спільне ядро Клавіо");
  }

  const elements = {
    setupView: document.getElementById("setup-view"),
    practiceView: document.getElementById("practice-view"),
    summaryView: document.getElementById("summary-view"),
    setChoices: Array.from(document.querySelectorAll("[data-set]")),
    hintToggle: document.getElementById("hint-toggle"),
    startButton: document.getElementById("start-button"),
    stopButton: document.getElementById("stop-button"),
    repeatButton: document.getElementById("repeat-button"),
    settingsButton: document.getElementById("settings-button"),
    soundToggle: document.getElementById("sound-toggle"),
    soundGlyph: document.getElementById("sound-glyph"),
    practiceStage: document.getElementById("practice-stage"),
    targetKey: document.getElementById("target-key"),
    feedback: document.getElementById("practice-feedback"),
    layoutWarning: document.getElementById("layout-warning"),
    keyboard: document.getElementById("virtual-keyboard"),
    progressLabel: document.getElementById("progress-label"),
    progressFill: document.getElementById("progress-fill"),
    accuracyValue: document.getElementById("accuracy-value"),
    streakValue: document.getElementById("streak-value"),
    summaryCorrect: document.getElementById("summary-correct"),
    summaryErrors: document.getElementById("summary-errors"),
    summaryAccuracy: document.getElementById("summary-accuracy"),
    summaryMessage: document.getElementById("summary-message")
  };

  const state = {
    selectedSet: "starter",
    sequence: [],
    position: 0,
    currentTarget: null,
    metrics: metricsApi.create(),
    streak: 0,
    maxStreak: 0,
    running: false,
    inputLocked: false
  };

  const keyboard = keyboardApi.create(elements.keyboard, layouts);
  const sound = soundApi.create({
    button: elements.soundToggle,
    glyph: elements.soundGlyph,
    settings,
    onChange: function () {
      if (state.running) elements.practiceStage.focus({ preventScroll: true });
    }
  });
  const tones = runtime.createTonePlayer(sound.isEnabled);

  function randomItem(items) {
    return items[Math.floor(Math.random() * items.length)];
  }

  function setView(name) {
    elements.setupView.hidden = name !== "setup";
    elements.practiceView.hidden = name !== "practice";
    elements.summaryView.hidden = name !== "summary";
  }

  function selectSet(setId) {
    if (!data.sets[setId]) return;
    state.selectedSet = setId;

    elements.setChoices.forEach(function (button) {
      button.setAttribute("aria-pressed", String(button.dataset.set === setId));
    });
  }

  function updateKeyboardAvailability() {
    keyboard.setAllowedTargets(data.sets[state.selectedSet].targets);
  }

  function updateTargetHighlight() {
    elements.keyboard.classList.toggle("has-hint", Boolean(elements.hintToggle.checked));
    keyboard.setHint(state.currentTarget, elements.hintToggle.checked);
  }

  function updateMetrics() {
    elements.accuracyValue.textContent = metricsApi.accuracy(state.metrics) + "%";
    elements.streakValue.textContent = String(state.streak);
  }

  function updateProgress(completed) {
    const total = state.sequence.length || data.roundLength;
    const safeCompleted = Math.min(total, Math.max(0, completed));
    elements.progressLabel.textContent = safeCompleted + " / " + total;
    elements.progressFill.style.width = ((safeCompleted / total) * 100) + "%";
  }

  function setFeedback(message, kind) {
    elements.feedback.textContent = message;
    elements.feedback.className = "practice-feedback";
    if (kind) elements.feedback.classList.add("is-" + kind);
  }

  function renderTarget() {
    const target = state.sequence[state.position];
    state.currentTarget = target;
    state.inputLocked = false;

    elements.targetKey.textContent = target.label;
    elements.targetKey.className = "target-key";
    if (target.label.length > 2) elements.targetKey.classList.add("target-key--word");

    elements.layoutWarning.hidden = true;
    setFeedback(elements.hintToggle.checked ? "Підказка світиться на клавіатурі" : "Спробуй знайти клавішу без підказки");
    updateTargetHighlight();
    elements.practiceStage.focus({ preventScroll: true });
  }

  function startRound() {
    const selected = data.sets[state.selectedSet];
    state.sequence = runtime.buildRound(selected.targets, data.roundLength);
    state.position = 0;
    state.currentTarget = null;
    state.metrics = metricsApi.start(metricsApi.create());
    state.streak = 0;
    state.maxStreak = 0;
    state.running = true;
    state.inputLocked = false;

    keyboard.clearPressed();
    updateKeyboardAvailability();
    updateMetrics();
    updateProgress(0);
    setView("practice");
    renderTarget();
  }

  function showSetup() {
    state.running = false;
    state.inputLocked = false;
    state.currentTarget = null;
    keyboard.clearPressed();
    setView("setup");
    elements.startButton.focus();
  }

  function finishRound() {
    state.running = false;
    state.inputLocked = true;
    metricsApi.finish(state.metrics);

    elements.summaryCorrect.textContent = String(state.metrics.correct);
    elements.summaryErrors.textContent = String(state.metrics.errors);
    elements.summaryAccuracy.textContent = metricsApi.accuracy(state.metrics) + "%";

    if (state.metrics.errors === 0) {
      elements.summaryMessage.textContent = "Усі клавіші знайдено без помилок. Чудова уважність!";
    } else if (metricsApi.accuracy(state.metrics) >= 80) {
      elements.summaryMessage.textContent = "Гарна робота. Ще одна спроба — і клавіші запам’ятаються ще краще.";
    } else {
      elements.summaryMessage.textContent = "Не поспішай: дивись на підказку й знаходь кожну клавішу спокійно.";
    }

    tones.complete();
    setView("summary");
    elements.repeatButton.focus();
  }

  function handleCorrect(event) {
    state.inputLocked = true;
    metricsApi.recordCorrect(state.metrics);
    state.streak += 1;
    state.maxStreak = Math.max(state.maxStreak, state.streak);

    elements.layoutWarning.hidden = true;
    elements.targetKey.classList.add("is-correct");
    setFeedback(randomItem(data.encouragement), "success");
    keyboard.flash(event.code, "is-pressed-correct", 360);
    updateMetrics();
    updateProgress(state.position + 1);
    tones.correct();

    if (state.position + 1 >= state.sequence.length) {
      window.setTimeout(finishRound, 420);
      return;
    }

    window.setTimeout(function () {
      state.position += 1;
      renderTarget();
    }, 330);
  }

  function handleError(event) {
    metricsApi.recordError(state.metrics);
    state.streak = 0;
    elements.targetKey.classList.remove("is-error");
    void elements.targetKey.offsetWidth;
    elements.targetKey.classList.add("is-error");
    keyboard.flash(event.code, "is-pressed-error", 360);
    updateMetrics();
    tones.error();

    if (input.issue(state.currentTarget.value, event) === "layout") {
      elements.layoutWarning.hidden = false;
      setFeedback("");
    } else {
      elements.layoutWarning.hidden = true;
      setFeedback(randomItem(data.retry), "error");
    }
  }

  function handleTrainingKey(event) {
    if (!state.running || state.inputLocked || !state.currentTarget) return;
    if (!input.isTargetAttempt(state.currentTarget, event, layouts)) return;

    const activeElement = document.activeElement;
    if (activeElement && activeElement.closest("button, a, input, label")) return;

    if (["Space", "Backspace", "Enter", "ShiftLeft", "ShiftRight"].includes(event.code)) {
      event.preventDefault();
    }

    if (input.matchesTarget(state.currentTarget, event, layouts)) {
      handleCorrect(event);
    } else {
      handleError(event);
    }
  }

  elements.setChoices.forEach(function (button) {
    button.addEventListener("click", function () {
      selectSet(button.dataset.set);
    });
  });

  elements.startButton.addEventListener("click", startRound);
  elements.repeatButton.addEventListener("click", startRound);
  elements.settingsButton.addEventListener("click", showSetup);
  elements.stopButton.addEventListener("click", showSetup);
  elements.hintToggle.addEventListener("change", updateTargetHighlight);

  document.addEventListener("keydown", handleTrainingKey);
  window.addEventListener("beforeunload", function () {
    state.running = false;
  });

  selectSet(state.selectedSet);
  setView("setup");
})();
