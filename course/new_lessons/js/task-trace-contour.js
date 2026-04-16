import { persistState } from "./state.js";
import { completeTask, escapeHtml, renderRichText, setStatus } from "./shared.js";

function getCanvasId(activityId) {
  return `trace-canvas-${activityId}`;
}

function getStatusId(activityId) {
  return `trace-status-${activityId}`;
}

function getActivityState(activityId, state) {
  return state.activityState[activityId] || {
    visitedCheckpointIndexes: [],
    touchedGuide: false,
    completed: false
  };
}

function drawGuide(context, activity) {
  const checkpoints = activity.checkpoints || [];
  if (checkpoints.length === 0) return;

  context.save();
  context.lineWidth = activity.guideWidth || 16;
  context.lineCap = "round";
  context.lineJoin = "round";
  context.setLineDash([12, 12]);
  context.strokeStyle = "rgba(26, 86, 219, 0.35)";
  context.beginPath();
  context.moveTo(checkpoints[0].x, checkpoints[0].y);

  checkpoints.slice(1).forEach((point) => {
    context.lineTo(point.x, point.y);
  });

  context.stroke();
  context.setLineDash([]);

  checkpoints.forEach((point, index) => {
    context.fillStyle = index === 0 ? "rgba(22, 101, 52, 0.9)" : "rgba(26, 86, 219, 0.7)";
    context.beginPath();
    context.arc(point.x, point.y, index === 0 ? 7 : 5, 0, Math.PI * 2);
    context.fill();
  });

  context.restore();
}

function redrawCanvas(canvas, activity, state) {
  const context = canvas.getContext("2d");
  context.clearRect(0, 0, canvas.width, canvas.height);
  drawGuide(context, activity);

  if (state.pathPoints && state.pathPoints.length > 1) {
    context.save();
    context.lineWidth = activity.traceWidth || 10;
    context.lineCap = "round";
    context.lineJoin = "round";
    context.strokeStyle = activity.traceColor || "#1a56db";
    context.beginPath();
    context.moveTo(state.pathPoints[0].x, state.pathPoints[0].y);
    state.pathPoints.slice(1).forEach((point) => context.lineTo(point.x, point.y));
    context.stroke();
    context.restore();
  }
}

function pointFromEvent(canvas, event) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: (event.clientX - rect.left) * (canvas.width / rect.width),
    y: (event.clientY - rect.top) * (canvas.height / rect.height)
  };
}

