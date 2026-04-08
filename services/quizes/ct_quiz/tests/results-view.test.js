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
            {
                concept: "\u0410\u043b\u0433\u043e\u0440\u0438\u0442\u043c\u0438",
                correct: 2,
                total: 2,
                hasStrongEvidence: true,
                conceptKeys: ["alhorytmy-poslidovnist", "alhorytmy-umova", "alhorytmy-umova"]
            },
            { concept: "\u041f\u0430\u0442\u0435\u0440\u043d\u0438", correct: 1, total: 2, hasStrongEvidence: true },
            { concept: "\u0414\u0435\u043a\u043e\u043c\u043f\u043e\u0437\u0438\u0446\u0456\u044f", correct: 0, total: 1, hasStrongEvidence: false }
        ]
    });

    assert.equal(model.isEmpty, false);
    assert.equal(model.items[0].statusLabel, uiStrings.conceptStatusStrong);
    assert.equal(model.items[0].practiceHint, "");
    assert.equal(model.items[0].subtopicsText.split(", ").length, 2);
    assert.ok(model.items[0].subtopicsText.includes("\u043f\u043e\u0441\u043b\u0456\u0434\u043e\u0432\u043d\u0456\u0441\u0442\u044c"));
    assert.equal(model.items[0].evidenceText, uiStrings.conceptEvidenceStrong);
    assert.equal(model.items[1].statusLabel, uiStrings.conceptStatusPartial);
    assert.equal(model.items[1].subtopicsText, "");
    assert.notEqual(model.items[1].practiceHint, "");
    assert.equal(model.items[2].statusLabel, uiStrings.conceptStatusPreliminary);
    assert.notEqual(model.items[2].practiceHint, "");
    assert.equal(model.items[2].evidenceText, uiStrings.conceptEvidencePreliminary);
});

test("diagnostic summary model exposes compact result buckets including explicit unknown", () => {
    const model = ResultsView.buildDiagnosticSummaryModel({
        strongKnowledge: 3,
        emergingKnowledge: 2,
        tentativeKnowledge: 1,
        falseConfidence: 1,
        uncertainError: 2,
        explicitUnknown: 1,
        skipped: 1,
        tooFastAttempts: 4,
        summaryText: uiStrings.diagnosticSummaryRisk
    });

    assert.equal(model.summaryText, uiStrings.diagnosticSummaryRisk);
    assert.equal(model.items[0].label, uiStrings.diagnosticStrongKnowledge);
    assert.equal(model.items[2].label, uiStrings.diagnosticTentativeKnowledge);
    assert.equal(model.items[5].label, uiStrings.diagnosticExplicitUnknown);
    assert.equal(model.items[7].value, 4);
});

test("result item model describes false-confidence answer with confidence and timing", () => {
    const question = {
        q: "\u0429\u043e \u0440\u043e\u0431\u0438\u0442\u0438 \u0434\u0430\u043b\u0456?",
        options: ["\u041a\u0440\u043e\u043a 1", "\u041a\u0440\u043e\u043a 2", "\u041a\u0440\u043e\u043a 3", "\u041a\u0440\u043e\u043a 4"],
        correct: 2,
        explanation: "\u0422\u043e\u043c\u0443 \u0449\u043e \u043f\u043e\u0440\u044f\u0434\u043e\u043a \u0432\u0430\u0436\u043b\u0438\u0432\u0438\u0439.",
        concept: "\u0410\u043b\u0433\u043e\u0440\u0438\u0442\u043c\u0438"
    };

    const model = ResultsView.buildResultItemModel(question, 1, 0, {
        confidence: "high",
        timing: { responseTimeMs: 5200, tooFastAttempts: 1 }
    });

    assert.equal(model.title, "1. \u0429\u043e \u0440\u043e\u0431\u0438\u0442\u0438 \u0434\u0430\u043b\u0456?");
    assert.equal(model.statusText, uiStrings.diagnosticFalseConfidence);
    assert.equal(model.userAnswerText, "\u041a\u0440\u043e\u043a 2");
    assert.equal(model.correctAnswerText, "\u041a\u0440\u043e\u043a 3");
    assert.equal(model.explanationText, question.explanation);
    assert.equal(model.confidenceText, uiStrings.confidenceLevelHigh);
    assert.match(model.responseTimeText, /5\.2/u);
    assert.equal(model.tooFastHint, uiStrings.diagnosticTooFastHint);
});

