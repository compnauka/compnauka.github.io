export function validateSections(sections) {
  const errors = [];

  Object.entries(sections).forEach(([key, section]) => {
    if (!section.title) {
      errors.push(`[${key}] відсутній title`);
    }

    if (!Array.isArray(section.messages)) {
      errors.push(`[${key}] відсутній або невалідний масив messages`);
      return;
    }

    section.messages.forEach((msg, i) => {
      const loc = `[${key}].messages[${i}]`;

      if (!msg.type) {
        errors.push(`${loc} відсутній type`);
        return;
      }

      if (msg.type !== 'cover' && !msg.blocks && !msg.content) {
        errors.push(`${loc} відсутній content або blocks`);
      }

      if (msg.image && !msg.alt) {
        errors.push(`${loc} зображення "${msg.image}" без alt-тексту`);
      }
    });

    if (section.quizzes) {
      section.quizzes.forEach((quiz, i) => {
        const loc = `[${key}].quizzes[${i}]`;

        if (!quiz.question) errors.push(`${loc} відсутнє питання`);
        if (!quiz.explanation) errors.push(`${loc} відсутнє пояснення`);

        if (!Array.isArray(quiz.options) || quiz.options.length < 2) {
          errors.push(`${loc} потрібно мінімум 2 варіанти відповіді`);
        } else if (!quiz.options.some(o => o.correct)) {
          errors.push(`${loc} немає жодної правильної відповіді`);
        }
      });
    }
  });

  return errors;
}
