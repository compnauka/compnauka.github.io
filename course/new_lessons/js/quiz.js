import { persistState } from "./state.js";
import { escapeHtml, setStatus, updateProgress } from "./shared.js";

function getQuestionResult(questionId, state) {
  return state.quizResults?.[questionId];
}

function getQuestionFeedback(questionId, state) {
  const result = getQuestionResult(questionId, state);
  if (result === undefined) return "";
  return result ? "Так, це правильна відповідь." : "Тут є помилка. Спробуй ще раз.";
}

function getOptionState(question, option, savedValues, state) {
  const result = getQuestionResult(question.id, state);
  if (result === undefined) return "";

  const selected = savedValues.includes(option);
  const correctOptions = question.type === "single" ? [question.answer] : question.answer;
  const isCorrectAnswer = correctOptions.includes(option);

  if (selected && isCorrectAnswer) return "is-correct";
  if (selected && !isCorrectAnswer) return "is-wrong";
  if (!selected && !result && isCorrectAnswer) return "is-correct";
  return "";
}

export function renderQuiz(quiz, state, form) {
  form.innerHTML = quiz
    .map((question, index) => {
      const type = question.type === "single" ? "radio" : "checkbox";
      const savedValues = state.quizAnswers[question.id] || [];
      const result = getQuestionResult(question.id, state);
      const resultClass = result === undefined ? "" : result ? "is-success" : "is-warning";

      return `
        <article class="question-card">
          <fieldset>
            <legend>${index + 1}. ${escapeHtml(question.question)}</legend>
            <div class="option-list">
              ${question.options.map((option, optionIndex) => `
                <label for="${question.id}-${optionIndex}" class="${getOptionState(question, option, savedValues, state)}">
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
            <p class="question-feedback ${resultClass}" data-question-feedback="${question.id}" aria-live="polite">${escapeHtml(getQuestionFeedback(question.id, state))}</p>
            ${question.explanation ? `<p class="teacher-only question-hint">${escapeHtml(question.explanation)}</p>` : ""}
          </fieldset>
        </article>
      `;
    })
    .join("");
}

export function setupQuiz(quiz, state, refs, showFeedback) {
  state.quizResults = state.quizResults || {};

  refs.quizForm.querySelectorAll("input").forEach((input) => {
    input.addEventListener("change", () => {
      rememberQuizInputs(quiz, state, refs.quizForm);
      delete state.quizResults[input.name];
      persistState(state);
      renderQuiz(quiz, state, refs.quizForm);
      setupQuiz(quiz, state, refs, showFeedback);
    });
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
      setStatus(refs.quizResult, "Дай відповідь на кожне питання.", "is-warning");
      showFeedback("Спочатку дай відповіді на всі питання.", "is-warning", "!");
      return;
    }

    let score = 0;

    quiz.forEach((question) => {
      let correct = false;

      if (question.type === "single") {
        const selected = state.quizAnswers[question.id]?.[0];
        correct = selected === question.answer;
      }

      if (question.type === "multiple") {
        const selected = [...(state.quizAnswers[question.id] || [])].sort();
        const expected = [...question.answer].sort();
        correct = JSON.stringify(selected) === JSON.stringify(expected);
      }

      state.quizResults[question.id] = correct;
      if (correct) score += 1;
    });

    const ok = score === quiz.length;
    state.completed.quiz = true;
    persistState(state);
    renderQuiz(quiz, state, refs.quizForm);
    setupQuiz(quiz, state, refs, showFeedback);
    updateProgress(state, refs);
    setStatus(refs.quizResult, `Твій результат: ${score} із ${quiz.length}.`, ok ? "is-success" : score > 0 ? "is-warning" : "is-danger");
    showFeedback(ok ? "Тест виконано без помилок." : `Тест: ${score} із ${quiz.length}.`, ok ? "is-success" : "is-warning", ok ? "✓" : "!");
  };

  refs.resetQuizHandler = () => {
    state.quizAnswers = {};
    state.quizResults = {};
    state.completed.quiz = false;
    persistState(state);
    renderQuiz(quiz, state, refs.quizForm);
    setupQuiz(quiz, state, refs, showFeedback);
    updateProgress(state, refs);
    setStatus(refs.quizResult, "Тест очищено.", "is-warning");

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
      state.quizAnswers[question.id] = Array.from(form.querySelectorAll(`input[name="${question.id}"]:checked`)).map((input) => input.value);
    }
  });

  persistState(state);
}
