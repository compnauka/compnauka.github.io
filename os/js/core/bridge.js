/* Віконце — міст між програмами сайту у вікнах (iframe) і файлами Віконця:
   «Зберегти» у Друкарику чи Пензлику кладе файл у Віконце, а «Відкрити» бере файл з Віконця —
   замість справжнього комп'ютера. Ставиться на кожне завантаження сторінки у вікні. */
(function () {
  'use strict';
  const VOS = window.VOS;
  const { fs, bus } = VOS;

  const TEXT = ['txt', 'csv', 'html'];
  const IMG = ['png', 'jpg', 'jpeg'];
  const ALL = TEXT.concat(IMG);
  const MIME_BY_EXT = { txt: 'text/plain', csv: 'text/csv', html: 'text/html', png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg' };
  const EXT_BY_MIME = { 'text/plain': 'txt', 'text/csv': 'csv', 'text/html': 'html', 'image/png': 'png', 'image/jpeg': 'jpg' };
  const isImgExt = (e) => IMG.includes(e);

  let busy = false; // одне вікно вибору за раз

  const mimeOf = (type) => String(type || '').split(';')[0].trim().toLowerCase();

  function safeName(name) {
    let n = String(name || '').replace(/[\\/:*?"<>|]/g, '_').replace(/\s+/g, ' ').trim();
    if (!n || /^\.+$/.test(n)) n = 'Мій файл';
    if (n.length > 60) {
      const e = fs.ext(n);
      n = e && e.length < 40 ? fs.baseName(n).slice(0, 59 - e.length).trimEnd() + '.' + e : n.slice(0, 60).trimEnd();
    }
    return n;
  }

  /** Вид файла за назвою та типом вмісту → розширення або '' (тоді не чіпаємо). */
  function extFor(name, mime) {
    const e = fs.ext(name || '');
    if (ALL.includes(e)) return e;
    if (e) return '';
    return EXT_BY_MIME[mime] || '';
  }

  function dataMime(href) {
    const m = /^data:([^;,]*)/i.exec(href);
    return m ? mimeOf(m[1]) : '';
  }

  function blobToDataUrl(blob) {
    return new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(r.result);
      r.onerror = () => reject(r.error);
      r.readAsDataURL(blob);
    });
  }

  function dataUrlToBytes(url) {
    const i = url.indexOf(',');
    const head = url.slice(0, i);
    const body = url.slice(i + 1);
    if (/;base64/i.test(head)) {
      const bin = atob(body);
      const out = new Uint8Array(bin.length);
      for (let k = 0; k < bin.length; k++) out[k] = bin.charCodeAt(k);
      return out;
    }
    return new TextEncoder().encode(decodeURIComponent(body));
  }

  /* ---------- Збереження: програма → Віконце ---------- */
  async function saveToVos(win, blob, rawName, ext) {
    let name = safeName(rawName);
    if (fs.ext(name) !== ext) name = safeName(name + '.' + ext);
    let content;
    if (TEXT.includes(ext)) {
      content = await blob.text();
      content = content.replace(/^﻿/, '');
      if (ext === 'txt') content = content.replace(/\r\n?/g, '\n');
    } else {
      const typed = mimeOf(blob.type) === MIME_BY_EXT[ext] ? blob : new Blob([blob], { type: MIME_BY_EXT[ext] });
      content = await blobToDataUrl(typed);
    }
    const r = await VOS.dialog.saveAs({ ext, name, folder: isImgExt(ext) ? 'pics' : 'docs', title: 'Зберегти у Віконці' });
    if (!r) return false;
    let node;
    try {
      node = r.replaceId ? fs.write(r.replaceId, content) : fs.createFile(r.folder, r.name, content);
    } catch (e) { VOS.dialog.error(e.message); return false; }
    try { await fs.flush(); }
    catch (e) { VOS.dialog.error('Не вдалося зберегти файл. Перевір вільне місце й спробуй ще раз.'); return false; }
    VOS.toast('Збережено у Віконці: ' + node.name, 'save');
    bus.emit('app:save', { node, app: win.app });
    return true;
  }

  async function handleDownload(win, ctx, a, name, ext) {
    if (busy) return;
    busy = true;
    try {
      const href = a.href;
      let blob = ctx.blobs.get(href);
      if (!blob) {
        const res = await (href.startsWith('blob:') ? ctx.win.fetch(href) : fetch(href));
        blob = await res.blob();
      }
      await saveToVos(win, blob, name, ext);
    } catch (e) {
      console.error(e);
      VOS.dialog.error('Не вдалося зберегти файл. Спробуй ще раз.');
    } finally { busy = false; }
  }

  /** Повертає розширення, якщо це завантаження ми беремо на себе; інакше ''. */
  function downloadExt(ctx, a) {
    if (!a || !a.hasAttribute || !a.hasAttribute('download')) return '';
    const href = a.href || '';
    const name = a.getAttribute('download') || '';
    if (/^data:/i.test(href)) return extFor(name, dataMime(href));
    if (/^blob:/i.test(href)) {
      const b = ctx.blobs.get(href);
      return extFor(name, b ? mimeOf(b.type) : '');
    }
    try {
      const u = new URL(href, ctx.win.location.href);
      if (u.origin === ctx.win.location.origin && /^https?:$/.test(u.protocol)) {
        return ALL.includes(fs.ext(name)) ? fs.ext(name) : '';
      }
    } catch (e) { /* */ }
    return '';
  }

  /* ---------- Відкриття: Віконце → програма ---------- */
  function extsFromAccept(accept) {
    const tokens = String(accept || '').split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);
    if (!tokens.length) return ALL.slice();
    const out = new Set();
    for (const t of tokens) {
      if (t === 'image/*') IMG.forEach((e) => out.add(e));
      else if (t === 'text/*') TEXT.forEach((e) => out.add(e));
      else if (t.startsWith('.')) { if (ALL.includes(t.slice(1))) out.add(t.slice(1)); }
      else if (t === 'image/jpeg') { out.add('jpg'); out.add('jpeg'); }
      else if (EXT_BY_MIME[t]) out.add(EXT_BY_MIME[t]);
    }
    return [...out];
  }

  function fileFromNode(ctx, node) {
    const e = fs.ext(node.name);
    const c = node.content || '';
    if (isImgExt(e)) {
      if (!c.startsWith('data:')) return null;
      return new ctx.win.File([dataUrlToBytes(c)], node.name, { type: MIME_BY_EXT[e] });
    }
    return new ctx.win.File([c], node.name, { type: MIME_BY_EXT[e] || 'text/plain' });
  }

  function putFile(ctx, input, node) {
    const file = fileFromNode(ctx, node);
    if (!file) { VOS.dialog.error('Цей малюнок не вдалося відкрити.'); return false; }
    const dt = new ctx.win.DataTransfer();
    dt.items.add(file);
    input.files = dt.files;
    input.dispatchEvent(new ctx.win.Event('input', { bubbles: true }));
    input.dispatchEvent(new ctx.win.Event('change', { bubbles: true }));
    return true;
  }

  async function handleOpen(ctx, input, exts) {
    if (busy) return;
    busy = true;
    try {
      const id = await VOS.dialog.openFile({ exts, folder: exts.every(isImgExt) ? 'pics' : 'docs', title: 'Відкрити з Віконця' });
      if (!id) return;
      const node = fs.get(id);
      if (node && node.type === 'file') putFile(ctx, input, node);
    } catch (e) {
      console.error(e);
      VOS.dialog.error('Не вдалося відкрити файл. Спробуй ще раз.');
    } finally { busy = false; }
  }

  const isFileInput = (n) => !!n && n.tagName === 'INPUT' && (n.type || '').toLowerCase() === 'file';
  const openExts = (input) => {
    const accept = input.getAttribute('accept');
    const exts = extsFromAccept(accept);
    return accept && !exts.length ? null : exts; // null — незнайомий тип, лишаємо браузеру
  };

  /* ---------- Встановлення на сторінку у вікні ---------- */
  function install(frame, win) {
    win._bridgeReady = false;
    let fw, doc;
    try { fw = frame.contentWindow; doc = frame.contentDocument; } catch (e) { return; }
    if (!fw || !doc || fw.__vosBridge) return;
    fw.__vosBridge = true;
    const ctx = { win: fw, blobs: new Map() };

    const origCreate = fw.URL.createObjectURL;
    fw.URL.createObjectURL = function (obj) {
      const url = origCreate.apply(this, arguments);
      try { if (obj && typeof obj.size === 'number') ctx.blobs.set(url, obj); } catch (e) { /* */ }
      return url;
    };

    const A = fw.HTMLAnchorElement.prototype;
    const origAClick = A.click;
    A.click = function () {
      const ext = downloadExt(ctx, this);
      if (ext) { handleDownload(win, ctx, this, this.getAttribute('download') || '', ext); return; }
      return origAClick.apply(this, arguments);
    };

    const I = fw.HTMLInputElement.prototype;
    const origIClick = I.click;
    I.click = function () {
      if (isFileInput(this) && !this.disabled) {
        const exts = openExts(this);
        if (exts) { handleOpen(ctx, this, exts); return; }
      }
      return origIClick.apply(this, arguments);
    };
    if (I.showPicker) {
      const origPicker = I.showPicker;
      I.showPicker = function () {
        if (isFileInput(this) && !this.disabled) {
          const exts = openExts(this);
          if (exts) { handleOpen(ctx, this, exts); return; }
        }
        return origPicker.apply(this, arguments);
      };
    }

    // справжні клацання (посилання, кнопка «Вибрати файл», підпис-label)
    doc.addEventListener('click', (e) => {
      if (e.defaultPrevented) return;
      const t = e.target;
      if (!t || !t.closest) return;
      const a = t.closest('a[download]');
      if (a) {
        const ext = downloadExt(ctx, a);
        if (ext) {
          e.preventDefault();
          e.stopImmediatePropagation();
          handleDownload(win, ctx, a, a.getAttribute('download') || '', ext);
        }
        return;
      }
      if (isFileInput(t) && !t.disabled) {
        const exts = openExts(t);
        if (exts) {
          e.preventDefault();
          e.stopImmediatePropagation();
          handleOpen(ctx, t, exts);
        }
      }
    }, true);

    win._bridgeCtx = ctx;
    win._bridgeReady = true;
    if (win._pendingFile) {
      const id = win._pendingFile;
      win._pendingFile = null;
      setTimeout(() => feedNow(win, id), 200);
    }
  }

  /* ---------- Двічі клацнули файл у Віконці → відкрити в програмі сайту ---------- */
  function feedNow(win, fileId) {
    const node = fs.get(fileId);
    const ctx = win._bridgeCtx;
    if (!node || !ctx) return;
    let doc;
    try { doc = win.frame.contentDocument; } catch (e) { return; }
    const e = fs.ext(node.name);
    const input = [...doc.querySelectorAll('input[type=file]')].find((i) => extsFromAccept(i.getAttribute('accept')).includes(e));
    if (input) putFile(ctx, input, node);
  }

  function feed(win, fileId) {
    if (!win || !win.frame) return;
    if (win._bridgeReady) feedNow(win, fileId);
    else win._pendingFile = fileId;
  }

  VOS.bridge = { install, feed };
})();
