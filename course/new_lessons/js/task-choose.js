import { persistState } from "./state.js";
import { escapeHtml, completeTask, setStatus } from "./shared.js";

export function renderChooseTask(activity, state) {
  if (!state.chooseSelections[activity.id]) state.chooseSelections[activity.id] = [];
  return `
    <article class="task-card" data-activity-id="${activity.id}">
      <div class="task-card__header">
        <div>
          <span class="task-badge">${escapeHtml(activity.badge)}</span>
          <h3>${escapeHtml(activity.title)}</h3>
          <p class="task-prompt">${escapeHtml(activity.prompt)}</p>
        </div>
      </div>
      <div class="choices-grid">
        ${activity.options.map((option, index) => {
          const selected = state.chooseSelections[activity.id].includes(index);
          return `<button type="button" class="choice-button ${selected ? "is-selected" : ""}" data-choose="${activity.id}" data-index="${index}" aria-pressed="${selected}">${escapeHtml(option.label)}</button>`;
        }).join("")}
      </div>
      <div class="actions-row">
        <button type="button" class="primary-button" data-check-choose="${activity.id}">Перевірити</button>
        <button type="button" class="secondary-button" data-reset-choose="${activity.id}">Скинути</button>
      </div>
      <p class="task-feedback" data-feedback="${activity.id}" aria-live="polite"></p>
      <div class="teacher-only method-box">${escapeHtml(activity.teacherTip)}</div>
    </article>
  `;
}

export function setupChooseTask(activity, state, refs, showFeedback, rerenderActivities) {
  document.querySelectorAll(`[data-choose="${activity.id}"]`).forEach((button) => {
    button.addEventListener("click", () => {
      const index = Number(button.dataset.index);
      const selected = [...(state.chooseSelections[activity.id] || [])];
      const found = selected.indexOf(index);
      if (found >= 0) selected.splice(found, 1);
      else selected.push(index);
      state.chooseSelections[activity.id] = selected;
      persistState(state);
      rerenderActivities();
    });
  });

  document.querySelector(`[data-check-choose="${activity.id}"]`).addEventListener("click", () => {
    const selected = state.chooseSelections[activity.id] || [];
    const ok = activity.options.every((option, index) => selected.includes(index) === option.correct);
    document.querySelectorAll(`[data-choose="${activity.id}"]`).forEach((button) => {
      const option = activity.options[Number(button.dataset.index)];
      button.classList.remove("is-correct", "is-wrong");
      if (option.correct) button.classList.add("is-correct");
      else if (selected.includes(Number(button.dataset.index))) button.classList.add("is-wrong");
    });
    if (ok) completeTask(activity.id, state, refs);
    setStatus(refs.activities.querySelector(`[data-feedback="${activity.id}"]`), ok ? "Правильно. Ситуацію проаналізовано вірно." : "Не всі варіанти обрано правильно.", ok ? "is-success" : "is-warning");
    showFeedback(ok ? "Правильний аналіз ситуації." : "У виборі є помилка.", ok ? "is-success" : "is-warning", ok ? "✓" : "!");
  });

  document.querySelector(`[data-reset-choose="${activity.id}"]`).addEventListener("click", () => {
    state.chooseSelections[activity.id] = [];
    persistState(state);
    rerenderActivities();
  });
}
