export class CameraController {
  constructor({ video, canvas, status }) {
    this.video = video;
    this.canvas = canvas;
    this.status = status;
    this.stream = null;
    this.facingMode = 'environment';
    this.requestId = 0;
  }

  get supported() {
    return Boolean(navigator.mediaDevices?.getUserMedia);
  }

  async open() {
    if (!this.supported) throw new Error('camera-unsupported');

    const requestId = ++this.requestId;
    this.stopStreamOnly();
    this.status.textContent = 'Вмикаємо камеру…';

    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          facingMode: { ideal: this.facingMode },
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      });
    } catch (error) {
      if (requestId !== this.requestId) return false;
      throw error;
    }

    if (requestId !== this.requestId) {
      stream.getTracks().forEach((track) => track.stop());
      return false;
    }

    this.stream = stream;
    this.video.srcObject = stream;
    await this.video.play();

    if (requestId !== this.requestId) {
      this.stopStreamOnly();
      return false;
    }

    this.status.textContent = 'Наведи камеру на об’єкт';
    return true;
  }

  async switch() {
    this.facingMode = this.facingMode === 'environment' ? 'user' : 'environment';
    return this.open();
  }

  stop() {
    this.requestId += 1;
    this.stopStreamOnly();
  }

  stopStreamOnly() {
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
      this.stream = null;
    }
    if (this.video) this.video.srcObject = null;
  }

  async captureBlob(maxSide = 2048) {
    const { videoWidth, videoHeight } = this.video;
    if (!videoWidth || !videoHeight) throw new Error('camera-not-ready');

    const scale = Math.min(1, maxSide / Math.max(videoWidth, videoHeight));
    const width = Math.max(1, Math.round(videoWidth * scale));
    const height = Math.max(1, Math.round(videoHeight * scale));
    const canvas = this.canvas;
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d', { alpha: false });
    ctx.save();

    if (this.facingMode === 'user') {
      ctx.translate(width, 0);
      ctx.scale(-1, 1);
    }

    ctx.drawImage(this.video, 0, 0, videoWidth, videoHeight, 0, 0, width, height);
    ctx.restore();

    const blob = await new Promise((resolve, reject) => {
      canvas.toBlob((result) => result ? resolve(result) : reject(new Error('camera-encode-failed')), 'image/jpeg', 0.92);
    });

    return blob;
  }
}
