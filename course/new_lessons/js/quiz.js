import { persistState } from "./state.js";
import { escapeHtml, setStatus, updateProgress } from "./shared.js";

export function renderQuiz(quiz, state, form) {
  form.innerHTML = quiz
    .map((question, index) => {
      const type = question.type === "single" ? "radio" : "checkbox";
      const savedValues = state.quizAnswers[question.id] || [];

      return `
        <article class="question-card">
          <fieldset>
            <legend>${index + 1}. ${escapeHtml(question.question)}</legend>
            <div class="option-list">
              ${question.options.map((option, optionIndex) => `
                <label for="${question.id}-${optionIndex}">
                  <input
                    id="${question.id}-${optionIndex}"
                    type="${type}"
                    name="${question.id}"
                    value="${escapeHtml(option)}"
                    ${savedValues.includes(option) ? "checked" : ""}>
                  <span>${escapeHtml(option)}</span>
                </label>
              `).join("")}
            </div>
            ${question.explanation ? `<p class="teacher-only question-hint">${escapeHtml(question.explanation)}</p>` : ""}
          </fieldset>
        </article>
      `;
    })
    .join("");
}

export function setupQuiz(quiz, state, refs, showFeedback) {
  refs.quizForm.querySelectorAll("input").forEach((input) => {
    input.addEventListener("change", () => rememberQuizInputs(quiz, state, refs.quizForm));
  });

  refs.checkQuizHandler = () => {
    rememberQuizInputs(quiz, state, refs.quizForm);
    const allAnswered = quiz.every((question) => {
      const selected = state.quizAnswers[question.id] || [];
      return question.type === "single" ? selected.length === 1 : selected.length > 0;
    });

    if (!allAnswered) {
      state.completed.quiz = false;
      persistState(state);
      updateProgress(state, refs);
      setStatus(refs.quizResult, "Дай відповідь на кожне питання перед перевіркою.", "is-warning");
      showFeedback("Спочатку відповідай на всі питання.", "is-warning", "!");
      return;
    }

    let score = 0;

    quiz.forEach((question) => {
      if (question.type === "single") {
        const selected = state.quizAnswers[question.id]?.[0];
        if (selected === question.answer) score += 1;
      }

      if (question.type === "multiple") {
        const selected = [...(state.quizAnswers[question.id] || [])].sort();
        const expected = [...question.answer].sort();
        if (JSON.stringify(selected) === JSON.stringify(expected)) score += 1;
      }
    });

    const ok = score === quiz.length;
    state.completed.quiz = true;
    persistState(state);
    updateProgress(state, refs);
    setStatus(
      refs.quizResult,
      `Результат: ${score} із ${quiz.length}.`,
      ok ? "is-success" : score > 0 ? "is-warning" : "is-danger"
    );
    showFeedback(
      ok ? "Тест виконано без помилок." : `Тест: ${score} з ${quiz.length}.`,
      ok ? "is-success" : "is-warning",
      ok ? "✓" : "!"
    );
  };

  refs.resetQuizHandler = () => {
    state.quizAnswers = {};
    state.completed.quiz = false;
    persistState(state);
    renderQuiz(quiz, state, refs.quizForm);
    setupQuiz(quiz, state, refs, showFeedback);
    updateProgress(state, refs);
    setStatus(refs.quizResult, "Тест скинуто.", "is-warning");

    requestAnimationFrame(() => {
      const firstInput = refs.quizForm.querySelector("input");
      if (firstInput instanceof HTMLElement) {
        firstInput.focus();
      }
    });
  };
}

function rememberQuizInputs(quiz, state, form) {
  quiz.forEach((question) => {
    if (question.type === "single" || question.type === "multiple") {
      state.quizAnswers[question.id] = Array.from(
        form.querySelectorAll(`input[name="${question.id}"]:checked`)
      ).map((input) => input.value);
    }
  });

  persistState(state);
}
