(function (global) {
    function isDontKnow(responseIntent, index) {
        return Array.isArray(responseIntent) && responseIntent[index] === "dont_know";
    }

    function isQuestionComplete(userAnswers, userConfidence, responseIntent, index) {
        if (isDontKnow(responseIntent, index)) {
            return true;
        }

        const hasAnswer = userAnswers[index] !== null && userAnswers[index] !== undefined;
        const hasConfidence = Array.isArray(userConfidence) && userConfidence[index] !== null && userConfidence[index] !== undefined;
        return hasAnswer && hasConfidence;
    }

    function findFirstSkippedIndex(userAnswers, responseIntent = [], excludedIndex = null) {
        return userAnswers.findIndex((answer, index) => (
            answer === null
            && !isDontKnow(responseIntent, index)
            && index !== excludedIndex
        ));
    }

    function getNextButtonView(userAnswers, userConfidence, currentIndex, strings, responseIntent = []) {
        const hasAnswer = userAnswers[currentIndex] !== null && userAnswers[currentIndex] !== undefined;
        const hasConfidence = Array.isArray(userConfidence) && userConfidence[currentIndex] !== null && userConfidence[currentIndex] !== undefined;
        const isCurrentDontKnow = isDontKnow(responseIntent, currentIndex);
        const allAnswered = userAnswers.every((answer, index) => (
            (answer !== null && answer !== undefined) || isDontKnow(responseIntent, index)
        ));

        let label = strings.next;
        if (allAnswered) {
            label = strings.finish;
        } else if (currentIndex === userAnswers.length - 1) {
            label = strings.reviewSkipped;
        }

        return {
            disabled: !isQuestionComplete(userAnswers, userConfidence, responseIntent, currentIndex),
            label,
            hasAnswer,
            hasConfidence,
            isDontKnow: isCurrentDontKnow,
            allAnswered
        };
    }

    function normalizeRestoredSession(snapshot, availableQuestionLists) {
        if (!snapshot || !snapshot.currentGrade || !Array.isArray(snapshot.selectedQuestions)) {
            return null;
        }

        if (!availableQuestionLists || !availableQuestionLists[snapshot.currentGrade]) {
            return null;
        }

        const selectedQuestions = snapshot.selectedQuestions;
        const safeLength = selectedQuestions.length;
        const currentQuestionIndex = Math.max(0, Math.min(snapshot.currentQuestionIndex || 0, Math.max(0, safeLength - 1)));
        const userAnswers = Array.isArray(snapshot.userAnswers)
            ? snapshot.userAnswers.slice(0, safeLength)
            : Array(safeLength).fill(null);

        while (userAnswers.length < safeLength) {
            userAnswers.push(null);
        }

        const userConfidence = Array.isArray(snapshot.userConfidence)
            ? snapshot.userConfidence.slice(0, safeLength)
            : Array(safeLength).fill(null);
        const questionTimings = Array.isArray(snapshot.questionTimings)
            ? snapshot.questionTimings.slice(0, safeLength)
            : Array(safeLength).fill(null);
        const responseIntent = Array.isArray(snapshot.responseIntent)
            ? snapshot.responseIntent.slice(0, safeLength)
            : Array(safeLength).fill(null);

        while (userConfidence.length < safeLength) {
            userConfidence.push(null);
        }

        while (questionTimings.length < safeLength) {
            questionTimings.push(null);
        }

        while (responseIntent.length < safeLength) {
            responseIntent.push(null);
        }

        return {
            currentGrade: snapshot.currentGrade,
            selectedQuestions,
            currentQuestionIndex,
            userAnswers,
            userConfidence,
            questionTimings,
            responseIntent
        };
    }

    function resolveRenderTarget(selectedQuestionsLength, userAnswers, requestedIndex, responseIntent = []) {
        if (requestedIndex < selectedQuestionsLength) {
            return {
                type: "question",
                targetIndex: requestedIndex,
                noticeKey: null
            };
        }

        const firstSkippedIndex = findFirstSkippedIndex(userAnswers, responseIntent);
        if (firstSkippedIndex !== -1) {
            return {
                type: "question",
                targetIndex: firstSkippedIndex,
                noticeKey: "endReviewNotice"
            };
        }

        return {
            type: "results",
            targetIndex: null,
            noticeKey: null
        };
    }

    function resolveSkipAction(userAnswers, currentIndex, responseIntent = []) {
        if (userAnswers[currentIndex] !== null || isDontKnow(responseIntent, currentIndex)) {
            return {
                type: "clear-answer",
                targetIndex: currentIndex,
                noticeKey: "clearedNotice"
            };
        }

        const nextIndex = currentIndex + 1;
        if (nextIndex < userAnswers.length) {
            return {
                type: "question",
                targetIndex: nextIndex,
                noticeKey: "skippedNotice"
            };
        }

        const firstSkippedIndex = findFirstSkippedIndex(userAnswers, responseIntent, currentIndex);
        if (firstSkippedIndex !== -1) {
            return {
                type: "question",
                targetIndex: firstSkippedIndex,
                noticeKey: "finalSkippedNotice"
            };
        }

        return {
            type: "results",
            targetIndex: null,
            noticeKey: "skipToResultsNotice"
        };
    }

    function resolveNextAction(userAnswers, userConfidence, currentIndex, responseIntent = []) {
        if (isDontKnow(responseIntent, currentIndex)) {
            const allAnswered = userAnswers.every((answer, index) => (
                (answer !== null && answer !== undefined) || isDontKnow(responseIntent, index)
            ));

            if (allAnswered) {
                return {
                    type: "results",
                    targetIndex: null,
                    noticeKey: null,
                    messageType: "info"
                };
            }

            if (currentIndex < userAnswers.length - 1) {
                return {
                    type: "question",
                    targetIndex: currentIndex + 1,
                    noticeKey: null,
                    messageType: "info"
                };
            }

            const firstSkippedIndex = findFirstSkippedIndex(userAnswers, responseIntent);
            if (firstSkippedIndex !== -1) {
                return {
                    type: "question",
                    targetIndex: firstSkippedIndex,
                    noticeKey: "completedLoopNotice",
                    messageType: "info"
                };
            }

            return {
                type: "results",
                targetIndex: null,
                noticeKey: null,
                messageType: "info"
            };
        }

        const currentAnswer = userAnswers[currentIndex];
        if (currentAnswer === null || currentAnswer === undefined) {
            return {
                type: "blocked",
                targetIndex: currentIndex,
                noticeKey: "answerRequiredNotice",
                messageType: "alert"
            };
        }

        const currentConfidence = Array.isArray(userConfidence) ? userConfidence[currentIndex] : null;
        if (currentConfidence === null || currentConfidence === undefined) {
            return {
                type: "blocked",
                targetIndex: currentIndex,
                noticeKey: "confidenceRequiredNotice",
                messageType: "alert"
            };
        }

        const allAnswered = userAnswers.every((answer, index) => (
            (answer !== null && answer !== undefined) || isDontKnow(responseIntent, index)
        ));
        if (allAnswered) {
            return {
                type: "results",
                targetIndex: null,
                noticeKey: null,
                messageType: "info"
            };
        }

        if (currentIndex < userAnswers.length - 1) {
            return {
                type: "question",
                targetIndex: currentIndex + 1,
                noticeKey: null,
                messageType: "info"
            };
        }

        const firstSkippedIndex = findFirstSkippedIndex(userAnswers, responseIntent);
        if (firstSkippedIndex !== -1) {
            return {
                type: "question",
                targetIndex: firstSkippedIndex,
                noticeKey: "completedLoopNotice",
                messageType: "info"
            };
        }

        return {
            type: "results",
            targetIndex: null,
            noticeKey: null,
            messageType: "info"
        };
    }

    function buildReviewItems(userAnswers, currentIndex, responseIntent = []) {
        return userAnswers.map((answer, index) => ({
            index,
            label: String(index + 1),
            stateClassName: index === currentIndex
                ? "review-index-current"
                : answer === null && !isDontKnow(responseIntent, index)
                    ? "review-index-skipped"
                    : "review-index-answered"
        }));
    }

    const QuestionFlow = {
        isQuestionComplete,
        findFirstSkippedIndex,
        getNextButtonView,
        normalizeRestoredSession,
        resolveRenderTarget,
        resolveSkipAction,
        resolveNextAction,
        buildReviewItems
    };

    global.QuestionFlow = QuestionFlow;

    if (typeof module !== "undefined" && module.exports) {
        module.exports = QuestionFlow;
    }
})(typeof window !== "undefined" ? window : globalThis);
