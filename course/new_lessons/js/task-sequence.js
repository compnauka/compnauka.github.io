import { persistState } from "./state.js";
import { escapeHtml, completeTask, renderRichText, setStatus } from "./shared.js";

function getSequenceStateClass(activityId, state) {
  const result = state.activityState[`${activityId}-result`];
  return typeof result === "boolean" ? (result ? "is-correct" : "is-wrong") : "";
}

function getStepResultClass(activity, stepId, index, state) {
  const result = state.activityState[`${activity.id}-result`];
  if (typeof result !== "boolean" || !stepId) return "";
  return activity.correctOrder[index] === stepId ? "is-correct" : "is-wrong";
}

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

      <div class="sequence-board">
        <section class="sequence-panel">
          <h4>Кроки для впорядкування</h4>
          <div class="sequence-options choices-grid choices-grid--compact">
            ${available.map((option) => `
              <button
                type="button"
                class="choice-button"
                data-sequence-pick="${activity.id}"
                data-step-id="${escapeHtml(option.id)}">
                ${escapeHtml(option.label)}
              </button>
            `).join("") || `<p class="task-note">Усі кроки вже перенесені праворуч.</p>`}
          </div>
        </section>

        <section class="sequence-panel">
          <h4>Склади правильний порядок</h4>
          <div class="sequence-slot-list ${getSequenceStateClass(activity.id, state)}" aria-label="Порядок кроків">
            ${activity.correctOrder.map((_, index) => {
              const stepId = selectedOrder[index];
              const label = stepId ? escapeHtml(labelById.get(stepId) || "") : "";
              const slotClass = stepId
                ? `sequence-slot is-filled ${getStepResultClass(activity, stepId, index, state)}`.trim()
                : "sequence-slot";

              return `
                <div class="${slotClass}">
                  <span class="sequence-slot__number">${index + 1}.</span>
                  ${
                    stepId
                      ? `
                        <span class="sequence-slot__text">${label}</span>
                        <button
                          type="button"
                          class="secondary-button"
                          data-sequence-remove="${activity.id}"
                          data-step-id="${escapeHtml(stepId)}">
                          Прибрати
                        </button>
                      `
                      : `<span class="sequence-slot__placeholder">Перенеси сюди крок ${index + 1}</span>`
                  }
                </div>
              `;
            }).join("")}
          </div>
        </section>
      </div>

      <div class="actions-row">
        <button type="button" class="primary-button" data-check-sequence="${activity.id}">Перевірити</button>
        <button type="button" class="secondary-button" data-reset-sequence="${activity.id}">Скинути</button>
      </div>
      <p class="task-feedback" data-feedback="${activity.id}" aria-live="polite" hidden></p>
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
      if (selected.length >= activity.correctOrder.length) return;

      selected.push(stepId);
      state.activityState[activity.id].order = selected;
      delete state.activityState[`${activity.id}-result`];
      persistState(state);
      rerenderTask(`[data-check-sequence="${activity.id}"]`);
    });
  });

  document.querySelectorAll(`[data-sequence-remove="${activity.id}"]`).forEach((button) => {
    button.addEventListener("click", () => {
      const stepId = button.dataset.stepId;
      state.activityState[activity.id].order = (state.activityState[activity.id].order || []).filter((value) => value !== stepId);
      delete state.activityState[`${activity.id}-result`];
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
        "Заповни всі місця праворуч перед перевіркою.",
        "is-warning"
      );
      showFeedback("Спочатку заповни всі місця в порядку.", "is-warning", "!");
      return;
    }

    const ok = JSON.stringify(selected) === JSON.stringify(activity.correctOrder);
    state.activityState[`${activity.id}-result`] = ok;
    persistState(state);

    if (ok) completeTask(activity.id, state, refs);

    rerenderTask(`[data-check-sequence="${activity.id}"]`);

    setStatus(
      refs.activities.querySelector(`[data-feedback="${activity.id}"]`),
      ok ? "Чудово! Порядок складено правильно." : "Є неточність у порядку. Перевір ще раз.",
      ok ? "is-success" : "is-warning"
    );
    showFeedback(
      ok ? "Порядок складено правильно." : "У порядку є помилка.",
      ok ? "is-success" : "is-warning",
      ok ? "✓" : "!"
    );
  });

  document.querySelector(`[data-reset-sequence="${activity.id}"]`).addEventListener("click", () => {
    state.activityState[activity.id] = { order: [] };
    delete state.activityState[`${activity.id}-result`];
    persistState(state);
    rerenderTask(`[data-sequence-pick="${activity.id}"]`);
  });
}
