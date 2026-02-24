/* ===== РЕДАКТОР БЛОК-СХЕМ — SCRIPT.JS ===== */

document.addEventListener('DOMContentLoaded', function () {

    // ============= DOM =============
    const canvas          = document.getElementById('flowchart-canvas');
    const canvasContainer = document.getElementById('canvas-container');
    const svgLayer        = document.getElementById('connectors-layer');
    const deleteButton    = document.getElementById('delete-button');
    const clearButton     = document.getElementById('clear-button');
    const saveButton      = document.getElementById('save-button');
    const undoButton      = document.getElementById('undo-button');
    const textModal       = document.getElementById('text-modal');
    const shapeTextArea   = document.getElementById('shape-text');
    const cancelText      = document.getElementById('cancel-text');
    const saveText        = document.getElementById('save-text');
    const helpButton      = document.getElementById('help-button');
    const helpPanel       = document.getElementById('help-panel');
    const helpClose       = document.getElementById('help-close');
    const zoomInBtn       = document.getElementById('zoom-in');
    const zoomOutBtn      = document.getElementById('zoom-out');
    const zoomResetBtn    = document.getElementById('zoom-reset');
    const zoomLevelText   = document.getElementById('zoom-level');
    const connectionModal    = document.getElementById('connection-modal');
    const connectionYesBtn   = document.getElementById('connection-yes');
    const connectionNoBtn    = document.getElementById('connection-no');
    const cancelConnBtn      = document.getElementById('cancel-connection');
    const connectionBar      = document.getElementById('connection-bar');
    const deleteConnBtn      = document.getElementById('delete-conn-btn');

    // ============= СТАН =============
    const state = {
        shapes:      [],   // { id, type, color, text }
        connections: [],   // { id, from, to, type }
        selectedShape:   null,
        selectedConnId:  null,
        currentColor: '#3f51b5',
        shapeCounter: 0,
        scale: 1,
        minScale: 0.2,
        maxScale: 3.5,
        scaleStep: 0.1,
        activeShape: null,
        dragState:   null,
        connDrag:    null,
        pendingConn: null,
        undoStack:   [],   // масив JSON-знімків
        MAX_UNDO: 30,
    };

    // ============= UNDO — знімки стану =============

    function saveSnapshot() {
        const snap = state.shapes.map(s => {
            const el = document.getElementById(s.id);
            return {
                id:    s.id,
                type:  s.type,
                color: s.color,
                text:  s.text,
                left:  el ? el.offsetLeft : 0,
                top:   el ? el.offsetTop  : 0,
            };
        });
        const connSnap = state.connections.map(c => ({ ...c }));
        state.undoStack.push({ shapes: snap, connections: connSnap });
        if (state.undoStack.length > state.MAX_UNDO) state.undoStack.shift();
        undoButton.disabled = false;
    }

    function restoreSnapshot(snap) {
        // Видаляємо все поточне
        state.shapes.forEach(s => {
            document.getElementById(s.id)?.remove();
            removeHandleGroup(s.id);
        });
        state.connections.forEach(c => {
            document.getElementById(c.id)?.remove();
            document.getElementById(`label-${c.id}`)?.remove();
            document.getElementById(`hit-${c.id}`)?.remove();
        });
        state.shapes      = [];
        state.connections = [];
        state.selectedShape  = null;
        state.selectedConnId = null;

        // Відтворюємо фігури
        snap.shapes.forEach(s => {
            const el = createShape(s.type, s.color, s.text, s.left, s.top, s.id);
            state.shapeCounter = Math.max(state.shapeCounter,
                parseInt(s.id.split('-')[1]) || 0);
        });

        // Відтворюємо з'єднання після рендеру
        setTimeout(() => {
            snap.connections.forEach(c => {
                const fromEl = document.getElementById(c.from);
                const toEl   = document.getElementById(c.to);
                if (fromEl && toEl) connectShapes(fromEl, toEl, c.type, c.id);
            });
            updateConnectionBar();
        }, 20);

        undoButton.disabled = state.undoStack.length === 0;
    }

    function undo() {
        if (state.undoStack.length === 0) return;
        const snap = state.undoStack.pop();
        restoreSnapshot(snap);
    }

    undoButton.disabled = true;
    undoButton.addEventListener('click', undo);

    // ============= ТИМЧАСОВА ЛІНІЯ =============
    const tempLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    tempLine.setAttribute('stroke', '#4361ee');
    tempLine.setAttribute('stroke-width', '2.5');
    tempLine.setAttribute('stroke-dasharray', '8 5');
    tempLine.setAttribute('marker-end', 'url(#arrowhead)');
    tempLine.style.display = 'none';
    tempLine.style.pointerEvents = 'none';
    svgLayer.appendChild(tempLine);

    // ============= HANDLES (маркери з'єднання) =============
    const shapeHandleGroups = {};

    function getHandlePositions(shapeEl) {
        const cx = shapeEl.offsetLeft + shapeEl.offsetWidth  / 2;
        const cy = shapeEl.offsetTop  + shapeEl.offsetHeight / 2;

        if (shapeEl.classList.contains('decision')) {
            const d = shapeEl.offsetWidth * Math.SQRT2 / 2;
            return {
                top:    { x: cx,     y: cy - d },
                right:  { x: cx + d, y: cy     },
                bottom: { x: cx,     y: cy + d },
                left:   { x: cx - d, y: cy     },
            };
        }

        const hw = shapeEl.offsetWidth  / 2;
        const hh = shapeEl.offsetHeight / 2;
        return {
            top:    { x: cx,      y: cy - hh },
            right:  { x: cx + hw, y: cy      },
            bottom: { x: cx,      y: cy + hh },
            left:   { x: cx - hw, y: cy      },
        };
    }

    function getConnectionPoint(shapeEl, toX, toY) {
        const cx = shapeEl.offsetLeft + shapeEl.offsetWidth  / 2;
        const cy = shapeEl.offsetTop  + shapeEl.offsetHeight / 2;
        const dx = toX - cx;
        const dy = toY - cy;

        if (shapeEl.classList.contains('decision')) {
            const d = shapeEl.offsetWidth * Math.SQRT2 / 2;
            if (Math.abs(dx) >= Math.abs(dy)) {
                return dx >= 0 ? { x: cx + d, y: cy } : { x: cx - d, y: cy };
            } else {
                return dy >= 0 ? { x: cx, y: cy + d } : { x: cx, y: cy - d };
            }
        }

        const hw = shapeEl.offsetWidth  / 2;
        const hh = shapeEl.offsetHeight / 2;
        if (dx === 0 && dy === 0) return { x: cx, y: cy };
        const sx = hw / (Math.abs(dx) || 0.001);
        const sy = hh / (Math.abs(dy) || 0.001);
        const s  = Math.min(sx, sy);
        return { x: cx + dx * s, y: cy + dy * s };
    }

    function findShapeAt(x, y, excludeId) {
        for (let i = state.shapes.length - 1; i >= 0; i--) {
            const s  = state.shapes[i];
            if (s.id === excludeId) continue;
            const el = document.getElementById(s.id);
            if (!el) continue;
            const cx = el.offsetLeft + el.offsetWidth  / 2;
            const cy = el.offsetTop  + el.offsetHeight / 2;
            const dx = Math.abs(x - cx);
            const dy = Math.abs(y - cy);
            if (s.type === 'decision') {
                const d = el.offsetWidth * Math.SQRT2 / 2;
                if (dx / d + dy / d <= 1.2) return el;
            } else {
                if (dx <= el.offsetWidth / 2 + 10 && dy <= el.offsetHeight / 2 + 10) return el;
            }
        }
        return null;
    }

    function clientToCanvas(clientX, clientY) {
        const r = canvas.getBoundingClientRect();
        return {
            x: (clientX - r.left) / state.scale,
            y: (clientY - r.top)  / state.scale,
        };
    }

    // ============= HANDLE-GROUP =============
    function createHandleGroup(shapeEl) {
        const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        g.dataset.shapeId = shapeEl.id;

        ['top', 'right', 'bottom', 'left'].forEach(pos => {
            const c = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            c.setAttribute('r', '10');
            c.setAttribute('fill', 'white');
            c.setAttribute('stroke', '#4361ee');
            c.setAttribute('stroke-width', '3');
            c.classList.add('conn-handle');
            c.dataset.shapeId = shapeEl.id;
            c.dataset.pos     = pos;
            g.appendChild(c);
        });

        svgLayer.appendChild(g);
        shapeHandleGroups[shapeEl.id] = g;
        updateHandleGroup(shapeEl.id);
        return g;
    }

    function updateHandleGroup(shapeId) {
        const el = document.getElementById(shapeId);
        const g  = shapeHandleGroups[shapeId];
        if (!el || !g) return;
        const pts = getHandlePositions(el);
        const circles = g.querySelectorAll('circle');
        ['top','right','bottom','left'].forEach((pos, i) => {
            circles[i].setAttribute('cx', pts[pos].x);
            circles[i].setAttribute('cy', pts[pos].y);
        });
    }

    function showHandlesForShape(shapeId) {
        Object.values(shapeHandleGroups).forEach(g => {
            g.querySelectorAll('circle').forEach(c => c.classList.remove('visible'));
        });
        const g = shapeHandleGroups[shapeId];
        if (g) g.querySelectorAll('circle').forEach(c => c.classList.add('visible'));
    }

    function hideAllHandles() {
        Object.values(shapeHandleGroups).forEach(g => {
            g.querySelectorAll('circle').forEach(c => c.classList.remove('visible'));
        });
    }

    function removeHandleGroup(shapeId) {
        const g = shapeHandleGroups[shapeId];
        if (g) { g.remove(); delete shapeHandleGroups[shapeId]; }
    }

    // ============= HANDLE DRAG (з'єднання) =============
    function onHandlePointerDown(e) {
        if (e.button !== 0 && e.pointerType === 'mouse') return;
        e.preventDefault();
        e.stopPropagation();

        const shapeId = this.dataset.shapeId;
        const pos     = this.dataset.pos;
        const shapeEl = document.getElementById(shapeId);
        if (!shapeEl) return;

        const pts     = getHandlePositions(shapeEl);
        const startPt = pts[pos];

        tempLine.setAttribute('x1', startPt.x);
        tempLine.setAttribute('y1', startPt.y);
        tempLine.setAttribute('x2', startPt.x);
        tempLine.setAttribute('y2', startPt.y);
        tempLine.style.display = '';
        state.connDrag = { fromShapeId: shapeId };

        this.setPointerCapture(e.pointerId);

        const onMove = (ev) => {
            const pt = clientToCanvas(ev.clientX, ev.clientY);
            tempLine.setAttribute('x2', pt.x);
            tempLine.setAttribute('y2', pt.y);
        };

        const onUp = (ev) => {
            this.removeEventListener('pointermove', onMove);
            this.removeEventListener('pointerup',   onUp);
            this.removeEventListener('pointercancel', onUp);
            tempLine.style.display = 'none';

            if (!state.connDrag) return;
            const fromId = state.connDrag.fromShapeId;
            state.connDrag = null;

            const pt       = clientToCanvas(ev.clientX, ev.clientY);
            const targetEl = findShapeAt(pt.x, pt.y, fromId);
            if (!targetEl) return;

            const fromEl   = document.getElementById(fromId);
            const fromData = state.shapes.find(s => s.id === fromId);

            if (fromData && fromData.type === 'decision') {
                state.pendingConn = { fromEl, toEl: targetEl };
                openModal(connectionModal);
            } else {
                saveSnapshot();
                connectShapes(fromEl, targetEl, null);
            }
        };

        this.addEventListener('pointermove', onMove);
        this.addEventListener('pointerup',   onUp);
        this.addEventListener('pointercancel', onUp);
    }

    function attachHandleListeners(shapeId) {
        const g = shapeHandleGroups[shapeId];
        if (!g) return;
        g.querySelectorAll('circle').forEach(c => {
            c.addEventListener('pointerdown', onHandlePointerDown);
        });
    }

    // ============= З'ЄДНАННЯ =============

    function updateConnection(connectionId) {
        const conn = state.connections.find(c => c.id === connectionId);
        const line = document.getElementById(connectionId);
        const hit  = document.getElementById(`hit-${connectionId}`);
        if (!conn || !line) return;

        const fromEl = document.getElementById(conn.from);
        const toEl   = document.getElementById(conn.to);
        if (!fromEl || !toEl) return;

        const fromCx = fromEl.offsetLeft + fromEl.offsetWidth  / 2;
        const fromCy = fromEl.offsetTop  + fromEl.offsetHeight / 2;
        const toCx   = toEl.offsetLeft   + toEl.offsetWidth    / 2;
        const toCy   = toEl.offsetTop    + toEl.offsetHeight   / 2;

        const fromPt = getConnectionPoint(fromEl, toCx, toCy);
        const toPt   = getConnectionPoint(toEl,   fromCx, fromCy);

        [line, hit].forEach(el => {
            if (!el) return;
            el.setAttribute('x1', fromPt.x);
            el.setAttribute('y1', fromPt.y);
            el.setAttribute('x2', toPt.x);
            el.setAttribute('y2', toPt.y);
        });
    }

    function updateConnectionsForShape(shapeId) {
        state.connections.forEach(conn => {
            if (conn.from === shapeId || conn.to === shapeId) {
                updateConnection(conn.id);
                if (conn.type) updateConnectionLabel(conn.id);
            }
        });
    }

    function connectShapes(fromEl, toEl, connType, forcedId) {
        connType = connType || null;
        const connId = forcedId || (connType
            ? `conn-${fromEl.id}-${toEl.id}-${connType}`
            : `conn-${fromEl.id}-${toEl.id}`);

        if (state.connections.some(c => c.id === connId)) {
            showMessageModal('⚠️ Ці фігури вже з\'єднані!');
            return null;
        }

        // Видима лінія
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.id = connId;
        line.classList.add('conn-line');

        if (connType === 'yes') {
            line.setAttribute('stroke', '#4caf50');
            line.setAttribute('stroke-width', '2.8');
            line.setAttribute('marker-end', 'url(#arrowhead-yes)');
        } else if (connType === 'no') {
            line.setAttribute('stroke', '#f44336');
            line.setAttribute('stroke-width', '2.8');
            line.setAttribute('marker-end', 'url(#arrowhead-no)');
        } else {
            line.setAttribute('stroke', '#555');
            line.setAttribute('stroke-width', '2.8');
            line.setAttribute('marker-end', 'url(#arrowhead)');
        }
        line.style.pointerEvents = 'none'; // хітзона робить всю роботу

        // Хітзона (товста прозора лінія для кліків)
        const hitLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        hitLine.id = `hit-${connId}`;
        hitLine.classList.add('conn-hit');
        hitLine.dataset.connId = connId;

        // Вставляємо обидві перед handles-групами
        const firstG = svgLayer.querySelector('g[data-shape-id]');
        svgLayer.insertBefore(line,    firstG);
        svgLayer.insertBefore(hitLine, firstG);

        // Клік на хітзону → вибрати з'єднання
        hitLine.addEventListener('pointerdown', (e) => {
            if (state.connDrag) return;
            e.stopPropagation();
            selectConnection(connId);
        });

        state.connections.push({ id: connId, from: fromEl.id, to: toEl.id, type: connType });
        updateConnection(connId);
        if (connType) addConnectionLabel(connId, connType);
        return line;
    }

    function addConnectionLabel(connectionId, labelType) {
        const labelGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        labelGroup.id = `label-${connectionId}`;
        labelGroup.style.pointerEvents = 'none';

        const bg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        bg.setAttribute('rx', '11');
        bg.setAttribute('ry', '11');
        bg.setAttribute('fill', 'white');
        bg.setAttribute('stroke', labelType === 'yes' ? '#4caf50' : '#f44336');
        bg.setAttribute('stroke-width', '2');

        const txt = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        txt.setAttribute('text-anchor', 'middle');
        txt.setAttribute('dominant-baseline', 'central');
        txt.setAttribute('fill', labelType === 'yes' ? '#2e7d32' : '#c62828');
        txt.setAttribute('font-family', "'Nunito', Arial, sans-serif");
        txt.setAttribute('font-size', '14px');
        txt.setAttribute('font-weight', '800');
        txt.textContent = labelType === 'yes' ? 'Так' : 'Ні';

        labelGroup.appendChild(bg);
        labelGroup.appendChild(txt);
        const firstHandleG = svgLayer.querySelector('g[data-shape-id]');
        svgLayer.insertBefore(labelGroup, firstHandleG);
        updateConnectionLabel(connectionId);
    }

    function updateConnectionLabel(connectionId) {
        const labelGroup = document.getElementById(`label-${connectionId}`);
        const line       = document.getElementById(connectionId);
        if (!labelGroup || !line) return;

        const x1 = parseFloat(line.getAttribute('x1'));
        const y1 = parseFloat(line.getAttribute('y1'));
        const x2 = parseFloat(line.getAttribute('x2'));
        const y2 = parseFloat(line.getAttribute('y2'));

        const lx = (x1 + x2) / 2;
        const ly = (y1 + y2) / 2;

        const txt = labelGroup.querySelector('text');
        const bg  = labelGroup.querySelector('rect');
        txt.setAttribute('x', lx);
        txt.setAttribute('y', ly);

        try {
            const bbox = txt.getBBox();
            const pad  = 7;
            bg.setAttribute('x',      bbox.x - pad);
            bg.setAttribute('y',      bbox.y - pad);
            bg.setAttribute('width',  bbox.width  + pad * 2);
            bg.setAttribute('height', bbox.height + pad * 2);
        } catch (_) {}
    }

    // ============= ВИБІР З'ЄДНАННЯ =============
    function selectConnection(connId) {
        deselectAll(false); // знімаємо вибір фігур, але не приховуємо handles відразу
        hideAllHandles();

        if (state.selectedConnId === connId) {
            // Другий клік — знімаємо вибір
            clearConnectionSelection();
            return;
        }

        clearConnectionSelection(false);
        state.selectedConnId = connId;

        // Підсвічуємо лінію
        const line = document.getElementById(connId);
        if (line) {
            line._origStroke     = line.getAttribute('stroke');
            line._origMarker     = line.getAttribute('marker-end');
            line.setAttribute('stroke', '#e91e63');
            line.setAttribute('stroke-width', '3.5');
            line.setAttribute('stroke-dasharray', '9 4');
            line.setAttribute('marker-end', 'url(#arrowhead-selected)');
        }

        updateConnectionBar();
    }

    function clearConnectionSelection(updateBar = true) {
        if (state.selectedConnId) {
            const line = document.getElementById(state.selectedConnId);
            if (line) {
                line.setAttribute('stroke', line._origStroke || '#555');
                line.setAttribute('stroke-width', '2.8');
                line.removeAttribute('stroke-dasharray');
                line.setAttribute('marker-end', line._origMarker || 'url(#arrowhead)');
            }
        }
        state.selectedConnId = null;
        if (updateBar) updateConnectionBar();
    }

    function updateConnectionBar() {
        if (state.selectedConnId) {
            connectionBar.classList.remove('hidden');
        } else {
            connectionBar.classList.add('hidden');
        }
    }

    function deleteConnection(connId) {
        const conn  = state.connections.find(c => c.id === connId);
        if (!conn) return;
        saveSnapshot();

        document.getElementById(connId)?.remove();
        document.getElementById(`label-${connId}`)?.remove();
        document.getElementById(`hit-${connId}`)?.remove();

        state.connections = state.connections.filter(c => c.id !== connId);
        clearConnectionSelection();
    }

    deleteConnBtn.addEventListener('click', () => {
        if (state.selectedConnId) deleteConnection(state.selectedConnId);
    });

    // ============= ФІГУРИ =============
    function getDefaultText(type) {
        switch (type) {
            case 'start-end':    return 'Початок';
            case 'process':      return 'Дія';
            case 'decision':     return 'Умова?';
            case 'input-output': return 'Ввід / Вивід';
            default:             return '';
        }
    }

    function getDefaultColor(type) {
        switch (type) {
            case 'start-end':    return '#4caf50';
            case 'process':      return '#03a9f4';
            case 'decision':     return '#ff9800';
            case 'input-output': return '#3f51b5';
            default:             return '#3f51b5';
        }
    }

    function createShape(type, color, textValue, posLeft, posTop, forcedId) {
        if (!forcedId) state.shapeCounter++;
        const shapeId = forcedId || `shape-${state.shapeCounter}`;

        // Уникнути дублікатів при restore
        if (forcedId && document.getElementById(forcedId)) return document.getElementById(forcedId);

        const usedColor = color || getDefaultColor(type);

        const shape = document.createElement('div');
        shape.id        = shapeId;
        shape.className = `shape ${type}`;
        shape.setAttribute('role', 'button');
        shape.setAttribute('aria-label', `Фігура: ${getDefaultText(type)}`);
        shape.setAttribute('tabindex', '0');
        shape.style.backgroundColor = usedColor;

        const containerRect = canvasContainer.getBoundingClientRect();
        const defaultLeft   = (canvasContainer.scrollLeft + containerRect.width  / 2) / state.scale - 75;
        const defaultTop    = (canvasContainer.scrollTop  + containerRect.height / 3) / state.scale - 30;

        shape.style.left = (posLeft !== undefined ? posLeft : Math.max(20, defaultLeft)) + 'px';
        shape.style.top  = (posTop  !== undefined ? posTop  : Math.max(20, defaultTop))  + 'px';

        const content = document.createElement('div');
        content.className   = 'content';
        content.textContent = textValue !== undefined ? textValue : getDefaultText(type);
        shape.appendChild(content);
        canvas.appendChild(shape);

        // Зберегти в масив (якщо не відновлення)
        if (!state.shapes.find(s => s.id === shapeId)) {
            state.shapes.push({ id: shapeId, type, color: usedColor, text: content.textContent });
        }

        // Анімація появи (лише для нових)
        if (!forcedId) {
            shape.classList.add('new-pop');
            setTimeout(() => shape.classList.remove('new-pop'), 350);
        }

        // Events
        shape.addEventListener('pointerdown', onShapePointerDown);

        shape.addEventListener('dblclick', function (e) {
            e.stopPropagation();
            openTextModal(this);
        });

        // Long-press → edit text (touch)
        let longPressTimer = null;
        shape.addEventListener('pointerdown', function () {
            longPressTimer = setTimeout(() => {
                longPressTimer = null;
                openTextModal(shape);
            }, 600);
        });
        shape.addEventListener('pointerup', () => {
            clearTimeout(longPressTimer);
            longPressTimer = null;
        });
        shape.addEventListener('pointercancel', () => {
            clearTimeout(longPressTimer);
            longPressTimer = null;
        });
        shape.addEventListener('pointermove', () => {
            clearTimeout(longPressTimer);
            longPressTimer = null;
        });

        shape.addEventListener('click', function (e) {
            e.stopPropagation();
            clearConnectionSelection();
            selectShape(this);
        });

        // Hover handles
        shape.addEventListener('pointerenter', function () {
            if (!state.connDrag) showHandlesForShape(this.id);
        });
        shape.addEventListener('pointerleave', function () {
            if (!state.connDrag) {
                if (state.selectedShape && state.selectedShape !== this) {
                    showHandlesForShape(state.selectedShape.id);
                } else if (!state.selectedShape) {
                    hideAllHandles();
                }
            }
        });

        // Keyboard
        shape.addEventListener('keydown', function (e) {
            if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openTextModal(this); }
            if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); deleteSelectedShape(); }
        });

        createHandleGroup(shape);
        attachHandleListeners(shapeId);

        return shape;
    }

    function openTextModal(shapeEl) {
        state.activeShape = shapeEl;
        const c = shapeEl.querySelector('.content');
        shapeTextArea.value = c ? c.textContent : '';
        openModal(textModal);
        setTimeout(() => shapeTextArea.focus(), 50);
    }

    // ============= ВИБІР ФІГУРИ =============
    function selectShape(el) {
        clearConnectionSelection(false);
        if (state.selectedShape && state.selectedShape !== el) {
            state.selectedShape.classList.remove('selected');
        }
        state.selectedShape = el;
        el.classList.add('selected');
        el.setAttribute('aria-selected', 'true');
        showHandlesForShape(el.id);
        updateConnectionBar();

        // Sync colour picker
        const hex = rgbToHex(el.style.backgroundColor);
        document.querySelectorAll('.color-option').forEach(opt => {
            opt.classList.toggle('selected',
                opt.getAttribute('data-color').toLowerCase() === hex.toLowerCase());
        });
    }

    function deselectAll(updateBar = true) {
        if (state.selectedShape) {
            state.selectedShape.classList.remove('selected');
            state.selectedShape.setAttribute('aria-selected', 'false');
            state.selectedShape = null;
        }
        hideAllHandles();
        if (updateBar) updateConnectionBar();
    }

    // ============= DRAG ФІГУР =============
    function onShapePointerDown(e) {
        if (e.target.classList.contains('conn-handle')) return;
        if (e.button === 2) return;
        e.stopPropagation();

        clearConnectionSelection();
        selectShape(this);

        if (e.detail >= 2) return;

        const el = this;
        const pt = clientToCanvas(e.clientX, e.clientY);
        let moved = false;

        state.dragState = {
            el,
            offsetX: pt.x - el.offsetLeft,
            offsetY: pt.y - el.offsetTop,
        };

        el.setPointerCapture(e.pointerId);
        el.style.cursor = 'grabbing';

        const onMove = (ev) => {
            if (!state.dragState) return;
            moved = true;
            const pt2 = clientToCanvas(ev.clientX, ev.clientY);
            const newX = Math.max(0, pt2.x - state.dragState.offsetX);
            const newY = Math.max(0, pt2.y - state.dragState.offsetY);
            el.style.left = newX + 'px';
            el.style.top  = newY + 'px';
            updateConnectionsForShape(el.id);
            updateHandleGroup(el.id);
        };

        const onUp = () => {
            el.style.cursor = 'move';
            if (moved) saveSnapshot();
            state.dragState = null;
            el.removeEventListener('pointermove', onMove);
            el.removeEventListener('pointerup',   onUp);
            el.removeEventListener('pointercancel', onUp);
        };

        el.addEventListener('pointermove', onMove);
        el.addEventListener('pointerup',   onUp);
        el.addEventListener('pointercancel', onUp);

        e.preventDefault();
    }

    // ============= МАСШТАБ =============
    function setZoom(newScale) {
        newScale = Math.max(state.minScale, Math.min(state.maxScale, newScale));
        const cr  = canvasContainer.getBoundingClientRect();
        const scx = (canvasContainer.scrollLeft + cr.width  / 2) / state.scale;
        const scy = (canvasContainer.scrollTop  + cr.height / 2) / state.scale;

        state.scale = newScale;
        canvas.style.transform = `scale(${newScale})`;
        zoomLevelText.textContent = `${Math.round(newScale * 100)}%`;

        canvasContainer.scrollLeft = scx * newScale - cr.width  / 2;
        canvasContainer.scrollTop  = scy * newScale - cr.height / 2;

        state.connections.forEach(conn => {
            updateConnection(conn.id);
            if (conn.type) updateConnectionLabel(conn.id);
        });
        Object.keys(shapeHandleGroups).forEach(updateHandleGroup);
    }

    zoomInBtn.addEventListener('click',    () => setZoom(state.scale + state.scaleStep));
    zoomOutBtn.addEventListener('click',   () => setZoom(state.scale - state.scaleStep));
    zoomResetBtn.addEventListener('click', () => setZoom(1));

    canvasContainer.addEventListener('wheel', function (e) {
        e.preventDefault();
        setZoom(state.scale + Math.sign(e.deltaY) * -0.1);
    }, { passive: false });

    // ============= ПАНОРАМУВАННЯ =============
    let isPanning = false, panStart = {x:0,y:0}, panScroll = {left:0,top:0};

    canvasContainer.addEventListener('pointerdown', function (e) {
        const onCanvas = e.target === canvas || e.target === canvasContainer || e.target === svgLayer;
        if (onCanvas && e.button !== 2) {
            isPanning = true;
            panStart  = { x: e.clientX, y: e.clientY };
            panScroll = { left: canvasContainer.scrollLeft, top: canvasContainer.scrollTop };
            canvasContainer.setPointerCapture(e.pointerId);
            canvasContainer.style.cursor = 'grab';
            e.preventDefault();
        }
    });

    document.addEventListener('pointermove', function (e) {
        if (isPanning) {
            canvasContainer.scrollLeft = panScroll.left - (e.clientX - panStart.x);
            canvasContainer.scrollTop  = panScroll.top  - (e.clientY - panStart.y);
        }
    });

    document.addEventListener('pointerup', function (e) {
        if (isPanning) {
            isPanning = false;
            try { canvasContainer.releasePointerCapture(e.pointerId); } catch (_) {}
            canvasContainer.style.cursor = '';
        }
    });

    canvasContainer.addEventListener('contextmenu', e => e.preventDefault());

    canvas.addEventListener('pointerdown', function (e) {
        if (e.target === canvas && !state.connDrag) {
            deselectAll();
            clearConnectionSelection();
        }
    });

    // ============= КНОПКИ SIDEBAR =============
    document.querySelector('.shape-buttons').addEventListener('click', function (e) {
        const btn = e.target.closest('.shape-button');
        if (!btn) return;
        const type  = btn.getAttribute('data-shape');
        saveSnapshot();
        const shape = createShape(type, state.currentColor);
        setTimeout(() => {
            selectShape(shape);
            updateHandleGroup(shape.id);
        }, 30);
    });

    document.querySelector('.color-picker').addEventListener('click', function (e) {
        const opt = e.target.closest('.color-option');
        if (!opt) return;
        document.querySelectorAll('.color-option').forEach(o => o.classList.remove('selected'));
        opt.classList.add('selected');
        state.currentColor = opt.getAttribute('data-color');
        if (state.selectedShape) {
            saveSnapshot();
            state.selectedShape.style.backgroundColor = state.currentColor;
            const s = state.shapes.find(sh => sh.id === state.selectedShape.id);
            if (s) s.color = state.currentColor;
        }
    });

    // Видалити вибрану фігуру / з'єднання
    function deleteSelected() {
        if (state.selectedConnId) {
            deleteConnection(state.selectedConnId);
            return;
        }
        if (!state.selectedShape) return;
        const id = state.selectedShape.id;
        saveSnapshot();

        state.connections = state.connections.filter(conn => {
            if (conn.from === id || conn.to === id) {
                document.getElementById(conn.id)?.remove();
                document.getElementById(`label-${conn.id}`)?.remove();
                document.getElementById(`hit-${conn.id}`)?.remove();
                return false;
            }
            return true;
        });

        removeHandleGroup(id);
        state.shapes = state.shapes.filter(s => s.id !== id);
        state.selectedShape.remove();
        state.selectedShape = null;
        updateConnectionBar();
    }

    deleteButton.addEventListener('click', deleteSelected);

    // Клавіатура
    document.addEventListener('keydown', function (e) {
        const tag = document.activeElement?.tagName || '';
        if (tag === 'TEXTAREA' || tag === 'INPUT') return;
        if (e.key === 'Delete' || e.key === 'Backspace') deleteSelected();
        if (e.key === 'Escape') {
            deselectAll();
            clearConnectionSelection();
            state.connDrag = null;
            tempLine.style.display = 'none';
        }
        if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
            e.preventDefault();
            undo();
        }
        if ((e.ctrlKey || e.metaKey) && e.key === '+') { e.preventDefault(); setZoom(state.scale + 0.1); }
        if ((e.ctrlKey || e.metaKey) && e.key === '-') { e.preventDefault(); setZoom(state.scale - 0.1); }
    });

    // Очистити все
    clearButton.addEventListener('click', function () {
        showConfirmModal('🧹 Видалити всі фігури та стрілки?', function () {
            saveSnapshot();
            state.shapes.forEach(s => {
                document.getElementById(s.id)?.remove();
                removeHandleGroup(s.id);
            });
            state.connections.forEach(c => {
                document.getElementById(c.id)?.remove();
                document.getElementById(`label-${c.id}`)?.remove();
                document.getElementById(`hit-${c.id}`)?.remove();
            });
            state.shapes      = [];
            state.connections = [];
            deselectAll();
            clearConnectionSelection();
        });
    });

    // ============= ЗБЕРЕЖЕННЯ — ВІДЦЕНТРОВАНИЙ EXPORT =============
    saveButton.addEventListener('click', function () {
        if (state.shapes.length === 0) {
            showMessageModal('😊 Спочатку додай хоча б одну фігуру!');
            return;
        }

        const PADDING = 60;
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

        state.shapes.forEach(s => {
            const el = document.getElementById(s.id);
            if (!el) return;
            const left = parseFloat(el.style.left);
            const top  = parseFloat(el.style.top);
            const w    = el.offsetWidth;
            const h    = el.offsetHeight;
            const cx   = left + w / 2;
            const cy   = top  + h / 2;

            if (s.type === 'decision') {
                const d = w * Math.SQRT2 / 2;
                minX = Math.min(minX, cx - d);
                minY = Math.min(minY, cy - d);
                maxX = Math.max(maxX, cx + d);
                maxY = Math.max(maxY, cy + d);
            } else if (s.type === 'input-output') {
                // Паралелограм: skew додає ~tan(20°)*h/2 ≈ 0.364*h/2
                const skewOffset = Math.abs(Math.tan(20 * Math.PI / 180) * h / 2);
                minX = Math.min(minX, left - skewOffset);
                minY = Math.min(minY, top);
                maxX = Math.max(maxX, left + w + skewOffset);
                maxY = Math.max(maxY, top + h);
            } else {
                minX = Math.min(minX, left);
                minY = Math.min(minY, top);
                maxX = Math.max(maxX, left + w);
                maxY = Math.max(maxY, top + h);
            }
        });

        const clipX = Math.max(0, minX - PADDING);
        const clipY = Math.max(0, minY - PADDING);
        const clipW = (maxX - minX) + PADDING * 2;
        const clipH = (maxY - minY) + PADDING * 2;

        // Сховати UI елементи
        const zoomControls = document.querySelector('.zoom-controls');
        const connBar      = document.getElementById('connection-bar');
        if (zoomControls) zoomControls.style.display = 'none';
        if (connBar)      connBar.style.display = 'none';

        hideAllHandles();
        deselectAll();
        clearConnectionSelection();

        // Тимчасово скидаємо масштаб для точного рендеру
        const savedScale = state.scale;
        canvas.style.transform = 'scale(1)';

        setTimeout(() => {
            html2canvas(canvas, {
                x: clipX,
                y: clipY,
                width:  clipW,
                height: clipH,
                scale:  2,
                useCORS: true,
                backgroundColor: '#fafbff',
                logging: false,
            }).then(function (c) {
                // Відновлюємо масштаб
                canvas.style.transform = `scale(${savedScale})`;
                if (zoomControls) zoomControls.style.display = '';
                if (connBar)      connBar.style.display = '';

                c.toBlob(function (blob) {
                    const url = URL.createObjectURL(blob);
                    const a   = document.createElement('a');
                    a.href     = url;
                    a.download = 'блок-схема.png';
                    a.click();
                    URL.revokeObjectURL(url);
                    launchConfetti();
                    showMessageModal('🎉 Чудово! Твоя блок-схема збережена!');
                });
            });
        }, 50);
    });

    // ============= ТЕКСТОВИЙ МОДАЛ =============
    cancelText.addEventListener('click', function () {
        state.activeShape = null;
        closeModal(textModal);
    });

    saveText.addEventListener('click', function () {
        if (state.activeShape) {
            saveSnapshot();
            const raw     = shapeTextArea.value.trim();
            const newText = raw || getDefaultText(
                state.shapes.find(s => s.id === state.activeShape.id)?.type || ''
            );
            const content = state.activeShape.querySelector('.content');
            if (content) {
                content.textContent = newText;   // textContent = безпечно, без XSS
                state.activeShape.setAttribute('aria-label', `Фігура: ${newText}`);
            }
            const s = state.shapes.find(sh => sh.id === state.activeShape.id);
            if (s) s.text = newText;
        }
        state.activeShape = null;
        closeModal(textModal);
    });

    shapeTextArea.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            saveText.click();
        }
        if (e.key === 'Escape') cancelText.click();
    });

    // ============= МОДАЛ З'ЄДНАННЯ =============
    connectionYesBtn.addEventListener('click', function () {
        if (state.pendingConn) {
            saveSnapshot();
            connectShapes(state.pendingConn.fromEl, state.pendingConn.toEl, 'yes');
            state.pendingConn = null;
        }
        closeModal(connectionModal);
    });

    connectionNoBtn.addEventListener('click', function () {
        if (state.pendingConn) {
            saveSnapshot();
            connectShapes(state.pendingConn.fromEl, state.pendingConn.toEl, 'no');
            state.pendingConn = null;
        }
        closeModal(connectionModal);
    });

    cancelConnBtn.addEventListener('click', function () {
        state.pendingConn = null;
        closeModal(connectionModal);
    });

    // ============= ДОПОМОГА =============
    helpButton.addEventListener('click', () => {
        helpPanel.hidden = !helpPanel.hidden;
    });
    helpClose.addEventListener('click', () => {
        helpPanel.hidden = true;
    });

    // Закрити при кліку поза панеллю
    document.addEventListener('pointerdown', function (e) {
        if (!helpPanel.hidden && !helpPanel.contains(e.target) && e.target !== helpButton) {
            helpPanel.hidden = true;
        }
    });

    // Показуємо при першому відкритті
    setTimeout(() => { helpPanel.hidden = false; }, 600);

    // ============= УТИЛІТИ =============
    function openModal(modal)  { modal.classList.add('active'); }
    function closeModal(modal) { modal.classList.remove('active'); }

    function rgbToHex(rgb) {
        if (!rgb || rgb === 'transparent') return '#ffffff';
        if (rgb.startsWith('#')) return rgb;
        const m = rgb.match(/\d+/g);
        if (m && m.length >= 3)
            return '#' + m.slice(0,3).map(n => (+n).toString(16).padStart(2,'0')).join('');
        return '#ffffff';
    }

    function showMessageModal(text) {
        const modal = document.getElementById('message-modal');
        // textContent для безпеки, але тут потрібні емодзі — залишаємо textContent
        document.getElementById('message-modal-text').textContent = text;
        const btns = document.getElementById('message-modal-buttons');
        btns.innerHTML = '';
        const ok = document.createElement('button');
        ok.textContent = 'OK';
        ok.className   = 'modal-btn ok-btn';
        ok.onclick     = () => closeModal(modal);
        btns.appendChild(ok);
        openModal(modal);
        setTimeout(() => ok.focus(), 50);
    }

    function showConfirmModal(text, onOk) {
        const modal = document.getElementById('message-modal');
        document.getElementById('message-modal-text').textContent = text;
        const btns = document.getElementById('message-modal-buttons');
        btns.innerHTML = '';

        const cancel = document.createElement('button');
        cancel.textContent = 'Скасувати';
        cancel.className   = 'modal-btn cancel-btn';
        cancel.onclick     = () => closeModal(modal);

        const ok = document.createElement('button');
        ok.textContent = '✅ Так, видалити';
        ok.className   = 'modal-btn';
        ok.style.cssText = 'background:#f44336;color:white;';
        ok.onclick = () => { closeModal(modal); if (onOk) onOk(); };

        btns.appendChild(cancel);
        btns.appendChild(ok);
        openModal(modal);
        setTimeout(() => cancel.focus(), 50);
    }

    // Закрити modal по кліку на фон
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('pointerdown', function (e) {
            if (e.target === modal) closeModal(modal);
        });
    });

    // ============= КОНФЕТІ =============
    function launchConfetti() {
        const cvs = document.getElementById('confetti-canvas');
        cvs.width  = window.innerWidth;
        cvs.height = window.innerHeight;
        const ctx  = cvs.getContext('2d');
        const pieces = [];
        const COLORS = ['#4361ee','#7b2ff7','#f44336','#ff9800','#4caf50','#03a9f4','#ffe066','#e91e63'];
        for (let i = 0; i < 120; i++) {
            pieces.push({
                x: Math.random() * cvs.width,
                y: Math.random() * -cvs.height,
                w: 8 + Math.random() * 10,
                h: 4 + Math.random() * 6,
                color: COLORS[Math.floor(Math.random() * COLORS.length)],
                vx: (Math.random() - 0.5) * 5,
                vy: 3 + Math.random() * 6,
                rot: Math.random() * 360,
                vr: (Math.random() - 0.5) * 8,
            });
        }
        let frame = 0;
        function draw() {
            ctx.clearRect(0, 0, cvs.width, cvs.height);
            pieces.forEach(p => {
                ctx.save();
                ctx.translate(p.x + p.w/2, p.y + p.h/2);
                ctx.rotate(p.rot * Math.PI / 180);
                ctx.fillStyle = p.color;
                ctx.fillRect(-p.w/2, -p.h/2, p.w, p.h);
                ctx.restore();
                p.x  += p.vx;
                p.y  += p.vy;
                p.rot += p.vr;
            });
            frame++;
            if (frame < 120) requestAnimationFrame(draw);
            else ctx.clearRect(0, 0, cvs.width, cvs.height);
        }
        draw();
    }

    // ============= ПОЧАТКОВІ ФІГУРИ =============
    setTimeout(function () {
        const cr  = canvasContainer.getBoundingClientRect();
        const cx  = (canvasContainer.scrollLeft + cr.width  / 2) / state.scale;
        const cy  = (canvasContainer.scrollTop  + cr.height / 3) / state.scale;

        const startEl   = createShape('start-end', '#4caf50', 'Початок', cx - 65, cy - 90);
        const processEl = createShape('process',   '#03a9f4', 'Моя дія',  cx - 65, cy + 30);

        setTimeout(() => {
            connectShapes(startEl, processEl, null);
            updateHandleGroup(startEl.id);
            updateHandleGroup(processEl.id);
            // Не зберігаємо початковий стан як "undo"-знімок
            state.undoStack = [];
            undoButton.disabled = true;
        }, 100);
    }, 400);

}); // DOMContentLoaded
