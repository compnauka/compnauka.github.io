const test = require("node:test");
const assert = require("node:assert/strict");

const appConfig = require("../app-config.js");
const ResultsLogic = require("../results-logic.js");
const uiStrings = require("../ui-strings.js");

test("concept status marks fully correct concepts as strong", () => {
    const status = ResultsLogic.getConceptStatus({ correct: 2, total: 2, hasStrongEvidence: true });

    assert.equal(status.key, appConfig.conceptStatus.strong);
    assert.equal(status.label, uiStrings.conceptStatusStrong);
});

test("concept status marks partially correct concepts as partial", () => {
    const status = ResultsLogic.getConceptStatus({ correct: 1, total: 3, hasStrongEvidence: true });

    assert.equal(status.key, appConfig.conceptStatus.partial);
    assert.equal(status.label, uiStrings.conceptStatusPartial);
});

test("concept status marks fully missed concepts as needs practice", () => {
    const status = ResultsLogic.getConceptStatus({ correct: 0, total: 2, hasStrongEvidence: true });

    assert.equal(status.key, appConfig.conceptStatus.needsPractice);
    assert.equal(status.label, uiStrings.conceptStatusNeedsPractice);
});

test("concept status marks one-question evidence as preliminary", () => {
    const status = ResultsLogic.getConceptStatus({ correct: 1, total: 1, hasStrongEvidence: false });

    assert.equal(status.key, "preliminary");
    assert.equal(status.label, uiStrings.conceptStatusPreliminary);
});

test("adult summary becomes strong when there are no focus concepts", () => {
    const summary = ResultsLogic.buildAdultSummary({
        mastered: ["\u0410\u043b\u0433\u043e\u0440\u0438\u0442\u043c\u0438", "\u041f\u0430\u0442\u0435\u0440\u043d\u0438"],
        needsPractice: [],
        observed: []
    });

    assert.equal(summary.variant, appConfig.adultSummaryVariant.strong);
    assert.equal(summary.text, uiStrings.adultSummaryStrong);
    assert.ok(summary.strengthText.startsWith(uiStrings.adultSummaryStrengthLabel));
    assert.ok(summary.focusText.startsWith(uiStrings.adultSummaryFocusLabel));
    assert.ok(summary.focusText.includes("\u0437\u043e\u043d\u0438 \u0440\u0438\u0437\u0438\u043a\u0443"));
});

test("adult summary becomes needs support when nothing is mastered", () => {
    const summary = ResultsLogic.buildAdultSummary({
        mastered: [],
        needsPractice: ["\u0414\u0435\u043a\u043e\u043c\u043f\u043e\u0437\u0438\u0446\u0456\u044f"],
        observed: []
    });

    assert.equal(summary.variant, appConfig.adultSummaryVariant.needsSupport);
    assert.equal(summary.text, uiStrings.adultSummaryNeedsSupport);
    assert.ok(summary.strengthText.startsWith(uiStrings.adultSummaryStrengthLabel));
    assert.ok(summary.strengthText.includes("\u043d\u0435\u043c\u0430\u0454 \u043a\u043e\u043d\u0446\u0435\u043f\u0446\u0456\u0457"));
    assert.ok(summary.focusText.includes("\u0414\u0435\u043a\u043e\u043c\u043f\u043e\u0437\u0438\u0446\u0456\u044f"));
});

test("adult summary becomes preliminary when all visible concepts have only one signal", () => {
    const summary = ResultsLogic.buildAdultSummary({
        mastered: [],
        needsPractice: [],
        observed: ["\u0410\u043b\u0433\u043e\u0440\u0438\u0442\u043c\u0438", "\u041b\u043e\u0433\u0456\u0447\u043d\u0435 \u043c\u0438\u0441\u043b\u0435\u043d\u043d\u044f"]
    });

    assert.equal(summary.variant, appConfig.adultSummaryVariant.preliminary);
    assert.equal(summary.text, uiStrings.adultSummaryPreliminary);
    assert.ok(summary.observedText.includes("\u0410\u043b\u0433\u043e\u0440\u0438\u0442\u043c\u0438"));
});

