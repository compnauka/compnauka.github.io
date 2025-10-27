/**
 * Модуль управління сіткою/картою гри
 * Відповідає за відображення та оновлення карти
 */

import { ICONS, CELL_CLASSES } from './config.js';

/**
 * Клас GridManager
 * Керує відображенням сітки, героя, монстрів та предметів
 */
export class GridManager {
  constructor() {
    this.gridEl = null;
    this.size = 8;
    this.heroPos = [0, 0];
    this.monsterPos = [0, 0];
    this.obstacles = [];
    this.collected = new Set();
    this.hintTimeout = null;
  }

  /**
   * Ініціалізація сітки
   * @param {HTMLElement} gridElement - DOM-елемент контейнера сітки
   * @param {Object} levelData - Дані рівня
   */
  init(gridElement, levelData) {
    this.gridEl = gridElement;
    this.size = levelData.size;
    this.heroPos = [...levelData.hero];
    this.monsterPos = [...levelData.monster];
    this.obstacles = levelData.obstacles || [];
    this.items = levelData.items || { weapons: [], armor: [], potions: [] };
    this.collected = new Set();
    this.hintTimeout = null;

    this.render();
  }

  /**
   * Відображення сітки
   * Створює HTML-структуру сітки з усіма елементами
   */
  render() {
    if (!this.gridEl) return;

    this.clearHintPath();

    // Налаштування розміру сітки
    this.gridEl.style.display = 'grid';
    this.gridEl.style.gridTemplateColumns = `repeat(${this.size}, 1fr)`;
    this.gridEl.style.gap = 'clamp(0.15rem, 0.4vw, 0.3rem)';
    this.gridEl.innerHTML = '';

    // Створення клітинок
    for (let r = 0; r < this.size; r++) {
      for (let c = 0; c < this.size; c++) {
        const cell = this._createCell(r, c);
        this.gridEl.appendChild(cell);
      }
    }
  }

  /**
   * Створення окремої клітинки
   * @param {number} row - Рядок
   * @param {number} col - Колонка
   * @returns {HTMLElement} - DOM-елемент клітинки
   */
  _createCell(row, col) {
    const cell = document.createElement('div');
    cell.className = CELL_CLASSES.base;
    cell.dataset.row = row;
    cell.dataset.col = col;
    cell.setAttribute('role', 'gridcell');

    // Визначення типу клітинки
    if (row === this.heroPos[0] && col === this.heroPos[1]) {
      cell.classList.add(...CELL_CLASSES.hero.split(' '));
      cell.textContent = ICONS.hero;
      cell.setAttribute('aria-label', 'Кодегорошко');
    } else if (row === this.monsterPos[0] && col === this.monsterPos[1]) {
      cell.classList.add(...CELL_CLASSES.monster.split(' '));
      cell.textContent = this._getMonsterIcon();
      cell.setAttribute('aria-label', 'Монстр');
    } else if (this._isObstacle(row, col)) {
      cell.classList.add(...CELL_CLASSES.obstacle.split(' '));
      cell.textContent = ICONS.obstacle;
      cell.setAttribute('aria-label', 'Перешкода');
    } else {
      cell.classList.add(...CELL_CLASSES.empty.split(' '));
      
      // Додавання предметів
      const itemIcon = this._getItemAt(row, col);
      if (itemIcon) {
        cell.textContent = itemIcon.icon;
        cell.setAttribute('aria-label', itemIcon.label);
        
        if (this.collected.has(`${row},${col}`)) {
          cell.classList.add(CELL_CLASSES.collected.split(' ')[0]);
        }
      }
    }

    return cell;
  }

  /**
   * Перевірка, чи є клітинка перешкодою
   * @param {number} row - Рядок
   * @param {number} col - Колонка
   * @returns {boolean}
   */
  _isObstacle(row, col) {
    return this.obstacles.some(o => o[0] === row && o[1] === col);
  }

  /**
   * Отримання предмету на позиції
   * @param {number} row - Рядок
   * @param {number} col - Колонка
   * @returns {Object|null} - Об'єкт з іконкою та назвою предмету
   */
  _getItemAt(row, col) {
    if (this.items.weapons.some(w => w[0] === row && w[1] === col)) {
      return { icon: ICONS.weapon, label: 'Зброя' };
    }
    if (this.items.armor.some(a => a[0] === row && a[1] === col)) {
      return { icon: ICONS.armor, label: 'Броня' };
    }
    if (this.items.potions.some(p => p[0] === row && p[1] === col)) {
      return { icon: ICONS.potion, label: 'Зілля' };
    }
    return null;
  }

  /**
   * Отримання іконки монстра (має встановлюватись ззовні)
   */
  _getMonsterIcon() {
    return this.monsterIcon || ICONS.monsters.goblin;
  }

  /**
   * Оновлення позиції героя з анімацією
   * @param {Array} newPos - Нова позиція [row, col]
   * @returns {Promise} - Проміс, що вирішується після анімації
   */
  async updateHeroPosition(newPos) {
    const [oldRow, oldCol] = this.heroPos;
    const [newRow, newCol] = newPos;

    // Знаходимо клітинки
    const oldCell = this.gridEl.querySelector(`[data-row="${oldRow}"][data-col="${oldCol}"]`);
    const newCell = this.gridEl.querySelector(`[data-row="${newRow}"][data-col="${newCol}"]`);

    if (!oldCell || !newCell) return;

    // Оновлюємо стару клітинку
    oldCell.className = CELL_CLASSES.base + ' ' + CELL_CLASSES.empty;
    const itemIcon = this._getItemAt(oldRow, oldCol);
    if (itemIcon && this.collected.has(`${oldRow},${oldCol}`)) {
      oldCell.textContent = itemIcon.icon;
      oldCell.classList.add(CELL_CLASSES.collected.split(' ')[0]);
    } else {
      oldCell.textContent = '';
    }

    // Оновлюємо нову клітинку
    newCell.className = CELL_CLASSES.base + ' ' + CELL_CLASSES.hero;
    newCell.textContent = ICONS.hero;
    newCell.setAttribute('aria-label', 'Кодегорошко');

    this.heroPos = newPos;

    // Анімація переміщення
    return new Promise(resolve => {
      newCell.style.transform = 'scale(1.15)';
      setTimeout(() => {
        newCell.style.transform = 'scale(1)';
        resolve();
      }, 150);
    });
  }

