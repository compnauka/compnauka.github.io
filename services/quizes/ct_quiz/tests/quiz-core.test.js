const test = require("node:test");
const assert = require("node:assert/strict");

const appConfig = require("../app-config.js");
const QuizCore = require("../quiz-core.js");
const { questionBank } = require("../questions.js");

const NUM_QUESTIONS = appConfig.questionsPerQuiz;

function createDeterministicRng() {
    let seed = 42;
    return function rng() {
        seed = (seed * 1664525 + 1013904223) % 4294967296;
        return seed / 4294967296;
    };
}

test("question bank passes structural validation", () => {
    const errors = QuizCore.validateQuestionBank(questionBank, NUM_QUESTIONS);
    assert.deepEqual(errors, []);
});

test("quiz selection returns requested number of questions without duplicates", () => {
    const selected = QuizCore.selectQuestionsForGrade(questionBank, "4", NUM_QUESTIONS, createDeterministicRng());
    assert.equal(selected.length, NUM_QUESTIONS);

    const ids = new Set(selected.map(question => question.id));
    assert.equal(ids.size, selected.length);

    selected.forEach(question => {
        assert.equal(Array.isArray(question.optionOrder), true);
        assert.equal(question.optionOrder.length, question.options.length);
        assert.deepEqual([...question.optionOrder].sort((a, b) => a - b), [0, 1, 2, 3]);
    });
});

test("quiz selection covers several concept buckets", () => {
    const selected = QuizCore.selectQuestionsForGrade(questionBank, "3", NUM_QUESTIONS, createDeterministicRng());
    const concepts = new Set(selected.map(question => QuizCore.normalizeConcept(question.concept)));
    assert.ok(concepts.size >= Math.min(NUM_QUESTIONS, 6));
});

test("quiz selection always includes required concept roots for each grade", () => {
    Object.keys(questionBank).forEach(grade => {
        const selected = QuizCore.selectQuestionsForGrade(questionBank, grade, NUM_QUESTIONS, createDeterministicRng());
        const selectedRoots = new Set(selected.map(question => QuizCore.getConceptRoot(question)));
        const requiredRoots = appConfig.requiredConceptRootsByGrade[grade];

        requiredRoots.forEach(root => {
            assert.equal(
                selectedRoots.has(root),
                true,
                `grade ${grade} selection should include required root ${root}`
            );
        });
    });
});

test("score quiz counts only exact matches", () => {
    const selected = questionBank["2"].slice(0, 3);
    const answers = [selected[0].correct, null, 0];
    assert.equal(QuizCore.scoreQuiz(selected, answers), selected[2].correct === 0 ? 2 : 1);
});

test("concept summary separates mastered concepts from concepts needing practice", () => {
    const selected = [
        { concept: "Алгоритмізація", conceptKey: "alhorytmy-poslidovnist", conceptLabel: "Алгоритми", correct: 0 },
        { concept: "Алгоритмізація", conceptKey: "alhorytmy-poslidovnist", conceptLabel: "Алгоритми", correct: 1 },
        { concept: "Декомпозиція", conceptKey: "dekompozytsiia", conceptLabel: "Декомпозиція", correct: 2 },
        { concept: "Декомпозиція", conceptKey: "dekompozytsiia", conceptLabel: "Декомпозиція", correct: 2 }
    ];
    const answers = [0, 3, 2, 2];
    const summary = QuizCore.buildConceptSummary(selected, answers);

    assert.deepEqual(summary.mastered, ["Декомпозиція"]);
    assert.deepEqual(summary.needsPractice, ["Алгоритми"]);
    assert.deepEqual(summary.observed, []);
});

test("concept summary keeps one-question concepts as preliminary signals", () => {
    const selected = [
        { concept: "Налагодження", conceptKey: "nalahodzhennia", conceptLabel: "Налагодження", correct: 0 }
    ];
    const answers = [0];
    const summary = QuizCore.buildConceptSummary(selected, answers);

    assert.deepEqual(summary.mastered, []);
    assert.deepEqual(summary.needsPractice, []);
    assert.deepEqual(summary.observed, ["Налагодження"]);
    assert.equal(summary.stats[0].hasStrongEvidence, false);
    assert.equal(summary.stats[0].signal, "preliminary");
});

test("concept summary deduplicates repeated visible labels", () => {
    const selected = [
        { concept: "Алгоритми", conceptKey: "alhorytmy-poslidovnist", conceptLabel: "Алгоритми", correct: 0 },
        { concept: "Алгоритми", conceptKey: "alhorytmy-umova", conceptLabel: "Алгоритми", correct: 1 }
    ];
    const answers = [0, 0];
    const summary = QuizCore.buildConceptSummary(selected, answers);

    assert.deepEqual(summary.all, ["Алгоритми"]);
    assert.deepEqual(summary.mastered, []);
    assert.deepEqual(summary.needsPractice, []);
    assert.deepEqual(summary.observed, ["Алгоритми"]);
});
