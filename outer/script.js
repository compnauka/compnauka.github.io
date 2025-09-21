document.addEventListener('DOMContentLoaded', function() {
    const categoryGrid = document.getElementById('category-grid');
    if (categoryGrid) {
        // Підрахунок категорій
        const categories = categoryGrid.getElementsByClassName('category-card');
        const categoryCount = categories.length;
        const categoryCountEl = document.getElementById('category-count');
        if (categoryCountEl) {
            categoryCountEl.textContent = categoryCount;
        }

        // Підрахунок інструментів
        let toolCount = 0;
        const softwareLists = categoryGrid.getElementsByClassName('software-list');
        for (let i = 0; i < softwareLists.length; i++) {
            toolCount += softwareLists[i].getElementsByTagName('li').length;
        }
        const toolCountEl = document.getElementById('tool-count');
        if (toolCountEl) {
            toolCountEl.textContent = toolCount;
        }
    }
});
