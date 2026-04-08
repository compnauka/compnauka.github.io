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

    const conceptSubtypeLabels = {
        "abstrahuvannia-oznaky": "важливі ознаки",
        "abstrahuvannia-model": "модель",
        "alhorytmy-poslidovnist": "послідовність",
        "alhorytmy-umova": "умова",
        "alhorytmy-tsykl": "цикл",
        "alhorytmy-rezultat": "результат",
        "dekompozytsiia-podilst-zadachi": "поділ задачі",
        "klasyfikatsiia-hrupy": "групування",
        "lahodzhennia-pomylka": "пошук помилки",
        "lohika-i-abo-ne": "зв'язки і/або/не",
        "moduli-povtorne-vykorystannia": "повторне використання",
        "otsinka-efektyvnosti-kroky": "кількість кроків",
        "rozpiznavannia-zakonomirnostei-pravylo": "правило",
        "tablytsi-filtratsiia": "фільтрація в таблиці"
    };

    function formatConceptSubtopics(conceptKeys) {
        if (!Array.isArray(conceptKeys) || !conceptKeys.length) {
            return "";
        }

        const labels = conceptKeys
            .map(key => conceptSubtypeLabels[key] || String(key || "").trim())
            .filter(Boolean);

        if (!labels.length) {
            return "";
        }

        return [...new Set(labels)].join(", ");
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
                    subtopicsText: formatConceptSubtopics(stat.conceptKeys),
                    evidenceText: stat.hasStrongEvidence
                        ? strings.conceptEvidenceStrong
                        : strings.conceptEvidencePreliminary,
                    practiceHint: stat.correct < stat.total ? logic.getPracticeHint(stat) : ""
                };
            })
        };
    }

    function buildDiagnosticSummaryModel(profile) {
        return {
            summaryText: profile.summaryText,
            items: [
                {
                    label: strings.diagnosticStrongKnowledge,
                    value: profile.strongKnowledge,
                    cardClassName: "border-green-200 bg-green-50",
                    toneClassName: "text-green-800"
                },
                {
                    label: strings.diagnosticEmergingKnowledge,
                    value: profile.emergingKnowledge,
                    cardClassName: "border-amber-200 bg-amber-50",
                    toneClassName: "text-amber-800"
                },
                {
                    label: strings.diagnosticTentativeKnowledge,
                    value: profile.tentativeKnowledge,
                    cardClassName: "border-yellow-200 bg-yellow-50",
                    toneClassName: "text-yellow-800"
                },
                {
                    label: strings.diagnosticFalseConfidence,
                    value: profile.falseConfidence,
                    cardClassName: "border-red-200 bg-red-50",
                    toneClassName: "text-red-800"
                },
                {
                    label: strings.diagnosticUncertainError,
                    value: profile.uncertainError,
                    cardClassName: "border-orange-200 bg-orange-50",
                    toneClassName: "text-orange-800"
                },
                {
                    label: strings.diagnosticExplicitUnknown,
                    value: profile.explicitUnknown,
                    cardClassName: "border-sky-200 bg-sky-50",
                    toneClassName: "text-sky-800"
                },
                {
                    label: strings.diagnosticSkipped,
                    value: profile.skipped,
                    cardClassName: "border-slate-200 bg-slate-50",
                    toneClassName: "text-slate-800"
                },
                {
                    label: strings.diagnosticTooFast,
                    value: profile.tooFastAttempts,
                    cardClassName: "border-blue-200 bg-blue-50",
                    toneClassName: "text-blue-800",
                    hint: profile.tooFastAttempts > 0 ? strings.diagnosticTooFastHint : ""
                }
            ]
        };
    }

    function buildResultItemModel(question, userAnswerIndex, index, responseMeta = {}) {
        const isAnswered = userAnswerIndex !== null && userAnswerIndex !== undefined;
        const classification = logic.classifyAnswer(
            question,
            userAnswerIndex,
            responseMeta.confidence,
            responseMeta.timing,
            responseMeta.intent
        );
        const responseTimeMs = responseMeta.timing && Number.isFinite(responseMeta.timing.responseTimeMs)
            ? responseMeta.timing.responseTimeMs
            : null;
        const showConfidence = Boolean(classification.confidence) && responseMeta.intent !== "dont_know";

        return {
            title: `${index + 1}. ${question.q}`,
            cardClassName: classification.cardClassName,
            statusText: classification.label,
            statusClassName: `font-bold mb-2 ${classification.toneClassName}`,
            userAnswerText: isAnswered ? question.options[userAnswerIndex] : "",
            correctAnswerText: question.options[question.correct],
            explanationText: classification.isCorrect ? "" : question.explanation,
            conceptText: getDisplayConcept(question),
            confidenceText: showConfidence ? classification.confidence.label : "",
            responseTimeText: responseTimeMs === null
                ? ""
                : `${(responseTimeMs / 1000).toFixed(1)} ${strings.diagnosticSecondsSuffix}`,
            tooFastHint: responseMeta.timing && responseMeta.timing.tooFastAttempts > 0
                ? strings.diagnosticTooFastHint
                : "",
            showConfidence,
            showCorrectAnswer: !classification.isCorrect,
            showConcept: false
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
            if (item.subtopicsText) {
                card.appendChild(
                    helpers.createLabeledLine(
                        strings.conceptSubtopicsLabel,
                        item.subtopicsText,
                        "text-sm text-gray-700 mt-1"
                    )
                );
            }
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

    function renderDiagnosticSummary(container, profile, helpers) {
        const model = buildDiagnosticSummaryModel(profile);
        container.innerHTML = "";

        const summary = helpers.createElement("p", "text-sm text-slate-700 mb-4", model.summaryText);
        container.appendChild(summary);

        model.items.forEach(item => {
            const card = helpers.createElement("article", `rounded-xl border p-3 ${item.cardClassName}`);
            const value = helpers.createElement("p", `text-2xl font-black ${item.toneClassName}`, String(item.value));
            const label = helpers.createElement("p", `text-sm font-semibold mt-1 ${item.toneClassName}`, item.label);

            card.append(value, label);

            if (item.hint) {
                card.appendChild(helpers.createElement("p", "text-xs text-slate-600 mt-2", item.hint));
            }

            container.appendChild(card);
        });
    }

    function createResultItem(question, userAnswerIndex, index, responseMeta, helpers) {
        const model = buildResultItemModel(question, userAnswerIndex, index, responseMeta);
        const card = helpers.createElement(
            "article",
            `p-4 rounded-xl border-2 transition-all duration-300 ${model.cardClassName}`
        );

        const title = helpers.createElement("h3", "font-semibold text-lg mb-2", model.title);
        const status = helpers.createElement("p", model.statusClassName, model.statusText);

        card.appendChild(title);
        card.appendChild(status);

        if (model.userAnswerText) {
            card.appendChild(helpers.createLabeledLine(strings.yourAnswer, model.userAnswerText, "text-sm text-slate-800 mb-1"));
        }

        if (model.showConfidence) {
            card.appendChild(helpers.createLabeledLine(strings.diagnosticConfidenceLabel, model.confidenceText, "text-sm text-slate-700 mb-1"));
        }

        if (model.responseTimeText) {
            card.appendChild(helpers.createLabeledLine(strings.diagnosticTimeLabel, model.responseTimeText, "text-sm text-slate-700 mb-1"));
        }

        if (model.showCorrectAnswer) {
            card.appendChild(helpers.createLabeledLine(strings.correctAnswer, model.correctAnswerText, "text-sm mb-1"));
        }

        if (model.explanationText) {
            card.appendChild(helpers.createLabeledLine(strings.explanation, model.explanationText, "text-sm text-gray-700 mb-1"));
        }

        if (model.tooFastHint) {
            card.appendChild(helpers.createElement("p", "text-xs text-slate-600 mt-2", model.tooFastHint));
        }

        return card;
    }

    const ResultsView = {
        buildDiagnosticSummaryModel,
        buildConceptAnalyticsModel,
        buildResultItemModel,
        renderAdultSummary,
        renderConceptAnalytics,
        renderDiagnosticSummary,
        createResultItem
    };

    global.ResultsView = ResultsView;

    if (typeof module !== "undefined" && module.exports) {
        module.exports = ResultsView;
    }
})(typeof window !== "undefined" ? window : globalThis);
