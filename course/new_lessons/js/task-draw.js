import { persistState } from "./state.js";
import { escapeHtml, completeTask, renderRichText, setStatus } from "./shared.js";

export function renderDrawTask(activity, state) {
  const selectedFallback = state.activityState.drawFallback || "";
  return `
    <article class="task-card" data-activity-id="${activity.id}">
      <div class="task-card__header">
        <div>
          <span class="task-badge">${escapeHtml(activity.badge)}</span>
          <h3>${escapeHtml(activity.title)}</h3>
          <p class="task-prompt">${escapeHtml(activity.prompt)}</p>
        </div>
      </div>
      <div class="canvas-wrap ${state.activityState.drawNeedsInput ? "is-empty-warning" : ""}">
        <canvas id="draw-canvas" width="900" height="320" role="img" aria-label="Поле для малювання прикладу зорової інформації">
          Ваш браузер не підтримує canvas. Скористайтеся текстовою альтернативою нижче.
        </canvas>
        <div id="canvas-a11y-layer" class="sr-only" role="region" aria-live="polite" aria-label="Стан завдання малювання">
          ${selectedFallback ? `Обрано текстову альтернативу: ${escapeHtml(selectedFallback)}.` : "Поле для малювання ще не заповнене."}
        </div>
        <div class="actions-row">
          <button type="button" class="secondary-button" id="clear-canvas">Очистити малюнок</button>
          <button type="button" class="primary-button" id="mark-draw-done">Готово</button>
        </div>
      </div>
      <div class="canvas-fallback">
        <label for="draw-fallback"><strong>Замість малювання можна обрати готовий варіант</strong></label>
        <select id="draw-fallback">
          <option value="">Оберіть варіант</option>
          ${activity.fallbackOptions.map((option) => `
            <option value="${escapeHtml(option)}" ${selectedFallback === option ? "selected" : ""}>${escapeHtml(option)}</option>
          `).join("")}
        </select>
      </div>
      <p class="task-feedback" data-feedback="${activity.id}" aria-live="polite"></p>
      <div class="teacher-only method-box">${renderRichText(activity.teacherTip)}</div>
    </article>
  `;
}

export function setupDrawTask(activity, state, refs, showFeedback) {
  const canvas = document.getElementById("draw-canvas");
  const fallbackSelect = document.getElementById("draw-fallback");
  const canvasWrap = refs.activities.querySelector(`[data-activity-id="${activity.id}"] .canvas-wrap`);
  if (!canvas || !fallbackSelect || !canvasWrap) return;

  const context = canvas.getContext("2d");
  const rootStyles = getComputedStyle(document.documentElement);
  const strokeColor =
    rootStyles.getPropertyValue("--primary").trim() ||
    rootStyles.getPropertyValue("--color-primary").trim() ||
    "black";

  let drawing = false;

  context.lineWidth = 7;
  context.lineCap = "round";
  context.lineJoin = "round";
  context.strokeStyle = strokeColor;

  const pointFrom = (event) => {
    const rect = canvas.getBoundingClientRect();
    return {
      x: (event.clientX - rect.left) * (canvas.width / rect.width),
      y: (event.clientY - rect.top) * (canvas.height / rect.height)
    };
  };

  canvas.addEventListener("pointerdown", (event) => {
    drawing = true;
    canvasWrap.classList.remove("is-empty-warning");
    state.activityState.drawNeedsInput = false;
    const point = pointFrom(event);
    context.beginPath();
    context.moveTo(point.x, point.y);
  });

  canvas.addEventListener("pointermove", (event) => {
    if (!drawing) return;
    const point = pointFrom(event);
    state.activityState.drawHasStroke = true;
    context.lineTo(point.x, point.y);
    context.stroke();
  });

  ["pointerup", "pointerleave"].forEach((type) => {
    canvas.addEventListener(type, () => {
      drawing = false;
      context.closePath();
    });
  });

  fallbackSelect.addEventListener("change", () => {
    state.activityState.drawFallback = fallbackSelect.value;
    state.activityState.drawNeedsInput = false;
    canvasWrap.classList.remove("is-empty-warning");
    document.getElementById("canvas-a11y-layer").textContent = fallbackSelect.value
      ? `Обрано текстову альтернативу: ${fallbackSelect.value}.`
      : "Текстову альтернативу не обрано.";
    persistState(state);
  });

  document.getElementById("clear-canvas").addEventListener("click", () => {
    context.clearRect(0, 0, canvas.width, canvas.height);
    state.activityState.drawFallback = "";
    state.activityState.drawHasStroke = false;
    state.activityState.drawNeedsInput = false;
    fallbackSelect.value = "";
    canvasWrap.classList.remove("is-empty-warning");
    document.getElementById("canvas-a11y-layer").textContent = "Поле для малювання очищено.";
    persistState(state);
    setStatus(
      refs.activities.querySelector(`[data-feedback="${activity.id}"]`),
      "Малюнок очищено. Можна почати ще раз.",
      "is-warning"
    );
    showFeedback("Малюнок очищено.", "is-warning", "!");
  });

  document.getElementById("mark-draw-done").addEventListener("click", () => {
    const hasInput = Boolean(state.activityState.drawHasStroke || fallbackSelect.value);

    if (!hasInput) {
      state.activityState.drawNeedsInput = true;
      canvasWrap.classList.add("is-empty-warning");
      canvas.focus();
      setStatus(
        refs.activities.querySelector(`[data-feedback="${activity.id}"]`),
        "Спочатку намалюй щось або обери готовий варіант.",
        "is-warning"
      );
      showFeedback("Спочатку виконай завдання.", "is-warning", "!");
      persistState(state);
      return;
    }

    state.activityState.drawNeedsInput = false;
    canvasWrap.classList.remove("is-empty-warning");
    completeTask(activity.id, state, refs);
    setStatus(
      refs.activities.querySelector(`[data-feedback="${activity.id}"]`),
      "Завдання з малювання позначено як виконане.",
      "is-success"
    );
    showFeedback("Чудово! Завдання з малювання виконано.", "is-success", "✓");
  });
}
