import { persistState } from "./state.js";
import { escapeHtml, completeTask, renderRichText, setStatus } from "./shared.js";

function isTextFillActivity(activity) {
  return activity.inputMode === "text";
}

function normalizeFillAnswer(value) {
  return String(value || "")
    .trim()
    .replace(/\s+/g, " ")
    .toLocaleLowerCase();
}

function isCorrectTextAnswer(sentence, value) {
  const acceptedAnswers = Array.isArray(sentence.acceptedAnswers) && sentence.acceptedAnswers.length > 0
    ? sentence.acceptedAnswers
    : [sentence.answer];

  const normalizedValue = normalizeFillAnswer(value);
  return acceptedAnswers.some((answer) => normalizeFillAnswer(answer) === normalizedValue);
}

function getSentenceResult(activityId, index, state) {
  return state.activityState[`${activityId}-result-${index}`];
}

function getSentenceStateClass(activityId, index, state) {
  const result = getSentenceResult(activityId, index, state);
  return typeof result === "boolean" ? (result ? "is-correct" : "is-wrong") : "";
}

function getSentenceFeedback(activityId, index, state) {
  const result = getSentenceResult(activityId, index, state);
  if (typeof result !== "boolean") return "";
  return result ? "Так, слово на місці." : "Спробуй інше слово.";
}

function renderFillControl(activity, sentence, index, state) {
  const stateClass = getSentenceStateClass(activity.id, index, state);
  const value = state.activityState[`${activity.id}-${index}`] || "";

  if (isTextFillActivity(activity)) {
    return `
      <input
        type="text"
        class="${stateClass}"
        data-fill-text-id="${activity.id}"
        data-index="${index}"
        value="${escapeHtml(value)}"
        placeholder="${escapeHtml(sentence.sample || "Впиши слово")}"
        autocomplete="off"
        spellcheck="false">
    `;
  }

  return `
    <select class="${stateClass}" data-fill-id="${activity.id}" data-index="${index}">
      <option value="">Обери слово</option>
      ${sentence.options.map((option) => `<option value="${escapeHtml(option)}" ${value === option ? "selected" : ""}>${escapeHtml(option)}</option>`).join("")}
    </select>
  `;
}

export function renderFillTask(activity, state) {
  return `
    <article class="task-card" data-activity-id="${activity.id}">
      <div class="task-card__header">
        <div>
          <span class="task-badge">${escapeHtml(activity.badge)}</span>
          <h3>${escapeHtml(activity.title)}</h3>
          <p class="task-prompt">${escapeHtml(activity.prompt)}</p>
        </div>
      </div>
      <div class="fill-grid">
        ${activity.sentences.map((sentence, index) => `
          <div class="fill-item ${getSentenceStateClass(activity.id, index, state)}">
            <label>
              <span>${escapeHtml(sentence.text)}</span>
              ${renderFillControl(activity, sentence, index, state)}
            </label>
            <p class="fill-item__feedback ${getSentenceStateClass(activity.id, index, state)}" data-fill-feedback="${activity.id}-${index}" aria-live="polite">${escapeHtml(getSentenceFeedback(activity.id, index, state))}</p>
          </div>
        `).join("")}
      </div>
      <div class="actions-row">
        <button type="button" class="primary-button" data-check-fill="${activity.id}">Перевір</button>
      </div>
      <p class="task-feedback" data-feedback="${activity.id}" aria-live="polite"></p>
      <div class="teacher-only method-box">${renderRichText(activity.teacherTip)}</div>
    </article>
  `;
}

function clearLiveFeedback(activity, index, refs, control) {
  const item = control.closest(".fill-item");
  const feedback = refs.activities.querySelector(`[data-fill-feedback="${activity.id}-${index}"]`);
  const taskFeedback = refs.activities.querySelector(`[data-feedback="${activity.id}"]`);

  item?.classList.remove("is-correct", "is-wrong");
  control.classList.remove("is-correct", "is-wrong");

  if (feedback) {
    feedback.textContent = "";
    feedback.className = "fill-item__feedback";
  }

  setStatus(taskFeedback, "", "");
}

export function setupFillTask(activity, state, refs, showFeedback, rerenderTask) {
  if (isTextFillActivity(activity)) {
    document.querySelectorAll(`[data-fill-text-id="${activity.id}"]`).forEach((input) => {
      input.addEventListener("input", () => {
        const index = Number(input.dataset.index);
        state.activityState[`${activity.id}-${index}`] = input.value;
        delete state.activityState[`${activity.id}-result-${index}`];
        persistState(state);
        clearLiveFeedback(activity, index, refs, input);
      });
    });
  } else {
    document.querySelectorAll(`[data-fill-id="${activity.id}"]`).forEach((select) => {
      select.addEventListener("change", () => {
        const index = Number(select.dataset.index);
        state.activityState[`${activity.id}-${index}`] = select.value;
        delete state.activityState[`${activity.id}-result-${index}`];
        persistState(state);
        if (typeof rerenderTask === "function") {
          rerenderTask(`[data-fill-id="${activity.id}"][data-index="${index}"]`);
        }
      });
    });
  }

  document.querySelector(`[data-check-fill="${activity.id}"]`).addEventListener("click", () => {
    const controls = isTextFillActivity(activity)
      ? document.querySelectorAll(`[data-fill-text-id="${activity.id}"]`)
      : document.querySelectorAll(`[data-fill-id="${activity.id}"]`);

    const allAnswered = activity.sentences.every((_, index) => String(controls[index].value || "").trim());
    if (!allAnswered) {
      const message = isTextFillActivity(activity)
        ? "Спочатку впиши відповідь у кожному рядку."
        : "Спочатку обери слово в кожному рядку.";
      setStatus(refs.activities.querySelector(`[data-feedback="${activity.id}"]`), message, "is-warning");
      showFeedback("Ще не всі рядки заповнені.", "is-warning", "!");
      return;
    }

    const ok = activity.sentences.every((sentence, index) => {
      const value = controls[index].value;
      const correct = isTextFillActivity(activity)
        ? isCorrectTextAnswer(sentence, value)
        : value === sentence.answer;
      state.activityState[`${activity.id}-result-${index}`] = correct;
      return correct;
    });

    persistState(state);

    if (ok) completeTask(activity.id, state, refs);

    if (typeof rerenderTask === "function") {
      rerenderTask(isTextFillActivity(activity) ? `[data-fill-text-id="${activity.id}"][data-index="0"]` : `[data-check-fill="${activity.id}"]`);
    }

    const successMessage = isTextFillActivity(activity)
      ? "Чудово! Усі відповіді підходять."
      : "Чудово! Усі слова на місці.";
    const retryMessage = isTextFillActivity(activity)
      ? "Є неточності. Спробуй ще раз."
      : "Є помилки. Спробуй ще раз.";
    const toastSuccess = isTextFillActivity(activity)
      ? "Усі відповіді введено правильно."
      : "Усі слова вибрано правильно.";
    const toastRetry = isTextFillActivity(activity)
      ? "У відповідях є неточності."
      : "У виборі слів є помилки.";

    setStatus(refs.activities.querySelector(`[data-feedback="${activity.id}"]`), ok ? successMessage : retryMessage, ok ? "is-success" : "is-warning");
    showFeedback(ok ? toastSuccess : toastRetry, ok ? "is-success" : "is-warning", ok ? "✓" : "!");
  });
}
