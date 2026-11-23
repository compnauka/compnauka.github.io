(function () {
  "use strict";

  const data = window.KlavioLessonsData;
  const core = window.KlavioLessonCore;
  const metricsApi = window.KlavioMetrics;
  const layouts = window.KlavioLayouts;
  const input = window.KlavioInput;
  const keyboardApi = window.KlavioKeyboard;
  const soundApi = window.KlavioSound;
  const runtime = window.KlavioRuntime;
  const settings = window.KlavioSettings;
  const fitApi = window.KlavioFit;
  const dataEn = window.KlavioLessonsDataEn;
  const textFieldApi = window.KlavioTextField;
  const handsApi = window.KlavioHands;

  if (!fitApi || !textFieldApi || !handsApi || !dataEn || !data || !core || !metricsApi || !layouts || !input || !keyboardApi || !soundApi || !runtime || !settings) {
    throw new Error("Не вдалося завантажити спільне ядро Клавіо");
  }

  const elements = {
    lessonSelect: document.getElementById("lesson-select"),
    lessonView: document.getElementById("lesson-view"),
    summaryView: document.getElementById("summary-view"),
    lessonNumber: document.getElementById("lesson-number"),
    lessonTitle: document.getElementById("lesson-title"),
    difficultyControl: document.getElementById("difficulty-control"),
    restartButton: document.getElementById("restart-button"),
    progressLabel: document.getElementById("progress-label"),
    progressFill: document.getElementById("progress-fill"),
    accuracyValue: document.getElementById("accuracy-value"),
    cpmValue: document.getElementById("cpm-value"),
    streakValue: document.getElementById("streak-value"),
    lessonStage: document.getElementById("lesson-stage"),
    lessonText: document.getElementById("lesson-text"),
    feedback: document.getElementById("lesson-feedback"),
    layoutWarning: document.getElementById("layout-warning"),
    lessonPanel: document.getElementById("lesson-view"),
    fingerSection: document.getElementById("finger-section"),
    fingerTitle: document.getElementById("finger-title"),
    fingerLabel: document.getElementById("finger-label"),
    comboHint: document.getElementById("combo-hint"),
    handsGuide: document.getElementById("hands-guide"),
    keyboard: document.getElementById("virtual-keyboard"),
    soundToggle: document.getElementById("sound-toggle"),
    soundGlyph: document.getElementById("sound-glyph"),
    summaryKicker: document.getElementById("summary-kicker"),
    summaryTitle: document.getElementById("summary-title"),
    summaryMessage: document.getElementById("summary-message"),
    summaryAccuracy: document.getElementById("summary-accuracy"),
    summaryCpm: document.getElementById("summary-cpm"),
    summaryErrors: document.getElementById("summary-errors"),
    summaryTime: document.getElementById("summary-time"),
    summaryRetry: document.getElementById("summary-retry"),
    summaryNext: document.getElementById("summary-next"),
    introCard: document.getElementById("lesson-intro"),
    introTitle: document.getElementById("lesson-intro-title"),
    introText: document.getElementById("lesson-intro-text"),
    introButton: document.getElementById("intro-button"),
    summaryWeak: document.getElementById("summary-weak"),
    summaryDrill: document.getElementById("summary-drill")
  };

  // Межі підгонки: рядків у полі тексту, мінімальна клавіша (px), відступ від країв вікна,
  // ширина, нижче якої клавіатура прокручується й підгонка клавіш вимкнена.
  const MIN_TEXT_LINES = 2;
  const MAX_TEXT_LINES = 4;
  const MIN_KEY_SIZE = 26;
  const VIEW_MARGIN = 4;
  const MOBILE_WIDTH = 860;

  const state = {
    lessonId: 1,
    lesson: course().lessons[0],
    difficultyId: "guided",
    position: 0,
    metrics: metricsApi.create(),
    streak: 0,
    maxStreak: 0,
    // Помилки на поточному символі: після двох режим тимчасово підказує.
    misses: 0,
    // Помилки за символами (лише в пам'яті сторінки) і слабкі символи для додаткової вправи.
    errorCounts: {},
    drillWeak: null,
    pendingWeak: [],
    introVisible: false,
    introTimer: 0,
    running: false,
    inputLocked: false,
    // Позначки «✓» в межах сесії — окремо для кожної мови друку.
    completedInSession: { uk: new Set(), en: new Set() },
    statsInterval: null,
    // Span для кожного символу уроку та позиція, яку зараз показано курсором.
    charElements: [],
    shownPosition: -1
  };

  const keyboard = keyboardApi.create(elements.keyboard, layouts);
  const sound = soundApi.create({
    button: elements.soundToggle,
    glyph: elements.soundGlyph,
    settings,
    onChange: function () {
      if (state.running) elements.lessonStage.focus({ preventScroll: true });
    }
  });
  const tones = runtime.createTonePlayer(sound.isEnabled);

  // Курс залежить від мови друку: groups, lessons і intros беремо з поточного курсу.
  function course() {
    return layouts.getLanguage() === "en" ? dataEn : data;
  }

  function difficulty() {
    return data.difficulties.find(function (item) {
      return item.id === state.difficultyId;
    }) || data.difficulties[0];
  }

  function currentCharacter() {
    return state.lesson.text[state.position] || "";
  }

  function handLabel(hand) {
    if (hand === "left") return "Ліва рука";
    if (hand === "right") return "Права рука";
    return "Обидві руки";
  }

  function buildLessonSelect() {
    elements.lessonSelect.textContent = "";

    course().groups.forEach(function (group) {
      const optionGroup = document.createElement("optgroup");
      optionGroup.label = group.title;

      course().lessons.filter(function (lesson) {
        return lesson.groupId === group.id;
      }).forEach(function (lesson) {
        const option = document.createElement("option");
        option.value = String(lesson.id);
        option.textContent = lesson.id + ". " + lesson.focus;
        optionGroup.appendChild(option);
      });
      elements.lessonSelect.appendChild(optionGroup);
    });
  }

  function updateLessonSelect() {
    // Під час вправи в списку вибрано службовий пункт, тож вибір будь-якого уроку (і поточного) виходить з вправи.
    const placeholder = elements.lessonSelect.querySelector("option[data-drill]");
    if (placeholder) placeholder.remove();
    if (state.drillWeak) {
      const option = document.createElement("option");
      option.dataset.drill = "true";
      option.value = "";
      option.disabled = true;
      option.textContent = "Додаткова вправа";
      elements.lessonSelect.prepend(option);
      elements.lessonSelect.value = "";
    } else {
      elements.lessonSelect.value = String(state.lessonId);
    }
    elements.lessonSelect.querySelectorAll("option:not([data-drill])").forEach(function (option) {
      const lessonId = Number(option.value);
      const lesson = course().lessons[lessonId - 1];
      const marker = state.completedInSession[layouts.getLanguage()].has(lessonId) ? " ✓" : "";
      option.textContent = lessonId + ". " + lesson.focus + marker;
    });
  }

  function buildDifficultyControl() {
    elements.difficultyControl.textContent = "";

    data.difficulties.forEach(function (item) {
      const button = document.createElement("button");
      button.className = "difficulty-button";
      button.type = "button";
      button.dataset.difficultyId = item.id;
      button.textContent = item.label;
      button.setAttribute("aria-pressed", String(item.id === state.difficultyId));
      button.addEventListener("click", function () {
        state.difficultyId = item.id;
        state.misses = 0;
        updateDifficultyControl();
        updateHints();
        layoutLesson(true);
        if (state.running) elements.lessonStage.focus({ preventScroll: true });
      });
      elements.difficultyControl.appendChild(button);
    });
  }

  function updateDifficultyControl() {
    elements.difficultyControl.querySelectorAll(".difficulty-button").forEach(function (button) {
      button.setAttribute("aria-pressed", String(button.dataset.difficultyId === state.difficultyId));
    });
  }

  // Поле з усім текстом уроку — спільний модуль KlavioTextField (його використовують і «Слова»).
  const field = textFieldApi.create({ box: elements.lessonText, minLines: MIN_TEXT_LINES, maxLines: MAX_TEXT_LINES });

  function buildText() {
    field.setText(state.lesson.text);
    state.shownPosition = -1;
  }

  function updateText() {
    field.setPosition(state.position);
    state.shownPosition = state.position;
    elements.lessonStage.setAttribute("aria-label", "Введіть символ: " + input.describeCharacter(currentCharacter()));
  }

  function markMistake() {
    field.markMistake(state.position);
  }

  // Підгонку клавіш під висоту вікна виконує спільний модуль KlavioFit. Клавіатура важливіша
  // за долоні: якщо й мінімальні клавіші не вміщаються, долоні ховаються (is-compact).
  const fitter = fitApi.create({
    panel: elements.lessonPanel,
    keyboard: elements.keyboard,
    minKeySize: MIN_KEY_SIZE,
    margin: VIEW_MARGIN,
    mobileWidth: MOBILE_WIDTH,
    isActive: function () { return !elements.fingerSection.classList.contains("is-hidden"); },
    compact: function (on) { elements.fingerSection.classList.toggle("is-compact", on); },
    beforeFit: field.fitHeight,
    afterFit: field.keepVisible
  });

  // Підлаштовуємо поле й клавіатуру, а за потреби прокручуємо сторінку так,
  // щоб панель уроку стала одразу під шапкою.
  function layoutLesson(scroll) {
    if (elements.lessonView.hidden) return;
    fitter.fit();
    if (scroll) fitter.reveal();
  }

  const scheduleLayout = fitter.schedule;

  // Картка вступу накладається на клавіатуру, а коли її не видно — стоїть під полем тексту.
  function placeIntro() {
    const overlay = !elements.fingerSection.classList.contains("is-hidden") && window.innerWidth > MOBILE_WIDTH;
    const target = overlay ? elements.keyboard : elements.lessonStage;
    if (elements.introCard.parentNode !== target) target.appendChild(elements.introCard);
    elements.introCard.classList.toggle("is-overlay", overlay);
    elements.introCard.classList.toggle("is-inline", !overlay);
  }

  function showIntro() {
    const intro = core.lessonIntro(state.lesson, layouts, course().intros, layouts.getLanguage());
    window.clearTimeout(state.introTimer);
    if (!intro || state.drillWeak) {
      hideIntro(true);
      return;
    }
    elements.introTitle.textContent = intro.title;
    elements.introText.textContent = " " + intro.lines.join(" ");
    elements.introCard.hidden = false;
    placeIntro();
    state.introVisible = true;
    elements.introButton.setAttribute("aria-expanded", "true");
    void elements.introCard.offsetWidth;
    elements.introCard.classList.add("is-visible");
  }

  function hideIntro(immediate) {
    state.introVisible = false;
    elements.introButton.setAttribute("aria-expanded", "false");
    elements.introCard.classList.remove("is-visible");
    window.clearTimeout(state.introTimer);
    // На клавіатурі картка зникає одразу (без згасання), інакше крізь неї проглядає ряд цифр.
    if (immediate || elements.introCard.classList.contains("is-overlay")) {
      elements.introCard.hidden = true;
      return;
    }
    state.introTimer = window.setTimeout(function () { elements.introCard.hidden = true; }, 220);
  }

  function updateProgress() {
    const total = state.lesson.text.length;
    elements.progressLabel.textContent = state.position + " / " + total;
    elements.progressFill.style.width = (total > 0 ? (state.position / total) * 100 : 0) + "%";
  }

  function updateMetrics() {
    elements.accuracyValue.textContent = metricsApi.accuracy(state.metrics) + "%";
    elements.cpmValue.textContent = String(metricsApi.cpm(state.metrics));
    elements.streakValue.textContent = String(state.streak);
  }

  function updateFingerGuide(hints) {
    elements.fingerLabel.textContent = handsApi.update(elements.handsGuide, hints);
  }

  function updateHints() {
    const character = currentCharacter();
    const visible = core.hintVisibility(difficulty(), state.misses);
    const hints = layouts.hintsForCharacter(character);
    const wasHidden = elements.fingerSection.classList.contains("is-hidden");

    elements.keyboard.classList.toggle("has-hint", visible.keyboard);
    const combo = keyboard.setHint(character, visible.keyboard);

    // Комбінацію (Shift або Ctrl+Alt для «ґ») показуємо навіть тоді,
    // коли підсвічування клавіатури вимкнене: інакше «ґ» не набрати.
    const comboHint = combo || layouts.comboHintForCharacter(character);
    elements.comboHint.textContent = comboHint;
    elements.comboHint.hidden = !comboHint;

    elements.fingerSection.classList.toggle("is-hidden", !visible.finger);
    elements.fingerSection.classList.toggle("is-revealed", visible.revealed);
    elements.fingerTitle.hidden = !visible.finger;
    if (visible.finger) updateFingerGuide(hints);
    // Поле тексту стоїть над клавіатурою, тож не зсувається; підганяємо лише клавіатуру.
    if (wasHidden === visible.finger) layoutLesson(false);
    if (state.introVisible) placeIntro();
    return visible;
  }

  function setFeedback(message, kind) {
    elements.feedback.textContent = message;
    elements.feedback.className = "lesson-feedback";
    if (kind) elements.feedback.classList.add("is-" + kind);
  }

  function startStatsInterval() {
    if (state.statsInterval) return;
    state.statsInterval = window.setInterval(updateMetrics, 1000);
  }

  function stopStatsInterval() {
    if (!state.statsInterval) return;
    window.clearInterval(state.statsInterval);
    state.statsInterval = null;
  }

  function loadLesson(lessonId) {
    const lesson = course().lessons.find(function (item) { return item.id === Number(lessonId); });
    if (lesson) startLesson(lesson, null);
  }

  // Додаткова вправа на слабкі символи: складається з літер уроків до поточного включно.
  function startDrill(weak) {
    const texts = course().lessons.slice(0, state.lessonId).map(function (item) { return item.text; });
    startLesson({
      id: state.lessonId,
      focus: "Тренування: " + weak.join(" "),
      text: core.buildDrill(weak, texts.join(" "), texts, Math.random, layouts.getLanguage())
    }, weak);
  }

  // Той самий екран для уроку й для вправи (drillWeak — слабкі символи вправи або null).
  function startLesson(lesson, drillWeak) {
    stopStatsInterval();
    state.lessonId = lesson.id;
    state.lesson = lesson;
    state.drillWeak = drillWeak;
    state.errorCounts = {};
    state.position = 0;
    state.metrics = metricsApi.create();
    state.streak = 0;
    state.maxStreak = 0;
    state.misses = 0;
    state.running = true;
    state.inputLocked = false;

    elements.lessonNumber.textContent = drillWeak ? "Додаткова вправа" : lesson.id + " із " + course().lessons.length;
    elements.lessonTitle.textContent = lesson.focus;
    elements.layoutWarning.hidden = true;
    elements.lessonStage.classList.remove("is-error");
    keyboard.clearPressed();
    setFeedback("Починай, коли готовий");
    buildText();
    updateText();
    updateProgress();
    updateMetrics();
    updateHints();
    updateLessonSelect();
    elements.lessonView.hidden = false;
    elements.summaryView.hidden = true;
    layoutLesson(true);
    elements.introButton.hidden = Boolean(drillWeak);
    showIntro();
    elements.lessonStage.focus({ preventScroll: true });
  }

  function showSummary() {
    state.running = false;
    state.inputLocked = true;
    stopStatsInterval();
    metricsApi.finish(state.metrics);
    const isDrill = Boolean(state.drillWeak);
    if (!isDrill) state.completedInSession[layouts.getLanguage()].add(state.lessonId);
    updateLessonSelect();

    const accuracy = metricsApi.accuracy(state.metrics);
    elements.summaryKicker.textContent = isDrill ? "Вправу завершено" : "Урок " + state.lessonId + " завершено";

    // Слабкі символи пропонуємо лише після уроку, не після вправи.
    state.pendingWeak = isDrill ? [] : core.weakKeys(state.errorCounts, state.lesson.text, 3);
    elements.summaryWeak.hidden = state.pendingWeak.length === 0;
    elements.summaryDrill.hidden = state.pendingWeak.length === 0;
    elements.summaryWeak.textContent = "Найчастіше помилявся: " + state.pendingWeak.join(", ");
    elements.summaryRetry.textContent = "Заново";
    elements.summaryAccuracy.textContent = accuracy + "%";
    elements.summaryCpm.textContent = String(metricsApi.cpm(state.metrics));
    elements.summaryErrors.textContent = String(state.metrics.errors);
    elements.summaryTime.textContent = core.formatTime(metricsApi.durationMs(state.metrics));

    if (accuracy >= 98) {
      elements.summaryTitle.textContent = "Дуже точно!";
      elements.summaryMessage.textContent = "Чудова техніка. Можна переходити до наступного уроку.";
    } else if (accuracy >= 85) {
      elements.summaryTitle.textContent = "Гарна робота!";
      elements.summaryMessage.textContent = "Повтори урок, якщо хочеш закріпити нові клавіші.";
    } else {
      elements.summaryTitle.textContent = "Перш за все — точність";
      elements.summaryMessage.textContent = "Спробуй ще раз повільніше й уважно стеж за підказками.";
    }

    elements.summaryNext.textContent = isDrill ? "Повернутися до уроку " + state.lessonId :
      state.lessonId < course().lessons.length ? "Наступний урок →" : "Обрати урок";
    elements.lessonView.hidden = true;
    elements.summaryView.hidden = false;
    tones.complete();
    elements.summaryRetry.focus();
  }

  function handleCorrect(event) {
    state.inputLocked = true;
    metricsApi.recordCorrect(state.metrics);
    state.position += 1;
    state.misses = 0;
    state.streak += 1;
    state.maxStreak = Math.max(state.maxStreak, state.streak);
    elements.layoutWarning.hidden = true;
    elements.lessonStage.classList.remove("is-error");
    setFeedback("Правильно", "success");
    keyboard.flash(event.code, "is-pressed-correct", 260);
    updateProgress();
    updateMetrics();
    tones.correct();

    if (state.position >= state.lesson.text.length) {
      window.setTimeout(showSummary, 300);
      return;
    }

    window.setTimeout(function () {
      state.inputLocked = false;
      updateText();
      updateHints();
      setFeedback("Продовжуй у своєму темпі");
      elements.lessonStage.focus({ preventScroll: true });
    }, 105);
  }

  function handleError(event, expected) {
    metricsApi.recordError(state.metrics);
    state.streak = 0;
    state.misses += 1;
    if (expected.trim()) {
      // Регістр зберігаємо: помилки на великій літері (Shift) рахуються окремо.
      state.errorCounts[expected] = (state.errorCounts[expected] || 0) + 1;
    }
    elements.lessonStage.classList.remove("is-error");
    void elements.lessonStage.offsetWidth;
    elements.lessonStage.classList.add("is-error");
    keyboard.flash(event.code, "is-pressed-error", 260);
    markMistake();
    updateMetrics();
    tones.error();

    // Друга помилка на символі вмикає підказку, яку вимкнув режим.
    const revealed = state.misses === core.HINT_AFTER_MISSES && updateHints().revealed;

    const problem = input.errorHint(expected, event, layouts);
    elements.layoutWarning.hidden = problem.kind !== "layout";
    if (problem.kind === "layout") {
      setFeedback("");
      return;
    }
    // Коротке пояснення, чому з'явилась клавіатура; довге повідомлення не розтягує рядок.
    const note = " · підказка після " + core.HINT_AFTER_MISSES + " помилок";
    setFeedback(revealed && problem.message.length < 30 ? problem.message + note : problem.message, "error");
  }

  function handleKeydown(event) {
    if (event.key === "Escape" && state.introVisible) hideIntro(false);
    if (!state.running || state.inputLocked || !input.isTextAttempt(event)) return;

    const activeElement = document.activeElement;
    if (activeElement && activeElement.closest("button, a, input, select, label")) return;

    if (event.code === "Space") event.preventDefault();
    // Перше натискання ховає вступ і водночас зараховується як звичайна спроба.
    if (state.introVisible) hideIntro(false);

    if (!state.metrics.startedAt) {
      metricsApi.start(state.metrics);
      startStatsInterval();
    }

    const expected = currentCharacter();
    if (input.matchesCharacter(expected, event)) handleCorrect(event);
    else handleError(event, expected);
  }

  elements.lessonSelect.addEventListener("change", function () { loadLesson(Number(elements.lessonSelect.value)); });
  elements.restartButton.addEventListener("click", function () {
    if (state.drillWeak) startLesson(state.lesson, state.drillWeak);
    else loadLesson(state.lessonId);
  });
  elements.summaryRetry.addEventListener("click", function () {
    if (state.drillWeak) startDrill(state.drillWeak);
    else loadLesson(state.lessonId);
  });
  elements.introButton.addEventListener("click", function () {
    if (state.introVisible) hideIntro(false);
    else showIntro();
    if (state.running) elements.lessonStage.focus({ preventScroll: true });
  });
  elements.summaryDrill.addEventListener("click", function () { startDrill(state.pendingWeak); });
  elements.summaryNext.addEventListener("click", function () {
    if (state.drillWeak) loadLesson(state.lessonId);
    else if (state.lessonId < course().lessons.length) loadLesson(state.lessonId + 1);
    else elements.lessonSelect.focus();
  });
  document.addEventListener("keydown", handleKeydown);
  // Великий текст і контраст змінюють розміри: підганяємо поле й клавіатуру. Після закриття
  // меню «Aa» повертаємо фокус у вправу, щоб друкувати можна було одразу.
  // (fit.js сам слухає resize і зміну налаштувань.)
  window.addEventListener("klavio:prefs-close", function () {
    if (state.running) elements.lessonStage.focus({ preventScroll: true });
  });
  window.addEventListener("beforeunload", stopStatsInterval);
  // Після зміни ширини рядки переносяться інакше: перераховуємо висоту й повертаємо курсор у видиму зону.
  if (window.ResizeObserver) {
    let lastWidth = elements.lessonText.clientWidth;
    new ResizeObserver(function () {
      if (elements.lessonText.clientWidth === lastWidth) return;
      lastWidth = elements.lessonText.clientWidth;
      scheduleLayout();
    }).observe(elements.lessonText);
  }

  // Зміна мови друку без перезавантаження: новий курс, нова клавіатура, урок 1 нової мови.
  // Фокус повертаємо у вправу, щоб друкувати можна було одразу.
  function applyLanguage() {
    keyboard.setLanguage();
    state.drillWeak = null;
    state.lessonId = 1;
    state.lesson = course().lessons[0];
    buildLessonSelect();
    loadLesson(1);
  }

  window.addEventListener("klavio:lang-change", applyLanguage);

  buildLessonSelect();
  buildDifficultyControl();
  loadLesson(1);
})();
