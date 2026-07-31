(function () {
  "use strict";

  const data = window.KlavioWordsData;
  const core = window.KlavioWordCore;
  const layouts = window.KlavioLayouts;
  const metricsApi = window.KlavioMetrics;
  const runtime = window.KlavioRuntime;
  const settings = window.KlavioSettings;
  const input = window.KlavioInput;
  const keyboardApi = window.KlavioKeyboard;
  const soundApi = window.KlavioSound;

  if (!data || !core || !layouts || !metricsApi || !runtime || !settings || !input || !keyboardApi || !soundApi) {
    throw new Error("Не вдалося завантажити Клавіо — Слова");
  }

  const elements = {
    practice: document.getElementById("practice-view"),
    summary: document.getElementById("summary-view"),
    mode: document.getElementById("mode-control"),
    difficulty: document.getElementById("difficulty-control"),
    restart: document.getElementById("restart-button"),
    stage: document.getElementById("word-stage"),
    stageLabel: document.getElementById("stage-label"),
    done: document.getElementById("target-done"),
    current: document.getElementById("target-current"),
    todo: document.getElementById("target-todo"),
    target: document.getElementById("word-target"),
    next: document.getElementById("next-items"),
    feedback: document.getElementById("word-feedback"),
    warning: document.getElementById("layout-warning"),
    progressLabel: document.getElementById("progress-label"),
    progressFill: document.getElementById("progress-fill"),
    accuracy: document.getElementById("accuracy-value"),
    cpm: document.getElementById("cpm-value"),
    wpm: document.getElementById("wpm-value"),
    keyboard: document.getElementById("virtual-keyboard"),
    sound: document.getElementById("sound-toggle"),
    soundGlyph: document.getElementById("sound-glyph"),
    summaryAccuracy: document.getElementById("summary-accuracy"),
    summaryCpm: document.getElementById("summary-cpm"),
    summaryErrors: document.getElementById("summary-errors"),
    repeat: document.getElementById("summary-repeat")
  };

  const state = {
    mode: "words",
    difficulty: "easy",
    tasks: [],
    taskIndex: 0,
    charIndex: 0,
    metrics: metricsApi.create(),
    running: false,
    locked: false,
    interval: null
  };

  const keyboard = keyboardApi.create(elements.keyboard, layouts);
  const sound = soundApi.create({
    button: elements.sound,
    glyph: elements.soundGlyph,
    settings,
    onChange: function () {
      if (state.running) elements.stage.focus({ preventScroll: true });
    }
  });
  const tones = runtime.createTonePlayer(sound.isEnabled);

  function currentTask() {
    return state.tasks[state.taskIndex] || "";
  }

  function currentCharacter() {
    return currentTask()[state.charIndex] || "";
  }

  function buildControls() {
    data.difficulties.forEach(function (item) {
      const button = document.createElement("button");
      button.type = "button";
      button.dataset.difficulty = item.id;
      button.textContent = item.label;
      button.addEventListener("click", function () {
        state.difficulty = item.id;
        restart();
      });
      elements.difficulty.appendChild(button);
    });

    elements.mode.querySelectorAll("button").forEach(function (button) {
      button.addEventListener("click", function () {
        state.mode = button.dataset.mode;
        restart();
      });
    });
  }

  function updateControls() {
    elements.mode.querySelectorAll("button").forEach(function (button) {
      button.setAttribute("aria-pressed", String(button.dataset.mode === state.mode));
    });
    elements.difficulty.querySelectorAll("button").forEach(function (button) {
      button.setAttribute("aria-pressed", String(button.dataset.difficulty === state.difficulty));
    });
  }

  function pool() {
    return state.mode === "sentences" ? data.sentences[state.difficulty] : data.pools[state.difficulty];
  }

  function createTasks() {
    return runtime.buildRound(pool(), state.mode === "words" ? 18 : 5);
  }

  function updateTarget() {
    const parts = core.targetParts(currentTask(), state.charIndex);
    elements.done.textContent = parts.done;
    elements.current.textContent = parts.current === " " ? "\u00a0" : parts.current;
    elements.todo.textContent = parts.todo;
    elements.target.classList.toggle("is-sentence", state.mode === "sentences");
    elements.stageLabel.textContent = state.mode === "sentences" ? "Друкуй речення" : "Друкуй слово";
    elements.next.textContent = "";

    state.tasks.slice(state.taskIndex + 1, state.taskIndex + (state.mode === "words" ? 4 : 3)).forEach(function (task) {
      const chip = document.createElement("span");
      chip.textContent = task;
      elements.next.appendChild(chip);
    });

    elements.keyboard.classList.add("has-hint");
    keyboard.setHint(currentCharacter(), true);
    elements.stage.setAttribute("aria-label", "Введіть символ: " + (parts.current === " " ? "пробіл" : parts.current));
  }

  function updateProgress() {
    const total = state.tasks.length;
    elements.progressLabel.textContent = Math.min(state.taskIndex + 1, total) + " / " + total;
    elements.progressFill.style.width = (total ? state.taskIndex / total * 100 : 0) + "%";
  }

  function updateMetrics() {
    elements.accuracy.textContent = metricsApi.accuracy(state.metrics) + "%";
    elements.cpm.textContent = String(metricsApi.cpm(state.metrics));
    elements.wpm.textContent = String(metricsApi.wpm(state.metrics));
  }

  function feedback(message, kind) {
    elements.feedback.textContent = message;
    elements.feedback.className = kind ? "is-" + kind : "";
  }

  function stopTimer() {
    if (state.interval) window.clearInterval(state.interval);
    state.interval = null;
  }

  function restart() {
    stopTimer();
    state.tasks = createTasks();
    state.taskIndex = 0;
    state.charIndex = 0;
    state.metrics = metricsApi.create();
    state.running = true;
    state.locked = false;
    updateControls();
    updateTarget();
    updateProgress();
    updateMetrics();
    feedback("Починай, коли готовий");
    elements.warning.hidden = true;
    elements.practice.hidden = false;
    elements.summary.hidden = true;
    elements.stage.focus({ preventScroll: true });
  }

  function completeTask() {
    state.locked = true;
    tones.correct();
    feedback("Готово", "success");
    state.taskIndex += 1;
    state.charIndex = 0;
    updateProgress();

    if (state.taskIndex >= state.tasks.length) {
      window.setTimeout(showSummary, 220);
      return;
    }

    window.setTimeout(function () {
      state.locked = false;
      updateTarget();
      feedback("Продовжуй у своєму темпі");
      elements.stage.focus({ preventScroll: true });
    }, 170);
  }

  function showSummary() {
    state.running = false;
    state.locked = true;
    stopTimer();
    metricsApi.finish(state.metrics);
    elements.summaryAccuracy.textContent = metricsApi.accuracy(state.metrics) + "%";
    elements.summaryCpm.textContent = String(metricsApi.cpm(state.metrics));
    elements.summaryErrors.textContent = String(state.metrics.errors);
    elements.practice.hidden = true;
    elements.summary.hidden = false;
    tones.complete();
    elements.repeat.focus();
  }

  function handleCorrect(event) {
    metricsApi.recordCorrect(state.metrics);
    state.charIndex += 1;
    elements.warning.hidden = true;
    elements.stage.classList.remove("is-error");
    keyboard.flash(event.code, "is-pressed-correct", 180);
    updateMetrics();

    if (state.charIndex >= currentTask().length) completeTask();
    else {
      updateTarget();
      feedback("Правильно", "success");
    }
  }

  function handleError(event, expected) {
    metricsApi.recordError(state.metrics);
    elements.stage.classList.remove("is-error");
    void elements.stage.offsetWidth;
    elements.stage.classList.add("is-error");
    keyboard.flash(event.code, "is-pressed-error", 180);
    tones.error();
    updateMetrics();

    const problem = input.issue(expected, event);
    elements.warning.hidden = problem !== "layout";
    feedback(
      problem === "case" ? "Зверни увагу на велику літеру" :
        problem === "layout" ? "Зараз увімкнено іншу розкладку" : "Спробуй ще раз",
      "error"
    );
  }

  function handleKey(event) {
    if (!state.running || state.locked || !input.isTextAttempt(event)) return;
    const active = document.activeElement;
    if (active && active.closest("button,a,select,input")) return;
    if (event.code === "Space") event.preventDefault();

    if (!state.metrics.startedAt) {
      metricsApi.start(state.metrics);
      state.interval = window.setInterval(updateMetrics, 1000);
    }

    const expected = currentCharacter();
    if (input.matchesCharacter(expected, event)) handleCorrect(event);
    else handleError(event, expected);
  }

  elements.restart.addEventListener("click", restart);
  elements.repeat.addEventListener("click", restart);
  document.addEventListener("keydown", handleKey);
  window.addEventListener("beforeunload", stopTimer);

  buildControls();
  restart();
})();
