/**
 * Модуль управління командами та алгоритмом
 * Відповідає за створення, виконання та відображення команд
 */

import { COMMAND_TYPES, DIRECTIONS, GAME_CONFIG } from './config.js';

/**
 * Клас Command
 * Представляє окрему команду в алгоритмі
 */
export class Command {
  constructor(type, direction = null, children = [], loopCount = 2) {
    this.type = type; // 'move' або 'loop'
    this.direction = direction; // 'up', 'down', 'left', 'right'
    this.children = children; // Вкладені команди для циклу
    this.loopCount = loopCount; // Кількість повторень циклу
  }

  /**
   * Отримання іконки команди
   * @returns {string} - HTML-рядок з іконкою
   */
  getIcon() {
    if (this.type === COMMAND_TYPES.MOVE) {
      const icons = {
        [DIRECTIONS.UP]: '<i class="fas fa-arrow-up"></i>',
        [DIRECTIONS.DOWN]: '<i class="fas fa-arrow-down"></i>',
        [DIRECTIONS.LEFT]: '<i class="fas fa-arrow-left"></i>',
        [DIRECTIONS.RIGHT]: '<i class="fas fa-arrow-right"></i>'
      };
      return icons[this.direction] || '';
    }
    return '<i class="fas fa-redo"></i>';
  }

  /**
   * Отримання назви команди
   * @returns {string}
   */
  getName() {
    if (this.type === COMMAND_TYPES.MOVE) {
      const names = {
        [DIRECTIONS.UP]: 'Вгору',
        [DIRECTIONS.DOWN]: 'Вниз',
        [DIRECTIONS.LEFT]: 'Ліворуч',
        [DIRECTIONS.RIGHT]: 'Праворуч'
      };
      return names[this.direction] || 'Рух';
    }
    return `Цикл (×${this.loopCount})`;
  }
}

/**
 * Клас CommandManager
 * Керує списком команд та їх виконанням
 */
export class CommandManager {
  constructor() {
    this.commands = [];
    this.inLoop = false;
    this.loopStartIndex = -1;
    this.loopCount = 2;
    this.listEl = null;
  }

  /**
   * Ініціалізація менеджера команд
   * @param {HTMLElement} listElement - DOM-елемент списку команд
   */
  init(listElement) {
    this.listEl = listElement;
    this.render();
  }

  /**
   * Додавання команди руху
   * @param {string} direction - Напрямок руху
   */
  addMove(direction) {
    const cmd = new Command(COMMAND_TYPES.MOVE, direction);
    
    if (this.inLoop) {
      // Додаємо команду до поточного циклу
      const loopCmd = this.commands[this.loopStartIndex];
      loopCmd.children.push(cmd);
    } else {
      this.commands.push(cmd);
    }
    
    this.render();
  }

  /**
   * Початок циклу
   */
  startLoop() {
    if (this.inLoop) return; // Не дозволяємо вкладені цикли
    
    const loopCmd = new Command(COMMAND_TYPES.LOOP, null, [], this.loopCount);
    this.commands.push(loopCmd);
    this.loopStartIndex = this.commands.length - 1;
    this.inLoop = true;
    this.render();
  }

  /**
   * Завершення циклу
   */
  endLoop() {
    if (!this.inLoop) return;
    
    this.inLoop = false;
    this.loopStartIndex = -1;
    this.render();
  }

  /**
   * Видалення команди
   * @param {number} index - Індекс команди
   */
  removeCommand(index) {
    if (this.inLoop && index === this.loopStartIndex) {
      // Видаляємо цикл - також скасовуємо режим редагування циклу
      this.inLoop = false;
      this.loopStartIndex = -1;
    }
    
    this.commands.splice(index, 1);
    
    // Коригуємо індекс циклу
    if (this.inLoop && index < this.loopStartIndex) {
      this.loopStartIndex--;
    }
    
    this.render();
  }

  /**
   * Видалення вкладеної команди з циклу
   * @param {number} loopIndex - Індекс циклу
   * @param {number} childIndex - Індекс вкладеної команди
   */
  removeChildCommand(loopIndex, childIndex) {
    if (loopIndex < 0 || loopIndex >= this.commands.length) return;
    
    const loopCmd = this.commands[loopIndex];
    if (loopCmd.type !== COMMAND_TYPES.LOOP) return;
    
    loopCmd.children.splice(childIndex, 1);
    this.render();
  }

