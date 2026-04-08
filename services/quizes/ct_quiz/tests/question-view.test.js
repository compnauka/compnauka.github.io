const test = require("node:test");
const assert = require("node:assert/strict");

const QuestionView = require("../question-view.js");
const uiStrings = require("../ui-strings.js");

test("question options model marks selected option and clear-choice text", () => {
    const model = QuestionView.buildQuestionOptionsModel({
        q: "Обери правильний крок",
        options: ["A", "B", "C", "D"]
    }, 2);

    assert.equal(model.questionText, "Обери правильний крок");
    assert.equal(model.skipButtonText, uiStrings.clearChoice);
    assert.deepEqual(model.options, [
        { text: "A", optionIndex: 0, isSelected: false },
        { text: "B", optionIndex: 1, isSelected: false },
        { text: "C", optionIndex: 2, isSelected: true },
        { text: "D", optionIndex: 3, isSelected: false }
    ]);
});

test("question options model keeps skip text when nothing is selected", () => {
    const model = QuestionView.buildQuestionOptionsModel({
        q: "Що далі?",
        options: ["1", "2", "3", "4"]
    }, null);

    assert.equal(model.skipButtonText, uiStrings.skip);
    assert.equal(model.options.every(option => option.isSelected === false), true);
});

test("question options model uses precomputed option order", () => {
    const model = QuestionView.buildQuestionOptionsModel({
        q: "Що обрати?",
        options: ["A", "B", "C", "D"],
        optionOrder: [2, 0, 3, 1]
    }, 3);

    assert.deepEqual(model.options, [
        { text: "C", optionIndex: 2, isSelected: false },
        { text: "A", optionIndex: 0, isSelected: false },
        { text: "D", optionIndex: 3, isSelected: true },
        { text: "B", optionIndex: 1, isSelected: false }
    ]);
});

test("confidence options model marks selected confidence level", () => {
    const model = QuestionView.buildConfidenceOptionsModel("medium");

    assert.deepEqual(model, [
        {
            value: "low",
            label: uiStrings.confidenceLevels[0].label,
            description: uiStrings.confidenceLevels[0].description,
            isSelected: false
        },
        {
            value: "medium",
            label: uiStrings.confidenceLevels[1].label,
            description: uiStrings.confidenceLevels[1].description,
            isSelected: true
        },
        {
            value: "high",
            label: uiStrings.confidenceLevels[2].label,
            description: uiStrings.confidenceLevels[2].description,
            isSelected: false
        }
    ]);
});
