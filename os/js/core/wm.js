/* Віконце — віконний менеджер: перетягування, зміна розміру, згортання, розгортання, прилипання. */
(function () {
  'use strict';
  const VOS = window.VOS;
  const { el, bus, clamp, isCompact } = VOS;

  const wins = new Map();
  let z = 10;
  let cascade = 0;
  let layer, desk, snapPreview;

  function deskRect() {
    return { w: desk.clientWidth, h: desk.clientHeight };
  }

  function init() {
    desk = document.getElementById('desktop');
    layer = document.getElementById('windows');
    snapPreview = el('div.snap-preview');
    desk.append(snapPreview);

    // Клацання всередині iframe не доходить до сторінки: ловимо втрату фокусу вікном браузера.
    window.addEventListener('blur', () => {
      setTimeout(() => {
        const a = document.activeElement;
        if (a && a.tagName === 'IFRAME') {
          const w = a.closest('.win');
          if (w && wins.has(w.dataset.id)) focus(w.dataset.id, true);
        }
      }, 0);
    });

    window.addEventListener('resize', VOS.debounce(() => {
      const { w, h } = deskRect();
      for (const win of wins.values()) {
        if (isCompact() && !win.maximized) maximize(win.id, true);
        if (!win.maximized && !win.snapped) {
          // Екран зменшився — вікно не може бути більшим за робочий стіл
          win.w = Math.min(win.w, Math.max(win.minW, w - 8));
          win.h = Math.min(win.h, Math.max(win.minH, h - 8));
          win.x = clamp(win.x, -win.w + 80, w - 80);
          win.y = clamp(win.y, 0, h - 40);
          apply(win);
        } else if (win.snapped) {
          snapTo(win, win.snapped, true);
        }
      }
    }, 120));
  }

  function apply(win) {
    const s = win.el.style;
    if (win.maximized) {
      s.left = s.top = '0px';
      s.width = '100%';
      s.height = '100%';
    } else {
      s.left = win.x + 'px';
      s.top = win.y + 'px';
      s.width = win.w + 'px';
      s.height = win.h + 'px';
    }
    if (win.onResize) win.onResize(win);
  }

  function open(opts) {
    if (opts.singleton) {
      const ex = [...wins.values()].find((w) => w.singleton === opts.singleton);
      if (ex) {
        if (ex.minimized) restore(ex.id);
        focus(ex.id);
        if (ex.onReopen) ex.onReopen(opts);
        return ex;
      }
    }
    const { w: dw, h: dh } = deskRect();
    const id = VOS.uid('w');
    const width = Math.min(opts.width || 640, dw - 20);
    const height = Math.min(opts.height || 440, dh - 20);
    const step = 32 * (cascade++ % 6);
    const win = {
      id,
      app: opts.app || 'app',
      singleton: opts.singleton || null,
      title: opts.title || 'Вікно',
      icon: opts.icon || 'window',
      x: opts.x != null ? opts.x : Math.max(10, Math.round((dw - width) / 2) - 90 + step),
      y: opts.y != null ? opts.y : Math.max(8, Math.round((dh - height) / 2) - 50 + step),
      w: width,
      h: height,
      minW: opts.minWidth || 260,
      minH: opts.minHeight || 180,
      resizable: opts.resizable !== false,
      maximized: false,
      minimized: false,
      snapped: null,
      beforeClose: opts.beforeClose || null,
      onClose: opts.onClose || null,
      onResize: opts.onResize || null,
      onFocus: opts.onFocus || null,
      onReopen: opts.onReopen || null,
    };
    win.x = clamp(win.x, 0, Math.max(0, dw - width));
    win.y = clamp(win.y, 0, Math.max(0, dh - height));

    const titleEl = el('span.win-title', win.title);
    const appDef = VOS.apps && VOS.apps.get(win.app);
    const iconEl = el('span.win-icon', { style: { color: opts.color || (appDef && appDef.color) || '' } }, VOS.ico(win.icon));
    const btnMin = el('button.win-btn.win-min', { type: 'button', title: 'Згорнути', 'aria-label': 'Згорнути', 'data-hint': 'win-min' }, VOS.icon('minus'));
    const btnMax = el('button.win-btn.win-max', { type: 'button', title: 'Розгорнути', 'aria-label': 'Розгорнути', 'data-hint': 'win-max' }, VOS.icon('square'));
    const btnClose = el('button.win-btn.win-close', { type: 'button', title: 'Закрити', 'aria-label': 'Закрити', 'data-hint': 'win-close' }, VOS.icon('x'));
    const titlebar = el('div.win-titlebar', iconEl, titleEl, el('div.win-btns', btnMin, win.resizable ? btnMax : null, btnClose));
    const body = el('div.win-body');
    const node = el('section.win' + (opts.className ? '.' + opts.className : ''), {
      role: 'dialog',
      'aria-label': win.title,
      dataset: { id, app: win.app },
    }, titlebar, body);
    if (win.resizable) {
      for (const d of ['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw']) node.append(el('div.rs.rs-' + d, { dataset: { dir: d } }));
    } else node.classList.add('fixed-size');

    win.el = node;
    win.body = body;
    win.titleEl = titleEl;
    win.iconEl = iconEl;
    win.setIcon = (name) => {
      win.icon = name;
      iconEl.replaceChildren(VOS.ico(name));
      bus.emit('win:icon', { winId: id, icon: name });
    };
    win.setTitle = (t) => {
      win.title = t;
      titleEl.textContent = t;
      node.setAttribute('aria-label', t);
      bus.emit('win:title', { winId: id, app: win.app, title: t });
    };
    win.close = (force) => close(id, force);
    win.focus = () => focus(id);

    if (opts.url) {
      const frame = el('iframe.win-frame', { src: opts.url, title: win.title, allow: 'fullscreen; autoplay', loading: 'eager' });
      const loader = el('div.win-loading', el('div.spinner'), el('div', 'Завантаження…'));
      frame.addEventListener('load', () => {
        loader.remove();
        try {
          const d = frame.contentDocument;
          if (d) {
            const st = d.createElement('style');
            st.textContent = '.ss-header,.ss-footer{display:none!important}body{padding-top:0!important}';
            d.head && d.head.append(st);
            d.addEventListener('pointerdown', () => focus(id, true), true);
          }
        } catch (e) { /* інший домен — без інʼєкції */ }
      });
      body.append(frame, loader);
      body.classList.add('has-frame');
      win.frame = frame;
    } else if (opts.content) {
      body.append(opts.content);
    }

    // події
    node.addEventListener('pointerdown', () => focus(id), true);
    btnMin.addEventListener('click', (e) => { e.stopPropagation(); minimize(id); });
    btnMax.addEventListener('click', (e) => { e.stopPropagation(); toggleMax(id); });
    btnClose.addEventListener('click', (e) => { e.stopPropagation(); close(id); });
    titlebar.addEventListener('dblclick', (e) => { if (!e.target.closest('.win-btn') && win.resizable) toggleMax(id); });
    titlebar.addEventListener('pointerdown', (e) => startDrag(e, win));
    titlebar.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      if (!VOS.ui || !VOS.explain) return;
      VOS.ui.menu(e.clientX, e.clientY, [
        { label: 'Згорнути', icon: 'minus', action: () => minimize(id) },
        win.resizable ? { label: 'Розгорнути / повернути', icon: 'square', action: () => toggleMax(id) } : null,
        { label: 'Закрити вікно', icon: 'x', danger: true, action: () => close(id) },
        ...VOS.explain.sepAndItem(() => ({ ...VOS.explain.kind('window'), ...(win.app ? { lines: VOS.explain.kind('window').lines.concat(['Це вікно програми «' + win.title + '».']) } : {}) })),
      ], { target: 'window-title', app: win.app });
    });
    node.querySelectorAll('.rs').forEach((h) => h.addEventListener('pointerdown', (e) => startResize(e, win, h.dataset.dir)));

    layer.append(node);
    wins.set(id, win);
    apply(win);
    if (opts.maximized || isCompact()) maximize(id, true);
    node.animate([{ opacity: 0, transform: 'scale(.94)' }, { opacity: 1, transform: 'none' }], { duration: 160, easing: 'ease-out' });
    focus(id);
    VOS.sound.play('open');
    bus.emit('win:open', { winId: id, app: win.app, title: win.title });
    return win;
  }

  function focus(id, silent) {
    const win = wins.get(id);
    if (!win) return;
    const wasActive = win.el.classList.contains('active');
    if (win.minimized) restore(id);
    win.el.style.zIndex = ++z;
    for (const w of wins.values()) w.el.classList.toggle('active', w.id === id);
    if (!wasActive) {
      if (win.onFocus) win.onFocus(win);
      bus.emit('win:focus', { winId: id, app: win.app, silent: !!silent });
    }
  }

  function activeId() {
    let best = null, bz = -1;
    for (const w of wins.values()) {
      if (w.minimized) continue;
      const zz = +w.el.style.zIndex || 0;
      if (zz > bz) { bz = zz; best = w.id; }
    }
    return best;
  }

  function focusTop() {
    const id = activeId();
    for (const w of wins.values()) w.el.classList.toggle('active', w.id === id);
    if (id) bus.emit('win:focus', { winId: id, app: wins.get(id).app });
    else bus.emit('win:focus', { winId: null });
  }

  function taskbarRect(id) {
    const b = document.querySelector('.task-btn[data-win="' + id + '"]');
    return b ? b.getBoundingClientRect() : null;
  }

  function minimize(id) {
    const win = wins.get(id);
    if (!win || win.minimized) return;
    const r = win.el.getBoundingClientRect(), t = taskbarRect(id);
    win.minimized = true;
    const done = () => { win.el.classList.add('minimized'); focusTop(); };
    if (t) {
      const dx = t.left + t.width / 2 - (r.left + r.width / 2), dy = t.top - (r.top + r.height / 2);
      win.el.animate([{ transform: 'none', opacity: 1 }, { transform: `translate(${dx}px,${dy}px) scale(.15)`, opacity: 0 }], { duration: 200, easing: 'ease-in' }).onfinish = done;
    } else done();
    bus.emit('win:minimize', { winId: id, app: win.app });
  }

  function restore(id) {
    const win = wins.get(id);
    if (!win) return;
    if (win.minimized) {
      win.minimized = false;
      win.el.classList.remove('minimized');
      const r = win.el.getBoundingClientRect(), t = taskbarRect(id);
      if (t) {
        const dx = t.left + t.width / 2 - (r.left + r.width / 2), dy = t.top - (r.top + r.height / 2);
        win.el.animate([{ transform: `translate(${dx}px,${dy}px) scale(.15)`, opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 200, easing: 'ease-out' });
      }
      focus(id);
      bus.emit('win:unminimize', { winId: id, app: win.app });
      return;
    }
    if ((win.maximized || win.snapped) && !isCompact()) {
      win.maximized = false;
      win.snapped = null;
      win.el.classList.remove('maximized', 'snapped');
      if (win.prev) Object.assign(win, win.prev);
      apply(win);
      updateMaxBtn(win);
      bus.emit('win:restore', { winId: id, app: win.app });
    }
  }

  function maximize(id, silent) {
    const win = wins.get(id);
    if (!win || win.maximized) return;
    if (!win.snapped) win.prev = { x: win.x, y: win.y, w: win.w, h: win.h };
    win.snapped = null;
    win.maximized = true;
    win.el.classList.remove('snapped');
    win.el.classList.add('maximized');
    apply(win);
    updateMaxBtn(win);
    if (!silent) bus.emit('win:maximize', { winId: id, app: win.app });
  }

  function toggleMax(id) {
    const win = wins.get(id);
    if (!win || isCompact()) return;
    if (win.maximized || win.snapped) restore(id);
    else maximize(id);
  }

  function updateMaxBtn(win) {
    const b = win.el.querySelector('.win-max');
    if (!b) return;
    const max = win.maximized || win.snapped;
    b.title = max ? 'Відновити' : 'Розгорнути';
    b.setAttribute('aria-label', b.title);
    b.replaceChildren(VOS.icon(max ? 'squares' : 'square'));
  }

  async function close(id, force) {
    const win = wins.get(id);
    if (!win) return true;
    if (!force && win.beforeClose) {
      focus(id);
      const ok = await win.beforeClose(win);
      if (!ok) return false;
    }
    wins.delete(id);
    const node = win.el;
    node.style.pointerEvents = 'none';
    node.animate([{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'scale(.94)' }], { duration: 130, easing: 'ease-in' }).onfinish = () => node.remove();
    if (win.onClose) win.onClose(win);
    VOS.sound.play('close');
    bus.emit('win:close', { winId: id, app: win.app });
    focusTop();
    return true;
  }

  function snapTo(win, side, silent) {
    const { w, h } = deskRect();
    if (!win.snapped && !win.maximized) win.prev = { x: win.x, y: win.y, w: win.w, h: win.h };
    win.maximized = false;
    win.el.classList.remove('maximized');
    win.el.classList.add('snapped');
    win.snapped = side;
    win.y = 0;
    win.h = h;
    win.w = Math.round(w / 2);
    win.x = side === 'left' ? 0 : w - win.w;
    apply(win);
    updateMaxBtn(win);
    if (!silent) bus.emit('win:snap', { winId: win.id, app: win.app, side });
  }

  /* ---------- Перетягування ---------- */
  function startDrag(e, win) {
    if (e.button !== 0 || e.target.closest('.win-btn') || isCompact()) return;
    e.preventDefault();
    const bar = e.currentTarget;
    try { bar.setPointerCapture(e.pointerId); } catch (er) { /* синтетичні події */ }
    const startX = e.clientX, startY = e.clientY;
    const dr = desk.getBoundingClientRect();
    let ox = win.x, oy = win.y, moved = false, snap = null;

    const onMove = (ev) => {
      const dx = ev.clientX - startX, dy = ev.clientY - startY;
      if (!moved && Math.hypot(dx, dy) < 4) return;
      if (!moved) {
        moved = true;
        desk.classList.add('wm-busy');
        if (win.maximized || win.snapped) {
          // «Відриваємо» розгорнуте вікно під курсором, як у справжній ОС
          const prev = win.prev || { w: win.w, h: win.h };
          const ratio = (startX - dr.left - win.el.offsetLeft) / win.el.offsetWidth;
          win.maximized = false;
          win.snapped = null;
          win.el.classList.remove('maximized', 'snapped');
          win.w = prev.w; win.h = prev.h;
          ox = startX - dr.left - win.w * ratio;
          oy = 0;
          updateMaxBtn(win);
        }
      }
      const { w, h } = deskRect();
      win.x = clamp(ox + dx, -win.w + 80, w - 80);
      win.y = clamp(oy + dy, 0, h - 36);
      apply(win);
      const px = ev.clientX - dr.left, py = ev.clientY - dr.top;
      snap = win.resizable ? (py <= 4 ? 'top' : px <= 4 ? 'left' : px >= w - 5 ? 'right' : null) : null;
      showSnap(snap);
    };
    const onUp = () => {
      bar.removeEventListener('pointermove', onMove);
      bar.removeEventListener('pointerup', onUp);
      bar.removeEventListener('pointercancel', onUp);
      desk.classList.remove('wm-busy');
      showSnap(null);
      if (!moved) return;
      if (snap === 'top') maximize(win.id);
      else if (snap) snapTo(win, snap);
      else bus.emit('win:move', { winId: win.id, app: win.app });
    };
    bar.addEventListener('pointermove', onMove);
    bar.addEventListener('pointerup', onUp);
    bar.addEventListener('pointercancel', onUp);
  }

  function showSnap(side) {
    if (!side) { snapPreview.className = 'snap-preview'; return; }
    snapPreview.className = 'snap-preview show snap-' + side;
  }

  /* ---------- Зміна розміру ---------- */
  function startResize(e, win, dir) {
    if (e.button !== 0 || win.maximized || isCompact()) return;
    e.preventDefault();
    e.stopPropagation();
    const h = e.currentTarget;
    try { h.setPointerCapture(e.pointerId); } catch (er) { /* синтетичні події */ }
    const sx = e.clientX, sy = e.clientY;
    const o = { x: win.x, y: win.y, w: win.w, h: win.h };
    desk.classList.add('wm-busy');
    if (win.snapped) { win.snapped = null; win.el.classList.remove('snapped'); updateMaxBtn(win); }
    const onMove = (ev) => {
      const dx = ev.clientX - sx, dy = ev.clientY - sy;
      const { w: dw, h: dh } = deskRect();
      if (dir.includes('e')) win.w = clamp(o.w + dx, win.minW, dw - o.x);
      if (dir.includes('s')) win.h = clamp(o.h + dy, win.minH, dh - o.y);
      if (dir.includes('w')) {
        const nw = clamp(o.w - dx, win.minW, o.x + o.w);
        win.x = o.x + o.w - nw;
        win.w = nw;
      }
      if (dir.includes('n')) {
        const nh = clamp(o.h - dy, win.minH, o.y + o.h);
        win.y = o.y + o.h - nh;
        win.h = nh;
      }
      apply(win);
    };
    const onUp = () => {
      h.removeEventListener('pointermove', onMove);
      h.removeEventListener('pointerup', onUp);
      h.removeEventListener('pointercancel', onUp);
      desk.classList.remove('wm-busy');
      if (win.w !== o.w || win.h !== o.h) bus.emit('win:resize', { winId: win.id, app: win.app, w: win.w, h: win.h });
    };
    h.addEventListener('pointermove', onMove);
    h.addEventListener('pointerup', onUp);
    h.addEventListener('pointercancel', onUp);
  }

  function minimizeAll() {
    let any = false;
    for (const w of wins.values()) if (!w.minimized) { minimize(w.id); any = true; }
    return any;
  }

  /** Закриває всі вікна. Без force програми можуть спитати «Зберегти зміни?»; повертає false, якщо учень скасував. */
  async function closeAll(force) {
    for (const id of [...wins.keys()]) {
      if (!(await close(id, force))) return false;
    }
    return true;
  }

  VOS.wm = {
    init, open, close, focus, minimize, restore, maximize, toggleMax, minimizeAll, closeAll,
    get: (id) => wins.get(id),
    list: () => [...wins.values()],
    byApp: (app) => [...wins.values()].filter((w) => w.app === app),
    activeId,
  };
})();
