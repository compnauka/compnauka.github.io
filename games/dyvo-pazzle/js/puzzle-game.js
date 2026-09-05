const LIFT_MIN = 30;
const LIFT_MAX = 50;

export class PuzzleGame {
  constructor({ els, feedback, onWin }) {
    this.els = els;
    this.feedback = feedback;
    this.onWin = onWin;
    this.level = 3;
    this.imageUrl = '';
    this.selectedPiece = null;
    this.drag = null;
    this.winTimer = 0;
    this.resizeRaf = 0;
    this.isHinting = false;
    this.hasInteracted = false;

    this._pointerMove = (event) => this.onPointerMove(event);
    this._pointerUp = (event) => this.onPointerUp(event);
    this._pointerCancel = (event) => this.onPointerCancel(event);
  }

  init({ level, imageUrl }) {
    this.destroy({ clearBoard: false });
    this.level = level;
    this.imageUrl = imageUrl;
    this.isHinting = false;
    this.hasInteracted = false;

    this.els.hintButton.classList.remove('is-hinting');
    this.els.hintButton.setAttribute('aria-pressed', 'false');
    this.els.referenceImg.src = imageUrl;
    this.els.boardHint.style.backgroundImage = `url("${imageUrl}")`;
    this.els.boardHint.style.setProperty('--hint-opacity', this.defaultHintOpacity());
    this.els.boardHint.classList.remove('is-strong');
    this.els.coach.classList.remove('is-hidden');

    this.els.leftTray.replaceChildren();
    this.els.rightTray.replaceChildren();
    this.els.slots.replaceChildren();
    this.els.slots.style.gridTemplateColumns = `repeat(${level}, 1fr)`;
    this.els.slots.style.gridTemplateRows = `repeat(${level}, 1fr)`;

    const total = level * level;
    const pieces = [];

    for (let id = 0; id < total; id += 1) {
      const slot = document.createElement('div');
      slot.className = 'puzzle-slot';
      slot.dataset.id = String(id);
      slot.tabIndex = 0;
      slot.setAttribute('role', 'button');
      slot.setAttribute('aria-label', `Місце ${id + 1}`);
      slot.addEventListener('click', () => this.handleSlotTap(slot));
      slot.addEventListener('keydown', (event) => {
        if ((event.key === 'Enter' || event.key === ' ') && this.selectedPiece) {
          event.preventDefault();
          this.handleSlotTap(slot);
        }
      });
      this.els.slots.appendChild(slot);

      const row = Math.floor(id / level);
      const col = id % level;
      const posX = level === 1 ? 0 : (col * 100) / (level - 1);
      const posY = level === 1 ? 0 : (row * 100) / (level - 1);
      pieces.push({ id, bgPosition: `${posX}% ${posY}%` });
    }

    this.shuffle(pieces).forEach((data, index) => {
      const piece = document.createElement('div');
      piece.className = 'puzzle-piece';
      piece.dataset.id = String(data.id);
      piece.tabIndex = 0;
      piece.setAttribute('role', 'button');
      piece.setAttribute('aria-label', `Деталь пазла ${data.id + 1}`);
      piece.style.backgroundImage = `url("${imageUrl}")`;
      piece.style.backgroundSize = `${level * 100}% ${level * 100}%`;
      piece.style.backgroundPosition = data.bgPosition;
      piece.addEventListener('pointerdown', (event) => this.onPointerDown(event, piece));
      piece.addEventListener('click', (event) => event.stopPropagation());
      piece.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          // Не даємо події спливти до батьківського слота: інакше слот одразу
          // "переставляє" деталь саму в себе й скидає щойно зроблений вибір.
          event.stopPropagation();
          this.selectPiece(piece);
        }
      });
      (index % 2 === 0 ? this.els.leftTray : this.els.rightTray).appendChild(piece);
    });

    this.updateProgress();
  }

  destroy({ clearBoard = true } = {}) {
    clearTimeout(this.winTimer);
    this.winTimer = 0;
    cancelAnimationFrame(this.resizeRaf);
    this.clearSelection();

    if (this.drag?.lifted) {
      const { piece, origin } = this.drag;
      this.cleanupDraggedPiece(piece);
      origin?.appendChild(piece);
    }
    this.removeDragListeners();
    this.drag = null;

    if (clearBoard) {
      this.els.leftTray.replaceChildren();
      this.els.rightTray.replaceChildren();
      this.els.slots.replaceChildren();
      this.els.referenceImg.removeAttribute('src');
      this.els.boardHint.style.backgroundImage = '';
    }
  }

  defaultHintOpacity() {
    if (this.level === 2) return '.34';
    if (this.level === 3) return '.13';
    return '.03';
  }

  shuffle(items) {
    const array = [...items];
    for (let i = array.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  markInteraction() {
    if (this.hasInteracted) return;
    this.hasInteracted = true;
    this.els.coach.classList.add('is-hidden');
  }

  selectPiece(piece) {
    if (!piece || piece.classList.contains('is-correct')) return;
    this.markInteraction();
    if (this.selectedPiece === piece) {
      this.clearSelection();
      return;
    }
    this.clearSelection();
    this.selectedPiece = piece;
    piece.classList.add('is-selected');
  }

  clearSelection() {
    this.selectedPiece?.classList.remove('is-selected');
    this.selectedPiece = null;
    this.clearTargets();
  }

  handleSlotTap(slot) {
    if (!this.selectedPiece || slot.classList.contains('is-correct')) return;
    const piece = this.selectedPiece;
    const origin = piece.parentElement;
    this.placePiece(piece, slot, origin);
    this.clearSelection();
  }

  onPointerDown(event, piece) {
    if (piece.classList.contains('is-correct') || event.button > 0 || this.drag) return;
    event.preventDefault();
    this.markInteraction();

    const rect = piece.getBoundingClientRect();
    const origin = piece.parentElement;
    const boardPiece = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--piece-size')) || rect.width;
    const scale = origin.classList.contains('pieces-tray') ? boardPiece / rect.width : 1;
    const liftY = clamp(boardPiece * .22, LIFT_MIN, LIFT_MAX);

    this.drag = {
      piece,
      origin,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      moved: false,
      lifted: false,
      boardPiece,
      liftY,
      offsetX: (event.clientX - rect.left) * scale,
      offsetY: (event.clientY - rect.top) * scale + liftY
    };

    document.addEventListener('pointermove', this._pointerMove, { passive: false });
    document.addEventListener('pointerup', this._pointerUp, { passive: false });
    document.addEventListener('pointercancel', this._pointerCancel, { passive: false });
  }

  liftDraggedPiece(event) {
    if (!this.drag || this.drag.lifted) return;
    const { piece } = this.drag;
    this.clearSelection();
    this.drag.lifted = true;
    piece.classList.add('is-dragging');
    document.body.appendChild(piece);
    this.positionDraggedPiece(event.clientX, event.clientY);
  }

  positionDraggedPiece(x, y) {
    if (!this.drag?.lifted) return;
    this.drag.piece.style.left = `${x - this.drag.offsetX}px`;
    this.drag.piece.style.top = `${y - this.drag.offsetY}px`;
  }

  onPointerMove(event) {
    if (!this.drag || event.pointerId !== this.drag.pointerId) return;
    event.preventDefault();
    const dx = event.clientX - this.drag.startX;
    const dy = event.clientY - this.drag.startY;

    if (!this.drag.moved && Math.hypot(dx, dy) > 7) {
      this.drag.moved = true;
      this.liftDraggedPiece(event);
    }
    if (!this.drag.lifted) return;

    this.positionDraggedPiece(event.clientX, event.clientY);
    this.clearTargets();
    const target = this.findSnapTarget();
    if (target) target.classList.add('is-target');
  }

  onPointerUp(event) {
    if (!this.drag || event.pointerId !== this.drag.pointerId) return;
    event.preventDefault();
    const { piece, origin, moved, lifted } = this.drag;

    if (!moved || !lifted) {
      this.removeDragListeners();
      this.drag = null;
      this.selectPiece(piece);
      return;
    }

    const target = this.findSnapTarget();
    this.cleanupDraggedPiece(piece);

    if (target) {
      this.placePiece(piece, target, origin);
    } else {
      const tray = document.elementFromPoint(event.clientX, event.clientY)?.closest('.pieces-tray');
      if (tray) {
        tray.appendChild(piece);
        this.refreshSlotState(origin);
        this.updateProgress();
      } else {
        origin.appendChild(piece);
      }
    }

    this.removeDragListeners();
    this.drag = null;
    this.clearTargets();
  }

  onPointerCancel(event) {
    if (!this.drag || event.pointerId !== this.drag.pointerId) return;
    const { piece, origin, lifted } = this.drag;
    if (lifted) {
      this.cleanupDraggedPiece(piece);
      origin.appendChild(piece);
    }
    this.removeDragListeners();
    this.drag = null;
    this.clearTargets();
  }

  findSnapTarget() {
    if (!this.drag?.lifted) return null;
    const rect = this.drag.piece.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    const direct = document.elementFromPoint(x, y)?.closest('.puzzle-slot');
    if (direct && !direct.classList.contains('is-correct')) return direct;

    const factor = this.level === 2 ? .78 : this.level === 3 ? .62 : .50;
    const radius = this.drag.boardPiece * factor;
    let best = null;
    let bestDistance = Infinity;

    for (const slot of this.els.slots.querySelectorAll('.puzzle-slot:not(.is-correct)')) {
      const slotRect = slot.getBoundingClientRect();
      const distance = Math.hypot(x - (slotRect.left + slotRect.width / 2), y - (slotRect.top + slotRect.height / 2));
      if (distance < bestDistance && distance <= radius) {
        best = slot;
        bestDistance = distance;
      }
    }
    return best;
  }

  cleanupDraggedPiece(piece) {
    piece.classList.remove('is-dragging');
    piece.style.left = '';
    piece.style.top = '';
  }

  removeDragListeners() {
    document.removeEventListener('pointermove', this._pointerMove);
    document.removeEventListener('pointerup', this._pointerUp);
    document.removeEventListener('pointercancel', this._pointerCancel);
  }

  clearTargets() {
    this.els.slots.querySelectorAll('.puzzle-slot.is-target').forEach((slot) => slot.classList.remove('is-target'));
  }

  placePiece(piece, slot, origin) {
    if (!piece || !slot || slot.classList.contains('is-correct')) {
      origin?.appendChild(piece);
      return;
    }

    const isCorrect = piece.dataset.id === slot.dataset.id;

    if (this.level === 2 && !isCorrect) {
      slot.classList.add('is-wrong');
      this.feedback.wrong();
      window.setTimeout(() => slot.classList.remove('is-wrong'), 210);
      origin?.appendChild(piece);
      return;
    }

    const occupant = slot.querySelector('.puzzle-piece');
    if (occupant && occupant !== piece) {
      if (occupant.classList.contains('is-correct')) {
        origin?.appendChild(piece);
        return;
      }
      if (origin?.classList.contains('puzzle-slot')) {
        origin.appendChild(occupant);
        this.refreshSlotState(origin);
      } else {
        (origin?.classList.contains('pieces-tray') ? origin : this.shorterTray()).appendChild(occupant);
      }
    }

    slot.appendChild(piece);
    this.refreshSlotState(slot);
    if (origin && origin !== slot) this.refreshSlotState(origin);
    this.updateProgress();
  }

  refreshSlotState(slot) {
    if (!slot?.classList?.contains('puzzle-slot')) return;
    const wasCorrect = slot.classList.contains('is-correct');
    slot.classList.remove('is-correct', 'is-wrong');
    const piece = slot.querySelector('.puzzle-piece');
    if (!piece) return;

    const correct = piece.dataset.id === slot.dataset.id;
    piece.classList.toggle('is-correct', correct);
    if (correct) {
      slot.classList.add('is-correct');
      piece.tabIndex = -1;
      if (!wasCorrect) this.feedback.correct();
    } else {
      piece.tabIndex = 0;
      if (this.level !== 2) {
        slot.classList.add('is-wrong');
        window.setTimeout(() => slot.classList.remove('is-wrong'), 190);
      }
    }
  }

  shorterTray() {
    return this.els.leftTray.childElementCount <= this.els.rightTray.childElementCount ? this.els.leftTray : this.els.rightTray;
  }

  updateProgress() {
    clearTimeout(this.winTimer);
    this.winTimer = 0;
    const total = this.level * this.level;
    const correct = this.els.slots.querySelectorAll('.puzzle-slot.is-correct').length;
    this.els.progressText.textContent = `${correct} / ${total}`;
    this.els.progressFill.style.width = `${(correct / total) * 100}%`;

    if (correct === total && total > 0) {
      this.winTimer = window.setTimeout(() => {
        this.winTimer = 0;
        this.onWin?.();
      }, 380);
    }
  }

  toggleHint() {
    this.isHinting = !this.isHinting;
    this.els.boardHint.classList.toggle('is-strong', this.isHinting);
    this.els.hintButton.classList.toggle('is-hinting', this.isHinting);
    this.els.hintButton.setAttribute('aria-pressed', String(this.isHinting));
  }

  queueResize() {
    cancelAnimationFrame(this.resizeRaf);
    this.resizeRaf = requestAnimationFrame(() => this.calculateSizes());
  }

  calculateSizes() {
    const viewportW = window.innerWidth;
    const viewportH = window.innerHeight;
    const portrait = viewportH > viewportW * .87;
    const toolbarH = viewportH < 650 && !portrait ? 66 : 82;
    const usableH = Math.max(260, viewportH - toolbarH - 24);
    const gap = viewportW < 900 ? 10 : 14;

    let boardSize;
    let trayPiece;
    if (portrait) {
      boardSize = Math.min(viewportW - 28, usableH * .67, 620);
      const trayHeight = Math.max(105, usableH - boardSize - 35);
      const trayWidth = (viewportW - gap * 3) / 2;
      trayPiece = this.fitTrayPiece(trayWidth, trayHeight, Math.ceil((this.level * this.level) / 2));
    } else {
      boardSize = Math.min(usableH - 34, viewportW * .54, 650);
      const trayWidth = Math.max(110, (viewportW - boardSize - gap * 4) / 2);
      trayPiece = this.fitTrayPiece(trayWidth, usableH, Math.ceil((this.level * this.level) / 2));
    }

    boardSize = Math.max(220, Math.floor(boardSize));
    trayPiece = Math.min(Math.floor(boardSize / this.level), Math.max(50, Math.floor(trayPiece)));
    const root = document.documentElement;
    root.style.setProperty('--board-size', `${boardSize}px`);
    root.style.setProperty('--piece-size', `${boardSize / this.level}px`);
    root.style.setProperty('--tray-piece-size', `${trayPiece}px`);
    root.style.setProperty('--game-gap', `${gap}px`);
  }

  fitTrayPiece(width, height, count) {
    const innerW = Math.max(70, width - 20);
    const innerH = Math.max(70, height - 20);
    for (let size = Math.min(132, innerW, innerH); size >= 46; size -= 2) {
      const step = size + 9;
      const cols = Math.max(1, Math.floor((innerW + 9) / step));
      const rows = Math.max(1, Math.floor((innerH + 9) / step));
      if (cols * rows >= count) return size;
    }
    return 46;
  }
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}
