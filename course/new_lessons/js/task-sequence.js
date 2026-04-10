import { persistState } from "./state.js";
import { escapeHtml, completeTask, renderRichText, setStatus } from "./shared.js";

export function renderSequenceTask(activity, state) {
  state.activityState[activity.id] = state.activityState[activity.id] || { order: [] };
  const selectedOrder = state.activityState[activity.id].order || [];
  const selectedSet = new Set(selectedOrder);
  const labelById = new Map(activity.options.map((option) => [option.id, option.label]));
  const available = activity.options.filter((option) => !selectedSet.has(option.id));

  return `
    <article class="task-card" data-activity-id="${activity.id}">
      <div class="task-card__header">
        <div>
          <span class="task-badge">${escapeHtml(activity.badge)}</span>
          <h3>${escapeHtml(activity.title)}</h3>
          <p class="task-prompt">${escapeHtml(activity.prompt)}</p>
        </div>
      </div>

      <div class="stack">
        <div class="choices-grid choices-grid--compact">
          ${available.map((option) => `
            <button
              type="button"
              class="choice-button"
              data-sequence-pick="${activity.id}"
              data-step-id="${escapeHtml(option.id)}">
              ${escapeHtml(option.label)}
            </button>
          `).join("") || `<p class="task-note">Усі кроки вже додані в ланцюжок.</p>`}
        </div>

        <div class="sequence-list" aria-label="Поточний ланцюжок">
          ${selectedOrder.map((stepId, index) => `
            <div class="sequence-item">
              <span><strong>${index + 1}.</strong> ${escapeHtml(labelById.get(stepId) || "")}</span>
              <button
                type="button"
                class="secondary-button"
                data-sequence-remove="${activity.id}"
                data-step-id="${escapeHtml(stepId)}">
                Прибрати
              </button>
            </div>
          `).join("") || `<p class="task-note">Спочатку додай кроки у правильному порядку.</p>`}
        </div>
      </div>

      <div class="actions-row">
        <button type="button" class="primary-button" data-check-sequence="${activity.id}">Перевірити</button>
        <button type="button" class="secondary-button" data-reset-sequence="${activity.id}">Скинути</button>
      </div>
      <p class="task-feedback" data-feedback="${activity.id}" aria-live="polite"></p>
      <div class="teacher-only method-box">${renderRichText(activity.teacherTip)}</div>
    </article>
  `;
}

export function setupSequenceTask(activity, state, refs, showFeedback, rerenderTask) {
  document.querySelectorAll(`[data-sequence-pick="${activity.id}"]`).forEach((button) => {
    button.addEventListener("click", () => {
      const stepId = button.dataset.stepId;
      const selected = [...(state.activityState[activity.id].order || [])];
      if (selected.includes(stepId)) return;
      selected.push(stepId);
      state.activityState[activity.id].order = selected;
      persistState(state);
      rerenderTask(`[data-check-sequence="${activity.id}"]`);
    });
  });

  document.querySelectorAll(`[data-sequence-remove="${activity.id}"]`).forEach((button) => {
    button.addEventListener("click", () => {
      const stepId = button.dataset.stepId;
      state.activityState[activity.id].order = (state.activityState[activity.id].order || [])
        .filter((value) => value !== stepId);
      persistState(state);
      rerenderTask(`[data-check-sequence="${activity.id}"]`);
    });
  });

  document.querySelector(`[data-check-sequence="${activity.id}"]`).addEventListener("click", () => {
    const selected = state.activityState[activity.id].order || [];
    const complete = selected.length === activity.correctOrder.length;

    if (!complete) {
      setStatus(
        refs.activities.querySelector(`[data-feedback="${activity.id}"]`),
        "Додай усі кроки в ланцюжок перед перевіркою.",
        "is-warning"
      );
      showFeedback("Спочатку склади повний ланцюжок.", "is-warning", "!");
      return;
    }

    const ok = JSON.stringify(selected) === JSON.stringify(activity.correctOrder);
    if (ok) completeTask(activity.id, state, refs);

    setStatus(
      refs.activities.querySelector(`[data-feedback="${activity.id}"]`),
      ok
        ? "Чудово! Ланцюжок повідомлення складено правильно."
        : "Є неточність у порядку. Перевір ще раз.",
      ok ? "is-success" : "is-warning"
    );
    showFeedback(
      ok ? "Ланцюжок складено правильно." : "У ланцюжку є помилка.",
      ok ? "is-success" : "is-warning",
      ok ? "✓" : "!"
    );
  });

  document.querySelector(`[data-reset-sequence="${activity.id}"]`).addEventListener("click", () => {
    state.activityState[activity.id] = { order: [] };
    persistState(state);
    rerenderTask(`[data-sequence-pick="${activity.id}"]`);
  });
}