  /**
   * Анімація збору предмету
   * @param {number} row - Рядок
   * @param {number} col - Колонка
   */
  animateCollect(row, col) {
    const cell = this.gridEl.querySelector(`[data-row="${row}"][data-col="${col}"]`);
    if (!cell) return;

    this.collected.add(`${row},${col}`);

    cell.classList.add('collecting');
    setTimeout(() => {
      cell.classList.remove('collecting');
      cell.classList.add(CELL_CLASSES.collected.split(' ')[0]);
    }, 200);
  }

  clearHintPath() {
    if (this.hintTimeout) {
      clearTimeout(this.hintTimeout);
      this.hintTimeout = null;
    }

    if (!this.gridEl) return;

    this.gridEl.querySelectorAll('.hint-path').forEach((cell) => {
      cell.classList.remove('hint-path');
      cell.querySelectorAll('.hint-arrow').forEach((arrow) => arrow.remove());
    });
  }

  showHintPath(start, end, items) {
    if (!this.gridEl || !Array.isArray(start) || !Array.isArray(end)) return;

    this.clearHintPath();

    const path = this._findPath(start, end);
    if (!path || path.length < 2) return;

    path.forEach((coord, index) => {
      if (index === 0 || index === path.length - 1) return;
      const [row, col] = coord;
      const cell = this.gridEl.querySelector(`[data-row="${row}"][data-col="${col}"]`);
      if (!cell) return;
      cell.classList.add('hint-path');

      const arrow = document.createElement('div');
      arrow.className = 'hint-arrow';
      arrow.textContent = this._getDirection(path[index - 1], coord);
      cell.appendChild(arrow);
    });

    this.hintTimeout = setTimeout(() => this.clearHintPath(), 5000);
  }

  _findPath(start, end) {
    const queue = [[start, [start]]];
    const visited = new Set([`${start[0]},${start[1]}`]);

    while (queue.length > 0) {
      const [position, path] = queue.shift();
      const [row, col] = position;

      if (row === end[0] && col === end[1]) {
        return path;
      }

      const neighbors = [
        [row - 1, col],
        [row + 1, col],
        [row, col - 1],
        [row, col + 1]
      ];

      for (const [nr, nc] of neighbors) {
        const key = `${nr},${nc}`;
        if (visited.has(key)) continue;

        if (nr === end[0] && nc === end[1]) {
          return [...path, [nr, nc]];
        }

        if (this.canMoveTo([nr, nc])) {
          visited.add(key);
          queue.push([[nr, nc], [...path, [nr, nc]]]);
        }
      }
    }

    return null;
  }

  _getDirection([fromRow, fromCol], [toRow, toCol]) {
    if (toRow < fromRow) return '↑';
    if (toRow > fromRow) return '↓';
    if (toCol < fromCol) return '←';
    return '→';
  }

  /**
   * Перевірка, чи можна рухатись на позицію
   * @param {Array} pos - Позиція [row, col]
   * @returns {boolean}
   */
  canMoveTo(pos) {
    const [row, col] = pos;
    
    // Перевірка меж
    if (row < 0 || row >= this.size || col < 0 || col >= this.size) {
      return false;
    }

    // Перевірка перешкод
    if (this._isObstacle(row, col)) {
      return false;
    }

    return true;
  }

  /**
   * Скидання сітки
   */
  reset() {
    this.collected.clear();
    this.clearHintPath();
    if (this.gridEl) {
      this.gridEl.innerHTML = '';
    }
  }

  animateFailure(heroPos, obstaclePos) {
    if (!this.gridEl) return;

    if (Array.isArray(heroPos)) {
      const heroCell = this.gridEl.querySelector(`[data-row="${heroPos[0]}"][data-col="${heroPos[1]}"]`);
      if (heroCell) {
        heroCell.classList.add('cell-shake');
        setTimeout(() => heroCell.classList.remove('cell-shake'), 300);
      }
    }

    if (Array.isArray(obstaclePos)) {
      const [row, col] = obstaclePos;
      if (row >= 0 && row < this.size && col >= 0 && col < this.size) {
        this.flashCell(obstaclePos);
      }
    }
  }

  /**
   * Анімація "блимання" клітинки
   * @param {Array} pos - Позиція [row, col]
   * @param {string} colorClass - CSS клас для анімації (напр. 'bg-red-400')
   */
  flashCell(pos, colorClass = 'bg-red-400') {
    const cell = this.gridEl.querySelector(`[data-row="${pos[0]}"][data-col="${pos[1]}"]`);
    if (!cell) return;
    
    const originalClasses = cell.className;
    cell.classList.add(colorClass);
    
    setTimeout(() => {
      cell.className = originalClasses;
      // Потрібно відновити іконку, якщо вона там була
      if (this._isObstacle(pos[0], pos[1])) {
        cell.textContent = ICONS.obstacle;
      }
    }, 300);
  }
}
