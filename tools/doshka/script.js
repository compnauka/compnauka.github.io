const $ = (s) => document.querySelector(s);
const $$ = (s) => document.querySelectorAll(s);

class Whiteboard {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d', { desynchronized: true, alpha: true });
        this.dpr = Math.max(1, window.devicePixelRatio || 1);

        this.tool = 'pen';
        this.color = '#000000';
        this.size = 4;

        this.strokes = [];
        this.redoStack = [];
        this.isDrawing = false;
        this.currentPoints = [];

        this.STORAGE_KEY = 'whiteboard_data';
        this.resizeDebounce = null;

        this.init();
    }

    init() {
        this.loadFromStorage();
        this.setupDimensions();

        window.addEventListener('resize', () => {
            clearTimeout(this.resizeDebounce);
            this.resizeDebounce = setTimeout(() => this.resize(), 100);
        });

        this.canvas.addEventListener('pointerdown', this.onDown.bind(this));
        this.canvas.addEventListener('pointermove', this.onMove.bind(this));
        this.canvas.addEventListener('pointerup', this.onUp.bind(this));
        this.canvas.addEventListener('pointercancel', this.onUp.bind(this));
        this.canvas.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });

        window.addEventListener('beforeunload', (e) => {
            if (this.strokes.length > 0) {
                e.preventDefault();
                e.returnValue = '';
            }
        });
    }

    setupDimensions() {
        const rect = this.canvas.parentElement.getBoundingClientRect();
        this.canvas.width = rect.width * this.dpr;
        this.canvas.height = rect.height * this.dpr;
        this.ctx.scale(this.dpr, this.dpr);
        this.redraw();
    }

    resize() {
        this.setupDimensions();
    }

    onDown(e) {
        if (e.pointerType === 'mouse' && e.button !== 0) return;
        e.preventDefault();
        this.canvas.setPointerCapture(e.pointerId);
        this.isDrawing = true;

        const pos = this.getPos(e);
        this.currentPoints = [pos];
        this.drawPath([pos, pos], { tool: this.tool, color: this.color, size: this.size });
    }

    onMove(e) {
        if (!this.isDrawing) return;

        let events = [e];
        if (e.getCoalescedEvents && e.getCoalescedEvents().length > 0) {
            events = e.getCoalescedEvents();
        }

        const newPoints = [];
        events.forEach(evt => {
            const p = this.getPos(evt);
            const last = this.currentPoints[this.currentPoints.length - 1];

            const dx = p.x - last.x;
            const dy = p.y - last.y;
            if (dx * dx + dy * dy > 4) {
                newPoints.push(p);
            }
        });

        if (newPoints.length === 0) return;

        const lastPoint = this.currentPoints[this.currentPoints.length - 1];
        const path = [lastPoint, ...newPoints];

        this.drawPath(path, { tool: this.tool, color: this.color, size: this.size });
        this.currentPoints.push(...newPoints);
    }

    onUp(e) {
        if (!this.isDrawing) return;
        this.isDrawing = false;
        try { this.canvas.releasePointerCapture(e.pointerId); } catch (err) { }

        if (this.currentPoints.length > 0) {
            this.strokes.push({
                tool: this.tool,
                color: this.color,
                size: this.size,
                points: [...this.currentPoints]
            });
            this.redoStack = [];
            this.saveToStorage();
            this.triggerUpdate();
        }
        this.currentPoints = [];
    }

    getPos(e) {
        const rect = this.canvas.getBoundingClientRect();
        return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
    }

    setContextState(config) {
        this.ctx.lineWidth = config.size;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';

        if (config.tool === 'eraser') {
            this.ctx.globalCompositeOperation = 'destination-out';
            this.ctx.strokeStyle = '#000000';
        } else {
            this.ctx.globalCompositeOperation = 'source-over';
            this.ctx.strokeStyle = config.color;
        }
    }

    drawPath(points, config) {
        if (points.length < 1) return;

        this.ctx.beginPath();
        this.setContextState(config);

        this.ctx.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) {
            this.ctx.lineTo(points[i].x, points[i].y);
        }
        this.ctx.stroke();
    }

    redraw() {
        this.ctx.setTransform(1, 0, 0, 1, 0, 0);
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);

        this.strokes.forEach(stroke => {
            const pts = stroke.points.length === 1 ? [stroke.points[0], stroke.points[0]] : stroke.points;
            this.drawPath(pts, stroke);
        });
    }

    saveToStorage() {
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.strokes));
        } catch (e) { console.warn('Storage quota exceeded'); }
    }

    loadFromStorage() {
        try {
            const data = localStorage.getItem(this.STORAGE_KEY);
            if (data) {
                this.strokes = JSON.parse(data);
                this.redraw();
                this.triggerUpdate();
            }
        } catch (e) { }
    }
    undo() {
        if (this.strokes.length) {
            this.redoStack.push(this.strokes.pop());
            this.redraw();
            this.saveToStorage();
            this.triggerUpdate();
        }
    }

    redo() {
        if (this.redoStack.length) {
            this.strokes.push(this.redoStack.pop());
            this.redraw();
            this.saveToStorage();
            this.triggerUpdate();
        }
    }

    clear() {
        this.strokes = [];
        this.redoStack = [];
        this.redraw();
        this.saveToStorage();
        this.triggerUpdate();
    }

    triggerUpdate() {
        window.dispatchEvent(new CustomEvent('board:state', {
            detail: {
                canUndo: this.strokes.length > 0,
                canRedo: this.redoStack.length > 0
            }
        }));
    }

    downloadPNG() {
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = this.canvas.width;
        tempCanvas.height = this.canvas.height;
        const tCtx = tempCanvas.getContext('2d');

        tCtx.fillStyle = '#ffffff';
        tCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
        tCtx.drawImage(this.canvas, 0, 0);

        const link = document.createElement('a');
        link.download = `whiteboard-${Date.now()}.png`;
        link.href = tempCanvas.toDataURL();
        link.click();
    }

    downloadSVG() {
        const w = this.canvas.width / this.dpr;
        const h = this.canvas.height / this.dpr;
        let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">`;
        svg += `<rect width="100%" height="100%" fill="white"/>`;

        this.strokes.forEach(s => {
            const color = s.tool === 'eraser' ? '#ffffff' : s.color;
            const width = s.size;

            if (s.points.length > 0) {
                let d = `M ${s.points[0].x} ${s.points[0].y}`;
                for (let i = 1; i < s.points.length; i++) {
                    d += ` L ${s.points[i].x} ${s.points[i].y}`;
                }
                if (s.points.length === 1) d += ` L ${s.points[0].x} ${s.points[0].y}`;

                svg += `<path d="${d}" stroke="${color}" stroke-width="${width}" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;
            }
        });
        svg += `</svg>`;

        const blob = new Blob([svg], { type: 'image/svg+xml' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `whiteboard-${Date.now()}.svg`;
        link.click();
    }
}

class Timer {
    constructor() {
        this.remaining = 0;
        this.interval = null;
        this.isRunning = false;
        this.audioCtx = null;

        this.els = {
            overlay: $('#timer-overlay'),
            display: $('#timer-display'),
            modal: $('#dlg-timer'),
            min: $('#tm-min'),
            sec: $('#tm-sec'),
            actionBtn: $('#tm-action-btn')
        };
    }

    initAudio() {
        if (!this.audioCtx) {
            const AC = window.AudioContext || window.webkitAudioContext;
            this.audioCtx = new AC();
        }
        if (this.audioCtx.state === 'suspended') {
            this.audioCtx.resume().catch(() => { });
        }
    }

    toggle() {
        this.initAudio();
        this.isRunning ? this.pause() : this.start();
    }

    start() {
        if (this.remaining === 0) {
            const m = Math.abs(parseInt(this.els.min.value, 10)) || 0;
            const s = Math.abs(parseInt(this.els.sec.value, 10)) || 0;
            this.remaining = m * 60 + s;
        }

        if (this.remaining <= 0) return;

        this.els.modal.classList.add('hidden');
        this.els.overlay.classList.remove('hidden');

        this.isRunning = true;
        this.updateBtnState(true);
        this.render();

        this.interval = setInterval(() => {
            this.remaining--;
            this.render();
            if (this.remaining <= 0) {
                this.finish();
            }
        }, 1000);
    }

    pause() {
        clearInterval(this.interval);
        this.isRunning = false;
        this.updateBtnState(false);
    }

    reset() {
        this.pause();
        this.remaining = 0;
        this.els.overlay.classList.add('hidden');
        this.els.actionBtn.textContent = "Старт";
        this.els.actionBtn.className = "modal-btn modal-btn-primary col-span-2 text-lg md:text-xl py-3 md:py-4";
    }

    finish() {
        this.reset();
        this.beep();
        if ('vibrate' in navigator) {
            try { navigator.vibrate([200, 100, 200]); } catch (e) { }
        }
    }

    updateBtnState(isRunning) {
        if (isRunning) {
            this.els.actionBtn.textContent = "Пауза";
            this.els.actionBtn.className = "modal-btn bg-yellow-500 text-white border-gray-700 col-span-2 text-lg md:text-xl py-3 md:py-4";
        } else {
            this.els.actionBtn.textContent = "Продовжити";
            this.els.actionBtn.className = "modal-btn modal-btn-primary col-span-2 text-lg md:text-xl py-3 md:py-4";
        }
    }

    render() {
        const m = Math.floor(this.remaining / 60).toString().padStart(2, '0');
        const s = (this.remaining % 60).toString().padStart(2, '0');
        this.els.display.textContent = `${m}:${s}`;
    }

    beep() {
        if (!this.audioCtx) return;
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.connect(gain);
        gain.connect(this.audioCtx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, this.audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(880, this.audioCtx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.3, this.audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + 0.5);
        osc.start();
        osc.stop(this.audioCtx.currentTime + 0.5);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const board = new Whiteboard($('#whiteboard'));
    const timer = new Timer();

    $$('.tool-btn[data-tool]').forEach(btn => {
        btn.addEventListener('click', () => {
            board.tool = btn.dataset.tool;
            $$('.tool-btn[data-tool]').forEach(b => b.setAttribute('aria-pressed', b === btn));
        });
    });

    const updateColor = (color) => {
        board.color = color;
        $('#color-picker').value = color;
        if (board.tool === 'eraser') {
            board.tool = 'pen';
            $('[data-tool="pen"]').click();
        }
        $$('.color-btn').forEach(b => {
            b.setAttribute('aria-current', b.dataset.color === color ? 'true' : 'false');
        });
    };

    $$('.color-btn').forEach(btn => {
        btn.addEventListener('click', () => updateColor(btn.dataset.color));
    });

    $('#color-picker').addEventListener('input', (e) => {
        updateColor(e.target.value);
        $$('.color-btn').forEach(b => b.setAttribute('aria-current', 'false'));
    });

    $('#size-range').addEventListener('input', (e) => {
        board.size = parseInt(e.target.value);
    });

    $('#btn-undo').addEventListener('click', () => board.undo());
    $('#btn-redo').addEventListener('click', () => board.redo());
    $('#btn-save').addEventListener('click', () => board.downloadPNG());
    $('#btn-svg').addEventListener('click', () => board.downloadSVG());

    window.addEventListener('board:state', (e) => {
        $('#btn-undo').disabled = !e.detail.canUndo;
        $('#btn-redo').disabled = !e.detail.canRedo;
    });

    const toggleModal = (id, show) => {
        const el = $(id);
        if (show) {
            el.classList.remove('hidden');
            const input = el.querySelector('input');
            if (input) setTimeout(() => input.focus(), 50);
        } else {
            el.classList.add('hidden');
        }
    };

    $$('[data-close]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            toggleModal('#' + e.target.closest('.modal-backdrop').id, false);
        });
    });

    $('#btn-clear').addEventListener('click', () => toggleModal('#dlg-clear', true));
    $('#confirm-clear').addEventListener('click', () => {
        board.clear();
        toggleModal('#dlg-clear', false);
    });

    $('#btn-qr').addEventListener('click', () => {
        $('#qr-input').value = window.location.href;
        $('#qr-output').innerHTML = '<span class="text-gray-500 text-sm md:text-base text-center">Натисніть "Згенерувати"</span>';
        $('#qr-output').dataset.val = "";
        $('#qr-output').classList.remove('cursor-pointer', 'hover:bg-gray-200');
        $('#qr-output').title = "";
        toggleModal('#dlg-qr', true);
    });

    $('#qr-gen-btn').addEventListener('click', () => {
        const val = $('#qr-input').value || window.location.href;
        const out = $('#qr-output');
        out.innerHTML = '';
        if (window.QRCode) {
            new QRCode(out, { text: val, width: 220, height: 220, correctLevel: QRCode.CorrectLevel.M });
            out.dataset.val = val;
            out.classList.add('cursor-pointer', 'hover:bg-gray-200');
            out.title = "Натисніть для збільшення";
        } else {
            out.textContent = "Помилка завантаження бібліотеки";
        }
    });

    $('#qr-output').addEventListener('click', () => {
        const val = $('#qr-output').dataset.val;
        if (!val) return;

        const zoomDlg = $('#dlg-qr-zoom');
        const zoomContent = $('#qr-zoom-content');

        zoomContent.innerHTML = '';
        const size = Math.min(window.innerWidth, window.innerHeight) * 0.7;

        if (window.QRCode) {
            new QRCode(zoomContent, { text: val, width: size, height: size, correctLevel: QRCode.CorrectLevel.H });
            zoomDlg.classList.remove('hidden');
        }
    });

    $('#dlg-qr-zoom').addEventListener('click', (e) => {
        if (e.target === $('#dlg-qr-zoom')) {
            $('#dlg-qr-zoom').classList.add('hidden');
        }
    });

    $('#btn-timer').addEventListener('click', () => toggleModal('#dlg-timer', true));
    $('#tm-action-btn').addEventListener('click', () => timer.toggle());
    $('#tm-reset-btn').addEventListener('click', () => timer.reset());

    window.addEventListener('keydown', (e) => {
        if (e.target.tagName === 'INPUT') return;
        if (e.ctrlKey || e.metaKey) {
            if (e.key.toLowerCase() === 'z') {
                e.preventDefault();
                e.shiftKey ? board.redo() : board.undo();
            }
            if (e.key.toLowerCase() === 'y') {
                e.preventDefault();
                board.redo();
            }
            if (e.key.toLowerCase() === 's') {
                e.preventDefault();
                board.downloadPNG();
            }
        }
        if (e.key === 'Escape') {
            $$('.modal-backdrop:not(.hidden)').forEach(el => el.classList.add('hidden'));
            $('#dlg-qr-zoom').classList.add('hidden');
        }
    });
});