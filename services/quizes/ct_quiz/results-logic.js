(function (global) {
    const config = global.appConfig || (typeof require === "function" ? require("./app-config.js") : null);
    const strings = global.uiStrings || (typeof require === "function" ? require("./ui-strings.js") : null);

    if (
        !config
        || !config.conceptStatus
        || !config.adultSummaryVariant
    ) {
        throw new Error("app-config.js is missing or invalid. Expected conceptStatus and adultSummaryVariant.");
    }

    function getConceptStatus(stat) {
        if (!stat.hasStrongEvidence) {
            return {
                key: "preliminary",
                label: strings.conceptStatusPreliminary,
                className: "text-slate-700",
                cardClassName: "border-slate-200 bg-slate-50"
            };
        }

        if (stat.correct === stat.total) {
            return {
                key: config.conceptStatus.strong,
                label: strings.conceptStatusStrong,
                className: "text-green-700",
                cardClassName: "border-green-200 bg-green-50"
            };
        }

        if (stat.correct > 0) {
            return {
                key: config.conceptStatus.partial,
                label: strings.conceptStatusPartial,
                className: "text-amber-700",
                cardClassName: "border-amber-200 bg-amber-50"
            };
        }

        return {
            key: config.conceptStatus.needsPractice,
            label: strings.conceptStatusNeedsPractice,
            className: "text-red-700",
            cardClassName: "border-red-200 bg-red-50"
        };
    }

    function getPracticeHint(stat) {
        if (!stat.hasStrongEvidence) {
            return strings.conceptPracticeHintPreliminary;
        }

        if (stat.correct >= stat.total) {
            return "";
        }

        return stat.correct === 0
            ? strings.conceptPracticeHintMissed
            : strings.conceptPracticeHintPartial;
    }

    function buildAdultSummary(conceptSummary) {
        const strongConcepts = conceptSummary.mastered;
        const focusConcepts = conceptSummary.needsPractice;
        const observedConcepts = conceptSummary.observed || [];

        let variant = config.adultSummaryVariant.mixed;
        let text = strings.adultSummaryMixed;

        if (!strongConcepts.length && !focusConcepts.length && observedConcepts.length) {
            variant = config.adultSummaryVariant.preliminary;
            text = strings.adultSummaryPreliminary;
        } else if (focusConcepts.length === 0) {
            variant = config.adultSummaryVariant.strong;
            text = strings.adultSummaryStrong;
        } else if (strongConcepts.length === 0) {
            variant = config.adultSummaryVariant.needsSupport;
            text = strings.adultSummaryNeedsSupport;
        }

        return {
            variant,
            text,
            strengthText: strongConcepts.length
                ? `${strings.adultSummaryStrengthLabel} ${strongConcepts.join(", ")}.`
                : `${strings.adultSummaryStrengthLabel} Поки що немає концепції, яка в цій спробі пройдена повністю без помилок.`,
            focusText: focusConcepts.length
                ? `${strings.adultSummaryFocusLabel} ${focusConcepts.join(", ")}.`
                : `${strings.adultSummaryFocusLabel} У цій спробі немає окремої зони ризику серед тем із тесту.`,
            observedText: observedConcepts.length
                ? `${strings.adultSummaryObservedLabel} ${observedConcepts.join(", ")}.`
                : `${strings.adultSummaryObservedLabel} Для всіх показаних тем уже є щонайменше дві відповіді в межах цієї спроби.`
        };
    }

    function normalizeConfidence(confidenceValue) {
        if (confidenceValue === "high") {
            return {
                value: "high",
                label: strings.confidenceLevelHigh
            };
        }

        if (confidenceValue === "medium") {
            return {
                value: "medium",
                label: strings.confidenceLevelMedium
            };
        }

        return {
            value: "low",
            label: strings.confidenceLevelLow
        };
    }

    function classifyAnswer(question, userAnswer, userConfidence, timingMeta, responseIntent) {
        const isAnswered = userAnswer !== null && userAnswer !== undefined;
        const isCorrect = isAnswered && userAnswer === question.correct;
        const confidence = normalizeConfidence(userConfidence);
        const tooFastAttempts = timingMeta && Number.isInteger(timingMeta.tooFastAttempts)
            ? timingMeta.tooFastAttempts
            : 0;

        if (responseIntent === "dont_know") {
            return {
                key: "explicit-unknown",
                label: strings.diagnosticExplicitUnknown,
                toneClassName: "text-sky-800",
                cardClassName: "border-sky-200 bg-sky-50",
                isCorrect: false,
                confidence: null,
                tooFastAttempts
            };
        }

        if (!isAnswered) {
            return {
                key: "skipped",
                label: strings.diagnosticSkipped,
                toneClassName: "text-slate-700",
                cardClassName: "border-slate-200 bg-slate-50",
                isCorrect: false,
                confidence
            };
        }

        if (isCorrect && confidence.value === "high") {
            return {
                key: "strong-knowledge",
                label: strings.diagnosticStrongKnowledge,
                toneClassName: "text-green-700",
                cardClassName: "border-green-200 bg-green-50",
                isCorrect: true,
                confidence
            };
        }

        if (isCorrect && confidence.value === "medium") {
            return {
                key: "emerging-knowledge",
                label: strings.diagnosticEmergingKnowledge,
                toneClassName: "text-amber-700",
                cardClassName: "border-amber-200 bg-amber-50",
                isCorrect: true,
                confidence
            };
        }

        if (isCorrect) {
            return {
                key: "tentative-knowledge",
                label: strings.diagnosticTentativeKnowledge,
                toneClassName: "text-yellow-800",
                cardClassName: "border-yellow-200 bg-yellow-50",
                isCorrect: true,
                confidence
            };
        }

        if (!isCorrect && confidence.value === "high") {
            return {
                key: "false-confidence",
                label: strings.diagnosticFalseConfidence,
                toneClassName: "text-red-800",
                cardClassName: "border-red-300 bg-red-50",
                isCorrect: false,
                confidence,
                tooFastAttempts
            };
        }

        return {
            key: "uncertain-error",
            label: strings.diagnosticUncertainError,
            toneClassName: "text-orange-800",
            cardClassName: "border-orange-200 bg-orange-50",
            isCorrect: false,
            confidence,
            tooFastAttempts
        };
    }

    function summarizeDiagnosticProfile(profile) {
        let summaryText = strings.diagnosticSummaryMixed;
        if (profile.strongKnowledge === 0 && profile.emergingKnowledge === 0 && profile.tentativeKnowledge === 0) {
            summaryText = strings.diagnosticSummarySparse;
        } else if (profile.falseConfidence > 0 || profile.tooFastAttempts > 0) {
            summaryText = strings.diagnosticSummaryRisk;
        } else if (profile.tentativeKnowledge > profile.strongKnowledge + profile.emergingKnowledge) {
            summaryText = strings.diagnosticSummaryTentative;
        } else if (profile.strongKnowledge >= Math.max(1, profile.emergingKnowledge)) {
            summaryText = strings.diagnosticSummaryStrong;
        }

        return summaryText;
    }

    function buildDiagnosticProfile(selectedQuestions, userAnswers, userConfidence, questionTimings, responseIntent) {
        const profile = {
            strongKnowledge: 0,
            emergingKnowledge: 0,
            tentativeKnowledge: 0,
            falseConfidence: 0,
            uncertainError: 0,
            explicitUnknown: 0,
            skipped: 0,
            tooFastAttempts: 0
        };

        selectedQuestions.forEach((question, index) => {
            const timingMeta = Array.isArray(questionTimings) ? questionTimings[index] : null;
            const classification = classifyAnswer(
                question,
                Array.isArray(userAnswers) ? userAnswers[index] : null,
                Array.isArray(userConfidence) ? userConfidence[index] : null,
                timingMeta,
                Array.isArray(responseIntent) ? responseIntent[index] : null
            );

            if (classification.key === "strong-knowledge") {
                profile.strongKnowledge += 1;
            } else if (classification.key === "emerging-knowledge") {
                profile.emergingKnowledge += 1;
            } else if (classification.key === "tentative-knowledge") {
                profile.tentativeKnowledge += 1;
            } else if (classification.key === "false-confidence") {
                profile.falseConfidence += 1;
            } else if (classification.key === "uncertain-error") {
                profile.uncertainError += 1;
            } else if (classification.key === "explicit-unknown") {
                profile.explicitUnknown += 1;
            } else {
                profile.skipped += 1;
            }

            if (timingMeta && Number.isInteger(timingMeta.tooFastAttempts)) {
                profile.tooFastAttempts += timingMeta.tooFastAttempts;
            }
        });

        return {
            ...profile,
            summaryText: summarizeDiagnosticProfile(profile)
        };
    }

    const ResultsLogic = {
        getConceptStatus,
        getPracticeHint,
        buildAdultSummary,
        normalizeConfidence,
        classifyAnswer,
        buildDiagnosticProfile,
        summarizeDiagnosticProfile
    };

    global.ResultsLogic = ResultsLogic;

    if (typeof module !== "undefined" && module.exports) {
        module.exports = ResultsLogic;
    }
})(typeof window !== "undefined" ? window : globalThis);
