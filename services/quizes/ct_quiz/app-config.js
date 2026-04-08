const STORAGE_KEY = "ct-quiz-state-v1";
const CONCEPT_STATUS = {
    strong: "strong",
    partial: "partial",
    needsPractice: "needs-practice"
};

const ADULT_SUMMARY_VARIANT = {
    strong: "strong",
    mixed: "mixed",
    needsSupport: "needs-support",
    preliminary: "preliminary"
};

const QUESTION_DIFFICULTY = {
    foundational: "foundational",
    developing: "developing",
    advanced: "advanced"
};

const QUESTION_DIFFICULTY_ORDER = {
    foundational: 1,
    developing: 2,
    advanced: 3
};

const QUESTION_PROGRESSION_BAND = {
    recognize: "recognize",
    apply: "apply",
    reason: "reason"
};

const QUESTION_PROGRESSION_BAND_ORDER = {
    recognize: 1,
    apply: 2,
    reason: 3
};

const QUESTION_REVIEW_STATUS = {
    approved: "approved",
    revised: "revised",
    extension: "extension"
};

const DISTRACTOR_QUALITY = {
    strong: "strong",
    medium: "medium"
};

const REQUIRED_CONCEPT_ROOTS_BY_GRADE = {
    "2": [
        "alhorytmy",
        "dekompozytsiia",
        "abstrahuvannia",
        "rozpiznavannia",
        "povtorennia",
        "lohichne",
        "efektyvnist",
        "klasyfikatsiia",
        "nalahodzhennia"
    ],
    "3": [
        "alhorytmy",
        "dekompozytsiia",
        "abstrahuvannia",
        "rozpiznavannia",
        "povtorennia",
        "lohichne",
        "efektyvnist",
        "klasyfikatsiia",
        "nalahodzhennia"
    ],
    "4": [
        "alhorytmy",
        "dekompozytsiia",
        "abstrahuvannia",
        "rozpiznavannia",
        "lohichne",
        "efektyvnist",
        "klasyfikatsiia",
        "nalahodzhennia"
    ]
};

const QUESTIONS_PER_QUIZ_BY_GRADE = {
    "2": 12,
    "3": 14,
    "4": 16
};

function getQuestionsPerQuizForGrade(grade) {
    const normalizedGrade = String(grade || "").trim();
    const configuredCount = QUESTIONS_PER_QUIZ_BY_GRADE[normalizedGrade];

    if (Number.isInteger(configuredCount) && configuredCount > 0) {
        return configuredCount;
    }

    const fallbackCounts = Object.values(QUESTIONS_PER_QUIZ_BY_GRADE).filter(count => Number.isInteger(count) && count > 0);
    return fallbackCounts.length ? Math.min(...fallbackCounts) : 10;
}

const appConfig = {
    storageKey: STORAGE_KEY,
    questionBankVersion: 2,
    questionsPerQuiz: getQuestionsPerQuizForGrade("2"),
    questionsPerQuizByGrade: QUESTIONS_PER_QUIZ_BY_GRADE,
    getQuestionsPerQuizForGrade,
    minimumAnswerTimeMs: 4000,
    conceptStatus: CONCEPT_STATUS,
    adultSummaryVariant: ADULT_SUMMARY_VARIANT,
    questionDifficulty: QUESTION_DIFFICULTY,
    questionDifficultyOrder: QUESTION_DIFFICULTY_ORDER,
    questionProgressionBand: QUESTION_PROGRESSION_BAND,
    questionProgressionBandOrder: QUESTION_PROGRESSION_BAND_ORDER,
    questionReviewStatus: QUESTION_REVIEW_STATUS,
    distractorQuality: DISTRACTOR_QUALITY,
    requiredConceptRootsByGrade: REQUIRED_CONCEPT_ROOTS_BY_GRADE,
    minimumStrongEvidencePerConcept: 2
};

if (typeof window !== "undefined") {
    window.appConfig = appConfig;
}

if (typeof module !== "undefined" && module.exports) {
    module.exports = appConfig;
}
