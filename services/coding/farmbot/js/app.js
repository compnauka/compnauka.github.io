/**
 * Головний файл програми, запускає гру
 *
 * Основна точка входу для додатку. Тут створюються екземпляри
 * моделі гри (GameModel), відображення (GameView) та контролера (GameController).
 * Всі основні залежності підключаються через index.html.
 *
 * Після завантаження DOM сторінки, створюються об'єкти MVC і
 * гра готова до взаємодії з користувачем.
 */
document.addEventListener('DOMContentLoaded', () => {
  const isSeasonalThemeActive = (() => {
    const theme = CONFIG.SEASONAL_THEME;
    if (!theme || !theme.enabled) return false;

    const now = new Date();
    const start = new Date(theme.startDate);
    const end = new Date(theme.endDate);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      return false;
    }

    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
    return now >= start && now <= end;
  })();

  document.body.classList.toggle('seasonal-active', isSeasonalThemeActive);

  // Створення екземплярів моделі (логіка), відображення (DOM) та контролера (керування грою)
  const gameModel = new GameModel(); // Модель: зберігає стан гри, рівні, позиції, тощо
  const gameView = new GameView();   // Відображення: відповідає за оновлення DOM та UI
  const gameController = new GameController(gameModel, gameView); // Контролер: координує логіку та UI
  
  // Запуск гри відбувається автоматично через конструктор GameController
}); 
