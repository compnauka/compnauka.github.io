(function (global) {
    const config = global.appConfig || (typeof require === "function" ? require("./app-config.js") : null);

    if (!config || typeof config.storageKey !== "string" || !Number.isInteger(config.questionBankVersion)) {
        throw new Error("app-config.js is missing or invalid. Expected storageKey and questionBankVersion.");
    }

    function canUseStorage(storage) {
        return Boolean(storage && typeof storage.getItem === "function" && typeof storage.setItem === "function" && typeof storage.removeItem === "function");
    }

    function createSnapshot(state) {
        return {
            questionBankVersion: config.questionBankVersion,
            savedAt: new Date().toISOString(),
            currentGrade: state.currentGrade,
            selectedQuestions: Array.isArray(state.selectedQuestions) ? state.selectedQuestions : [],
            currentQuestionIndex: Number.isInteger(state.currentQuestionIndex) ? state.currentQuestionIndex : 0,
            userAnswers: Array.isArray(state.userAnswers) ? state.userAnswers : []
        };
    }

    function saveStateSnapshot(storage, state) {
        if (!canUseStorage(storage)) {
            return false;
        }

        try {
            storage.setItem(config.storageKey, JSON.stringify(createSnapshot(state)));
            return true;
        } catch (error) {
            return false;
        }
    }

    function clearStateSnapshot(storage) {
        if (!canUseStorage(storage)) {
            return false;
        }

        try {
            storage.removeItem(config.storageKey);
            return true;
        } catch (error) {
            return false;
        }
    }

    function loadStateSnapshot(storage) {
        if (!canUseStorage(storage)) {
            return null;
        }

        try {
            const rawState = storage.getItem(config.storageKey);
            if (!rawState) {
                return null;
            }

            const snapshot = JSON.parse(rawState);
            if (
                !snapshot
                || !Number.isInteger(snapshot.questionBankVersion)
                || snapshot.questionBankVersion !== config.questionBankVersion
            ) {
                clearStateSnapshot(storage);
                return null;
            }

            return snapshot;
        } catch (error) {
            clearStateSnapshot(storage);
            return null;
        }
    }

    const QuizStorage = {
        canUseStorage,
        createSnapshot,
        saveStateSnapshot,
        clearStateSnapshot,
        loadStateSnapshot
    };

    global.QuizStorage = QuizStorage;

    if (typeof module !== "undefined" && module.exports) {
        module.exports = QuizStorage;
    }
})(typeof window !== "undefined" ? window : globalThis);
