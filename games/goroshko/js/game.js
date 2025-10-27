/**
 * Основний ігровий модуль
 * Координує всі компоненти гри та керує ігровим процесом
 */

import { GAME_CONFIG, DIRECTIONS, COMMAND_TYPES } from './config.js';
import { getLevel, getBaseLevelCount } from './levels.js';
import { GridManager } from './grid.js';
import { CommandManager } from './commands.js';
import { BattleManager } from './battle.js';
import { UIManager } from './ui.js';
import { storage } from './storage.js';
import { soundEngine } from './sound.js';

/**
 * Клас Game
 * Головний контролер гри
 */
export class Game {
  constructor(options = {}) {
    this.currentLevel = 0;
    this.levelData = null;
    this.isRunning = false;
    this.elements = null;
    this.variantProvider = typeof options.variantProvider === 'function'
      ? options.variantProvider
      : () => 'default';

    // Статистика героя
    this.heroDamage = 0;
    this.heroArmor = 0;
    this.heroHealth = GAME_CONFIG.baseHealth;

    this.currentLevelAttempts = 0;

    this.commandIterator = null;
    this.currentStep = 0;
    this.flatCommandsCache = [];
    this.currentHeroPos = [0, 0];

    // Менеджери
    this.grid = new GridManager();
    this.commands = new CommandManager();
    this.battle = new BattleManager();
    this.ui = new UIManager();
  }

  /**
   * Ініціалізація гри
   * @param {Object} elements - Об'єкт з DOM-елементами
   */
  async init(elements) {
    this.elements = elements;
    // Ініціалізація менеджерів
    this.ui.init(elements);
    this.battle.init({
      scene: elements.battleScene,
      log: elements.battleLog,
      heroHealthBar: elements.heroHealthBar,
      monsterHealthBar: elements.monsterHealthBar,
      heroHealthText: elements.heroHealthText,
      monsterHealthText: elements.monsterHealthText,
      monsterIcon: elements.monsterIcon,
      monsterName: elements.monsterName
    });

    // Завантаження прогресу та визначення стартового рівня
    try {
      const progress = await storage.loadProgress();
      const startingLevel = progress.maxLevel || 0;
      this.loadLevel(startingLevel);

      try {
        const stats = await storage.getStats();
        this.ui.updateAchievements(stats);
      } catch (statsError) {
        console.warn('Не вдалося оновити досягнення:', statsError);
      }
    } catch (error) {
      console.error("Failed to load progress, starting from level 0.", error);
      this.loadLevel(0);
      this.ui.updateAchievements();
    }

    // Прив'язка обробників подій
    this._attachEventListeners(elements);
  }

  /**
   * Завантаження рівня
   * @param {number} levelIndex - Індекс рівня
   */
  loadLevel(levelIndex) {
    this.currentLevel = levelIndex;
    const variantKey = this.variantProvider();
    this.levelData = getLevel(levelIndex, variantKey);

    if (!this.levelData) {
      throw new Error(`Level with index ${levelIndex} not found.`);
    }

    this.heroDamage = 0;
    this.heroArmor = 0;
    this.heroHealth = GAME_CONFIG.baseHealth;
    this.currentLevelAttempts = 0;
    this.isRunning = false;
    this.commandIterator = null;
    this.currentStep = 0;
    this.flatCommandsCache = [];
    this.currentHeroPos = [...this.levelData.hero];

    if (typeof this.grid.clearHintPath === 'function') {
      this.grid.clearHintPath();
    }

    this.ui.updateUILayout(levelIndex);

    if (this.elements?.commandList) {
      this.commands.init(this.elements.commandList);
    }
    this.commands.clear();
    this.battle.reset();

    // Оновлення сітки
    const gridElement = this.elements?.grid || document.getElementById('grid');
    if (!gridElement) {
      throw new Error('Grid element not found in the DOM.');
    }

    this.grid.init(gridElement, this.levelData);
    this.grid.monsterIcon = this.levelData.monsterStats.icon;

    if (typeof this.grid.clearHintPath === 'function') {
      this.grid.clearHintPath();
    }

    // Оновлення UI
    this._updateStatsUI();

    this.ui.updateButtonsVisibility(levelIndex);
    this.ui.hideMessage();
    this.ui.hideVictoryModal();

    // Показ туторіалу для рівня з циклами
    if (levelIndex === 7) {
      this.ui.showTutorial();
    }
  }

