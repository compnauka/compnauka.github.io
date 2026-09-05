import { CameraController } from './camera.js';
import { ImageProcessor } from './image-processor.js';
import { CropController } from './crop-controller.js';
import { Feedback, Confetti } from './effects.js';
import { PuzzleGame } from './puzzle-game.js';

const VIEWS = new Set(['home', 'camera', 'crop', 'game', 'win']);

class DivoPuzzleApp {
  constructor() {
    this.currentView = 'home';
    this.level = 2;
    this.sourceAsset = null;
    this.gameAsset = null;
    this.photoRequestId = 0;
    this.buildRequestId = 0;
    this.toastTimer = 0;

    this.els = {
      fileInput: qs('#file-input'),
      video: qs('#video-feed'),
      photoCanvas: qs('#photo-canvas'),
      cameraStatus: qs('#camera-status'),
      cropViewport: qs('#crop-viewport'),
      cropImage: qs('#crop-image'),
      createButton: qs('#create-puzzle-button'),
      referenceImg: qs('#reference-img'),
      winImage: qs('#win-image'),
      boardHint: qs('#board-bg-hint'),
      board: qs('#board'),
      slots: qs('#slots-container'),
      leftTray: qs('#left-tray'),
      rightTray: qs('#right-tray'),
      progressFill: qs('#progress-fill'),
      progressText: qs('#progress-text'),
      hintButton: qs('#hint-button'),
      coach: qs('#gesture-coach'),
      toast: qs('#toast'),
      confetti: qs('#confetti-canvas')
    };

    this.processor = new ImageProcessor();
    this.camera = new CameraController({
      video: this.els.video,
      canvas: this.els.photoCanvas,
      status: this.els.cameraStatus
    });
    this.crop = new CropController({ viewport: this.els.cropViewport, image: this.els.cropImage });
    this.feedback = new Feedback();
    this.confetti = new Confetti(this.els.confetti);
    this.game = new PuzzleGame({
      els: {
        leftTray: this.els.leftTray,
        rightTray: this.els.rightTray,
        board: this.els.board,
        boardHint: this.els.boardHint,
        slots: this.els.slots,
        progressFill: this.els.progressFill,
        progressText: this.els.progressText,
        hintButton: this.els.hintButton,
        referenceImg: this.els.referenceImg,
        coach: this.els.coach
      },
      feedback: this.feedback,
      onWin: () => this.handleWin()
    });

    this.bindUI();
    this.registerServiceWorker();
  }

