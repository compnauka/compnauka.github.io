(function (global) {
    const strings = global.uiStrings || (typeof require === "function" ? require("./ui-strings.js") : null);

    function buildQuestionOptionsModel(question, selectedAnswerIndex) {
        const optionOrder = Array.isArray(question.optionOrder) && question.optionOrder.length === question.options.length
            ? question.optionOrder
            : question.options.map((_, index) => index);

        const options = optionOrder.map(optionIndex => ({
            text: question.options[optionIndex],
            optionIndex,
            isSelected: selectedAnswerIndex === optionIndex
        }));

        return {
            questionText: question.q,
            options,
            skipButtonText: selectedAnswerIndex === null ? strings.skip : strings.clearChoice
        };
    }

    function renderQuestion(dom, question, selectedAnswerIndex, helpers) {
        const model = buildQuestionOptionsModel(question, selectedAnswerIndex);

        dom.questionText.textContent = model.questionText;
        dom.optionsContainer.innerHTML = "";

        model.options.forEach(option => {
            const button = helpers.createElement("button", "answer-option w-full text-left", option.text);
            button.type = "button";
            button.dataset.index = String(option.optionIndex);
            button.setAttribute("aria-pressed", option.isSelected ? "true" : "false");

            if (option.isSelected) {
                button.classList.add("selected");
            }

            button.addEventListener("click", () => helpers.onSelect(option.optionIndex));
            dom.optionsContainer.appendChild(button);
        });

        dom.skipButton.textContent = model.skipButtonText;
        return model;
    }

    function syncSelectedAnswer(container, selectedIndex) {
        container.querySelectorAll(".answer-option").forEach(button => {
            const isSelected = Number(button.dataset.index) === selectedIndex;
            button.classList.toggle("selected", isSelected);
            button.setAttribute("aria-pressed", isSelected ? "true" : "false");
        });
    }

    const QuestionView = {
        buildQuestionOptionsModel,
        renderQuestion,
        syncSelectedAnswer
    };

    global.QuestionView = QuestionView;

    if (typeof module !== "undefined" && module.exports) {
        module.exports = QuestionView;
    }
})(typeof window !== "undefined" ? window : globalThis);