  /**
   * Запуск алгоритму
   */
  async run() {
    if (this.isRunning) return;

    this.resetRunner();

    this.flatCommandsCache = this.commands.flatten();
    if (this.flatCommandsCache.length === 0) {
      this.ui.showDialogue('Додай команди до алгоритму!', 'error');
      return;
    }

    this.isRunning = true;
    this.commandIterator = null;
    this.ui.setControlsEnabled(false);
    this.ui.hideMessage();

    while (this.currentStep < this.flatCommandsCache.length && this.isRunning) {
      const success = await this.executeStep();
      if (!success) {
        this.isRunning = false;
        break;
      }
      await this._delay(GAME_CONFIG.stepMs);
    }

    if (this.isRunning) {
      await this.checkFinalPosition();
    }

    this.ui.setControlsEnabled(true);
    this.isRunning = false;
    this.commandIterator = null;
  }

  /**
   * Збір предметів на позиції
   * @param {Array} pos - Позиція [row, col]
   */
  async _collectItems(pos) {
    const [row, col] = pos;

    // Зброя
    await this._collectItem(row, col, this.levelData.items.weapons, () => {
      this.heroDamage += GAME_CONFIG.baseDamage;
    });

    await this._collectItem(row, col, this.levelData.items.armor, () => {
      this.heroArmor += GAME_CONFIG.baseArmor;
    });

    await this._collectItem(row, col, this.levelData.items.potions, () => {
      this.heroHealth = Math.min(
        GAME_CONFIG.baseHealth,
        this.heroHealth + GAME_CONFIG.potionHealth
      );
    });
  }

  /**
   * Запуск бою
   */
  async _startBattle() {
    // Налаштування статистики
    this.battle.setHeroStats({
      health: this.heroHealth,
      damage: this.heroDamage,
      armor: this.heroArmor
    });

    this.battle.setMonsterStats(this.levelData.monsterStats);

    // Запуск бою
    const victory = await this.battle.startBattle();

    if (victory) {
      await this._handleVictory();
    } else {
      this._handleFailedAttempt();
      this.ui.showDialogue('💔 Поразка! Спробуй краще спорядження або алгоритм.', 'error', 3000);
    }

    this.isRunning = false;
    this.ui.setControlsEnabled(true);
  }

  /**
   * Обробка перемоги
   */
  async _handleVictory() {
    const blocks = this.commands.countBlocks();
    const { gold, silver } = this.levelData.par;

    // Визначення медалі
    let medal = 'bronze';
    if (blocks <= gold) medal = 'gold';
    else if (blocks <= silver) medal = 'silver';

    // Збереження прогресу
    await storage.saveLevelProgress(this.currentLevel, {
      completed: true,
      blocks,
      medal,
      time: Date.now()
    });

    try {
      const stats = await storage.getStats();
      this.ui.updateAchievements(stats);
    } catch (statsError) {
      console.warn('Не вдалося оновити статистику досягнень після перемоги:', statsError);
    }

    // Показ модального вікна
    this.ui.showVictoryModal({
      blocks,
      medal,
      parGold: gold,
      parSilver: silver
    });
  }

  /**
   * Перехід до наступного рівня
   */
  nextLevel() {
    const nextLevelIndex = this.currentLevel + 1;
    this.loadLevel(nextLevelIndex);
  }

  /**
   * Отримання наступної позиції
   * @param {Array} currentPos - Поточна позиція
   * @param {string} direction - Напрямок
   * @returns {Array} - Нова позиція
   */
  _getNextPosition(currentPos, direction) {
    const [row, col] = currentPos;

    switch (direction) {
      case DIRECTIONS.UP: return [row - 1, col];
      case DIRECTIONS.DOWN: return [row + 1, col];
      case DIRECTIONS.LEFT: return [row, col - 1];
      case DIRECTIONS.RIGHT: return [row, col + 1];
      default: return currentPos;
    }
  }