test("result item model marks low-confidence correct answer as tentative knowledge", () => {
    const question = {
        q: "\u042f\u043a\u0438\u0439 \u043a\u0440\u043e\u043a \u043f\u0440\u0430\u0432\u0438\u043b\u044c\u043d\u0438\u0439?",
        options: ["\u041a\u0440\u043e\u043a 1", "\u041a\u0440\u043e\u043a 2", "\u041a\u0440\u043e\u043a 3", "\u041a\u0440\u043e\u043a 4"],
        correct: 1,
        explanation: "\u041a\u0440\u043e\u043a 2 \u043f\u0440\u0430\u0432\u0438\u043b\u044c\u043d\u0438\u0439.",
        concept: "\u0410\u043b\u0433\u043e\u0440\u0438\u0442\u043c\u0438"
    };

    const model = ResultsView.buildResultItemModel(question, 1, 1, {
        confidence: "low",
        timing: { responseTimeMs: 6100, tooFastAttempts: 0 }
    });

    assert.equal(model.statusText, uiStrings.diagnosticTentativeKnowledge);
    assert.equal(model.showCorrectAnswer, false);
    assert.equal(model.explanationText, "");
    assert.equal(model.confidenceText, uiStrings.confidenceLevelLow);
});

test("result item model marks skipped answers without explanation noise", () => {
    const question = {
        q: "\u041e\u0431\u0435\u0440\u0438 \u043e\u0437\u043d\u0430\u043a\u0443",
        options: ["A", "B", "C", "D"],
        correct: 0,
        explanation: "\u041f\u0440\u0430\u0432\u0438\u043b\u044c\u043d\u0430 \u043e\u0437\u043d\u0430\u043a\u0430 A.",
        concept: "\u0410\u0431\u0441\u0442\u0440\u0430\u0433\u0443\u0432\u0430\u043d\u043d\u044f"
    };

    const model = ResultsView.buildResultItemModel(question, null, 2, {
        confidence: null,
        timing: null
    });

    assert.equal(model.title, "3. \u041e\u0431\u0435\u0440\u0438 \u043e\u0437\u043d\u0430\u043a\u0443");
    assert.equal(model.statusText, uiStrings.diagnosticSkipped);
    assert.equal(model.userAnswerText, "");
    assert.equal(model.cardClassName, "border-slate-200 bg-slate-50");
    assert.equal(model.showCorrectAnswer, true);
});

test("result item model hides confidence for explicit dont know", () => {
    const question = {
        q: "\u042f\u043a\u0438\u0439 \u0441\u043f\u043e\u0441\u0456\u0431 \u043a\u0440\u0430\u0449\u0438\u0439?",
        options: ["A", "B", "C", "D"],
        correct: 1,
        explanation: "B \u043a\u0440\u0430\u0449\u0435, \u0431\u043e \u043c\u0430\u0454 \u043c\u0435\u043d\u0448\u0435 \u0437\u0430\u0439\u0432\u0438\u0445 \u043a\u0440\u043e\u043a\u0456\u0432.",
        concept: "\u0415\u0444\u0435\u043a\u0442\u0438\u0432\u043d\u0456\u0441\u0442\u044c"
    };

    const model = ResultsView.buildResultItemModel(question, null, 0, {
        confidence: null,
        timing: { responseTimeMs: 6400, tooFastAttempts: 0 },
        intent: "dont_know"
    });

    assert.equal(model.statusText, uiStrings.diagnosticExplicitUnknown);
    assert.equal(model.showConfidence, false);
    assert.equal(model.confidenceText, "");
    assert.equal(model.showCorrectAnswer, true);
});
