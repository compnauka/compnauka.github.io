/**
 * Менеджер команд для побудови алгоритму у стилі блоків code.org
 * Підтримує додавання блоків кліком і перетягуванням, а також цикли з вкладеними командами
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
const DATA_KEY_COMMAND_PATH = 'application/x-command-path';
const DATA_KEY_NEW_COMMAND = 'application/x-new-command';

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
  }

  /**
   * Ініціалізація контейнера для блочного редактора
   * @param {HTMLElement} listElement
   */
  init(listElement) {
    this.listEl = listElement;
    this.render();
  }

  /** Очищення алгоритму */
  clear() {
    this.commands = [];
    this.render();
  }

  /** Додавання руху в кінець алгоритму */
  addMove(direction) {
    if (!Object.values(DIRECTIONS).includes(direction)) return;
    this.insertCommand(createMove(direction));
  }

  /** Додавання циклу в кінець алгоритму */
  addLoop() {
    this.insertCommand(createLoop());
  }

  /**
   * Додавання команди у вказану позицію
   * @param {{type:string, direction?:string, loopCount?:number}} descriptor
   * @param {{ parentPath?: string, index?: number }} [target]
   */
  insertCommand(descriptor, target = {}) {
    if (!this.listEl) return;

    const command = this._createCommandFromDescriptor(descriptor);
    if (!command) return;

    const parentPath = typeof target.parentPath === 'string' ? target.parentPath : '';
    const parentArray = this._getArrayByParentPath(this._parsePath(parentPath));
    if (!parentArray) return;

    const insertIndex = typeof target.index === 'number'
      ? Math.min(Math.max(target.index, 0), parentArray.length)
      : parentArray.length;

    parentArray.splice(insertIndex, 0, command);
    this.render();
  }

  /**
   * Видалення команди за шляхом
   * @param {string} path
   */
  removeCommand(path) {
    const resolved = this._resolvePath(path);
    if (!resolved) return;

    const { parentArray, index } = resolved;
    parentArray.splice(index, 1);
    this.render();
  }

  /**
   * Зміна кількості повторень циклу
   * @param {string} path
   * @param {number|string} value
   */
  setLoopCount(path, value) {
    const resolved = this._resolvePath(path);
    if (!resolved) return;

    const command = resolved.parentArray[resolved.index];
    if (!command || command.type !== COMMAND_TYPES.LOOP) return;

    const sanitized = Math.max(
      GAME_CONFIG.minLoopCount,
      Math.min(GAME_CONFIG.maxLoopCount, Number(value) || GAME_CONFIG.minLoopCount)
    );

    command.loopCount = sanitized;
    this.render();
  }

  /** Розгортання алгоритму в плоский список команд */
  flatten() {
    const flat = [];

    const walk = (commands) => {
      for (const command of commands) {
        if (command.type === COMMAND_TYPES.MOVE) {
          flat.push({ ...command });
        } else if (command.type === COMMAND_TYPES.LOOP) {
          for (let i = 0; i < command.loopCount; i += 1) {
            walk(command.children);
          }
        }
      }
    };

    walk(this.commands);
    return flat;
  }

  /** Підрахунок використаних блоків */
  countBlocks() {
    const count = (commands) => commands.reduce((total, command) => {
      if (command.type === COMMAND_TYPES.MOVE) {
        return total + 1;
      }
      if (command.type === COMMAND_TYPES.LOOP) {
        return total + 1 + count(command.children);
      }
      return total;
    }, 0);

    return count(this.commands);
  }

  /** Відмальовування робочої області */
  render() {
    if (!this.listEl) return;

    this.listEl.innerHTML = '';

    if (this.commands.length === 0) {
      const dropZone = this._createDropZone('', 0);
      dropZone.classList.add('workspace-dropzone--empty');
      dropZone.innerHTML = '<span>Перетягни сюди блок або натисни на нього в панелі</span>';
      this.listEl.appendChild(dropZone);
      return;
    }

    const stack = document.createElement('div');
    stack.className = 'workspace-stack';
    this._renderList(this.commands, stack, '');
    this.listEl.appendChild(stack);
  }

  /** Рендер списку команд для поточного рівня вкладеності */
  _renderList(list, container, parentPath) {
    for (let i = 0; i <= list.length; i += 1) {
      const dropZone = this._createDropZone(parentPath, i);
      container.appendChild(dropZone);

      if (i === list.length) {
        continue;
      }

      const command = list[i];
      const commandPath = parentPath ? `${parentPath}.${i}` : `${i}`;
      const block = command.type === COMMAND_TYPES.MOVE
        ? this._renderMoveBlock(command, commandPath)
        : this._renderLoopBlock(command, commandPath);

      container.appendChild(block);
    }
  }

  _renderMoveBlock(command, path) {
    const block = document.createElement('div');
    block.className = 'workspace-block workspace-block--move';
    block.setAttribute('draggable', 'true');
    block.dataset.path = path;

    block.innerHTML = `
      <div class="workspace-block__content">
        <span class="workspace-block__icon">${MOVE_ICONS[command.direction] || ''}</span>
        <span class="workspace-block__label">${MOVE_NAMES[command.direction] || 'Рух'}</span>
      </div>
      <button type="button" class="workspace-block__action" aria-label="Видалити блок">
        <i class="fas fa-times"></i>
      </button>
    `;

    block.querySelector('.workspace-block__action').addEventListener('click', () => {
      this.removeCommand(path);
    });

    this._bindDragEvents(block, path);
    return block;
  }

  _renderLoopBlock(command, path) {
    const block = document.createElement('div');
    block.className = 'workspace-block workspace-block--loop';
    block.setAttribute('draggable', 'true');
    block.dataset.path = path;

    const header = document.createElement('div');
    header.className = 'workspace-block__loop-header';
    header.innerHTML = `
      <div class="workspace-block__content">
        <span class="workspace-block__icon"><i class="fas fa-redo"></i></span>
        <span class="workspace-block__label">Повторити</span>
        <input type="number" min="${GAME_CONFIG.minLoopCount}" max="${GAME_CONFIG.maxLoopCount}" value="${command.loopCount}" aria-label="Кількість повторень циклу">
        <span class="workspace-block__suffix">раз(и)</span>
      </div>
      <button type="button" class="workspace-block__action" aria-label="Видалити цикл">
        <i class="fas fa-times"></i>
      </button>
    `;

    const input = header.querySelector('input');
    input.addEventListener('change', (event) => {
      this.setLoopCount(path, event.target.value);
    });

    header.querySelector('.workspace-block__action').addEventListener('click', () => {
      this.removeCommand(path);
    });

    const childrenContainer = document.createElement('div');
    childrenContainer.className = 'workspace-block__children';
    this._renderList(command.children, childrenContainer, path);

    if (command.children.length === 0) {
      childrenContainer.innerHTML = '';
      const emptyZone = this._createDropZone(path, 0);
      emptyZone.classList.add('workspace-dropzone--empty', 'workspace-dropzone--inner');
      emptyZone.innerHTML = '<span>Перетягни команду в цикл</span>';
      childrenContainer.appendChild(emptyZone);
    }

    block.appendChild(header);
    block.appendChild(childrenContainer);

    this._bindDragEvents(block, path);
    return block;
  }

  _createDropZone(parentPath, index) {
    const zone = document.createElement('div');
    zone.className = 'workspace-dropzone';
    zone.dataset.parent = parentPath;
    zone.dataset.index = String(index);

    zone.addEventListener('dragenter', (event) => this._handleDragEnter(event, zone));
    zone.addEventListener('dragover', (event) => this._handleDragOver(event, zone));
    zone.addEventListener('dragleave', () => zone.classList.remove('workspace-dropzone--active'));
    zone.addEventListener('drop', (event) => this._handleDrop(event, zone));

    return zone;
  }

  _bindDragEvents(block, path) {
    block.addEventListener('dragstart', (event) => {
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData(DATA_KEY_COMMAND_PATH, path);
      event.dataTransfer.setData('text/plain', 'command');
      block.classList.add('workspace-block--dragging');
    });

    block.addEventListener('dragend', () => {
      block.classList.remove('workspace-block--dragging');
    });
  }

  _handleDragEnter(event, zone) {
    if (this._isValidDrag(event)) {
      zone.classList.add('workspace-dropzone--active');
    }
  }

  _handleDragOver(event, zone) {
    if (!this._isValidDrag(event)) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = this._isMovingExisting(event) ? 'move' : 'copy';
    zone.classList.add('workspace-dropzone--active');
  }

  _handleDrop(event, zone) {
    event.preventDefault();
    zone.classList.remove('workspace-dropzone--active');

    const parentPath = zone.dataset.parent || '';
    const index = Number(zone.dataset.index || 0);

    const movePath = event.dataTransfer.getData(DATA_KEY_COMMAND_PATH);
    if (movePath) {
      this._moveCommand(movePath, parentPath, index);
      return;
    }

    const newCommandRaw = event.dataTransfer.getData(DATA_KEY_NEW_COMMAND);
    if (newCommandRaw) {
      try {
        const descriptor = JSON.parse(newCommandRaw);
        this.insertCommand(descriptor, { parentPath, index });
      } catch (error) {
        console.warn('Не вдалося розпарсити команду з панелі', error);
      }
    }
  }

  _isValidDrag(event) {
    return Boolean(
      event.dataTransfer.types.includes(DATA_KEY_COMMAND_PATH)
      || event.dataTransfer.types.includes(DATA_KEY_NEW_COMMAND)
    );
  }

  _isMovingExisting(event) {
    return event.dataTransfer.types.includes(DATA_KEY_COMMAND_PATH);
  }

  _moveCommand(sourcePath, targetParent, targetIndex) {
    const source = this._resolvePath(sourcePath);
    if (!source) return;

    const sourceParentPath = this._parentPath(sourcePath);
    const sourcePathArr = this._parsePath(sourcePath);
    const targetParentArr = this._parsePath(targetParent);

    if (this._isDescendantPath(sourcePathArr, targetParentArr)) {
      return; // забороняємо переміщення в саму себе
    }

    const command = source.parentArray[source.index];
    source.parentArray.splice(source.index, 1);

    let insertIndex = targetIndex;
    if (sourceParentPath === targetParent) {
      if (source.index < targetIndex) {
        insertIndex -= 1;
      }
    }

    const targetArray = this._getArrayByParentPath(targetParentArr);
    if (!targetArray) return;

    targetArray.splice(Math.min(insertIndex, targetArray.length), 0, command);
    this.render();
  }

  _createCommandFromDescriptor(descriptor) {
    if (!descriptor || typeof descriptor !== 'object') return null;
    if (descriptor.type === COMMAND_TYPES.MOVE) {
      return createMove(descriptor.direction);
    }
    if (descriptor.type === COMMAND_TYPES.LOOP) {
      return createLoop(descriptor.loopCount || DEFAULT_LOOP_COUNT);
    }
    return null;
  }

  _parsePath(path) {
    if (!path) return [];
    return path.split('.').filter(Boolean).map(Number);
  }

  _parentPath(path) {
    const parts = this._parsePath(path);
    parts.pop();
    return parts.length ? parts.join('.') : '';
  }

  _resolvePath(path) {
    const parts = this._parsePath(path);
    if (!parts.length) return null;

    const index = parts.pop();
    const parentArray = this._getArrayByParentPath(parts);
    if (!parentArray || index < 0 || index >= parentArray.length) return null;

    return { parentArray, index };
  }

  _getArrayByParentPath(pathArr) {
    let current = this.commands;
    for (const index of pathArr) {
      const command = current[index];
      if (!command || command.type !== COMMAND_TYPES.LOOP) {
        return null;
      }
      current = command.children;
    }
    return current;
  }

  _isDescendantPath(sourcePathArr, targetParentArr) {
    if (targetParentArr.length < sourcePathArr.length) {
      return false;
    }
    for (let i = 0; i < sourcePathArr.length; i += 1) {
      if (targetParentArr[i] !== sourcePathArr[i]) {
        return false;
      }
    }
    return targetParentArr.length >= sourcePathArr.length;
  }
}
