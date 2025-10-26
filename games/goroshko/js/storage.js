/**
 * Модуль збереження прогресу гри з Firebase Firestore
 * Підтримує локальне та хмарне збереження
 */

import {
  doc,
  setDoc,
  getDoc,
  collection,
  query,
  orderBy,
  limit,
  getDocs,
  serverTimestamp,
  increment
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

import { db } from './firebase-config.js';
import { authManager } from './auth.js';

const STORAGE_KEY = 'kotyhoroshko_progress';
const MEDAL_RANK = {
  gold: 3,
  silver: 2,
  bronze: 1
};

function getMedalRank(medal) {
  return MEDAL_RANK[medal] || 0;
}
  
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

      const levelSnap = await getDoc(levelRef);
      const existingData = levelSnap.exists() ? levelSnap.data() : null;
      const currentBestBlocks = typeof existingData?.blocks === 'number' ? existingData.blocks : Number.POSITIVE_INFINITY;
      const newBlocks = typeof data.blocks === 'number' ? data.blocks : Number.POSITIVE_INFINITY;
      const isNewBest = !existingData || newBlocks < currentBestBlocks;

      let finalMedal = existingData?.medal || null;

      const levelUpdate = {
        levelIndex,
        completed: true,
        attempts: increment(1)
      };

      if (isNewBest) {
        const incomingMedal = data.medal || null;
        finalMedal = getMedalRank(incomingMedal) >= getMedalRank(existingData?.medal)
          ? incomingMedal
          : existingData?.medal || incomingMedal;

        levelUpdate.blocks = newBlocks;
        if (finalMedal) {
          levelUpdate.medal = finalMedal;
        }
        levelUpdate.completedAt = serverTimestamp();
      }

      await setDoc(levelRef, levelUpdate, { merge: true });

      const statsUpdate = {
        'stats.totalAttempts': increment(1),
        updatedAt: serverTimestamp()
      };

      if (isNewBest) {
        if (!existingData) {
          statsUpdate['stats.totalCompleted'] = increment(1);
          if (finalMedal) {
            statsUpdate[`stats.${finalMedal}Medals`] = increment(1);
          }
        } else {
          const previousMedal = existingData.medal || null;
          if (getMedalRank(finalMedal) > getMedalRank(previousMedal)) {
            if (previousMedal) {
              statsUpdate[`stats.${previousMedal}Medals`] = increment(-1);
            }
            if (finalMedal) {
              statsUpdate[`stats.${finalMedal}Medals`] = increment(1);
            }
          }
        }
      }

      const userSnap = await getDoc(userRef);
      const currentMaxLevel = userSnap.data()?.stats?.maxLevel || 0;
      const unlockedLevel = levelIndex + 1;
      if (unlockedLevel > currentMaxLevel) {
        statsUpdate['stats.maxLevel'] = unlockedLevel;
      }

      await setDoc(userRef, statsUpdate, { merge: true });

      if (isNewBest) {
        await this._updateLeaderboard(userId, levelIndex, {
          ...data,
          medal: finalMedal || data.medal
        });
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
  
      const levelIndices = Object.keys(levels).map(index => Number(index));
      const highestCompletedLevel = levelIndices.length
        ? Math.max(...levelIndices) + 1
        : 0;
      const storedMaxLevel = userData.stats?.maxLevel || 0;
      const normalizedMaxLevel = Math.max(storedMaxLevel, highestCompletedLevel);

      return {
        version: '1.0',
        maxLevel: normalizedMaxLevel,
        levels,
        stats: {
          ...(userData.stats || {}),
          maxLevel: normalizedMaxLevel
        },
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
            limit(limitCount * 2)
          );

          const snapshot = await getDocs(q);

          const sorted = snapshot.docs
            .map(doc => doc.data())
            .sort((a, b) => {
              if (a.blocks !== b.blocks) {
                return a.blocks - b.blocks;
              }

              const aTime = a.completedAt?.toMillis?.() ?? 0;
              const bTime = b.completedAt?.toMillis?.() ?? 0;
              return aTime - bTime;
            })
            .slice(0, limitCount);

          return sorted.map((data, index) => ({
            rank: index + 1,
            ...data
          }));
        } else {
          // Загальна турнірна таблиця
          const usersRef = collection(db, 'users');
          const q = query(
            usersRef,
            orderBy('stats.totalCompleted', 'desc'),
            limit(limitCount * 3)
          );

          const snapshot = await getDocs(q);

          const players = snapshot.docs
            .map(doc => ({
              userId: doc.id,
              displayName: doc.data().displayName,
              isAnonymous: doc.data().isAnonymous,
              stats: doc.data().stats || {}
            }))
            .filter(player => !player.isAnonymous);

          players.sort((a, b) => {
            const statsA = a.stats;
            const statsB = b.stats;

            if ((statsB.totalCompleted || 0) !== (statsA.totalCompleted || 0)) {
              return (statsB.totalCompleted || 0) - (statsA.totalCompleted || 0);
            }

            if ((statsB.goldMedals || 0) !== (statsA.goldMedals || 0)) {
              return (statsB.goldMedals || 0) - (statsA.goldMedals || 0);
            }

            if ((statsB.silverMedals || 0) !== (statsA.silverMedals || 0)) {
              return (statsB.silverMedals || 0) - (statsA.silverMedals || 0);
            }

            return (statsB.bronzeMedals || 0) - (statsA.bronzeMedals || 0);
          });

          return players
            .slice(0, limitCount)
            .map((player, index) => ({
              rank: index + 1,
              userId: player.userId,
              displayName: player.displayName,
              ...player.stats
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
        const snapshot = await getDocs(scoresRef);

        const players = snapshot.docs
          .map(doc => ({ userId: doc.id, ...doc.data() }))
          .sort((a, b) => {
            if (a.blocks !== b.blocks) {
              return a.blocks - b.blocks;
            }

            const aTime = a.completedAt?.toMillis?.() ?? 0;
            const bTime = b.completedAt?.toMillis?.() ?? 0;
            return aTime - bTime;
          });

        const index = players.findIndex(player => player.userId === userId);
        if (index === -1) {
          return null;
        }

        return index + 1;
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
        const isNewBest = !existing || data.blocks < existing.blocks;

        if (isNewBest) {
          const bestMedal = !existing || getMedalRank(data.medal) >= getMedalRank(existing.medal)
            ? data.medal
            : existing.medal;

          progress.levels[levelIndex] = {
            completed: true,
            blocks: data.blocks,
            medal: bestMedal,
            time: Date.now(),
            attempts: (existing?.attempts || 0) + 1
          };
        } else if (existing) {
          progress.levels[levelIndex].attempts = (existing.attempts || 0) + 1;
        }

        const unlockedLevel = levelIndex + 1;
        if (!progress.maxLevel || unlockedLevel > progress.maxLevel) {
          progress.maxLevel = unlockedLevel;
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
        const progress = data ? JSON.parse(data) : this._getDefaultProgress();

        const levelIndices = Object.keys(progress.levels || {}).map(index => Number(index));
        const highestCompletedLevel = levelIndices.length
          ? Math.max(...levelIndices) + 1
          : 0;

        if (!progress.maxLevel || highestCompletedLevel > progress.maxLevel) {
          progress.maxLevel = highestCompletedLevel;
        }

        return progress;
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