function distanceBetween(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function updateVisitedCheckpoints(activityState, activity, point) {
  const radius = activity.hitRadius || 24;
  const nextCheckpointIndex = activityState.visitedCheckpointIndexes.length;
  const checkpoint = activity.checkpoints[nextCheckpointIndex];

  if (!checkpoint) {
    return;
  }

  if (distanceBetween(point, checkpoint) <= radius) {
    activityState.visitedCheckpointIndexes.push(nextCheckpointIndex);
  }
}

export function renderTraceContourTask(activity, state) {
  const activityState = getActivityState(activity.id, state);
  const doneCount = activityState.visitedCheckpointIndexes.length;
  const total = activity.checkpoints.length;
  const completed = activityState.completed === true;

  return `
    <article class="task-card" data-activity-id="${activity.id}">
      <div class="task-card__header">
        <div>
          <span class="task-badge">${escapeHtml(activity.badge)}</span>
          <h3>${escapeHtml(activity.title)}</h3>
          <p class="task-prompt">${escapeHtml(activity.prompt)}</p>
        </div>
        <span class="task-score">${Math.min(doneCount, total)}/${total}</span>
      </div>
      <div class="trace-card ${completed ? "is-correct" : ""}">
        <div class="trace-card__meta">
          <strong>${escapeHtml(activity.lead || "Обведи лінію за контуром.")}</strong>
          <p>${escapeHtml(activity.helperText || "Почни з першої точки і веди лінію по пунктиру.")}</p>
        </div>
        ${(activity.startLabel || activity.endLabel) ? `
          <div class="trace-card__legend">
            ${activity.startLabel ? `<span class="trace-card__legend-chip">${escapeHtml(activity.startLabel)}</span>` : ""}
            ${activity.endLabel ? `<span class="trace-card__legend-chip">${escapeHtml(activity.endLabel)}</span>` : ""}
          </div>
        ` : ""}
        <div class="trace-canvas-wrap">
          <canvas
            id="${getCanvasId(activity.id)}"
            class="trace-canvas"
            width="${activity.width || 900}"
            height="${activity.height || 280}"
            aria-label="${escapeHtml(activity.canvasLabel || activity.prompt)}"></canvas>
          <div id="${getStatusId(activity.id)}" class="sr-only" aria-live="polite">
            ${completed ? "Контур обведено." : `Пройдено ${doneCount} з ${total} точок.`}
          </div>
        </div>
        <div class="actions-row">
          <button type="button" class="secondary-button" data-reset-trace="${activity.id}">Почати ще раз</button>
        </div>
      </div>
      <p class="task-feedback" data-feedback="${activity.id}" aria-live="polite"></p>
      <div class="teacher-only method-box">${renderRichText(activity.teacherTip)}</div>
    </article>
  `;
}

export function setupTraceContourTask(activity, state, refs, showFeedback) {
  const canvas = document.getElementById(getCanvasId(activity.id));
  if (!(canvas instanceof HTMLCanvasElement)) return;

  state.activityState[activity.id] = getActivityState(activity.id, state);
  const activityState = state.activityState[activity.id];
  redrawCanvas(canvas, activity, activityState);

  let drawing = false;

  function updateLiveStatus() {
    const live = document.getElementById(getStatusId(activity.id));
    if (live) {
      live.textContent = activityState.completed
        ? "Контур обведено."
        : `Пройдено ${activityState.visitedCheckpointIndexes.length} з ${activity.checkpoints.length} точок.`;
    }
  }

  function maybeComplete() {
    if (activityState.completed) return;

    const allVisited = activityState.visitedCheckpointIndexes.length >= activity.checkpoints.length;
    if (allVisited && activityState.touchedGuide) {
      activityState.completed = true;
      persistState(state);
      completeTask(activity.id, state, refs);
      setStatus(
        refs.activities.querySelector(`[data-feedback="${activity.id}"]`),
        "Чудово! Контур обведено уважно.",
        "is-success"
      );
      showFeedback("Контур обведено правильно.", "is-success", "✓");
      updateLiveStatus();
    }
  }

  canvas.addEventListener("pointerdown", (event) => {
    drawing = true;
    const point = pointFromEvent(canvas, event);
    activityState.pathPoints = [point];
    updateVisitedCheckpoints(activityState, activity, point);
    persistState(state);
    redrawCanvas(canvas, activity, activityState);
    updateLiveStatus();
  });

  canvas.addEventListener("pointermove", (event) => {
    if (!drawing || activityState.completed) return;

    const point = pointFromEvent(canvas, event);
    activityState.pathPoints = activityState.pathPoints || [];
    activityState.pathPoints.push(point);
    activityState.touchedGuide = true;
    updateVisitedCheckpoints(activityState, activity, point);
    persistState(state);
    redrawCanvas(canvas, activity, activityState);
    updateLiveStatus();
    maybeComplete();
  });

  ["pointerup", "pointerleave"].forEach((eventName) => {
    canvas.addEventListener(eventName, () => {
      drawing = false;
      maybeComplete();
    });
  });

  document.querySelector(`[data-reset-trace="${activity.id}"]`)?.addEventListener("click", () => {
    state.activityState[activity.id] = {
      visitedCheckpointIndexes: [],
      touchedGuide: false,
      completed: false,
      pathPoints: []
    };
    persistState(state);
    redrawCanvas(canvas, activity, state.activityState[activity.id]);
    updateLiveStatus();
    setStatus(
      refs.activities.querySelector(`[data-feedback="${activity.id}"]`),
      "Контур очищено. Можна обвести ще раз.",
      "is-warning"
    );
    showFeedback("Контур очищено.", "is-warning", "!");
  });
}
