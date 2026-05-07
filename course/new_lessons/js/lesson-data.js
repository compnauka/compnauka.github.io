import { cycle2AssetManifest } from "./assets/cycle-2-manifest.js";

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

const assetManifest = cycle2AssetManifest;

function buildClassifyActivity(template) {
  const categoryKeyToLabel = Object.fromEntries(
    template.categories
      .filter((category) => category && typeof category === "object" && category.key && category.label)
      .map((category) => [category.key, category.label])
  );
  const categories = template.categories.map((category) =>
    typeof category === "string" ? category : category.label
  );
  const categoryIcons = template.categoryIcons
    || Object.fromEntries(
      template.categories
        .filter((category) => category && typeof category === "object" && category.label && category.icon)
        .map((category) => [category.label, category.icon])
    );
  const normalizedItems = template.items.map((item) => ({
    ...item,
    label: item.label || item.text || "",
    correct: categoryKeyToLabel[item.correct || item.category] || item.correct || item.category
  }));

  const items = shuffle(
    categories.flatMap((category) =>
      sample(normalizedItems.filter((item) => item.correct === category), template.perCategory ?? normalizedItems.length)
    )
  );

  return {
    ...template,
    categories,
    categoryIcons,
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
  const itemSource = Array.isArray(template.items) ? template.items : [];
  return {
    ...template,
    items: sample(itemSource, template.count ?? itemSource.length).map((item) => ({
      ...item,
      text: item.text || "",
      answer: item.answer || "",
      placeholder: item.inputType === "text" ? (item.placeholder || item.answer || "") : item.placeholder,
      options: Array.isArray(item.options) ? shuffle(item.options) : undefined,
      acceptedAnswers: Array.isArray(item.acceptedAnswers) ? [...item.acceptedAnswers] : undefined
    }))
  };
}

function buildScenariosActivity(template) {
  const sourceSituations = template.situations || template.cases || [];

  return {
    ...template,
    situations: sample(sourceSituations, template.count).map((situation) => ({
      ...situation,
      text: situation.text || situation.situation || situation.title || "",
      options: shuffle(situation.options)
    }))
  };
}

function buildSequenceActivity(template) {
  const chosenSequence = Array.isArray(template.items) && template.items.length > 0
    ? sample(template.items, 1)[0]
    : template;
  const rawSteps = chosenSequence.steps || template.steps || [];
  const steps = rawSteps.map((step, index) => ({
    id: `step-${index + 1}`,
    label: step
  }));

  return {
    ...template,
    prompt: chosenSequence.title
      ? `${template.prompt} ${chosenSequence.title}`
      : template.prompt,
    steps: rawSteps,
    selectedCaseTitle: chosenSequence.title || "",
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

function buildClickTrainerActivity(template) {
  return {
    ...template,
    rounds: sample(template.rounds, template.count).map((round) => ({
      ...round,
      target: { ...round.target },
      options: shuffle(round.options).map((option) => ({ ...option }))
    }))
  };
}

function buildTraceContourActivity(template) {
  return {
    ...template,
    checkpoints: template.checkpoints.map((point) => ({ ...point }))
  };
}

function buildKeyTrainerActivity(template) {
  return {
    ...template,
    rounds: template.rounds
      .slice(0, template.count ?? template.rounds.length)
      .map((round) => ({
        ...round,
        acceptedKeys: [...(round.acceptedKeys || [round.targetKey])]
      }))
  };
}

function buildEmbeddedToolActivity(template) {
  return {
    ...template,
    steps: Array.isArray(template.steps) ? [...template.steps] : [],
    checklist: Array.isArray(template.checklist) ? [...template.checklist] : []
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

function guessImageAlt(item) {
  if (!item || typeof item !== "object") {
    return "";
  }

  return item.imageAlt || item.label || item.text || item.title || item.value || "";
}

function enrichAssetRefs(value) {
  if (Array.isArray(value)) {
    return value.map((item) => enrichAssetRefs(item));
  }

  if (!value || typeof value !== "object") {
    return value;
  }

  const nextValue = Object.fromEntries(
    Object.entries(value).map(([key, entry]) => [key, enrichAssetRefs(entry)])
  );

  if (nextValue.assetKey && !nextValue.image && assetManifest[nextValue.assetKey]) {
    nextValue.image = assetManifest[nextValue.assetKey];
  }

  if (nextValue.image && !nextValue.imageAlt) {
    nextValue.imageAlt = guessImageAlt(nextValue);
  }

  return nextValue;
}

function cloneActivities(activities, activityOrder = null, optionalActivities = []) {
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
    "table-read": () => (activities["table-read"] ? buildTableReadActivity(activities["table-read"]) : null),
    "click-trainer": () => (activities["click-trainer"] ? buildClickTrainerActivity(activities["click-trainer"]) : null),
    "trace-contour": () => (activities["trace-contour"] ? buildTraceContourActivity(activities["trace-contour"]) : null),
    "key-trainer": () => (activities["key-trainer"] ? buildKeyTrainerActivity(activities["key-trainer"]) : null),
    "embedded-tool": () => (activities["embedded-tool"] ? buildEmbeddedToolActivity(activities["embedded-tool"]) : null)
  };

  const defaultOrder = ["draw", "classify", "sequence", "truefalse", "pick", "fill", "scenarios", "creative", "transfer", "table-read", "click-trainer", "trace-contour", "key-trainer", "embedded-tool"];
  const order = Array.isArray(activityOrder) && activityOrder.length > 0 ? activityOrder : defaultOrder;

  const optionalSet = new Set(Array.isArray(optionalActivities) ? optionalActivities : []);
  let requiredCounter = 0;

  return order
    .map((key) => builders[key]?.())
    .filter(Boolean)
    .map((activity) => {
      const isOptional = optionalSet.has(activity.type);
      if (!isOptional) requiredCounter += 1;
      return enrichAssetRefs({
        ...activity,
        badge: isOptional ? "Додатково" : `Завдання ${requiredCounter}`,
        optional: isOptional
      });
    });
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
    activities: cloneActivities(template.activities, template.activityOrder, template.optionalActivities),
    quiz: buildQuiz(template.quiz),
    reflection: {
      ...template.reflection,
      options: template.reflection.options.map((option) => ({ ...option }))
    }
  };
}
