import { persistState } from "./state.js";
import { escapeHtml, completeTask, renderRichText, setStatus } from "./shared.js";

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
              <select class="${getSentenceStateClass(activity.id, index, state)}" data-fill-id="${activity.id}" data-index="${index}">
                <option value="">Обери слово</option>
                ${sentence.options.map((option) => `<option value="${escapeHtml(option)}" ${state.activityState[`${activity.id}-${index}`] === option ? "selected" : ""}>${escapeHtml(option)}</option>`).join("")}
              </select>
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

export function setupFillTask(activity, state, refs, showFeedback, rerenderTask) {
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

  document.querySelector(`[data-check-fill="${activity.id}"]`).addEventListener("click", () => {
    const selects = document.querySelectorAll(`[data-fill-id="${activity.id}"]`);

    const allAnswered = activity.sentences.every((_, index) => selects[index].value);
    if (!allAnswered) {
      setStatus(refs.activities.querySelector(`[data-feedback="${activity.id}"]`), "Спочатку обери слово в кожному рядку.", "is-warning");
      showFeedback("Ще не всі рядки заповнені.", "is-warning", "!");
      return;
    }

    const ok = activity.sentences.every((sentence, index) => {
      const correct = selects[index].value === sentence.answer;
      state.activityState[`${activity.id}-result-${index}`] = correct;
      return correct;
    });

    persistState(state);

    if (ok) completeTask(activity.id, state, refs);

    if (typeof rerenderTask === "function") {
      rerenderTask(`[data-check-fill="${activity.id}"]`);
    }

    setStatus(refs.activities.querySelector(`[data-feedback="${activity.id}"]`), ok ? "Чудово! Усі слова на місці." : "Є помилки. Спробуй ще раз.", ok ? "is-success" : "is-warning");
    showFeedback(ok ? "Усі слова вибрано правильно." : "У виборі слів є помилки.", ok ? "is-success" : "is-warning", ok ? "✓" : "!");
  });
}
