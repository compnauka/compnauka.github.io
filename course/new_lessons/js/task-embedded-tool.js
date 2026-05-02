import { persistState } from "./state.js";
import {
  completeTask,
  escapeHtml,
  renderRichText,
  setStatus,
  updateProgress
} from "./shared.js";

const embeddedToolContexts = new Map();
let messageListenerBound = false;

const TRUSTED_TOOL_PATH_SEGMENT = "/tools/";

function isTrustedToolUrl(url) {
  return url.origin === window.location.origin && url.pathname.includes(TRUSTED_TOOL_PATH_SEGMENT);
}

function buildToolUrl(rawUrl, activityId) {
  if (!rawUrl) {
    return "";
  }

  const url = new URL(rawUrl, window.location.href);
  if (!isTrustedToolUrl(url)) {
    console.warn("Blocked untrusted embedded tool URL:", rawUrl);
    return "";
  }

  url.searchParams.set("activityId", activityId);
  return url.toString();
}

function getAllowedOrigins(activity) {
  return [activity.launchUrl, activity.embedUrl]
    .filter(Boolean)
    .map((rawUrl) => new URL(rawUrl, window.location.href))
    .filter(isTrustedToolUrl)
    .map((url) => url.origin);
}

function getDefaultProgress(activity) {
  return {
    hasStarted: false,
    isExpanded: Boolean(activity.autoOpenEmbed && activity.embedUrl),
    isDone: false,
    completedVia: ""
  };
}

function getProgress(activity, state) {
  return state.activityState[activity.id] || getDefaultProgress(activity);
}

function markEmbeddedToolDone(activity, state, refs, showFeedback, rerenderTask, source = "manual") {
  const progress = {
    ...getDefaultProgress(activity),
    ...getProgress(activity, state),
    hasStarted: true,
    isDone: true,
    completedVia: source
  };

  state.activityState[activity.id] = progress;
  persistState(state);
  completeTask(activity.id, state, refs);
  rerenderTask(`[data-activity-id="${activity.id}"]`);

  setStatus(
    refs.activities.querySelector(`[data-feedback="${activity.id}"]`),
    source === "message"
      ? "Інструмент повідомив, що роботу завершено."
      : "Чудово! Позначаємо практику як виконану.",
    "is-success"
  );
  showFeedback("Творчу практику зараховано.", "is-success", "✓");
}

function bindMessageListener() {
  if (messageListenerBound) {
    return;
  }

  window.addEventListener("message", (event) => {
    const payload = event.data;
    if (!payload || payload.type !== "embedded-tool-finished" || !payload.activityId) {
      return;
    }

    const context = embeddedToolContexts.get(payload.activityId);
    if (!context) {
      return;
    }

    const allowedOrigins = getAllowedOrigins(context.activity);
    if (allowedOrigins.length > 0 && !allowedOrigins.includes(event.origin)) {
      return;
    }

    markEmbeddedToolDone(
      context.activity,
      context.state,
      context.refs,
      context.showFeedback,
      context.rerenderTask,
      "message"
    );
  });

  messageListenerBound = true;
}

