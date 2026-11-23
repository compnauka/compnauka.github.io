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
  const fitApi = window.KlavioFit;
  const hintModes = window.KlavioHintModes;
  const weakApi = window.KlavioWeakKeys;

  if (!fitApi || !hintModes || !weakApi || !data || !core || !layouts || !input || !metricsApi || !runtime || !keyboardApi || !soundApi || !settings) {
    throw new Error("Не вдалося завантажити Клавіо — Спринт");
  }

  const elements = {
    gameView: document.getElementById("game-view"),
    summary: document.getElementById("summary-view"),
    mode: document.getElementById("mode-control"),
    difficulty: document.getElementById("difficulty-control"),
    speed: document.getElementById("speed-control"),
    hint: document.getElementById("hint-control"),
    extraToggle: document.getElementById("extra-toggle"),
    extra: document.getElementById("sprint-extra"),
    summaryWeak: document.getElementById("summary-weak"),
    start: document.getElementById("start-button"),
    pause: document.getElementById("pause-button"),
    pauseStatus: document.getElementById("pause-status"),
    focusRound: document.getElementById("focus-round"),
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
    weakPractice: document.getElementById("summary-weak-practice"),
    settings: document.getElementById("summary-settings")
  };

  const state = {
    mode: "keys",
    difficulty: "easy",
    speed: "normal",
    // Режим підказок: за замовчуванням залежить від рівня, поки учень не обрав свій.
    hintMode: "guided",
    hintTouched: false,
    misses: 0,
    errorCounts: {},
    running: false,
    pausedAt: null,
    pausedDuration: 0,
    pausedAnimations: [],
    nextTargetAt: 0,
    weakKeys: [],
    practiceKeys: null,
    practiceBag: null,
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
    lastSecond: 60
  };

  const bags = {};

  const keyboard = keyboardApi.create(elements.keyboard, layouts);
  // Поле гри, панелі й клавіатура мають вміщатися у вікно без прокручування.
  // Крайній захід — нижче поле гри (клас is-compact).
  const fitter = fitApi.create({
    panel: elements.gameView,
    keyboard: elements.keyboard,
    compact: function (on) { elements.field.classList.toggle("is-compact", on); }
  });
  const sound = soundApi.create({
    button: elements.sound,
    glyph: elements.soundGlyph,
    settings,
    onChange: function () {
      if (state.running && state.pausedAt === null) elements.field.focus({ preventScroll: true });
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
        if (key === "difficulty") autoHintMode();
        updateControls();
        prepareIdle();
      });
      container.appendChild(button);
    });
  }

  const controlGroups = [
    [elements.mode, "mode"],
    [elements.difficulty, "difficulty"],
    [elements.speed, "speed"]
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
    elements.cpm.textContent = String(metricsApi.cpm(state.metrics, activeTime()));
    const percent = Math.round((1.25 - state.pace) / 0.5 * 100);
    elements.pace.style.width = Math.max(0, Math.min(100, percent)) + "%";
  }

  function activeTime(now = performance.now()) {
    return performance.timeOrigin + (state.pausedAt ?? now) - state.pausedDuration;
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
    // Підсвічування клавіші залежить від режиму підказок; після двох помилок на символі вона з'являється.
    const visible = hintModes.visibility(hintModes.find(state.hintMode), state.misses);
    elements.keyboard.classList.toggle("has-hint", visible.keyboard);
    const combo = keyboard.setHint(expected(), visible.keyboard) || layouts.comboHintForCharacter(expected());
    if (combo) feedback(combo, "hint");

    elements.field.setAttribute("aria-label", "Введіть: " + input.describeCharacter(expected()));
  }

  function source() {
    return data.getTargets(layouts.getLanguage())[state.mode][state.difficulty];
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

  // Кожна пара «режим + складність» має власну чергу, яка живе між раундами:
  // набір встигає пройти повністю, перш ніж ціль повториться.
  function chooseTarget() {
    if (state.practiceBag) return state.practiceBag.next();
    const key = layouts.getLanguage() + ":" + state.mode + ":" + state.difficulty;
    if (!bags[key]) bags[key] = runtime.createBag(source());
    return bags[key].next() || "";
  }

  // Ціль завжди стартує від безпечного краю й рухається до небезпечного.
  function targetOffset(progress) {
    const maxLeft = Math.max(0, elements.field.clientWidth - elements.target.offsetWidth - 34);
    const travelled = Math.min(1, Math.max(0, progress)) * maxLeft;
    return 18 + travelled;
  }

  function spawnTarget(now) {
    if (!state.running) return;
    state.targetText = chooseTarget();
    state.charIndex = 0;
    state.misses = 0;
    state.nextTargetAt = 0;
    state.targetStarted = now;
    const mode = state.practiceBag ? "keys" : state.mode;
    state.targetDuration = core.targetDuration(speedConfig().duration, mode, state.pace);
    state.targetLive = true;
    elements.target.hidden = false;
    elements.target.className = "sprint-target" + (mode === "combos" ? " is-combo" : mode === "words" ? " is-word" : "");
    elements.target.style.top = (42 + Math.random() * 65) + "px";
    elements.warning.hidden = true;
    updateTargetText();
    elements.target.style.left = targetOffset(0) + "px";
  }

  function markMiss(now) {
    if (!state.targetLive) return;
    const missedCharacters = Math.max(1, state.targetText.length - state.charIndex);
    state.targetLive = false;
    state.missed += missedCharacters;
    const missedChar = state.targetText[state.charIndex];
    if (missedChar && missedChar.trim()) state.errorCounts[missedChar] = (state.errorCounts[missedChar] || 0) + 1;
    metricsApi.recordError(state.metrics, missedCharacters);
    state.streak = 0;
    adapt(false);
    elements.target.classList.add("is-missed");
    feedback("Не встиг — наступна ціль", "error");
    tones.error();
    updateStats();
    state.nextTargetAt = now + 230;
  }

  function hitTarget(now) {
    state.targetLive = false;
    state.streak += 1;
    state.maxStreak = Math.max(state.maxStreak, state.streak);
    const progress = (now - state.targetStarted) / state.targetDuration;
    state.score += core.scoreFor(state.targetText.length, progress, state.streak);
    adapt(true);
    elements.target.classList.add("is-hit");
    feedback(state.streak >= 5 ? "Серія " + state.streak + "!" : "Влучно", "good");
    tones.correct();
    updateStats();
    state.nextTargetAt = now + 150;
  }

  function frame(timestamp) {
    if (!state.running || state.pausedAt !== null) return;
    const now = activeTime(timestamp);
    const remaining = Math.max(0, Math.ceil((state.endAt - now) / 1000));
    if (remaining !== state.lastSecond) {
      state.lastSecond = remaining;
      updateStats();
    }
    if (now >= state.endAt) {
      finish(state.endAt);
      return;
    }
    if (state.nextTargetAt && now >= state.nextTargetAt) {
      spawnTarget(now);
    } else if (state.targetLive) {
      const progress = (now - state.targetStarted) / state.targetDuration;
      elements.target.style.left = targetOffset(progress) + "px";
      if (progress >= 1) markMiss(now);
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
    state.misses = 0;
    state.errorCounts = {};
    state.lastSecond = data.durationSeconds;
    updateStats();
  }

  function prepareIdle() {
    cancelAnimationFrame(state.frameId);
    state.running = false;
    state.targetLive = false;
    state.practiceKeys = null;
    state.practiceBag = null;
    resetPause();
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
    keyboard.clearHint();
    fitter.fit();
    fitter.reveal();
  }

  function updatePauseControls() {
    const paused = state.pausedAt !== null;
    elements.pause.hidden = !state.running;
    elements.pause.textContent = paused ? "Продовжити" : "Пауза";
    elements.pauseStatus.textContent = paused ? "Раунд призупинено" : "";
    elements.pauseStatus.classList.toggle("is-visible", paused);
    fitter.schedule();
  }

  function resetPause() {
    state.pausedAt = null;
    state.pausedDuration = 0;
    state.pausedAnimations.forEach(function (animation) { animation.cancel(); });
    state.pausedAnimations = [];
    updatePauseControls();
    elements.focusRound.hidden = true;
  }

  function pause(moveFocus) {
    if (!state.running || state.pausedAt !== null) return;
    state.pausedAt = performance.now();
    cancelAnimationFrame(state.frameId);
    state.pausedAnimations = elements.target.getAnimations().filter(function (animation) {
      return animation.playState === "running";
    });
    state.pausedAnimations.forEach(function (animation) { animation.pause(); });
    updatePauseControls();
    updateStats();
    if (moveFocus) elements.pause.focus({ preventScroll: true });
  }

  function togglePause() {
    if (!state.running || document.hidden) return;
    if (state.pausedAt === null) {
      pause(true);
      return;
    }
    state.pausedDuration += performance.now() - state.pausedAt;
    state.pausedAt = null;
    state.pausedAnimations.forEach(function (animation) { animation.play(); });
    state.pausedAnimations = [];
    updatePauseControls();
    elements.field.focus({ preventScroll: true });
    state.frameId = requestAnimationFrame(frame);
  }

  function start(practiceKeys = null) {
    if (state.running) {
      finish();
      return;
    }
    state.practiceKeys = practiceKeys;
    state.practiceBag = practiceKeys ? runtime.createBag(practiceKeys) : null;
    resetStats();
    state.running = true;
    updatePauseControls();
    const now = activeTime();
    metricsApi.start(state.metrics, now);
    state.endAt = now + data.durationSeconds * 1000;
    elements.focusRound.hidden = !practiceKeys;
    elements.focusRound.textContent = practiceKeys ? "Тренування клавіш: " + practiceKeys.join(", ") : "";
    elements.idle.hidden = true;
    elements.start.textContent = "Зупинити";
    setControlsDisabled(true);
    spawnTarget(now);
    elements.field.focus({ preventScroll: true });
    state.frameId = requestAnimationFrame(frame);
  }

  function finish(now = activeTime()) {
    if (!state.running) return;
    state.running = false;
    state.targetLive = false;
    metricsApi.finish(state.metrics, now);
    resetPause();
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
    const weak = weakApi.weakKeys(state.errorCounts, "", 3);
    state.weakKeys = weak;
    elements.summaryWeak.hidden = weak.length === 0;
    elements.weakPractice.hidden = weak.length === 0;
    elements.summaryWeak.textContent = "Найчастіше помилявся: " + weak.join(", ");
    elements.gameView.hidden = true;
    elements.summary.hidden = false;
    tones.complete();
    elements.repeat.focus();
  }

  function handleKey(event) {
    if (!state.running || state.pausedAt !== null || !state.targetLive || !input.isTextAttempt(event)) return;
    const active = document.activeElement;
    if (active && active.closest("button,a,input,select")) return;
    if (event.code === "Space") event.preventDefault();
    const now = activeTime();
    if (now >= state.endAt) return finish(state.endAt);
    if (now >= state.targetStarted + state.targetDuration) return markMiss(now);

    const wanted = expected();
    if (input.matchesCharacter(wanted, event)) {
      metricsApi.recordCorrect(state.metrics);
      state.charIndex += 1;
      state.misses = 0;
      elements.warning.hidden = true;
      keyboard.flash(event.code, "is-pressed-correct", 170);
      if (state.charIndex >= state.targetText.length) {
        hitTarget(now);
      } else {
        updateTargetText();
        updateStats();
      }
    } else {
      metricsApi.recordError(state.metrics);
      state.streak = 0;
      state.misses += 1;
      if (wanted.trim()) state.errorCounts[wanted] = (state.errorCounts[wanted] || 0) + 1;
      keyboard.flash(event.code, "is-pressed-error", 170);
      if (state.misses === hintModes.HINT_AFTER_MISSES) updateTargetText();
      tones.error();
      adapt(false);
      const problem = input.issue(wanted, event, layouts.getLanguage());
      elements.warning.hidden = problem !== "layout";
      feedback(problem === "layout" ? "" : "Інша клавіша", "error");
      updateStats();
    }
  }

  elements.start.addEventListener("click", function () { start(); });
  elements.pause.addEventListener("click", togglePause);
  elements.repeat.addEventListener("click", function () {
    elements.gameView.hidden = false;
    elements.summary.hidden = true;
    start(state.practiceKeys);
  });
  elements.weakPractice.addEventListener("click", function () {
    elements.gameView.hidden = false;
    elements.summary.hidden = true;
    start(state.weakKeys);
  });
  elements.settings.addEventListener("click", prepareIdle);
  document.addEventListener("keydown", handleKey);
  window.addEventListener("keydown", function (event) {
    if (!state.running || event.key !== "Escape" || event.defaultPrevented || event.repeat) return;
    event.preventDefault();
    togglePause();
  });
  window.addEventListener("blur", function () { pause(false); });
  document.addEventListener("visibilitychange", function () {
    if (document.hidden) pause(false);
  });
  window.addEventListener("beforeunload", function () { cancelAnimationFrame(state.frameId); });

  // Зміна мови друку без перезавантаження: нова розкладка, нові цілі; триваючий раунд
  // починається заново (черга цілей у bags залежить від мови).
  function applyLanguage() {
    const wasRunning = state.running;
    keyboard.setLanguage();
    elements.warning.textContent = layouts.layoutWarningText();
    if (wasRunning) {
      prepareIdle();
      start();
    } else {
      prepareIdle();
    }
    fitter.schedule();
  }

  window.addEventListener("klavio:lang-change", applyLanguage);
  window.addEventListener("klavio:prefs-close", function () {
    if (state.running && state.pausedAt === null) elements.field.focus({ preventScroll: true });
  });
  elements.warning.textContent = layouts.layoutWarningText();

  const hintControl = hintModes.createControl(elements.hint, {
    modes: [hintModes.MODES[0], hintModes.MODES[2]],
    value: state.hintMode,
    onChange: function (id) {
      state.hintMode = id;
      state.hintTouched = true;
      state.misses = 0;
      if (state.running && state.targetLive) updateTargetText();
      if (state.running && state.pausedAt === null) elements.field.focus({ preventScroll: true });
    }
  });

  // На «Складно» гра без підсвічування, на решті — з підсвічуванням (поки учень не обрав своє).
  function autoHintMode() {
    if (state.hintTouched) return;
    state.hintMode = state.difficulty === "hard" ? "independent" : "guided";
    hintControl.set(state.hintMode);
  }

  elements.extraToggle.addEventListener("click", function () {
    const open = elements.extra.hidden;
    elements.extra.hidden = !open;
    elements.extraToggle.setAttribute("aria-expanded", String(open));
    fitter.fit();
    fitter.reveal();
  });

  addButtons(elements.mode, data.modes, "mode");
  addButtons(elements.difficulty, data.difficulties, "difficulty");
  addButtons(elements.speed, data.speeds, "speed");
  updateControls();
  prepareIdle();
})();
