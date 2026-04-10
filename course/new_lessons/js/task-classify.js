import { persistState } from "./state.js";
import { escapeHtml, completeTask, setStatus } from "./shared.js";

const CATEGORY_EMOJI = {
  "Зорова": "👀",
  "Слухова": "👂",
  "Нюхова": "👃",
  "Смакова": "👅",
  "Дотикова": "✋"
};

export function renderClassifyTask(activity, state) {
  if (!state.activityState[activity.id]) state.activityState[activity.id] = {};

  const score = activity.items.filter((item, index) => state.activityState[activity.id][index] === item.correct).length;
  const availableItems = activity.items.filter((_, index) => state.activityState[activity.id][index] === undefined);

  return `
    <article class="task-card" data-activity-id="${activity.id}">
      <div class="task-card__header">
        <div>
          <span class="task-badge">${escapeHtml(activity.badge)}</span>
          <h3>${escapeHtml(activity.title)}</h3>
          <p class="task-prompt">${escapeHtml(activity.prompt)}</p>
        </div>
        <span class="task-score">${score}/${activity.items.length}</span>
      </div>
      <div class="board">
        <div class="board__column">
          <h4>Крок 1. Обери картку</h4>
          <div class="draggable-list">
            ${availableItems.map((item) => {
              const index = activity.items.indexOf(item);
              const selected = state.activityState.selectedClassifyItem === index;
              return `
                <button
                  type="button"
                  class="drag-item ${selected ? "is-selected" : ""}"
                  aria-pressed="${selected}"
                  draggable="true"
                  data-select-item="${activity.id}"
                  data-index="${index}">
                  <span class="drag-item__emoji" aria-hidden="true">${escapeHtml(item.emoji)}</span>
                  <span>${escapeHtml(item.label)}</span>
                </button>
              `;
            }).join("") || `<p class="task-note">Усі картки вже розкладено по категоріях.</p>`}
          </div>
        </div>

        <div class="board__column">
          <h4>Крок 2. Натисни або перетягни в категорію</h4>
          <div class="dropzone-grid">
            ${activity.categories.map((category) => `
              <button
                type="button"
                class="dropzone dropzone--dashed"
                data-assign-category="${activity.id}"
                data-category="${escapeHtml(category)}">
                <strong><span aria-hidden="true">${CATEGORY_EMOJI[category] || ""}</span> ${escapeHtml(category)}</strong>
                <div class="assigned-list" data-assigned-list="${activity.id}-${escapeHtml(category)}"></div>
              </button>
            `).join("")}
          </div>
        </div>
      </div>

      <div class="actions-row">
        <button type="button" class="primary-button" data-check-classify="${activity.id}">Перевірити</button>
        <button type="button" class="secondary-button" data-reset-classify="${activity.id}">Скинути</button>
      </div>
      <p class="task-feedback" data-feedback="${activity.id}" aria-live="polite"></p>
      <div class="teacher-only method-box">${escapeHtml(activity.teacherTip)}</div>
    </article>
  `;
}

export function setupClassifyTask(activity, state, refs, showFeedback, rerenderActivities) {
  document.querySelectorAll(`[data-select-item="${activity.id}"]`).forEach((button) => {
    button.addEventListener("click", () => {
      state.activityState.selectedClassifyItem = Number(button.dataset.index);
      persistState(state);
      rerenderActivities();
    });

    button.addEventListener("dragstart", () => {
      state.activityState.selectedClassifyItem = Number(button.dataset.index);
      persistState(state);
    });
  });

  document.querySelectorAll(`[data-assign-category="${activity.id}"]`).forEach((button) => {
    button.addEventListener("dragover", (event) => {
      event.preventDefault();
      button.classList.add("is-drop-target");
    });

    button.addEventListener("dragleave", () => {
      button.classList.remove("is-drop-target");
    });

    button.addEventListener("drop", (event) => {
      event.preventDefault();
      button.classList.remove("is-drop-target");
      assignSelected(button.dataset.category);
    });

    button.addEventListener("click", () => {
      assignSelected(button.dataset.category);
    });
  });

  function assignSelected(category) {
    const selected = state.activityState.selectedClassifyItem;
    if (selected === undefined || selected === null) {
      showFeedback("Спочатку обери картку зліва.", "is-warning", "!");
      return;
    }

    state.activityState[activity.id][selected] = category;
    state.activityState.selectedClassifyItem = null;
    persistState(state);
    rerenderActivities();
  }

  document.querySelector(`[data-check-classify="${activity.id}"]`).addEventListener("click", () => {
    const allAssigned = activity.items.every((_, index) => state.activityState[activity.id][index] !== undefined);
    if (!allAssigned) {
      setStatus(refs.activities.querySelector(`[data-feedback="${activity.id}"]`), "Ще не всі картки розкладено по категоріях.", "is-warning");
      showFeedback("Спочатку розклади всі картки по категоріях.", "is-warning", "!");
      return;
    }

    const score = activity.items.filter((item, index) => state.activityState[activity.id][index] === item.correct).length;
    const ok = score === activity.items.length;

    if (ok) completeTask(activity.id, state, refs);

    setStatus(
      refs.activities.querySelector(`[data-feedback="${activity.id}"]`),
      ok ? "Усі відповідності знайдено правильно." : "Є неточності. Перевір, чи кожна картка в правильній категорії.",
      ok ? "is-success" : "is-warning"
    );
    showFeedback(ok ? "Усі картки розкладено правильно." : "У деяких категоріях є помилки.", ok ? "is-success" : "is-warning", ok ? "✓" : "!");
  });

  document.querySelector(`[data-reset-classify="${activity.id}"]`).addEventListener("click", () => {
    state.activityState[activity.id] = {};
    state.activityState.selectedClassifyItem = null;
    persistState(state);
    rerenderActivities();
  });

  updateAssignedLists(activity, state);
}

function updateAssignedLists(activity, state) {
  activity.categories.forEach((category) => {
    const list = document.querySelector(`[data-assigned-list="${activity.id}-${category}"]`);
    if (!list) return;

    const assigned = activity.items.filter((item, index) => state.activityState[activity.id][index] === category);
    list.innerHTML = assigned.map((item) => `
      <span class="assigned-chip" aria-label="${escapeHtml(item.label)}">
        <span aria-hidden="true">${escapeHtml(item.emoji)}</span>
        <span>${escapeHtml(item.label)}</span>
      </span>
    `).join("");
  });
}