  /**
   * Переміщення команди вгору
   * @param {number} index - Індекс команди
   */
  moveUp(index) {
    if (index === 0) return;
    [this.commands[index], this.commands[index - 1]] = 
    [this.commands[index - 1], this.commands[index]];
    
    // Коригуємо індекс циклу
    if (this.inLoop) {
      if (index === this.loopStartIndex) this.loopStartIndex--;
      else if (index - 1 === this.loopStartIndex) this.loopStartIndex++;
    }
    
    this.render();
  }

  /**
   * Переміщення команди вниз
   * @param {number} index - Індекс команди
   */
  moveDown(index) {
    if (index === this.commands.length - 1) return;
    [this.commands[index], this.commands[index + 1]] = 
    [this.commands[index + 1], this.commands[index]];
    
    // Коригуємо індекс циклу
    if (this.inLoop) {
      if (index === this.loopStartIndex) this.loopStartIndex++;
      else if (index + 1 === this.loopStartIndex) this.loopStartIndex--;
    }
    
    this.render();
  }

  /**
   * Зміна кількості повторень циклу
   * @param {number} loopIndex - Індекс циклу
   * @param {number} count - Кількість повторень
   */
  setLoopCount(loopIndex, count) {
    if (loopIndex < 0 || loopIndex >= this.commands.length) return;
    
    const loopCmd = this.commands[loopIndex];
    if (loopCmd.type !== COMMAND_TYPES.LOOP) return;
    
    loopCmd.loopCount = Math.max(
      GAME_CONFIG.minLoopCount, 
      Math.min(GAME_CONFIG.maxLoopCount, count)
    );
    
    // Оновлюємо поточну кількість повторень, якщо це активний цикл
    if (this.inLoop && loopIndex === this.loopStartIndex) {
      this.loopCount = loopCmd.loopCount;
    }
    
    this.render();
  }

  /**
   * Очищення всіх команд
   */
  clear() {
    this.commands = [];
    this.inLoop = false;
    this.loopStartIndex = -1;
    this.loopCount = 2;
    this.render();
  }

  /**
   * Розгортання команд у плоский список
   * Розгортає цикли для виконання
   * @returns {Array} - Масив команд руху
   */
  flatten() {
    const result = [];
    
    for (const cmd of this.commands) {
      if (cmd.type === COMMAND_TYPES.MOVE) {
        result.push(cmd);
      } else if (cmd.type === COMMAND_TYPES.LOOP) {
        // Повторюємо вкладені команди
        for (let i = 0; i < cmd.loopCount; i++) {
          result.push(...cmd.children);
        }
      }
    }
    
    return result;
  }

  /**
   * Підрахунок загальної кількості блоків
   * Для підрахунку очок (кожен цикл = 1 блок + його вміст)
   * @returns {number}
   */
  countBlocks() {
    let count = 0;
    
    for (const cmd of this.commands) {
      if (cmd.type === COMMAND_TYPES.MOVE) {
        count++;
      } else if (cmd.type === COMMAND_TYPES.LOOP) {
        count++; // Сам цикл
        count += cmd.children.length; // Команди всередині
      }
    }
    
    return count;
  }

  /**
   * Відображення списку команд
   */
  render() {
    if (!this.listEl) return;

    this.listEl.innerHTML = '';

    if (this.commands.length === 0) {
      this.listEl.innerHTML = '<p class="text-gray-400 text-sm text-center py-3">Додай команди, щоб створити алгоритм</p>';
      return;
    }

    this.commands.forEach((cmd, index) => {
      const item = this._createCommandElement(cmd, index);
      this.listEl.appendChild(item);
    });
  }

