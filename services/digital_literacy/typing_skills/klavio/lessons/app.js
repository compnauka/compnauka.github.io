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

  if (!data || !core || !metricsApi || !layouts || !input || !keyboardApi || !soundApi || !runtime || !settings) {
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
    textDone: document.getElementById("text-done"),
    textCurrent: document.getElementById("text-current"),
    textTodo: document.getElementById("text-todo"),
    feedback: document.getElementById("lesson-feedback"),
    layoutWarning: document.getElementById("layout-warning"),
    fingerSection: document.getElementById("finger-section"),
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
    summaryNext: document.getElementById("summary-next")
  };

  const state = {
    lessonId: 1,
    lesson: data.lessons[0],
    difficultyId: "guided",
    position: 0,
    metrics: metricsApi.create(),
    streak: 0,
    maxStreak: 0,
    running: false,
    inputLocked: false,
    completedInSession: new Set(),
    statsInterval: null
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

    data.groups.forEach(function (group) {
      const optionGroup = document.createElement("optgroup");
      optionGroup.label = group.title;

      data.lessons.filter(function (lesson) {
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
    elements.lessonSelect.value = String(state.lessonId);
    elements.lessonSelect.querySelectorAll("option").forEach(function (option) {
      const lessonId = Number(option.value);
      const lesson = data.lessons[lessonId - 1];
      const marker = state.completedInSession.has(lessonId) ? " ✓" : "";
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
        updateDifficultyControl();
        updateHints();
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

  function updateText() {
    const view = core.textWindow(state.lesson.text, state.position);
    const current = view.current;

    elements.textDone.textContent = view.done;
    elements.textTodo.textContent = view.todo;
    elements.textCurrent.textContent = input.displayCharacter(current);
    elements.textCurrent.classList.toggle("is-space", current === " ");

    const accessibleCharacter = input.describeCharacter(current);
    elements.lessonStage.setAttribute("aria-label", "Введіть символ: " + accessibleCharacter);
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
    elements.handsGuide.querySelectorAll(".is-active").forEach(function (finger) {
      finger.classList.remove("is-active");
    });

    if (hints.length === 0) {
      elements.fingerLabel.textContent = "—";
      return;
    }

    hints.forEach(function (hint) {
      if (hint.hand === "both") {
        elements.handsGuide.querySelectorAll('[data-finger="thumb"]').forEach(function (finger) {
          finger.classList.add("is-active");
        });
      } else {
        const finger = elements.handsGuide.querySelector('.hand-visual[data-hand="' + hint.hand + '"] [data-finger="' + hint.finger + '"]');
        if (finger) finger.classList.add("is-active");
      }
    });

    if (hints.length === 1) {
      elements.fingerLabel.textContent = handLabel(hints[0].hand) + " · " + hints[0].name;
    } else {
      elements.fingerLabel.textContent = handLabel(hints[0].hand) + " · " + hints[0].name + " + Shift";
    }
  }

  function updateHints() {
    const character = currentCharacter();
    const config = difficulty();
    const hints = layouts.hintsForCharacter(character);

    elements.keyboard.classList.toggle("has-hint", config.keyboardHint);
    const combo = keyboard.setHint(character, config.keyboardHint);

    // Комбінацію (Shift або Ctrl+Alt для «ґ») показуємо навіть тоді,
    // коли підсвічування клавіатури вимкнене: інакше «ґ» не набрати.
    const comboHint = combo || layouts.comboHintForCharacter(character);
    elements.comboHint.textContent = comboHint;
    elements.comboHint.hidden = !comboHint;

    elements.fingerSection.classList.toggle("is-hidden", !config.fingerHint);
    if (config.fingerHint) updateFingerGuide(hints);
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
    const lesson = data.lessons.find(function (item) { return item.id === Number(lessonId); });
    if (!lesson) return;

    stopStatsInterval();
    state.lessonId = lesson.id;
    state.lesson = lesson;
    state.position = 0;
    state.metrics = metricsApi.create();
    state.streak = 0;
    state.maxStreak = 0;
    state.running = true;
    state.inputLocked = false;

    elements.lessonNumber.textContent = lesson.id + " із " + data.lessons.length;
    elements.lessonTitle.textContent = lesson.focus;
    elements.layoutWarning.hidden = true;
    elements.lessonStage.classList.remove("is-error");
    keyboard.clearPressed();
    setFeedback("Починай, коли готовий");
    updateText();
    updateProgress();
    updateMetrics();
    updateHints();
    updateLessonSelect();
    elements.lessonView.hidden = false;
    elements.summaryView.hidden = true;
    elements.lessonStage.focus({ preventScroll: true });
  }

  function showSummary() {
    state.running = false;
    state.inputLocked = true;
    stopStatsInterval();
    metricsApi.finish(state.metrics);
    state.completedInSession.add(state.lessonId);
    updateLessonSelect();

    const accuracy = metricsApi.accuracy(state.metrics);
    elements.summaryKicker.textContent = "Урок " + state.lessonId + " завершено";
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

    elements.summaryNext.textContent = state.lessonId < data.lessons.length ? "Наступний урок →" : "Обрати урок";
    elements.lessonView.hidden = true;
    elements.summaryView.hidden = false;
    tones.complete();
    elements.summaryRetry.focus();
  }

  function handleCorrect(event) {
    state.inputLocked = true;
    metricsApi.recordCorrect(state.metrics);
    state.position += 1;
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
    elements.lessonStage.classList.remove("is-error");
    void elements.lessonStage.offsetWidth;
    elements.lessonStage.classList.add("is-error");
    keyboard.flash(event.code, "is-pressed-error", 260);
    updateMetrics();
    tones.error();

    const problem = input.issue(expected, event);
    if (problem === "layout") {
      elements.layoutWarning.hidden = false;
      setFeedback("Зараз увімкнено іншу розкладку", "error");
    } else if (problem === "case") {
      elements.layoutWarning.hidden = true;
      setFeedback("Зверни увагу на велику або малу літеру", "error");
    } else {
      elements.layoutWarning.hidden = true;
      setFeedback("Спробуй ще раз — потрібний символ не змінився", "error");
    }
  }

  function handleKeydown(event) {
    if (!state.running || state.inputLocked || !input.isTextAttempt(event)) return;

    const activeElement = document.activeElement;
    if (activeElement && activeElement.closest("button, a, input, select, label")) return;

    if (event.code === "Space") event.preventDefault();

    if (!state.metrics.startedAt) {
      metricsApi.start(state.metrics);
      startStatsInterval();
    }

    const expected = currentCharacter();
    if (input.matchesCharacter(expected, event)) handleCorrect(event);
    else handleError(event, expected);
  }

  elements.lessonSelect.addEventListener("change", function () { loadLesson(Number(elements.lessonSelect.value)); });
  elements.restartButton.addEventListener("click", function () { loadLesson(state.lessonId); });
  elements.summaryRetry.addEventListener("click", function () { loadLesson(state.lessonId); });
  elements.summaryNext.addEventListener("click", function () {
    if (state.lessonId < data.lessons.length) loadLesson(state.lessonId + 1);
    else elements.lessonSelect.focus();
  });
  document.addEventListener("keydown", handleKeydown);
  window.addEventListener("beforeunload", stopStatsInterval);

  buildLessonSelect();
  buildDifficultyControl();
  loadLesson(1);
})();
