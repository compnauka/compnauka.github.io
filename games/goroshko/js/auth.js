/**
 * Модуль авторизації через Firebase
 * Керує реєстрацією, входом та станом користувача
 */

import {
    signOut,
    onAuthStateChanged,
    GoogleAuthProvider,
    signInWithPopup
  } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
  
  import { 
    doc, 
    setDoc, 
    getDoc,
    serverTimestamp 
  } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';
  
  import { auth, db } from './firebase-config.js';
  
  /**
   * Клас AuthManager
   * Управління всіма аспектами авторизації
   */
  export class AuthManager {
    constructor() {
      this.currentUser = null;
      this.onAuthChangeCallbacks = [];
      this._localVariantKey = null;
    }
  
    /**
     * Ініціалізація відстеження стану авторизації
     */
    init() {
      onAuthStateChanged(auth, async (user) => {
        this.currentUser = user;
        
        if (user) {
          // Перевіряємо чи є профіль у Firestore
          await this._ensureUserProfile(user);
        }

        // Переконуємося, що існує локальний варіант для персоналізації рівнів
        this._ensureLocalVariantKey();

        // Викликаємо всі зареєстровані колбеки
        this.onAuthChangeCallbacks.forEach(callback => callback(user));
      });
    }
  
    /**
     * Реєстрація callback для змін авторизації
     * @param {Function} callback - Функція, що викликається при зміні стану
     */
    onAuthChange(callback) {
      this.onAuthChangeCallbacks.push(callback);
    }
  
    /**
     * Вхід через Google
     * @returns {Promise<Object>}
     */
    async loginWithGoogle() {
      try {
        const provider = new GoogleAuthProvider();
        const userCredential = await signInWithPopup(auth, provider);
        const user = userCredential.user;
  
        // Створюємо профіль якщо це перший вхід
        await this._ensureUserProfile(user);
  
        return { success: true, user };
      } catch (error) {
        console.error('Google login error:', error);
        return { success: false, error: this._getErrorMessage(error) };
      }
    }

    /**
     * Вихід користувача
     * @returns {Promise<Object>}
     */
    async logout() {
      try {
        await signOut(auth);
        return { success: true };
      } catch (error) {
        console.error('Logout error:', error);
        return { success: false, error: this._getErrorMessage(error) };
      }
    }

    /**
     * Перевірка чи користувач авторизований
     * @returns {boolean}
     */
    isAuthenticated() {
      return this.currentUser !== null;
    }

    /**
     * Перевірка чи це гість
     * @returns {boolean}
     */
    isGuest() {
      return !this.currentUser;
    }
  
    /**
     * Отримання поточного користувача
     * @returns {Object|null}
     */
    getCurrentUser() {
      return this.currentUser;
    }
  
    /**
     * Отримання UID користувача
     * @returns {string|null}
     */
    getUserId() {
      return this.currentUser?.uid || null;
    }
  
    /**
     * Отримання імені користувача
     * @returns {string}
     */
    getUserDisplayName() {
      if (!this.currentUser) return 'Гість';
      return this.currentUser.displayName || 'Гравець';
    }

    /**
     * Отримання ключа персоналізації рівнів
     * Використовується для генерації варіацій рівнів для кожного гравця
     * @returns {string}
     */
    getVariantKey() {
      if (this.currentUser?.uid) {
        return this.currentUser.uid;
      }

      return this._ensureLocalVariantKey();
    }

    /**
     * Створення або завантаження локального ключа персоналізації
     * @returns {string}
     */
    _ensureLocalVariantKey() {
      if (this._localVariantKey) {
        return this._localVariantKey;
      }

      try {
        const storageKey = 'kotyhoroshko_variant_key';
        const existing = localStorage.getItem(storageKey);

        if (existing) {
          this._localVariantKey = existing;
          return existing;
        }

        const newKey = crypto.randomUUID ? crypto.randomUUID() : `guest-${Date.now()}-${Math.random()}`;
        localStorage.setItem(storageKey, newKey);
        this._localVariantKey = newKey;
        return newKey;
      } catch (error) {
        console.warn('Не вдалося створити локальний ключ варіанту, використовується запасний:', error);
        this._localVariantKey = 'fallback';
        return this._localVariantKey;
      }
    }
  
    /**
     * Створення профілю користувача у Firestore
     * @param {Object} user - Firebase User
     * @param {Object} additionalData - Додаткові дані
     */
    async _createUserProfile(user, additionalData = {}) {
      try {
        const userRef = doc(db, 'users', user.uid);
        
        await setDoc(userRef, {
          uid: user.uid,
          email: user.email,
          displayName: additionalData.displayName || user.displayName || 'Гравець',
          photoURL: user.photoURL || null,
          isAnonymous: user.isAnonymous,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          stats: {
            totalCompleted: 0,
            totalAttempts: 0,
            goldMedals: 0,
            silverMedals: 0,
            bronzeMedals: 0,
            maxLevel: 0
          }
        });
  
        console.log('User profile created successfully');
      } catch (error) {
        console.error('Error creating user profile:', error);
      }
    }
  
    /**
     * Перевірка та створення профілю якщо не існує
     * @param {Object} user - Firebase User
     */
    async _ensureUserProfile(user) {
      try {
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);
  
        if (!userSnap.exists()) {
          await this._createUserProfile(user);
        }
      } catch (error) {
        console.error('Error ensuring user profile:', error);
      }
    }
  
    /**
     * Отримання зрозумілого повідомлення про помилку
     * @param {Error} error - Об'єкт помилки
     * @returns {string}
     */
    _getErrorMessage(error) {
      const errorMessages = {
        'auth/email-already-in-use': 'Ця email адреса вже використовується',
        'auth/invalid-email': 'Невірний формат email',
        'auth/weak-password': 'Пароль занадто слабкий (мінімум 6 символів)',
        'auth/user-not-found': 'Користувача не знайдено',
        'auth/wrong-password': 'Невірний пароль',
        'auth/too-many-requests': 'Забагато спроб. Спробуйте пізніше',
        'auth/popup-closed-by-user': 'Вікно авторизації закрито',
        'auth/cancelled-popup-request': 'Авторизацію скасовано'
      };
  
      return errorMessages[error.code] || 'Сталася помилка. Спробуйте ще раз';
    }
  }
  
  // Глобальний екземпляр
  export const authManager = new AuthManager();
  