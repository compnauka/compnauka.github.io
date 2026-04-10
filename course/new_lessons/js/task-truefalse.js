import { persistState } from "./state.js";
import { escapeHtml, completeTask, setStatus } from "./shared.js";

export function renderTrueFalseTask(activity, state) {
  state.activityState[activity.id] = state.activityState[activity.id] || {};

  const answeredCount = activity.statements.filter((_, index) => state.activityState[activity.id][index] !== undefined).length;

  return `
    <article class="task-card" data-activity-id="${activity.id}">
      <div class="task-card__header">
        <div>
          <span class="task-badge">${escapeHtml(activity.badge)}</span>
          <h3>${escapeHtml(activity.title)}</h3>
          <p class="task-prompt">${escapeHtml(activity.prompt)}</p>
        </div>
        <span class="task-score">${answeredCount}/${activity.statements.length}</span>
      </div>
      <div class="truefalse-list">
        ${activity.statements.map((statement, index) => `
          <section class="truefalse-item">
            <div class="truefalse-item__text">
              <span class="truefalse-item__emoji" aria-hidden="true">${escapeHtml(statement.emoji || "💬")}</span>
              <p><strong>${index + 1}.</strong> ${escapeHtml(statement.text)}</p>
            </div>
            <div class="truefalse-item__actions" role="group" aria-label="Вибір відповіді">
              ${renderStatementButton(activity.id, index, true, state)}
              ${renderStatementButton(activity.id, index, false, state)}
            </div>
          </section>
        `).join("")}
      </div>
      <div class="actions-row">
        <button type="button" class="primary-button" data-check-truefalse="${activity.id}">Перевірити</button>
        <button type="button" class="secondary-button" data-reset-truefalse="${activity.id}">Скинути</button>
      </div>
      <p class="task-feedback" data-feedback="${activity.id}" aria-live="polite"></p>
      <div class="teacher-only method-box">${escapeHtml(activity.teacherTip)}</div>
    </article>
  `;
}

function renderStatementButton(activityId, index, value, state) {
  const selected = state.activityState[activityId]?.[index] === value;
  const emoji = value ? "✅" : "❌";
  const label = value ? "Правда" : "Хиба";
  return `
    <button
      type="button"
      class="truth-button ${selected ? "is-selected" : ""}"
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
      persistState(state);
      rerenderActivities();
    });
  });

  document.querySelector(`[data-check-truefalse="${activity.id}"]`).addEventListener("click", () => {
    const allAnswered = activity.statements.every((_, index) => state.activityState[activity.id][index] !== undefined);
    if (!allAnswered) {
      setStatus(refs.activities.querySelector(`[data-feedback="${activity.id}"]`), "Спочатку дай відповідь у кожному рядку.", "is-warning");
      showFeedback("Ще не всі твердження мають відповідь.", "is-warning", "!");
      return;
    }

    const ok = activity.statements.every((statement, index) => state.activityState[activity.id][index] === statement.answer);
    if (ok) completeTask(activity.id, state, refs);

    setStatus(
      refs.activities.querySelector(`[data-feedback="${activity.id}"]`),
      ok ? "Чудово! Усі твердження визначено правильно." : "Є помилки. Перевір твердження ще раз.",
      ok ? "is-success" : "is-warning"
    );
    showFeedback(ok ? "Усі твердження перевірено правильно." : "У деяких твердженнях є помилки.", ok ? "is-success" : "is-warning", ok ? "✓" : "!");
  });

  document.querySelector(`[data-reset-truefalse="${activity.id}"]`).addEventListener("click", () => {
    state.activityState[activity.id] = {};
    persistState(state);
    rerenderActivities();
  });
}
