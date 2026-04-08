const state = {
    currentGrade: null,
    selectedQuestions: [],
    currentQuestionIndex: 0,
    userAnswers: [],
    userConfidence: [],
    responseIntent: [],
    questionTimings: [],
    currentQuestionShownAt: 0
};

const dom = {};
if (typeof appConfig === "undefined") {
    throw new Error("app-config.js is required before script.js. Missing global appConfig.");
}

const MINIMUM_ANSWER_TIME_MS = (Number.isInteger(appConfig.minimumAnswerTimeMs) && appConfig.minimumAnswerTimeMs > 0)
    ? appConfig.minimumAnswerTimeMs
    : 4000;
const CONFIDENCE_MODAL_ANIMATION_MS = 280;
let lastFocusedElement = null;
let latestSharePayload = null;
let isSharedResultView = false;
let confidenceModalHideTimer = null;
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

function getMinimumAnswerTimeSeconds() {
    return (MINIMUM_ANSWER_TIME_MS / 1000).toFixed(MINIMUM_ANSWER_TIME_MS % 1000 === 0 ? 0 : 1);
}

function getQuestionsPerQuizForGrade(grade) {
    if (typeof appConfig.getQuestionsPerQuizForGrade === "function") {
        return appConfig.getQuestionsPerQuizForGrade(grade);
    }

    if (appConfig.questionsPerQuizByGrade) {
        const mappedCount = appConfig.questionsPerQuizByGrade[String(grade)];
        if (Number.isInteger(mappedCount) && mappedCount > 0) {
            return mappedCount;
        }
    }

    return (Number.isInteger(appConfig.questionsPerQuiz) && appConfig.questionsPerQuiz > 0)
        ? appConfig.questionsPerQuiz
        : 10;
}

function formatUiString(template, replacements) {
    return String(template || "").replace(/\{(\w+)\}/g, (match, key) => {
        return Object.prototype.hasOwnProperty.call(replacements, key) ? replacements[key] : match;
    });
}

function ensureQuestionTiming(index) {
    if (!state.questionTimings[index] || typeof state.questionTimings[index] !== "object") {
        state.questionTimings[index] = {
            responseTimeMs: null,
            tooFastAttempts: 0,
            lastTooFastMs: null
        };
    }

    return state.questionTimings[index];
}

function configureConfidenceModal({
    eyebrow,
    title,
    helper,
    backLabel,
    mode = "confidence",
    selectedConfidence = null
}) {
    const isWarning = mode === "warning";

    dom.confidenceModalCard.classList.toggle("warning-mode", isWarning);
    dom.confidenceEyebrow.textContent = eyebrow;
    dom.confidenceTitle.textContent = title;
    dom.confidenceHelper.textContent = helper;
    dom.confidenceHelper.classList.toggle("warning", isWarning);
    dom.confidenceBackButton.textContent = backLabel;
    dom.confidenceOptions.hidden = isWarning;

    if (isWarning) {
        dom.confidenceOptions.innerHTML = "";
        return;
    }

    QuestionView.renderConfidenceOptions(dom.confidenceOptions, selectedConfidence, {
        createElement,
        onSelect: selectConfidence
    });
}

function closeConfidenceModal({ restoreFocus = true } = {}) {
    if (confidenceModalHideTimer) {
        window.clearTimeout(confidenceModalHideTimer);
        confidenceModalHideTimer = null;
    }

    if (dom.confidenceModal.classList.contains("hidden")) {
        dom.confidenceOptions.innerHTML = "";
        if (restoreFocus && lastFocusedElement && typeof lastFocusedElement.focus === "function") {
            lastFocusedElement.focus();
        }
        return;
    }

    dom.confidenceModal.classList.remove("is-visible");
    confidenceModalHideTimer = window.setTimeout(() => {
        hideElement(dom.confidenceModal);
        dom.confidenceOptions.innerHTML = "";
        confidenceModalHideTimer = null;
    }, CONFIDENCE_MODAL_ANIMATION_MS);

    if (restoreFocus && lastFocusedElement && typeof lastFocusedElement.focus === "function") {
        lastFocusedElement.focus();
    }
}

