const state = {
    currentGrade: null,
    selectedQuestions: [],
    currentQuestionIndex: 0,
    userAnswers: []
};

const dom = {};
if (typeof appConfig === "undefined") {
    throw new Error("app-config.js is required before script.js. Missing global appConfig.");
}

const QUESTIONS_PER_QUIZ = (Number.isInteger(appConfig.questionsPerQuiz) && appConfig.questionsPerQuiz > 0)
    ? appConfig.questionsPerQuiz
    : 10;
let lastFocusedElement = null;
let latestSharePayload = null;
let isSharedResultView = false;
const GRADE_EMOJI = {
    "2": "🐣",
    "3": "🦁",
    "4": "🚀"
};

function setScreenMode(mode) {
    document.body.classList.toggle("screen-home", mode === "home");
}

function saveState() {
    QuizStorage.saveStateSnapshot(window.sessionStorage, state);
}

function clearSavedState() {
    QuizStorage.clearStateSnapshot(window.sessionStorage);
}

function loadState() {
    return QuizStorage.loadStateSnapshot(window.sessionStorage);
}

function playUiSound(type = "info") {
    void type;
}

function showElement(element) {
    element.classList.remove("hidden");
}

function hideElement(element) {
    element.classList.add("hidden");
}

function announce(message, tone = "polite") {
    dom.announcements.setAttribute("aria-live", tone);
    dom.announcements.textContent = message;
}

function displayMessage(message, type = "info") {
    announce(message, type === "alert" ? "assertive" : "polite");
    playUiSound(type);

    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;
    toast.setAttribute("role", type === "alert" ? "alert" : "status");
    toast.textContent = message;

    dom.toastContainer.appendChild(toast);

    window.setTimeout(() => {
        toast.classList.add("toast-hidden");
        toast.addEventListener("transitionend", () => toast.remove(), { once: true });
    }, 2600);
}

function createElement(tagName, className, textContent) {
    const element = document.createElement(tagName);

    if (className) {
        element.className = className;
    }

    if (typeof textContent === "string") {
        element.textContent = textContent;
    }

    return element;
}

function createLabeledLine(label, value, className = "") {
    const paragraph = createElement("p", className);
    const labelElement = createElement("span", "font-semibold", `${label} `);
    const valueElement = createElement("span", "", value);
    paragraph.append(labelElement, valueElement);
    return paragraph;
}

function getResultMessage(score, totalQuestions = QUESTIONS_PER_QUIZ) {
    if (score === totalQuestions) {
        return uiStrings.scorePerfect;
    }

    if (score >= totalQuestions * 0.7) {
        return uiStrings.scoreGreat;
    }

    if (score >= totalQuestions * 0.5) {
        return uiStrings.scoreOkay;
    }

    return uiStrings.scoreNeedsWork;
}

