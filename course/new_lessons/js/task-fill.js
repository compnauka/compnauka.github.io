import { persistState } from "./state.js";
import { escapeHtml, completeTask, renderRichText, setStatus } from "./shared.js";

function isTextFillItem(item) {
  return item.inputType === "text";
}

function normalizeFillAnswer(value) {
  return String(value || "")
    .trim()
    .replace(/\s+/g, " ")
    .toLocaleLowerCase();
}

function isCorrectTextAnswer(item, value) {
  const acceptedAnswers = Array.isArray(item.acceptedAnswers) && item.acceptedAnswers.length > 0
    ? item.acceptedAnswers
    : [item.answer];

  const normalizedValue = normalizeFillAnswer(value);
  return acceptedAnswers.some((answer) => normalizeFillAnswer(answer) === normalizedValue);
}

function isCorrectFillAnswer(item, value) {
  return isTextFillItem(item)
    ? isCorrectTextAnswer(item, value)
    : value === item.answer;
}

function getItemResult(activityId, index, state) {
  return state.activityState[`${activityId}-result-${index}`];
}

function getItemStateClass(activityId, index, state) {
  const result = getItemResult(activityId, index, state);
  return typeof result === "boolean" ? (result ? "is-correct" : "is-wrong") : "";
}

function getItemFeedback(activityId, index, state) {
  const result = getItemResult(activityId, index, state);
  if (typeof result !== "boolean") return "";
  return result ? "Так, відповідь підходить." : "Спробуй іншу відповідь.";
}

function renderFillControl(activity, item, index, state) {
  const stateClass = getItemStateClass(activity.id, index, state);
  const value = state.activityState[`${activity.id}-${index}`] || "";

  if (isTextFillItem(item)) {
    return `
      <input
        type="text"
        class="${stateClass}"
        data-fill-text-id="${activity.id}"
        data-index="${index}"
        value="${escapeHtml(value)}"
        placeholder="${escapeHtml(item.placeholder || item.sample || "Впиши слово")}"
        autocomplete="off"
        spellcheck="false">
    `;
  }

  return `
    <select class="${stateClass}" data-fill-select-id="${activity.id}" data-index="${index}">
      <option value="">Обери слово</option>
      ${item.options.map((option) => `<option value="${escapeHtml(option)}" ${value === option ? "selected" : ""}>${escapeHtml(option)}</option>`).join("")}
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
        ${activity.items.map((item, index) => `
          <div class="fill-item ${getItemStateClass(activity.id, index, state)}">
            <label>
              <span>${escapeHtml(item.text)}</span>
              ${renderFillControl(activity, item, index, state)}
            </label>
            <p class="fill-item__feedback ${getItemStateClass(activity.id, index, state)}" data-fill-feedback="${activity.id}-${index}" aria-live="polite">${escapeHtml(getItemFeedback(activity.id, index, state))}</p>
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
  document.querySelectorAll(`[data-fill-text-id="${activity.id}"]`).forEach((input) => {
    input.addEventListener("input", () => {
      const index = Number(input.dataset.index);
      state.activityState[`${activity.id}-${index}`] = input.value;
      delete state.activityState[`${activity.id}-result-${index}`];
      persistState(state);
      clearLiveFeedback(activity, index, refs, input);
    });
  });

  document.querySelectorAll(`[data-fill-select-id="${activity.id}"]`).forEach((select) => {
    select.addEventListener("change", () => {
      const index = Number(select.dataset.index);
      state.activityState[`${activity.id}-${index}`] = select.value;
      delete state.activityState[`${activity.id}-result-${index}`];
      persistState(state);
      if (typeof rerenderTask === "function") {
        rerenderTask(`[data-fill-select-id="${activity.id}"][data-index="${index}"]`);
      }
    });
  });

  document.querySelector(`[data-check-fill="${activity.id}"]`).addEventListener("click", () => {
    const controls = activity.items.map((item, index) => (
      isTextFillItem(item)
        ? document.querySelector(`[data-fill-text-id="${activity.id}"][data-index="${index}"]`)
        : document.querySelector(`[data-fill-select-id="${activity.id}"][data-index="${index}"]`)
    ));

    const allAnswered = activity.items.every((_, index) => String(controls[index]?.value || "").trim());
    if (!allAnswered) {
      const message = activity.items.some(isTextFillItem)
        ? "Спочатку заповни всі рядки."
        : "Спочатку обери слово в кожному рядку.";
      setStatus(refs.activities.querySelector(`[data-feedback="${activity.id}"]`), message, "is-warning");
      showFeedback("Ще не всі рядки заповнені.", "is-warning", "!");
      return;
    }

    const ok = activity.items.every((item, index) => {
      const value = controls[index].value;
      const correct = isCorrectFillAnswer(item, value);
      state.activityState[`${activity.id}-result-${index}`] = correct;
      return correct;
    });

    persistState(state);

    if (ok) completeTask(activity.id, state, refs);

    if (typeof rerenderTask === "function") {
      rerenderTask(`[data-check-fill="${activity.id}"]`);
    }

    const successMessage = activity.items.some(isTextFillItem)
      ? "Чудово! Усі відповіді підходять."
      : "Чудово! Усі слова на місці.";
    const retryMessage = activity.items.some(isTextFillItem)
      ? "Є неточності. Спробуй ще раз."
      : "Є помилки. Спробуй ще раз.";
    const toastSuccess = activity.items.some(isTextFillItem)
      ? "Усі відповіді введено правильно."
      : "Усі слова вибрано правильно.";
    const toastRetry = activity.items.some(isTextFillItem)
      ? "У відповідях є неточності."
      : "У виборі слів є помилки.";

    setStatus(refs.activities.querySelector(`[data-feedback="${activity.id}"]`), ok ? successMessage : retryMessage, ok ? "is-success" : "is-warning");
    showFeedback(ok ? toastSuccess : toastRetry, ok ? "is-success" : "is-warning", ok ? "✓" : "!");
  });
}
