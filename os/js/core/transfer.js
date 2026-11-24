/* Віконце — перенесення файлів між Віконцем і справжнім комп'ютером:
   завантаження файлу чи папки (.zip) на комп'ютер, додавання файлів з комп'ютера
   (кнопка, перетягування з робочого столу ОС, архіви .zip), резервна копія всіх робіт. */
(function () {
  'use strict';
  const VOS = window.VOS;
  const { fs, bus, uid } = VOS;

  const MAX_FILE = 8 * 1024 * 1024; // 8 МБ на один файл
  const MAX_ARCHIVE_CONTENT = 24 * 1024 * 1024;
  const MAX_ARCHIVE_ENTRIES = 1000;
  const MAX_ARCHIVE_FILE = MAX_ARCHIVE_CONTENT + 1024 * 1024;
  const BACKUP_ROOTS = new Map([['робочий стіл', 'desktop'], ['документи', 'docs'], ['малюнки', 'pics'], ["комп'ютер", 'root']]);
  const MAX_IMG_SIDE = 1600; // великі фото зменшуємо, щоб не забивати пам'ять
  const TEXT_EXT = ['txt', 'csv', 'html'];
  const IMG_EXT = ['png', 'jpg', 'jpeg'];
  const IMG_MIME = { png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg' };

  /* ---------- CRC32 ---------- */
  const CRC_TABLE = (() => {
    const t = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      t[n] = c >>> 0;
    }
    return t;
  })();
  function crc32(bytes) {
    let c = 0xffffffff;
    for (let i = 0; i < bytes.length; i++) c = CRC_TABLE[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
    return (c ^ 0xffffffff) >>> 0;
  }

  /* ---------- ZIP: запис (без стиснення) ---------- */
  function dosTime(d) {
    return {
      time: (d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1),
      date: ((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate(),
    };
  }

  /** entries: [{ path: 'Папка/файл.txt', data: Uint8Array | null (папка), date }] */
  function zipParts(entries) {
    const enc = new TextEncoder();
    const parts = [], central = [];
    let offset = 0;
    for (const e of entries) {
      const name = enc.encode(e.path);
      const data = e.data || new Uint8Array(0);
      const crc = e.data ? crc32(data) : 0;
      const { time, date } = dosTime(e.date || new Date());
      const lh = new DataView(new ArrayBuffer(30));
      lh.setUint32(0, 0x04034b50, true); lh.setUint16(4, 20, true); lh.setUint16(6, 0x0800, true); // UTF-8 імена
      lh.setUint16(8, 0, true); lh.setUint16(10, time, true); lh.setUint16(12, date, true);
      lh.setUint32(14, crc, true); lh.setUint32(18, data.length, true); lh.setUint32(22, data.length, true);
      lh.setUint16(26, name.length, true); lh.setUint16(28, 0, true);
      parts.push(lh.buffer, name, data);
      const ch = new DataView(new ArrayBuffer(46));
      ch.setUint32(0, 0x02014b50, true); ch.setUint16(4, 20, true); ch.setUint16(6, 20, true); ch.setUint16(8, 0x0800, true);
      ch.setUint16(10, 0, true); ch.setUint16(12, time, true); ch.setUint16(14, date, true);
      ch.setUint32(16, crc, true); ch.setUint32(20, data.length, true); ch.setUint32(24, data.length, true);
      ch.setUint16(28, name.length, true); ch.setUint32(38, e.data ? 0 : 0x10, true); ch.setUint32(42, offset, true);
      central.push(ch.buffer, name);
      offset += 30 + name.length + data.length;
    }
    const cdSize = central.reduce((s, p) => s + (p.byteLength || p.length), 0);
    const end = new DataView(new ArrayBuffer(22));
    end.setUint32(0, 0x06054b50, true);
    end.setUint16(8, entries.length, true); end.setUint16(10, entries.length, true);
    end.setUint32(12, cdSize, true); end.setUint32(16, offset, true);
    return [...parts, ...central, end.buffer];
  }

  function makeZip(entries) {
    return new Blob(zipParts(entries), { type: 'application/zip' });
  }

  function createPracticeZip(parent, name, entries) {
    const enc = new TextEncoder();
    const archive = zipParts(entries.map(({ path, content, bytes }) => ({ path, data: bytes || enc.encode(content || '') })));
    const bytes = new Uint8Array(archive.reduce((sum, part) => sum + part.byteLength, 0));
    let offset = 0;
    for (const part of archive) {
      const chunk = part instanceof Uint8Array ? part : new Uint8Array(part);
      bytes.set(chunk, offset);
      offset += chunk.length;
    }
    return fs.createFile(parent, fs.ext(name) === 'zip' ? name : name + '.zip', zipDataUrl(bytes));
  }

  /* ---------- ZIP: читання ---------- */
  async function inflateRaw(bytes, limit) {
    if (typeof DecompressionStream === 'undefined') throw new Error('Цей браузер не вміє розпаковувати архіви. Онови браузер або розпакуй архів на комп\'ютері.');
    const reader = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate-raw')).getReader();
    const data = new Uint8Array(limit);
    let offset = 0;
    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) return data.subarray(0, offset);
        if (offset + value.byteLength > limit) {
          await reader.cancel();
          throw new Error('Після розпакування архів завеликий або пошкоджений.');
        }
        data.set(value, offset);
        offset += value.byteLength;
      }
    } finally { reader.releaseLock(); }
  }
  function decodeName(bytes, utf8) {
    if (utf8) return new TextDecoder('utf-8').decode(bytes);
    try { return new TextDecoder('utf-8', { fatal: true }).decode(bytes); } catch (e) { /* не UTF-8 */ }
    try { return new TextDecoder('ibm866').decode(bytes); } catch (e) { return new TextDecoder('latin1').decode(bytes); } // архіви Windows з кирилицею
  }
  /** → [{ path, dir, data: Uint8Array }] */
  async function readZip(buf) {
    const b = new Uint8Array(buf), dv = new DataView(b.buffer, b.byteOffset, b.byteLength);
    let eocd = -1;
    for (let i = b.length - 22; i >= Math.max(0, b.length - 65557); i--) {
      if (dv.getUint32(i, true) === 0x06054b50 && i + 22 + dv.getUint16(i + 20, true) === b.length) { eocd = i; break; }
    }
    if (eocd < 0) throw new Error('Цей архів пошкоджений або це не .zip.');
    const count = dv.getUint16(eocd + 10, true);
    if (count > MAX_ARCHIVE_ENTRIES) throw new Error('У цьому архіві забагато файлів.');
    let p = dv.getUint32(eocd + 16, true);
    let totalSize = 0;
    const out = [];
    for (let k = 0; k < count; k++) {
      if (p + 46 > eocd || dv.getUint32(p, true) !== 0x02014b50) throw new Error('Цей архів пошкоджений.');
      const flags = dv.getUint16(p + 8, true), method = dv.getUint16(p + 10, true);
      const crc = dv.getUint32(p + 16, true), csize = dv.getUint32(p + 20, true), size = dv.getUint32(p + 24, true);
      const nlen = dv.getUint16(p + 28, true), elen = dv.getUint16(p + 30, true), clen = dv.getUint16(p + 32, true);
      const lho = dv.getUint32(p + 42, true);
      if (p + 46 + nlen + elen + clen > eocd) throw new Error('Цей архів пошкоджений.');
      const path = decodeName(b.subarray(p + 46, p + 46 + nlen), flags & 0x0800).replace(/\\/g, '/');
      p += 46 + nlen + elen + clen;
      if (flags & 1) throw new Error('Архів захищено паролем — Віконце не може його відкрити.');
      const dir = path.endsWith('/');
      if (dir) { out.push({ path, dir: true }); continue; }
      totalSize += size;
      if (totalSize > MAX_ARCHIVE_CONTENT) throw new Error('Після розпакування архів займає більше 24 МБ.');
      if (lho + 30 > b.length || dv.getUint32(lho, true) !== 0x04034b50) throw new Error('Цей архів пошкоджений.');
      const ln = dv.getUint16(lho + 26, true), le = dv.getUint16(lho + 28, true);
      const start = lho + 30 + ln + le;
      if (start + csize > b.length) throw new Error('Цей архів пошкоджений.');
      const raw = b.subarray(start, start + csize);
      let data;
      if (method === 0) data = raw;
      else if (method === 8) data = await inflateRaw(raw, size);
      else throw new Error('Віконце не підтримує цей спосіб стиснення ZIP.');
      if (data.byteLength !== size || crc32(data) !== crc) throw new Error('Деякі файли в архіві пошкоджено.');
      out.push({ path, dir: false, data });
    }
    return out;
  }

  /* ---------- Допоміжне ---------- */
  function dataUrlToBytes(url) {
    const i = url.indexOf(',');
    const bin = atob(url.slice(i + 1));
    const out = new Uint8Array(bin.length);
    for (let k = 0; k < bin.length; k++) out[k] = bin.charCodeAt(k);
    return out;
  }

  function zipDataUrl(bytes) {
    const chunks = [];
    for (let offset = 0; offset < bytes.length; offset += 16384) chunks.push(String.fromCharCode(...bytes.subarray(offset, offset + 16384)));
    return 'data:application/zip;base64,' + btoa(chunks.join(''));
  }
  function bytesToDataUrl(bytes, mime) {
    return new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(r.result);
      r.onerror = () => reject(r.error);
      r.readAsDataURL(new Blob([bytes], { type: mime }));
    });
  }
  /** Великі фото зменшуємо до MAX_IMG_SIDE, щоб кожне займало менше місця. */
  function shrinkImage(dataUrl, ext) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const k = Math.min(1, MAX_IMG_SIDE / Math.max(img.width, img.height));
        if (k >= 1) { resolve(dataUrl); return; }
        const c = document.createElement('canvas');
        c.width = Math.max(1, Math.round(img.width * k)); c.height = Math.max(1, Math.round(img.height * k));
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        resolve(c.toDataURL(ext === 'png' ? 'image/png' : 'image/jpeg', 0.88));
      };
      img.onerror = () => resolve(null);
      img.src = dataUrl;
    });
  }
  /** Назва файлу з комп'ютера → дозволена у Віконці */
  function safeName(name) {
    let n = String(name).replace(/[\\/:*?"<>|]/g, '_').replace(/\s+/g, ' ').trim();
    if (!n || /^\.+$/.test(n)) n = 'Файл';
    if (n.length > 60) {
      const e = fs.ext(n);
      n = e && e.length < 58 ? fs.baseName(n).slice(0, 59 - e.length).trimEnd() + '.' + e : n.slice(0, 60).trimEnd();
    }
    return n;
  }

  function downloadBlob(blob, name) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  }

  function fileBytes(n) {
    const c = n.content || '';
    return !TEXT_EXT.includes(fs.ext(n.name)) && c.startsWith('data:') ? dataUrlToBytes(c) : new TextEncoder().encode(c);
  }
  function fileMime(n) {
    const e = fs.ext(n.name);
    return IMG_MIME[e] || (e === 'zip' ? 'application/zip' : e === 'csv' ? 'text/csv;charset=utf-8' : e === 'html' ? 'text/html;charset=utf-8' : 'text/plain;charset=utf-8');
  }

  /** Збирає вміст папки для архіву. Ярлики пропускаємо, їхні цілі лишаються окремими об’єктами. */
  function collect(id, prefix, out, skipSpecial = false) {
    for (const c of fs.children(id)) {
      if (c.type === 'link' || (skipSpecial && fs.isSpecialFolder(c.id))) continue;
      const path = prefix + c.name;
      if (c.type === 'folder') { out.push({ path: path + '/', data: null, date: new Date(c.modified || Date.now()) }); collect(c.id, path + '/', out); }
      else out.push({ path, data: fileBytes(c), date: new Date(c.modified || Date.now()) });
    }
    return out;
  }

  /* ---------- Завантаження на комп'ютер ---------- */
  function exportNode(id) {
    const n = fs.get(id);
    if (!n) return;
    if (n.type === 'link') { VOS.dialog.alert('Ярлик веде до оригіналу. Щоб забрати роботу, завантаж сам файл або папку.', { title: 'Ярлик', icon: 'link' }); return; }
    if (n.type === 'file') {
      // Текст зберігаємо з BOM, щоб Блокнот Windows точно показав кирилицю
      const blob = TEXT_EXT.includes(fs.ext(n.name)) ? new Blob(['﻿', n.content || ''], { type: 'text/plain;charset=utf-8' }) : new Blob([fileBytes(n)], { type: fileMime(n) });
      downloadBlob(blob, n.name);
    } else {
      const entries = collect(id, '', []);
      if (!entries.length) { VOS.dialog.alert('Папка «' + n.name + '» порожня — завантажувати нічого.', { title: 'Порожня папка', icon: 'folder' }); return; }
      downloadBlob(makeZip(entries), n.name + '.zip');
    }
    VOS.toast('Завантажено на комп\'ютер: ' + n.name + (n.type === 'folder' ? '.zip' : ''), 'download');
    bus.emit('fs:export', { node: n });
  }

  /** Резервна копія всіх робіт профілю: Робочий стіл, Документи, Малюнки. */
  function exportAll() {
    const entries = [];
    for (const id of ['desktop', 'docs', 'pics']) {
      const f = fs.get(id);
      entries.push({ path: f.name + '/', data: null });
      collect(id, f.name + '/', entries);
    }
    collect('root', fs.get('root').name + '/', entries, true);
    const p = VOS.session.profile;
    const d = new Date();
    const stamp = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    downloadBlob(makeZip(entries), safeName('Віконце — ' + p.name + ' — ' + stamp + '.zip'));
    VOS.toast('Копію всіх робіт завантажено', 'save');
    bus.emit('fs:export-all', {});
  }

  /* ---------- Додавання з комп'ютера ---------- */
  function now() { return Date.now(); }

  /** Знаходить або створює підпапку за назвою (для структури архіву). */
  function folderFor(parent, name, created) {
    const ex = fs.findByName(parent, name) || created.find((n) => n.parent === parent && n.type === 'folder' && n.name.toLocaleLowerCase('uk') === name.toLocaleLowerCase('uk'));
    if (ex && ex.type === 'folder') return ex.id;
    const n = { id: uid('f'), type: 'folder', name: uniqueAmong(parent, name, created), parent, created: now(), modified: now() };
    created.push(n);
    return n.id;
  }
  function uniqueAmong(parent, name, created) {
    const taken = (cand) => fs.nameExists(parent, cand) || created.some((n) => n.parent === parent && n.name.toLocaleLowerCase('uk') === cand.toLocaleLowerCase('uk'));
    if (!taken(name)) return name;
    const e = fs.ext(name), b = fs.baseName(name);
    for (let i = 2; i < 999; i++) { const c = b + ' (' + i + ')' + (e ? '.' + e : ''); if (!taken(c)) return c; }
    return b + ' ' + uid('') + (e ? '.' + e : '');
  }

  async function fileNode(parent, name, bytes, created, skipped, restore) {
    name = safeName(name);
    const e = fs.ext(name);
    let content;
    if (TEXT_EXT.includes(e)) {
      content = new TextDecoder('utf-8').decode(bytes).replace(/^﻿/, '').replace(/\r\n?/g, '\n');
    } else if (IMG_EXT.includes(e)) {
      const url = await bytesToDataUrl(bytes, IMG_MIME[e]);
      content = await shrinkImage(url, e);
      if (!content) { skipped.push(name + ' (пошкоджене зображення)'); return; }
    } else if (e === 'zip') {
      content = zipDataUrl(bytes);
    } else {
      skipped.push(name);
      return;
    }
    // Відновлення з копії: такий самий файл уже є — не плодимо дублікат «(2)»
    if (restore) {
      const ex = fs.findByName(parent, name);
      if (ex && ex.type === 'file' && ex.content === content) return;
    }
    created.push({ id: uid('f'), type: 'file', name: uniqueAmong(parent, name, created), parent, content, created: now(), modified: now() });
  }

  async function appendArchiveEntries(entries, base, created, skipped, roots) {
    const folders = new Map();
    for (const entry of entries) {
      const segs = entry.path.replace(/\/$/, '').split('/');
      if (segs.some((s) => !s || s === '.' || s === '..') || /^(__MACOSX|\.)/.test(segs[0])) continue;
      if (segs.length > 30) { skipped.push(entry.path); continue; }
      let parent = roots ? roots.get(segs[0].toLocaleLowerCase('uk')) : base;
      if (!parent || (roots && segs.length === 1)) continue;
      const last = entry.dir ? segs.length : segs.length - 1;
      for (let i = roots ? 1 : 0; i < last; i++) {
        const name = safeName(segs[i]);
        const key = parent + '/' + name.toLocaleLowerCase('uk');
        if (!folders.has(key)) folders.set(key, folderFor(parent, name, created));
        parent = folders.get(key);
      }
      if (!entry.dir) await fileNode(parent, segs.at(-1), entry.data, created, skipped, !!roots);
    }
  }

  const extracting = new Set();
  async function extractZip(fileId) {
    const archive = fs.get(fileId);
    if (!archive || archive.type !== 'file' || fs.ext(archive.name) !== 'zip' || fs.isInTrash(fileId) || extracting.has(fileId)) return null;
    extracting.add(fileId);
    try {
      const bytes = fileBytes(archive);
      const created = [], skipped = [];
      const name = safeName(fs.baseName(archive.name));
      const folder = { id: uid('f'), type: 'folder', name, created: now(), modified: now() };
      await appendArchiveEntries(await readZip(bytes), folder.id, created, skipped, null);
      const latest = fs.get(fileId);
      if (latest !== archive || !fs.get(archive.parent) || fs.isInTrash(fileId)) return null;
      if (!created.length && skipped.length) throw new Error('Немає файлів, які Віконце може відкрити: ' + skipped.slice(0, 4).join(', '));
      folder.parent = archive.parent;
      folder.name = fs.uniqueName(folder.parent, name);
      fs.addNodes([folder, ...created]);
      VOS.toast('Розпаковано в папку «' + folder.name + '».', 'archive');
      bus.emit('fs:extract', { fileId, folderId: folder.id });
      if (skipped.length) VOS.dialog.alert('Пропущено: ' + skipped.slice(0, 8).join(', '), { title: 'Розпаковано частково', icon: 'archive' });
      return folder;
    } catch (error) {
      VOS.dialog.error(error.message);
      return null;
    } finally {
      extracting.delete(fileId);
    }
  }

  /** files: FileList | File[]; target: id папки. Повертає кількість доданих файлів. */
  async function importFiles(files, target, { restore = false, keepArchive = false } = {}) {
    target = target && fs.get(target) && fs.get(target).type === 'folder' && !fs.isInTrash(target) && target !== 'trash' ? target : 'docs';
    if (target === 'root') target = 'docs';
    const profileRoot = fs.get('root');
    const created = [], skipped = [], tooBig = [];
    for (const f of Array.from(files)) {
      const e = fs.ext(f.name);
      const limit = e === 'zip' && !keepArchive ? MAX_ARCHIVE_FILE : MAX_FILE;
      if (f.size > limit) { tooBig.push(f.name + ' (ліміт ' + (limit / 1024 / 1024) + ' МБ)'); continue; }
      try {
        const bytes = new Uint8Array(await f.arrayBuffer());
        if (e === 'zip' && !keepArchive) {
          // Архів розпаковуємо в папку з його назвою. Резервна копія Віконця (Робочий стіл/Документи/Малюнки)
          // у «Моєму комп'ютері» відновлюється в системні папки.
          const entries = await readZip(bytes);
          const isBackup = restore && target === 'docs' && entries.length && entries.every((x) => BACKUP_ROOTS.has(x.path.split('/')[0].toLocaleLowerCase('uk')));
          const base = isBackup ? null : folderFor(target, safeName(fs.baseName(f.name)), created);
          await appendArchiveEntries(entries, base, created, skipped, isBackup ? BACKUP_ROOTS : null);
        } else {
          await fileNode(target, f.name, bytes, created, skipped, restore);
        }
      } catch (err) {
        console.error(err);
        skipped.push(f.name + (err && err.message ? ' — ' + err.message : ''));
      }
    }
    if (profileRoot !== fs.get('root') || !fs.get(target) || fs.isInTrash(target)) return 0;
    const ready = [];
    const folders = new Set();
    for (const node of created) {
      if (!folders.has(node.parent) && (!fs.get(node.parent) || fs.isInTrash(node.parent))) continue;
      node.name = uniqueAmong(node.parent, node.name, ready);
      ready.push(node);
      if (node.type === 'folder') folders.add(node.id);
    }
    if (ready.length) {
      try { fs.addNodes(ready); } catch (err) { VOS.dialog.error(err.message); return 0; }
    }
    const added = ready.filter((n) => n.type === 'file').length;
    if (added) {
      VOS.toast('Додано ' + added + ' ' + VOS.plural(added, 'файл', 'файли', 'файлів') + ' у «' + fs.get(target).name + '»', 'upload');
      bus.emit('fs:import', { count: added, folder: target });
    }
    const notes = [];
    if (tooBig.length) notes.push('Завеликі файли: ' + tooBig.join(', '));
    if (skipped.length) notes.push('Віконце відкриває тексти (.txt), малюнки (.png, .jpg) й архіви (.zip). Пропущено: ' + skipped.slice(0, 8).join(', ') + (skipped.length > 8 ? ' та ще ' + (skipped.length - 8) : ''));
    if (notes.length) VOS.dialog.alert(notes.join('\n\n'), { title: added ? 'Додано не все' : 'Нічого не додано', icon: 'upload' });
    return added;
  }
  /** Відкриває вікно вибору файлів браузера. */
  function pickAndImport(target, opts = {}) {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.accept = opts.accept || (opts.keepArchive ? '.zip,application/zip' : '.txt,.png,.jpg,.jpeg,.zip,text/plain,image/png,image/jpeg,application/zip');
    input.style.display = 'none';
    input.addEventListener('change', async () => {
      if (input.files && input.files.length) await importFiles(input.files, opts.restore ? 'docs' : target, opts);
      input.remove();
    });
    input.addEventListener('cancel', () => input.remove());
    document.body.append(input);
    input.click();
  }

  /** Перетягування файлів зі справжнього робочого столу у вікно Віконця. */
  function bindDrop(el, targetFn) {
    const hasFiles = (e) => e.dataTransfer && Array.from(e.dataTransfer.types || []).includes('Files');
    let depth = 0;
    el.addEventListener('dragenter', (e) => { if (!hasFiles(e)) return; e.preventDefault(); depth++; el.classList.add('file-drop'); });
    el.addEventListener('dragover', (e) => { if (!hasFiles(e)) return; e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; });
    el.addEventListener('dragleave', () => { depth = Math.max(0, depth - 1); if (!depth) el.classList.remove('file-drop'); });
    el.addEventListener('drop', (e) => {
      if (!hasFiles(e)) return;
      e.preventDefault();
      e.stopPropagation();
      depth = 0;
      el.classList.remove('file-drop');
      // кинули на значок папки — туди, інакше в поточну папку
      const it = e.target.closest && e.target.closest('.item[data-drop]');
      const target = it && it.dataset.drop !== 'trash' ? it.dataset.drop : targetFn();
      importFiles(e.dataTransfer.files, target);
    });
  }
  // Файл, кинутий повз вікна, не повинен відкриватися браузером замість Віконця
  window.addEventListener('dragover', (e) => { if (e.dataTransfer && Array.from(e.dataTransfer.types || []).includes('Files')) e.preventDefault(); });
  window.addEventListener('drop', (e) => { if (e.dataTransfer && Array.from(e.dataTransfer.types || []).includes('Files')) e.preventDefault(); });

  VOS.transfer = { exportNode, exportAll, importFiles, pickAndImport, bindDrop, createPracticeZip, extractZip, makeZip, readZip, crc32 };
})();