  bindUI() {
    document.addEventListener('click', (event) => {
      const levelButton = event.target.closest('[data-level]');
      if (levelButton) {
        this.setLevel(Number(levelButton.dataset.level));
        return;
      }

      const actionButton = event.target.closest('[data-action]');
      if (!actionButton) return;
      const actions = {
        'open-camera': () => this.openCamera(),
        'close-camera': () => this.goHome(),
        'switch-camera': () => this.switchCamera(),
        'take-photo': () => this.takePhoto(),
        'discard-photo': () => this.goHome(),
        'reset-crop': () => this.crop.reset(),
        'create-puzzle': () => this.createPuzzle(),
        'leave-game': () => this.goHome(),
        'new-photo': () => this.goHome(),
        'play-again': () => this.playAgain()
      };
      actions[actionButton.dataset.action]?.();
    });

    this.els.fileInput.addEventListener('change', (event) => this.handleFile(event));
    this.els.hintButton.addEventListener('click', () => this.game.toggleHint());

    window.addEventListener('resize', () => {
      if (this.currentView === 'crop') this.crop.resize();
      if (this.currentView === 'game') this.game.queueResize();
    });
    window.addEventListener('orientationchange', () => {
      window.setTimeout(() => {
        if (this.currentView === 'crop') this.crop.resize();
        if (this.currentView === 'game') this.game.queueResize();
      }, 120);
    });
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.camera.stop();
      } else if (this.currentView === 'camera') {
        this.openCamera();
      }
    });
    window.addEventListener('pagehide', () => this.camera.stop());
  }

  setLevel(level) {
    if (![2, 3, 4].includes(level)) return;
    this.level = level;
    document.querySelectorAll('[data-level]').forEach((button) => {
      const selected = Number(button.dataset.level) === level;
      button.classList.toggle('is-selected', selected);
      button.setAttribute('aria-checked', String(selected));
    });
  }

  showView(name) {
    if (!VIEWS.has(name)) return;
    this.currentView = name;
    document.querySelectorAll('[data-view]').forEach((view) => {
      const active = view.dataset.view === name;
      view.hidden = !active;
      view.classList.toggle('is-active', active);
    });

    if (name !== 'camera') this.camera.stop();
    if (name !== 'win') this.confetti.clear();
    if (name === 'crop') requestAnimationFrame(() => this.crop.resize());
    if (name === 'game') requestAnimationFrame(() => this.game.calculateSizes());
  }

  async openCamera() {
    if (!this.camera.supported) {
      this.showToast('Камера тут недоступна. Обери фото з галереї.');
      return;
    }

    this.showView('camera');
    try {
      await this.camera.open();
      if (this.currentView !== 'camera') this.camera.stop();
    } catch (error) {
      console.warn('Camera error:', error);
      if (this.currentView === 'camera') this.showView('home');
      this.showToast(this.cameraErrorMessage(error));
    }
  }

  async switchCamera() {
    if (this.currentView !== 'camera') return;
    try {
      await this.camera.switch();
      if (this.currentView !== 'camera') this.camera.stop();
    } catch (error) {
      console.warn('Camera switch error:', error);
      this.camera.stop();
      this.showToast('Не вдалося перемкнути камеру.');
    }
  }

  async takePhoto() {
    if (this.currentView !== 'camera') return;
    const requestId = ++this.photoRequestId;
    this.els.cameraStatus.textContent = 'Готуємо фото…';
    try {
      const blob = await this.camera.captureBlob();
      if (requestId !== this.photoRequestId || this.currentView !== 'camera') return;
      this.camera.stop();
      await this.loadPhotoBlob(blob, requestId);
    } catch (error) {
      if (requestId !== this.photoRequestId || this.currentView !== 'camera') return;
      console.warn('Capture error:', error);
      this.els.cameraStatus.textContent = 'Наведи камеру на об’єкт';
      this.showToast(error.message === 'camera-not-ready' ? 'Камера ще не готова. Спробуй ще раз.' : 'Не вдалося зробити фото.');
    }
  }

  async handleFile(event) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    const requestId = ++this.photoRequestId;
    this.showToast('Готуємо фото…');
    try {
      const asset = await this.processor.fromFile(file);
      if (requestId !== this.photoRequestId) {
        this.processor.release(asset);
        return;
      }
      this.setSourceAsset(asset);
    } catch (error) {
      if (requestId !== this.photoRequestId) return;
      console.warn('File error:', error);
      this.showToast(this.imageErrorMessage(error));
    }
  }

  async loadPhotoBlob(blob, requestId = ++this.photoRequestId) {
    if (requestId !== this.photoRequestId) return;
    try {
      const asset = await this.processor.fromCamera(blob);
      if (requestId !== this.photoRequestId) {
        this.processor.release(asset);
        return;
      }
      this.setSourceAsset(asset);
    } catch (error) {
      if (requestId !== this.photoRequestId) return;
      console.warn('Photo processing error:', error);
      this.showView('home');
      this.showToast(this.imageErrorMessage(error));
    }
  }

  setSourceAsset(asset) {
    this.releaseAsset('sourceAsset');
    this.releaseAsset('gameAsset');
    this.sourceAsset = asset;
    this.showView('crop');
    this.crop.setAsset(asset);
    this.setLevel(this.level);
  }

  async createPuzzle() {
    if (!this.sourceAsset || this.els.createButton.disabled) return;
    const requestId = ++this.buildRequestId;
    this.els.createButton.disabled = true;
    this.els.createButton.setAttribute('aria-busy', 'true');

    try {
      const cropSpec = this.crop.getCropSpec();
      const asset = await this.processor.renderSquare(this.sourceAsset, cropSpec);
      if (requestId !== this.buildRequestId) {
        this.processor.release(asset);
        return;
      }

      this.releaseAsset('gameAsset');
      this.gameAsset = asset;
      this.crop.clear();
      this.releaseAsset('sourceAsset');
      this.els.winImage.src = asset.url;
      this.game.init({ level: this.level, imageUrl: asset.url });
      this.showView('game');
    } catch (error) {
      if (requestId !== this.buildRequestId) return;
      console.warn('Puzzle build error:', error);
      this.showToast('Не вдалося створити пазл. Спробуй інше фото.');
    } finally {
      if (requestId === this.buildRequestId) {
        this.els.createButton.disabled = false;
        this.els.createButton.removeAttribute('aria-busy');
      }
    }
  }

  playAgain() {
    if (!this.gameAsset) {
      this.goHome();
      return;
    }
    this.game.init({ level: this.level, imageUrl: this.gameAsset.url });
    this.showView('game');
  }

  handleWin() {
    if (this.currentView !== 'game' || !this.gameAsset) return;
    this.feedback.win();
    this.els.winImage.src = this.gameAsset.url;
    this.showView('win');
    this.confetti.start();
  }

  goHome() {
    this.clearPhotoState();
    this.showView('home');
  }

  clearPhotoState() {
    this.photoRequestId += 1;
    this.buildRequestId += 1;
    this.camera.stop();
    this.game.destroy();
    this.crop.clear();
    this.releaseAsset('sourceAsset');
    this.releaseAsset('gameAsset');
    this.els.winImage.removeAttribute('src');
    this.els.referenceImg.removeAttribute('src');
    this.els.boardHint.style.backgroundImage = '';
    this.els.createButton.disabled = false;
    this.els.createButton.removeAttribute('aria-busy');
  }

  releaseAsset(key) {
    if (!this[key]) return;
    this.processor.release(this[key]);
    this[key] = null;
  }

  cameraErrorMessage(error) {
    if (error?.name === 'NotAllowedError' || error?.name === 'SecurityError') return 'Дозволь доступ до камери або обери фото з галереї.';
    if (error?.name === 'NotFoundError') return 'Камеру не знайдено. Обери фото з галереї.';
    if (error?.name === 'NotReadableError') return 'Камера зараз зайнята іншим застосунком.';
    return 'Не вдалося відкрити камеру. Обери фото з галереї.';
  }

  imageErrorMessage(error) {
    const code = error?.message;
    if (code === 'file-type' || code === 'file-signature') return 'Підтримуються справжні фото JPEG, PNG, WebP та сумісні HEIC/HEIF.';
    if (code === 'file-too-large') return 'Фото завелике. Обери файл до 20 МБ.';
    if (code === 'image-dimensions-too-large') return 'У цього фото надто велика роздільність. Обери інше.';
    return 'Не вдалося прочитати фото. Спробуй JPEG, PNG або WebP.';
  }

  showToast(message) {
    clearTimeout(this.toastTimer);
    this.els.toast.textContent = message;
    this.els.toast.hidden = false;
    this.toastTimer = window.setTimeout(() => {
      this.els.toast.hidden = true;
    }, 3200);
  }

  registerServiceWorker() {
    if (!('serviceWorker' in navigator) || location.protocol === 'file:') return;
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./service-worker.js', { scope: './' }).catch((error) => {
        console.warn('Service worker registration failed:', error);
      });
    });
  }
}

function qs(selector) {
  const element = document.querySelector(selector);
  if (!element) throw new Error(`Missing element: ${selector}`);
  return element;
}

new DivoPuzzleApp();
