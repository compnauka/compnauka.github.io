(() => {
    'use strict';

    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');
    const wrap = document.getElementById('canvas-wrap');
    const selLabel = document.getElementById('sel-label');
    const selName = document.getElementById('sel-name');
    const selColorDot = document.getElementById('sel-color-dot');
    const snapToast = document.getElementById('snap-toast');
    const btnCCW = document.getElementById('btn-ccw');
    const btnCW = document.getElementById('btn-cw');
    const btnFlip = document.getElementById('btn-flip');
    const btnSave = document.getElementById('btn-save');
    const btnReset = document.getElementById('btn-reset');
    const btnTheme = document.getElementById('btn-theme');
    const htmlEl = document.documentElement;

    let width;
    let height;
    let pieces = [];
    let selectedId = -1;
    let dragData = null;
    const SNAP_DIST = 20;

    const PIECES_META = [
        { id: 0, color: '#FF6B6B', name: 'Великий трикутник 1', baseCoords: [{ x: -100, y: -50 }, { x: 100, y: -50 }, { x: 0, y: 50 }] },
        { id: 1, color: '#4ECDC4', name: 'Великий трикутник 2', baseCoords: [{ x: -50, y: -100 }, { x: -50, y: 100 }, { x: 50, y: 0 }] },
        { id: 2, color: '#45B7D1', name: 'Середній трикутник', baseCoords: [{ x: -50, y: -50 }, { x: 50, y: 50 }, { x: -50, y: 50 }] },
        { id: 3, color: '#F9CA24', name: 'Малий трикутник 1', baseCoords: [{ x: -50, y: 0 }, { x: 50, y: 0 }, { x: 0, y: 50 }] },
        { id: 4, color: '#F0932B', name: 'Малий трикутник 2', baseCoords: [{ x: -50, y: 0 }, { x: 50, y: 0 }, { x: 0, y: -50 }] },
        { id: 5, color: '#6AB04C', name: 'Квадрат', baseCoords: [{ x: -50, y: 0 }, { x: 0, y: -50 }, { x: 50, y: 0 }, { x: 0, y: 50 }] },
        { id: 6, color: '#9B59B6', name: 'Паралелограм', baseCoords: [{ x: -75, y: -25 }, { x: 25, y: -25 }, { x: 75, y: 25 }, { x: -25, y: 25 }] }
    ];

    function init() {
        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);
        resetPieces();

        canvas.addEventListener('pointerdown', onPointerDown);
        window.addEventListener('pointermove', onPointerMove);
        window.addEventListener('pointerup', onPointerUp);
        window.addEventListener('pointercancel', onPointerUp);
        document.addEventListener('keydown', onKeyDown);

        btnCCW.addEventListener('click', () => rotateSelected(-Math.PI / 4));
        btnCW.addEventListener('click', () => rotateSelected(Math.PI / 4));
        btnFlip.addEventListener('click', flipSelected);
        btnReset.addEventListener('click', resetPieces);
        btnSave.addEventListener('click', saveAsSquare);

        btnTheme.addEventListener('click', () => {
            const current = htmlEl.getAttribute('data-theme');
            const next = current === 'dark' ? 'light' : 'dark';
            htmlEl.setAttribute('data-theme', next);
            btnTheme.innerHTML = next === 'dark' ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
            draw();
        });

        draw();
    }

    function resizeCanvas() {
        const rect = wrap.getBoundingClientRect();
        width = Math.max(1, rect.width);
        height = Math.max(1, rect.height);

        const dpr = window.devicePixelRatio || 1;
        canvas.width = Math.round(width * dpr);
        canvas.height = Math.round(height * dpr);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        draw();
    }

    function resetPieces() {
        pieces = PIECES_META.map((meta, i) => {
            const scale = width < 700 ? 0.62 : 1;
            return {
                ...meta,
                x: (width / 2) + (i % 3 - 1) * 120 * scale,
                y: (height / 2) + (Math.floor(i / 3) - 1) * 120 * scale,
                angle: 0,
                scaleX: 1,
                scaleY: 1,
                baseCoords: meta.baseCoords.map((v) => ({ x: v.x * scale, y: v.y * scale }))
            };
        });
        selectPiece(-1);
        draw();
    }

    function getTransformed(piece) {
        return piece.baseCoords.map((vertex) => {
            const sx = vertex.x * piece.scaleX;
            const sy = vertex.y * piece.scaleY;
            const rx = sx * Math.cos(piece.angle) - sy * Math.sin(piece.angle);
            const ry = sx * Math.sin(piece.angle) + sy * Math.cos(piece.angle);
            return { x: piece.x + rx, y: piece.y + ry };
        });
    }

    function getAxes(poly) {
        const axes = [];
        for (let i = 0; i < poly.length; i += 1) {
            const p1 = poly[i];
            const p2 = poly[(i + 1) % poly.length];
            const edge = { x: p2.x - p1.x, y: p2.y - p1.y };
            const len = Math.hypot(edge.x, edge.y);
            axes.push({ x: -edge.y / len, y: edge.x / len });
        }
        return axes;
    }

    function project(poly, axis) {
        let min = Infinity;
        let max = -Infinity;
        for (const p of poly) {
            const dot = p.x * axis.x + p.y * axis.y;
            min = Math.min(min, dot);
            max = Math.max(max, dot);
        }
        return { min, max };
    }

    function isIntersecting(poly1, poly2) {
        const axes = [...getAxes(poly1), ...getAxes(poly2)];
        for (const axis of axes) {
            const p1 = project(poly1, axis);
            const p2 = project(poly2, axis);
            if (p1.max <= p2.min + 1 || p2.max <= p1.min + 1) {
                return false;
            }
        }
        return true;
    }

    function hasOverlap(pieceIndex) {
        const p1 = getTransformed(pieces[pieceIndex]);
        for (let i = 0; i < pieces.length; i += 1) {
            if (i === pieceIndex) {
                continue;
            }
            const p2 = getTransformed(pieces[i]);
            if (isIntersecting(p1, p2)) {
                return true;
            }
        }
        return false;
    }

    function draw() {
        ctx.clearRect(0, 0, width, height);
        const highlightColor = htmlEl.getAttribute('data-theme') === 'dark' ? '#ffffff' : '#1c1917';

        pieces.forEach((piece) => {
            const pts = getTransformed(piece);
            ctx.beginPath();
            ctx.moveTo(pts[0].x, pts[0].y);
            for (let i = 1; i < pts.length; i += 1) {
                ctx.lineTo(pts[i].x, pts[i].y);
            }
            ctx.closePath();

            ctx.save();
            if (piece.id === selectedId) {
                ctx.shadowColor = piece.color;
                ctx.shadowBlur = 16;
                ctx.lineWidth = 3;
                ctx.strokeStyle = highlightColor;
            } else {
                ctx.shadowColor = 'transparent';
                ctx.shadowBlur = 0;
                ctx.lineWidth = 2;
                ctx.strokeStyle = 'rgba(0,0,0,0.1)';
            }

            ctx.fillStyle = piece.color;
            ctx.fill();
            ctx.stroke();
            ctx.restore();
        });
    }

    function isPointInPoly(pt, poly) {
        let inside = false;
        for (let i = 0, j = poly.length - 1; i < poly.length; j = i, i += 1) {
            const xi = poly[i].x;
            const yi = poly[i].y;
            const xj = poly[j].x;
            const yj = poly[j].y;
            const intersect = (yi > pt.y) !== (yj > pt.y)
                && pt.x < ((xj - xi) * (pt.y - yi)) / (yj - yi) + xi;
            if (intersect) {
                inside = !inside;
            }
        }
        return inside;
    }

    function onPointerDown(event) {
        const rect = canvas.getBoundingClientRect();
        const pos = { x: event.clientX - rect.left, y: event.clientY - rect.top };

        let clicked = -1;
        for (let i = pieces.length - 1; i >= 0; i -= 1) {
            if (isPointInPoly(pos, getTransformed(pieces[i]))) {
                clicked = i;
                break;
            }
        }

        if (clicked !== -1) {
            const piece = pieces.splice(clicked, 1)[0];
            pieces.push(piece);
            selectPiece(piece.id);

            dragData = {
                id: piece.id,
                offsetX: pos.x - piece.x,
                offsetY: pos.y - piece.y,
                originalX: piece.x,
                originalY: piece.y
            };
            canvas.setPointerCapture(event.pointerId);
        } else {
            selectPiece(-1);
        }

        draw();
    }

    function onPointerMove(event) {
        if (!dragData) {
            return;
        }

        const rect = canvas.getBoundingClientRect();
        const piece = pieces[pieces.length - 1];
        piece.x = (event.clientX - rect.left) - dragData.offsetX;
        piece.y = (event.clientY - rect.top) - dragData.offsetY;
        draw();
    }

    function onPointerUp(event) {
        if (!dragData) {
            return;
        }

        const piece = pieces[pieces.length - 1];
        let snapped = snapPiece(piece);

        if (hasOverlap(pieces.length - 1)) {
            piece.x = dragData.originalX;
            piece.y = dragData.originalY;
            snapped = false;
        }

        if (snapped) {
            snapToast.classList.add('show');
            setTimeout(() => snapToast.classList.remove('show'), 1000);
        }

        dragData = null;
        if (event.pointerId !== undefined && canvas.hasPointerCapture(event.pointerId)) {
            canvas.releasePointerCapture(event.pointerId);
        }
        draw();
    }

    function snapPiece(activePiece) {
        const activePts = getTransformed(activePiece);
        let bestDist = SNAP_DIST;
        let shiftX = 0;
        let shiftY = 0;
        let found = false;

        for (const other of pieces) {
            if (other.id === activePiece.id) {
                continue;
            }

            const otherPts = getTransformed(other);
            for (const activePoint of activePts) {
                for (const otherPoint of otherPts) {
                    const dx = otherPoint.x - activePoint.x;
                    const dy = otherPoint.y - activePoint.y;
                    const dist = Math.hypot(dx, dy);
                    if (dist < bestDist) {
                        bestDist = dist;
                        shiftX = dx;
                        shiftY = dy;
                        found = true;
                    }
                }
            }
        }

        if (found) {
            activePiece.x += shiftX;
            activePiece.y += shiftY;
            return true;
        }
        return false;
    }

    function selectPiece(id) {
        selectedId = id;
        if (id !== -1) {
            const piece = pieces.find((value) => value.id === id);
            selName.textContent = piece.name;
            selColorDot.style.backgroundColor = piece.color;
            selLabel.style.display = 'flex';
        } else {
            selLabel.style.display = 'none';
        }
    }

    function rotateSelected(angle) {
        if (selectedId === -1) {
            return;
        }

        const piece = pieces.find((value) => value.id === selectedId);
        const originalAngle = piece.angle;
        piece.angle += angle;

        if (hasOverlap(pieces.indexOf(piece))) {
            piece.angle = originalAngle;
        }
        draw();
    }

    function flipSelected() {
        if (selectedId === -1) {
            return;
        }

        const piece = pieces.find((value) => value.id === selectedId);
        const originalScaleX = piece.scaleX;
        piece.scaleX *= -1;

        if (hasOverlap(pieces.indexOf(piece))) {
            piece.scaleX = originalScaleX;
        }
        draw();
    }

    function onKeyDown(event) {
        if (event.code === 'Escape') {
            selectPiece(-1);
            draw();
            return;
        }

        if (selectedId === -1) {
            return;
        }

        if (event.code === 'KeyQ') {
            rotateSelected(-Math.PI / 4);
        }
        if (event.code === 'KeyE') {
            rotateSelected(Math.PI / 4);
        }
        if (event.code === 'KeyF') {
            flipSelected();
        }
        draw();
    }

    function saveAsSquare() {
        if (pieces.length === 0) {
            return;
        }

        let minX = Infinity;
        let minY = Infinity;
        let maxX = -Infinity;
        let maxY = -Infinity;

        pieces.forEach((piece) => {
            getTransformed(piece).forEach((vertex) => {
                minX = Math.min(minX, vertex.x);
                minY = Math.min(minY, vertex.y);
                maxX = Math.max(maxX, vertex.x);
                maxY = Math.max(maxY, vertex.y);
            });
        });

        const w = maxX - minX;
        const h = maxY - minY;
        const size = Math.max(w, h) + 80;
        const cx = minX + w / 2;
        const cy = minY + h / 2;

        const offCanvas = document.createElement('canvas');
        offCanvas.width = size;
        offCanvas.height = size;
        const offCtx = offCanvas.getContext('2d');

        offCtx.fillStyle = htmlEl.getAttribute('data-theme') === 'dark' ? '#292524' : '#fffcf7';
        offCtx.fillRect(0, 0, size, size);

        offCtx.save();
        offCtx.translate((size / 2) - cx, (size / 2) - cy);

        pieces.forEach((piece) => {
            const pts = getTransformed(piece);
            offCtx.beginPath();
            offCtx.moveTo(pts[0].x, pts[0].y);
            for (let i = 1; i < pts.length; i += 1) {
                offCtx.lineTo(pts[i].x, pts[i].y);
            }
            offCtx.closePath();

            offCtx.fillStyle = piece.color;
            offCtx.fill();
            offCtx.lineWidth = 2;
            offCtx.strokeStyle = 'rgba(0,0,0,0.1)';
            offCtx.stroke();
        });
        offCtx.restore();

        const link = document.createElement('a');
        link.download = 'my_tangram.png';
        link.href = offCanvas.toDataURL('image/png');
        link.click();
    }

    window.addEventListener('load', init);
})();
