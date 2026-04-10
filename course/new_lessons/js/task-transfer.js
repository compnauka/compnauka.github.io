import { persistState } from "./state.js";
import { escapeHtml, completeTask, renderRichText, setStatus } from "./shared.js";

function renderCase(activity, item, caseIndex, state) {
  const selectedIndex = state.activityState[activity.id]?.[caseIndex];
  const result = state.activityState[`${activity.id}-result-${caseIndex}`];
  const checked = typeof result === "boolean";

  return `
    <section class="scenario-card ${checked ? (result ? "is-correct" : "is-wrong") : ""}">
      <div class="scenario-card__header">
        <span class="scenario-card__emoji" aria-hidden="true">${escapeHtml(item.emoji)}</span>
        <h4>${escapeHtml(item.text)}</h4>
      </div>
      <div class="choices-grid">
        ${item.options.map((option, optionIndex) => {
          const selected = selectedIndex === optionIndex;
          const isCorrectAnswer = checked && option.correct === true;
          const isCorrect = checked && selected && option.correct === true;
          const isWrong = checked && selected && option.correct !== true;
          return `
            <button
              type="button"
              class="choice-button ${selected ? "is-selected" : ""} ${isCorrect ? "is-correct" : ""} ${isWrong ? "is-wrong" : ""} ${isCorrectAnswer && !selected ? "is-correct-answer" : ""}"
              data-transfer-option="${activity.id}"
              data-case-index="${caseIndex}"
              data-option-index="${optionIndex}"
              aria-pressed="${selected}">
              ${escapeHtml(option.label)}
            </button>
          `;
        }).join("")}
      </div>
      <div class="actions-row">
        <button type="button" class="primary-button" data-check-transfer="${activity.id}" data-case-index="${caseIndex}">Перевір</button>
        <button type="button" class="secondary-button" data-reset-transfer="${activity.id}" data-case-index="${caseIndex}">Почати знову</button>
      </div>
      <p class="task-feedback" data-transfer-feedback="${activity.id}-${caseIndex}" aria-live="polite"></p>
    </section>
  `;
}

export function renderTransferTask(activity, state) {
  state.activityState[activity.id] = state.activityState[activity.id] || {};
  const completedCount = activity.cases.filter((_, index) => state.activityState[`${activity.id}-checked-${index}`]).length;

  return `
    <article class="task-card" data-activity-id="${activity.id}">
      <div class="task-card__header">
        <div>
          <span class="task-badge">${escapeHtml(activity.badge)}</span>
          <h3>${escapeHtml(activity.title)}</h3>
          <p class="task-prompt">${escapeHtml(activity.prompt)}</p>
        </div>
        <span class="task-score">${completedCount}/${activity.cases.length}</span>
      </div>
      <div class="scenario-list">
        ${activity.cases.map((item, caseIndex) => renderCase(activity, item, caseIndex, state)).join("")}
      </div>
      <p class="task-feedback" data-feedback="${activity.id}" aria-live="polite"></p>
      <div class="teacher-only method-box">${renderRichText(activity.teacherTip)}</div>
    </article>
  `;
}

export function setupTransferTask(activity, state, refs, showFeedback, rerenderTask) {
  document.querySelectorAll(`[data-transfer-option="${activity.id}"]`).forEach((button) => {
    button.addEventListener("click", () => {
      const caseIndex = Number(button.dataset.caseIndex);
      const optionIndex = Number(button.dataset.optionIndex);
      state.activityState[activity.id][caseIndex] = optionIndex;
      persistState(state);
      rerenderTask(`[data-transfer-option="${activity.id}"][data-case-index="${caseIndex}"][data-option-index="${optionIndex}"]`);
    });
  });

  document.querySelectorAll(`[data-check-transfer="${activity.id}"]`).forEach((button) => {
    button.addEventListener("click", () => {
      const caseIndex = Number(button.dataset.caseIndex);
      const selectedIndex = state.activityState[activity.id][caseIndex];
      const feedback = refs.activities.querySelector(`[data-transfer-feedback="${activity.id}-${caseIndex}"]`);

      if (!Number.isInteger(selectedIndex)) {
        setStatus(feedback, "Спочатку обери один варіант.", "is-warning");
        showFeedback("Спочатку обери відповідь.", "is-warning", "!");
        return;
      }

      const item = activity.cases[caseIndex];
      const option = item.options[selectedIndex];
      const ok = option?.correct === true;

      state.activityState[`${activity.id}-checked-${caseIndex}`] = ok;
      state.activityState[`${activity.id}-result-${caseIndex}`] = ok;
      persistState(state);

      if (ok) {
        const allDone = activity.cases.every((_, index) => state.activityState[`${activity.id}-checked-${index}`]);
        if (allDone) completeTask(activity.id, state, refs);
      }

      rerenderTask(`[data-check-transfer="${activity.id}"][data-case-index="${caseIndex}"]`);
      setStatus(
        feedback,
        option.feedback || (ok ? "Так, це добре підходить до цієї ситуації." : "Подумай ще раз, який варіант тут найкращий."),
        ok ? "is-success" : "is-warning"
      );
      showFeedback(
        ok ? "Ситуацію розв’язано правильно." : "У цій ситуації варто подумати ще раз.",
        ok ? "is-success" : "is-warning",
        ok ? "✓" : "!"
      );
    });
  });

  document.querySelectorAll(`[data-reset-transfer="${activity.id}"]`).forEach((button) => {
    button.addEventListener("click", () => {
      const caseIndex = Number(button.dataset.caseIndex);
      delete state.activityState[activity.id][caseIndex];
      state.activityState[`${activity.id}-checked-${caseIndex}`] = false;
      delete state.activityState[`${activity.id}-result-${caseIndex}`];
      persistState(state);
      rerenderTask(`[data-transfer-option="${activity.id}"][data-case-index="${caseIndex}"]`);
    });
  });
}
