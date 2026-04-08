(function (global) {
    const config = global.appConfig || (typeof require === "function" ? require("./app-config.js") : null);

    function cloneArray(items) {
        return Array.isArray(items) ? [...items] : [];
    }

    function uniqueStrings(items) {
        return [...new Set(cloneArray(items).map(item => String(item).trim()).filter(Boolean))];
    }

    function shuffleArray(items, rng = Math.random) {
        const copy = cloneArray(items);

        for (let index = copy.length - 1; index > 0; index -= 1) {
            const randomIndex = Math.floor(rng() * (index + 1));
            [copy[index], copy[randomIndex]] = [copy[randomIndex], copy[index]];
        }

        return copy;
    }

    function normalizeConcept(concept) {
        return String(concept || "")
            .split("(")[0]
            .split("/")[0]
            .trim();
    }

    function normalizeConceptKey(concept) {
        const transliterationMap = {
            а: "a", б: "b", в: "v", г: "h", ґ: "g", д: "d", е: "e", є: "ie", ж: "zh", з: "z", и: "y", і: "i", ї: "i", й: "i",
            к: "k", л: "l", м: "m", н: "n", о: "o", п: "p", р: "r", с: "s", т: "t", у: "u", ф: "f", х: "kh", ц: "ts", ч: "ch",
            ш: "sh", щ: "shch", ь: "", ю: "iu", я: "ia"
        };

        const normalized = normalizeConcept(concept)
            .toLowerCase()
            .replace(/[\/\\]+/g, " ")
            .replace(/['’`"]/g, "")
            .replace(/[^\p{L}\p{N}\s-]+/gu, " ")
            .trim();

        return [...normalized]
            .map(char => transliterationMap[char] !== undefined ? transliterationMap[char] : char)
            .join("")
            .replace(/\s+/g, "-")
            .replace(/-+/g, "-")
            .replace(/^-|-$/g, "");
    }

    function getConceptLabel(question) {
        if (question && typeof question.conceptLabel === "string" && question.conceptLabel.trim()) {
            return question.conceptLabel.trim();
        }

        return normalizeConcept(question ? question.concept : "");
    }

    function getConceptKey(question, fallbackIndex = 0) {
        if (question && typeof question.conceptKey === "string" && question.conceptKey.trim()) {
            return question.conceptKey.trim().toLowerCase();
        }

        return normalizeConceptKey(question ? question.concept : "") || `concept-${fallbackIndex}`;
    }

    function getConceptRootFromKey(conceptKey) {
        const normalizedKey = String(conceptKey || "").trim().toLowerCase();
        return normalizedKey.split("-")[0] || normalizedKey;
    }

    function getConceptRoot(question, fallbackIndex = 0) {
        return getConceptRootFromKey(getConceptKey(question, fallbackIndex));
    }

    function inferSkill(question, fallbackIndex = 0) {
        const root = getConceptRoot(question, fallbackIndex);
        const skillMap = {
            alhorytmy: "algorithmic-thinking",
            dekompozytsiia: "decomposition",
            abstrahuvannia: "abstraction",
            rozpiznavannia: "pattern-recognition",
            povtorennia: "iteration",
            lohichne: "logic",
            efektyvnist: "efficiency",
            klasyfikatsiia: "classification",
            nalahodzhennia: "debugging",
            informatsiia: "information-handling",
            dani: "data-handling",
            testuvannia: "testing",
            modulnist: "modularity",
            otsiniuvannia: "evaluation",
            komandna: "collaboration",
            refleksiia: "reflection",
            uzahalnennia: "generalization"
        };

        return skillMap[root] || "computational-thinking";
    }

    function inferDifficulty(grade) {
        if (grade === "2" && config && config.questionDifficulty) {
            return config.questionDifficulty.foundational;
        }

        if (grade === "3" && config && config.questionDifficulty) {
            return config.questionDifficulty.developing;
        }

        return config && config.questionDifficulty
            ? config.questionDifficulty.advanced
            : "advanced";
    }

    function getQuestionLimitForGrade(grade, limitOverride) {
        if (Number.isInteger(limitOverride) && limitOverride > 0) {
            return limitOverride;
        }

        if (limitOverride && typeof limitOverride === "object") {
            const mappedLimit = limitOverride[String(grade)];
            if (Number.isInteger(mappedLimit) && mappedLimit > 0) {
                return mappedLimit;
            }
        }

        if (config && typeof config.getQuestionsPerQuizForGrade === "function") {
            return config.getQuestionsPerQuizForGrade(grade);
        }

        if (config && Number.isInteger(config.questionsPerQuiz) && config.questionsPerQuiz > 0) {
            return config.questionsPerQuiz;
        }

        return 10;
    }

    function enrichQuestion(question, grade, index) {
        const conceptKey = getConceptKey(question, index);
        const conceptRoot = getConceptRootFromKey(conceptKey);
        const requiredRoots = config && config.requiredConceptRootsByGrade
            ? config.requiredConceptRootsByGrade[String(grade)] || []
            : [];

        return {
            ...question,
            id: question.id || `${grade}-${index + 1}`,
            conceptKey,
            conceptLabel: getConceptLabel(question),
            conceptRoot,
            skill: typeof question.skill === "string" && question.skill.trim()
                ? question.skill.trim()
                : inferSkill(question, index),
            difficulty: typeof question.difficulty === "string" && question.difficulty.trim()
                ? question.difficulty.trim()
                : inferDifficulty(String(grade)),
            isCore: typeof question.isCore === "boolean"
                ? question.isCore
                : requiredRoots.includes(conceptRoot),
            reviewStatus: typeof question.reviewStatus === "string" && question.reviewStatus.trim()
                ? question.reviewStatus.trim()
                : (config && config.questionReviewStatus ? config.questionReviewStatus.approved : "approved"),
            distractorQuality: typeof question.distractorQuality === "string" && question.distractorQuality.trim()
                ? question.distractorQuality.trim()
                : (config && config.distractorQuality ? config.distractorQuality.medium : "medium")
        };
    }

    function createOptionOrder(optionCount, rng = Math.random) {
        return shuffleArray(Array.from({ length: optionCount }, (_, index) => index), rng);
    }

    function buildConceptBuckets(questions) {
        return questions.reduce((buckets, question, index) => {
            const bucketKey = getConceptKey(question, index);
            if (!buckets.has(bucketKey)) {
                buckets.set(bucketKey, []);
            }

            buckets.get(bucketKey).push(question);
            return buckets;
        }, new Map());
    }

    function buildRootBuckets(questions) {
        return questions.reduce((buckets, question, index) => {
            const rootKey = getConceptRoot(question, index);
            if (!buckets.has(rootKey)) {
                buckets.set(rootKey, []);
            }

            buckets.get(rootKey).push(question);
            return buckets;
        }, new Map());
    }

    function selectQuestionsForGrade(questionBank, grade, limit, rng = Math.random) {
        const questions = cloneArray(questionBank[grade]).map((question, index) => enrichQuestion(question, grade, index));

        if (!questions.length) {
            throw new Error(`No questions found for grade "${grade}".`);
        }

        if (questions.length < limit) {
            throw new Error(`Not enough questions for grade "${grade}" to build a ${limit}-question quiz.`);
        }

        const buckets = buildConceptBuckets(questions);
        const rootBuckets = buildRootBuckets(questions);
        const requiredRoots = cloneArray(
            config && config.requiredConceptRootsByGrade
                ? config.requiredConceptRootsByGrade[String(grade)] || []
                : []
        );
        const conceptKeys = shuffleArray([...buckets.keys()], rng);
        const selected = [];
        const selectedIds = new Set();
        const selectedPerConcept = new Map();
        const selectedPerRoot = new Map();

        shuffleArray(requiredRoots, rng).forEach(root => {
            if (selected.length >= limit || !rootBuckets.has(root)) {
                return;
            }

            const candidates = shuffleArray(
                rootBuckets.get(root).filter(question => !selectedIds.has(question.id)),
                rng
            );

            if (!candidates[0]) {
                return;
            }

            const picked = candidates[0];
            const conceptKey = getConceptKey(picked);
            selected.push(picked);
            selectedIds.add(picked.id);
            selectedPerConcept.set(conceptKey, (selectedPerConcept.get(conceptKey) || 0) + 1);
            selectedPerRoot.set(root, (selectedPerRoot.get(root) || 0) + 1);
        });

        conceptKeys.forEach(key => {
            if (selected.length >= limit) {
                return;
            }

            const candidates = shuffleArray(
                buckets.get(key).filter(question => !selectedIds.has(question.id)),
                rng
            );
            if (candidates[0]) {
                const picked = candidates[0];
                const conceptRoot = getConceptRoot(picked);
                selected.push(picked);
                selectedIds.add(picked.id);
                selectedPerConcept.set(key, (selectedPerConcept.get(key) || 0) + 1);
                selectedPerRoot.set(conceptRoot, (selectedPerRoot.get(conceptRoot) || 0) + 1);
            }
        });

        if (selected.length < limit) {
            const leftovers = shuffleArray(
                questions.filter(question => !selectedIds.has(question.id)),
                rng
            );

            leftovers.forEach(question => {
                if (selected.length >= limit) {
                    return;
                }

                const conceptKey = getConceptKey(question);
                const currentCount = selectedPerConcept.get(conceptKey) || 0;
                if (currentCount >= 2) {
                    return;
                }

                selected.push(question);
                selectedIds.add(question.id);
                selectedPerConcept.set(conceptKey, currentCount + 1);
                const conceptRoot = getConceptRoot(question);
                selectedPerRoot.set(conceptRoot, (selectedPerRoot.get(conceptRoot) || 0) + 1);
            });

            // If we still have fewer questions (rare), fill the rest without the soft cap.
            if (selected.length < limit) {
                leftovers.forEach(question => {
                    if (selected.length >= limit || selectedIds.has(question.id)) {
                        return;
                    }
                    selected.push(question);
                    selectedIds.add(question.id);
                });
            }
        }

        return shuffleArray(selected.slice(0, limit), rng).map(question => ({
            ...question,
            optionOrder: Array.isArray(question.optionOrder) && question.optionOrder.length === question.options.length
                ? [...question.optionOrder]
                : createOptionOrder(question.options.length, rng)
        }));
    }

    function scoreQuiz(selectedQuestions, userAnswers) {
        return selectedQuestions.reduce((score, question, index) => {
            return score + (userAnswers[index] === question.correct ? 1 : 0);
        }, 0);
    }

    function buildConceptSummary(selectedQuestions, userAnswers) {
        const summary = new Map();
        const strongEvidenceThreshold = config && Number.isInteger(config.minimumStrongEvidencePerConcept)
            ? config.minimumStrongEvidencePerConcept
            : 2;

        selectedQuestions.forEach((question, index) => {
            const conceptKey = getConceptKey(question, index);
            const conceptRoot = getConceptRoot(question, index);
            const conceptLabel = getConceptLabel(question);
            const current = summary.get(conceptRoot) || {
                concept: conceptLabel,
                conceptKey: conceptRoot,
                conceptRoot,
                conceptKeys: [],
                total: 0,
                correct: 0
            };

            if (!current.conceptKeys.includes(conceptKey)) {
                current.conceptKeys.push(conceptKey);
            }
            current.total += 1;
            if (userAnswers[index] === question.correct) {
                current.correct += 1;
            }

            summary.set(conceptRoot, current);
        });

        const items = [...summary.values()];
        items.forEach(item => {
            item.hasStrongEvidence = item.total >= strongEvidenceThreshold;
            item.signal = item.hasStrongEvidence
                ? item.correct === item.total
                    ? "strong"
                    : item.correct > 0
                        ? "mixed"
                        : "needs-practice"
                : "preliminary";
        });

        return {
            all: uniqueStrings(items.map(item => item.concept)),
            mastered: items
                .filter(item => item.hasStrongEvidence && item.correct === item.total)
                .map(item => item.concept)
                .filter((concept, index, list) => list.indexOf(concept) === index),
            needsPractice: items
                .filter(item => item.hasStrongEvidence && item.correct < item.total)
                .map(item => item.concept)
                .filter((concept, index, list) => list.indexOf(concept) === index),
            observed: items
                .filter(item => !item.hasStrongEvidence)
                .map(item => item.concept)
                .filter((concept, index, list) => list.indexOf(concept) === index),
            stats: items
        };
    }

    function validateQuestion(question, grade, index) {
        const errors = [];
        const path = `grade ${grade}, question ${index + 1}`;

        if (!question || typeof question !== "object") {
            return [`${path}: question must be an object`];
        }

        ["id", "q", "concept", "conceptKey", "conceptLabel", "explanation", "skill", "difficulty", "reviewStatus", "distractorQuality"].forEach(field => {
            if (typeof question[field] !== "string" || !question[field].trim()) {
                errors.push(`${path}: missing non-empty "${field}"`);
            }
        });

        if (typeof question.conceptKey === "string" && question.conceptKey.trim()) {
            if (!/^[a-z0-9-]+$/.test(question.conceptKey.trim())) {
                errors.push(`${path}: "conceptKey" must use latin kebab-case`);
            }
        }

        if (typeof question.isCore !== "boolean") {
            errors.push(`${path}: "isCore" must be boolean`);
        }

        if (!Array.isArray(question.options) || question.options.length !== 4) {
            errors.push(`${path}: must have exactly 4 answer options`);
        } else {
            question.options.forEach((option, optionIndex) => {
                if (typeof option !== "string" || !option.trim()) {
                    errors.push(`${path}: option ${optionIndex + 1} must be a non-empty string`);
                }
            });

            const uniqueOptions = new Set(question.options.map(option => option.trim()));
            if (uniqueOptions.size !== question.options.length) {
                errors.push(`${path}: answer options must be unique`);
            }
        }

        if (!Number.isInteger(question.correct) || question.correct < 0 || question.correct > 3) {
            errors.push(`${path}: "correct" must be an integer from 0 to 3`);
        }

        return errors;
    }

    function validateQuestionBank(questionBank, limitPerQuiz) {
        const errors = [];

        Object.entries(questionBank).forEach(([grade, questions]) => {
            const limitForGrade = getQuestionLimitForGrade(grade, limitPerQuiz);

            if (!Array.isArray(questions) || !questions.length) {
                errors.push(`grade ${grade}: question list is empty`);
                return;
            }

            if (questions.length < limitForGrade) {
                errors.push(`grade ${grade}: has only ${questions.length} questions, needs at least ${limitForGrade}`);
            }

            const requiredRoots = config && config.requiredConceptRootsByGrade
                ? config.requiredConceptRootsByGrade[String(grade)] || []
                : [];
            const enrichedQuestions = questions.map((question, index) => enrichQuestion(question, grade, index));

            enrichedQuestions.forEach((question, index) => {
                errors.push(...validateQuestion(question, grade, index));
            });

            const presentRoots = new Set(enrichedQuestions.filter(question => question.isCore).map(question => question.conceptRoot));
            requiredRoots.forEach(root => {
                if (!presentRoots.has(root)) {
                    errors.push(`grade ${grade}: missing required concept root "${root}"`);
                }
            });
        });

        return errors;
    }

    const QuizCore = {
        shuffleArray,
        normalizeConcept,
        normalizeConceptKey,
        getConceptRootFromKey,
        getConceptRoot,
        enrichQuestion,
        getQuestionLimitForGrade,
        selectQuestionsForGrade,
        scoreQuiz,
        buildConceptSummary,
        validateQuestionBank
    };

    global.QuizCore = QuizCore;

    if (typeof module !== "undefined" && module.exports) {
        module.exports = QuizCore;
    }
})(typeof window !== "undefined" ? window : globalThis);
