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
  constructor() {
    this.currentLevel = 0;
    this.levelData = null;
    this.isRunning = false;
    this.elements = null;

    // Статистика героя
    this.heroDamage = 0;
    this.heroArmor = 0;
    this.heroHealth = GAME_CONFIG.baseHealth;

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
    this.commands.init(elements.commandList);
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
    this.levelData = getLevel(levelIndex);

    if (!this.levelData) {
      throw new Error(`Level with index ${levelIndex} not found.`);
    }

    // Скидання стану
    this.heroDamage = 0;
    this.heroArmor = 0;
    this.heroHealth = GAME_CONFIG.baseHealth;
    this.commands.clear();
    this.battle.reset();

    // Оновлення сітки
    const gridElement = this.elements?.grid || document.getElementById('grid');
    if (!gridElement) {
      throw new Error('Grid element not found in the DOM.');
    }

    this.grid.init(gridElement, this.levelData);
    this.grid.monsterIcon = this.levelData.monsterStats.icon;

    // Оновлення UI
    this._updateStatsUI();

    this.ui.updateButtonsVisibility(levelIndex);
    this.ui.hideMessage();
    this.ui.hideVictoryModal();

    // Показ туторіалу для рівня з циклами
    if (levelIndex === 4) {
      this.ui.showTutorial();
    }
  }

  /**
   * Запуск алгоритму
   */
  async run() {
    if (this.isRunning) return;

    const flatCommands = this.commands.flatten();
    if (flatCommands.length === 0) {
      this.ui.showMessage('Додай команди до алгоритму!', 'error');
      return;
    }

    this.isRunning = true;
    this.ui.setControlsEnabled(false);
    this.ui.hideMessage();

    // Скидання позиції героя
    let heroPos = [...this.levelData.hero];
    this.grid.heroPos = heroPos;

    // Виконання команд
    for (const cmd of flatCommands) {
      if (!this.isRunning) break;

      const newPos = this._getNextPosition(heroPos, cmd.direction);

      // Перевірка можливості руху
      if (!this.grid.canMoveTo(newPos)) {
        this.ui.showMessage('❌ Котигорошко врізався в перешкоду!', 'error');
        this.grid.flashCell(newPos);
        this.isRunning = false;
        this.ui.setControlsEnabled(true);
        return;
      }

      // Рух героя
      await this.grid.updateHeroPosition(newPos);
      heroPos = newPos;

      // Збір предметів
      await this._collectItems(heroPos);

      await this._delay(GAME_CONFIG.stepMs);
    }

    // Перевірка досягнення монстра
    const [monsterRow, monsterCol] = this.levelData.monster;
    if (heroPos[0] === monsterRow && heroPos[1] === monsterCol) {
      await this._startBattle();
    } else {
      this.ui.showMessage('Ти не дійшов до монстра! Спробуй ще раз.', 'error');
      this.isRunning = false;
      this.ui.setControlsEnabled(true);
    }
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
      this.ui.showMessage('💔 Поразка! Спробуй краще спорядження або алгоритм.', 'error');
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
    this._updateStatsUI();
    await this._delay(GAME_CONFIG.collectAnimMs);
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
        });

        item.addEventListener('dragstart', (event) => {
          if (item.disabled) {
            event.preventDefault();
            return;
          }

          event.dataTransfer.effectAllowed = 'copy';
          event.dataTransfer.setData('text/plain', 'command');
          event.dataTransfer.setData('application/x-new-command', JSON.stringify(descriptor));
          item.classList.add('palette-block--dragging');
        });

        item.addEventListener('dragend', () => {
          item.classList.remove('palette-block--dragging');
        });
      });
    }

    // Кнопки керування
    if (elements.btnRun) {
      elements.btnRun.addEventListener('click', () => this.run());
    }

    if (elements.btnClear) {
      elements.btnClear.addEventListener('click', () => {
        this.commands.clear();
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

    if (descriptor.type === COMMAND_TYPES.MOVE) {
      this.commands.addMove(descriptor.direction);
    } else if (descriptor.type === COMMAND_TYPES.LOOP) {
      if (descriptor.loopCount) {
        this.commands.insertCommand({ type: COMMAND_TYPES.LOOP, loopCount: descriptor.loopCount });
      } else {
        this.commands.addLoop();
      }
    }
  }
}
