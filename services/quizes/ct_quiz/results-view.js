(function (global) {
    const strings = global.uiStrings || (typeof require === "function" ? require("./ui-strings.js") : null);
    const logic = global.ResultsLogic || (typeof require === "function" ? require("./results-logic.js") : null);

    function getDisplayConcept(question) {
        if (question && typeof question.conceptLabel === "string" && question.conceptLabel.trim()) {
            return question.conceptLabel.trim();
        }

        return String(question && question.concept ? question.concept : "")
            .split("(")[0]
            .split("/")[0]
            .trim();
    }

    function buildConceptAnalyticsModel(conceptSummary) {
        if (!conceptSummary.stats.length) {
            return {
                isEmpty: true,
                emptyText: strings.resultConceptEmpty,
                items: []
            };
        }

        return {
            isEmpty: false,
            emptyText: "",
            items: conceptSummary.stats.map(stat => {
                const status = logic.getConceptStatus(stat);
                return {
                    concept: stat.concept,
                    statusLabel: status.label,
                    statusClassName: status.className,
                    cardClassName: status.cardClassName,
                    correctnessText: `${stat.correct}/${stat.total}`,
                    evidenceText: stat.hasStrongEvidence
                        ? strings.conceptEvidenceStrong
                        : strings.conceptEvidencePreliminary,
                    practiceHint: stat.correct < stat.total ? logic.getPracticeHint(stat) : ""
                };
            })
        };
    }

    function buildResultItemModel(question, userAnswerIndex, index) {
        const isAnswered = userAnswerIndex !== null && userAnswerIndex !== undefined;
        const isCorrect = isAnswered && userAnswerIndex === question.correct;

        return {
            title: `${index + 1}. ${question.q}`,
            cardClassName: isCorrect ? "result-correct" : isAnswered ? "result-incorrect" : "border-gray-300",
            statusText: isCorrect ? strings.statusCorrect : isAnswered ? strings.statusIncorrect : strings.statusSkipped,
            statusClassName: isCorrect
                ? "font-bold text-green-700 mb-2"
                : isAnswered
                    ? "font-bold text-red-700 mb-2"
                    : "font-bold text-gray-600 mb-2",
            userAnswerText: isAnswered && !isCorrect ? question.options[userAnswerIndex] : "",
            correctAnswerText: question.options[question.correct],
            explanationText: question.explanation,
            conceptText: getDisplayConcept(question)
        };
    }

    function renderAdultSummary(dom, conceptSummary) {
        const summary = logic.buildAdultSummary(conceptSummary);
        dom.adultSummaryText.textContent = summary.text;
        dom.adultSummaryStrength.textContent = summary.strengthText;
        dom.adultSummaryFocus.textContent = summary.focusText;
        if (dom.adultSummaryObserved) {
            dom.adultSummaryObserved.textContent = summary.observedText;
        }
    }

    function renderConceptAnalytics(container, conceptSummary, helpers) {
        container.innerHTML = "";
        const model = buildConceptAnalyticsModel(conceptSummary);

        if (model.isEmpty) {
            const emptyState = helpers.createElement("p", "text-sm text-gray-600", model.emptyText);
            container.appendChild(emptyState);
            return;
        }

        model.items.forEach(item => {
            const card = helpers.createElement("article", `rounded-xl border p-3 ${item.cardClassName}`);
            const title = helpers.createElement("h5", "font-semibold text-gray-800", item.concept);
            const statusLine = helpers.createElement("p", `text-sm font-bold mt-1 ${item.statusClassName}`, item.statusLabel);
            const correctness = helpers.createLabeledLine(
                strings.conceptCorrectnessLabel,
                item.correctnessText,
                "text-sm text-gray-700 mt-2"
            );
            const evidence = helpers.createLabeledLine(
                strings.conceptEvidenceLabel,
                item.evidenceText,
                "text-sm text-gray-700 mt-1"
            );

            card.appendChild(title);
            card.appendChild(statusLine);
            card.appendChild(correctness);
            card.appendChild(evidence);

            if (item.practiceHint) {
                card.appendChild(
                    helpers.createLabeledLine(
                        strings.conceptPracticeSummaryLabel,
                        item.practiceHint,
                        "text-sm text-gray-700 mt-1"
                    )
                );
            }

            container.appendChild(card);
        });
    }

    function createResultItem(question, userAnswerIndex, index, helpers) {
        const model = buildResultItemModel(question, userAnswerIndex, index);
        const card = helpers.createElement(
            "article",
            `p-4 rounded-xl border-2 transition-all duration-300 ${model.cardClassName}`
        );

        const title = helpers.createElement("h3", "font-semibold text-lg mb-2", model.title);
        const status = helpers.createElement("p", model.statusClassName, model.statusText);

        card.appendChild(title);
        card.appendChild(status);

        if (model.userAnswerText) {
            card.appendChild(helpers.createLabeledLine(strings.yourAnswer, model.userAnswerText, "text-sm text-red-700 mb-1"));
        }

        card.appendChild(helpers.createLabeledLine(strings.correctAnswer, model.correctAnswerText, "text-sm mb-1"));
        card.appendChild(helpers.createLabeledLine(strings.explanation, model.explanationText, "text-sm text-gray-700 mb-1"));
        card.appendChild(helpers.createLabeledLine(strings.concept, model.conceptText, "text-xs text-gray-500"));

        return card;
    }

    const ResultsView = {
        buildConceptAnalyticsModel,
        buildResultItemModel,
        renderAdultSummary,
        renderConceptAnalytics,
        createResultItem
    };

    global.ResultsView = ResultsView;

    if (typeof module !== "undefined" && module.exports) {
        module.exports = ResultsView;
    }
})(typeof window !== "undefined" ? window : globalThis);