function openConfidenceModal(selectedConfidence = null) {
    if (confidenceModalHideTimer) {
        window.clearTimeout(confidenceModalHideTimer);
        confidenceModalHideTimer = null;
    }

    lastFocusedElement = document.activeElement;
    configureConfidenceModal({
        eyebrow: uiStrings.confidencePromptEyebrow,
        title: uiStrings.confidencePromptTitle,
        helper: uiStrings.confidencePromptHelp,
        backLabel: uiStrings.confidenceModalBack,
        mode: "confidence",
        selectedConfidence
    });
    showElement(dom.confidenceModal);
    window.requestAnimationFrame(() => {
        dom.confidenceModal.classList.add("is-visible");
    });
    dom.confidenceModal.focus();
}

function openTooFastModal() {
    if (confidenceModalHideTimer) {
        window.clearTimeout(confidenceModalHideTimer);
        confidenceModalHideTimer = null;
    }

    lastFocusedElement = document.activeElement;
    configureConfidenceModal({
        eyebrow: uiStrings.confidenceWarningEyebrow,
        title: uiStrings.confidenceWarningTitle,
        helper: formatUiString(uiStrings.timingTooFastNotice, {
            seconds: getMinimumAnswerTimeSeconds()
        }),
        backLabel: uiStrings.confidenceWarningBack,
        mode: "warning"
    });
    showElement(dom.confidenceModal);
    window.requestAnimationFrame(() => {
        dom.confidenceModal.classList.add("is-visible");
    });
    dom.confidenceModal.focus();
}

function reopenConfidenceModalIfNeeded() {
    if (state.userAnswers[state.currentQuestionIndex] !== null && state.userConfidence[state.currentQuestionIndex] === null) {
        openConfidenceModal(null);
    }
}

function updateQuestionActionButtons() {
    const currentIndex = state.currentQuestionIndex;
    const hasAnswer = state.userAnswers[currentIndex] !== null && state.userAnswers[currentIndex] !== undefined;
    const isDontKnow = state.responseIntent[currentIndex] === "dont_know";

    dom.skipButton.textContent = (hasAnswer || isDontKnow) ? uiStrings.clearChoice : uiStrings.skip;
    dom.dontKnowButton.classList.toggle("is-active", isDontKnow);
    dom.dontKnowButton.setAttribute("aria-pressed", isDontKnow ? "true" : "false");
}

function returnToAnswerOptions() {
    closeConfidenceModal();
}

