import { persistState } from "./state.js";
import { completeTask, escapeHtml, renderRichText, setStatus } from "./shared.js";

function getCellId(rowIndex, columnIndex) {
  return `${rowIndex}-${columnIndex}`;
}

function getSelectionKey(activityId, caseIndex) {
  return `${activityId}-case-${caseIndex}`;
}

function getResultKey(activityId, caseIndex) {
  return `${activityId}-result-${caseIndex}`;
}

function getCaseStateClass(activityId, caseIndex, state) {
  const result = state.activityState[getResultKey(activityId, caseIndex)];
  return typeof result === "boolean" ? (result ? "is-correct" : "is-wrong") : "";
}

function getCaseFeedback(activityId, caseIndex, state) {
  const result = state.activityState[getResultKey(activityId, caseIndex)];
  if (typeof result !== "boolean") return "";
  return result ? "Так, це правильна клітинка." : "Спробуй уважніше прочитати рядок і стовпець.";
}

export function renderTableReadTask(activity, state) {
  return `
    <article class="task-card" data-activity-id="${activity.id}">
      <div class="task-card__header">
        <div>
          <span class="task-badge">${escapeHtml(activity.badge)}</span>
          <h3>${escapeHtml(activity.title)}</h3>
          <p class="task-prompt">${escapeHtml(activity.prompt)}</p>
        </div>
      </div>
      <div class="table-read-stack">
        ${activity.cases.map((item, caseIndex) => {
          const selected = state.activityState[getSelectionKey(activity.id, caseIndex)] || "";
          const stateClass = getCaseStateClass(activity.id, caseIndex, state);
          return `
            <section class="table-read-card ${stateClass}">
              <p class="table-read-card__lead">${escapeHtml(item.lead || "")}</p>
              <h4>${escapeHtml(item.question)}</h4>
              <div class="table-read-wrap">
                <table class="table-read-grid">
                  <thead>
                    <tr>
                      <th scope="col"> </th>
                      ${item.columns.map((column) => `<th scope="col">${escapeHtml(column)}</th>`).join("")}
                    </tr>
                  </thead>
                  <tbody>
                    ${item.rows.map((row, rowIndex) => `
                      <tr>
                        <th scope="row">${escapeHtml(row.label)}</th>
                        ${row.cells.map((cell, columnIndex) => {
                          const cellId = getCellId(rowIndex, columnIndex);
                          const isSelected = selected === cellId;
                          return `
                            <td>
                              <button
                                type="button"
                                class="table-read-cell ${isSelected ? "is-selected" : ""}"
                                aria-pressed="${isSelected}"
                                data-table-read-cell="${activity.id}"
                                data-case-index="${caseIndex}"
                                data-cell-id="${cellId}">
                                ${escapeHtml(cell)}
                              </button>
                            </td>
                          `;
                        }).join("")}
                      </tr>
                    `).join("")}
                  </tbody>
                </table>
              </div>
              <p class="table-read-feedback ${stateClass}" data-table-read-feedback="${activity.id}-${caseIndex}" aria-live="polite">${escapeHtml(getCaseFeedback(activity.id, caseIndex, state))}</p>
            </section>
          `;
        }).join("")}
      </div>
      <div class="actions-row">
        <button type="button" class="primary-button" data-check-table-read="${activity.id}">Перевір</button>
      </div>
      <p class="task-feedback" data-feedback="${activity.id}" aria-live="polite"></p>
      <div class="teacher-only method-box">${renderRichText(activity.teacherTip)}</div>
    </article>
  `;
}

export function setupTableReadTask(activity, state, refs, showFeedback, rerenderTask) {
  document.querySelectorAll(`[data-table-read-cell="${activity.id}"]`).forEach((button) => {
    button.addEventListener("click", () => {
      const caseIndex = Number(button.dataset.caseIndex);
      state.activityState[getSelectionKey(activity.id, caseIndex)] = button.dataset.cellId;
      delete state.activityState[getResultKey(activity.id, caseIndex)];
      persistState(state);
      if (typeof rerenderTask === "function") {
        rerenderTask(`[data-table-read-cell="${activity.id}"][data-case-index="${caseIndex}"][data-cell-id="${button.dataset.cellId}"]`);
      }
    });
  });

  document.querySelector(`[data-check-table-read="${activity.id}"]`).addEventListener("click", () => {
    const allAnswered = activity.cases.every((item, caseIndex) => {
      void item;
      return Boolean(state.activityState[getSelectionKey(activity.id, caseIndex)]);
    });

    if (!allAnswered) {
      setStatus(refs.activities.querySelector(`[data-feedback="${activity.id}"]`), "Спочатку обери клітинку в кожній таблиці.", "is-warning");
      showFeedback("Ще не всі таблиці прочитані до кінця.", "is-warning", "!");
      return;
    }

    const ok = activity.cases.every((item, caseIndex) => {
      const selected = state.activityState[getSelectionKey(activity.id, caseIndex)];
      const correct = selected === getCellId(item.answer.row, item.answer.column);
      state.activityState[getResultKey(activity.id, caseIndex)] = correct;
      return correct;
    });

    persistState(state);
    if (ok) completeTask(activity.id, state, refs);

    if (typeof rerenderTask === "function") {
      rerenderTask(`[data-check-table-read="${activity.id}"]`);
    }

    setStatus(
      refs.activities.querySelector(`[data-feedback="${activity.id}"]`),
      ok ? "Чудово! Ти правильно прочитав(ла) таблиці." : "Є помилки. Перевір ще раз рядки й стовпці.",
      ok ? "is-success" : "is-warning"
    );
    showFeedback(ok ? "Таблиці прочитано правильно." : "У читанні таблиць є неточності.", ok ? "is-success" : "is-warning", ok ? "✓" : "!");
  });
}
