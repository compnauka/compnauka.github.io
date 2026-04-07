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
        mastered: ["Алгоритми", "Патерни"],
        needsPractice: [],
        observed: []
    });

    assert.equal(summary.variant, appConfig.adultSummaryVariant.strong);
    assert.equal(summary.text, uiStrings.adultSummaryStrong);
    assert.match(summary.strengthText, /Алгоритми, Патерни/u);
    assert.match(summary.focusText, /немає окремої зони ризику/u);
});

test("adult summary becomes needs support when nothing is mastered", () => {
    const summary = ResultsLogic.buildAdultSummary({
        mastered: [],
        needsPractice: ["Декомпозиція"],
        observed: []
    });

    assert.equal(summary.variant, appConfig.adultSummaryVariant.needsSupport);
    assert.equal(summary.text, uiStrings.adultSummaryNeedsSupport);
    assert.match(summary.strengthText, /немає концепції/u);
    assert.match(summary.focusText, /Декомпозиція/u);
});

test("adult summary becomes preliminary when all visible concepts have only one signal", () => {
    const summary = ResultsLogic.buildAdultSummary({
        mastered: [],
        needsPractice: [],
        observed: ["Алгоритми", "Логічне мислення"]
    });

    assert.equal(summary.variant, appConfig.adultSummaryVariant.preliminary);
    assert.equal(summary.text, uiStrings.adultSummaryPreliminary);
    assert.match(summary.observedText, /Алгоритми, Логічне мислення/u);
});

test("practice hint reflects whether the concept was fully missed partially solved or still preliminary", () => {
    assert.match(
        ResultsLogic.getPracticeHint({ correct: 0, total: 1, hasStrongEvidence: false }),
        /один сигнал/u
    );
    assert.match(
        ResultsLogic.getPracticeHint({ correct: 0, total: 1, hasStrongEvidence: true }),
        /варто повернутися/u
    );
    assert.match(
        ResultsLogic.getPracticeHint({ correct: 1, total: 2, hasStrongEvidence: true }),
        /ще корисно.*потренуватися/u
    );
    assert.equal(ResultsLogic.getPracticeHint({ correct: 2, total: 2, hasStrongEvidence: true }), "");
});