function getResultMessage(score, totalQuestions = state.selectedQuestions.length || getQuestionsPerQuizForGrade(state.currentGrade)) {
    void score;
    void totalQuestions;
    return uiStrings.resultHeading;
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
    diagnosticProfile,
    isShared,
    detailedQuestions,
    detailedAnswers,
    detailedConfidence,
    detailedTimings,
    detailedIntent
}) {
    setScreenMode("results");
    hideElement(dom.quizContainer);
    hideElement(dom.classSelection);
    showElement(dom.resultsContainer);

    dom.scoreDisplay.textContent = `${score}/${totalQuestions}`;
    dom.resultMessage.textContent = getResultMessage(score, totalQuestions);
    dom.diagnosticSummaryTitle.textContent = uiStrings.resultDiagnosticTitle;
    dom.perQuestionTitle.textContent = uiStrings.resultPerQuestionTitle;
    ResultsView.renderDiagnosticSummary(dom.diagnosticSummaryList, diagnosticProfile, {
        createElement,
        createLabeledLine
    });

    dom.detailedResults.innerHTML = "";
    if (isShared) {
        dom.sharedResultNote.textContent = uiStrings.sharedResultDetailsNote;
        showElement(dom.sharedResultNote);
        hideElement(dom.perQuestionTitle);
    } else {
        hideElement(dom.sharedResultNote);
        showElement(dom.perQuestionTitle);
        let renderedItems = 0;
        detailedQuestions.forEach((question, index) => {
            const classification = ResultsLogic.classifyAnswer(
                question,
                detailedAnswers[index],
                detailedConfidence[index],
                detailedTimings[index],
                detailedIntent[index]
            );

            if (classification.key === "strong-knowledge") {
                return;
            }

            dom.detailedResults.appendChild(
                ResultsView.createResultItem(question, detailedAnswers[index], index, {
                    confidence: detailedConfidence[index],
                    timing: detailedTimings[index],
                    intent: detailedIntent[index]
                }, {
                    createElement,
                    createLabeledLine
                })
            );
            renderedItems += 1;
        });

        if (renderedItems === 0) {
            dom.detailedResults.appendChild(
                createElement("p", "text-sm text-slate-600", uiStrings.resultPerQuestionEmpty)
            );
        }
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
    const questionLimit = getQuestionsPerQuizForGrade(grade);

    try {
        state.selectedQuestions = QuizCore.selectQuestionsForGrade(questionBank, grade, questionLimit);
    } catch (error) {
        displayMessage("\u041d\u0435 \u0432\u0434\u0430\u043b\u043e\u0441\u044f \u0437\u0430\u043f\u0443\u0441\u0442\u0438\u0442\u0438 \u0442\u0435\u0441\u0442 \u0434\u043b\u044f \u0446\u044c\u043e\u0433\u043e \u0440\u0456\u0432\u043d\u044f. \u0421\u043f\u0440\u043e\u0431\u0443\u0439 \u0449\u0435 \u0440\u0430\u0437 \u0430\u0431\u043e \u043e\u0431\u0435\u0440\u0438 \u0456\u043d\u0448\u0438\u0439 \u0440\u0456\u0432\u0435\u043d\u044c.", "alert");
        state.currentGrade = null;
        state.selectedQuestions = [];
        state.currentQuestionIndex = 0;
        state.userAnswers = [];
        state.userConfidence = [];
        state.responseIntent = [];
        state.questionTimings = [];
        state.currentQuestionShownAt = 0;
        return;
    }

    state.userAnswers = Array(state.selectedQuestions.length).fill(null);
    state.userConfidence = Array(state.selectedQuestions.length).fill(null);
    state.responseIntent = Array(state.selectedQuestions.length).fill(null);
    state.questionTimings = Array(state.selectedQuestions.length).fill(null);
    state.currentQuestionShownAt = 0;

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
    state.userConfidence = restoredState.userConfidence;
    state.responseIntent = restoredState.responseIntent;
    state.questionTimings = restoredState.questionTimings;
    state.currentQuestionShownAt = 0;
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
    const view = QuestionFlow.getNextButtonView(
        state.userAnswers,
        state.userConfidence,
        state.currentQuestionIndex,
        uiStrings,
        state.responseIntent
    );
    dom.nextButton.disabled = view.disabled;
    dom.nextButton.classList.toggle("opacity-50", view.disabled);
    dom.nextButton.classList.toggle("cursor-not-allowed", view.disabled);
    dom.nextButton.classList.toggle("opacity-100", !view.disabled);
    dom.nextButton.classList.toggle("cursor-pointer", !view.disabled);
    dom.nextButton.textContent = view.label;
}

function renderQuestion(index = state.currentQuestionIndex) {
    const target = QuestionFlow.resolveRenderTarget(state.selectedQuestions.length, state.userAnswers, index, state.responseIntent);
    if (target.type === "results") {
        showResults();
        return;
    }

    if (target.noticeKey) {
        displayMessage(uiStrings[target.noticeKey], "info");
    }

    state.currentQuestionIndex = target.targetIndex;
    state.currentQuestionShownAt = Date.now();
    const question = state.selectedQuestions[state.currentQuestionIndex];

    dom.currentQuestionIndex.textContent = state.currentQuestionIndex + 1;
    QuestionView.renderQuestion(dom, question, state.userAnswers[state.currentQuestionIndex], {
        createElement,
        onSelect: selectAnswer
    });
    setNextButtonState();
    updateQuestionActionButtons();
    updateReviewButton();
    saveState();

    if (state.userAnswers[state.currentQuestionIndex] !== null && state.userConfidence[state.currentQuestionIndex] === null) {
        window.setTimeout(() => reopenConfidenceModalIfNeeded(), 0);
    }
}

function selectAnswer(selectedIndex) {
    const currentAnswer = state.userAnswers[state.currentQuestionIndex];
    const currentConfidence = state.userConfidence[state.currentQuestionIndex];
    if (currentAnswer === selectedIndex && currentConfidence !== null) {
        return;
    }

    if (currentAnswer === selectedIndex && currentConfidence === null) {
        openConfidenceModal(null);
        return;
    }

    const responseTimeMs = Date.now() - state.currentQuestionShownAt;
    const timing = ensureQuestionTiming(state.currentQuestionIndex);

    if (responseTimeMs < MINIMUM_ANSWER_TIME_MS) {
        timing.tooFastAttempts += 1;
        timing.lastTooFastMs = responseTimeMs;
        state.userAnswers[state.currentQuestionIndex] = null;
        state.userConfidence[state.currentQuestionIndex] = null;
        state.responseIntent[state.currentQuestionIndex] = null;
        QuestionView.syncSelectedAnswer(dom.optionsContainer, null);
        closeConfidenceModal({ restoreFocus: false });
        openTooFastModal();
        setNextButtonState();
        updateQuestionActionButtons();
        updateReviewButton();
        saveState();
        return;
    }

    timing.responseTimeMs = responseTimeMs;
    timing.lastTooFastMs = null;
    state.userAnswers[state.currentQuestionIndex] = selectedIndex;
    state.userConfidence[state.currentQuestionIndex] = null;
    state.responseIntent[state.currentQuestionIndex] = null;
    QuestionView.syncSelectedAnswer(dom.optionsContainer, selectedIndex);
    openConfidenceModal(null);

    setNextButtonState();
    updateQuestionActionButtons();
    updateReviewButton();
    saveState();
}

function selectConfidence(confidenceValue) {
    state.userConfidence[state.currentQuestionIndex] = confidenceValue;
    closeConfidenceModal({ restoreFocus: false });
    setNextButtonState();
    saveState();
}

function selectDontKnow() {
    const timing = ensureQuestionTiming(state.currentQuestionIndex);
    if (timing.responseTimeMs === null) {
        timing.responseTimeMs = Date.now() - state.currentQuestionShownAt;
    }
    timing.lastTooFastMs = null;

    state.userAnswers[state.currentQuestionIndex] = null;
    state.userConfidence[state.currentQuestionIndex] = null;
    state.responseIntent[state.currentQuestionIndex] = "dont_know";
    QuestionView.syncSelectedAnswer(dom.optionsContainer, null);
    closeConfidenceModal({ restoreFocus: false });
    setNextButtonState();
    updateQuestionActionButtons();
    updateReviewButton();
    saveState();
}

function skipQuestion() {
    const action = QuestionFlow.resolveSkipAction(state.userAnswers, state.currentQuestionIndex, state.responseIntent);

    if (action.type === "clear-answer") {
        state.userAnswers[state.currentQuestionIndex] = null;
        state.userConfidence[state.currentQuestionIndex] = null;
        state.responseIntent[state.currentQuestionIndex] = null;
        ensureQuestionTiming(state.currentQuestionIndex).responseTimeMs = null;
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
    const action = QuestionFlow.resolveNextAction(
        state.userAnswers,
        state.userConfidence,
        state.currentQuestionIndex,
        state.responseIntent
    );

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
    const skippedCount = state.userAnswers.filter((answer, index) => (
        answer === null && state.responseIntent[index] !== "dont_know"
    )).length;
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

    QuestionFlow.buildReviewItems(state.userAnswers, state.currentQuestionIndex, state.responseIntent).forEach(item => {
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
    const diagnosticProfile = ResultsLogic.buildDiagnosticProfile(
        state.selectedQuestions,
        state.userAnswers,
        state.userConfidence,
        state.questionTimings,
        state.responseIntent
    );
    latestSharePayload = ResultShare.buildSharePayload(
        state,
        conceptSummary,
        state.selectedQuestions.length,
        score,
        diagnosticProfile
    );
    isSharedResultView = false;

    renderResultsScreen({
        score,
        totalQuestions: state.selectedQuestions.length,
        conceptSummary,
        diagnosticProfile,
        isShared: false,
        detailedQuestions: state.selectedQuestions,
        detailedAnswers: state.userAnswers,
        detailedConfidence: state.userConfidence,
        detailedTimings: state.questionTimings,
        detailedIntent: state.responseIntent
    });

    playUiSound(score >= Math.ceil(state.selectedQuestions.length * 0.5) ? "success" : "alert");

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
        diagnosticProfile: {
            ...payload.diagnosticProfile,
            summaryText: ResultsLogic.summarizeDiagnosticProfile(payload.diagnosticProfile || {})
        },
        isShared: true,
        detailedQuestions: [],
        detailedAnswers: [],
        detailedConfidence: [],
        detailedTimings: [],
        detailedIntent: []
    });

    displayMessage(uiStrings.sharedResultModeLabel, "info");
    return true;
}

function resetQuiz() {
    state.currentGrade = null;
    state.selectedQuestions = [];
    state.currentQuestionIndex = 0;
    state.userAnswers = [];
    state.userConfidence = [];
    state.responseIntent = [];
    state.questionTimings = [];
    state.currentQuestionShownAt = 0;
    latestSharePayload = null;
    isSharedResultView = false;

    clearSavedState();
    clearSharedHash();
    hideElement(dom.quizContainer);
    hideElement(dom.resultsContainer);
    hideElement(dom.reviewModal);
    hideElement(dom.finishModal);
    hideElement(dom.sharedResultNote);
    closeConfidenceModal({ restoreFocus: false });
    showElement(dom.classSelection);
    setScreenMode("home");
    displayMessage(uiStrings.stateResetNotice, "info");
}

function bindEvents() {
    dom.dontKnowButton.addEventListener("click", selectDontKnow);
    dom.skipButton.addEventListener("click", skipQuestion);
    dom.nextButton.addEventListener("click", nextQuestion);
    dom.finishEarlyButton.addEventListener("click", finishEarly);
    dom.reviewButton.addEventListener("click", openReviewModal);
    dom.reviewCloseButton.addEventListener("click", closeReviewModal);
    dom.finishCancelButton.addEventListener("click", cancelFinishEarly);
    dom.finishConfirmButton.addEventListener("click", confirmFinishEarly);
    dom.confidenceBackButton.addEventListener("click", returnToAnswerOptions);
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
            return;
        }

        if (event.key === "Escape" && !dom.confidenceModal.classList.contains("hidden")) {
            returnToAnswerOptions();
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
    dom.confidenceModal = document.getElementById("confidence-modal");
    dom.confidenceModalCard = dom.confidenceModal.querySelector(".confidence-modal-card");
    dom.confidenceTitle = document.getElementById("confidence-title");
    dom.confidenceEyebrow = document.getElementById("confidence-eyebrow");
    dom.confidenceOptions = document.getElementById("confidence-options");
    dom.confidenceHelper = document.getElementById("confidence-helper");
    dom.confidenceBackButton = document.getElementById("confidence-back-button");
    dom.dontKnowButton = document.getElementById("dont-know-button");
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
    dom.diagnosticSummaryTitle = document.getElementById("diagnostic-summary-title");
    dom.diagnosticSummaryList = document.getElementById("diagnostic-summary-list");
    dom.perQuestionTitle = document.getElementById("per-question-title");
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
    document.getElementById("review-title").textContent = uiStrings.reviewTitle;
    document.getElementById("review-description").textContent = uiStrings.reviewDescription;
    dom.reviewCloseButton.textContent = uiStrings.reviewClose;
    dom.finishModalTitle.textContent = uiStrings.finishModalTitle;
    dom.finishModalDescription.textContent = uiStrings.finishModalDescription;
    dom.finishCancelButton.textContent = uiStrings.finishModalCancel;
    dom.finishConfirmButton.textContent = uiStrings.finishModalConfirm;
    dom.shareButton.textContent = uiStrings.shareResults;
    dom.restartButton.textContent = uiStrings.restart;
    dom.dontKnowButton.textContent = uiStrings.dontKnow;
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
