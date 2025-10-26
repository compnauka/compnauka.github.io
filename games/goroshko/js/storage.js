/**
 * Модуль збереження прогресу гри з Firebase Firestore
 * Підтримує локальне та хмарне збереження
 */

import { 
    doc, 
    setDoc, 
    getDoc,
    updateDoc,
    collection,
    query,
    where,
    orderBy,
    limit,
    getDocs,
    serverTimestamp,
    increment
  } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
  
  import { db } from './firebase-config.js';
  import { authManager } from './auth.js';
  
  const STORAGE_KEY = 'kotyhoroshko_progress';
  
  /**
   * Клас StorageManager
   * Керує збереженням прогресу локально та в Firebase
   */
  export class StorageManager {
    constructor() {
      this.localCache = null;
    }
  
    /**
     * Збереження прогресу рівня
     * @param {number} levelIndex - Індекс рівня
     * @param {Object} data - Дані {completed, blocks, medal, time}
     */
    async saveLevelProgress(levelIndex, data) {
      const userId = authManager.getUserId();
  
      // Збереження локально (для офлайн доступу)
      this._saveLocalProgress(levelIndex, data);
  
      // Збереження в Firestore (якщо авторизований)
      if (userId && !authManager.isGuest()) {
        try {
          await this._saveToFirestore(userId, levelIndex, data);
        } catch (error) {
          console.error('Failed to save to Firestore:', error);
        }
      }
  
      return true;
    }
  
    /**
     * Збереження в Firestore
     * @param {string} userId - ID користувача
     * @param {number} levelIndex - Індекс рівня
     * @param {Object} data - Дані рівня
     */
    async _saveToFirestore(userId, levelIndex, data) {
      const levelRef = doc(db, 'users', userId, 'levels', `level_${levelIndex}`);
      const userRef = doc(db, 'users', userId);
  
      // Перевіряємо чи це кращий результат
      const levelSnap = await getDoc(levelRef);
      const isNewBest = !levelSnap.exists() || data.blocks < levelSnap.data()?.blocks;
  
      // Зберігаємо результат рівня
      await setDoc(levelRef, {
        levelIndex,
        completed: true,
        blocks: data.blocks,
        medal: data.medal,
        completedAt: serverTimestamp(),
        attempts: increment(1)
      }, { merge: true });
  
      // Оновлюємо загальну статистику
      const statsUpdate = {
        'stats.totalAttempts': increment(1),
        updatedAt: serverTimestamp()
      };
  
      // Якщо це новий кращий результат, оновлюємо медалі
      if (isNewBest) {
        statsUpdate[`stats.${data.medal}Medals`] = increment(1);
        
        if (!levelSnap.exists()) {
          statsUpdate['stats.totalCompleted'] = increment(1);
        }
      }
  
      // Оновлюємо максимальний рівень
      const userSnap = await getDoc(userRef);
      const currentMaxLevel = userSnap.data()?.stats?.maxLevel || 0;
      if (levelIndex > currentMaxLevel) {
        statsUpdate['stats.maxLevel'] = levelIndex;
      }
  
      await updateDoc(userRef, statsUpdate);
  
      // Додаємо запис у турнірну таблицю
      if (isNewBest) {
        await this._updateLeaderboard(userId, levelIndex, data);
      }
    }
  
    /**
     * Оновлення турнірної таблиці
     * @param {string} userId - ID користувача
     * @param {number} levelIndex - Індекс рівня
     * @param {Object} data - Дані рівня
     */
    async _updateLeaderboard(userId, levelIndex, data) {
      const leaderboardRef = doc(db, 'leaderboards', `level_${levelIndex}`, 'scores', userId);
  
      await setDoc(leaderboardRef, {
        userId,
        displayName: authManager.getUserDisplayName(),
        levelIndex,
        blocks: data.blocks,
        medal: data.medal,
        completedAt: serverTimestamp()
      });
    }
  
    /**
     * Завантаження прогресу
     * @returns {Promise<Object>}
     */
    async loadProgress() {
      const userId = authManager.getUserId();
  
      // Якщо користувач авторизований, завантажуємо з Firestore
      if (userId && !authManager.isGuest()) {
        try {
          return await this._loadFromFirestore(userId);
        } catch (error) {
          console.error('Failed to load from Firestore:', error);
        }
      }
  
      // Інакше завантажуємо локально
      return this._loadLocalProgress();
    }
  
    /**
     * Завантаження з Firestore
     * @param {string} userId - ID користувача
     * @returns {Promise<Object>}
     */
    async _loadFromFirestore(userId) {
      const userRef = doc(db, 'users', userId);
      const userSnap = await getDoc(userRef);
  
      if (!userSnap.exists()) {
        return this._getDefaultProgress();
      }
  
      const userData = userSnap.data();
      
      // Завантажуємо всі рівні
      const levelsRef = collection(db, 'users', userId, 'levels');
      const levelsSnap = await getDocs(levelsRef);
  
      const levels = {};
      levelsSnap.forEach(doc => {
        const data = doc.data();
        levels[data.levelIndex] = data;
      });
  
      return {
        version: '1.0',
        maxLevel: userData.stats?.maxLevel || 0,
        levels,
        stats: userData.stats,
        settings: {
          soundEnabled: true
        },
        createdAt: userData.createdAt?.toMillis() || Date.now(),
        updatedAt: userData.updatedAt?.toMillis() || Date.now()
      };
    }
  
    /**
     * Отримання турнірної таблиці
     * @param {number} levelIndex - Індекс рівня (null для загальної)
     * @param {number} limitCount - Кількість результатів
     * @returns {Promise<Array>}
     */
    async getLeaderboard(levelIndex = null, limitCount = 100) {
      try {
        if (levelIndex !== null) {
          // Турнірна таблиця для конкретного рівня
          const scoresRef = collection(db, 'leaderboards', `level_${levelIndex}`, 'scores');
          const q = query(
            scoresRef,
            orderBy('blocks', 'asc'),
            orderBy('completedAt', 'asc'),
            limit(limitCount)
          );
  
          const snapshot = await getDocs(q);
          return snapshot.docs.map((doc, index) => ({
            rank: index + 1,
            ...doc.data()
          }));
        } else {
          // Загальна турнірна таблиця
          const usersRef = collection(db, 'users');
          const q = query(
            usersRef,
            where('isAnonymous', '==', false),
            orderBy('stats.totalCompleted', 'desc'),
            orderBy('stats.goldMedals', 'desc'),
            limit(limitCount)
          );
  
          const snapshot = await getDocs(q);
          return snapshot.docs.map((doc, index) => ({
            rank: index + 1,
            userId: doc.id,
            displayName: doc.data().displayName,
            ...doc.data().stats
          }));
        }
      } catch (error) {
        console.error('Failed to load leaderboard:', error);
        return [];
      }
    }
  
    /**
     * Отримання позиції користувача в турнірній таблиці
     * @param {number} levelIndex - Індекс рівня
     * @returns {Promise<number>} - Позиція (1-based)
     */
    async getUserRank(levelIndex) {
      const userId = authManager.getUserId();
      if (!userId || authManager.isGuest()) return null;
  
      try {
        const scoresRef = collection(db, 'leaderboards', `level_${levelIndex}`, 'scores');
        const userRef = doc(db, 'leaderboards', `level_${levelIndex}`, 'scores', userId);
        
        const userSnap = await getDoc(userRef);
        if (!userSnap.exists()) return null;
  
        const userBlocks = userSnap.data().blocks;
  
        // Підраховуємо скільки гравців мають кращий результат
        const q = query(scoresRef, where('blocks', '<', userBlocks));
        const snapshot = await getDocs(q);
  
        return snapshot.size + 1;
      } catch (error) {
        console.error('Failed to get user rank:', error);
        return null;
      }
    }
  
    /**
     * === ЛОКАЛЬНЕ ЗБЕРЕЖЕННЯ (для офлайн режиму) ===
     */
  
    /**
     * Локальне збереження
     */
    _saveLocalProgress(levelIndex, data) {
      try {
        const progress = this._loadLocalProgress();
        
        if (!progress.levels) {
          progress.levels = {};
        }
  
        const existing = progress.levels[levelIndex];
        if (!existing || data.blocks < existing.blocks) {
          progress.levels[levelIndex] = {
            completed: true,
            blocks: data.blocks,
            medal: data.medal,
            time: Date.now(),
            attempts: (existing?.attempts || 0) + 1
          };
        } else {
          progress.levels[levelIndex].attempts = (existing.attempts || 0) + 1;
        }
  
        if (!progress.maxLevel || levelIndex > progress.maxLevel) {
          progress.maxLevel = levelIndex;
        }
  
        progress.updatedAt = Date.now();
        localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
      } catch (e) {
        console.error('Failed to save locally:', e);
      }
    }
  
    /**
     * Локальне завантаження
     */
    _loadLocalProgress() {
      try {
        const data = localStorage.getItem(STORAGE_KEY);
        return data ? JSON.parse(data) : this._getDefaultProgress();
      } catch (e) {
        console.error('Failed to load locally:', e);
        return this._getDefaultProgress();
      }
    }
  
    /**
     * Прогрес за замовчуванням
     */
    _getDefaultProgress() {
      return {
        version: '1.0',
        maxLevel: 0,
        levels: {},
        settings: {
          soundEnabled: true
        },
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
    }
  
    /**
     * Отримання прогресу рівня
     */
    async getLevelProgress(levelIndex) {
      const progress = await this.loadProgress();
      return progress.levels?.[levelIndex] || null;
    }
  
    /**
     * Отримання статистики
     */
    async getStats() {
      const progress = await this.loadProgress();
      
      if (progress.stats) {
        return progress.stats;
      }
  
      // Рахуємо локально якщо немає Firebase даних
      const levels = progress.levels || {};
      let totalCompleted = 0;
      let totalAttempts = 0;
      let goldMedals = 0;
      let silverMedals = 0;
      let bronzeMedals = 0;
  
      Object.values(levels).forEach(level => {
        if (level.completed) totalCompleted++;
        totalAttempts += level.attempts || 0;
  
        if (level.medal === 'gold') goldMedals++;
        else if (level.medal === 'silver') silverMedals++;
        else if (level.medal === 'bronze') bronzeMedals++;
      });
  
      return {
        totalCompleted,
        totalAttempts,
        goldMedals,
        silverMedals,
        bronzeMedals,
        maxLevel: progress.maxLevel || 0
      };
    }
  }
  
  // Глобальний екземпляр
  export const storage = new StorageManager();
  