test("practice hint reflects whether the concept was fully missed partially solved or still preliminary", () => {
    assert.notEqual(
        ResultsLogic.getPracticeHint({ correct: 0, total: 1, hasStrongEvidence: false }),
        ""
    );
    assert.ok(
        ResultsLogic.getPracticeHint({ correct: 0, total: 1, hasStrongEvidence: true }).includes("\u0432\u0430\u0440\u0442\u043e \u043f\u043e\u0432\u0435\u0440\u043d\u0443\u0442\u0438\u0441\u044f")
    );
    assert.ok(
        ResultsLogic.getPracticeHint({ correct: 1, total: 2, hasStrongEvidence: true }).includes("\u043f\u043e\u0442\u0440\u0435\u043d\u0443\u0432\u0430\u0442\u0438\u0441\u044f")
    );
    assert.equal(ResultsLogic.getPracticeHint({ correct: 2, total: 2, hasStrongEvidence: true }), "");
});

test("classifyAnswer marks correct high-confidence responses as strong knowledge", () => {
    const classification = ResultsLogic.classifyAnswer(
        { correct: 1 },
        1,
        "high",
        { responseTimeMs: 5300, tooFastAttempts: 0 }
    );

    assert.equal(classification.key, "strong-knowledge");
    assert.equal(classification.label, uiStrings.diagnosticStrongKnowledge);
});

test("classifyAnswer marks correct medium-confidence responses as emerging knowledge", () => {
    const classification = ResultsLogic.classifyAnswer(
        { correct: 1 },
        1,
        "medium",
        { responseTimeMs: 5300, tooFastAttempts: 0 }
    );

    assert.equal(classification.key, "emerging-knowledge");
    assert.equal(classification.label, uiStrings.diagnosticEmergingKnowledge);
});

test("classifyAnswer marks correct low-confidence responses as tentative knowledge", () => {
    const classification = ResultsLogic.classifyAnswer(
        { correct: 1 },
        1,
        "low",
        { responseTimeMs: 5300, tooFastAttempts: 0 }
    );

    assert.equal(classification.key, "tentative-knowledge");
    assert.equal(classification.label, uiStrings.diagnosticTentativeKnowledge);
});

test("classifyAnswer marks incorrect high-confidence responses as false confidence", () => {
    const classification = ResultsLogic.classifyAnswer(
        { correct: 1 },
        0,
        "high",
        { responseTimeMs: 5300, tooFastAttempts: 1 }
    );

    assert.equal(classification.key, "false-confidence");
    assert.equal(classification.label, uiStrings.diagnosticFalseConfidence);
});

test("classifyAnswer separates explicit dont know from skipped", () => {
    const classification = ResultsLogic.classifyAnswer(
        { correct: 1 },
        null,
        null,
        { responseTimeMs: 4800, tooFastAttempts: 0 },
        "dont_know"
    );

    assert.equal(classification.key, "explicit-unknown");
    assert.equal(classification.label, uiStrings.diagnosticExplicitUnknown);
    assert.equal(classification.confidence, null);
});

test("diagnostic profile aggregates knowledge confidence explicit unknown and too-fast attempts", () => {
    const profile = ResultsLogic.buildDiagnosticProfile(
        [{ correct: 0 }, { correct: 1 }, { correct: 2 }, { correct: 3 }, { correct: 0 }, { correct: 2 }],
        [0, 1, 0, null, 0, null],
        ["high", "medium", "high", null, "low", null],
        [
            { responseTimeMs: 5200, tooFastAttempts: 0 },
            { responseTimeMs: 5600, tooFastAttempts: 1 },
            { responseTimeMs: 5700, tooFastAttempts: 0 },
            null,
            { responseTimeMs: 5900, tooFastAttempts: 0 },
            { responseTimeMs: 6100, tooFastAttempts: 0 }
        ],
        [null, null, null, null, null, "dont_know"]
    );

    assert.equal(profile.strongKnowledge, 1);
    assert.equal(profile.emergingKnowledge, 1);
    assert.equal(profile.tentativeKnowledge, 1);
    assert.equal(profile.falseConfidence, 1);
    assert.equal(profile.skipped, 1);
    assert.equal(profile.explicitUnknown, 1);
    assert.equal(profile.tooFastAttempts, 1);
    assert.equal(profile.summaryText, uiStrings.diagnosticSummaryRisk);
});
