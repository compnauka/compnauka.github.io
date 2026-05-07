import { persistState } from "./state.js";
import { escapeHtml, completeTask, renderRichText, setStatus } from "./shared.js";

function getStatementResult(activityId, index, state) {
  return state.activityState[`${activityId}-result-${index}`];
}

function getStatementStateClass(activityId, index, state) {
  const result = getStatementResult(activityId, index, state);
  return typeof result === "boolean" ? (result ? "is-correct" : "is-wrong") : "";
}

function getStatementFeedback(activityId, index, state) {
  const result = getStatementResult(activityId, index, state);
  if (typeof result !== "boolean") return "";
  return result ? "Так, це правильно." : "Подумай ще раз і спробуй інакше.";
}

export function renderTrueFalseTask(activity, state) {
  state.activityState[activity.id] = state.activityState[activity.id] || {};

  const answeredCount = activity.statements.filter((_, index) => state.activityState[activity.id][index] !== undefined).length;

  return `
    <article class="task-card" data-activity-id="${activity.id}">
      <div class="task-card__header">
        <div>
          <span class="task-badge${activity.optional ? ' task-badge--optional' : ''}">${escapeHtml(activity.badge)}</span>
          <h3>${escapeHtml(activity.title)}</h3>
          <p class="task-prompt">${escapeHtml(activity.prompt)}</p>
        </div>
        <span class="task-score"${answeredCount === 0 ? ' data-score-zero' : ''}>${answeredCount}/${activity.statements.length}</span>
      </div>
      <div class="truefalse-list">
        ${activity.statements.map((statement, index) => `
          <section class="truefalse-item ${getStatementStateClass(activity.id, index, state)}">
            <div class="truefalse-item__text">
              <span class="truefalse-item__emoji" aria-hidden="true">${escapeHtml(statement.emoji || "💬")}</span>
              <p><strong>${index + 1}.</strong> ${escapeHtml(statement.text)}</p>
            </div>
            <div class="truefalse-item__actions" role="group" aria-label="Вибери відповідь">
              ${renderStatementButton(activity.id, index, true, state)}
              ${renderStatementButton(activity.id, index, false, state)}
            </div>
            <p class="inline-feedback ${getStatementStateClass(activity.id, index, state)}" data-truefalse-feedback="${activity.id}-${index}" aria-live="polite">${escapeHtml(getStatementFeedback(activity.id, index, state))}</p>
          </section>
        `).join("")}
      </div>
      <div class="actions-row">
        <button type="button" class="primary-button" data-check-truefalse="${activity.id}">Перевір</button>
        <button type="button" class="secondary-button" data-reset-truefalse="${activity.id}">Почати знову</button>
      </div>
      <p class="task-feedback" data-feedback="${activity.id}" aria-live="polite"></p>
      <div class="teacher-only method-box">${renderRichText(activity.teacherTip)}</div>
    </article>
  `;
}

function renderStatementButton(activityId, index, value, state) {
  const selected = state.activityState[activityId]?.[index] === value;
  const result = getStatementResult(activityId, index, state);
  const checked = typeof result === "boolean";
  const emoji = value ? "✅" : "❌";
  const label = value ? "Правда" : "Ні";
  const isCorrect = checked && selected && result;
  const isWrong = checked && selected && !result;

  return `
    <button
      type="button"
      class="truth-button ${selected ? "is-selected" : ""} ${isCorrect ? "is-correct" : ""} ${isWrong ? "is-wrong" : ""}"
      data-truefalse-id="${activityId}"
      data-index="${index}"
      data-value="${value}"
      aria-pressed="${selected}">
      <span aria-hidden="true">${emoji}</span>
      <span>${label}</span>
    </button>
  `;
}

export function setupTrueFalseTask(activity, state, refs, showFeedback, rerenderActivities) {
  document.querySelectorAll(`[data-truefalse-id="${activity.id}"]`).forEach((button) => {
    button.addEventListener("click", () => {
      const index = Number(button.dataset.index);
      state.activityState[activity.id][index] = button.dataset.value === "true";
      delete state.activityState[`${activity.id}-result-${index}`];
      persistState(state);
      rerenderActivities(
        `[data-truefalse-id="${activity.id}"][data-index="${index}"][data-value="${button.dataset.value}"]`
      );
    });
  });

  document.querySelector(`[data-check-truefalse="${activity.id}"]`).addEventListener("click", () => {
    const allAnswered = activity.statements.every((_, index) => state.activityState[activity.id][index] !== undefined);
    if (!allAnswered) {
      setStatus(refs.activities.querySelector(`[data-feedback="${activity.id}"]`), "Спочатку дай відповідь у кожному рядку.", "is-warning");
      showFeedback("Ще не всі твердження мають відповідь.", "is-warning", "!");
      return;
    }

    const ok = activity.statements.every((statement, index) => {
      const correct = state.activityState[activity.id][index] === statement.answer;
      state.activityState[`${activity.id}-result-${index}`] = correct;
      return correct;
    });

    persistState(state);

    if (ok) completeTask(activity.id, state, refs);

    rerenderActivities(`[data-check-truefalse="${activity.id}"]`);

    setStatus(
      refs.activities.querySelector(`[data-feedback="${activity.id}"]`),
      ok ? "Чудово! Усе правильно." : "Є помилки. Перевір ще раз.",
      ok ? "is-success" : "is-warning"
    );
    showFeedback(ok ? "Усі твердження перевірено правильно." : "У деяких твердженнях є помилки.", ok ? "is-success" : "is-warning", ok ? "✓" : "!");
  });

  document.querySelector(`[data-reset-truefalse="${activity.id}"]`).addEventListener("click", () => {
    state.activityState[activity.id] = {};
    activity.statements.forEach((_, index) => {
      delete state.activityState[`${activity.id}-result-${index}`];
    });
    persistState(state);
    rerenderActivities(`[data-truefalse-id="${activity.id}"]`);
  });
}
