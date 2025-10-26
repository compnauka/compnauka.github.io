/**
 * Простий менеджер команд для побудови алгоритму
 * Орієнтований на зрозумілий досвід для дітей 7-9 років
 */

import { COMMAND_TYPES, DIRECTIONS, GAME_CONFIG } from './config.js';

const MOVE_ICONS = {
  [DIRECTIONS.UP]: '<i class="fas fa-arrow-up"></i>',
  [DIRECTIONS.DOWN]: '<i class="fas fa-arrow-down"></i>',
  [DIRECTIONS.LEFT]: '<i class="fas fa-arrow-left"></i>',
  [DIRECTIONS.RIGHT]: '<i class="fas fa-arrow-right"></i>'
};

const MOVE_NAMES = {
  [DIRECTIONS.UP]: 'Вгору',
  [DIRECTIONS.DOWN]: 'Вниз',
  [DIRECTIONS.LEFT]: 'Ліворуч',
  [DIRECTIONS.RIGHT]: 'Праворуч'
};

const DEFAULT_LOOP_COUNT = 2;

function createMove(direction) {
  return { type: COMMAND_TYPES.MOVE, direction };
}

function createLoop(count = DEFAULT_LOOP_COUNT) {
  return { type: COMMAND_TYPES.LOOP, loopCount: count, children: [] };
}

export class CommandManager {
  constructor() {
    this.commands = [];
    this.listEl = null;
    this.activeLoop = null;
    this.loopStateListener = null;
  }

  /**
   * Підписка на зміну стану циклу
   * @param {(state: {active:boolean, stepCount:number}) => void} callback
   */
  setLoopStateListener(callback) {
    this.loopStateListener = typeof callback === 'function' ? callback : null;
  }

  /**
   * Ініціалізація DOM-списку команд
   * @param {HTMLElement} listElement
   */
  init(listElement) {
    this.listEl = listElement;
    this.render();
    this._notifyLoopState();
  }

  /**
   * Скидання алгоритму
   */
  clear() {
    this.commands = [];
    this.activeLoop = null;
    this.render();
    this._notifyLoopState();
  }

  /**
   * Додавання команди руху
   * @param {string} direction
   */
  addMove(direction) {
    if (!Object.values(DIRECTIONS).includes(direction)) return;

    const target = this.activeLoop ? this.activeLoop.children : this.commands;
    target.push(createMove(direction));

    this.render();
    this._notifyLoopState();
  }

  /**
   * Початок циклу
   */
  startLoop() {
    if (this.activeLoop) return;

    const loopCommand = createLoop(DEFAULT_LOOP_COUNT);
    this.commands.push(loopCommand);
    this.activeLoop = loopCommand;

    this.render();
    this._notifyLoopState();
  }

  /**
   * Завершення поточного циклу
   */
  endLoop() {
    if (!this.activeLoop) return;

    this.activeLoop = null;
    this.render();
    this._notifyLoopState();
  }

  /**
   * Видалення команди верхнього рівня
   * @param {number} index
   */
  removeCommand(index) {
    if (index < 0 || index >= this.commands.length) return;

    const [removed] = this.commands.splice(index, 1);
    if (removed === this.activeLoop) {
      this.activeLoop = null;
    }

    this.render();
    this._notifyLoopState();
  }

  /**
   * Видалення команди всередині циклу
   * @param {number} loopIndex
   * @param {number} childIndex
   */
  removeChild(loopIndex, childIndex) {
    const loopCommand = this.commands[loopIndex];
    if (!loopCommand || loopCommand.type !== COMMAND_TYPES.LOOP) return;
    if (childIndex < 0 || childIndex >= loopCommand.children.length) return;

    loopCommand.children.splice(childIndex, 1);
    this.render();
    this._notifyLoopState();
  }

  /**
   * Зміна кількості повторень циклу
   * @param {number} loopIndex
   * @param {number} value
   */
  setLoopCount(loopIndex, value) {
    const loopCommand = this.commands[loopIndex];
    if (!loopCommand || loopCommand.type !== COMMAND_TYPES.LOOP) return;

    const sanitized = Math.max(
      GAME_CONFIG.minLoopCount,
      Math.min(GAME_CONFIG.maxLoopCount, Number(value) || GAME_CONFIG.minLoopCount)
    );

    loopCommand.loopCount = sanitized;
    if (this.listEl) {
      const input = this.listEl.querySelector(`input[data-index="${loopIndex}"]`);
      if (input) {
        input.value = String(sanitized);
      }
    }
    this._notifyLoopState();
  }

