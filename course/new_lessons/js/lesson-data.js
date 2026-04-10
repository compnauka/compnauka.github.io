function shuffle(array) {
  const result = [...array];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }
  return result;
}

function sample(array, count) {
  return shuffle(array).slice(0, count);
}

function randomizeOptions(question) {
  return {
    ...question,
    options: shuffle(question.options)
  };
}

function buildClassifyActivity(template) {
  const items = shuffle(
    template.categories.flatMap((category) =>
      sample(template.items.filter((item) => item.correct === category), template.perCategory)
    )
  );

  return {
    ...template,
    items
  };
}

function buildTrueFalseActivity(template) {
  return {
    ...template,
    statements: sample(template.statements, template.count)
  };
}

function buildPickActivity(template) {
  return {
    ...template,
    groups: sample(template.groups, template.count).map((group) => ({
      ...group,
      options: shuffle(group.options)
    }))
  };
}

function buildFillActivity(template) {
  return {
    ...template,
    sentences: sample(template.sentences, template.count).map((sentence) => ({
      ...sentence,
      options: shuffle(sentence.options)
    }))
  };
}

function buildScenariosActivity(template) {
  return {
    ...template,
    situations: sample(template.situations, template.count).map((situation) => ({
      ...situation,
      options: shuffle(situation.options)
    }))
  };
}

function buildSequenceActivity(template) {
  const steps = template.steps.map((step, index) => ({
    id: `step-${index + 1}`,
    label: step
  }));

  return {
    ...template,
    options: shuffle(steps),
    correctOrder: steps.map((step) => step.id)
  };
}

function buildCreativeActivity(template) {
  return {
    ...template,
    groups: template.groups.map((group) => ({
      ...group,
      options: shuffle(group.options).map((option) => ({ ...option }))
    }))
  };
}

function buildTransferActivity(template) {
  return {
    ...template,
    cases: sample(template.cases, template.count).map((item) => ({
      ...item,
      options: shuffle(item.options).map((option) => ({ ...option }))
    }))
  };
}

function buildQuiz(quizTemplate) {
  return sample(quizTemplate.questions, quizTemplate.count).map((question) => randomizeOptions(question));
}

function cloneSections(sections) {
  return sections.map((section) => ({
    ...section,
    audience: section.audience || "both",
    cards: section.cards ? section.cards.map((card) => ({ ...card })) : undefined,
    bullets: section.bullets ? [...section.bullets] : undefined
  }));
}

function cloneOverview(overview) {
  if (!overview || !Array.isArray(overview.cards) || overview.cards.length === 0) {
    return null;
  }

  return {
    label: overview.label || "План уроку",
    title: overview.title || "Що підготувати і як провести урок",
    cards: overview.cards.map((card) => ({
      ...card,
      audience: card.audience || "both",
      items: Array.isArray(card.items) ? [...card.items] : undefined
    }))
  };
}

function cloneActivities(activities) {
  const built = [
    { ...activities.draw, fallbackOptions: [...activities.draw.fallbackOptions] },
    buildClassifyActivity(activities.classify),
    ...(activities.sequence ? [buildSequenceActivity(activities.sequence)] : []),
    buildTrueFalseActivity(activities.truefalse),
    buildPickActivity(activities.pick),
    buildFillActivity(activities.fill),
    buildScenariosActivity(activities.scenarios),
    ...(activities.creative ? [buildCreativeActivity(activities.creative)] : []),
    ...(activities.transfer ? [buildTransferActivity(activities.transfer)] : [])
  ];

  return built;
}

function assertTemplate(template) {
  if (!template || typeof template !== 'object') {
    throw new Error('Lesson template is required.');
  }

  const requiredKeys = ['title', 'goal', 'goalNote', 'objectives', 'sections', 'activities', 'quiz', 'reflection'];
  const missing = requiredKeys.filter((key) => template[key] === undefined);
  if (missing.length > 0) {
    throw new Error(`Lesson template is missing required keys: ${missing.join(', ')}`);
  }
}

export function createLessonData(template) {
  assertTemplate(template);

  const studentHook = template.studentHook || template.summary || 'Сьогодні ми працюємо з новою темою інформатики.';
  const teacherOverview = template.teacherOverview || template.summary || 'Урок має пояснення, практичні завдання та підсумкову перевірку.';
  const sharedMeta = template.meta || null;
  const studentMeta = template.studentMeta || sharedMeta || ['🧒 1-2 клас', '🎮 Інтерактивна практика'];
  const teacherMeta = template.teacherMeta || sharedMeta || ['🧒 1-2 клас', '🏫 У класі або вдома'];

  return {
    id: template.id || null,
    title: template.title,
    studentHook,
    teacherOverview,
    studentMeta: [...studentMeta],
    teacherMeta: [...teacherMeta],
    overview: cloneOverview(template.overview),
    goal: template.goal,
    goalNote: template.goalNote,
    objectives: [...template.objectives],
    sections: cloneSections(template.sections),
    activities: cloneActivities(template.activities),
    quiz: buildQuiz(template.quiz),
    reflection: {
      ...template.reflection,
      options: template.reflection.options.map((option) => ({ ...option }))
    }
  };
}
