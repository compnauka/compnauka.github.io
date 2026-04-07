const test = require("node:test");
const assert = require("node:assert/strict");

const { questionBank } = require("../questions.js");

test("each grade has no duplicate question stems", () => {
    Object.entries(questionBank).forEach(([grade, questions]) => {
        const stems = questions.map(question => question.q.trim());
        const unique = new Set(stems);
        assert.equal(unique.size, stems.length, `grade ${grade} has duplicate question text`);
    });
});

test("each explanation differs from the question text", () => {
    Object.entries(questionBank).forEach(([grade, questions]) => {
        questions.forEach((question, index) => {
            assert.notEqual(
                question.q.trim(),
                question.explanation.trim(),
                `grade ${grade}, question ${index + 1} repeats question text as explanation`
            );
        });
    });
});

test("each question includes normalized concept and editorial metadata", () => {
    Object.entries(questionBank).forEach(([grade, questions]) => {
        questions.forEach((question, index) => {
            ["id", "conceptKey", "conceptLabel", "skill", "difficulty", "progressionBand", "reviewStatus", "distractorQuality"].forEach(field => {
                assert.equal(typeof question[field], "string", `grade ${grade}, question ${index + 1} missing ${field}`);
                assert.ok(question[field].trim().length > 0, `grade ${grade}, question ${index + 1} has empty ${field}`);
            });
            assert.equal(typeof question.isCore, "boolean", `grade ${grade}, question ${index + 1} missing isCore`);
        });
    });
});

function buildIntentSignature(questionText) {
    return questionText
        .toLowerCase()
        .replace(/[^\p{L}\p{N}\s]/gu, " ")
        .replace(/\s+/g, " ")
        .trim()
        .split(" ")
        .slice(0, 7)
        .join(" ");
}

test("each grade avoids heavy duplication of question intent", () => {
    Object.entries(questionBank).forEach(([grade, questions]) => {
        const signatureCounts = new Map();

        questions.forEach(question => {
            const signature = buildIntentSignature(question.q || "");
            if (!signature) {
                return;
            }

            signatureCounts.set(signature, (signatureCounts.get(signature) || 0) + 1);
        });

        const overloaded = [...signatureCounts.entries()]
            .filter(([, count]) => count >= 3)
            .map(([signature, count]) => `"${signature}" (${count})`);

        assert.equal(
            overloaded.length,
            0,
            `grade ${grade} has repeated intent signatures: ${overloaded.join(", ")}`
        );
    });
});

test("each grade keeps concept-root coverage balanced", () => {
    Object.entries(questionBank).forEach(([grade, questions]) => {
        const rootCounts = new Map();

        questions.forEach(question => {
            const conceptKey = String(question.conceptKey || "").trim();
            const root = conceptKey.split("-")[0] || conceptKey;
            rootCounts.set(root, (rootCounts.get(root) || 0) + 1);
        });

        const uniqueRoots = rootCounts.size;
        const maxShare = Math.max(...[...rootCounts.values()].map(count => count / questions.length));

        assert.ok(uniqueRoots >= 8, `grade ${grade} should have at least 8 concept roots, got ${uniqueRoots}`);
        assert.ok(
            maxShare <= 0.4,
            `grade ${grade} is too imbalanced: one concept root covers ${(maxShare * 100).toFixed(1)}% of items`
        );
    });
});
