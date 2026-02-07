import { App } from './appCore.js';

document.addEventListener('DOMContentLoaded', () => {
    // Створюємо екземпляр додатку та запускаємо його
    const app = new App();
    
    // Робимо app доступним глобально для дебагу (опціонально)
    window.app = app;
    
    app.init().catch(err => console.error("Fatal app error:", err));
});
