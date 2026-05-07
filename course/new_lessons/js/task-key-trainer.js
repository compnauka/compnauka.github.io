import { persistState } from "./state.js";
import { completeTask, escapeHtml, renderRichText, setStatus } from "./shared.js";

function getDefaultProgress() {
  return {
    currentRound: 0,
    lastKey: "",
    solved: {}
  };
}

function getProgress(activityId, state) {
  return state.activityState[activityId] || getDefaultProgress();
}

function normalizeKey(value) {
  return typeof value === "string" ? value.toLowerCase() : "";
}

function getAcceptedKeys(round) {
  return (round.acceptedKeys || [round.targetKey]).map((key) => normalizeKey(key));
}

function getRoundStateClass(activityId, roundIndex, state) {
  const progress = getProgress(activityId, state);
  if (progress.solved?.[roundIndex] === true) {
    return "is-correct";
  }

  if (progress.lastKey) {
    return "is-wrong";
  }

  return "";
}

function getRoundFeedback(activity, state) {
  const progress = getProgress(activity.id, state);
  const roundIndex = progress.currentRound || 0;
  const round = activity.rounds[roundIndex];

  if (!round) {
    return activity.completionMessage || "Усі раунди виконано.";
  }

  if (progress.solved?.[roundIndex] === true) {
    return round.successMessage || "Правильно.";
  }

  if (progress.lastKey) {
    return round.tryAgainMessage || "Це не та клавіша. Спробуй ще раз.";
  }

  return round.helperText || "Знайди потрібну клавішу й натисни її.";
}

export function renderKeyTrainerTask(activity, state) {
  const progress = getProgress(activity.id, state);
  const currentRound = progress.currentRound || 0;
  const round = activity.rounds[currentRound];
  const doneCount = Object.values(progress.solved || {}).filter(Boolean).length;
  const completed = currentRound >= activity.rounds.length;

  return `
    <article class="task-card" data-activity-id="${activity.id}">
      <div class="task-card__header">
        <div>
          <span class="task-badge${activity.optional ? ' task-badge--optional' : ''}">${escapeHtml(activity.badge)}</span>
          <h3>${escapeHtml(activity.title)}</h3>
          <p class="task-prompt">${escapeHtml(activity.prompt)}</p>
        </div>
        <span class="task-score"${doneCount === 0 ? ' data-score-zero' : ''}>${doneCount}/${activity.rounds.length}</span>
      </div>

      ${completed ? `
        <section class="key-trainer key-trainer--done">
          <div class="key-trainer__surface is-correct" tabindex="0" data-key-trainer-surface="${activity.id}">
            <strong>Готово!</strong>
            <p>${escapeHtml(activity.completionMessage || "Тренажер виконано повністю.")}</p>
          </div>
        </section>
      ` : `
        <section class="key-trainer">
          <div class="key-trainer__meta">
            <span class="key-trainer__round">Раунд ${currentRound + 1} з ${activity.rounds.length}</span>
          </div>

          <div
            class="key-trainer__surface ${getRoundStateClass(activity.id, currentRound, state)}"
            tabindex="0"
            data-key-trainer-surface="${activity.id}">
            <p class="key-trainer__lead">${escapeHtml(round.lead || "Натисни потрібну клавішу.")}</p>
            <div class="key-trainer__key">${escapeHtml(round.targetKey)}</div>
            <p class="key-trainer__context">${escapeHtml(round.prompt || "")}</p>
            <p class="key-trainer__feedback">${escapeHtml(getRoundFeedback(activity, state))}</p>
            <p class="key-trainer__last-key">
              ${progress.lastKey ? `Ти натиснув(ла): ${escapeHtml(progress.lastKey)}` : "Тут з’явиться остання натиснута клавіша."}
            </p>
          </div>

          <div class="key-trainer__progress" aria-hidden="true">
            ${activity.rounds.map((item, index) => `
              <span class="key-trainer__progress-chip ${progress.solved?.[index] ? "is-done" : index === currentRound ? "is-current" : ""}">
                ${escapeHtml(item.targetKey)}
              </span>
            `).join("")}
          </div>
        </section>
      `}

      <p class="task-feedback" data-feedback="${activity.id}" aria-live="polite"></p>
      <div class="teacher-only method-box">${renderRichText(activity.teacherTip)}</div>
    </article>
  `;
}

export function setupKeyTrainerTask(activity, state, refs, showFeedback, rerenderTask) {
  state.activityState[activity.id] = getProgress(activity.id, state);

  const surface = document.querySelector(`[data-key-trainer-surface="${activity.id}"]`);
  if (!(surface instanceof HTMLElement)) {
    return;
  }

  surface.focus();
  surface.addEventListener("click", () => surface.focus());

  surface.addEventListener("keydown", (event) => {
    const progress = getProgress(activity.id, state);
    const roundIndex = progress.currentRound || 0;
    const round = activity.rounds[roundIndex];

    if (!round || progress.solved?.[roundIndex] === true || event.altKey || event.ctrlKey || event.metaKey) {
      return;
    }

    const pressedKey = event.key || "";
    if (!pressedKey) {
      return;
    }

    progress.lastKey = pressedKey;
    const ok = getAcceptedKeys(round).includes(normalizeKey(pressedKey));

    if (ok) {
      progress.solved[roundIndex] = true;
      progress.currentRound = roundIndex + 1;
      progress.lastKey = "";
    }

    state.activityState[activity.id] = progress;
    persistState(state);
    event.preventDefault();

    if (ok && progress.currentRound >= activity.rounds.length) {
      completeTask(activity.id, state, refs);
    }

    rerenderTask(`[data-activity-id="${activity.id}"]`);

    setStatus(
      refs.activities.querySelector(`[data-feedback="${activity.id}"]`),
      ok
        ? (round.successMessage || "Правильно! Клавішу знайдено.")
        : (round.tryAgainMessage || "Це не та клавіша. Спробуй ще раз."),
      ok ? "is-success" : "is-warning"
    );

    showFeedback(
      ok
        ? (progress.currentRound >= activity.rounds.length ? "Тренажер клавіатури виконано повністю." : "Правильно, переходимо до наступної клавіші.")
        : "Ще трішки уваги, і вийде.",
      ok ? "is-success" : "is-warning",
      ok ? "✓" : "!"
    );
  });
}
