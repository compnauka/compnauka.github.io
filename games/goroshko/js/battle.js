/**
 * Модуль бойової системи
 * Відповідає за логіку бою між героєм та монстром
 */

import { GAME_CONFIG } from './config.js';
import { soundEngine } from './sound.js';

/**
 * Клас BattleManager
 * Керує боєм, відображенням та результатами
 */
export class BattleManager {
  constructor() {
    this.sceneEl = null;
    this.logEl = null;
    this.heroHealthBar = null;
    this.monsterHealthBar = null;
    this.heroHealthText = null;
    this.monsterHealthText = null;
    this.monsterIconEl = null;
    this.monsterNameEl = null;

    this.heroHealth = GAME_CONFIG.baseHealth;
    this.heroDamage = 0;
    this.heroArmor = 0;
    this.monsterHealth = 0;
    this.monsterMaxHealth = 0; // Додано для зберігання початкового здоров'я
    this.monsterDamage = 0;
    this.monsterName = '';
    this.monsterIcon = '';
  }

  /**
   * Ініціалізація менеджера бою
   * @param {Object} elements - Об'єкт з DOM-елементами
   */
  init(elements) {
    this.sceneEl = elements.scene;
    this.logEl = elements.log;
    this.heroHealthBar = elements.heroHealthBar;
    this.monsterHealthBar = elements.monsterHealthBar;
    this.heroHealthText = elements.heroHealthText;
    this.monsterHealthText = elements.monsterHealthText;
    this.monsterIconEl = elements.monsterIcon;
    this.monsterNameEl = elements.monsterName;
  }

  /**
   * Встановлення статистики героя
   * @param {Object} stats - Характеристики {health, damage, armor}
   */
  setHeroStats(stats) {
    this.heroHealth = stats.health;
    this.heroDamage = stats.damage;
    this.heroArmor = stats.armor;
  }

  /**
   * Встановлення статистики монстра
   * @param {Object} stats - Характеристики {health, damage, name, icon}
   */
  setMonsterStats(stats) {
    this.monsterHealth = stats.health;
    this.monsterMaxHealth = stats.health; // Зберігаємо початкове здоров'я
    this.monsterDamage = stats.damage;
    this.monsterName = stats.name;
    this.monsterIcon = stats.icon;
  }

  /**
   * Показ сцени бою
   */
  show() {
    if (!this.sceneEl) return;

    this.sceneEl.classList.remove('hidden');
    this.logEl.innerHTML = '';

    // Оновлення відображення
    this._updateDisplay();

    // Автоматична прокрутка до сцени бою
    this.sceneEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  /**
   * Приховування сцени бою
   */
  hide() {
    if (!this.sceneEl) return;
    this.sceneEl.classList.add('hidden');
  }

  /**
   * Запуск бою
   * @returns {Promise<boolean>} - true якщо герой переміг, false якщо програв
   */
  async startBattle() {
    this.show();
    
    this._log(`💥 Бій розпочався! ${this.monsterName} атакує!`);
    await this._delay(GAME_CONFIG.battleRoundMs);

    // Бійцівський цикл
    while (this.heroHealth > 0 && this.monsterHealth > 0) {
      // Хід героя
      const heroDmg = Math.max(1, this.heroDamage);
      this.monsterHealth -= heroDmg;
      this._log(`⚔️ Котигорошко завдає ${heroDmg} шкоди!`);
      this._updateDisplay();

      if (this.monsterHealth <= 0) {
        this._log(`🎉 ${this.monsterName} переможений!`);
        await this._delay(GAME_CONFIG.battleRoundMs);
        soundEngine.play('victory');
        return true;
      }

      await this._delay(GAME_CONFIG.battleRoundMs);

      // Хід монстра
      const reducedDmg = Math.max(0, this.monsterDamage - this.heroArmor);
      this.heroHealth -= reducedDmg;
      this._log(`💀 ${this.monsterName} завдає ${reducedDmg} шкоди! (${this.heroArmor} заблоковано)`);
      this._updateDisplay();

      if (this.heroHealth <= 0) {
        this._log(`💔 Котигорошко переможений...`);
        await this._delay(GAME_CONFIG.battleRoundMs);
        soundEngine.play('defeat');
        return false;
      }

      await this._delay(GAME_CONFIG.battleRoundMs);
    }

    return this.heroHealth > 0;
  }

  /**
   * Оновлення відображення здоров'я
   */
  _updateDisplay() {
    // Герой
    const heroPercent = Math.max(0, (this.heroHealth / GAME_CONFIG.baseHealth) * 100);
    this.heroHealthBar.style.width = `${heroPercent}%`;
    this.heroHealthText.textContent = Math.max(0, Math.ceil(this.heroHealth));

    // Монстр (використовуємо початкове здоров'я для відсотка)
    // const monsterMaxHealth = this.monsterHealth + (this.heroDamage * Math.ceil(this.monsterHealth / this.heroDamage || 1)); // <- Це був БАГ
    const monsterPercent = Math.max(0, (this.monsterHealth / this.monsterMaxHealth) * 100); // <- Виправлено
    this.monsterHealthBar.style.width = `${monsterPercent}%`;
    this.monsterHealthText.textContent = Math.max(0, Math.ceil(this.monsterHealth));

    // Іконка та ім'я монстра
    if (this.monsterIconEl) this.monsterIconEl.textContent = this.monsterIcon;
    if (this.monsterNameEl) this.monsterNameEl.textContent = this.monsterName;
  }

  /**
   * Додавання повідомлення до логу бою
   * @param {string} message - Текст повідомлення
   */
  _log(message) {
    if (!this.logEl) return;
    
    const line = document.createElement('div');
    line.className = 'py-0.5 text-yellow-200';
    line.textContent = `> ${message}`;
    this.logEl.appendChild(line);
    this.logEl.scrollTop = this.logEl.scrollHeight;
  }

  /**
   * Затримка
   * @param {number} ms - Мілісекунди
   * @returns {Promise}
   */
  _delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Скидання бою
   */
  reset() {
    this.heroHealth = GAME_CONFIG.baseHealth;
    this.heroDamage = 0;
    this.heroArmor = 0;
    this.monsterHealth = 0;
    this.monsterMaxHealth = 0; // Скидаємо
    this.monsterDamage = 0;
    this.hide();
  }
}