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

function buildTableReadActivity(template) {
  return {
    ...template,
    cases: sample(template.cases, template.count).map((item) => ({
      ...item,
      columns: [...item.columns],
      rows: item.rows.map((row) => ({
        ...row,
        cells: [...row.cells]
      })),
      answer: { ...item.answer }
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

function cloneCoverage(coverage) {
  if (!coverage || typeof coverage !== "object") {
    return null;
  }

  return {
    cycle: coverage.cycle || "",
    note: coverage.note || "",
    results: Array.isArray(coverage.results)
      ? coverage.results.map((item) => ({
        code: item.code || "",
        status: item.status || "partial",
        focus: item.focus || "",
        next: item.next || ""
      }))
      : []
  };
}

function cloneActivities(activities, activityOrder = null) {
  const builders = {
    draw: () => (activities.draw ? { ...activities.draw, fallbackOptions: [...activities.draw.fallbackOptions] } : null),
    classify: () => (activities.classify ? buildClassifyActivity(activities.classify) : null),
    sequence: () => (activities.sequence ? buildSequenceActivity(activities.sequence) : null),
    truefalse: () => (activities.truefalse ? buildTrueFalseActivity(activities.truefalse) : null),
    pick: () => (activities.pick ? buildPickActivity(activities.pick) : null),
    fill: () => (activities.fill ? buildFillActivity(activities.fill) : null),
    scenarios: () => (activities.scenarios ? buildScenariosActivity(activities.scenarios) : null),
    creative: () => (activities.creative ? buildCreativeActivity(activities.creative) : null),
    transfer: () => (activities.transfer ? buildTransferActivity(activities.transfer) : null),
    "table-read": () => (activities["table-read"] ? buildTableReadActivity(activities["table-read"]) : null)
  };

  const defaultOrder = ["draw", "classify", "sequence", "truefalse", "pick", "fill", "scenarios", "creative", "transfer", "table-read"];
  const order = Array.isArray(activityOrder) && activityOrder.length > 0 ? activityOrder : defaultOrder;

  return order
    .map((key) => builders[key]?.())
    .filter(Boolean);
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
    coverage: cloneCoverage(template.coverage),
    overview: cloneOverview(template.overview),
    goal: template.goal,
    goalNote: template.goalNote,
    objectives: [...template.objectives],
    sections: cloneSections(template.sections),
    activities: cloneActivities(template.activities, template.activityOrder),
    quiz: buildQuiz(template.quiz),
    reflection: {
      ...template.reflection,
      options: template.reflection.options.map((option) => ({ ...option }))
    }
  };
}
