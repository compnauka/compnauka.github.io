import { persistState } from "./state.js";
import { escapeHtml, completeTask, setStatus, renderRichText, renderActivityMedia } from "./shared.js";

const DEFAULT_CATEGORY_ICON = "🏷️";

export function renderClassifyTask(activity, state) {
  state.activityState[activity.id] = state.activityState[activity.id] || {};

  const score = activity.items.filter((item, index) => state.activityState[activity.id][index] === item.correct).length;
  const checked = state.activityState[`${activity.id}-checked`] === true;

  const availableItems = activity.items
    .map((item, index) => ({ item, index }))
    .filter(({ index }) => state.activityState[activity.id][index] === undefined);

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
            ${availableItems.map(({ item, index }) => {
              const selected = state.activityState.selectedClassifyItem === index;
              return `
                <button
                  type="button"
                  class="drag-item ${selected ? "is-selected" : ""}"
                  aria-pressed="${selected}"
                  draggable="true"
                  data-select-item="${activity.id}"
                  data-index="${index}">
                  ${renderActivityMedia(item, { className: "drag-item__media", emojiClassName: "drag-item__emoji", imageClassName: "drag-item__image", altFallback: item.label })}
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
                class="dropzone dropzone--dashed ${checked ? resolveCategoryState(activity, state, category) : ""}"
                data-assign-category="${activity.id}"
                data-category="${escapeHtml(category)}"
                aria-label="Категорія ${escapeHtml(category)}">
                <strong><span aria-hidden="true">${resolveCategoryIcon(activity, category)}</span> ${escapeHtml(category)}</strong>
                <div class="assigned-list">
                  ${renderAssigned(activity, state, category, checked)}
                </div>
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
      <div class="teacher-only method-box">${renderRichText(activity.teacherTip)}</div>
    </article>
  `;
}

function resolveCategoryIcon(activity, category) {
  const customIcons = activity.categoryIcons || {};
  return customIcons[category] || DEFAULT_CATEGORY_ICON;
}

function resolveCategoryState(activity, state, category) {
  const assignedItems = activity.items.filter((item, index) => state.activityState[activity.id][index] === category);
  if (assignedItems.length === 0) return "";
  const allCorrect = assignedItems.every((item) => item.correct === category);
  return allCorrect ? "is-correct" : "is-wrong";
}

function renderAssigned(activity, state, category, checked) {
  return activity.items
    .map((item, index) => ({ item, index }))
    .filter(({ index }) => state.activityState[activity.id][index] === category)
    .map(({ item }) => {
      const chipState = checked ? (item.correct === category ? "is-correct" : "is-wrong") : "";
      return `
        <span class="assigned-chip ${chipState}" aria-label="${escapeHtml(item.label)}">
          ${renderActivityMedia(item, { className: "assigned-chip__media", emojiClassName: "assigned-chip__emoji", imageClassName: "assigned-chip__image", altFallback: item.label })}
          <span>${escapeHtml(item.label)}</span>
        </span>
      `;
    })
    .join("");
}

export function setupClassifyTask(activity, state, refs, showFeedback, rerenderTask) {
  document.querySelectorAll(`[data-select-item="${activity.id}"]`).forEach((button) => {
    button.addEventListener("click", () => {
      const index = Number(button.dataset.index);
      state.activityState.selectedClassifyItem = index;
      persistState(state);
      rerenderTask(`[data-select-item="${activity.id}"][data-index="${index}"]`);
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
      const firstAvailable = document.querySelector(`[data-select-item="${activity.id}"]`);
      if (firstAvailable instanceof HTMLElement) {
        firstAvailable.focus();
      }
      return;
    }

    state.activityState[activity.id][selected] = category;
    state.activityState.selectedClassifyItem = null;
    delete state.activityState[`${activity.id}-checked`];
    persistState(state);
    const nextAvailableIndex = activity.items.findIndex((_, index) => state.activityState[activity.id][index] === undefined);
    rerenderTask(nextAvailableIndex >= 0 ? `[data-select-item="${activity.id}"][data-index="${nextAvailableIndex}"]` : `[data-check-classify="${activity.id}"]`);
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

    state.activityState[`${activity.id}-checked`] = true;
    persistState(state);

    if (ok) completeTask(activity.id, state, refs);

    rerenderTask(`[data-check-classify="${activity.id}"]`);

    setStatus(
      refs.activities.querySelector(`[data-feedback="${activity.id}"]`),
      ok ? "Усі відповідності знайдено правильно." : "Є неточності. Перевір картки з підсвічуванням.",
      ok ? "is-success" : "is-warning"
    );

    showFeedback(ok ? "Усі картки розкладено правильно." : "У деяких категоріях є помилки.", ok ? "is-success" : "is-warning", ok ? "✓" : "!");
  });

  document.querySelector(`[data-reset-classify="${activity.id}"]`).addEventListener("click", () => {
    state.activityState[activity.id] = {};
    state.activityState.selectedClassifyItem = null;
    delete state.activityState[`${activity.id}-checked`];
    persistState(state);
    rerenderTask(`[data-select-item="${activity.id}"][data-index="0"]`);
  });
}
