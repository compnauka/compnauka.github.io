/* Віконце — Фото (перегляд та редагування малюнків). */
(function () {
  'use strict';
  const VOS = window.VOS;
  const { tr } = VOS.i18n;
  const { el, fs, bus } = VOS;
  const isImg = (n) => n && n.type === 'file' && /^(png|jpe?g)$/.test(fs.ext(n.name));
  const numberInput = (value, min = 1) => el('input.input', { type: 'number', inputmode: 'numeric', value, min, step: 1, required: true });
  const field = (label, input) => el('label', tr(label), input);
  const button = (label, cls, click) => el('button.btn' + cls, { type: 'button', on: { click } }, tr(label));

  function editRegion(image, crop) {
    const w = image.naturalWidth;
    const h = image.naturalHeight;
    return VOS.dialog.modal((d) => {
      const width = numberInput(w);
      const height = numberInput(h);
      const x = numberInput(0, 0);
      const y = numberInput(0, 0);
      const inputs = crop ? [x, y, width, height] : [width, height];
      const fields = el('div.ph-fields',
        crop && field('Відступ зліва', x), crop && field('Відступ зверху', y),
        field('Ширина (пкс)', width), field('Висота (пкс)', height));
      const hint = el('p.dialog-msg', tr(crop ? 'Виділи потрібну ділянку або введи її межі в пікселях.' : 'Введи ширину або висоту. Пропорції малюнка збережуться.'));
      const status = el('p.ph-edit-status', { role: 'status' });
      const selection = el('div.ph-selection', { 'aria-hidden': 'true' });
      const accept = button('Зберегти як…', '.btn-primary', () => {
        if (accept.disabled) return;
        d.close({ x: x.valueAsNumber, y: y.valueAsNumber, width: width.valueAsNumber, height: height.valueAsNumber });
      });
      function sync() {
        const left = x.valueAsNumber;
        const top = y.valueAsNumber;
        const right = left + width.valueAsNumber;
        const bottom = top + height.valueAsNumber;
        const numbersValid = inputs.every((input) => input.validity.valid && Number.isSafeInteger(input.valueAsNumber));
        const fits = !crop || (right <= w && bottom <= h);
        const sizeValid = width.valueAsNumber <= 16384 && height.valueAsNumber <= 16384 && width.valueAsNumber * height.valueAsNumber <= 33554432;
        const valid = numbersValid && fits && sizeValid;
        accept.disabled = !valid;
        status.textContent = valid ? '' : tr(!numbersValid ? 'Введи цілі числа.' : !fits ? 'Ділянка має бути в межах малюнка.' : 'Для збереження обери менший розмір.');
        if (crop) {
          selection.hidden = !valid;
          if (valid) Object.assign(selection.style, {
            left: 100 * left / w + '%', top: 100 * top / h + '%',
            width: 100 * width.valueAsNumber / w + '%', height: 100 * height.valueAsNumber / h + '%',
          });
        }
      }

      d.content.append(hint);
      if (crop) {
        const preview = el('div.ph-crop', { style: { width: Math.max(1, Math.min(420, 250 * w / h)) + 'px' } }, image, selection);
        image.draggable = false;
        let drag;
        function position(e) {
          const rect = preview.getBoundingClientRect();
          return {
            x: VOS.clamp(Math.round((e.clientX - rect.left) * w / rect.width), 0, w),
            y: VOS.clamp(Math.round((e.clientY - rect.top) * h / rect.height), 0, h),
          };
        }
        preview.addEventListener('pointerdown', (e) => {
          if (drag || e.button !== 0) return;
          drag = { ...position(e), id: e.pointerId };
          preview.setPointerCapture(e.pointerId);
        });
        preview.addEventListener('pointermove', (e) => {
          if (e.pointerId !== drag?.id) return;
          const end = position(e);
          x.value = Math.min(w - 1, drag.x, end.x);
          y.value = Math.min(h - 1, drag.y, end.y);
          width.value = Math.max(1, Math.abs(end.x - drag.x));
          height.value = Math.max(1, Math.abs(end.y - drag.y));
          sync();
        });
        preview.addEventListener('lostpointercapture', () => { drag = null; });
        d.content.append(preview);
      } else {
        width.addEventListener('input', () => { height.value = width.validity.valid ? Math.max(1, Math.round(width.valueAsNumber * h / w)) : ''; });
        height.addEventListener('input', () => { width.value = height.validity.valid ? Math.max(1, Math.round(height.valueAsNumber * w / h)) : ''; });
      }
      for (const input of inputs) input.addEventListener('input', sync);
      inputs[0].autofocus = true;
      d.content.append(fields, status);
      d.foot.append(accept, button('Скасувати', '', () => d.close(null)));
      d.onEnter = () => accept.click();
      sync();
    }, { title: tr(crop ? 'Обрізати' : 'Змінити розмір'), icon: crop ? 'scissors' : 'resize' });
  }

  function launch(args) {
    let id = args.file || null;
    let editing = false;
    const img = el('img.ph-img', { alt: '', draggable: 'false' });
    const empty = el('div.ph-empty', VOS.icon('img', 72), el('p', tr('Відкрий малюнок, щоб переглянути його.')),
      el('button.btn.btn-primary', { type: 'button', on: { click: () => openDlg() } }, VOS.icon('folder-open'), tr(' Відкрити малюнок')));
    const name = el('span.ph-name');
    const prevB = el('button.tb-btn', { type: 'button', title: tr('Попередній'), 'aria-label': tr('Попередній') }, VOS.icon('chevron-left'));
    const nextB = el('button.tb-btn', { type: 'button', title: tr('Наступний'), 'aria-label': tr('Наступний') }, VOS.icon('chevron-right'));
    const tool = (label, icon, click) => el('button.tb-btn', { type: 'button', title: tr(label), 'aria-label': tr(label), on: { click } }, VOS.icon(icon));
    const editB = tool('Редагувати в «Малюнку»', 'palette', () => VOS.apps.launch('paint', { file: id }));
    const cropB = tool('Обрізати', 'scissors', () => editPicture(true));
    const resizeB = tool('Змінити розмір', 'resize', () => editPicture(false));
    const openB = tool('Відкрити малюнок', 'folder-open', () => openDlg());
    const stage = el('div.ph-stage', img, empty);
    const root = el('div.app-photos', { tabindex: '0' }, el('div.ph-bar', openB, prevB, name, nextB, cropB, resizeB, editB), stage);

    const siblings = () => { const n = fs.get(id); return n ? fs.children(n.parent).filter(isImg) : []; };
    function show() {
      const n = fs.get(id);
      const ok = isImg(n);
      img.hidden = !ok; empty.hidden = ok;
      prevB.disabled = nextB.disabled = editB.disabled = !ok;
      cropB.disabled = resizeB.disabled = !ok || editing;
      if (!ok) { name.textContent = ''; win && win.setTitle(tr('Фото')); return; }
      img.src = n.content;
      img.alt = n.name;
      const s = siblings();
      name.textContent = n.name + (s.length > 1 ? '  (' + (s.findIndex((x) => x.id === id) + 1) + tr(' з ') + s.length + ')' : '');
      win && win.setTitle(n.name + tr(' — Фото'));
    }
    async function editPicture(crop) {
      const original = fs.get(id);
      if (editing || !isImg(original)) return;
      editing = true;
      show();
      try {
        const source = new Image();
        source.alt = original.name;
        source.src = original.content;
        await source.decode();
        const region = await editRegion(source, crop);
        if (!region) return;
        const { x, y, width, height } = region;
        const folder = original.parent;
        const suffix = tr(crop ? ' — обрізано' : ' — змінено розмір');
        const name = fs.uniqueName(folder, fs.baseName(original.name).slice(0, 50 - suffix.length) + suffix + '.png');
        const canvas = el('canvas', { width, height });
        const ctx = canvas.getContext('2d');
        if (crop) ctx.drawImage(source, x, y, width, height, 0, 0, width, height);
        else {
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(source, 0, 0, width, height);
        }
        const data = canvas.toDataURL('image/png');
        if (data === 'data:,') throw new Error();
        let result;
        do {
          result = await VOS.dialog.saveAs({ name, ext: 'png', folder, defaultFolder: 'pics', title: tr('Зберегти малюнок') });
          if (!result) return;
          if (result.replaceId === original.id) await VOS.dialog.error(tr('Обери іншу назву, щоб зберегти копію.'));
        } while (result.replaceId === original.id);
        const saved = result.replaceId ? fs.write(result.replaceId, data) : fs.createFile(result.folder, result.name, data);
        await fs.flush();
        if (!fs.get(saved.id)) throw new Error();
        id = saved.id;
        VOS.toast(tr('Малюнок збережено: ') + saved.name, 'save');
      } catch {
        VOS.dialog.error(tr('Не вдалося зберегти копію. Спробуй менший розмір або перевір вільне місце.'));
      } finally {
        editing = false;
        show();
      }
    }
    const step = (d) => { const s = siblings(); if (s.length < 2) return; const i = s.findIndex((x) => x.id === id); id = s[(i + d + s.length) % s.length].id; show(); };
    async function openDlg() { const r = await VOS.dialog.openFile({ exts: ['png', 'jpg', 'jpeg'], folder: 'pics', title: tr('Відкрити малюнок') }); if (r) { id = r; show(); } }
    prevB.addEventListener('click', () => step(-1));
    nextB.addEventListener('click', () => step(1));
    root.addEventListener('keydown', (e) => { if (e.key === 'ArrowLeft') step(-1); if (e.key === 'ArrowRight') step(1); });
    const off = bus.on('fs:change', () => show());

    const win = VOS.wm.open({ app: 'photos', title: tr('Фото'), icon: 'image', content: root, width: 680, height: 500, minWidth: 300, minHeight: 240, onClose: off });
    show();
    setTimeout(() => root.focus(), 50);
    return win;
  }

  VOS.apps.register({ id: 'photos', name: 'Фото', icon: 'image', color: '#12b886', category: 'standard', desc: tr('Перегляд та редагування малюнків'), exts: ['png', 'jpg', 'jpeg'], launch });
})();
