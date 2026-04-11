import { persistState } from "./state.js";
import { escapeHtml, completeTask, renderRichText, setStatus, renderActivityMedia } from "./shared.js";

function getGroupResult(activityId, groupIndex, state) {
  return state.activityState[`${activityId}-result-${groupIndex}`];
}

function getGroupStateClass(activityId, groupIndex, state) {
  const result = getGroupResult(activityId, groupIndex, state);
  return typeof result === "boolean" ? (result ? "is-correct" : "is-wrong") : "";
}

function getGroupFeedback(activityId, groupIndex, state) {
  const result = getGroupResult(activityId, groupIndex, state);
  if (typeof result !== "boolean") return "";
  return result ? "Так, це правильна відповідь." : "Спробуй ще раз і подивись уважніше.";
}

export function renderPickTask(activity, state) {
  state.activityState[activity.id] = state.activityState[activity.id] || {};
  return `
    <article class="task-card" data-activity-id="${activity.id}">
      <div class="task-card__header">
        <div>
          <span class="task-badge">${escapeHtml(activity.badge)}</span>
          <h3>${escapeHtml(activity.title)}</h3>
          <p class="task-prompt">${escapeHtml(activity.prompt)}</p>
        </div>
      </div>
      <div class="pick-groups">
        ${activity.groups.map((group, groupIndex) => `
          <section class="pick-group ${getGroupStateClass(activity.id, groupIndex, state)}">
            <h4>${groupIndex + 1}. ${escapeHtml(group.question)}</h4>
            <div class="choices-grid choices-grid--compact">
              ${group.options.map((option, optionIndex) => {
                const selected = state.activityState[activity.id][groupIndex] === optionIndex;
                const checked = typeof getGroupResult(activity.id, groupIndex, state) === "boolean";
                const isCorrect = checked && selected && option.correct === true;
                const isWrong = checked && selected && option.correct !== true;
                const isCorrectAnswer = checked && !selected && option.correct === true;
                return `<button type="button" class="choice-button ${selected ? "is-selected" : ""} ${isCorrect ? "is-correct" : ""} ${isWrong ? "is-wrong" : ""} ${isCorrectAnswer ? "is-correct-answer" : ""}" data-pick-group="${groupIndex}" data-pick-option="${optionIndex}" aria-pressed="${selected}">${renderActivityMedia(option, { className: "choice-button__media", emojiClassName: "choice-button__emoji", imageClassName: "choice-button__image", altFallback: option.label })}<span>${escapeHtml(option.label)}</span></button>`;
              }).join("")}
            </div>
            <p class="inline-feedback ${getGroupStateClass(activity.id, groupIndex, state)}" data-pick-feedback="${activity.id}-${groupIndex}" aria-live="polite">${escapeHtml(getGroupFeedback(activity.id, groupIndex, state))}</p>
          </section>
        `).join("")}
      </div>
      <div class="actions-row">
        <button type="button" class="primary-button" data-check-pick="${activity.id}">Перевір</button>
        <button type="button" class="secondary-button" data-reset-pick="${activity.id}">Почати знову</button>
      </div>
      <p class="task-feedback" data-feedback="${activity.id}" aria-live="polite"></p>
      <div class="teacher-only method-box">${renderRichText(activity.teacherTip)}</div>
    </article>
  `;
}

export function setupPickTask(activity, state, refs, showFeedback, rerenderActivities) {
  document.querySelectorAll("[data-pick-group]").forEach((button) => {
    button.addEventListener("click", () => {
      const groupIndex = Number(button.dataset.pickGroup);
      const optionIndex = Number(button.dataset.pickOption);
      state.activityState[activity.id][groupIndex] = optionIndex;
      delete state.activityState[`${activity.id}-result-${groupIndex}`];
      persistState(state);
      rerenderActivities(`[data-pick-group="${groupIndex}"][data-pick-option="${optionIndex}"]`);
    });
  });

  document.querySelector(`[data-check-pick="${activity.id}"]`).addEventListener("click", () => {
    const allAnswered = activity.groups.every((_, index) => Number.isInteger(state.activityState[activity.id][index]));
    if (!allAnswered) {
      setStatus(refs.activities.querySelector(`[data-feedback="${activity.id}"]`), "Спочатку дай відповідь у кожному рядку.", "is-warning");
      showFeedback("Ще не всі рядки заповнені.", "is-warning", "!");
      return;
    }

    const ok = activity.groups.every((group, groupIndex) => {
      const selectedIndex = state.activityState[activity.id][groupIndex];
      const correct = group.options[selectedIndex]?.correct === true;
      state.activityState[`${activity.id}-result-${groupIndex}`] = correct;
      return correct;
    });

    persistState(state);

    if (ok) completeTask(activity.id, state, refs);

    rerenderActivities(`[data-check-pick="${activity.id}"]`);

    setStatus(refs.activities.querySelector(`[data-feedback="${activity.id}"]`), ok ? "Чудово! Усе правильно." : "Є помилки. Спробуй ще раз.", ok ? "is-success" : "is-warning");
    showFeedback(ok ? "Усі відповіді правильні." : "Є кілька помилок у виборі.", ok ? "is-success" : "is-warning", ok ? "✓" : "!");
  });

  document.querySelector(`[data-reset-pick="${activity.id}"]`).addEventListener("click", () => {
    state.activityState[activity.id] = {};
    activity.groups.forEach((_, groupIndex) => {
      delete state.activityState[`${activity.id}-result-${groupIndex}`];
    });
    persistState(state);
    rerenderActivities(`[data-pick-group="0"]`);
  });
}
