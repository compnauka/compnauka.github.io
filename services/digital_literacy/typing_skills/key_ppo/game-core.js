(function (global) {
    const sharedWordCollections =
        global.WORD_COLLECTIONS ||
        (typeof module !== "undefined" && module.exports && require("./words-data.js").WORD_COLLECTIONS);

    const WORD_COLLECTIONS = sharedWordCollections || {};
    const DIRECTION_OPTIONS = ["ltr", "rtl"];

    function flattenWordCollections(collections) {
        return Object.values(collections).flatMap((category) => category.words);
    }

    function getWordPool(selection) {
        if (!selection || selection === "mixed") {
            return flattenWordCollections(WORD_COLLECTIONS);
        }

        return WORD_COLLECTIONS[selection] ? [...WORD_COLLECTIONS[selection].words] : flattenWordCollections(WORD_COLLECTIONS);
    }

    function pickRandomEntry(pool, recentEntries = [], randomFn = Math.random) {
        if (!Array.isArray(pool) || pool.length === 0) {
            return null;
        }

        const blocked = new Set(recentEntries);
        let candidates = pool.filter((entry) => !blocked.has(entry));

        if (candidates.length === 0) {
            candidates = pool.slice();
        }

        const index = Math.floor(randomFn() * candidates.length);
        return candidates[index];
    }

    function pushRecentEntry(history, value, limit) {
        const next = Array.isArray(history) ? history.slice() : [];
        next.push(value);
        while (next.length > limit) {
            next.shift();
        }
        return next;
    }

    function normalizeDirectionSetting(value) {
        return DIRECTION_OPTIONS.includes(value) ? value : "ltr";
    }

    function resolveEnemyDirection(setting) {
        return normalizeDirectionSetting(setting);
    }

    function getSpawnState(direction, viewportWidth, tuning, speed) {
        const normalizedDirection = normalizeDirectionSetting(direction);
        const fromLeft = normalizedDirection === "ltr";
        const startX = fromLeft ? tuning.spawnStartX : viewportWidth + tuning.spawnEndOffset;

        return {
            direction: normalizedDirection,
            startX,
            velocityX: fromLeft ? speed : -speed
        };
    }

    function getThreatDistance(enemy, viewportWidth, tuning) {
        const direction = normalizeDirectionSetting(enemy.direction);

        if (direction === "rtl") {
            return enemy.x - tuning.wallOffset;
        }

        return (viewportWidth - tuning.wallOffset) - enemy.x;
    }

    function compareEnemiesByThreat(a, b, viewportWidth, tuning) {
        return getThreatDistance(a, viewportWidth, tuning) - getThreatDistance(b, viewportWidth, tuning);
    }

    function hasEnemyReachedWall(enemy, viewportWidth, tuning) {
        const direction = normalizeDirectionSetting(enemy.direction);

        if (direction === "rtl") {
            return enemy.x <= tuning.wallOffset;
        }

        return enemy.x >= viewportWidth - tuning.wallOffset - tuning.wallHitOffset;
    }

    function getLaserOrigin(direction, viewportWidth, viewportHeight) {
        if (normalizeDirectionSetting(direction) === "rtl") {
            return { x: 0, y: viewportHeight };
        }

        return { x: viewportWidth, y: viewportHeight };
    }

    const GameCore = {
        WORD_COLLECTIONS,
        WORDS_DB: flattenWordCollections(WORD_COLLECTIONS),
        DIRECTION_OPTIONS,
        getWordPool,
        pickRandomEntry,
        pushRecentEntry,
        normalizeDirectionSetting,
        resolveEnemyDirection,
        getSpawnState,
        getThreatDistance,
        compareEnemiesByThreat,
        hasEnemyReachedWall,
        getLaserOrigin
    };

    if (typeof module !== "undefined" && module.exports) {
        module.exports = GameCore;
    }

    global.GameCore = GameCore;
})(typeof window !== "undefined" ? window : globalThis);
