const ALLOWED_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif'
]);
const ALLOWED_EXTENSIONS = new Set(['jpg', 'jpeg', 'png', 'webp', 'heic', 'heif']);
const MAX_FILE_BYTES = 20 * 1024 * 1024;
const MAX_INPUT_PIXELS = 60_000_000;
const MAX_SOURCE_SIDE = 2048;
const OUTPUT_SIDE = 1280;

export class ImageProcessor {
  async validateFile(file) {
    if (!file) throw new Error('file-missing');
    if (file.size > MAX_FILE_BYTES) throw new Error('file-too-large');

    const declaredType = (file.type || '').toLowerCase();
    const extension = (file.name.split('.').pop() || '').toLowerCase();
    const declarationAllowed = ALLOWED_TYPES.has(declaredType) || (!declaredType && ALLOWED_EXTENSIONS.has(extension));
    if (!declarationAllowed) throw new Error('file-type');

    const sniffedType = await sniffImageType(file);
    if (!sniffedType) throw new Error('file-signature');
  }

  async fromFile(file) {
    await this.validateFile(file);
    return this.normalizeBlob(file);
  }

  async fromCamera(blob) {
    if (!blob || !blob.type.startsWith('image/')) throw new Error('camera-image-invalid');
    return this.normalizeBlob(blob);
  }

  async normalizeBlob(blob) {
    const decoded = await this.decode(blob);
    const width = decoded.width;
    const height = decoded.height;

    if (!width || !height) {
      decoded.close?.();
      throw new Error('image-empty');
    }
    if (width * height > MAX_INPUT_PIXELS) {
      decoded.close?.();
      throw new Error('image-dimensions-too-large');
    }

    const scale = Math.min(1, MAX_SOURCE_SIDE / Math.max(width, height));
    const outW = Math.max(1, Math.round(width * scale));
    const outH = Math.max(1, Math.round(height * scale));
    const canvas = document.createElement('canvas');
    canvas.width = outW;
    canvas.height = outH;
    const ctx = canvas.getContext('2d', { alpha: false });
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, outW, outH);
    ctx.drawImage(decoded, 0, 0, width, height, 0, 0, outW, outH);
    decoded.close?.();

    const normalized = await this.canvasToBlob(canvas, 'image/jpeg', 0.92);
    return this.assetFromBlob(normalized, outW, outH);
  }

  async renderSquare(asset, cropSpec) {
    if (!asset?.blob) throw new Error('image-missing');
    const decoded = await this.decode(asset.blob);
    const canvas = document.createElement('canvas');
    canvas.width = OUTPUT_SIDE;
    canvas.height = OUTPUT_SIDE;
    const ctx = canvas.getContext('2d', { alpha: false });
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, OUTPUT_SIDE, OUTPUT_SIDE);

    const size = Math.max(1, Math.min(cropSpec.size, asset.width, asset.height));
    const maxX = Math.max(0, asset.width - size);
    const maxY = Math.max(0, asset.height - size);
    const sx = clamp(cropSpec.centerX - size / 2, 0, maxX);
    const sy = clamp(cropSpec.centerY - size / 2, 0, maxY);

    ctx.drawImage(decoded, sx, sy, size, size, 0, 0, OUTPUT_SIDE, OUTPUT_SIDE);
    decoded.close?.();

    const result = await this.canvasToBlob(canvas, 'image/jpeg', 0.90);
    return this.assetFromBlob(result, OUTPUT_SIDE, OUTPUT_SIDE);
  }

  assetFromBlob(blob, width, height) {
    return { blob, width, height, url: URL.createObjectURL(blob) };
  }

  release(asset) {
    if (asset?.url) URL.revokeObjectURL(asset.url);
  }

  async decode(blob) {
    if ('createImageBitmap' in window) {
      try {
        return await createImageBitmap(blob, { imageOrientation: 'from-image' });
      } catch (_) {
        try {
          return await createImageBitmap(blob);
        } catch (_) {
          // Fallback below.
        }
      }
    }

    const url = URL.createObjectURL(blob);
    try {
      return await new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = () => reject(new Error('image-decode-failed'));
        image.src = url;
      });
    } finally {
      URL.revokeObjectURL(url);
    }
  }

  canvasToBlob(canvas, type, quality) {
    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('image-encode-failed')), type, quality);
    });
  }
}

async function sniffImageType(file) {
  const bytes = new Uint8Array(await file.slice(0, 16).arrayBuffer());
  if (bytes.length < 12) return '';

  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'jpeg';
  if ([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a].every((value, index) => bytes[index] === value)) return 'png';

  const text = String.fromCharCode(...bytes);
  if (text.slice(0, 4) === 'RIFF' && text.slice(8, 12) === 'WEBP') return 'webp';
  if (text.slice(4, 8) === 'ftyp') {
    const brand = text.slice(8, 12).toLowerCase();
    if (['heic','heix','hevc','hevx','heim','heis','mif1','msf1'].includes(brand)) return 'heif';
  }
  return '';
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}
