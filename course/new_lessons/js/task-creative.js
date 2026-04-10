import { persistState } from "./state.js";
import { escapeHtml, completeTask, renderRichText, setStatus } from "./shared.js";

function getSelections(activity, state) {
  return state.activityState[activity.id] || {};
}

function buildPreview(activity, selections) {
  const values = activity.groups.map((group, index) => {
    const optionIndex = selections[index];
    if (!Number.isInteger(optionIndex)) return null;
    const option = group.options[optionIndex];
    return option?.value || option?.label || "";
  });

  if (values.some((value) => value === null)) {
    return activity.placeholder || "Обери картки, щоб скласти свій приклад.";
  }

  if (activity.previewTemplate) {
    return activity.previewTemplate.replace(/\{(\d+)\}/g, (_, token) => values[Number(token)] || "");
  }

  return values.join(" ");
}

export function renderCreativeTask(activity, state) {
  const selections = getSelections(activity, state);
  const preview = buildPreview(activity, selections);

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
          <section class="pick-group">
            <h4>${groupIndex + 1}. ${escapeHtml(group.title)}</h4>
            <div class="choices-grid choices-grid--compact">
              ${group.options.map((option, optionIndex) => {
                const selected = selections[groupIndex] === optionIndex;
                return `
                  <button
                    type="button"
                    class="choice-button ${selected ? "is-selected" : ""}"
                    data-creative-group="${activity.id}"
                    data-group-index="${groupIndex}"
                    data-option-index="${optionIndex}"
                    aria-pressed="${selected}">
                    ${escapeHtml(option.label)}
                  </button>
                `;
              }).join("")}
            </div>
          </section>
        `).join("")}
      </div>
      <div class="creative-preview" aria-live="polite">
        <strong>${escapeHtml(activity.previewLabel || "Мій приклад")}</strong>
        <p>${escapeHtml(preview)}</p>
      </div>
      <div class="actions-row">
        <button type="button" class="primary-button" data-complete-creative="${activity.id}">Готово</button>
        <button type="button" class="secondary-button" data-reset-creative="${activity.id}">Почати знову</button>
      </div>
      <p class="task-feedback" data-feedback="${activity.id}" aria-live="polite"></p>
      <div class="teacher-only method-box">${renderRichText(activity.teacherTip)}</div>
    </article>
  `;
}

export function setupCreativeTask(activity, state, refs, showFeedback, rerenderTask) {
  state.activityState[activity.id] = state.activityState[activity.id] || {};

  document.querySelectorAll(`[data-creative-group="${activity.id}"]`).forEach((button) => {
    button.addEventListener("click", () => {
      const groupIndex = Number(button.dataset.groupIndex);
      const optionIndex = Number(button.dataset.optionIndex);
      state.activityState[activity.id][groupIndex] = optionIndex;
      persistState(state);
      rerenderTask(`[data-creative-group="${activity.id}"][data-group-index="${groupIndex}"][data-option-index="${optionIndex}"]`);
    });
  });

  document.querySelector(`[data-complete-creative="${activity.id}"]`).addEventListener("click", () => {
    const allSelected = activity.groups.every((_, index) => Number.isInteger(state.activityState[activity.id][index]));
    if (!allSelected) {
      setStatus(
        refs.activities.querySelector(`[data-feedback="${activity.id}"]`),
        "Спочатку обери по одній картці в кожному рядку.",
        "is-warning"
      );
      showFeedback("Ще не всі картки обрано.", "is-warning", "!");
      return;
    }

    completeTask(activity.id, state, refs);
    setStatus(
      refs.activities.querySelector(`[data-feedback="${activity.id}"]`),
      activity.successMessage || "Супер! Твій приклад уже готовий.",
      "is-success"
    );
    showFeedback(activity.toastMessage || "Творче завдання виконано.", "is-success", "✓");
  });

  document.querySelector(`[data-reset-creative="${activity.id}"]`).addEventListener("click", () => {
    state.activityState[activity.id] = {};
    persistState(state);
    rerenderTask(`[data-creative-group="${activity.id}"][data-group-index="0"]`);
  });
}
