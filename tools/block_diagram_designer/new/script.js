document.addEventListener('DOMContentLoaded', function () {
    // ============= DOM =============
    const canvas         = document.getElementById('flowchart-canvas');
    const canvasContainer = document.getElementById('canvas-container');
    const svgLayer       = document.getElementById('connectors-layer');
    const colorOptions   = document.querySelectorAll('.color-option');
    const deleteButton   = document.getElementById('delete-button');
    const clearButton    = document.getElementById('clear-button');
    const saveButton     = document.getElementById('save-button');
    const textModal      = document.getElementById('text-modal');
    const shapeTextArea  = document.getElementById('shape-text');
    const cancelText     = document.getElementById('cancel-text');
    const saveText       = document.getElementById('save-text');
    const helpButton     = document.getElementById('help-button');
    const helpContent    = document.getElementById('help-content');
    const zoomInBtn      = document.getElementById('zoom-in');
    const zoomOutBtn     = document.getElementById('zoom-out');
    const zoomResetBtn   = document.getElementById('zoom-reset');
    const zoomLevelText  = document.getElementById('zoom-level');
    const connectionModal   = document.getElementById('connection-modal');
    const connectionYesBtn  = document.getElementById('connection-yes');
    const connectionNoBtn   = document.getElementById('connection-no');
    const cancelConnectionBtn = document.getElementById('cancel-connection');

    // ============= Стан =============
    const state = {
        shapes:      [],   // { id, type, color, text }
        connections: [],   // { id, from, to, type }
        selectedShape: null,
        currentShapeType: 'start-end',
        currentColor: '#3f51b5',
        shapeCounter: 0,
        scale: 1,
        minScale: 0.25,
        maxScale: 3,
        scaleStep: 0.1,
        activeShape: null,   // фігура, що редагується
        dragState: null,     // { el, offsetX, offsetY }
        connDrag: null,      // { fromShapeId, startX, startY }
        pendingConn: null,   // { fromEl, toEl } — очікує вибору Так/Ні
    };

    // ============= Тимчасова лінія (rubber-band) =============
    const tempLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    tempLine.setAttribute('stroke', '#3f51b5');
    tempLine.setAttribute('stroke-width', '2.5');
    tempLine.setAttribute('stroke-dasharray', '7 4');
    tempLine.setAttribute('marker-end', 'url(#arrowhead)');
    tempLine.style.display = 'none';
    tempLine.style.pointerEvents = 'none';
    svgLayer.appendChild(tempLine);

    // ============= Handles (маркери з'єднання) =============
    // Зберігаємо SVG-групу для кожної фігури
    const shapeHandleGroups = {}; // shapeId → <g>

    /**
     * Повертає позиції чотирьох маркерів з'єднання у просторі полотна
     */
    function getHandlePositions(shapeEl) {
        const cx = shapeEl.offsetLeft + shapeEl.offsetWidth  / 2;
        const cy = shapeEl.offsetTop  + shapeEl.offsetHeight / 2;

        if (shapeEl.classList.contains('decision')) {
            // Ромб: вершини на кутах (відстань = CSS_розмір * √2 / 2)
            const d = shapeEl.offsetWidth * Math.SQRT2 / 2;
            return {
                top:    { x: cx,     y: cy - d },
                right:  { x: cx + d, y: cy     },
                bottom: { x: cx,     y: cy + d },
                left:   { x: cx - d, y: cy     }
            };
        }

        // Прямокутник / овал / паралелограм
        const hw = shapeEl.offsetWidth  / 2;
        const hh = shapeEl.offsetHeight / 2;
        return {
            top:    { x: cx,      y: cy - hh },
            right:  { x: cx + hw, y: cy      },
            bottom: { x: cx,      y: cy + hh },
            left:   { x: cx - hw, y: cy      }
        };
    }

    /**
     * Точка на краю фігури в напрямку (toX, toY)
     */
    function getConnectionPoint(shapeEl, toX, toY) {
        const cx = shapeEl.offsetLeft + shapeEl.offsetWidth  / 2;
        const cy = shapeEl.offsetTop  + shapeEl.offsetHeight / 2;
        const dx = toX - cx;
        const dy = toY - cy;

        if (shapeEl.classList.contains('decision')) {
            const d = shapeEl.offsetWidth * Math.SQRT2 / 2;
            // Вибираємо найближчу вершину ромба
            if (Math.abs(dx) >= Math.abs(dy)) {
                return dx >= 0 ? { x: cx + d, y: cy } : { x: cx - d, y: cy };
            } else {
                return dy >= 0 ? { x: cx, y: cy + d } : { x: cx, y: cy - d };
            }
        }

        // Прямокутна фігура: перетин з bbox
        const hw = shapeEl.offsetWidth  / 2;
        const hh = shapeEl.offsetHeight / 2;
        if (dx === 0 && dy === 0) return { x: cx, y: cy };
        const sx = hw / (Math.abs(dx) || 0.001);
        const sy = hh / (Math.abs(dy) || 0.001);
        const s = Math.min(sx, sy);
        return { x: cx + dx * s, y: cy + dy * s };
    }

    /**
     * Знайти фігуру під точкою (простір полотна)
     */
    function findShapeAt(x, y, excludeId) {
        // Перевіряємо з кінця масиву (верхні фігури першими)
        for (let i = state.shapes.length - 1; i >= 0; i--) {
            const s = state.shapes[i];
            if (s.id === excludeId) continue;
            const el = document.getElementById(s.id);
            if (!el) continue;
            const cx = el.offsetLeft + el.offsetWidth  / 2;
            const cy = el.offsetTop  + el.offsetHeight / 2;
            const dx = Math.abs(x - cx);
            const dy = Math.abs(y - cy);
            if (s.type === 'decision') {
                const d = el.offsetWidth * Math.SQRT2 / 2;
                if (dx / d + dy / d <= 1.15) return el;
            } else {
                if (dx <= el.offsetWidth / 2 + 8 && dy <= el.offsetHeight / 2 + 8) return el;
            }
        }
        return null;
    }

    /**
     * Конвертує clientX/Y в координати простору полотна
     */
    function clientToCanvas(clientX, clientY) {
        const r = canvas.getBoundingClientRect();
        return {
            x: (clientX - r.left) / state.scale,
            y: (clientY - r.top)  / state.scale
        };
    }

    // ============= Handle-group management =============

    function createHandleGroup(shapeEl) {
        const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        g.dataset.shapeId = shapeEl.id;

        ['top', 'right', 'bottom', 'left'].forEach(pos => {
            const c = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            c.setAttribute('r', '9');
            c.setAttribute('fill', 'white');
            c.setAttribute('stroke', '#3f51b5');
            c.setAttribute('stroke-width', '2.5');
            c.classList.add('conn-handle');
            c.dataset.shapeId = shapeEl.id;
            c.dataset.pos = pos;
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
        const posKeys = ['top', 'right', 'bottom', 'left'];
        const circles = g.querySelectorAll('circle');
        posKeys.forEach((pos, i) => {
            circles[i].setAttribute('cx', pts[pos].x);
            circles[i].setAttribute('cy', pts[pos].y);
        });
    }

    function showHandlesForShape(shapeId) {
        // Ховаємо всі
        Object.values(shapeHandleGroups).forEach(g => {
            g.querySelectorAll('circle').forEach(c => c.classList.remove('visible'));
        });
        // Показуємо для вибраної
        const g = shapeHandleGroups[shapeId];
        if (g) {
            g.querySelectorAll('circle').forEach(c => c.classList.add('visible'));
        }
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

    // ============= Handle drag (створення з'єднання) =============

    function onHandlePointerDown(e) {
        if (e.button !== 0 && e.pointerType === 'mouse') return;
        e.preventDefault();
        e.stopPropagation();

        const shapeId = this.dataset.shapeId;
        const pos     = this.dataset.pos;
        const shapeEl = document.getElementById(shapeId);
        if (!shapeEl) return;

        const pts  = getHandlePositions(shapeEl);
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

            const pt = clientToCanvas(ev.clientX, ev.clientY);
            const targetEl = findShapeAt(pt.x, pt.y, fromId);
            if (!targetEl) return;

            const fromEl   = document.getElementById(fromId);
            const fromData = state.shapes.find(s => s.id === fromId);
            if (fromData && fromData.type === 'decision') {
                state.pendingConn = { fromEl, toEl: targetEl };
                connectionModal.style.display = 'flex';
            } else {
                connectShapes(fromEl, targetEl, null);
            }
        };

        this.addEventListener('pointermove', onMove);
        this.addEventListener('pointerup',   onUp);
        this.addEventListener('pointercancel', onUp);
    }

    // Прикріпити обробники до всіх handles
    function attachHandleListeners(shapeId) {
        const g = shapeHandleGroups[shapeId];
        if (!g) return;
        g.querySelectorAll('circle').forEach(c => {
            c.addEventListener('pointerdown', onHandlePointerDown);
        });
    }

    // ============= З'єднання =============

    function updateConnection(connectionId) {
        const conn   = state.connections.find(c => c.id === connectionId);
        const line   = document.getElementById(connectionId);
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

        line.setAttribute('x1', fromPt.x);
        line.setAttribute('y1', fromPt.y);
        line.setAttribute('x2', toPt.x);
        line.setAttribute('y2', toPt.y);
    }

    function updateConnectionsForShape(shapeId) {
        state.connections.forEach(conn => {
            if (conn.from === shapeId || conn.to === shapeId) {
                updateConnection(conn.id);
                if (conn.type) updateConnectionLabel(conn.id);
            }
        });
    }

    function connectShapes(fromEl, toEl, connType) {
        connType = connType || null;
        const connId = connType
            ? `conn-${fromEl.id}-${toEl.id}-${connType}`
            : `conn-${fromEl.id}-${toEl.id}`;

        if (state.connections.some(c => c.id === connId)) {
            showMessageModal("Ці фігури вже з'єднані!");
            return null;
        }

        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('id', connId);
        if (connType === 'yes') {
            line.setAttribute('stroke', '#6aa84f');
            line.setAttribute('stroke-width', '2.5');
            line.setAttribute('marker-end', 'url(#arrowhead-yes)');
        } else if (connType === 'no') {
            line.setAttribute('stroke', '#e06666');
            line.setAttribute('stroke-width', '2.5');
            line.setAttribute('marker-end', 'url(#arrowhead-no)');
        } else {
            line.setAttribute('stroke', '#333');
            line.setAttribute('stroke-width', '2.5');
            line.setAttribute('marker-end', 'url(#arrowhead)');
        }
        line.style.pointerEvents = 'none';
        // Вставляємо перед handles-групами (щоб handles були зверху)
        svgLayer.insertBefore(line, svgLayer.querySelector('g'));

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
        bg.setAttribute('rx', '10');
        bg.setAttribute('ry', '10');
        bg.setAttribute('fill', 'white');
        bg.setAttribute('stroke', labelType === 'yes' ? '#6aa84f' : '#e06666');
        bg.setAttribute('stroke-width', '1.5');

        const txt = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        txt.setAttribute('text-anchor', 'middle');
        txt.setAttribute('dominant-baseline', 'central');
        txt.setAttribute('fill', labelType === 'yes' ? '#6aa84f' : '#e06666');
        txt.setAttribute('font-family', "'Roboto', Arial, sans-serif");
        txt.setAttribute('font-size', '14px');
        txt.setAttribute('font-weight', 'bold');
        txt.textContent = labelType === 'yes' ? 'Так' : 'Ні';

        labelGroup.appendChild(bg);
        labelGroup.appendChild(txt);
        // Вставляємо перед handles-групами
        svgLayer.insertBefore(labelGroup, svgLayer.querySelector('g[data-shape-id]'));
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
            const pad  = 6;
            bg.setAttribute('x', bbox.x - pad);
            bg.setAttribute('y', bbox.y - pad);
            bg.setAttribute('width',  bbox.width  + pad * 2);
            bg.setAttribute('height', bbox.height + pad * 2);
        } catch (_) {}
    }

    // ============= Створення фігур =============

    function getDefaultText(type) {
        switch (type) {
            case 'start-end':    return 'Початок';
            case 'process':      return 'Дія';
            case 'decision':     return 'Умова?';
            case 'input-output': return 'Ввід/Вивід';
            default:             return '';
        }
    }

    function getDefaultColor(type) {
        switch (type) {
            case 'start-end':    return '#4caf50';
            case 'process':      return 'rgb(3, 169, 244)';
            case 'decision':     return '#ff9800';
            case 'input-output': return '#3f51b5';
            default:             return '#3f51b5';
        }
    }

    function createShape(type, color, textValue, posLeft, posTop) {
        state.shapeCounter++;
        const shapeId = `shape-${state.shapeCounter}`;

        const usedColor = color || getDefaultColor(type);

        const shape = document.createElement('div');
        shape.id        = shapeId;
        shape.className = `shape ${type}`;
        shape.style.backgroundColor = usedColor;

        // Позиція
        const containerRect = canvasContainer.getBoundingClientRect();
        const defaultLeft = (canvasContainer.scrollLeft + containerRect.width  / 2) / state.scale - 75;
        const defaultTop  = (canvasContainer.scrollTop  + containerRect.height / 3) / state.scale - 30;
        shape.style.left = (posLeft !== undefined ? posLeft : Math.max(10, defaultLeft)) + 'px';
        shape.style.top  = (posTop  !== undefined ? posTop  : Math.max(10, defaultTop))  + 'px';

        const content = document.createElement('div');
        content.className   = 'content';
        content.textContent = textValue || getDefaultText(type);
        shape.appendChild(content);

        canvas.appendChild(shape);

        state.shapes.push({ id: shapeId, type, color: usedColor, text: content.textContent });

        // Drag через pointer events
        shape.addEventListener('pointerdown', onShapePointerDown);

        // Подвійний клік/тап — редагування тексту
        shape.addEventListener('dblclick', function (e) {
            e.stopPropagation();
            state.activeShape = this;
            const c = this.querySelector('.content');
            shapeTextArea.value = c ? c.textContent : '';
            textModal.style.display = 'flex';
            setTimeout(() => shapeTextArea.focus(), 50);
        });

        // Одинарний клік — вибір
        shape.addEventListener('click', function (e) {
            e.stopPropagation();
            selectShape(this);
        });

        // Hover — показуємо маркери
        shape.addEventListener('pointerenter', function () {
            if (!state.connDrag) {
                showHandlesForShape(this.id);
            }
        });
        shape.addEventListener('pointerleave', function () {
            if (!state.connDrag) {
                if (state.selectedShape && state.selectedShape !== this) {
                    showHandlesForShape(state.selectedShape.id);
                } else if (!state.selectedShape) {
                    hideAllHandles();
                }
                // якщо це сама вибрана — залишаємо handles
            }
        });

        // Створюємо SVG handles для цієї фігури
        createHandleGroup(shape);
        attachHandleListeners(shapeId);

        return shape;
    }

    // ============= Вибір фігури =============

    function selectShape(el) {
        if (state.selectedShape && state.selectedShape !== el) {
            state.selectedShape.classList.remove('selected');
        }
        state.selectedShape = el;
        el.classList.add('selected');
        showHandlesForShape(el.id);

        // Оновлюємо палітру кольорів
        const hex = rgbToHex(el.style.backgroundColor);
        colorOptions.forEach(opt => {
            opt.classList.toggle('selected',
                opt.getAttribute('data-color').toLowerCase() === hex.toLowerCase());
        });
    }

    function deselectAll() {
        if (state.selectedShape) {
            state.selectedShape.classList.remove('selected');
            state.selectedShape = null;
        }
        hideAllHandles();
    }

    // ============= Перетягування фігур (pointer events) =============

    function onShapePointerDown(e) {
        // Ігноруємо handles
        if (e.target.classList.contains('conn-handle')) return;
        // Ігноруємо правий клік
        if (e.button === 2) return;
        e.stopPropagation();

        selectShape(this);

        // Не запускаємо drag при double-click
        let clickCount = 0;
        clickCount++;
        if (e.detail >= 2) return;

        const el = this;
        const pt = clientToCanvas(e.clientX, e.clientY);

        state.dragState = {
            el,
            offsetX: pt.x - el.offsetLeft,
            offsetY: pt.y - el.offsetTop
        };

        el.setPointerCapture(e.pointerId);
        el.style.cursor = 'grabbing';

        const onMove = (ev) => {
            if (!state.dragState) return;
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

    // ============= Масштаб =============

    function setZoom(newScale) {
        newScale = Math.max(state.minScale, Math.min(state.maxScale, newScale));
        const cr = canvasContainer.getBoundingClientRect();
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
        // Оновлюємо позиції handles
        Object.keys(shapeHandleGroups).forEach(updateHandleGroup);
    }

    zoomInBtn.addEventListener('click',   () => setZoom(state.scale + state.scaleStep));
    zoomOutBtn.addEventListener('click',  () => setZoom(state.scale - state.scaleStep));
    zoomResetBtn.addEventListener('click', () => setZoom(1));

    canvasContainer.addEventListener('wheel', function (e) {
        e.preventDefault();
        setZoom(state.scale + Math.sign(e.deltaY) * -0.1);
    }, { passive: false });

    // ============= Панорамування полотна =============
    let isPanning  = false;
    let panStart   = { x: 0, y: 0 };
    let panScroll  = { left: 0, top: 0 };

    canvasContainer.addEventListener('pointerdown', function (e) {
        const onCanvas = e.target === canvas || e.target === canvasContainer;
        const onSvg    = e.target === svgLayer;
        if ((onCanvas || onSvg) && e.button !== 2) {
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

    // ============= Клік на порожньому полотні — скасувати вибір =============
    canvas.addEventListener('pointerdown', function (e) {
        if (e.target === canvas && !state.connDrag) {
            deselectAll();
        }
    });

    // ============= Кнопки інтерфейсу =============

    // Фігури
    document.querySelector('.shape-buttons').addEventListener('click', function (e) {
        const btn = e.target.closest('.shape-button');
        if (btn) {
            state.currentShapeType = btn.getAttribute('data-shape');
            const shape = createShape(state.currentShapeType, null);
            // Невелика затримка, щоб offsetWidth/Height були доступні
            setTimeout(() => {
                selectShape(shape);
                updateHandleGroup(shape.id);
            }, 30);
        }
    });

    // Колір
    document.querySelector('.color-picker').addEventListener('click', function (e) {
        const opt = e.target.closest('.color-option');
        if (opt) {
            colorOptions.forEach(o => o.classList.remove('selected'));
            opt.classList.add('selected');
            state.currentColor = opt.getAttribute('data-color');
            if (state.selectedShape) {
                state.selectedShape.style.backgroundColor = state.currentColor;
                const s = state.shapes.find(sh => sh.id === state.selectedShape.id);
                if (s) s.color = state.currentColor;
            }
        }
    });

    // Видалити вибрану фігуру
    function deleteSelectedShape() {
        if (!state.selectedShape) return;
        const id = state.selectedShape.id;

        state.connections = state.connections.filter(conn => {
            if (conn.from === id || conn.to === id) {
                const line  = document.getElementById(conn.id);
                const label = document.getElementById(`label-${conn.id}`);
                if (line)  line.remove();
                if (label) label.remove();
                return false;
            }
            return true;
        });

        removeHandleGroup(id);
        state.shapes = state.shapes.filter(s => s.id !== id);
        state.selectedShape.remove();
        state.selectedShape = null;
    }

    deleteButton.addEventListener('click', deleteSelectedShape);

    // Клавіатура
    document.addEventListener('keydown', function (e) {
        const tag = document.activeElement ? document.activeElement.tagName : '';
        if (tag === 'TEXTAREA' || tag === 'INPUT') return;
        if (e.key === 'Delete' || e.key === 'Backspace') {
            deleteSelectedShape();
        }
        if (e.key === 'Escape') {
            deselectAll();
            state.connDrag = null;
            tempLine.style.display = 'none';
        }
    });

    // Очистити все
    clearButton.addEventListener('click', function () {
        showConfirmModal('Ви впевнені, що хочете видалити всі фігури?', function () {
            state.shapes.forEach(s => {
                document.getElementById(s.id)?.remove();
                removeHandleGroup(s.id);
            });
            state.connections.forEach(c => {
                document.getElementById(c.id)?.remove();
                document.getElementById(`label-${c.id}`)?.remove();
            });
            state.shapes      = [];
            state.connections = [];
            deselectAll();
        });
    });

    // Зберегти як зображення
    saveButton.addEventListener('click', function () {
        const zoomControls = document.querySelector('.zoom-controls');
        if (zoomControls) zoomControls.style.display = 'none';
        hideAllHandles();
        deselectAll();

        html2canvas(canvasContainer, { useCORS: true }).then(function (c) {
            if (zoomControls) zoomControls.style.display = '';
            c.toBlob(function (blob) {
                const url = URL.createObjectURL(blob);
                const a   = document.createElement('a');
                a.href     = url;
                a.download = 'моя_блок-схема.png';
                a.click();
                URL.revokeObjectURL(url);
                showMessageModal('Твоя блок-схема успішно збережена як зображення!');
            });
        });
    });

    // ============= Текстовий модал =============
    cancelText.addEventListener('click', function () {
        state.activeShape = null;
        textModal.style.display = 'none';
    });

    saveText.addEventListener('click', function () {
        if (state.activeShape) {
            const newText = shapeTextArea.value.trim() || getDefaultText(
                state.shapes.find(s => s.id === state.activeShape.id)?.type || ''
            );
            const content = state.activeShape.querySelector('.content');
            if (content) content.textContent = newText;
            const s = state.shapes.find(sh => sh.id === state.activeShape.id);
            if (s) s.text = newText;
        }
        state.activeShape = null;
        textModal.style.display = 'none';
    });

    shapeTextArea.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            saveText.click();
        }
    });

    // ============= Модал з'єднання Так/Ні =============
    connectionYesBtn.addEventListener('click', function () {
        if (state.pendingConn) {
            connectShapes(state.pendingConn.fromEl, state.pendingConn.toEl, 'yes');
            state.pendingConn = null;
        }
        connectionModal.style.display = 'none';
    });

    connectionNoBtn.addEventListener('click', function () {
        if (state.pendingConn) {
            connectShapes(state.pendingConn.fromEl, state.pendingConn.toEl, 'no');
            state.pendingConn = null;
        }
        connectionModal.style.display = 'none';
    });

    cancelConnectionBtn.addEventListener('click', function () {
        state.pendingConn = null;
        connectionModal.style.display = 'none';
    });

    // ============= Довідка =============
    helpButton.addEventListener('click', () => helpContent.classList.toggle('active'));
    document.getElementById('help-close').addEventListener('click', () => {
        helpContent.classList.remove('active');
    });
    // Показуємо довідку при першому відкритті
    helpContent.classList.add('active');

    // ============= Утиліти =============

    function rgbToHex(rgb) {
        if (!rgb || rgb === 'transparent') return '#ffffff';
        if (rgb.startsWith('#')) return rgb;
        const m = rgb.match(/\d+/g);
        if (m && m.length >= 3) {
            return '#' + m.slice(0, 3).map(n => (+n).toString(16).padStart(2, '0')).join('');
        }
        return '#ffffff';
    }

    function showMessageModal(text, onClose) {
        const modal = document.getElementById('message-modal');
        document.getElementById('message-modal-text').innerHTML = text;
        const btns = document.getElementById('message-modal-buttons');
        btns.innerHTML = '';
        const ok = document.createElement('button');
        ok.textContent = 'OK';
        ok.className   = 'modal-button save';
        ok.onclick = () => {
            modal.classList.remove('active');
            modal.style.display = 'none';
            if (onClose) onClose();
        };
        btns.appendChild(ok);
        modal.style.display = 'flex';
        modal.classList.add('active');
    }

    function showConfirmModal(text, onOk) {
        const modal = document.getElementById('message-modal');
        document.getElementById('message-modal-text').innerHTML = text;
        const btns = document.getElementById('message-modal-buttons');
        btns.innerHTML = '';

        const ok = document.createElement('button');
        ok.textContent = 'Так, видалити';
        ok.className   = 'modal-button save';
        ok.style.backgroundColor = 'var(--danger)';
        ok.onclick = () => {
            modal.classList.remove('active');
            modal.style.display = 'none';
            if (onOk) onOk();
        };

        const cancel = document.createElement('button');
        cancel.textContent = 'Скасувати';
        cancel.className   = 'modal-button cancel';
        cancel.onclick = () => {
            modal.classList.remove('active');
            modal.style.display = 'none';
        };

        btns.appendChild(cancel);
        btns.appendChild(ok);
        modal.style.display = 'flex';
        modal.classList.add('active');
    }

    // ============= Початкові фігури =============
    setTimeout(function () {
        const cr  = canvasContainer.getBoundingClientRect();
        const cx  = (canvasContainer.scrollLeft + cr.width  / 2) / state.scale;
        const cy  = (canvasContainer.scrollTop  + cr.height / 3) / state.scale;

        const startEl   = createShape('start-end', '#4caf50', 'Початок', cx - 60, cy - 90);
        const processEl = createShape('process',   'rgb(3,169,244)', 'Моя дія', cx - 60, cy + 20);

        // Підключаємо після рендерингу
        setTimeout(() => {
            connectShapes(startEl, processEl, null);
            // Оновлюємо handles
            updateHandleGroup(startEl.id);
            updateHandleGroup(processEl.id);
        }, 100);
    }, 400);
});
