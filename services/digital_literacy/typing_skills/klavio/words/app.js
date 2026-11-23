(function () {
  "use strict";

  const data = window.KlavioWordsData;
  const core = window.KlavioWordCore;
  const speedApi = window.KlavioSpeedTest;
  const layouts = window.KlavioLayouts;
  const metricsApi = window.KlavioMetrics;
  const runtime = window.KlavioRuntime;
  const settings = window.KlavioSettings;
  const input = window.KlavioInput;
  const keyboardApi = window.KlavioKeyboard;
  const soundApi = window.KlavioSound;
  const fitApi = window.KlavioFit;
  const textFieldApi = window.KlavioTextField;
  const handsApi = window.KlavioHands;
  const hintModes = window.KlavioHintModes;
  const weakApi = window.KlavioWeakKeys;
  const customTextApi = window.KlavioCustomText;
  const lessonsUk = window.KlavioLessonsData;
  const lessonsEn = window.KlavioLessonsDataEn;

  if (!fitApi || !data || !core || !speedApi || !layouts || !metricsApi || !runtime || !settings || !input || !keyboardApi || !soundApi ||
    !textFieldApi || !handsApi || !hintModes || !weakApi || !customTextApi || !lessonsUk || !lessonsEn) {
    throw new Error("Не вдалося завантажити Клавіо — Слова");
  }

  const elements = {
    practice: document.getElementById("practice-view"),
    summary: document.getElementById("summary-view"),
    mode: document.getElementById("mode-control"),
    difficulty: document.getElementById("difficulty-control"),
    scope: document.getElementById("scope-select"),
    customEditor: document.getElementById("custom-text-editor"),
    customEdit: document.getElementById("custom-edit"),
    customSummaryEdit: document.getElementById("custom-summary-edit"),
    hint: document.getElementById("hint-control"),
    restart: document.getElementById("restart-button"),
    stage: document.getElementById("word-stage"),
    text: document.getElementById("word-text"),
    feedback: document.getElementById("word-feedback"),
    speedInstructions: document.getElementById("speed-instructions"),
    help: document.getElementById("words-help"),
    combo: document.getElementById("word-combo"),
    warning: document.getElementById("layout-warning"),
    progressLabel: document.getElementById("progress-label"),
    progressFill: document.getElementById("progress-fill"),
    accuracy: document.getElementById("accuracy-value"),
    cpm: document.getElementById("cpm-value"),
    streak: document.getElementById("streak-value"),
    fingerSection: document.getElementById("finger-section"),
    fingerTitle: document.getElementById("finger-title"),
    fingerLabel: document.getElementById("finger-label"),
    handsGuide: document.getElementById("hands-guide"),
    keyboard: document.getElementById("virtual-keyboard"),
    sound: document.getElementById("sound-toggle"),
    soundGlyph: document.getElementById("sound-glyph"),
    summaryAccuracy: document.getElementById("summary-accuracy"),
    summaryCpm: document.getElementById("summary-cpm"),
    summaryErrors: document.getElementById("summary-errors"),
    summaryWeak: document.getElementById("summary-weak"),
    summaryNote: document.getElementById("summary-note"),
    summaryTitle: document.getElementById("summary-title"),
    summaryComparison: document.getElementById("summary-comparison"),
    summaryRetest: document.getElementById("summary-retest"),
    summaryDrill: document.getElementById("summary-drill"),
    repeat: document.getElementById("summary-repeat")
  };

  // Скільки завдань у раунді та мінімум завдань, щоб вправа не повторювалась надто швидко.
  const ROUND_SIZE = { words: 18, sentences: 5 };
  const MIN_ITEMS = { words: 6, sentences: 3 };
  const testRuns = { uk: 0, en: 0 };
  const previousTests = {};

  const state = {
    mode: new URLSearchParams(window.location.search).get("mode") === "test" ? "test" : "words",
    test: null,
    difficulty: "easy",
    // "all" — усі літери, або номер уроку, до якого літери вже вивчено.
    scope: "all",
    hintMode: "guided",
    text: "",
    position: 0,
    metrics: metricsApi.create(),
    streak: 0,
    misses: 0,
    errorCounts: {},
    pendingWeak: [],
    drillWeak: null,
    testDrillText: "",
    running: false,
    locked: false,
    interval: null,
    advanceTimer: null
  };

  const customText = customTextApi.create(elements.customEditor, {
    inspect: function (value) { return customTextApi.inspect(value, layouts, input, core, learned()); },
    start: function (text) { begin([text], null); }
  });
  const keyboard = keyboardApi.create(elements.keyboard, layouts);
  const field = textFieldApi.create({ box: elements.text, feedback: elements.feedback, minLines: 2, maxLines: 4 });
  const sound = soundApi.create({
    button: elements.sound,
    glyph: elements.soundGlyph,
    settings,
    onChange: function () {
      if (state.running) elements.stage.focus({ preventScroll: true });
    }
  });
  const tones = runtime.createTonePlayer(sound.isEnabled);

  // Панель вправи разом із клавіатурою має вміщатися у вікно без прокручування.
  // Крайній захід: ховаємо долоні (is-compact), як і в «Уроках».
  const fitter = fitApi.create({
    panel: elements.practice,
    keyboard: elements.keyboard,
    isActive: function () { return !elements.fingerSection.classList.contains("is-hidden"); },
    compact: function (on) { elements.fingerSection.classList.toggle("is-compact", on); },
    beforeFit: field.fitHeight,
    afterFit: field.keepVisible
  });

  function course() {
    return layouts.getLanguage() === "en" ? lessonsEn : lessonsUk;
  }

  function currentCharacter() {
    return state.text[state.position] || "";
  }

  function hintConfig() {
    return hintModes.find(state.hintMode);
  }

  // ---- Добір завдань ----------------------------------------------------

  function learned() {
    return state.mode === "test" || state.scope === "all" ? null : core.learnedCharacters(course().lessons, Number(state.scope));
  }

  function levelItems() {
    const content = data.getContent(layouts.getLanguage());
    const source = state.mode === "sentences" ? content.sentences[state.difficulty] : content.pools[state.difficulty];
    return core.filterByLearned(source, learned());
  }

  function allWords() {
    const content = data.getContent(layouts.getLanguage());
    const every = [].concat(content.pools.easy, content.pools.medium, content.pools.hard);
    return core.filterByLearned(every, learned());
  }

  function buildScope() {
    elements.scope.textContent = "";
    const all = document.createElement("option");
    all.value = "all";
    all.textContent = "Усі літери";
    elements.scope.appendChild(all);
    course().lessons.forEach(function (lesson) {
      const option = document.createElement("option");
      option.value = String(lesson.id);
      option.textContent = "До уроку " + lesson.id + " (" + lesson.focus + ")";
      elements.scope.appendChild(option);
    });
    elements.scope.value = state.scope;
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
        if (state.mode === "custom") editCustomText();
        else restart();
      });
    });

    elements.scope.addEventListener("change", function () {
      state.scope = elements.scope.value;
      if (state.mode === "custom") editCustomText(customText.isVisible() === false);
      else restart();
    });

    hintModes.createControl(elements.hint, {
      value: state.hintMode,
      onChange: function (id) {
        state.hintMode = id;
        state.misses = 0;
        updateHints();
        layoutExercise(true);
        if (state.running) elements.stage.focus({ preventScroll: true });
      }
    });
  }

  function updateControls() {
    elements.mode.querySelectorAll("button").forEach(function (button) {
      button.setAttribute("aria-pressed", String(button.dataset.mode === state.mode));
    });
    elements.difficulty.querySelectorAll("button").forEach(function (button) {
      button.setAttribute("aria-pressed", String(button.dataset.difficulty === state.difficulty));
    });
    elements.scope.value = state.scope;
    elements.difficulty.hidden = state.mode === "custom";
    elements.customEdit.hidden = state.mode !== "custom" || customText.isVisible();
    elements.customSummaryEdit.hidden = state.mode !== "custom";
    const testing = state.mode === "test";
    elements.practice.classList.toggle("is-speed-test", testing);
    elements.help.hidden = testing;
    elements.speedInstructions.hidden = !testing;
    elements.progressLabel.setAttribute("aria-label", testing ? "Час до кінця тесту" : "Прогрес");
  }

  // ---- Показ ------------------------------------------------------------

  function layoutExercise(scroll) {
    if (elements.practice.hidden || customText.isVisible()) return;
    fitter.fit();
    if (scroll) fitter.reveal();
  }

  function feedback(message, kind) {
    elements.feedback.textContent = message;
    elements.feedback.className = "lesson-feedback" + (kind ? " is-" + kind : "");
  }

  function updateProgress() {
    const total = state.text.length;
    elements.progressLabel.textContent = state.position + " / " + total;
    elements.progressFill.style.width = (total > 0 ? (state.position / total) * 100 : 0) + "%";
  }

  function updateMetrics() {
    elements.accuracy.textContent = metricsApi.accuracy(state.metrics) + "%";
    elements.cpm.textContent = String(metricsApi.cpm(state.metrics));
    elements.streak.textContent = String(state.streak);
  }

  function updateText() {
    field.setPosition(state.position);
    if (state.test) return;
    elements.stage.setAttribute("aria-label", "Введіть символ: " + input.describeCharacter(currentCharacter()));
  }

  // Режим підказок: клавіатура й долоні за правилами «Уроків»; після двох помилок підказка з'являється.
  function updateHints() {
    const character = currentCharacter();
    const visible = hintModes.visibility(hintConfig(), state.misses);
    const wasHidden = elements.fingerSection.classList.contains("is-hidden");

    elements.keyboard.classList.toggle("has-hint", visible.keyboard);
    const combo = keyboard.setHint(character, visible.keyboard);

    // Комбінацію (Shift або Ctrl+Alt для «ґ») показуємо навіть без підсвічування клавіатури.
    const comboHint = combo || layouts.comboHintForCharacter(character);
    elements.combo.textContent = comboHint;
    elements.combo.hidden = !comboHint;

    elements.fingerSection.classList.toggle("is-hidden", !visible.finger);
    elements.fingerSection.classList.toggle("is-revealed", visible.revealed);
    elements.fingerTitle.hidden = !visible.finger;
    if (visible.finger) elements.fingerLabel.textContent = handsApi.update(elements.handsGuide, layouts.hintsForCharacter(character));
    if (wasHidden === visible.finger) layoutExercise(false);
    return visible;
  }

  function stopTimer() {
    if (state.interval) window.clearInterval(state.interval);
    state.interval = null;
  }

  function cancelAdvance() {
    window.clearTimeout(state.advanceTimer);
    state.advanceTimer = null;
  }

  // ---- Початок вправи ---------------------------------------------------

  function editCustomText(focus) {
    stopTimer();
    cancelAdvance();
    state.running = false;
    state.drillWeak = null;
    state.testDrillText = "";
    elements.practice.hidden = false;
    elements.summary.hidden = true;
    elements.practice.classList.add("is-editing-custom");
    customText.show(focus);
    updateControls();
  }

  function begin(tasks, note, test = null) {
    stopTimer();
    cancelAdvance();
    customText.hide();
    elements.practice.classList.remove("is-editing-custom");
    state.test = test;
    state.text = core.joinTasks(tasks);
    state.position = 0;
    state.metrics = metricsApi.create();
    state.streak = 0;
    state.misses = 0;
    state.errorCounts = {};
    state.running = state.text.length > 0;
    state.locked = false;

    updateControls();
    field.setKeyAnnouncements(!test);
    elements.text.setAttribute("aria-hidden", String(!test));
    elements.text.lang = layouts.getLanguage();
    field.setText(state.text);
    updateText();
    if (test) {
      elements.stage.setAttribute("aria-label", "Поле введення тесту");
      elements.stage.setAttribute("aria-describedby", "speed-instructions");
      elements.fingerSection.classList.add("is-hidden");
      elements.fingerTitle.hidden = true;
      elements.combo.hidden = true;
      feedback("");
      refreshTest(performance.now());
    } else {
      elements.stage.removeAttribute("aria-describedby");
      updateProgress();
      updateMetrics();
      updateHints();
      feedback(note ? note.message : "Починай, коли готовий", note ? note.kind : "");
    }
    elements.warning.hidden = true;
    elements.stage.classList.remove("is-error");
    keyboard.clearPressed();
    elements.practice.hidden = false;
    elements.summary.hidden = true;
    layoutExercise(true);
    elements.stage.focus({ preventScroll: true });
  }

  function restart() {
    state.drillWeak = null;
    state.testDrillText = "";
    if (state.mode === "test") {
      runTest();
      return;
    }
    if (state.mode === "custom") {
      const exercise = customText.getExercise();
      if (exercise) begin([exercise], null);
      else editCustomText();
      return;
    }
    const items = levelItems();
    const kind = state.mode;
    if (items.length === 0) {
      begin([], { message: "Для цього набору літер слів ще немає — обери пізніший урок або «Усі літери».", kind: "error" });
      return;
    }
    const note = items.length < MIN_ITEMS[kind]
      ? { message: "Для цього уроку знайдено лише " + items.length + " — вправа повторюватиметься. Обери пізніший урок для різноманіття.", kind: "error" }
      : null;
    begin(runtime.buildRound(items, ROUND_SIZE[kind]), note);
  }

  function startDrill(weak) {
    if (state.mode === "test") {
      state.testDrillText = state.test.passage;
      state.mode = "words";
      state.scope = "all";
    }
    state.drillWeak = weak;
    const tasks = weakWords(weak);
    if (tasks.length === 0) {
      begin([], { message: "Слів із цими клавішами не знайдено — спробуй інший набір літер.", kind: "error" });
      return;
    }
    begin(tasks, null);
  }

  function weakWords(weak) {
    const testText = state.test?.passage || state.testDrillText;
    const source = testText ? testText.trim().split(/\s+/) : allWords();
    return core.weakWords(weak, source, ROUND_SIZE.words, Math.random);
  }

  function runTest() {
    const language = layouts.getLanguage();
    const test = speedApi.create(language, testRuns[language]++ % speedApi.variants);
    begin([test.passage], null, test);
  }

  function refreshTest(now) {
    const remaining = speedApi.timeLeft(state.test, now);
    elements.progressLabel.textContent = Math.ceil(remaining / 1000) + " с";
    elements.progressFill.style.width = (100 * remaining / speedApi.DURATION) + "%";
    if (remaining === 0) showSummary(now);
  }

  function handleTestKey(event) {
    const test = state.test;
    const now = performance.now();
    if (speedApi.timeLeft(test, now) === 0) {
      refreshTest(now);
      return;
    }

    if (event.key === "Backspace" && !input.isSystemCombination(event)) {
      event.preventDefault();
      if (state.position === 0) return;
      speedApi.backspace(test);
      state.position -= 1;
      field.clearMistake(state.position);
      updateText();
      return;
    }
    if (event.repeat || event.isComposing || !input.isTextAttempt(event)) return;
    event.preventDefault();

    const wrongLayout = speedApi.layoutMismatch(test.language, event.key);
    elements.warning.hidden = !wrongLayout;
    if (test.deadline === null) {
      // Першу літеру зараховуємо навіть тоді, коли вона не збігається з текстом.
      if (wrongLayout || !/\p{Letter}/u.test(event.key)) return;
      state.interval = window.setInterval(function () { refreshTest(performance.now()); }, 100);
    }
    if (state.position === state.text.length) {
      speedApi.nextBlock(test);
      field.setText(state.text);
      state.position = 0;
    }

    const correct = input.matchesCharacter(currentCharacter(), event);
    speedApi.enter(test, correct, now);
    if (!correct) field.markMistake(state.position);
    state.position += 1;
    updateText();
    refreshTest(now);
  }

  function renderTestSummary(now) {
    const test = state.test;
    const result = speedApi.result(test, now);
    const previous = previousTests[test.language];
    elements.summaryComparison.hidden = !previous;
    if (previous) {
      const difference = result.cpm - previous.cpm;
      const change = difference > 0 ? "+" + difference : String(difference);
      elements.summaryComparison.textContent = "До попередньої спроби: " + change +
        " симв/хв · точність " + previous.accuracy + "% → " + result.accuracy + "%";
    }
    previousTests[test.language] = result;
    elements.summaryAccuracy.textContent = result.accuracy + "%";
    elements.summaryCpm.textContent = String(result.cpm);
    elements.summaryErrors.textContent = String(result.errors);
    return weakApi.weakKeys(test.errorCounts, test.passage, 3);
  }


  function showSummary(now) {
    state.running = false;
    state.locked = true;
    stopTimer();
    elements.summaryTitle.textContent = state.test ? "Тест швидкості завершено" : "Вправу завершено";
    elements.summaryNote.textContent = state.test
      ? "Швидкість — кількість правильно введених символів за хвилину. Точність враховує всі спроби введення."
      : "Рівний і точний друк важливіший за поспіх.";
    elements.repeat.textContent = state.test ? "Повторити тест" : "Заново";
    elements.summaryRetest.hidden = !state.testDrillText;
    if (state.test) {
      state.pendingWeak = renderTestSummary(now);
    } else {
      elements.summaryComparison.hidden = true;
      metricsApi.finish(state.metrics);
      elements.summaryAccuracy.textContent = metricsApi.accuracy(state.metrics) + "%";
      elements.summaryCpm.textContent = String(metricsApi.cpm(state.metrics));
      elements.summaryErrors.textContent = String(state.metrics.errors);
      state.pendingWeak = state.drillWeak ? [] : weakApi.weakKeys(state.errorCounts, state.text, 3);
    }
    const hasWeak = state.pendingWeak.length > 0 && weakWords(state.pendingWeak).length > 0;
    elements.summaryWeak.hidden = state.pendingWeak.length === 0;
    elements.summaryWeak.textContent = "Найчастіше помилявся: " + state.pendingWeak.join(", ");
    elements.summaryDrill.hidden = !hasWeak;
    elements.practice.hidden = true;
    elements.summary.hidden = false;
    tones.complete();
    elements.repeat.focus();
  }

  // ---- Введення ---------------------------------------------------------

  function handleCorrect(event) {
    state.locked = true;
    metricsApi.recordCorrect(state.metrics);
    state.position += 1;
    state.misses = 0;
    state.streak += 1;
    elements.warning.hidden = true;
    elements.stage.classList.remove("is-error");
    feedback("Правильно", "success");
    keyboard.flash(event.code, "is-pressed-correct", 180);
    updateProgress();
    updateMetrics();
    tones.correct();

    if (state.position >= state.text.length) {
      state.advanceTimer = window.setTimeout(showSummary, 300);
      return;
    }

    state.advanceTimer = window.setTimeout(function () {
      state.locked = false;
      updateText();
      updateHints();
      feedback("Продовжуй у своєму темпі");
      elements.stage.focus({ preventScroll: true });
    }, 105);
  }

  function handleError(event, expected) {
    metricsApi.recordError(state.metrics);
    state.streak = 0;
    state.misses += 1;
    if (expected.trim()) state.errorCounts[expected] = (state.errorCounts[expected] || 0) + 1;
    elements.stage.classList.remove("is-error");
    void elements.stage.offsetWidth;
    elements.stage.classList.add("is-error");
    keyboard.flash(event.code, "is-pressed-error", 180);
    field.markMistake(state.position);
    tones.error();
    updateMetrics();

    // Друга помилка на символі вмикає підказку, яку вимкнув режим.
    if (state.misses === hintModes.HINT_AFTER_MISSES) updateHints();

    const problem = input.errorHint(expected, event, layouts);
    elements.warning.hidden = problem.kind !== "layout";
    feedback(problem.kind === "layout" ? "" : problem.message, "error");
  }

  function handleKey(event) {
    if (!state.running || state.locked) return;
    const active = document.activeElement;
    if (active && active.closest("button,a,select,input,textarea")) return;
    if (state.test) {
      handleTestKey(event);
      return;
    }
    if (!input.isTextAttempt(event)) return;
    if (event.code === "Space") event.preventDefault();

    if (!state.metrics.startedAt) {
      metricsApi.start(state.metrics);
      state.interval = window.setInterval(updateMetrics, 1000);
    }

    const expected = currentCharacter();
    if (input.matchesCharacter(expected, event)) handleCorrect(event);
    else handleError(event, expected);
  }

  elements.restart.addEventListener("click", function () {
    if (state.drillWeak) startDrill(state.drillWeak);
    else restart();
  });
  elements.repeat.addEventListener("click", restart);
  elements.summaryRetest.addEventListener("click", function () {
    state.mode = "test";
    restart();
  });
  elements.customEdit.addEventListener("click", function () { editCustomText(); });
  elements.customSummaryEdit.addEventListener("click", function () { editCustomText(); });
  elements.summaryDrill.addEventListener("click", function () { startDrill(state.pendingWeak); });
  document.addEventListener("keydown", handleKey);
  elements.stage.addEventListener("paste", function (event) {
    if (state.test) event.preventDefault();
  });
  window.addEventListener("beforeunload", stopTimer);

  // Зміна мови друку без перезавантаження: нова розкладка, курс і слова нової мови;
  // вправа починається заново, а begin() повертає фокус у поле вправи.
  function applyLanguage() {
    keyboard.setLanguage();
    elements.warning.textContent = layouts.layoutWarningText();
    state.scope = "all";
    buildScope();
    if (state.mode === "custom") editCustomText();
    else restart();
  }

  window.addEventListener("klavio:lang-change", applyLanguage);
  // Після закриття меню «Aa» повертаємо фокус у вправу.
  window.addEventListener("klavio:prefs-close", function () {
    if (state.running) elements.stage.focus({ preventScroll: true });
  });
  // Після зміни ширини рядки переносяться інакше: перераховуємо висоту поля.
  if (window.ResizeObserver) {
    let lastWidth = elements.text.clientWidth;
    new ResizeObserver(function () {
      if (elements.text.clientWidth === lastWidth) return;
      lastWidth = elements.text.clientWidth;
      fitter.schedule();
    }).observe(elements.text);
  }

  buildControls();
  buildScope();
  elements.warning.textContent = layouts.layoutWarningText();
  restart();
})();