function clearSharedHash() {
    if (window.location.hash.startsWith(ResultShare.HASH_PREFIX)) {
        window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}`);
    }
}

function copyTextToClipboard(text) {
    if (navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
        return navigator.clipboard.writeText(text);
    }

    return new Promise((resolve, reject) => {
        const textarea = document.createElement("textarea");
        textarea.value = text;
        textarea.setAttribute("readonly", "");
        textarea.style.position = "fixed";
        textarea.style.top = "-1000px";
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();

        const isCopied = document.execCommand("copy");
        document.body.removeChild(textarea);

        if (isCopied) {
            resolve();
            return;
        }

        reject(new Error("copy failed"));
    });
}

function getCurrentShareUrl() {
    if (!latestSharePayload) {
        return null;
    }

    return ResultShare.buildShareUrl(window.location, latestSharePayload);
}

async function shareResults() {
    const shareUrl = getCurrentShareUrl();
    if (!shareUrl) {
        displayMessage(uiStrings.shareErrorNotice, "alert");
        return;
    }

    const shareData = {
        title: uiStrings.shareNativeTitle,
        text: `${uiStrings.shareNativeTitle}: ${latestSharePayload.score}/${latestSharePayload.total}`,
        url: shareUrl
    };

    try {
        if (navigator.share) {
            await navigator.share(shareData);
            return;
        }

        await copyTextToClipboard(shareUrl);
        displayMessage(uiStrings.shareSuccessNotice, "info");
    } catch (error) {
        try {
            await copyTextToClipboard(shareUrl);
            displayMessage(uiStrings.shareUnavailableNotice, "info");
        } catch (copyError) {
            displayMessage(uiStrings.shareErrorNotice, "alert");
        }
    }
}

function renderResultsScreen({
    score,
    totalQuestions,
    conceptSummary,
    isShared,
    detailedQuestions,
    detailedAnswers
}) {
    setScreenMode("results");
    hideElement(dom.quizContainer);
    hideElement(dom.classSelection);
    showElement(dom.resultsContainer);

    dom.scoreDisplay.textContent = `${score}/${totalQuestions}`;
    dom.resultMessage.textContent = getResultMessage(score, totalQuestions);
    ResultsView.renderAdultSummary(dom, conceptSummary);
    dom.conceptNote.textContent = uiStrings.resultConceptNote;
    dom.conceptList.textContent = conceptSummary.all.length
        ? `${uiStrings.conceptEncounteredLabel} ${conceptSummary.all.join(", ")}`
        : uiStrings.resultConceptEmpty;
    dom.needsPracticeList.textContent = conceptSummary.needsPractice.length
        ? conceptSummary.needsPractice.join(", ")
        : uiStrings.resultAllClear;

    ResultsView.renderConceptAnalytics(dom.conceptAnalyticsList, conceptSummary, {
        createElement,
        createLabeledLine
    });

    dom.detailedResults.innerHTML = "";
    if (isShared) {
        dom.sharedResultNote.textContent = uiStrings.sharedResultDetailsNote;
        showElement(dom.sharedResultNote);
    } else {
        hideElement(dom.sharedResultNote);
        detailedQuestions.forEach((question, index) => {
            dom.detailedResults.appendChild(
                ResultsView.createResultItem(question, detailedAnswers[index], index, {
                    createElement,
                    createLabeledLine
                })
            );
        });
    }
}

function renderClassSelection() {
    dom.classButtons.innerHTML = "";

    Object.keys(questionBank).forEach(grade => {
        const button = createElement("button", `grade-button btn-grade-${grade}`);
        button.type = "button";
        const mainLine = createElement("span", "grade-button-main", `${uiStrings.shortGrades[grade]} рівень`);
        const metaLine = createElement("span", "grade-button-meta", `(${grade} кл.) ${GRADE_EMOJI[grade] || ""}`.trim());
        button.append(mainLine, metaLine);
        button.addEventListener("click", () => startQuiz(grade));
        dom.classButtons.appendChild(button);
    });
}

function startQuiz(grade) {
    setScreenMode("quiz");
    state.currentGrade = grade;
    state.currentQuestionIndex = 0;

    try {
        state.selectedQuestions = QuizCore.selectQuestionsForGrade(questionBank, grade, QUESTIONS_PER_QUIZ);
    } catch (error) {
        displayMessage("РќРµ РІРґР°Р»РѕСЃСЏ Р·Р°РїСѓСЃС‚РёС‚Рё С‚РµСЃС‚ РґР»СЏ С†СЊРѕРіРѕ СЂС–РІРЅСЏ. РЎРїСЂРѕР±СѓР№ С‰Рµ СЂР°Р· Р°Р±Рѕ РѕР±РµСЂРё С–РЅС€РёР№ СЂС–РІРµРЅСЊ.", "alert");
        state.currentGrade = null;
        state.selectedQuestions = [];
        state.currentQuestionIndex = 0;
        state.userAnswers = [];
        return;
    }

    state.userAnswers = Array(state.selectedQuestions.length).fill(null);

    hideElement(dom.classSelection);
    hideElement(dom.resultsContainer);
    showElement(dom.quizContainer);

    dom.currentGrade.textContent = uiStrings.shortGrades[grade];
    dom.totalQuestions.textContent = state.selectedQuestions.length;

    saveState();
    renderQuestion();
    updateReviewButton();
}

function restoreSession(snapshot) {
    const restoredState = QuestionFlow.normalizeRestoredSession(snapshot, questionBank);
    if (!restoredState) {
        clearSavedState();
        return false;
    }

    state.currentGrade = restoredState.currentGrade;
    state.selectedQuestions = restoredState.selectedQuestions;
    state.currentQuestionIndex = restoredState.currentQuestionIndex;
    state.userAnswers = restoredState.userAnswers;
    setScreenMode("quiz");

    hideElement(dom.classSelection);
    hideElement(dom.resultsContainer);
    showElement(dom.quizContainer);
    dom.currentGrade.textContent = uiStrings.shortGrades[state.currentGrade];
    dom.totalQuestions.textContent = state.selectedQuestions.length;

    renderQuestion();
    updateReviewButton();
    displayMessage(uiStrings.stateRestoredNotice, "info");
    return true;
}

function setNextButtonState() {
    const view = QuestionFlow.getNextButtonView(state.userAnswers, state.currentQuestionIndex, uiStrings);
    dom.nextButton.disabled = view.disabled;
    dom.nextButton.classList.toggle("opacity-50", view.disabled);
    dom.nextButton.classList.toggle("cursor-not-allowed", view.disabled);
    dom.nextButton.classList.toggle("opacity-100", !view.disabled);
    dom.nextButton.classList.toggle("cursor-pointer", !view.disabled);
    dom.nextButton.textContent = view.label;
}

function renderQuestion(index = state.currentQuestionIndex) {
    const target = QuestionFlow.resolveRenderTarget(state.selectedQuestions.length, state.userAnswers, index);
    if (target.type === "results") {
        showResults();
        return;
    }

    if (target.noticeKey) {
        displayMessage(uiStrings[target.noticeKey], "info");
    }

    state.currentQuestionIndex = target.targetIndex;
    const question = state.selectedQuestions[state.currentQuestionIndex];

    dom.currentQuestionIndex.textContent = state.currentQuestionIndex + 1;
    QuestionView.renderQuestion(dom, question, state.userAnswers[state.currentQuestionIndex], {
        createElement,
        onSelect: selectAnswer
    });

    setNextButtonState();
    updateReviewButton();
    saveState();
}

function selectAnswer(selectedIndex) {
    if (state.userAnswers[state.currentQuestionIndex] === selectedIndex) {
        return;
    }

    state.userAnswers[state.currentQuestionIndex] = selectedIndex;
    QuestionView.syncSelectedAnswer(dom.optionsContainer, selectedIndex);

    dom.skipButton.textContent = uiStrings.clearChoice;
    setNextButtonState();
    updateReviewButton();
    saveState();
}

function skipQuestion() {
    const action = QuestionFlow.resolveSkipAction(state.userAnswers, state.currentQuestionIndex);

    if (action.type === "clear-answer") {
        state.userAnswers[state.currentQuestionIndex] = null;
        renderQuestion(state.currentQuestionIndex);
        displayMessage(uiStrings[action.noticeKey], "info");
        return;
    }

    if (action.type === "results") {
        if (action.noticeKey) {
            displayMessage(uiStrings[action.noticeKey], "info");
        }
        showResults();
        return;
    }

    if (action.noticeKey) {
        displayMessage(uiStrings[action.noticeKey], "info");
    }

    renderQuestion(action.targetIndex);
}

function nextQuestion() {
    const action = QuestionFlow.resolveNextAction(state.userAnswers, state.currentQuestionIndex);

    if (action.noticeKey) {
        displayMessage(uiStrings[action.noticeKey], action.messageType || "info");
    }

    if (action.type === "blocked") {
        return;
    }

    if (action.type === "results") {
        showResults();
        return;
    }

    renderQuestion(action.targetIndex);
}

function finishEarly() {
    lastFocusedElement = document.activeElement;
    showElement(dom.finishModal);
    dom.finishModal.focus();
}

function cancelFinishEarly() {
    hideElement(dom.finishModal);
    if (lastFocusedElement && typeof lastFocusedElement.focus === "function") {
        lastFocusedElement.focus();
    }
}

function confirmFinishEarly() {
    hideElement(dom.finishModal);
    displayMessage(uiStrings.finishEarlyNotice, "info");
    showResults();
}

function updateReviewButton() {
    const skippedCount = state.userAnswers.filter(answer => answer === null).length;
    dom.skippedCount.textContent = skippedCount;
    dom.reviewButtonLabel.textContent = uiStrings.reviewButton;
    dom.reviewButton.style.display = skippedCount > 0 ? "block" : "none";

    if (!dom.reviewModal.classList.contains("hidden")) {
        populateReviewModal();
    }
}

function openReviewModal() {
    lastFocusedElement = document.activeElement;
    populateReviewModal();
    showElement(dom.reviewModal);
    dom.reviewModal.focus();
}

function closeReviewModal() {
    hideElement(dom.reviewModal);
    if (lastFocusedElement && typeof lastFocusedElement.focus === "function") {
        lastFocusedElement.focus();
    }
}

function populateReviewModal() {
    dom.modalQuestionList.innerHTML = "";

    QuestionFlow.buildReviewItems(state.userAnswers, state.currentQuestionIndex).forEach(item => {
        const button = createElement(
            "button",
            `review-index-button ${item.stateClassName}`,
            item.label
        );

        button.type = "button";
        button.addEventListener("click", () => {
            closeReviewModal();
            renderQuestion(item.index);
        });

        dom.modalQuestionList.appendChild(button);
    });
}

function showResults() {
    const score = QuizCore.scoreQuiz(state.selectedQuestions, state.userAnswers);
    const conceptSummary = QuizCore.buildConceptSummary(state.selectedQuestions, state.userAnswers);
    latestSharePayload = ResultShare.buildSharePayload(state, conceptSummary, state.selectedQuestions.length, score);
    isSharedResultView = false;

    renderResultsScreen({
        score,
        totalQuestions: state.selectedQuestions.length,
        conceptSummary,
        isShared: false,
        detailedQuestions: state.selectedQuestions,
        detailedAnswers: state.userAnswers
    });

    playUiSound(score >= Math.ceil(QUESTIONS_PER_QUIZ * 0.5) ? "success" : "alert");

    clearSavedState();
}

function restoreSharedResultFromHash() {
    const encoded = ResultShare.getEncodedPayloadFromHash(window.location.hash);
    if (!encoded) {
        return false;
    }

    const payload = ResultShare.decodeSharePayload(encoded);
    if (!payload) {
        clearSharedHash();
        return false;
    }

    latestSharePayload = payload;
    isSharedResultView = true;
    setScreenMode("results");

    renderResultsScreen({
        score: payload.score,
        totalQuestions: payload.total,
        conceptSummary: payload.conceptSummary,
        isShared: true,
        detailedQuestions: [],
        detailedAnswers: []
    });

    displayMessage(uiStrings.sharedResultModeLabel, "info");
    return true;
}

function resetQuiz() {
    state.currentGrade = null;
    state.selectedQuestions = [];
    state.currentQuestionIndex = 0;
    state.userAnswers = [];
    latestSharePayload = null;
    isSharedResultView = false;

    clearSavedState();
    clearSharedHash();
    hideElement(dom.quizContainer);
    hideElement(dom.resultsContainer);
    hideElement(dom.reviewModal);
    hideElement(dom.finishModal);
    hideElement(dom.sharedResultNote);
    showElement(dom.classSelection);
    setScreenMode("home");
    displayMessage(uiStrings.stateResetNotice, "info");
}

function bindEvents() {
    dom.skipButton.addEventListener("click", skipQuestion);
    dom.nextButton.addEventListener("click", nextQuestion);
    dom.finishEarlyButton.addEventListener("click", finishEarly);
    dom.reviewButton.addEventListener("click", openReviewModal);
    dom.reviewCloseButton.addEventListener("click", closeReviewModal);
    dom.finishCancelButton.addEventListener("click", cancelFinishEarly);
    dom.finishConfirmButton.addEventListener("click", confirmFinishEarly);
    dom.restartButton.addEventListener("click", resetQuiz);
    dom.shareButton.addEventListener("click", () => {
        shareResults();
    });

    document.addEventListener("keydown", event => {
        if (event.key === "Escape" && !dom.reviewModal.classList.contains("hidden")) {
            closeReviewModal();
            return;
        }

        if (event.key === "Escape" && !dom.finishModal.classList.contains("hidden")) {
            cancelFinishEarly();
        }
    });
}

function initDom() {
    dom.classSelection = document.getElementById("class-selection");
    dom.classButtons = document.getElementById("class-buttons");
    dom.quizContainer = document.getElementById("quiz-container");
    dom.resultsContainer = document.getElementById("results-container");
    dom.currentQuestionIndex = document.getElementById("current-question-index");
    dom.totalQuestions = document.getElementById("total-questions");
    dom.currentGrade = document.getElementById("current-grade");
    dom.questionText = document.getElementById("question-text");
    dom.optionsContainer = document.getElementById("options-container");
    dom.skipButton = document.getElementById("skip-button");
    dom.nextButton = document.getElementById("next-button");
    dom.finishEarlyButton = document.getElementById("finish-early-button");
    dom.reviewButton = document.getElementById("review-button");
    dom.reviewButtonLabel = document.getElementById("review-button-label");
    dom.skippedCount = document.getElementById("skipped-count");
    dom.reviewModal = document.getElementById("review-modal");
    dom.modalQuestionList = document.getElementById("modal-question-list");
    dom.reviewCloseButton = document.getElementById("review-close-button");
    dom.finishModal = document.getElementById("finish-modal");
    dom.finishModalTitle = document.getElementById("finish-modal-title");
    dom.finishModalDescription = document.getElementById("finish-modal-description");
    dom.finishCancelButton = document.getElementById("finish-cancel-button");
    dom.finishConfirmButton = document.getElementById("finish-confirm-button");
    dom.resultMessage = document.getElementById("result-message");
    dom.scoreDisplay = document.getElementById("score-display");
    dom.adultSummaryTitle = document.getElementById("adult-summary-title");
    dom.adultSummaryText = document.getElementById("adult-summary-text");
    dom.adultSummaryStrength = document.getElementById("adult-summary-strength");
    dom.adultSummaryFocus = document.getElementById("adult-summary-focus");
    dom.adultSummaryObserved = document.getElementById("adult-summary-observed");
    dom.conceptNote = document.getElementById("concept-note");
    dom.conceptList = document.getElementById("concept-list");
    dom.conceptAnalyticsList = document.getElementById("concept-analytics-list");
    dom.needsPracticeList = document.getElementById("needs-practice-list");
    dom.detailedResults = document.getElementById("detailed-results");
    dom.sharedResultNote = document.getElementById("shared-result-note");
    dom.shareButton = document.getElementById("share-button");
    dom.restartButton = document.getElementById("restart-button");
    dom.announcements = document.getElementById("announcements");
    dom.toastContainer = document.getElementById("toast-container");
}

function initStaticText() {
    document.getElementById("class-selection-title").textContent = uiStrings.classSelectionTitle;
    document.getElementById("class-selection-subtitle").textContent = uiStrings.classSelectionSubtitle;
    document.getElementById("level-label").textContent = uiStrings.levelLabel;
    document.getElementById("result-label").textContent = uiStrings.resultLabel;
    document.getElementById("result-analysis-title").textContent = uiStrings.resultAnalysis;
    document.getElementById("adult-summary-title").textContent = uiStrings.resultAdultSummary;
    document.getElementById("concepts-title").textContent = uiStrings.resultConcepts;
    document.getElementById("needs-practice-title").textContent = uiStrings.resultNeedsPractice;
    document.getElementById("review-title").textContent = uiStrings.reviewTitle;
    document.getElementById("review-description").textContent = uiStrings.reviewDescription;
    dom.reviewCloseButton.textContent = uiStrings.reviewClose;
    dom.finishModalTitle.textContent = uiStrings.finishModalTitle;
    dom.finishModalDescription.textContent = uiStrings.finishModalDescription;
    dom.finishCancelButton.textContent = uiStrings.finishModalCancel;
    dom.finishConfirmButton.textContent = uiStrings.finishModalConfirm;
    dom.shareButton.textContent = uiStrings.shareResults;
    dom.restartButton.textContent = uiStrings.restart;
    dom.skipButton.textContent = uiStrings.skip;
    dom.nextButton.textContent = uiStrings.next;
    dom.finishEarlyButton.textContent = uiStrings.finishEarly;
    dom.announcements.textContent = uiStrings.liveRegionDefault;
}

function initializeApp() {
    initDom();
    initStaticText();
    renderClassSelection();
    bindEvents();
    if (restoreSharedResultFromHash()) {
        clearSavedState();
        hideElement(dom.quizContainer);
        hideElement(dom.classSelection);
        showElement(dom.resultsContainer);
        setScreenMode("results");
        return;
    }

    const savedState = loadState();
    if (!restoreSession(savedState)) {
        showElement(dom.classSelection);
        hideElement(dom.quizContainer);
        hideElement(dom.resultsContainer);
        setScreenMode("home");
    }
}

document.addEventListener("DOMContentLoaded", initializeApp);