  /**
   * Створення DOM-елементу команди
   * @param {Command} cmd - Об'єкт команди
   * @param {number} index - Індекс команди
   * @returns {HTMLElement}
   */
  _createCommandElement(cmd, index) {
    const item = document.createElement('div');
    item.className = 'command-item mb-2';

    if (cmd.type === COMMAND_TYPES.MOVE) {
      // Проста команда руху
      item.innerHTML = `
        <div class="flex items-center gap-2 bg-blue-50 border-2 border-blue-300 rounded-lg p-2">
          <span class="text-blue-600 text-lg">${cmd.getIcon()}</span>
          <span class="flex-1 text-gray-800 font-medium text-sm">${cmd.getName()}</span>
          <div class="flex gap-1">
            <button class="btn-sort bg-blue-500 text-white rounded [--shadow-color:theme(colors.blue.700)]" 
                    data-action="up" data-index="${index}" 
                    ${index === 0 ? 'disabled' : ''}>
              <i class="fas fa-chevron-up text-xs"></i>
            </button>
            <button class="btn-sort bg-blue-500 text-white rounded [--shadow-color:theme(colors.blue.700)]" 
                    data-action="down" data-index="${index}"
                    ${index === this.commands.length - 1 ? 'disabled' : ''}>
              <i class="fas fa-chevron-down text-xs"></i>
            </button>
            <button class="btn-sort bg-red-500 text-white rounded [--shadow-color:theme(colors.red.700)]" 
                    data-action="delete" data-index="${index}">
              <i class="fas fa-times text-xs"></i>
            </button>
          </div>
        </div>
      `;
    } else if (cmd.type === COMMAND_TYPES.LOOP) {
      // Цикл
      const isActive = this.inLoop && index === this.loopStartIndex;
      const borderColor = isActive ? 'border-yellow-400' : 'border-yellow-300';
      
      item.innerHTML = `
        <div class="bg-yellow-50 border-2 ${borderColor} rounded-lg p-2">
          <div class="flex items-center gap-2 mb-2">
            <span class="text-yellow-600 text-lg">${cmd.getIcon()}</span>
            <span class="flex-1 text-gray-800 font-bold text-sm">${cmd.getName()}</span>
            <input type="number" min="${GAME_CONFIG.minLoopCount}" max="${GAME_CONFIG.maxLoopCount}" 
                   value="${cmd.loopCount}" 
                   class="w-12 text-center border border-yellow-400 rounded px-1 py-0.5 text-sm"
                   data-action="loop-count" data-index="${index}">
            <div class="flex gap-1">
              <button class="btn-sort bg-yellow-500 text-white rounded [--shadow-color:theme(colors.yellow.700)]" 
                      data-action="up" data-index="${index}"
                      ${index === 0 ? 'disabled' : ''}>
                <i class="fas fa-chevron-up text-xs"></i>
              </button>
              <button class="btn-sort bg-yellow-500 text-white rounded [--shadow-color:theme(colors.yellow.700)]" 
                      data-action="down" data-index="${index}"
                      ${index === this.commands.length - 1 ? 'disabled' : ''}>
                <i class="fas fa-chevron-down text-xs"></i>
              </button>
              <button class="btn-sort bg-red-500 text-white rounded [--shadow-color:theme(colors.red.700)]" 
                      data-action="delete" data-index="${index}">
                <i class="fas fa-times text-xs"></i>
              </button>
            </div>
          </div>
          <div class="ml-4 space-y-1">
            ${cmd.children.length === 0 
              ? '<p class="text-gray-400 text-xs italic py-1">Додай команди в цикл</p>' 
              : cmd.children.map((child, childIndex) => `
                <div class="flex items-center gap-2 bg-white border border-yellow-200 rounded p-1.5">
                  <span class="text-blue-600">${child.getIcon()}</span>
                  <span class="flex-1 text-gray-700 text-xs">${child.getName()}</span>
                  <button class="btn-sort bg-red-400 text-white rounded [--shadow-color:theme(colors.red.600)] !w-7 !h-7" 
                          data-action="delete-child" data-index="${index}" data-child-index="${childIndex}">
                    <i class="fas fa-times text-xs"></i>
                  </button>
                </div>
              `).join('')}
          </div>
        </div>
      `;
    }

    // Додаємо обробники подій
    this._attachEventListeners(item);

    return item;
  }

  /**
   * Прив'язка обробників подій до елементу команди
   * @param {HTMLElement} element - DOM-елемент
   */
  _attachEventListeners(element) {
    element.querySelectorAll('button[data-action]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const action = e.currentTarget.dataset.action;
        const index = parseInt(e.currentTarget.dataset.index);
        const childIndex = e.currentTarget.dataset.childIndex 
          ? parseInt(e.currentTarget.dataset.childIndex) 
          : null;

        switch (action) {
          case 'up':
            this.moveUp(index);
            break;
          case 'down':
            this.moveDown(index);
            break;
          case 'delete':
            this.removeCommand(index);
            break;
          case 'delete-child':
            this.removeChildCommand(index, childIndex);
            break;
        }
      });
    });

    element.querySelectorAll('input[data-action="loop-count"]').forEach(input => {
      input.addEventListener('change', (e) => {
        const index = parseInt(e.target.dataset.index);
        const count = parseInt(e.target.value);
        this.setLoopCount(index, count);
      });
    });
  }
}
