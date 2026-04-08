const test = require("node:test");
const assert = require("node:assert/strict");

const ResultShare = require("../result-share.js");

test("buildSharePayload keeps only safe result summary fields", () => {
    const payload = ResultShare.buildSharePayload({
        currentGrade: "4",
        score: 7
    }, {
        stats: [
            {
                concept: "Алгоритми",
                total: 2,
                correct: 2,
                conceptRoot: "alhorytmy",
                conceptKeys: ["alhorytmy-poslidovnist", "alhorytmy-umova"]
            },
            {
                concept: "Декомпозиція",
                total: 3,
                correct: 1,
                conceptRoot: "dekompozytsiia",
                conceptKeys: ["dekompozytsiia-podilst-zadachi"]
            }
        ]
    }, 10, undefined, {
        strongKnowledge: 3,
        emergingKnowledge: 2,
        tentativeKnowledge: 1,
        falseConfidence: 1,
        uncertainError: 2,
        explicitUnknown: 1,
        skipped: 1,
        tooFastAttempts: 4
    });

    assert.equal(payload.v, ResultShare.SHARE_VERSION);
    assert.equal(payload.grade, "4");
    assert.equal(payload.score, 7);
    assert.equal(payload.total, 10);
    assert.equal(Array.isArray(payload.conceptSummary.stats), true);
    assert.deepEqual(payload.conceptSummary.mastered, ["Алгоритми"]);
    assert.deepEqual(payload.conceptSummary.needsPractice, ["Декомпозиція"]);
    assert.equal(payload.conceptSummary.stats[0].conceptRoot, "alhorytmy");
    assert.deepEqual(payload.conceptSummary.stats[0].conceptKeys, ["alhorytmy-poslidovnist", "alhorytmy-umova"]);
    assert.equal(payload.diagnosticProfile.strongKnowledge, 3);
    assert.equal(payload.diagnosticProfile.explicitUnknown, 1);
    assert.equal(payload.diagnosticProfile.tooFastAttempts, 4);
});

test("buildSharePayload uses score override when state score is missing", () => {
    const payload = ResultShare.buildSharePayload({
        currentGrade: "4"
    }, {
        stats: [
            { concept: "Алгоритми", total: 2, correct: 2 }
        ]
    }, 10, 10);

    assert.equal(payload.score, 10);
    assert.equal(payload.total, 10);
});

test("encode decode roundtrip preserves payload", () => {
    const payload = {
        v: ResultShare.SHARE_VERSION,
        grade: "3",
        score: 5,
        total: 10,
        sharedAt: "2026-04-07T12:00:00.000Z",
        conceptSummary: {
            stats: [{
                concept: "Патерни",
                total: 1,
                correct: 1,
                conceptRoot: "rozpiznavannia-zakonomirnostei",
                conceptKeys: ["rozpiznavannia-zakonomirnostei-pravylo"]
            }]
        },
        diagnosticProfile: {
            strongKnowledge: 1,
            emergingKnowledge: 2,
            tentativeKnowledge: 0,
            falseConfidence: 1,
            uncertainError: 0,
            explicitUnknown: 1,
            skipped: 1,
            tooFastAttempts: 2
        }
    };

    const encoded = ResultShare.encodeSharePayload(payload);
    const decoded = ResultShare.decodeSharePayload(encoded);

    assert.equal(decoded.v, ResultShare.SHARE_VERSION);
    assert.equal(decoded.grade, "3");
    assert.equal(decoded.score, 5);
    assert.equal(decoded.total, 10);
    assert.deepEqual(decoded.conceptSummary.stats, [{
        concept: "Патерни",
        total: 1,
        correct: 1,
        conceptRoot: "rozpiznavannia-zakonomirnostei",
        conceptKeys: ["rozpiznavannia-zakonomirnostei-pravylo"]
    }]);
    assert.equal(decoded.diagnosticProfile.emergingKnowledge, 2);
    assert.equal(decoded.diagnosticProfile.explicitUnknown, 1);
    assert.equal(decoded.diagnosticProfile.tooFastAttempts, 2);
});

test("getEncodedPayloadFromHash extracts payload only for share hash", () => {
    assert.equal(ResultShare.getEncodedPayloadFromHash("#other=123"), null);
    assert.equal(ResultShare.getEncodedPayloadFromHash("#r=abc123"), "abc123");
});

test("decodeSharePayload returns null for invalid payload", () => {
    assert.equal(ResultShare.decodeSharePayload("bad-json"), null);
    assert.equal(
        ResultShare.decodeSharePayload(encodeURIComponent(JSON.stringify({ v: 999 }))),
        null
    );
});

test("buildShareUrl falls back to pathname for local file origins", () => {
    const url = ResultShare.buildShareUrl({
        origin: "null",
        pathname: "/services/quizes/ct_quiz/index.html"
    }, {
        v: 1,
        grade: "2",
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

    assert.match(url, /^\/services\/quizes\/ct_quiz\/index\.html#r=/u);
    assert.doesNotMatch(url, /^null/u);
});
