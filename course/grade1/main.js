(function () {
    const { applyTranslations } = window.APP_I18N || { applyTranslations: () => {} };
    const completed = safeReadJson('completedLessons');

    applyTranslations();

    Object.entries(completed).forEach(([lessonKey, isDone]) => {
        if (!isDone) {
            return;
        }

        const card = document.getElementById(`card-${lessonKey}`);
        if (card) {
            card.classList.add('is-completed');
        }
    });

    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('sw.js').catch(() => {
                // Ignore registration errors in unsupported or local preview contexts.
            });
        });
    }

    function safeReadJson(key) {
        try {
            return JSON.parse(localStorage.getItem(key) || '{}');
        } catch {
            return {};
        }
    }
})();
