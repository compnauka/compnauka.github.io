const test = require("node:test");
const assert = require("node:assert/strict");

const appConfig = require("../app-config.js");
const uiStrings = require("../ui-strings.js");
const QuizCore = require("../quiz-core.js");
const { questionBank } = require("../questions.js");

test("grade 2 avoids technical programming terminology", () => {
    const forbiddenPatterns = [
        /�����(�|�)\s+���(�|�)/i,
        /����� ����������/i,
        /������� ���������/i
    ];

    questionBank["2"].forEach((question, index) => {
        const combined = [question.q, question.concept, question.explanation, ...question.options].join(" ");
        forbiddenPatterns.forEach(pattern => {
            assert.equal(
                pattern.test(combined),
                false,
                `grade 2, question ${index + 1} contains forbidden pattern: ${pattern}`
            );
        });
    });
});

test("grade 3 avoids direct programming framing", () => {
    const forbiddenPatterns = [
        /[A-Za-z�-��-���������]+_[A-Za-z�-��-���������]+/,
        /��� �����/i,
        /���� �� ����� ���/i,
        /\b������(�|�)\b/i,
        /\bwhile\b/i
    ];

    questionBank["3"].forEach((question, index) => {
        const combined = [question.q, question.concept, question.explanation, ...question.options].join(" ");
        forbiddenPatterns.forEach(pattern => {
            assert.equal(
                pattern.test(combined),
                false,
                `grade 3, question ${index + 1} contains forbidden pattern: ${pattern}`
            );
        });
    });
});

test("questions avoid gendered second-person masculine verb forms", () => {
    const forbiddenPatterns = [
        /\b��\s+������\b/i,
        /\b��\s+������\b/i,
        /\b��\s+������\b/i,
        /\b��\s+������\b/i,
        /\b��\s+����\b/i,
        /\b��\s+�������\b/i,
        /\b��\s+�����\b/i,
        /\b��\s+���������\b/i
    ];

    Object.entries(questionBank).forEach(([grade, questions]) => {
        questions.forEach((question, index) => {
            const combined = [question.q, ...question.options].join(" ");
            forbiddenPatterns.forEach(pattern => {
                assert.equal(
                    pattern.test(combined),
                    false,
                    `grade ${grade}, question ${index + 1} contains gendered form: ${pattern}`
                );
            });
        });
    });
});

test("each grade has enough core questions to assemble a stable quiz", () => {
    Object.entries(questionBank).forEach(([grade, questions]) => {
        const coreQuestions = questions.filter(question => question.isCore);
        assert.ok(
            coreQuestions.length >= appConfig.requiredConceptRootsByGrade[grade].length,
            `grade ${grade} should have at least one core question for each required root`
        );
    });
});

test("revised questions are explicitly marked as revised and extension content stays non-core", () => {
    Object.entries(questionBank).forEach(([grade, questions]) => {
        questions.forEach((question, index) => {
            if (question.reviewStatus === appConfig.questionReviewStatus.extension) {
                assert.equal(
                    question.isCore,
                    false,
                    `grade ${grade}, question ${index + 1} is extension content and must not be marked core`
                );
            }
        });
    });
});

test("selection contract still respects required roots after content edits", () => {
    Object.keys(questionBank).forEach(grade => {
        const selected = QuizCore.selectQuestionsForGrade(
            questionBank,
            grade,
            appConfig.getQuestionsPerQuizForGrade(grade),
            () => 0.25
        );
        const selectedRoots = new Set(selected.map(question => QuizCore.getConceptRoot(question)));

        appConfig.requiredConceptRootsByGrade[grade].forEach(root => {
            assert.equal(selectedRoots.has(root), true, `grade ${grade} should include root ${root}`);
        });
    });
});

test("difficulty progression rises from grade 2 to grade 4", () => {
    const order = appConfig.questionDifficultyOrder;
    const gradeAverages = Object.fromEntries(
        Object.entries(questionBank).map(([grade, questions]) => {
            const total = questions.reduce((sum, question) => sum + order[question.difficulty], 0);
            return [grade, total / questions.length];
        })
    );

    assert.ok(gradeAverages["2"] < gradeAverages["3"], "grade 3 should be harder on average than grade 2");
    assert.ok(gradeAverages["3"] < gradeAverages["4"], "grade 4 should be harder on average than grade 3");
});

test("progression bands rise from grade 2 to grade 4", () => {
    const order = appConfig.questionProgressionBandOrder;
    const gradeAverages = Object.fromEntries(
        Object.entries(questionBank).map(([grade, questions]) => {
            const total = questions.reduce((sum, question) => sum + order[question.progressionBand], 0);
            return [grade, total / questions.length];
        })
    );

    assert.ok(gradeAverages["2"] < gradeAverages["3"], "grade 3 should require more than recognition on average");
    assert.ok(gradeAverages["3"] < gradeAverages["4"], "grade 4 should require more reasoning on average");
});

test("grade 3 contains bridge items and grade 4 contains stretch items", () => {
    const grade3Difficulties = new Set(questionBank["3"].map(question => question.difficulty));
    const grade4Difficulties = new Set(questionBank["4"].map(question => question.difficulty));

    assert.equal(grade3Difficulties.has(appConfig.questionDifficulty.foundational), true, "grade 3 should include some bridge items");
    assert.equal(grade3Difficulties.has(appConfig.questionDifficulty.developing), true, "grade 3 should include target-level items");
    assert.equal(grade4Difficulties.has(appConfig.questionDifficulty.developing), true, "grade 4 should include some bridge items");
    assert.equal(grade4Difficulties.has(appConfig.questionDifficulty.advanced), true, "grade 4 should include stretch items");
});

test("core concept ladders keep a non-decreasing progression band across grades", () => {
    const order = appConfig.questionProgressionBandOrder;
    const rootsByGrade = new Map();

    Object.entries(questionBank).forEach(([grade, questions]) => {
        questions.filter(question => question.isCore).forEach(question => {
            const root = QuizCore.getConceptRoot(question);
            if (!rootsByGrade.has(root)) {
                rootsByGrade.set(root, new Map());
            }
            const gradeMap = rootsByGrade.get(root);
            const current = gradeMap.get(grade) || [];
            current.push(order[question.progressionBand]);
            gradeMap.set(grade, current);
        });
    });

    rootsByGrade.forEach((gradeMap, root) => {
        const grade2Max = Math.max(...(gradeMap.get("2") || [0]));
        const grade3Max = Math.max(...(gradeMap.get("3") || [0]));
        const grade4Max = Math.max(...(gradeMap.get("4") || [0]));

        if (grade2Max && grade3Max) {
            assert.ok(grade2Max <= grade3Max, `root ${root} should not get easier from grade 2 to grade 3`);
        }

        if (grade3Max && grade4Max) {
            assert.ok(grade3Max <= grade4Max, `root ${root} should not get easier from grade 3 to grade 4`);
        }
    });
});


test("ui strings avoid placeholder question marks", () => {
    function assertCleanStrings(value, path) {
        if (typeof value === "string") {
            assert.doesNotMatch(value, /\?{3,}/u, path);
            return;
        }

        if (Array.isArray(value)) {
            value.forEach((item, index) => assertCleanStrings(item, `${path}[${index}]`));
            return;
        }

        if (value && typeof value === "object") {
            Object.entries(value).forEach(([key, nestedValue]) => {
                assertCleanStrings(nestedValue, path ? `${path}.${key}` : key);
            });
        }
    }

    assertCleanStrings(uiStrings, "uiStrings");
});
