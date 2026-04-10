import { persistState } from "./state.js";
import { escapeHtml, completeTask, setStatus } from "./shared.js";

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
          <section class="pick-group">
            <h4>${groupIndex + 1}. ${escapeHtml(group.question)}</h4>
            <div class="choices-grid choices-grid--compact">
              ${group.options.map((option, optionIndex) => {
                const selected = state.activityState[activity.id][groupIndex] === optionIndex;
                return `<button type="button" class="choice-button ${selected ? "is-selected" : ""}" data-pick-group="${groupIndex}" data-pick-option="${optionIndex}" aria-pressed="${selected}">${escapeHtml(option.label)}</button>`;
              }).join("")}
            </div>
          </section>
        `).join("")}
      </div>
      <div class="actions-row">
        <button type="button" class="primary-button" data-check-pick="${activity.id}">Перевірити</button>
        <button type="button" class="secondary-button" data-reset-pick="${activity.id}">Скинути</button>
      </div>
      <p class="task-feedback" data-feedback="${activity.id}" aria-live="polite"></p>
      <div class="teacher-only method-box">${escapeHtml(activity.teacherTip)}</div>
    </article>
  `;
}

export function setupPickTask(activity, state, refs, showFeedback, rerenderActivities) {
  document.querySelectorAll("[data-pick-group]").forEach((button) => {
    button.addEventListener("click", () => {
      const groupIndex = Number(button.dataset.pickGroup);
      const optionIndex = Number(button.dataset.pickOption);
      state.activityState[activity.id][groupIndex] = optionIndex;
      persistState(state);
      rerenderActivities();
    });
  });

  document.querySelector(`[data-check-pick="${activity.id}"]`).addEventListener("click", () => {
    const allAnswered = activity.groups.every((_, index) => Number.isInteger(state.activityState[activity.id][index]));
    if (!allAnswered) {
      setStatus(refs.activities.querySelector(`[data-feedback="${activity.id}"]`), "Спочатку обери відповідь у кожному рядку.", "is-warning");
      showFeedback("Спочатку дай відповідь у кожному рядку.", "is-warning", "!");
      return;
    }

    const ok = activity.groups.every((group, groupIndex) => {
      const selectedIndex = state.activityState[activity.id][groupIndex];
      return group.options[selectedIndex]?.correct === true;
    });

    if (ok) completeTask(activity.id, state, refs);
    setStatus(refs.activities.querySelector(`[data-feedback="${activity.id}"]`), ok ? "Чудово! Зайве знайдено правильно." : "Є помилки. Спробуй ще раз.", ok ? "is-success" : "is-warning");
    showFeedback(ok ? "Чудово! Усі зайві слова знайдено." : "Є помилки у виборі.", ok ? "is-success" : "is-warning", ok ? "✓" : "!");
  });

  document.querySelector(`[data-reset-pick="${activity.id}"]`).addEventListener("click", () => {
    state.activityState[activity.id] = {};
    persistState(state);
    rerenderActivities();
  });
}
