const KNOWN_MSG_TYPES = new Set([
  'cover', 'ai', 'user', 'note', 'narrator', 'quiz', 'activity'
]);

const KNOWN_ACTIVITY_TYPES = new Set(['classifier', '20questions']);

const KNOWN_BLOCK_TYPES = new Set([
  'paragraph', 'list', 'ordered-list', 'quote',
  'heading', 'definition', 'highlight', 'table'
]);

function validateClassifierContent(content, loc, errors) {
  if (!content) {
    errors.push(`${loc} activity 'classifier' без content`);
    return;
  }
  if (!Array.isArray(content.cards) || content.cards.length === 0) {
    errors.push(`${loc} classifier без масиву cards`);
    return;
  }
  if (!Array.isArray(content.options) || content.options.length === 0) {
    errors.push(`${loc} classifier без масиву options`);
    return;
  }

  const optionValues = new Set(content.options.map(o => o.value));

  content.cards.forEach((card, ci) => {
    const cloc = `${loc}.cards[${ci}]`;
    if (!card.emoji)   errors.push(`${cloc} відсутнє emoji`);
    if (!card.label)   errors.push(`${cloc} відсутній label`);
    if (!card.correct) errors.push(`${cloc} відсутнє correct`);
    else if (!optionValues.has(card.correct)) {
      errors.push(`${cloc} correct "${card.correct}" не збігається з жодним option.value`);
    }
  });
}

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

      if (!KNOWN_MSG_TYPES.has(msg.type)) {
        errors.push(`${loc} невідомий type: "${msg.type}"`);
      }

      const needsContent = !['cover', 'quiz', 'activity'].includes(msg.type);
      if (needsContent && !msg.blocks && !msg.content) {
        errors.push(`${loc} відсутній content або blocks`);
      }

      if (msg.image && !msg.alt) {
        errors.push(`${loc} зображення "${msg.image}" без alt-тексту`);
      }

      if (msg.audio && !msg.audioDescription) {
        errors.push(`${loc} аудіо "${msg.audio}" без audioDescription`);
      }

      if (msg.blocks) {
        msg.blocks.forEach((block, bi) => {
          if (block.type && !KNOWN_BLOCK_TYPES.has(block.type)) {
            errors.push(`${loc}.blocks[${bi}] невідомий тип блоку: "${block.type}"`);
          }
        });
      }

      if (msg.type === 'activity') {
        if (!msg.activityType) {
          errors.push(`${loc} activity без activityType`);
        } else if (!KNOWN_ACTIVITY_TYPES.has(msg.activityType)) {
          errors.push(`${loc} невідомий activityType: "${msg.activityType}"`);
        } else if (msg.activityType === 'classifier') {
          validateClassifierContent(msg.content, loc, errors);
        }
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
