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

    const ResultsLogic = {
        getConceptStatus,
        getPracticeHint,
        buildAdultSummary
    };

    global.ResultsLogic = ResultsLogic;

    if (typeof module !== "undefined" && module.exports) {
        module.exports = ResultsLogic;
    }
})(typeof window !== "undefined" ? window : globalThis);