  /**
   * Перетворення алгоритму на послідовність кроків
   * @returns {Array<{type:string, direction:string}>}
   */
  flatten() {
    const result = [];

    for (const command of this.commands) {
      if (command.type === COMMAND_TYPES.MOVE) {
        result.push({ ...command });
      } else if (command.type === COMMAND_TYPES.LOOP) {
        for (let i = 0; i < command.loopCount; i += 1) {
          for (const child of command.children) {
            result.push({ ...child });
          }
        }
      }
    }

    return result;
  }

  /**
   * Підрахунок використаних блоків
   * @returns {number}
   */
  countBlocks() {
    let total = 0;
    for (const command of this.commands) {
      if (command.type === COMMAND_TYPES.MOVE) {
        total += 1;
      } else if (command.type === COMMAND_TYPES.LOOP) {
        total += 1 + command.children.length;
      }
    }
    return total;
  }

  /**
   * Відмалювання списку команд
   */
  render() {
    if (!this.listEl) return;

    this.listEl.innerHTML = '';
    this.listEl.setAttribute('data-loop-active', this.activeLoop ? 'true' : 'false');

    if (this.commands.length === 0) {
      this.listEl.innerHTML = '<p class="text-gray-400 text-sm text-center py-3">Додай команди, щоб скласти алгоритм</p>';
      return;
    }

    this.commands.forEach((command, index) => {
      const element = command.type === COMMAND_TYPES.MOVE
        ? this._renderMove(command, index)
        : this._renderLoop(command, index);
      this.listEl.appendChild(element);
    });
  }

  _renderMove(command, index) {
    const item = document.createElement('div');
    item.className = 'command-chip';
    item.innerHTML = `
      <div class="command-chip__label">
        <span class="command-chip__icon">${MOVE_ICONS[command.direction] || ''}</span>
        <span>${MOVE_NAMES[command.direction] || 'Рух'}</span>
      </div>
      <div class="command-chip__actions">
        <button type="button" class="command-chip__button command-chip__button--delete" data-action="delete" data-index="${index}" aria-label="Видалити команду">
          <i class="fas fa-times"></i>
        </button>
      </div>
    `;

    item.querySelector('[data-action="delete"]').addEventListener('click', () => {
      this.removeCommand(index);
    });

    return item;
  }

  _renderLoop(command, index) {
    const item = document.createElement('div');
    item.className = 'command-chip command-chip--loop';
    if (command === this.activeLoop) {
      item.classList.add('command-chip--active');
    }

    const childrenHtml = command.children.map((child, childIndex) => `
      <div class="command-chip__child">
        <div class="command-chip__label">
          <span class="command-chip__icon">${MOVE_ICONS[child.direction] || ''}</span>
          <span>${MOVE_NAMES[child.direction] || 'Рух'}</span>
        </div>
        <div class="command-chip__actions">
          <button type="button" class="command-chip__button command-chip__button--delete command-chip__button--small" data-action="delete-child" data-loop="${index}" data-child="${childIndex}" aria-label="Видалити крок циклу">
            <i class="fas fa-times"></i>
          </button>
        </div>
      </div>
    `).join('');

    item.innerHTML = `
      <div class="command-chip__header">
        <div class="command-chip__title">
          <span class="command-chip__icon"><i class="fas fa-redo"></i></span>
          <span>Цикл</span>
        </div>
        <label class="command-chip__repeat">
          Повторити
          <input type="number" min="${GAME_CONFIG.minLoopCount}" max="${GAME_CONFIG.maxLoopCount}" value="${command.loopCount}" data-action="loop-count" data-index="${index}">
          раз(и)
        </label>
        <div class="command-chip__actions">
          <button type="button" class="command-chip__button command-chip__button--delete" data-action="delete" data-index="${index}" aria-label="Видалити цикл">
            <i class="fas fa-times"></i>
          </button>
        </div>
      </div>
      <div class="command-chip__children">
        ${childrenHtml || '<div class="command-chip__empty">Додай команди всередину циклу</div>'}
      </div>
    `;

    item.querySelector('[data-action="delete"]').addEventListener('click', () => {
      this.removeCommand(index);
    });

    item.querySelectorAll('[data-action="delete-child"]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const loopIndex = Number(btn.dataset.loop);
        const childIndex = Number(btn.dataset.child);
        this.removeChild(loopIndex, childIndex);
      });
    });

    const input = item.querySelector('input[data-action="loop-count"]');
    input.addEventListener('change', (event) => {
      this.setLoopCount(index, event.target.value);
    });

    return item;
  }

  _notifyLoopState() {
    if (!this.loopStateListener) return;

    const active = Boolean(this.activeLoop);
    const stepCount = active ? this.activeLoop.children.length : 0;
    this.loopStateListener({ active, stepCount });
  }
}