  /**
   * Затримка
   */
  _delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  _updateStatsUI() {
    this.ui.updateLevelInfo({
      levelNum: this.currentLevel + 1,
      desc: this.levelData.desc,
      damage: this.heroDamage,
      armor: this.heroArmor,
      health: this.heroHealth,
      parGold: this.levelData.par.gold
    });
  }

  async _collectItem(row, col, items, onCollect) {
    if (!Array.isArray(items)) return;

    const hasItem = items.some(item => item[0] === row && item[1] === col);
    if (!hasItem) return;

    onCollect();
    this.grid.animateCollect(row, col);
    soundEngine.play('collect');
    this._updateStatsUI();
    await this._delay(GAME_CONFIG.collectAnimMs);
  }

  resetRunner() {
    this.commandIterator = null;
    this.currentStep = 0;
    this.flatCommandsCache = [];

    if (!this.levelData) return;

    this.currentHeroPos = [...this.levelData.hero];

    if (this.grid) {
      if (this.grid.collected && typeof this.grid.collected.clear === 'function') {
        this.grid.collected.clear();
      }
      this.grid.heroPos = [...this.levelData.hero];
      if (typeof this.grid.clearHintPath === 'function') {
        this.grid.clearHintPath();
      }
      this.grid.render();
    }

    this.heroDamage = 0;
    this.heroArmor = 0;
    this.heroHealth = GAME_CONFIG.baseHealth;
    this._updateStatsUI();
    this.ui.hideMessage();
    this.isRunning = false;
  }

  _handleFailedAttempt() {
    if (!this.levelData) return;

    this.currentLevelAttempts += 1;

    if (this.currentLevelAttempts >= 5) {
      this.ui.showDialogue('👀 Хочеш підказку, як дійти?', 'info', 3500);
      if (typeof this.grid.showHintPath === 'function') {
        this.grid.showHintPath([...this.levelData.hero], this.levelData.monster, this.levelData.items);
      }
    } else if (this.currentLevelAttempts >= 3) {
      this.ui.showDialogue('💡 Спробуй інший шлях!', 'info', 2500);
    }
  }

  async executeStep() {
    if (!this.levelData || this.currentStep >= this.flatCommandsCache.length) {
      return false;
    }

    const cmd = this.flatCommandsCache[this.currentStep];
    this.currentStep += 1;

    const newPos = this._getNextPosition(this.currentHeroPos, cmd.direction);

    if (!this.grid.canMoveTo(newPos)) {
      this.grid.animateFailure(this.currentHeroPos, newPos);
      soundEngine.play('bump');
      this.ui.showDialogue('Ой! Стіна!', 'error', 2000);
      this._handleFailedAttempt();
      return false;
    }

    await this.grid.updateHeroPosition(newPos);
    soundEngine.play('step');
    this.currentHeroPos = newPos;

    await this._collectItems(this.currentHeroPos);
    return true;
  }

  async checkFinalPosition() {
    if (!this.levelData) return;

    const [monsterRow, monsterCol] = this.levelData.monster;
    if (this.currentHeroPos[0] === monsterRow && this.currentHeroPos[1] === monsterCol) {
      await this._startBattle();
    } else if (this.currentStep >= this.flatCommandsCache.length) {
      this.ui.showDialogue('Ти не дійшов до монстра! Спробуй ще раз.', 'error', 3000);
      this._handleFailedAttempt();
    }
  }

