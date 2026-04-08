const test = require("node:test");
const assert = require("node:assert/strict");

const ResultShare = require("../result-share.js");
const ResultsLogic = require("../results-logic.js");
const ResultsView = require("../results-view.js");
const uiStrings = require("../ui-strings.js");

test("shared result payload preserves diagnostic profile through decode and summary rendering", () => {
    const payload = ResultShare.buildSharePayload(
        { currentGrade: "2", score: 6 },
        {
            stats: [
                { concept: "Алгоритми", total: 2, correct: 2 },
                { concept: "Логіка", total: 2, correct: 1 }
            ]
        },
        10,
        6,
        {
            strongKnowledge: 3,
            emergingKnowledge: 1,
            tentativeKnowledge: 1,
            falseConfidence: 2,
            uncertainError: 1,
            explicitUnknown: 0,
            skipped: 2,
            tooFastAttempts: 1
        }
    );

    const encoded = ResultShare.encodeSharePayload(payload);
    const decoded = ResultShare.decodeSharePayload(encoded);
    const summaryText = ResultsLogic.summarizeDiagnosticProfile(decoded.diagnosticProfile);
    const model = ResultsView.buildDiagnosticSummaryModel({
        ...decoded.diagnosticProfile,
        summaryText
    });

    assert.equal(decoded.score, 6);
    assert.equal(decoded.total, 10);
    assert.equal(decoded.diagnosticProfile.strongKnowledge, 3);
    assert.equal(decoded.diagnosticProfile.falseConfidence, 2);
    assert.equal(summaryText, uiStrings.diagnosticSummaryRisk);
    assert.equal(model.items[0].value, 3);
    assert.equal(model.items[3].value, 2);
    assert.equal(model.items[7].value, 1);
});

test("shared result payload with no diagnostic evidence stays sparse instead of inventing counts", () => {
    const encoded = ResultShare.encodeSharePayload({
        v: ResultShare.SHARE_VERSION,
        grade: "4",
        score: 2,
        total: 10,
        sharedAt: "2026-04-08T00:00:00.000Z",
        conceptSummary: { stats: [] },
        diagnosticProfile: {
            strongKnowledge: 0,
            emergingKnowledge: 0,
            tentativeKnowledge: 0,
            falseConfidence: 0,
            uncertainError: 0,
            explicitUnknown: 0,
            skipped: 0,
            tooFastAttempts: 0
        }
    });

    const decoded = ResultShare.decodeSharePayload(encoded);
    const summaryText = ResultsLogic.summarizeDiagnosticProfile(decoded.diagnosticProfile);

    assert.equal(decoded.diagnosticProfile.strongKnowledge, 0);
    assert.equal(decoded.diagnosticProfile.tooFastAttempts, 0);
    assert.equal(summaryText, uiStrings.diagnosticSummarySparse);
});
