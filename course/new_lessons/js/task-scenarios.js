import { persistState } from "./state.js";
import { escapeHtml, completeTask, renderRichText, setStatus, renderActivityMedia } from "./shared.js";

export function renderScenariosTask(activity, state) {
  state.chooseSelections[activity.id] = state.chooseSelections[activity.id] || {};

  const completedCount = activity.situations.filter(
    (_, index) => state.activityState[`${activity.id}-checked-${index}`]
  ).length;

  return `
    <article class="task-card" data-activity-id="${activity.id}">
      <div class="task-card__header">
        <div>
          <span class="task-badge${activity.optional ? ' task-badge--optional' : ''}">${escapeHtml(activity.badge)}</span>
          <h3>${escapeHtml(activity.title)}</h3>
          <p class="task-prompt">${escapeHtml(activity.prompt)}</p>
        </div>
        <span class="task-score"${completedCount === 0 ? ' data-score-zero' : ''}>${completedCount}/${activity.situations.length}</span>
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
  const result = state.activityState[`${activity.id}-result-${situationIndex}`];
  const checked = typeof result === "boolean";
  return `
    <section class="scenario-card ${checked ? (result ? "is-correct" : "is-wrong") : ""}">
      <div class="scenario-card__header">
        ${renderActivityMedia(situation, { className: "scenario-card__media", emojiClassName: "scenario-card__emoji", imageClassName: "scenario-card__image", altFallback: situation.text })}
        <h4>${escapeHtml(situation.text)}</h4>
      </div>
      <div class="choices-grid">
        ${situation.options.map((option, optionIndex) => {
          const isSelected = selected.includes(optionIndex);
          const isCorrect = checked && isSelected && option.correct === true;
          const isWrong = checked && isSelected && option.correct !== true;
          const isCorrectAnswer = checked && !isSelected && option.correct === true;
          return `
            <button
              type="button"
              class="choice-button ${isSelected ? "is-selected" : ""} ${isCorrect ? "is-correct" : ""} ${isWrong ? "is-wrong" : ""} ${isCorrectAnswer ? "is-correct-answer" : ""}"
              data-scenario-option="${activity.id}"
              data-situation-index="${situationIndex}"
              data-option-index="${optionIndex}"
              aria-pressed="${isSelected}">
              ${renderActivityMedia(option, { className: "choice-button__media", emojiClassName: "choice-button__emoji", imageClassName: "choice-button__image", altFallback: option.label })}
              <span>${escapeHtml(option.label)}</span>
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
      state.activityState[`${activity.id}-result-${situationIndex}`] = ok;
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
      delete state.activityState[`${activity.id}-result-${situationIndex}`];
      persistState(state);
      rerenderTask(`[data-scenario-option="${activity.id}"][data-situation-index="${situationIndex}"]`);
    });
  });
}
