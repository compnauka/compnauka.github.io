(function (global) {
    function findFirstSkippedIndex(userAnswers, excludedIndex = null) {
        return userAnswers.findIndex((answer, index) => answer === null && index !== excludedIndex);
    }

    function getNextButtonView(userAnswers, currentIndex, strings) {
        const hasAnswer = userAnswers[currentIndex] !== null;
        const allAnswered = userAnswers.every(answer => answer !== null);

        let label = strings.next;
        if (allAnswered) {
            label = strings.finish;
        } else if (currentIndex === userAnswers.length - 1) {
            label = strings.reviewSkipped;
        }

        return {
            disabled: !hasAnswer,
            label,
            hasAnswer,
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

        return {
            currentGrade: snapshot.currentGrade,
            selectedQuestions,
            currentQuestionIndex,
            userAnswers
        };
    }

    function resolveRenderTarget(selectedQuestionsLength, userAnswers, requestedIndex) {
        if (requestedIndex < selectedQuestionsLength) {
            return {
                type: "question",
                targetIndex: requestedIndex,
                noticeKey: null
            };
        }

        const firstSkippedIndex = findFirstSkippedIndex(userAnswers);
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

    function resolveSkipAction(userAnswers, currentIndex) {
        if (userAnswers[currentIndex] !== null) {
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

        const firstSkippedIndex = findFirstSkippedIndex(userAnswers, currentIndex);
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

    function resolveNextAction(userAnswers, currentIndex) {
        const currentAnswer = userAnswers[currentIndex];
        if (currentAnswer === null || currentAnswer === undefined) {
            return {
                type: "blocked",
                targetIndex: currentIndex,
                noticeKey: "answerRequiredNotice",
                messageType: "alert"
            };
        }

        const allAnswered = userAnswers.every(answer => answer !== null);
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

        const firstSkippedIndex = findFirstSkippedIndex(userAnswers);
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

    function buildReviewItems(userAnswers, currentIndex) {
        return userAnswers.map((answer, index) => ({
            index,
            label: String(index + 1),
            stateClassName: index === currentIndex
                ? "review-index-current"
                : answer === null
                    ? "review-index-skipped"
                    : "review-index-answered"
        }));
    }

    const QuestionFlow = {
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