  /**
   * Прив'язка обробників подій
   */
  _attachEventListeners(elements) {
    // Кнопки команд
    if (elements.commandPalette) {
      const paletteItems = elements.commandPalette.querySelectorAll('[data-command-type]');
      paletteItems.forEach((item) => {
        const descriptor = this._descriptorFromDataset(item.dataset);
        if (!descriptor) return;

        item.addEventListener('click', () => {
          this._applyPaletteCommand(descriptor);
          this.ui.animateButton(item);
          this.ui.animatePaletteTransfer(item, this.elements?.commandList);
        });

        item.addEventListener('dragstart', (event) => {
          if (item.disabled) {
            event.preventDefault();
            return;
          }

          event.dataTransfer.effectAllowed = 'copy';
          event.dataTransfer.setData('text/plain', 'command');
          event.dataTransfer.setData('application/x-new-command', JSON.stringify(descriptor));
          item.classList.add('command-tile--dragging');
        });

        item.addEventListener('dragend', () => {
          item.classList.remove('command-tile--dragging');
        });
      });
    }

    // Кнопки керування
    if (elements.btnRun) {
      elements.btnRun.addEventListener('click', () => this.run());
    }

    if (elements.btnStep) {
      elements.btnStep.addEventListener('click', async () => {
        if (this.isRunning) return;

        this.ui.animateButton(elements.btnStep);

        if (this.commandIterator === null) {
          this.resetRunner();
          this.flatCommandsCache = this.commands.flatten();
          if (this.flatCommandsCache.length === 0) {
            this.ui.showDialogue('Додай команди!', 'error');
            return;
          }
          this.commandIterator = this.flatCommandsCache[Symbol.iterator]();
          this.currentStep = 0;
          this.ui.hideMessage();
        }

        this.ui.setControlsEnabled(false);
        let success = false;
        try {
          success = await this.executeStep();
        } finally {
          this.ui.setControlsEnabled(true);
        }

        if (!success || this.currentStep >= this.flatCommandsCache.length) {
          this.ui.setControlsEnabled(false);
          try {
            await this.checkFinalPosition();
          } finally {
            this.ui.setControlsEnabled(true);
          }
          this.commandIterator = null;
        }
      });
    }

    if (elements.btnClear) {
      elements.btnClear.addEventListener('click', () => {
        this.commands.clear();
        this.resetRunner();
        this.ui.animateButton(elements.btnClear);
      });
    }

    // Туторіал
    if (elements.tutorialCloseBtn) {
      elements.tutorialCloseBtn.addEventListener('click', () => {
        this.ui.hideTutorial();
      });
    }

    // Модальне вікно перемоги
    if (elements.victoryNextBtn) {
      elements.victoryNextBtn.addEventListener('click', () => {
        this.ui.hideVictoryModal();
        this.nextLevel();
      });
    }

    // Звук
    if (elements.soundToggle) {
      elements.soundToggle.addEventListener('click', () => {
        soundEngine.enabled = !soundEngine.enabled;
        this.ui.updateSoundIcon(soundEngine.enabled);
      });
    }

    // Повноекранний режим
    if (elements.fullscreenToggle) {
      elements.fullscreenToggle.addEventListener('click', () => {
        this.ui.toggleFullscreen();
      });
    }
  }

  _descriptorFromDataset(dataset = {}) {
    const type = dataset.commandType;
    if (type === COMMAND_TYPES.MOVE) {
      const direction = dataset.direction;
      if (Object.values(DIRECTIONS).includes(direction)) {
        return { type: COMMAND_TYPES.MOVE, direction };
      }
      return null;
    }

    if (type === COMMAND_TYPES.LOOP) {
      const loopCount = Number(dataset.loopCount);
      return Number.isFinite(loopCount) && loopCount > 0
        ? { type: COMMAND_TYPES.LOOP, loopCount }
        : { type: COMMAND_TYPES.LOOP };
    }

    return null;
  }

  _applyPaletteCommand(descriptor) {
    if (!descriptor) return;

    const target = { parentPath: '', index: this.commands.commands.length };

    if (descriptor.type === COMMAND_TYPES.MOVE) {
      if (descriptor.direction) {
        this.commands.insertCommand({ type: COMMAND_TYPES.MOVE, direction: descriptor.direction }, target);
      }
    } else if (descriptor.type === COMMAND_TYPES.LOOP) {
      if (descriptor.loopCount) {
        this.commands.insertCommand({ type: COMMAND_TYPES.LOOP, loopCount: descriptor.loopCount }, target);
      } else {
        this.commands.insertCommand({ type: COMMAND_TYPES.LOOP }, target);
      }
    }
  }
}
