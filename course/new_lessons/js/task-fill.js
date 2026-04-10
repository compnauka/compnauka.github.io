import { persistState } from "./state.js";
import { escapeHtml, completeTask, renderRichText, setStatus } from "./shared.js";

export function renderFillTask(activity, state) {
  return `
    <article class="task-card" data-activity-id="${activity.id}">
      <div class="task-card__header">
        <div>
          <span class="task-badge">${escapeHtml(activity.badge)}</span>
          <h3>${escapeHtml(activity.title)}</h3>
          <p class="task-prompt">${escapeHtml(activity.prompt)}</p>
        </div>
      </div>
      <div class="fill-grid">
        ${activity.sentences.map((sentence, index) => `
          <label>
            <span>${escapeHtml(sentence.text)}</span>
            <select data-fill-id="${activity.id}" data-index="${index}">
              <option value="">Обери слово</option>
              ${sentence.options.map((option) => `<option value="${escapeHtml(option)}" ${state.activityState[`${activity.id}-${index}`] === option ? "selected" : ""}>${escapeHtml(option)}</option>`).join("")}
            </select>
          </label>
        `).join("")}
      </div>
      <div class="actions-row">
        <button type="button" class="primary-button" data-check-fill="${activity.id}">Перевірити</button>
      </div>
      <p class="task-feedback" data-feedback="${activity.id}" aria-live="polite"></p>
      <div class="teacher-only method-box">${renderRichText(activity.teacherTip)}</div>
    </article>
  `;
}

export function setupFillTask(activity, state, refs, showFeedback) {
  document.querySelectorAll(`[data-fill-id="${activity.id}"]`).forEach((select) => {
    select.addEventListener("change", () => {
      state.activityState[`${activity.id}-${select.dataset.index}`] = select.value;
      persistState(state);
    });
  });

  document.querySelector(`[data-check-fill="${activity.id}"]`).addEventListener("click", () => {
    const selects = document.querySelectorAll(`[data-fill-id="${activity.id}"]`);
    const ok = activity.sentences.every((sentence, index) => selects[index].value === sentence.answer);
    if (ok) completeTask(activity.id, state, refs);
    setStatus(refs.activities.querySelector(`[data-feedback="${activity.id}"]`), ok ? "Усі слова вибрано правильно." : "Є помилки. Спробуй ще раз.", ok ? "is-success" : "is-warning");
    showFeedback(ok ? "Правильно! Усі слова на місці." : "Є неточності у виборі слів.", ok ? "is-success" : "is-warning", ok ? "✓" : "!");
  });
}
