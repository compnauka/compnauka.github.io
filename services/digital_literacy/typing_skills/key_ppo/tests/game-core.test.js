const test = require('node:test');
const assert = require('node:assert/strict');

const {
    WORD_COLLECTIONS,
    WORDS_DB,
    DIRECTION_OPTIONS,
    getWordPool,
    pickRandomEntry,
    pushRecentEntry,
    normalizeDirectionSetting,
    getSpawnState,
    compareEnemiesByThreat,
    hasEnemyReachedWall,
    getLaserOrigin
} = require('../game-core.js');

const tuning = {
    spawnStartX: -150,
    spawnEndOffset: 150,
    wallOffset: 80,
    wallHitOffset: 40
};

test('word collections are large, unique, and uppercase Ukrainian', () => {
    assert.equal(Object.keys(WORD_COLLECTIONS).length >= 6, true);
    assert.equal(WORDS_DB.length >= 300, true);
    assert.equal(new Set(WORDS_DB).size, WORDS_DB.length);

    for (const word of WORDS_DB) {
        assert.match(word, /^[А-ЯІЇЄҐ]+$/u, `Unexpected word format: ${word}`);
    }
});

test('mixed pool includes all categories and specific pool stays scoped', () => {
    const mixed = getWordPool('mixed');
    const nature = getWordPool('nature');

    assert.equal(mixed.length, WORDS_DB.length);
    assert.deepEqual(nature, WORD_COLLECTIONS.nature.words);
    assert.equal(nature.includes('УКРАЇНА'), false);
    assert.equal(getWordPool('unknown').length, WORDS_DB.length);
});

test('random picker avoids recent repeats when alternatives exist', () => {
    const pool = ['А', 'Б', 'В'];
    assert.equal(pickRandomEntry(pool, ['А', 'Б'], () => 0), 'В');
    assert.equal(pickRandomEntry(['А'], ['А'], () => 0), 'А');
    assert.deepEqual(pushRecentEntry(['А', 'Б'], 'В', 2), ['Б', 'В']);
});

test('direction helpers normalize settings and calculate spawn position', () => {
    assert.deepEqual(DIRECTION_OPTIONS, ['ltr', 'rtl']);
    assert.equal(normalizeDirectionSetting('rtl'), 'rtl');
    assert.equal(normalizeDirectionSetting('bad-value'), 'ltr');

    const ltrSpawn = getSpawnState('ltr', 1200, tuning, 100);
    const rtlSpawn = getSpawnState('rtl', 1200, tuning, 100);

    assert.deepEqual(ltrSpawn, { direction: 'ltr', startX: -150, velocityX: 100 });
    assert.deepEqual(rtlSpawn, { direction: 'rtl', startX: 1350, velocityX: -100 });
});

test('threat sorting prefers enemies closest to the active wall', () => {
    const viewportWidth = 1200;
    const ltrEnemies = [
        { x: 100, direction: 'ltr' },
        { x: 900, direction: 'ltr' }
    ];
    const rtlEnemies = [
        { x: 1000, direction: 'rtl' },
        { x: 120, direction: 'rtl' }
    ];

    ltrEnemies.sort((a, b) => compareEnemiesByThreat(a, b, viewportWidth, tuning));
    rtlEnemies.sort((a, b) => compareEnemiesByThreat(a, b, viewportWidth, tuning));

    assert.equal(ltrEnemies[0].x, 900);
    assert.equal(rtlEnemies[0].x, 120);
});

test('wall hit and laser origin depend on movement direction', () => {
    assert.equal(hasEnemyReachedWall({ x: 1081, direction: 'ltr' }, 1200, tuning), true);
    assert.equal(hasEnemyReachedWall({ x: 79, direction: 'rtl' }, 1200, tuning), true);
    assert.equal(hasEnemyReachedWall({ x: 600, direction: 'ltr' }, 1200, tuning), false);

    assert.deepEqual(getLaserOrigin('ltr', 1200, 800), { x: 1200, y: 800 });
    assert.deepEqual(getLaserOrigin('rtl', 1200, 800), { x: 0, y: 800 });
});
