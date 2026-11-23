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
  const fitApi = window.KlavioFit;
  const weakApi = window.KlavioWeakKeys;

  if (!fitApi || !weakApi || !data || !metricsApi || !runtime || !layouts || !input || !keyboardApi || !soundApi || !settings) {
    throw new Error("Не вдалося завантажити спільне ядро Клавіо");
  }

  const BROWSER_KEYS = ["Space", "Backspace", "Enter", "AltLeft", "AltRight"];

  const elements = {
    setupView: document.getElementById("setup-view"),
    practiceView: document.getElementById("practice-view"),
    summaryView: document.getElementById("summary-view"),
    setChoices: Array.from(document.querySelectorAll("[data-set]")),
    hintToggle: document.getElementById("hint-toggle"),
    startButton: document.getElementById("start-button"),
    stopButton: document.getElementById("stop-button"),
    restartButton: document.getElementById("restart-button"),
    cpmValue: document.getElementById("cpm-value"),
    summaryWeak: document.getElementById("summary-weak"),
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
    inputLocked: false,
    // Помилки за підписами цілей (лише в пам'яті сторінки) для рядка «Найчастіше помилявся».
    errorCounts: {}
  };

  const keyboard = keyboardApi.create(elements.keyboard, layouts);
  // Підгонка працює лише на екрані вправи (на інших панель прихована).
  const fitter = fitApi.create({ panel: elements.practiceView, keyboard: elements.keyboard });
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

  // Набори залежать від мови друку (УКР / ENG).
  function currentSets() {
    return data.getSets(layouts.getLanguage());
  }

  function selectSet(setId) {
    if (!currentSets()[setId]) return;
    state.selectedSet = setId;

    elements.setChoices.forEach(function (button) {
      button.setAttribute("aria-pressed", String(button.dataset.set === setId));
    });
  }

  function updateKeyboardAvailability() {
    keyboard.setAllowedTargets(currentSets()[state.selectedSet].targets);
  }

  function updateTargetHighlight() {
    elements.keyboard.classList.toggle("has-hint", Boolean(elements.hintToggle.checked));
    keyboard.setHint(state.currentTarget, elements.hintToggle.checked);
  }

  function updateMetrics() {
    elements.accuracyValue.textContent = metricsApi.accuracy(state.metrics) + "%";
    elements.streakValue.textContent = String(state.streak);
    elements.cpmValue.textContent = String(metricsApi.cpm(state.metrics));
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
    const selected = currentSets()[state.selectedSet];
    state.sequence = runtime.buildRound(selected.targets, data.roundLength);
    state.position = 0;
    state.currentTarget = null;
    state.metrics = metricsApi.start(metricsApi.create());
    state.streak = 0;
    state.maxStreak = 0;
    state.errorCounts = {};
    state.running = true;
    state.inputLocked = false;

    keyboard.clearPressed();
    updateKeyboardAvailability();
    updateMetrics();
    updateProgress(0);
    setView("practice");
    fitter.fit();
    fitter.reveal();
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

    // Слабкі клавіші: повертаємо підписи цілей (а не рядки в іншому регістрі).
    const labels = {};
    Object.keys(state.errorCounts).forEach(function (label) { labels[label.toLocaleLowerCase("uk-UA")] = label; });
    const weak = weakApi.weakKeys(state.errorCounts, "", 3).map(function (key) {
      return labels[key.toLocaleLowerCase("uk-UA")] || key;
    });
    elements.summaryWeak.hidden = weak.length === 0;
    elements.summaryWeak.textContent = "Найчастіше помилявся: " + weak.join(", ");

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
    state.errorCounts[state.currentTarget.label] = (state.errorCounts[state.currentTarget.label] || 0) + 1;
    elements.targetKey.classList.remove("is-error");
    void elements.targetKey.offsetWidth;
    elements.targetKey.classList.add("is-error");
    keyboard.flash(event.code, "is-pressed-error", 360);
    updateMetrics();
    tones.error();

    if (input.issue(state.currentTarget.value, event, layouts.getLanguage()) === "layout") {
      elements.layoutWarning.hidden = false;
      setFeedback("");
    } else {
      elements.layoutWarning.hidden = true;
      setFeedback(randomItem(data.retry), "error");
    }
  }

  function handleTrainingKey(event) {
    if (!state.running || state.inputLocked || !state.currentTarget) return;

    const activeElement = document.activeElement;
    if (activeElement && activeElement.closest("button, a, input, label")) return;

    // Ці клавіші браузер перехоплює сам: Alt відкриває меню, Backspace —
    // крок назад, Enter і Пробіл «клацають» елемент у фокусі.
    if (BROWSER_KEYS.includes(event.code)) event.preventDefault();

    if (!input.isTargetAttempt(state.currentTarget, event, layouts)) return;

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
  elements.restartButton.addEventListener("click", startRound);
  elements.hintToggle.addEventListener("change", updateTargetHighlight);

  document.addEventListener("keydown", handleTrainingKey);
  window.addEventListener("beforeunload", function () {
    state.running = false;
  });

  // Підписи карток наборів. Українські беремо з розмітки (запам'ятовуємо при запуску),
  // англійські — з data.js.
  const originalChoices = new Map();
  elements.setChoices.forEach(function (button) {
    originalChoices.set(button, {
      icon: button.querySelector(".choice__icon").textContent,
      label: button.querySelector("strong").textContent,
      description: button.querySelector("small").textContent
    });
  });

  function renderChoices() {
    const language = layouts.getLanguage();
    elements.setChoices.forEach(function (button) {
      const id = button.dataset.set;
      const original = originalChoices.get(button);
      const english = language === "en" ? data.getSets("en")[id] : null;
      button.querySelector(".choice__icon").textContent = data.icons[language][id] || original.icon;
      button.querySelector("strong").textContent = english ? english.label : original.label;
      button.querySelector("small").textContent = english && id !== "controls" && id !== "digits" ? english.description : original.description;
    });
    elements.layoutWarning.textContent = layouts.layoutWarningText();
  }

  // Зміна мови друку без перезавантаження: перебудовуємо клавіатуру й набори,
  // а поточну вправу починаємо заново вже в новій мові.
  function applyLanguage() {
    keyboard.setLanguage();
    renderChoices();
    updateKeyboardAvailability();
    if (state.running) {
      startRound();
    } else {
      updateTargetHighlight();
    }
    fitter.schedule();
  }

  window.addEventListener("klavio:lang-change", applyLanguage);
  window.addEventListener("klavio:prefs-close", function () {
    if (state.running) elements.practiceStage.focus({ preventScroll: true });
  });

  renderChoices();
  selectSet(state.selectedSet);
  setView("setup");
})();
