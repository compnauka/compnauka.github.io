const test = require("node:test");
const assert = require("node:assert/strict");

const appConfig = require("../app-config.js");
const QuizCore = require("../quiz-core.js");
const { questionBank } = require("../questions.js");

function createDeterministicRng() {
    let seed = 42;
    return function rng() {
        seed = (seed * 1664525 + 1013904223) % 4294967296;
        return seed / 4294967296;
    };
}

test("question bank passes structural validation", () => {
    const errors = QuizCore.validateQuestionBank(questionBank, appConfig.questionsPerQuizByGrade);
    assert.deepEqual(errors, []);
});

test("quiz selection returns requested number of questions without duplicates", () => {
    const questionLimit = appConfig.getQuestionsPerQuizForGrade("4");
    const selected = QuizCore.selectQuestionsForGrade(questionBank, "4", questionLimit, createDeterministicRng());
    assert.equal(selected.length, questionLimit);

    const ids = new Set(selected.map(question => question.id));
    assert.equal(ids.size, selected.length);

    selected.forEach(question => {
        assert.equal(Array.isArray(question.optionOrder), true);
        assert.equal(question.optionOrder.length, question.options.length);
        assert.deepEqual([...question.optionOrder].sort((a, b) => a - b), [0, 1, 2, 3]);
    });
});

test("quiz selection covers several concept buckets", () => {
    const questionLimit = appConfig.getQuestionsPerQuizForGrade("3");
    const selected = QuizCore.selectQuestionsForGrade(questionBank, "3", questionLimit, createDeterministicRng());
    const concepts = new Set(selected.map(question => QuizCore.normalizeConcept(question.concept)));
    assert.ok(concepts.size >= Math.min(questionLimit, 6));
});

test("quiz selection always includes required concept roots for each grade", () => {
    Object.keys(questionBank).forEach(grade => {
        const selected = QuizCore.selectQuestionsForGrade(
            questionBank,
            grade,
            appConfig.getQuestionsPerQuizForGrade(grade),
            createDeterministicRng()
        );
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

test("concept summary separates mastered roots from roots needing practice", () => {
    const selected = [
        { concept: "Алгоритмізація", conceptKey: "alhorytmy-poslidovnist", conceptLabel: "Алгоритми", correct: 0 },
        { concept: "Алгоритмізація", conceptKey: "alhorytmy-umova", conceptLabel: "Алгоритми", correct: 1 },
        { concept: "Декомпозиція", conceptKey: "dekompozytsiia", conceptLabel: "Декомпозиція", correct: 2 },
        { concept: "Декомпозиція", conceptKey: "dekompozytsiia", conceptLabel: "Декомпозиція", correct: 2 }
    ];
    const answers = [0, 3, 2, 2];
    const summary = QuizCore.buildConceptSummary(selected, answers);

    assert.deepEqual(summary.mastered, ["Декомпозиція"]);
    assert.deepEqual(summary.needsPractice, ["Алгоритми"]);
    assert.deepEqual(summary.observed, []);
});

test("concept summary keeps one-question roots as preliminary signals", () => {
    const selected = [
        { concept: "Налагодження", conceptKey: "nalahodzhennia-plan", conceptLabel: "Налагодження", correct: 0 }
    ];
    const answers = [0];
    const summary = QuizCore.buildConceptSummary(selected, answers);

    assert.deepEqual(summary.mastered, []);
    assert.deepEqual(summary.needsPractice, []);
    assert.deepEqual(summary.observed, ["Налагодження"]);
    assert.equal(summary.stats[0].hasStrongEvidence, false);
    assert.equal(summary.stats[0].signal, "preliminary");
});

test("concept summary merges subtype keys into one visible root card", () => {
    const selected = [
        { concept: "Алгоритми", conceptKey: "alhorytmy-poslidovnist", conceptLabel: "Алгоритми", correct: 0 },
        { concept: "Алгоритми", conceptKey: "alhorytmy-umova", conceptLabel: "Алгоритми", correct: 1 },
        { concept: "Алгоритми", conceptKey: "alhorytmy-tsykl", conceptLabel: "Алгоритми", correct: 2 }
    ];
    const answers = [0, 1, 2];
    const summary = QuizCore.buildConceptSummary(selected, answers);

    assert.deepEqual(summary.all, ["Алгоритми"]);
    assert.equal(summary.stats.length, 1);
    assert.equal(summary.stats[0].conceptRoot, "alhorytmy");
    assert.deepEqual(summary.stats[0].conceptKeys.sort(), ["alhorytmy-poslidovnist", "alhorytmy-tsykl", "alhorytmy-umova"]);
    assert.equal(summary.stats[0].total, 3);
    assert.equal(summary.stats[0].correct, 3);
});
