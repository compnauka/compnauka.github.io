import { persistState } from "./state.js";
import { completeTask, escapeHtml, renderActivityMedia, renderRichText, setStatus } from "./shared.js";

function getDefaultProgress() {
  return {
    currentRound: 0,
    answers: {},
    solved: {}
  };
}

function getProgress(activityId, state) {
  return state.activityState[activityId] || getDefaultProgress();
}

function getRoundStateClass(activityId, roundIndex, state) {
  const progress = getProgress(activityId, state);
  if (progress.solved?.[roundIndex] === true) {
    return "is-correct";
  }

  if (Number.isInteger(progress.answers?.[roundIndex])) {
    return "is-wrong";
  }

  return "";
}

function getRoundFeedback(activity, state) {
  const progress = getProgress(activity.id, state);
  const roundIndex = progress.currentRound || 0;
  const round = activity.rounds[roundIndex];

  if (!round) {
    return "Усі раунди виконано.";
  }

  if (progress.solved?.[roundIndex] === true) {
    return round.successMessage || "Правильно.";
  }

  if (Number.isInteger(progress.answers?.[roundIndex])) {
    return round.tryAgainMessage || "Спробуй ще раз і клацни уважніше.";
  }

  return round.helpText || "Знайди потрібну картку і натисни на неї.";
}

export function renderClickTrainerTask(activity, state) {
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
        <section class="click-trainer click-trainer--done">
          <div class="click-trainer__target is-correct">
            <strong>Готово!</strong>
            <p>Ти вже виконав(ла) всі раунди цього тренажера.</p>
          </div>
        </section>
      ` : `
        <section class="click-trainer">
          <div class="click-trainer__meta">
            <span class="click-trainer__round">Раунд ${currentRound + 1} з ${activity.rounds.length}</span>
          </div>
          <div class="click-trainer__target ${getRoundStateClass(activity.id, currentRound, state)}">
            <p class="click-trainer__lead">${escapeHtml(round.lead || "Знайди потрібну картку.")}</p>
            <div class="click-trainer__target-card">
              ${renderActivityMedia(round.target, {
                className: "click-trainer__target-media",
                emojiClassName: "click-trainer__target-emoji",
                imageClassName: "click-trainer__target-image",
                altFallback: round.target?.label || round.target?.text || ""
              })}
              <strong>${escapeHtml(round.target.label || "")}</strong>
            </div>
            <p class="click-trainer__feedback" data-click-feedback="${activity.id}">${escapeHtml(getRoundFeedback(activity, state))}</p>
          </div>

          <div class="choices-grid">
            ${round.options.map((option, optionIndex) => {
              const selected = progress.answers?.[currentRound] === optionIndex;
              const solved = progress.solved?.[currentRound] === true;
              const isCorrect = solved && option.correct === true;
              const isWrong = selected && !solved;

              return `
                <button
                  type="button"
                  class="choice-button ${selected ? "is-selected" : ""} ${isCorrect ? "is-correct-answer" : ""} ${isWrong ? "is-wrong" : ""}"
                  data-click-trainer-option="${activity.id}"
                  data-round-index="${currentRound}"
                  data-option-index="${optionIndex}"
                  aria-pressed="${selected}">
                  ${renderActivityMedia(option, {
                    className: "choice-button__media",
                    emojiClassName: "choice-button__emoji",
                    imageClassName: "choice-button__image",
                    altFallback: option.label
                  })}
                  <span>${escapeHtml(option.label)}</span>
                </button>
              `;
            }).join("")}
          </div>
        </section>
      `}

      <p class="task-feedback" data-feedback="${activity.id}" aria-live="polite"></p>
      <div class="teacher-only method-box">${renderRichText(activity.teacherTip)}</div>
    </article>
  `;
}

export function setupClickTrainerTask(activity, state, refs, showFeedback, rerenderTask) {
  state.activityState[activity.id] = getProgress(activity.id, state);

  document.querySelectorAll(`[data-click-trainer-option="${activity.id}"]`).forEach((button) => {
    button.addEventListener("click", () => {
      const progress = getProgress(activity.id, state);
      const roundIndex = Number(button.dataset.roundIndex);
      const optionIndex = Number(button.dataset.optionIndex);
      const round = activity.rounds[roundIndex];

      if (!round || progress.solved?.[roundIndex] === true || roundIndex !== progress.currentRound) {
        return;
      }

      progress.answers[roundIndex] = optionIndex;
      const option = round.options[optionIndex];
      const ok = option?.correct === true;

      if (ok) {
        progress.solved[roundIndex] = true;
        progress.currentRound = roundIndex + 1;
      }

      state.activityState[activity.id] = progress;
      persistState(state);

      if (ok && progress.currentRound >= activity.rounds.length) {
        completeTask(activity.id, state, refs);
      }

      rerenderTask(`[data-activity-id="${activity.id}"]`);

      setStatus(
        refs.activities.querySelector(`[data-feedback="${activity.id}"]`),
        ok
          ? (option.feedback || round.successMessage || "Чудово! Ти натиснув(ла) правильну картку.")
          : (option.feedback || round.tryAgainMessage || "Це не та картка. Спробуй ще раз."),
        ok ? "is-success" : "is-warning"
      );

      showFeedback(
        ok
          ? (progress.currentRound >= activity.rounds.length ? "Тренажер виконано повністю." : "Правильно! Переходимо до наступного раунду.")
          : "Ще трішки уваги, і вийде.",
        ok ? "is-success" : "is-warning",
        ok ? "✓" : "!"
      );
    });
  });
}
