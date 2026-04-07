const test = require("node:test");
const assert = require("node:assert/strict");

const ResultShare = require("../result-share.js");

test("buildSharePayload keeps only safe result summary fields", () => {
    const payload = ResultShare.buildSharePayload({
        currentGrade: "4",
        score: 7
    }, {
        stats: [
            { concept: "Алгоритми", total: 2, correct: 2 },
            { concept: "Декомпозиція", total: 3, correct: 1 }
        ]
    }, 10);

    assert.equal(payload.v, ResultShare.SHARE_VERSION);
    assert.equal(payload.grade, "4");
    assert.equal(payload.score, 7);
    assert.equal(payload.total, 10);
    assert.equal(Array.isArray(payload.conceptSummary.stats), true);
    assert.deepEqual(payload.conceptSummary.mastered, ["Алгоритми"]);
    assert.deepEqual(payload.conceptSummary.needsPractice, ["Декомпозиція"]);
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

test("encode/decode roundtrip preserves payload", () => {
    const payload = {
        v: ResultShare.SHARE_VERSION,
        grade: "3",
        score: 5,
        total: 10,
        sharedAt: "2026-04-07T12:00:00.000Z",
        conceptSummary: {
            stats: [{ concept: "Патерни", total: 1, correct: 1 }]
        }
    };

    const encoded = ResultShare.encodeSharePayload(payload);
    const decoded = ResultShare.decodeSharePayload(encoded);

    assert.equal(decoded.v, ResultShare.SHARE_VERSION);
    assert.equal(decoded.grade, "3");
    assert.equal(decoded.score, 5);
    assert.equal(decoded.total, 10);
    assert.deepEqual(decoded.conceptSummary.stats, [{ concept: "Патерни", total: 1, correct: 1 }]);
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
