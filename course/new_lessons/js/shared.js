import { persistState } from "./state.js";

export function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function renderRichText(value) {
  return escapeHtml(value).replace(/\n/g, "<br>");
}

export function renderActivityMedia(item, options = {}) {
  const {
    className = "activity-media",
    emojiClassName = "activity-media__emoji",
    imageClassName = "activity-media__image",
    altFallback = ""
  } = options;

  if (item?.image) {
    const alt = item.imageAlt || item.label || item.text || altFallback || "";
    const assetKeyAttr = item.assetKey ? ` data-asset-key="${escapeHtml(item.assetKey)}"` : "";
    return `<span class="${escapeHtml(className)}">${item.emoji ? `<span class="${escapeHtml(emojiClassName)} activity-media__emoji--fallback" aria-hidden="true">${escapeHtml(item.emoji)}</span>` : ""}<img class="${escapeHtml(imageClassName)}" src="${escapeHtml(item.image)}" alt="${escapeHtml(alt)}"${assetKeyAttr}></span>`;
  }

  if (item?.emoji) {
    const assetKeyAttr = item.assetKey ? ` data-asset-key="${escapeHtml(item.assetKey)}"` : "";
    return `<span class="${escapeHtml(className)}"><span class="${escapeHtml(emojiClassName)}" aria-hidden="true"${assetKeyAttr}>${escapeHtml(item.emoji)}</span></span>`;
  }

  return "";
}

export function applyMode(state, refs) {
  refs.body.classList.remove("student-mode", "teacher-mode");
  refs.body.classList.add(state.mode === "teacher" ? "teacher-mode" : "student-mode");
  refs.modeStudent.setAttribute("aria-pressed", String(state.mode === "student"));
  refs.modeTeacher.setAttribute("aria-pressed", String(state.mode === "teacher"));
  refs.modeStudent.classList.toggle("is-active", state.mode === "student");
  refs.modeTeacher.classList.toggle("is-active", state.mode === "teacher");
}

export function syncSoundToggle(state, refs) {
  refs.soundToggle.setAttribute("aria-pressed", String(state.soundOn));
  refs.soundToggle.textContent = state.soundOn ? "🔈 Звук" : "🔇 Звук";
  refs.soundToggle.title = state.soundOn
    ? "Звук увімкнено. Після перевірки завдання пролунає короткий сигнал."
    : "Звук вимкнено.";
}

export function toggleMode(mode, state, refs) {
  state.mode = mode;
  persistState(state);
  applyMode(state, refs);
}

export function toggleSound(state, refs) {
  state.soundOn = !state.soundOn;
  persistState(state);
  syncSoundToggle(state, refs);
  if (state.soundOn) {
    playTone(520, 0.08);
  }
}

export function setStatus(element, message, statusClass) {
  if (!element) return;
  const base = element.id === "quiz-result" ? "status-message" : "task-feedback";
  const normalizedMessage = typeof message === "string" ? message.trim() : "";
  element.textContent = normalizedMessage;
  element.className = `${base} ${normalizedMessage ? statusClass : ""}`.trim();
  element.hidden = !normalizedMessage;
}

export function updateProgress(state, refs) {
  const total = Object.keys(state.completed).length;
  const done = Object.values(state.completed).filter(Boolean).length;
  const percent = Math.round((done / total) * 100);
  refs.progressBar.style.width = `${percent}%`;
  refs.progressLabel.textContent = `Готово ${percent}%`;
}

export function completeTask(taskId, state, refs) {
  if (!state.completed[taskId]) {
    state.completed[taskId] = true;
    persistState(state);
    updateProgress(state, refs);
  }
}

export function createFeedbackController(state, refs) {
  let timer = null;

  return (message, statusClass = "is-success", icon = "✓") => {
    refs.toast.hidden = false;
    refs.toast.className = `feedback-toast ${statusClass}`.trim();
    refs.toastIcon.textContent = icon;
    refs.toastMessage.textContent = message;
    refs.live.textContent = message;

    if (state.soundOn) {
      const frequency = statusClass === "is-success" ? 660 : statusClass === "is-danger" ? 220 : 440;
      playTone(frequency, 0.12);
    }

    clearTimeout(timer);
    timer = window.setTimeout(() => {
      refs.toast.hidden = true;
    }, 3500);
  };
}

function playTone(frequency, durationSeconds) {
  try {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    oscillator.type = "sine";
    oscillator.frequency.value = frequency;
    gain.gain.value = 0.04;
    oscillator.connect(gain);
    gain.connect(audioContext.destination);
    oscillator.start();
    oscillator.stop(audioContext.currentTime + durationSeconds);
    oscillator.onended = () => audioContext.close();
  } catch {
    // Silent fallback.
  }
}

export function registerServiceWorker(showFeedback) {
  if (!("serviceWorker" in navigator)) return Promise.resolve();
  return navigator.serviceWorker.register("./sw.js").catch(() => {
    if (showFeedback) {
      showFeedback("Не вдалося ввімкнути офлайн-режим у цьому браузері.", "is-warning", "!");
    }
  });
}
