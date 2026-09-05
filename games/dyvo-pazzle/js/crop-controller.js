const MIN_ZOOM = 1;
const MAX_ZOOM = 4;

export class CropController {
  constructor({ viewport, image }) {
    this.viewport = viewport;
    this.image = image;
    this.asset = null;
    this.zoom = 1;
    this.panX = 0;
    this.panY = 0;
    this.baseScale = 1;
    this.pointers = new Map();
    this.dragStart = null;
    this.pinchStart = null;

    this.onPointerDown = this.onPointerDown.bind(this);
    this.onPointerMove = this.onPointerMove.bind(this);
    this.onPointerUp = this.onPointerUp.bind(this);

    viewport.addEventListener('pointerdown', this.onPointerDown);
    viewport.addEventListener('pointermove', this.onPointerMove, { passive: false });
    viewport.addEventListener('pointerup', this.onPointerUp);
    viewport.addEventListener('pointercancel', this.onPointerUp);
  }

  setAsset(asset) {
    this.asset = asset;
    this.image.src = asset?.url || '';
    this.zoom = 1;
    this.panX = 0;
    this.panY = 0;
    this.pointers.clear();
    this.dragStart = null;
    this.pinchStart = null;
    requestAnimationFrame(() => this.reset());
  }

  clear() {
    this.asset = null;
    this.image.removeAttribute('src');
    this.pointers.clear();
    this.dragStart = null;
    this.pinchStart = null;
  }

  reset() {
    if (!this.asset) return;
    this.zoom = 1;
    this.panX = 0;
    this.panY = 0;
    this.measure();
    this.updateImage();
  }

  resize() {
    if (!this.asset) return;
    this.measure();
    this.clampPan();
    this.updateImage();
  }

  measure() {
    if (!this.asset) return;
    const rect = this.viewport.getBoundingClientRect();
    this.viewportSize = Math.max(1, Math.min(rect.width, rect.height));
    this.baseScale = Math.max(this.viewportSize / this.asset.width, this.viewportSize / this.asset.height);
  }

  getCropSpec() {
    if (!this.asset) throw new Error('crop-no-image');
    this.measure();
    const displayScale = this.baseScale * this.zoom;
    const size = this.viewportSize / displayScale;
    const centerX = this.asset.width / 2 - this.panX / displayScale;
    const centerY = this.asset.height / 2 - this.panY / displayScale;
    return { centerX, centerY, size };
  }

  onPointerDown(event) {
    if (!this.asset || event.button > 0) return;
    event.preventDefault();
    this.viewport.setPointerCapture?.(event.pointerId);
    this.pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });

    if (this.pointers.size === 1) {
      this.dragStart = {
        x: event.clientX,
        y: event.clientY,
        panX: this.panX,
        panY: this.panY
      };
      this.pinchStart = null;
    } else if (this.pointers.size === 2) {
      this.beginPinch();
    }
  }

  onPointerMove(event) {
    if (!this.asset || !this.pointers.has(event.pointerId)) return;
    event.preventDefault();
    this.pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });

    if (this.pointers.size === 1 && this.dragStart) {
      this.panX = this.dragStart.panX + (event.clientX - this.dragStart.x);
      this.panY = this.dragStart.panY + (event.clientY - this.dragStart.y);
      this.clampPan();
      this.updateImage();
      return;
    }

    if (this.pointers.size >= 2) {
      if (!this.pinchStart) this.beginPinch();
      this.updatePinch();
    }
  }

  onPointerUp(event) {
    if (!this.pointers.has(event.pointerId)) return;
    this.pointers.delete(event.pointerId);
    try { this.viewport.releasePointerCapture?.(event.pointerId); } catch (_) { /* optional */ }

    if (this.pointers.size === 1) {
      const point = [...this.pointers.values()][0];
      this.dragStart = { x: point.x, y: point.y, panX: this.panX, panY: this.panY };
      this.pinchStart = null;
    } else if (this.pointers.size === 0) {
      this.dragStart = null;
      this.pinchStart = null;
    }
  }

  beginPinch() {
    const [a, b] = [...this.pointers.values()].slice(0, 2);
    const midpoint = mid(a, b);
    const scale = this.baseScale * this.zoom;
    const viewport = this.viewport.getBoundingClientRect();
    const center = { x: viewport.left + viewport.width / 2, y: viewport.top + viewport.height / 2 };

    this.pinchStart = {
      distance: Math.max(1, distance(a, b)),
      zoom: this.zoom,
      sourceDx: (midpoint.x - (center.x + this.panX)) / scale,
      sourceDy: (midpoint.y - (center.y + this.panY)) / scale
    };
  }

  updatePinch() {
    if (!this.pinchStart) return;
    const [a, b] = [...this.pointers.values()].slice(0, 2);
    const midpoint = mid(a, b);
    const viewport = this.viewport.getBoundingClientRect();
    const center = { x: viewport.left + viewport.width / 2, y: viewport.top + viewport.height / 2 };
    const ratio = distance(a, b) / this.pinchStart.distance;
    const nextZoom = clamp(this.pinchStart.zoom * ratio, MIN_ZOOM, MAX_ZOOM);
    const nextScale = this.baseScale * nextZoom;

    this.zoom = nextZoom;
    this.panX = midpoint.x - center.x - this.pinchStart.sourceDx * nextScale;
    this.panY = midpoint.y - center.y - this.pinchStart.sourceDy * nextScale;
    this.clampPan();
    this.updateImage();
  }

  clampPan() {
    if (!this.asset) return;
    this.measure();
    const displayW = this.asset.width * this.baseScale * this.zoom;
    const displayH = this.asset.height * this.baseScale * this.zoom;
    const maxX = Math.max(0, (displayW - this.viewportSize) / 2);
    const maxY = Math.max(0, (displayH - this.viewportSize) / 2);
    this.panX = clamp(this.panX, -maxX, maxX);
    this.panY = clamp(this.panY, -maxY, maxY);
  }

  updateImage() {
    if (!this.asset) return;
    const rect = this.viewport.getBoundingClientRect();
    const width = this.asset.width * this.baseScale * this.zoom;
    const height = this.asset.height * this.baseScale * this.zoom;
    this.image.style.width = `${width}px`;
    this.image.style.height = `${height}px`;
    this.image.style.left = `${rect.width / 2 + this.panX}px`;
    this.image.style.top = `${rect.height / 2 + this.panY}px`;
  }
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}
function distance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}
function mid(a, b) {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}
