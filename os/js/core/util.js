/* Віконце — базові хелпери: DOM, шина подій, сховище за профілями, звуки. */
(function () {
  'use strict';
  const VOS = (window.VOS = window.VOS || {});
  const { tr, lang, locale } = VOS.i18n;

  /* ---------- DOM ---------- */
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  /** el('div.cls#id', {attrs, on:{click}}, children) */
  function el(spec, attrs, ...children) {
    const m = spec.match(/^([a-z0-9-]+)?((?:[.#][\w-]+)*)$/i);
    const node = document.createElement((m && m[1]) || 'div');
    if (m && m[2]) {
      m[2].replace(/([.#])([\w-]+)/g, (_, t, v) => {
        if (t === '.') node.classList.add(v);
        else node.id = v;
      });
    }
    if (attrs && (typeof attrs !== 'object' || attrs instanceof Node || Array.isArray(attrs))) {
      children.unshift(attrs);
      attrs = null;
    }
    if (attrs) {
      for (const [k, v] of Object.entries(attrs)) {
        if (v == null || v === false) continue;
        if (k === 'on') for (const [ev, fn] of Object.entries(v)) node.addEventListener(ev, fn);
        else if (k === 'style' && typeof v === 'object') {
          for (const [sk, sv] of Object.entries(v)) {
            if (sk.startsWith('--')) node.style.setProperty(sk, sv);
            else node.style[sk] = sv;
          }
        }
        else if (k === 'text') node.textContent = v;
        else if (k === 'html') node.innerHTML = v;
        else if (k === 'dataset') Object.assign(node.dataset, v);
        else if (k in node && typeof v !== 'string' && k !== 'list') node[k] = v;
        else node.setAttribute(k, v === true ? '' : v);
      }
    }
    for (const c of children.flat(Infinity)) {
      if (c == null || c === false) continue;
      node.append(c instanceof Node ? c : document.createTextNode(String(c)));
    }
    return node;
  }

  let uidN = 0;
  const uid = (p = 'n') => p + Date.now().toString(36) + (uidN++).toString(36) + Math.random().toString(36).slice(2, 5);

  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  function debounce(fn, ms) {
    let t;
    return (...a) => {
      clearTimeout(t);
      t = setTimeout(() => fn(...a), ms);
    };
  }

  function fmtDate(ts) {
    if (!ts) return '—';
    const d = new Date(ts);
    return d.toLocaleDateString(locale) + ' ' + d.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
  }

  function fmtSize(bytes) {
    const decimal = (value) => value.toLocaleString(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1, useGrouping: false });
    if (bytes < 1024) return bytes + tr(' Б');
    if (bytes < 1024 * 1024) return decimal(bytes / 1024) + tr(' КБ');
    if (bytes < 1024 * 1024 * 1024) return decimal(bytes / 1024 / 1024) + tr(' МБ');
    return decimal(bytes / 1024 / 1024 / 1024) + tr(' ГБ');
  }

  /** Множина залежить від мови інтерфейсу. */
  function plural(n, one, few, many) {
    if (lang === 'en') return Math.abs(n) === 1 ? one : many;
    const a = Math.abs(n) % 100, b = a % 10;
    if (a > 10 && a < 20) return many;
    if (b === 1) return one;
    if (b >= 2 && b <= 4) return few;
    return many;
  }

  const compactMQ = window.matchMedia('(max-width: 700px), (max-height: 480px)');
  const isCompact = () => compactMQ.matches;

  /* ---------- Шина подій ---------- */
  const listeners = {};
  const bus = {
    on(type, fn) {
      (listeners[type] = listeners[type] || []).push(fn);
      return () => bus.off(type, fn);
    },
    off(type, fn) {
      const l = listeners[type];
      if (l) listeners[type] = l.filter((f) => f !== fn);
    },
    emit(type, data = {}) {
      for (const fn of (listeners[type] || []).slice()) {
        try { fn(data, type); } catch (e) { console.error('[bus]', type, e); }
      }
      for (const fn of (listeners['*'] || []).slice()) {
        try { fn(data, type); } catch (e) { console.error('[bus *]', type, e); }
      }
    },
  };

  /* ---------- Сховище ---------- */
  const PREFIX = 'vikontse.';
  const temporaryProfile = new Map();
  const store = {
    profileId: null,
    temporary: false,
    rawGet(key, def) {
      try {
        const v = localStorage.getItem(PREFIX + key);
        return v == null ? def : JSON.parse(v);
      } catch (e) {
        return def;
      }
    },
    rawSet(key, value) {
      try {
        localStorage.setItem(PREFIX + key, JSON.stringify(value));
        return true;
      } catch (e) {
        console.warn('[store] не вдалося зберегти', key, e);
        bus.emit('store:full', { key });
        return false;
      }
    },
    rawRemove(key) { localStorage.removeItem(PREFIX + key); },
    canWriteProfile(id) {
      if (!id?.startsWith('classroom-')) return true;
      const classroom = store.rawGet('classroom', null);
      return classroom?.id === id && classroom.expiresAt > Date.now();
    },
    get(key, def) {
      if (store.temporary) return temporaryProfile.has(key) ? temporaryProfile.get(key) : def;
      return store.rawGet('p.' + store.profileId + '.' + key, def);
    },
    set(key, value) {
      if (store.temporary) { temporaryProfile.set(key, value); return true; }
      if (!store.canWriteProfile(store.profileId)) return false;
      return store.rawSet('p.' + store.profileId + '.' + key, value);
    },
    remove(key) {
      if (store.temporary) temporaryProfile.delete(key);
      else store.rawRemove('p.' + store.profileId + '.' + key);
    },
    removeProfileData(id) {
      Object.keys(localStorage)
        .filter((k) => k.startsWith(PREFIX + 'p.' + id + '.'))
        .forEach((k) => localStorage.removeItem(k));
    },
    usedBytes() {
      let n = 0;
      for (const k of Object.keys(localStorage)) if (k.startsWith(PREFIX)) n += (k.length + localStorage.getItem(k).length) * 2;
      return n;
    },
  };

  /* ---------- Звуки (WebAudio, без файлів) ---------- */
  let actx = null;
  function tone(freq, dur = 0.12, type = 'sine', vol = 0.08, delay = 0) {
    try {
      actx = actx || new (window.AudioContext || window.webkitAudioContext)();
      const t0 = actx.currentTime + delay;
      const o = actx.createOscillator(), g = actx.createGain();
      o.type = type;
      o.frequency.setValueAtTime(freq, t0);
      g.gain.setValueAtTime(0, t0);
      g.gain.linearRampToValueAtTime(vol, t0 + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      o.connect(g).connect(actx.destination);
      o.start(t0);
      o.stop(t0 + dur + 0.02);
    } catch (e) { /* без звуку */ }
  }
  const sound = {
    play(name) {
      if (!VOS.settings || !VOS.settings.get('sounds')) return;
      switch (name) {
        case 'click': tone(660, 0.05, 'triangle', 0.04); break;
        case 'open': tone(520, 0.08, 'sine', 0.05); tone(780, 0.1, 'sine', 0.05, 0.06); break;
        case 'close': tone(600, 0.07, 'sine', 0.04); tone(400, 0.09, 'sine', 0.04, 0.05); break;
        case 'trash': tone(300, 0.12, 'triangle', 0.06); tone(200, 0.15, 'triangle', 0.05, 0.08); break;
        case 'error': tone(220, 0.2, 'square', 0.04); break;
        case 'step': tone(660, 0.1); tone(880, 0.14, 'sine', 0.08, 0.09); break;
        case 'win': [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.18, 'triangle', 0.07, i * 0.11)); break;
        case 'boot': [392, 523, 659, 784].forEach((f, i) => tone(f, 0.25, 'sine', 0.05, i * 0.15)); break;
      }
    },
  };

  /* ---------- Налаштування профілю ---------- */
  const DEFAULT_SETTINGS = {
    wallpaper: 'dawn',
    theme: 'light',
    iconSize: 'm',
    singleClick: false,
    showExt: false, // позначка з типом файла (.txt, .png) на значках
    sounds: true,
    helperAuto: false, // Совеня не відкривається сам: учень спершу досліджує вільно
  };
  const settings = {
    data: { ...DEFAULT_SETTINGS },
    load() { settings.data = { ...DEFAULT_SETTINGS, ...store.get('settings', {}) }; },
    get(k) { return settings.data[k]; },
    set(k, v) {
      settings.data[k] = v;
      store.set('settings', settings.data);
      bus.emit('settings:' + k, { value: v });
      bus.emit('settings:change', { key: k, value: v });
    },
  };

  Object.assign(VOS, { $, $$, el, uid, clamp, debounce, fmtDate, fmtSize, plural, isCompact, compactMQ, bus, store, sound, settings });
})();
