import { persistState } from "./state.js";
import { escapeHtml, completeTask, renderRichText } from "./shared.js";

export function renderReflection(reflection, state, container) {
  container.innerHTML = `
    <p>${escapeHtml(reflection.prompt)}</p>
    <div class="reflection-actions">
      ${reflection.options.map((option, index) => `
        <button
          type="button"
          class="emotion-button ${state.reflectionChoice === index ? "is-selected" : ""}"
          data-reflect="${index}"
          aria-pressed="${state.reflectionChoice === index}">
          <span class="emotion-button__emoji">${escapeHtml(option.emoji)}</span>
          <span>${escapeHtml(option.label)}</span>
        </button>
      `).join("")}
    </div>
    <p class="reflection-note" id="reflection-note">
      ${state.reflectionChoice !== null ? `Обрано: ${escapeHtml(reflection.options[state.reflectionChoice].label)}.` : ""}
    </p>
    <div class="teacher-only method-box">${renderRichText(reflection.note)}</div>
  `;
}

export function setupReflection(reflection, state, refs, showFeedback) {
  refs.reflection.querySelectorAll("[data-reflect]").forEach((button) => {
    button.addEventListener("click", () => {
      const selectedIndex = Number(button.dataset.reflect);
      state.reflectionChoice = selectedIndex;
      completeTask("reflection", state, refs);
      persistState(state);
      renderReflection(reflection, state, refs.reflection);
      setupReflection(reflection, state, refs, showFeedback);

      requestAnimationFrame(() => {
        const selectedButton = refs.reflection.querySelector(`[data-reflect="${selectedIndex}"]`);
        if (selectedButton instanceof HTMLElement) {
          selectedButton.focus();
        }
      });

      showFeedback("Рефлексію збережено.", "is-success", "✓");
    });
  });
}
