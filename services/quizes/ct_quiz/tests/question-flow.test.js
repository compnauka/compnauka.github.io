const test = require("node:test");
const assert = require("node:assert/strict");

const QuestionFlow = require("../question-flow.js");
const uiStrings = require("../ui-strings.js");

test("getNextButtonView disables next button until an answer is selected", () => {
    const view = QuestionFlow.getNextButtonView([null, null, null], [null, null, null], 0, uiStrings);

    assert.equal(view.disabled, true);
    assert.equal(view.label, uiStrings.next);
});

test("getNextButtonView switches label to finish when all questions are answered", () => {
    const view = QuestionFlow.getNextButtonView([0, 1, 2], ["low", "medium", "high"], 2, uiStrings);

    assert.equal(view.disabled, false);
    assert.equal(view.label, uiStrings.finish);
});

test("getNextButtonView stays disabled until confidence is selected", () => {
    const view = QuestionFlow.getNextButtonView([0, null, null], [null, null, null], 0, uiStrings);

    assert.equal(view.disabled, true);
    assert.equal(view.hasAnswer, true);
    assert.equal(view.hasConfidence, false);
});

test("getNextButtonView enables next button for explicit dont know response", () => {
    const view = QuestionFlow.getNextButtonView(
        [null, null, null],
        [null, null, null],
        0,
        uiStrings,
        ["dont_know", null, null]
    );

    assert.equal(view.disabled, false);
    assert.equal(view.isDontKnow, true);
});

test("normalizeRestoredSession trims and pads quiz arrays safely", () => {
    const restored = QuestionFlow.normalizeRestoredSession({
        currentGrade: "3",
        selectedQuestions: [{ id: "q1" }, { id: "q2" }, { id: "q3" }],
        currentQuestionIndex: 99,
        userAnswers: [1],
        userConfidence: ["high"],
        questionTimings: [{ responseTimeMs: 4200 }],
        responseIntent: ["dont_know"]
    }, { "3": [{}] });

    assert.deepEqual(restored, {
        currentGrade: "3",
        selectedQuestions: [{ id: "q1" }, { id: "q2" }, { id: "q3" }],
        currentQuestionIndex: 2,
        userAnswers: [1, null, null],
        userConfidence: ["high", null, null],
        questionTimings: [{ responseTimeMs: 4200 }, null, null],
        responseIntent: ["dont_know", null, null]
    });
});

test("normalizeRestoredSession returns null for unknown grade", () => {
    const restored = QuestionFlow.normalizeRestoredSession({
        currentGrade: "9",
        selectedQuestions: []
    }, { "3": [{}] });

    assert.equal(restored, null);
});

test("resolveRenderTarget returns first skipped question after the end of the quiz", () => {
    const action = QuestionFlow.resolveRenderTarget(3, [0, null, 2], 3);

    assert.deepEqual(action, {
        type: "question",
        targetIndex: 1,
        noticeKey: "endReviewNotice"
    });
});

test("resolveSkipAction clears current answer before navigating away", () => {
    const action = QuestionFlow.resolveSkipAction([0, null, null], 0);

    assert.deepEqual(action, {
        type: "clear-answer",
        targetIndex: 0,
        noticeKey: "clearedNotice"
    });
});

test("resolveSkipAction clears explicit dont know before navigating away", () => {
    const action = QuestionFlow.resolveSkipAction([null, null, null], 0, ["dont_know", null, null]);

    assert.deepEqual(action, {
        type: "clear-answer",
        targetIndex: 0,
        noticeKey: "clearedNotice"
    });
});

test("resolveSkipAction jumps to first remaining skipped question from the end", () => {
    const action = QuestionFlow.resolveSkipAction([0, null, null], 2);

    assert.deepEqual(action, {
        type: "question",
        targetIndex: 1,
        noticeKey: "finalSkippedNotice"
    });
});

test("resolveSkipAction opens results when last unanswered question is skipped", () => {
    const action = QuestionFlow.resolveSkipAction([0, 1, null], 2);

    assert.deepEqual(action, {
        type: "results",
        targetIndex: null,
        noticeKey: "skipToResultsNotice"
    });
});

test("resolveNextAction blocks when the current question has no answer", () => {
    const action = QuestionFlow.resolveNextAction([null, 1], [null, "high"], 0);

    assert.deepEqual(action, {
        type: "blocked",
        targetIndex: 0,
        noticeKey: "answerRequiredNotice",
        messageType: "alert"
    });
});

test("resolveNextAction blocks when confidence is missing", () => {
    const action = QuestionFlow.resolveNextAction([0, 1], [null, "high"], 0);

    assert.deepEqual(action, {
        type: "blocked",
        targetIndex: 0,
        noticeKey: "confidenceRequiredNotice",
        messageType: "alert"
    });
});

test("resolveNextAction can finish immediately when dont know closes the final gap", () => {
    const action = QuestionFlow.resolveNextAction([null, 1], [null, "high"], 0, ["dont_know", null]);

    assert.deepEqual(action, {
        type: "results",
        targetIndex: null,
        noticeKey: null,
        messageType: "info"
    });
});

test("resolveNextAction returns to first skipped question after final answered item", () => {
    const action = QuestionFlow.resolveNextAction([0, null, 2], ["low", null, "high"], 2);

    assert.deepEqual(action, {
        type: "question",
        targetIndex: 1,
        noticeKey: "completedLoopNotice",
        messageType: "info"
    });
});

test("buildReviewItems marks current skipped and answered states", () => {
    const items = QuestionFlow.buildReviewItems([0, null, 2], 1);

    assert.deepEqual(items, [
        { index: 0, label: "1", stateClassName: "review-index-answered" },
        { index: 1, label: "2", stateClassName: "review-index-current" },
        { index: 2, label: "3", stateClassName: "review-index-answered" }
    ]);
});

test("buildReviewItems treats dont know as completed in review", () => {
    const items = QuestionFlow.buildReviewItems([0, null, null], 2, [null, "dont_know", null]);

    assert.deepEqual(items, [
        { index: 0, label: "1", stateClassName: "review-index-answered" },
        { index: 1, label: "2", stateClassName: "review-index-answered" },
        { index: 2, label: "3", stateClassName: "review-index-current" }
    ]);
});
