/**
 * Клас моделі гри, що відповідає за логіку та стан гри
 *
 * Основні відповідальності:
 * - Зберігає всі дані про гру (позиція робота, предмети, стіни, рівень, прогрес)
 * - Реалізує логіку генерації поля, розміщення предметів, перевірки перемоги
 * - Працює з localStorage для збереження прогресу
 *
 * Важливо: не взаємодіє з DOM напряму, лише зберігає дані та надає методи для контролера
 */
class GameModel {
  constructor() {
    this.robotPosition = { x: 0, y: 0 }; // Поточна позиція робота
    this.collectibles = [];              // Масив предметів для збирання
    this.walls = [];                     // Масив стін
    this.isRunning = false;              // Чи виконується програма
    this.currentLevel = 1;               // Поточний рівень
    this.completedLevels = [];           // Пройдені рівні
    this.gridSize = 5;                   // Розмір поля
    this.gameConfig = {};                // Конфігурація поточного рівня
    
    // Завантаження збереженого прогресу
    this.loadProgress();
  }

  /**
   * Завантаження прогресу з localStorage
   * Якщо користувач вже проходив рівні — вони підвантажаться
   */
  loadProgress() {
    const saved = localStorage.getItem(CONFIG.STORAGE_KEYS.COMPLETED_LEVELS);
    if (saved) {
      this.completedLevels = JSON.parse(saved);
    }
  }

  /**
   * Збереження прогресу в localStorage
   * Викликається після завершення рівня
   */
  saveProgress() {
    localStorage.setItem(
      CONFIG.STORAGE_KEYS.COMPLETED_LEVELS,
      JSON.stringify(this.completedLevels)
    );
  }

  /**
   * Завантаження рівня за номером
   * @param {number} level - номер рівня
   * Оновлює всі дані моделі відповідно до вибраного рівня
   */
  loadLevel(level) {
    if (level < 1 || level > CONFIG.LEVELS.length) return false;
    
    this.currentLevel = level;
    this.gameConfig = CONFIG.LEVELS[level - 1];
    this.gridSize = this.gameConfig.gridSize;
    this.robotPosition = { ...this.gameConfig.robotStart };
    this.walls = [...this.gameConfig.walls];
    
    // Розміщення фруктів/овочів випадково на полі
    this.placeCollectibles();
    
    return true;
  }

  /**
   * Розміщення фруктів/овочів на полі
   * Випадково розставляє collectibles так, щоб вони не перетинались зі стінами чи роботом
   */
  placeCollectibles() {
    this.collectibles = [];
    while (this.collectibles.length < this.gameConfig.collectiblesCount) {
      const x = Math.floor(Math.random() * this.gridSize);
      const y = Math.floor(Math.random() * this.gridSize);
      
      if (
        (x !== this.robotPosition.x || y !== this.robotPosition.y) &&
        !this.collectibles.some((item) => item.x === x && item.y === y) &&
        !this.walls.some((wall) => wall.x === x && wall.y === y)
      ) {
        this.collectibles.push({ 
          x, 
          y, 
          type: this.gameConfig.collectibleType 
        });
      }
    }
  }

  /**
   * Перевірка наявності колекційного предмета на позиції робота
   * Якщо є — видаляє його з масиву collectibles
   * @returns {boolean} true якщо предмет зібрано
   */
  checkCollectibles() {
    const itemIndex = this.collectibles.findIndex(
      (item) => item.x === this.robotPosition.x && item.y === this.robotPosition.y
    );
    
    if (itemIndex !== -1) {
      this.collectibles.splice(itemIndex, 1);
      return true;
    }
    
    return false;
  }

  /**
   * Перевірка чи всі предмети зібрані
   * @returns {boolean} true якщо всі предмети зібрані
   */
  areAllCollectiblesCollected() {
    return this.collectibles.length === 0;
  }

  /**
   * Перевірка завершення рівня
   * @returns {boolean} true якщо рівень завершено (всі предмети зібрані)
   */
  isLevelCompleted() {
    return this.areAllCollectiblesCollected();
  }

  /**
   * Рух робота за командою
   * @param {string} direction - напрямок руху (вгору, вниз, вліво, вправо)
   * @returns {boolean} true якщо рух успішний
   */
  moveRobot(direction) {
    let newPosition = { ...this.robotPosition };
    
    switch (direction) {
      case CONFIG.COMMANDS.UP:
        newPosition.y = Math.max(0, newPosition.y - 1);
        break;
      case CONFIG.COMMANDS.DOWN:
        newPosition.y = Math.min(this.gridSize - 1, newPosition.y + 1);
        break;
      case CONFIG.COMMANDS.LEFT:
        newPosition.x = Math.max(0, newPosition.x - 1);
        break;
      case CONFIG.COMMANDS.RIGHT:
        newPosition.x = Math.min(this.gridSize - 1, newPosition.x + 1);
        break;
      default:
        console.warn("Невідома команда руху:", direction);
        return false;
    }
    
    // Перевірка чи робот справді перемістився (може бути що ми зупинились на межі поля)
    if (newPosition.x === this.robotPosition.x && newPosition.y === this.robotPosition.y) {
      console.log("Робот досяг межі поля");
      return false;
    }
    
    // Перевірка на стіну
    const hitWall = this.walls.some(
      (wall) => wall.x === newPosition.x && wall.y === newPosition.y
    );
    
    if (hitWall) {
      console.log("Робот наткнувся на стіну");
      return false;
    }
    
    // Якщо перевірки пройдені, оновлюємо позицію
    this.robotPosition = newPosition;
    return true;
  }

  /**
   * Позначення рівня як завершеного
   */
  completeLevel() {
    if (!this.completedLevels.includes(this.currentLevel)) {
      this.completedLevels.push(this.currentLevel);
      this.saveProgress();
    }
  }

  /**
   * Перевірка чи є ще наступні рівні
   * @returns {boolean} true якщо є наступний рівень
   */
  hasNextLevel() {
    return this.currentLevel < CONFIG.LEVELS.length;
  }

  /**
   * Отримання номера наступного рівня
   * @returns {number} номер наступного рівня
   */
  getNextLevel() {
    return this.currentLevel + 1;
  }
}
