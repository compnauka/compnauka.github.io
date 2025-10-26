/**
 * Конфігурація Firebase
 * Налаштування підключення до Firebase Authentication та Firestore
 */

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

/**
 * Конфігурація Firebase проекту "goroshek-a0c82"
 * Дані отримані з Firebase Console
 */
const firebaseConfig = {
  apiKey: "AIzaSyB3q8Wi7v6gUEZiUKRbyl_r7zazlO6zy6M",
  authDomain: "goroshek-a0c82.firebaseapp.com",
  projectId: "goroshek-a0c82",
  storageBucket: "goroshek-a0c82.firebasestorage.app",
  messagingSenderId: "705752375449",
  appId: "1:705752375449:web:578c80fb89c974d99e1808"
};

// Ініціалізація Firebase
export const app = initializeApp(firebaseConfig);

// Експорт сервісів
export const auth = getAuth(app);
export const db = getFirestore(app);

// Налаштування для розробки (опціонально)
// Розкоментуйте для використання Firebase Emulator Suite під час розробки
/*
import { connectAuthEmulator } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { connectFirestoreEmulator } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

if (location.hostname === 'localhost') {
  connectAuthEmulator(auth, 'http://localhost:9099');
  connectFirestoreEmulator(db, 'localhost', 8080);
}
*/

// Логування для перевірки ініціалізації (тільки для розробки)
console.log('🔥 Firebase ініціалізовано:', {
  projectId: firebaseConfig.projectId,
  authDomain: firebaseConfig.authDomain
});
