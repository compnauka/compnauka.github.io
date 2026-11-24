/* Віконце — Фото (переглядач малюнків). */
(function () {
  'use strict';
  const VOS = window.VOS;
  const { el, fs, bus } = VOS;
  const isImg = (n) => n && n.type === 'file' && /^(png|jpe?g)$/.test(fs.ext(n.name));

  function launch(args) {
    let id = args.file || null;
    const img = el('img.ph-img', { alt: '', draggable: false });
    const empty = el('div.ph-empty', VOS.icon('img', 72), el('p', 'Відкрий малюнок, щоб переглянути його.'),
      el('button.btn.btn-primary', { type: 'button', on: { click: () => openDlg() } }, VOS.icon('folder-open'), ' Відкрити малюнок'));
    const name = el('span.ph-name');
    const prevB = el('button.tb-btn', { type: 'button', title: 'Попередній', 'aria-label': 'Попередній' }, VOS.icon('chevron-left'));
    const nextB = el('button.tb-btn', { type: 'button', title: 'Наступний', 'aria-label': 'Наступний' }, VOS.icon('chevron-right'));
    const editB = el('button.tb-btn.wide', { type: 'button' }, VOS.icon('palette'), el('span.tb-label', ' Редагувати'));
    const openB = el('button.tb-btn.wide', { type: 'button' }, VOS.icon('folder-open'), el('span.tb-label', ' Відкрити'));
    const stage = el('div.ph-stage', img, empty);
    const root = el('div.app-photos', { tabindex: '0' }, el('div.ph-bar', openB, prevB, name, nextB, editB), stage);

    const siblings = () => { const n = fs.get(id); return n ? fs.children(n.parent).filter(isImg) : []; };
    function show() {
      const n = fs.get(id);
      const ok = isImg(n);
      img.hidden = !ok; empty.hidden = ok;
      prevB.disabled = nextB.disabled = editB.disabled = !ok;
      if (!ok) { name.textContent = ''; win && win.setTitle('Фото'); return; }
      img.src = n.content;
      img.alt = n.name;
      const s = siblings();
      name.textContent = n.name + (s.length > 1 ? '  (' + (s.findIndex((x) => x.id === id) + 1) + ' з ' + s.length + ')' : '');
      win && win.setTitle(n.name + ' — Фото');
    }
    const step = (d) => { const s = siblings(); if (s.length < 2) return; const i = s.findIndex((x) => x.id === id); id = s[(i + d + s.length) % s.length].id; show(); };
    async function openDlg() { const r = await VOS.dialog.openFile({ exts: ['png', 'jpg', 'jpeg'], folder: 'pics', title: 'Відкрити малюнок' }); if (r) { id = r; show(); } }
    prevB.addEventListener('click', () => step(-1));
    nextB.addEventListener('click', () => step(1));
    editB.addEventListener('click', () => VOS.apps.launch('paint', { file: id }));
    openB.addEventListener('click', openDlg);
    root.addEventListener('keydown', (e) => { if (e.key === 'ArrowLeft') step(-1); if (e.key === 'ArrowRight') step(1); });
    const off = bus.on('fs:change', () => show());

    const win = VOS.wm.open({ app: 'photos', title: 'Фото', icon: 'image', content: root, width: 680, height: 500, minWidth: 300, minHeight: 240, onClose: off });
    show();
    setTimeout(() => root.focus(), 50);
    return win;
  }

  VOS.apps.register({ id: 'photos', name: 'Фото', icon: 'image', color: '#12b886', category: 'standard', desc: 'Перегляд малюнків', exts: ['png', 'jpg'], launch });
})();
