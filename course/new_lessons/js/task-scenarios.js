import { persistState } from "./state.js";
import { escapeHtml, completeTask, renderRichText, setStatus } from "./shared.js";

export function renderScenariosTask(activity, state) {
  state.chooseSelections[activity.id] = state.chooseSelections[activity.id] || {};

  const completedCount = activity.situations.filter(
    (_, index) => state.activityState[`${activity.id}-checked-${index}`]
  ).length;

  return `
    <article class="task-card" data-activity-id="${activity.id}">
      <div class="task-card__header">
        <div>
          <span class="task-badge">${escapeHtml(activity.badge)}</span>
          <h3>${escapeHtml(activity.title)}</h3>
          <p class="task-prompt">${escapeHtml(activity.prompt)}</p>
        </div>
        <span class="task-score">${completedCount}/${activity.situations.length}</span>
      </div>
      <div class="scenario-list">
        ${activity.situations.map((situation, situationIndex) => renderSituation(activity, situation, situationIndex, state)).join("")}
      </div>
      <p class="task-feedback" data-feedback="${activity.id}" aria-live="polite"></p>
      <div class="teacher-only method-box">${renderRichText(activity.teacherTip)}</div>
    </article>
  `;
}

function renderSituation(activity, situation, situationIndex, state) {
  const selected = state.chooseSelections[activity.id]?.[situationIndex] || [];
  return `
    <section class="scenario-card">
      <div class="scenario-card__header">
        <span class="scenario-card__emoji" aria-hidden="true">${escapeHtml(situation.emoji)}</span>
        <h4>${escapeHtml(situation.text)}</h4>
      </div>
      <div class="choices-grid">
        ${situation.options.map((option, optionIndex) => {
          const isSelected = selected.includes(optionIndex);
          return `
            <button
              type="button"
              class="choice-button ${isSelected ? "is-selected" : ""}"
              data-scenario-option="${activity.id}"
              data-situation-index="${situationIndex}"
              data-option-index="${optionIndex}"
              aria-pressed="${isSelected}">
              ${escapeHtml(option.label)}
            </button>
          `;
        }).join("")}
      </div>
      <div class="actions-row">
        <button type="button" class="primary-button" data-check-scenario="${activity.id}" data-situation-index="${situationIndex}">Перевірити</button>
        <button type="button" class="secondary-button" data-reset-scenario="${activity.id}" data-situation-index="${situationIndex}">Скинути</button>
      </div>
      <p class="task-feedback" data-scenario-feedback="${activity.id}-${situationIndex}" aria-live="polite"></p>
    </section>
  `;
}

export function setupScenariosTask(activity, state, refs, showFeedback, rerenderTask) {
  document.querySelectorAll(`[data-scenario-option="${activity.id}"]`).forEach((button) => {
    button.addEventListener("click", () => {
      const situationIndex = Number(button.dataset.situationIndex);
      const optionIndex = Number(button.dataset.optionIndex);
      const selected = [...(state.chooseSelections[activity.id]?.[situationIndex] || [])];
      const foundIndex = selected.indexOf(optionIndex);

      if (foundIndex >= 0) selected.splice(foundIndex, 1);
      else selected.push(optionIndex);

      state.chooseSelections[activity.id] = {
        ...(state.chooseSelections[activity.id] || {}),
        [situationIndex]: selected
      };

      persistState(state);
      rerenderTask(
        `[data-scenario-option="${activity.id}"][data-situation-index="${situationIndex}"][data-option-index="${optionIndex}"]`
      );
    });
  });

  document.querySelectorAll(`[data-check-scenario="${activity.id}"]`).forEach((button) => {
    button.addEventListener("click", () => {
      const situationIndex = Number(button.dataset.situationIndex);
      const situation = activity.situations[situationIndex];
      const selected = [...(state.chooseSelections[activity.id]?.[situationIndex] || [])].sort((a, b) => a - b);
      const expected = situation.options
        .map((option, index) => (option.correct ? index : null))
        .filter((value) => value !== null);

      const ok = JSON.stringify(selected) === JSON.stringify(expected);
      state.activityState[`${activity.id}-checked-${situationIndex}`] = ok;
      persistState(state);

      if (ok) {
        const allDone = activity.situations.every(
          (_, index) => state.activityState[`${activity.id}-checked-${index}`]
        );
        if (allDone) completeTask(activity.id, state, refs);
      }

      rerenderTask(`[data-check-scenario="${activity.id}"][data-situation-index="${situationIndex}"]`);
      const feedback = refs.activities.querySelector(`[data-scenario-feedback="${activity.id}-${situationIndex}"]`);
      setStatus(
        feedback,
        ok
          ? "Правильно! У цій ситуації обрано всі потрібні варіанти."
          : "Є помилки. Спробуй подумати ще раз.",
        ok ? "is-success" : "is-warning"
      );
      showFeedback(
        ok ? "Ситуацію розв'язано правильно." : "У виборі є помилки.",
        ok ? "is-success" : "is-warning",
        ok ? "✓" : "!"
      );
    });
  });

  document.querySelectorAll(`[data-reset-scenario="${activity.id}"]`).forEach((button) => {
    button.addEventListener("click", () => {
      const situationIndex = Number(button.dataset.situationIndex);
      state.chooseSelections[activity.id] = {
        ...(state.chooseSelections[activity.id] || {}),
        [situationIndex]: []
      };
      state.activityState[`${activity.id}-checked-${situationIndex}`] = false;
      persistState(state);
      rerenderTask(`[data-scenario-option="${activity.id}"][data-situation-index="${situationIndex}"]`);
    });
  });
}
