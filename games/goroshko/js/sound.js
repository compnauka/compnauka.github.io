/**
 * Аудіо-движок для гри
 * Відповідає за відтворення звуків перемоги та поразки
 */

import { GAME_CONFIG } from './config.js';

/**
 * Клас SoundEngine
 * Керує завантаженням та відтворенням звуків
 */
export class SoundEngine {
  constructor() {
    this.urls = GAME_CONFIG.soundUrls;
    this.enabled = true;
    this.ctx = null;
    this.buffers = new Map();
    this._unlocked = false;
  }

  /**
   * Розблокування AudioContext
   * Необхідно для браузерів, які вимагають взаємодії користувача
   */
  async unlock() {
    if (this._unlocked) return;
    
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      const buffer = this.ctx.createBuffer(1, 1, 22050);
      const source = this.ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(this.ctx.destination);
      source.start(0);
      this._unlocked = true;
    } catch (e) {
      console.warn('AudioContext unlock failed:', e);
    }
  }

  /**
   * Завантаження звукового файлу
   * @param {string} name - Назва звуку (victory, defeat)
   * @returns {AudioBuffer|null} - Завантажений буфер або null
   */
  async load(name) {
    if (!this.ctx) return null;
    if (this.buffers.has(name)) return this.buffers.get(name);

    try {
      const response = await fetch(this.urls[name]);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await this.ctx.decodeAudioData(arrayBuffer);
      this.buffers.set(name, audioBuffer);
      return audioBuffer;
    } catch (e) {
      console.warn(`Failed to load sound: ${name}`, e);
      return null;
    }
  }

  /**
   * Відтворення звуку
   * @param {string} name - Назва звуку
   * @param {number} volume - Гучність (0-1)
   */
  async play(name, volume = GAME_CONFIG.defaultSoundVolume) {
    if (!this.enabled) return;

    if (this.ctx) {
      try {
        const buffer = await this.load(name);
        if (!buffer) return;

        const source = this.ctx.createBufferSource();
        const gainNode = this.ctx.createGain();
        gainNode.gain.value = volume;
        source.buffer = buffer;
        source.connect(gainNode).connect(this.ctx.destination);
        source.start(this.ctx.currentTime);
        return;
      } catch (e) {
        console.warn('Sound playback failed:', e);
      }
    }

    // Fallback для старих браузерів
    const audio = new Audio(this.urls[name]);
    audio.volume = volume;
    audio.play().catch(() => {});
  }
}

// Створення глобального екземпляру
export const soundEngine = new SoundEngine();

// Розблокування при першій взаємодії користувача
if (typeof window !== 'undefined') {
  window.addEventListener('pointerdown', () => soundEngine.unlock(), { 
    once: true, 
    passive: true 
  });
}
