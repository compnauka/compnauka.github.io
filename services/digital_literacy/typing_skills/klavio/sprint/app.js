(function () {
  "use strict";

  const data = window.KlavioSprintData;
  const core = window.KlavioSprintCore;
  const layouts = window.KlavioLayouts;
  const input = window.KlavioInput;
  const metricsApi = window.KlavioMetrics;
  const runtime = window.KlavioRuntime;
  const keyboardApi = window.KlavioKeyboard;
  const soundApi = window.KlavioSound;
  const settings = window.KlavioSettings;

  if (!data || !core || !layouts || !input || !metricsApi || !runtime || !keyboardApi || !soundApi || !settings) {
    throw new Error("Не вдалося завантажити Клавіо — Спринт");
  }

  const elements = {
    gameView: document.getElementById("game-view"),
    summary: document.getElementById("summary-view"),
    mode: document.getElementById("mode-control"),
    difficulty: document.getElementById("difficulty-control"),
    speed: document.getElementById("speed-control"),
    direction: document.getElementById("direction-control"),
    start: document.getElementById("start-button"),
    field: document.getElementById("game-field"),
    idle: document.getElementById("game-idle"),
    target: document.getElementById("sprint-target"),
    done: document.getElementById("target-done"),
    current: document.getElementById("target-current"),
    todo: document.getElementById("target-todo"),
    feedback: document.getElementById("sprint-feedback"),
    warning: document.getElementById("layout-warning"),
    score: document.getElementById("score-value"),
    time: document.getElementById("time-value"),
    streak: document.getElementById("streak-value"),
    accuracy: document.getElementById("accuracy-value"),
    cpm: document.getElementById("cpm-value"),
    pace: document.getElementById("pace-fill"),
    keyboard: document.getElementById("virtual-keyboard"),
    sound: document.getElementById("sound-toggle"),
    soundGlyph: document.getElementById("sound-glyph"),
    summaryScore: document.getElementById("summary-score"),
    summaryAccuracy: document.getElementById("summary-accuracy"),
    summaryCpm: document.getElementById("summary-cpm"),
    summaryStreak: document.getElementById("summary-streak"),
    summaryMissed: document.getElementById("summary-missed"),
    summaryMessage: document.getElementById("summary-message"),
    repeat: document.getElementById("summary-repeat"),
    settings: document.getElementById("summary-settings")
  };

  const state = {
    mode: "keys",
    difficulty: "easy",
    speed: "normal",
    direction: "ltr",
    running: false,
    targetText: "",
    charIndex: 0,
    targetStarted: 0,
    targetDuration: 0,
    targetLive: false,
    endAt: 0,
    score: 0,
    metrics: metricsApi.create(),
    missed: 0,
    streak: 0,
    maxStreak: 0,
    pace: 1,
    results: [],
    frameId: 0,
    lastSecond: 60,
    lastTarget: ""
  };

  const keyboard = keyboardApi.create(elements.keyboard, layouts);
  const sound = soundApi.create({
    button: elements.sound,
    glyph: elements.soundGlyph,
    settings,
    onChange: function () {
      if (state.running) elements.field.focus({ preventScroll: true });
    }
  });
  const tones = runtime.createTonePlayer(sound.isEnabled);

  function addButtons(container, items, key) {
    items.forEach(function (item) {
      const button = document.createElement("button");
      button.type = "button";
      button.dataset[key] = item.id;
      button.textContent = item.label;
      button.addEventListener("click", function () {
        if (state.running) return;
        state[key] = item.id;
        updateControls();
        prepareIdle();
      });
      container.appendChild(button);
    });
  }

  const controlGroups = [
    [elements.mode, "mode"],
    [elements.difficulty, "difficulty"],
    [elements.speed, "speed"],
    [elements.direction, "direction"]
  ];

  function updateControls() {
    controlGroups.forEach(function (pair) {
      pair[0].querySelectorAll("button").forEach(function (button) {
        button.setAttribute("aria-pressed", String(button.dataset[pair[1]] === state[pair[1]]));
      });
    });
  }

  function setControlsDisabled(disabled) {
    controlGroups.forEach(function (pair) {
      pair[0].querySelectorAll("button").forEach(function (button) { button.disabled = disabled; });
    });
  }

  function accuracy() {
    return metricsApi.accuracy(state.metrics);
  }

  function updateStats() {
    elements.score.textContent = String(state.score);
    elements.time.textContent = String(Math.max(0, state.lastSecond));
    elements.streak.textContent = String(state.streak);
    elements.accuracy.textContent = accuracy() + "%";
    elements.cpm.textContent = String(metricsApi.cpm(state.metrics));
    const percent = Math.round((1.25 - state.pace) / 0.5 * 100);
    elements.pace.style.width = Math.max(0, Math.min(100, percent)) + "%";
  }

  function feedback(message, kind) {
    elements.feedback.textContent = message;
    elements.feedback.className = "sprint-feedback" + (kind ? " is-" + kind : "");
  }

  function expected() {
    return state.targetText[state.charIndex] || "";
  }

  function updateTargetText() {
    elements.done.textContent = state.targetText.slice(0, state.charIndex);
    elements.current.textContent = input.displayCharacter(expected());
    elements.todo.textContent = state.targetText.slice(state.charIndex + 1);
    elements.keyboard.classList.add("has-hint");

    const combo = keyboard.setHint(expected(), true);
    if (combo) feedback(combo, "hint");

    elements.field.setAttribute("aria-label", "Введіть: " + input.describeCharacter(expected()));
  }

  function source() {
    return data.targets[state.mode][state.difficulty];
  }

  function speedConfig() {
    return data.speeds.find(function (item) { return item.id === state.speed; }) || data.speeds[1];
  }

  function adapt(success) {
    state.results.push(success);
    if (state.results.length > 8) state.results.shift();
    if (state.results.length < 6) return;
    const rate = state.results.filter(Boolean).length / state.results.length;
    if (rate >= 0.88) state.pace = Math.max(0.75, state.pace - 0.05);
    else if (rate <= 0.58) state.pace = Math.min(1.25, state.pace + 0.06);
  }

  function chooseTarget() {
    let next = core.randomItem(source());
    if (source().length > 1 && next === state.lastTarget) {
      next = source()[(source().indexOf(next) + 1) % source().length];
    }
    state.lastTarget = next;
    return next;
  }

  // Ціль завжди стартує від безпечного краю й рухається до небезпечного.
  function targetOffset(progress) {
    const maxLeft = Math.max(0, elements.field.clientWidth - elements.target.offsetWidth - 34);
    const travelled = Math.min(1, Math.max(0, progress)) * maxLeft;
    return 18 + (state.direction === "rtl" ? maxLeft - travelled : travelled);
  }

  function spawnTarget(now) {
    if (!state.running) return;
    state.targetText = chooseTarget();
    state.charIndex = 0;
    state.targetStarted = now || performance.now();
    state.targetDuration = core.targetDuration(speedConfig().duration, state.mode, state.pace);
    state.targetLive = true;
    elements.target.hidden = false;
    elements.target.className = "sprint-target" + (state.mode === "combos" ? " is-combo" : state.mode === "words" ? " is-word" : "");
    elements.target.style.top = (42 + Math.random() * 65) + "px";
    elements.warning.hidden = true;
    updateTargetText();
    elements.target.style.left = targetOffset(0) + "px";
  }

  function markMiss() {
    if (!state.targetLive) return;
    const missedCharacters = Math.max(1, state.targetText.length - state.charIndex);
    state.targetLive = false;
    state.missed += missedCharacters;
    metricsApi.recordError(state.metrics, missedCharacters);
    state.streak = 0;
    adapt(false);
    elements.target.classList.add("is-missed");
    feedback("Не встиг — наступна ціль", "error");
    tones.error();
    updateStats();
    window.setTimeout(function () { spawnTarget(performance.now()); }, 230);
  }

  function hitTarget(progress) {
    state.targetLive = false;
    state.streak += 1;
    state.maxStreak = Math.max(state.maxStreak, state.streak);
    state.score += core.scoreFor(state.targetText.length, progress, state.streak);
    adapt(true);
    elements.target.classList.add("is-hit");
    feedback(state.streak >= 5 ? "Серія " + state.streak + "!" : "Влучно", "good");
    tones.correct();
    updateStats();
    window.setTimeout(function () { spawnTarget(performance.now()); }, 150);
  }

  function frame(now) {
    if (!state.running) return;
    const remaining = Math.max(0, Math.ceil((state.endAt - now) / 1000));
    if (remaining !== state.lastSecond) {
      state.lastSecond = remaining;
      updateStats();
    }
    if (now >= state.endAt) {
      finish();
      return;
    }
    if (state.targetLive) {
      const progress = (now - state.targetStarted) / state.targetDuration;
      elements.target.style.left = targetOffset(progress) + "px";
      if (progress >= 1) markMiss();
    }
    state.frameId = requestAnimationFrame(frame);
  }

  function resetStats() {
    state.score = 0;
    state.metrics = metricsApi.create();
    state.missed = 0;
    state.streak = 0;
    state.maxStreak = 0;
    state.pace = 1;
    state.results = [];
    state.lastSecond = data.durationSeconds;
    state.lastTarget = "";
    updateStats();
  }

  function prepareIdle() {
    cancelAnimationFrame(state.frameId);
    state.running = false;
    state.targetLive = false;
    resetStats();
    elements.target.hidden = true;
    elements.idle.hidden = false;
    elements.idle.textContent = "Обрано: " + data.modes.find(function (item) { return item.id === state.mode; }).label.toLowerCase() + ". Натисни «Почати»";
    feedback("");
    elements.warning.hidden = true;
    elements.start.textContent = "Почати";
    setControlsDisabled(false);
    elements.gameView.hidden = false;
    elements.summary.hidden = true;
    elements.field.classList.toggle("is-rtl", state.direction === "rtl");
    keyboard.clearHint();
  }

  function start() {
    if (state.running) {
      finish();
      return;
    }
    resetStats();
    metricsApi.start(state.metrics);
    state.running = true;
    state.endAt = performance.now() + data.durationSeconds * 1000;
    elements.idle.hidden = true;
    elements.start.textContent = "Зупинити";
    setControlsDisabled(true);
    spawnTarget(performance.now());
    elements.field.focus({ preventScroll: true });
    state.frameId = requestAnimationFrame(frame);
  }

  function finish() {
    if (!state.running) return;
    state.running = false;
    state.targetLive = false;
    metricsApi.finish(state.metrics);
    cancelAnimationFrame(state.frameId);
    setControlsDisabled(false);
    elements.summaryScore.textContent = String(state.score);
    elements.summaryAccuracy.textContent = accuracy() + "%";
    elements.summaryCpm.textContent = String(metricsApi.cpm(state.metrics));
    elements.summaryStreak.textContent = String(state.maxStreak);
    elements.summaryMissed.textContent = String(state.missed);
    elements.summaryMessage.textContent = accuracy() >= 90
      ? "Точність збережено навіть у швидкому темпі."
      : accuracy() >= 70
        ? "Гарний темп. Наступного разу спробуй друкувати трохи точніше."
        : "Зменш швидкість і спочатку поверни точність.";
    elements.gameView.hidden = true;
    elements.summary.hidden = false;
    tones.complete();
    elements.repeat.focus();
  }

  function handleKey(event) {
    if (!state.running || !state.targetLive || !input.isTextAttempt(event)) return;
    const active = document.activeElement;
    if (active && active.closest("button,a,input,select")) return;
    if (event.code === "Space") event.preventDefault();

    const wanted = expected();
    if (input.matchesCharacter(wanted, event)) {
      metricsApi.recordCorrect(state.metrics);
      state.charIndex += 1;
      elements.warning.hidden = true;
      keyboard.flash(event.code, "is-pressed-correct", 170);
      if (state.charIndex >= state.targetText.length) {
        const progress = (performance.now() - state.targetStarted) / state.targetDuration;
        hitTarget(progress);
      } else {
        updateTargetText();
        updateStats();
      }
    } else {
      metricsApi.recordError(state.metrics);
      state.streak = 0;
      keyboard.flash(event.code, "is-pressed-error", 170);
      tones.error();
      adapt(false);
      const problem = input.issue(wanted, event);
      elements.warning.hidden = problem !== "layout";
      feedback(problem === "layout" ? "" : "Інша клавіша", "error");
      updateStats();
    }
  }

  elements.start.addEventListener("click", start);
  elements.repeat.addEventListener("click", function () {
    elements.gameView.hidden = false;
    elements.summary.hidden = true;
    start();
  });
  elements.settings.addEventListener("click", prepareIdle);
  document.addEventListener("keydown", handleKey);
  window.addEventListener("beforeunload", function () { cancelAnimationFrame(state.frameId); });

  addButtons(elements.mode, data.modes, "mode");
  addButtons(elements.difficulty, data.difficulties, "difficulty");
  addButtons(elements.speed, data.speeds, "speed");
  addButtons(elements.direction, data.directions, "direction");
  updateControls();
  prepareIdle();
})();
