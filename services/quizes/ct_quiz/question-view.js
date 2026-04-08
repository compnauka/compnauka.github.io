(function (global) {
    const strings = global.uiStrings || (typeof require === "function" ? require("./ui-strings.js") : null);

    function getQuestionTextSizeClass(questionText) {
        const textLength = typeof questionText === "string" ? questionText.trim().length : 0;

        if (textLength >= 140) {
            return "question-text-xlong";
        }

        if (textLength >= 95) {
            return "question-text-long";
        }

        return "";
    }

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
            questionTextSizeClass: getQuestionTextSizeClass(question.q),
            options,
            skipButtonText: selectedAnswerIndex === null ? strings.skip : strings.clearChoice
        };
    }

    function buildConfidenceOptionsModel(selectedConfidence) {
        const confidenceLevels = Array.isArray(strings.confidenceLevels) ? strings.confidenceLevels : [];
        return confidenceLevels.map(level => ({
            value: level.value,
            label: level.label,
            description: level.description || "",
            isSelected: selectedConfidence === level.value
        }));
    }

    function renderQuestion(dom, question, selectedAnswerIndex, helpers) {
        const model = buildQuestionOptionsModel(question, selectedAnswerIndex);

        dom.questionText.textContent = model.questionText;
        dom.questionText.classList.remove("question-text-long", "question-text-xlong");

        if (model.questionTextSizeClass) {
            dom.questionText.classList.add(model.questionTextSizeClass);
        }

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

    function renderConfidenceOptions(container, selectedConfidence, helpers) {
        const model = buildConfidenceOptionsModel(selectedConfidence);
        container.innerHTML = "";

        model.forEach(option => {
            const button = helpers.createElement("button", "confidence-option");
            const title = helpers.createElement("span", "confidence-option-label", option.label);
            const description = helpers.createElement("span", "confidence-option-description", option.description);
            button.type = "button";
            button.dataset.value = option.value;
            button.setAttribute("aria-pressed", option.isSelected ? "true" : "false");
            button.setAttribute(
                "aria-label",
                option.description ? `${option.label}. ${option.description}` : option.label
            );

            if (option.isSelected) {
                button.classList.add("selected");
            }

            button.append(title, description);
            button.addEventListener("click", () => helpers.onSelect(option.value));
            container.appendChild(button);
        });

        return model;
    }

    function syncSelectedConfidence(container, selectedConfidence) {
        container.querySelectorAll(".confidence-option").forEach(button => {
            const isSelected = button.dataset.value === selectedConfidence;
            button.classList.toggle("selected", isSelected);
            button.setAttribute("aria-pressed", isSelected ? "true" : "false");
        });
    }

    const QuestionView = {
        buildQuestionOptionsModel,
        buildConfidenceOptionsModel,
        getQuestionTextSizeClass,
        renderQuestion,
        renderConfidenceOptions,
        syncSelectedAnswer,
        syncSelectedConfidence
    };

    global.QuestionView = QuestionView;

    if (typeof module !== "undefined" && module.exports) {
        module.exports = QuestionView;
    }
})(typeof window !== "undefined" ? window : globalThis);
