const test = require("node:test");
const assert = require("node:assert/strict");

const QuestionFlow = require("../question-flow.js");
const uiStrings = require("../ui-strings.js");

test("getNextButtonView disables next button until an answer is selected", () => {
    const view = QuestionFlow.getNextButtonView([null, null, null], 0, uiStrings);

    assert.equal(view.disabled, true);
    assert.equal(view.label, uiStrings.next);
});

test("getNextButtonView switches label to finish when all questions are answered", () => {
    const view = QuestionFlow.getNextButtonView([0, 1, 2], 2, uiStrings);

    assert.equal(view.disabled, false);
    assert.equal(view.label, uiStrings.finish);
});

test("normalizeRestoredSession trims and pads user answers safely", () => {
    const restored = QuestionFlow.normalizeRestoredSession({
        currentGrade: "3",
        selectedQuestions: [{ id: "q1" }, { id: "q2" }, { id: "q3" }],
        currentQuestionIndex: 99,
        userAnswers: [1]
    }, { "3": [{}] });

    assert.deepEqual(restored, {
        currentGrade: "3",
        selectedQuestions: [{ id: "q1" }, { id: "q2" }, { id: "q3" }],
        currentQuestionIndex: 2,
        userAnswers: [1, null, null]
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
    const action = QuestionFlow.resolveNextAction([null, 1], 0);

    assert.deepEqual(action, {
        type: "blocked",
        targetIndex: 0,
        noticeKey: "answerRequiredNotice",
        messageType: "alert"
    });
});

test("resolveNextAction returns to first skipped question after final answered item", () => {
    const action = QuestionFlow.resolveNextAction([0, null, 2], 2);

    assert.deepEqual(action, {
        type: "question",
        targetIndex: 1,
        noticeKey: "completedLoopNotice",
        messageType: "info"
    });
});

test("buildReviewItems marks current, skipped, and answered states", () => {
    const items = QuestionFlow.buildReviewItems([0, null, 2], 1);

    assert.deepEqual(items, [
        { index: 0, label: "1", stateClassName: "review-index-answered" },
        { index: 1, label: "2", stateClassName: "review-index-current" },
        { index: 2, label: "3", stateClassName: "review-index-answered" }
    ]);
});
