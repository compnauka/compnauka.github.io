const test = require("node:test");
const assert = require("node:assert/strict");

const ResultsView = require("../results-view.js");
const uiStrings = require("../ui-strings.js");

test("concept analytics model returns empty state when there are no stats", () => {
    const model = ResultsView.buildConceptAnalyticsModel({ stats: [] });

    assert.equal(model.isEmpty, true);
    assert.equal(model.emptyText, uiStrings.resultConceptEmpty);
    assert.deepEqual(model.items, []);
});

test("concept analytics model includes status evidence and practice hint", () => {
    const model = ResultsView.buildConceptAnalyticsModel({
        stats: [
            { concept: "Алгоритми", correct: 2, total: 2, hasStrongEvidence: true },
            { concept: "Патерни", correct: 1, total: 2, hasStrongEvidence: true },
            { concept: "Декомпозиція", correct: 0, total: 1, hasStrongEvidence: false }
        ]
    });

    assert.equal(model.isEmpty, false);
    assert.equal(model.items[0].statusLabel, uiStrings.conceptStatusStrong);
    assert.equal(model.items[0].practiceHint, "");
    assert.equal(model.items[0].evidenceText, uiStrings.conceptEvidenceStrong);
    assert.equal(model.items[1].statusLabel, uiStrings.conceptStatusPartial);
    assert.match(model.items[1].practiceHint, /потренуватися/u);
    assert.equal(model.items[2].statusLabel, uiStrings.conceptStatusPreliminary);
    assert.match(model.items[2].practiceHint, /один сигнал/u);
    assert.equal(model.items[2].evidenceText, uiStrings.conceptEvidencePreliminary);
});

test("result item model describes incorrect answer with user answer text", () => {
    const question = {
        q: "Що робити далі?",
        options: ["Крок 1", "Крок 2", "Крок 3", "Крок 4"],
        correct: 2,
        explanation: "Тому що порядок важливий.",
        concept: "Алгоритми"
    };

    const model = ResultsView.buildResultItemModel(question, 1, 0);

    assert.equal(model.title, "1. Що робити далі?");
    assert.equal(model.statusText, uiStrings.statusIncorrect);
    assert.equal(model.userAnswerText, "Крок 2");
    assert.equal(model.correctAnswerText, "Крок 3");
    assert.equal(model.explanationText, question.explanation);
    assert.equal(model.conceptText, question.concept);
});

test("result item model marks skipped answers without user answer text", () => {
    const question = {
        q: "Обери ознаку",
        options: ["A", "B", "C", "D"],
        correct: 0,
        explanation: "Правильна ознака A.",
        concept: "Абстрагування"
    };

    const model = ResultsView.buildResultItemModel(question, null, 2);

    assert.equal(model.title, "3. Обери ознаку");
    assert.equal(model.statusText, uiStrings.statusSkipped);
    assert.equal(model.userAnswerText, "");
    assert.equal(model.cardClassName, "border-gray-300");
});
