const test = require("node:test");
const assert = require("node:assert/strict");

const appConfig = require("../app-config.js");
const QuizStorage = require("../quiz-storage.js");

function createMockStorage(initialValue) {
    const store = new Map(initialValue ? [[appConfig.storageKey, initialValue]] : []);
    return {
        getItem(key) {
            return store.has(key) ? store.get(key) : null;
        },
        setItem(key, value) {
            store.set(key, value);
        },
        removeItem(key) {
            store.delete(key);
        },
        has(key) {
            return store.has(key);
        }
    };
}

test("createSnapshot keeps only the persisted quiz fields", () => {
    const snapshot = QuizStorage.createSnapshot({
        currentGrade: "3",
        selectedQuestions: [{ id: "q-1" }],
        currentQuestionIndex: 2,
        userAnswers: [1, null],
        score: 999
    });

    assert.deepEqual(snapshot, {
        questionBankVersion: appConfig.questionBankVersion,
        savedAt: snapshot.savedAt,
        currentGrade: "3",
        selectedQuestions: [{ id: "q-1" }],
        currentQuestionIndex: 2,
        userAnswers: [1, null]
    });
    assert.ok(typeof snapshot.savedAt === "string");
});

test("saveStateSnapshot writes serialized snapshot into storage", () => {
    const storage = createMockStorage();
    const didSave = QuizStorage.saveStateSnapshot(storage, {
        currentGrade: "2",
        selectedQuestions: [{ id: "q-1" }],
        currentQuestionIndex: 0,
        userAnswers: [null]
    });

    assert.equal(didSave, true);
    assert.match(storage.getItem(appConfig.storageKey), /"currentGrade":"2"/u);
});

test("loadStateSnapshot returns parsed snapshot when saved state is valid", () => {
    const storage = createMockStorage(JSON.stringify({
        questionBankVersion: appConfig.questionBankVersion,
        savedAt: "2026-04-07T00:00:00.000Z",
        currentGrade: "4",
        selectedQuestions: [{ id: "q-2" }],
        currentQuestionIndex: 1,
        userAnswers: [0, 1]
    }));

    assert.deepEqual(QuizStorage.loadStateSnapshot(storage), {
        questionBankVersion: appConfig.questionBankVersion,
        savedAt: "2026-04-07T00:00:00.000Z",
        currentGrade: "4",
        selectedQuestions: [{ id: "q-2" }],
        currentQuestionIndex: 1,
        userAnswers: [0, 1]
    });
});

test("loadStateSnapshot clears state with outdated questionBankVersion", () => {
    const storage = createMockStorage(JSON.stringify({
        questionBankVersion: appConfig.questionBankVersion - 1,
        currentGrade: "4",
        selectedQuestions: [{ id: "q-2" }],
        currentQuestionIndex: 1,
        userAnswers: [0, 1]
    }));

    assert.equal(QuizStorage.loadStateSnapshot(storage), null);
    assert.equal(storage.has(appConfig.storageKey), false);
});

test("loadStateSnapshot clears corrupted saved state", () => {
    const storage = createMockStorage("{broken-json");

    assert.equal(QuizStorage.loadStateSnapshot(storage), null);
    assert.equal(storage.has(appConfig.storageKey), false);
});

test("storage helpers fail safely when storage is unavailable", () => {
    assert.equal(QuizStorage.saveStateSnapshot(null, {}), false);
    assert.equal(QuizStorage.clearStateSnapshot(null), false);
    assert.equal(QuizStorage.loadStateSnapshot(null), null);
});
