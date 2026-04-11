import { persistState } from "./state.js";
import { escapeHtml, completeTask, renderRichText, setStatus } from "./shared.js";

function getGroupStateClass(activityId, groupIndex, state) {
  const result = state.activityState[`${activityId}-result-${groupIndex}`];
  return typeof result === "boolean" ? (result ? "is-correct" : "is-wrong") : "";
}

function getStepResultClass(activityId, groupIndex, stepValue, stepIndex, state, itemInfo) {
  const result = state.activityState[`${activityId}-result-${groupIndex}`];
  if (typeof result !== "boolean" || !stepValue) return "";
  return itemInfo.steps[stepIndex] === stepValue ? "is-correct" : "is-wrong";
}

export function renderSequenceTask(activity, state) {
  state.activityState[activity.id] = state.activityState[activity.id] || {};
  
  const itemsToRender = activity.items || [];

  return `
    <article class="task-card" data-activity-id="${activity.id}">
      <div class="task-card__header">
        <div>
          <span class="task-badge">${escapeHtml(activity.badge)}</span>
          <h3>${escapeHtml(activity.title)}</h3>
          <p class="task-prompt">${escapeHtml(activity.prompt)}</p>
        </div>
      </div>

      <div class="sequence-groups stack">
        ${itemsToRender.map((item, groupIndex) => {
          state.activityState[activity.id][groupIndex] = state.activityState[activity.id][groupIndex] || { order: [] };
          const selectedOrder = state.activityState[activity.id][groupIndex].order;
          const selectedSet = new Set(selectedOrder);
          
          const shuffledOptions = [...item.steps].sort((a, b) => a.localeCompare(b));
          const available = shuffledOptions.filter(step => !selectedSet.has(step));

          return `
            <section class="sequence-group ${getGroupStateClass(activity.id, groupIndex, state)}" style="margin-bottom: 2rem;">
              <h4 style="margin-bottom: 1rem;">${groupIndex + 1}. ${escapeHtml(item.title)}</h4>
              <div class="sequence-board">
                <section class="sequence-panel">
                  <h5>Кроки для впорядкування</h5>
                  <div class="sequence-options choices-grid choices-grid--compact">
                    ${available.map((stepStr) => `
                      <button
                        type="button"
                        class="choice-button"
                        data-sequence-pick="${activity.id}"
                        data-group-index="${groupIndex}"
                        data-step-value="${escapeHtml(stepStr)}">
                        ${escapeHtml(stepStr)}
                      </button>
                    `).join("") || `<p class="task-note">Усі кроки вже перенесені праворуч.</p>`}
                  </div>
                </section>

                <section class="sequence-panel">
                  <h5>Склади правильний порядок</h5>
                  <div class="sequence-slot-list" aria-label="Порядок кроків">
                    ${item.steps.map((_, index) => {
                      const stepValue = selectedOrder[index];
                      const slotClass = stepValue
                        ? `sequence-slot is-filled ${getStepResultClass(activity.id, groupIndex, stepValue, index, state, item)}`.trim()
                        : "sequence-slot";

                      return `
                        <div class="${slotClass}">
                          <span class="sequence-slot__number">${index + 1}.</span>
                          ${
                            stepValue
                              ? `
                                <span class="sequence-slot__text">${escapeHtml(stepValue)}</span>
                                <button
                                  type="button"
                                  class="secondary-button"
                                  data-sequence-remove="${activity.id}"
                                  data-group-index="${groupIndex}"
                                  data-step-value="${escapeHtml(stepValue)}">
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
              <p class="task-feedback" data-sequence-feedback="${activity.id}-${groupIndex}" aria-live="polite" hidden></p>
            </section>
          `;
        }).join("")}
      </div>

      <div class="actions-row">
        <button type="button" class="primary-button" data-check-sequence="${activity.id}">Перевірити відповіді</button>
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
      const groupIndex = Number(button.dataset.groupIndex);
      const stepValue = button.dataset.stepValue;
      const groupState = state.activityState[activity.id][groupIndex] || { order: [] };
      const selected = [...(groupState.order || [])];
      
      const maxLen = activity.items[groupIndex].steps.length;
      if (selected.includes(stepValue)) return;
      if (selected.length >= maxLen) return;

      selected.push(stepValue);
      state.activityState[activity.id][groupIndex].order = selected;
      delete state.activityState[`${activity.id}-result-${groupIndex}`];
      persistState(state);
      rerenderTask(`[data-check-sequence="${activity.id}"]`);
    });
  });

  document.querySelectorAll(`[data-sequence-remove="${activity.id}"]`).forEach((button) => {
    button.addEventListener("click", () => {
      const groupIndex = Number(button.dataset.groupIndex);
      const stepValue = button.dataset.stepValue;
      const groupState = state.activityState[activity.id][groupIndex] || { order: [] };
      state.activityState[activity.id][groupIndex].order = groupState.order.filter((val) => val !== stepValue);
      delete state.activityState[`${activity.id}-result-${groupIndex}`];
      persistState(state);
      rerenderTask(`[data-check-sequence="${activity.id}"]`);
    });
  });

  document.querySelector(`[data-check-sequence="${activity.id}"]`).addEventListener("click", () => {
    let allGroupsComplete = true;
    let allGroupsCorrect = true;

    activity.items.forEach((item, groupIndex) => {
      const selected = state.activityState[activity.id][groupIndex]?.order || [];
      const complete = selected.length === item.steps.length;
      if (!complete) allGroupsComplete = false;
    });

    if (!allGroupsComplete) {
      setStatus(
        refs.activities.querySelector(`[data-feedback="${activity.id}"]`),
        "Спочатку заповни всі місця в усіх завданнях.",
        "is-warning"
      );
      showFeedback("Ще не всі кроки розставлені.", "is-warning", "!");
      return;
    }

    activity.items.forEach((item, groupIndex) => {
      const selected = state.activityState[activity.id][groupIndex].order;
      const ok = JSON.stringify(selected) === JSON.stringify(item.steps);
      state.activityState[`${activity.id}-result-${groupIndex}`] = ok;
      if (!ok) allGroupsCorrect = false;

      const groupFeedback = refs.activities.querySelector(`[data-sequence-feedback="${activity.id}-${groupIndex}"]`);
      setStatus(
        groupFeedback,
        ok ? "Правильно!" : "Є помилка в порядку кроків.",
        ok ? "is-success" : "is-warning"
      );
    });

    persistState(state);

    if (allGroupsCorrect) completeTask(activity.id, state, refs);

    rerenderTask(`[data-check-sequence="${activity.id}"]`);

    setStatus(
      refs.activities.querySelector(`[data-feedback="${activity.id}"]`),
      allGroupsCorrect ? "Чудово! Усі послідовності складено правильно." : "Є помилки. Перевір уважніше та спробуй ще раз.",
      allGroupsCorrect ? "is-success" : "is-warning"
    );
    showFeedback(
      allGroupsCorrect ? "Усі послідовності визначено правильно." : "У порядку є помилки.",
      allGroupsCorrect ? "is-success" : "is-warning",
      allGroupsCorrect ? "✓" : "!"
    );
  });

  document.querySelector(`[data-reset-sequence="${activity.id}"]`).addEventListener("click", () => {
    state.activityState[activity.id] = {};
    activity.items.forEach((_, groupIndex) => {
       delete state.activityState[`${activity.id}-result-${groupIndex}`];
    });
    persistState(state);
    rerenderTask(`[data-sequence-pick="${activity.id}"]`);
  });
}