export function renderEmbeddedToolTask(activity, state) {
  const progress = getProgress(activity, state);
  const isDone = state.completed?.[activity.id] || progress.isDone;
  const launchUrl = buildToolUrl(activity.launchUrl, activity.id);
  const embedUrl = buildToolUrl(activity.embedUrl, activity.id);

  return `
    <article class="task-card" data-activity-id="${activity.id}">
      <div class="task-card__header">
        <div>
          <span class="task-badge">${escapeHtml(activity.badge)}</span>
          <h3>${escapeHtml(activity.title)}</h3>
          <p class="task-prompt">${escapeHtml(activity.prompt)}</p>
        </div>
        <span class="task-score">${isDone ? "1/1" : "0/1"}</span>
      </div>

      <section class="embedded-tool ${isDone ? "is-done" : ""}">
        <div class="embedded-tool__intro">
          <p class="embedded-tool__lead">${escapeHtml(activity.lead || "")}</p>
          ${activity.note ? `<p class="embedded-tool__note">${escapeHtml(activity.note)}</p>` : ""}
        </div>

        ${Array.isArray(activity.steps) && activity.steps.length > 0 ? `
          <ol class="embedded-tool__steps">
            ${activity.steps.map((step) => `<li>${escapeHtml(step)}</li>`).join("")}
          </ol>
        ` : ""}

        <div class="actions-row embedded-tool__actions">
          ${launchUrl ? `
            <button
              type="button"
              class="primary-button"
              data-embedded-launch="${activity.id}"
              data-launch-url="${escapeHtml(launchUrl)}">
              ${escapeHtml(activity.launchLabel || "Відкрити інструмент")}
            </button>
          ` : ""}
          ${embedUrl ? `
            <button
              type="button"
              class="secondary-button"
              data-embedded-toggle="${activity.id}"
              aria-expanded="${progress.isExpanded ? "true" : "false"}">
              ${escapeHtml(progress.isExpanded ? (activity.hideLabel || "Сховати інструмент") : (activity.embedLabel || "Показати інструмент тут"))}
            </button>
          ` : ""}
          <button
            type="button"
            class="secondary-button"
            data-embedded-complete="${activity.id}"
            ${isDone ? "disabled" : ""}>
            ${escapeHtml(activity.completeLabel || "Позначити як виконане")}
          </button>
          <button
            type="button"
            class="secondary-button"
            data-embedded-reset="${activity.id}">
            ${escapeHtml(activity.resetLabel || "Почати ще раз")}
          </button>
        </div>

        ${embedUrl && progress.isExpanded ? `
          <div class="embedded-tool__frame-wrap">
            <iframe
              class="embedded-tool__frame"
              data-embedded-frame="${activity.id}"
              src="${escapeHtml(embedUrl)}"
              title="${escapeHtml(activity.frameTitle || activity.title)}"
              loading="lazy"
              referrerpolicy="no-referrer"
              sandbox="allow-scripts allow-same-origin allow-forms"></iframe>
          </div>
        ` : ""}

        ${isDone ? `
          <p class="embedded-tool__done">
            ${escapeHtml(activity.doneMessage || "Практику виконано. Можна перейти далі або повернутися до інструмента ще раз.")}
          </p>
        ` : ""}
      </section>

      <p class="task-feedback" data-feedback="${activity.id}" aria-live="polite"></p>
      <div class="teacher-only method-box">${renderRichText(activity.teacherTip)}</div>
    </article>
  `;
}

export function setupEmbeddedToolTask(activity, state, refs, showFeedback, rerenderTask) {
  state.activityState[activity.id] = {
    ...getDefaultProgress(activity),
    ...getProgress(activity, state)
  };

  embeddedToolContexts.set(activity.id, { activity, state, refs, showFeedback, rerenderTask });
  bindMessageListener();

  document.querySelectorAll(`[data-embedded-launch="${activity.id}"]`).forEach((button) => {
    button.addEventListener("click", () => {
      const launchUrl = button.dataset.launchUrl;
      if (!launchUrl) {
        return;
      }

      const progress = {
        ...getDefaultProgress(activity),
        ...getProgress(activity, state),
        hasStarted: true
      };
      state.activityState[activity.id] = progress;
      persistState(state);
      const openedWindow = window.open(launchUrl, "_blank", "noopener,noreferrer");
      if (openedWindow) {
        openedWindow.opener = null;
      }
      rerenderTask(`[data-activity-id="${activity.id}"]`);
      showFeedback("Інструмент відкрито в окремій вкладці.", "is-success", "✓");
    });
  });

  document.querySelectorAll(`[data-embedded-toggle="${activity.id}"]`).forEach((button) => {
    button.addEventListener("click", () => {
      const current = getProgress(activity, state);
      const progress = {
        ...getDefaultProgress(activity),
        ...current,
        isExpanded: !current.isExpanded,
        hasStarted: true
      };
      state.activityState[activity.id] = progress;
      persistState(state);
      rerenderTask(`[data-embedded-toggle="${activity.id}"]`);
    });
  });

  document.querySelectorAll(`[data-embedded-complete="${activity.id}"]`).forEach((button) => {
    button.addEventListener("click", () => {
      if (button.disabled) {
        return;
      }

      markEmbeddedToolDone(activity, state, refs, showFeedback, rerenderTask, "manual");
    });
  });

  document.querySelectorAll(`[data-embedded-reset="${activity.id}"]`).forEach((button) => {
    button.addEventListener("click", () => {
      state.activityState[activity.id] = getDefaultProgress(activity);
      if (state.completed?.[activity.id]) {
        state.completed[activity.id] = false;
        updateProgress(state, refs);
      }
      persistState(state);
      rerenderTask(`[data-embedded-reset="${activity.id}"]`);
      setStatus(
        refs.activities.querySelector(`[data-feedback="${activity.id}"]`),
        "Спробу скинуто. Можна почати ще раз.",
        "is-warning"
      );
      showFeedback("Можна спробувати інструмент ще раз.", "is-warning", "!");
    });
  });
}
