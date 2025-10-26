/**
 * Основний ігровий модуль
 * Координує всі компоненти гри та керує ігровим процесом
 */

import { GAME_CONFIG, DIRECTIONS } from './config.js';
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
    // Ініціалізація менеджерів
    this.ui.init(elements);
    this.commands.init(elements.commandList);
    this.commands.setLoopStateListener((state) => {
      this.ui.updateLoopMode(state);
    });
    this.ui.updateLoopMode({ active: false, stepCount: 0 });
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
    } catch (error) {
      console.error("Failed to load progress, starting from level 0.", error);
      this.loadLevel(0);
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

    // Скидання стану
    this.heroDamage = 0;
    this.heroArmor = 0;
    this.heroHealth = GAME_CONFIG.baseHealth;
    this.commands.clear();
    this.battle.reset();

    // Оновлення сітки
    this.grid.init(document.getElementById('grid'), this.levelData);
    this.grid.monsterIcon = this.levelData.monsterStats.icon;

    // Оновлення UI
    this.ui.updateLevelInfo({
      levelNum: levelIndex + 1,
      desc: this.levelData.desc,
      damage: this.heroDamage,
      armor: this.heroArmor,
      health: this.heroHealth,
      parGold: this.levelData.par.gold
    });

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
        this.grid.flashCell(newPos); // <--- Доданий рядок
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
    if (this.levelData.items.weapons.some(w => w[0] === row && w[1] === col)) {
      this.heroDamage += GAME_CONFIG.baseDamage;
      this.grid.animateCollect(row, col);
      this.ui.updateLevelInfo({
        levelNum: this.currentLevel + 1,
        desc: this.levelData.desc,
        damage: this.heroDamage,
        armor: this.heroArmor,
        health: this.heroHealth,
        parGold: this.levelData.par.gold
      });
      await this._delay(GAME_CONFIG.collectAnimMs);
    }

    // Броня
    if (this.levelData.items.armor.some(a => a[0] === row && a[1] === col)) {
      this.heroArmor += GAME_CONFIG.baseArmor;
      this.grid.animateCollect(row, col);
      this.ui.updateLevelInfo({
        levelNum: this.currentLevel + 1,
        desc: this.levelData.desc,
        damage: this.heroDamage,
        armor: this.heroArmor,
        health: this.heroHealth,
        parGold: this.levelData.par.gold
      });
      await this._delay(GAME_CONFIG.collectAnimMs);
    }

    // Зілля
    if (this.levelData.items.potions.some(p => p[0] === row && p[1] === col)) {
      this.heroHealth = Math.min(GAME_CONFIG.baseHealth, this.heroHealth + GAME_CONFIG.potionHealth);
      this.grid.animateCollect(row, col);
      this.ui.updateLevelInfo({
        levelNum: this.currentLevel + 1,
        desc: this.levelData.desc,
        damage: this.heroDamage,
        armor: this.heroArmor,
        health: this.heroHealth,
        parGold: this.levelData.par.gold
      });
      await this._delay(GAME_CONFIG.collectAnimMs);
    }
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
    storage.saveLevelProgress(this.currentLevel, {
      completed: true,
      blocks,
      medal,
      time: Date.now()
    });

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

  /**
   * Прив'язка обробників подій
   */
  _attachEventListeners(elements) {
    // Кнопки команд
    if (elements.btnUp) {
      elements.btnUp.addEventListener('click', () => {
        this.commands.addMove(DIRECTIONS.UP);
        this.ui.animateButton(elements.btnUp);
      });
    }

    if (elements.btnDown) {
      elements.btnDown.addEventListener('click', () => {
        this.commands.addMove(DIRECTIONS.DOWN);
        this.ui.animateButton(elements.btnDown);
      });
    }

    if (elements.btnLeft) {
      elements.btnLeft.addEventListener('click', () => {
        this.commands.addMove(DIRECTIONS.LEFT);
        this.ui.animateButton(elements.btnLeft);
      });
    }

    if (elements.btnRight) {
      elements.btnRight.addEventListener('click', () => {
        this.commands.addMove(DIRECTIONS.RIGHT);
        this.ui.animateButton(elements.btnRight);
      });
    }

    // Кнопки циклів
    if (elements.btnLoop) {
      elements.btnLoop.addEventListener('click', () => {
        this.commands.startLoop();
        this.ui.animateButton(elements.btnLoop);
      });
    }

    if (elements.btnRoot) {
      elements.btnRoot.addEventListener('click', () => {
        this.commands.endLoop();
        this.ui.animateButton(elements.btnRoot);
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
}
