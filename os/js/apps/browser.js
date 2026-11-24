/* Віконце — браузер із навчальними сторінками. */
(function () {
  'use strict';
  const VOS = window.VOS;
  const { bus, el, fs } = VOS;

  const PAGES = {
    home: { title: 'Сайт школи «Стежинка»', path: '/' },
    library: { title: 'Шкільна бібліотека', path: '/library' },
    gallery: { title: 'Галерея шкільної бібліотеки', path: '/gallery' },
  };
  const ASSET = { id: 'paper-kite', title: 'Паперовий змій', pageId: 'gallery' };
  const addressOf = (pageId) => 'school.test' + PAGES[pageId].path;
  const source = '«' + ASSET.title + '» — ' + PAGES.gallery.title + '. Адреса: ' + addressOf('gallery');

  function makeIllustration() {
    const canvas = document.createElement('canvas');
    canvas.width = 560;
    canvas.height = 320;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    const sky = ctx.createLinearGradient(0, 0, 0, 320);
    sky.addColorStop(0, '#86c5ec');
    sky.addColorStop(1, '#f0f9ff');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, 560, 320);

    ctx.fillStyle = '#fff0b3';
    ctx.beginPath();
    ctx.arc(433, 80, 39, 0, 2 * Math.PI);
    ctx.fill();

    ctx.fillStyle = '#fcfcf7';
    for (const [x, y] of [[74, 80], [420, 148]]) {
      ctx.beginPath();
      ctx.ellipse(x, y, 43, 11, 0, 0, 2 * Math.PI);
      ctx.ellipse(x - 13, y - 9, 16, 15, 0, 0, 2 * Math.PI);
      ctx.ellipse(x + 11, y - 11, 18, 20, 0, 0, 2 * Math.PI);
      ctx.fill();
    }

    ctx.fillStyle = '#89b29c';
    ctx.beginPath();
    ctx.moveTo(0, 221);
    ctx.bezierCurveTo(170, 136, 294, 302, 560, 194);
    ctx.lineTo(560, 320);
    ctx.lineTo(0, 320);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#49866f';
    ctx.beginPath();
    ctx.moveTo(0, 278);
    ctx.bezierCurveTo(260, 330, 265, 198, 560, 239);
    ctx.lineTo(560, 320);
    ctx.lineTo(0, 320);
    ctx.closePath();
    ctx.fill();

    function fillPolygon(color, points) {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(...points[0]);
      for (const point of points.slice(1)) ctx.lineTo(...point);
      ctx.closePath();
      ctx.fill();
    }

    ctx.strokeStyle = '#482d3e';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(246, 155);
    ctx.bezierCurveTo(225, 203, 313, 204, 274, 245);
    ctx.bezierCurveTo(248, 280, 330, 286, 304, 315);
    ctx.stroke();
    fillPolygon('#fd986c', [[253, 204], [253, 182], [280, 194], [297, 181], [300, 205], [278, 196]]);
    fillPolygon('#ffdea2', [[254, 258], [261, 237], [272, 248], [292, 242], [290, 260], [273, 251]]);

    const top = [286, 36], left = [216, 82], middle = [268, 100], right = [327, 105], bottom = [246, 155];
    fillPolygon('#fbbd62', [top, middle, left]);
    fillPolygon('#fb8c61', [top, right, middle]);
    fillPolygon('#ec665f', [right, bottom, middle]);
    fillPolygon('#d75271', [left, middle, bottom]);
    return canvas.toDataURL('image/png');
  }

  function launch() {
    const history = ['home'];
    let position = 0;
    let closed = false;
    let saving = false;
    let imageData;
    const address = el('input.input.br-address', { type: 'text', readonly: true, 'aria-label': 'Адреса навчальної сторінки' });
    const viewport = el('div.br-viewport');
    const toolbarButton = (icon, label, action, hint) => el('button.br-nav-btn', {
      type: 'button', 'aria-label': label, title: label,
      dataset: hint ? { hint } : {}, on: { click: action },
    }, VOS.icon(icon));
    const back = toolbarButton('chevron-left', 'Назад', () => travel(-1, 'back', back));
    const forward = toolbarButton('chevron-right', 'Уперед', () => travel(1, 'forward', forward));
    const home = toolbarButton('monitor', 'Початкова сторінка', () => go('home', 'home'), 'browser-home');
    const toolbar = el('div.br-toolbar', { role: 'group', 'aria-label': 'Керування браузером' }, back, forward, home, address);
    const root = el('div.app-browser', toolbar, viewport);
    const win = VOS.wm.open({
      app: 'browser', title: 'Навчальний браузер', icon: 'monitor', content: root,
      width: 760, height: 590, minWidth: 300, minHeight: 270, onClose: () => { closed = true; },
    });

    function navigate(fromPageId, via, focusHeading) {
      render(focusHeading);
      bus.emit('browser:navigate', { pageId: history[position], fromPageId, via, winId: win.id });
    }

    function travel(offset, via, control) {
      const next = position + offset;
      if (next < 0 || next >= history.length) return;
      const previous = history[position];
      position = next;
      navigate(previous, via, next + offset < 0 || next + offset >= history.length);
      if (!control.disabled) control.focus();
    }

    function go(pageId, via) {
      if (!Object.hasOwn(PAGES, pageId) || history[position] === pageId) return;
      const previous = history[position];
      position++;
      history.splice(position, history.length - position, pageId);
      navigate(previous, via, true);
    }

    function pageLink(pageId, label, icon) {
      const link = el('a.br-link', {
        href: '#' + pageId,
        dataset: { hint: 'browser-' + pageId },
        on: {
          click: (event) => { event.preventDefault(); go(pageId, 'link'); },
          auxclick: (event) => event.preventDefault(),
        },
      }, VOS.icon(icon), label, VOS.icon('arrow-right'));
      return link;
    }

    async function saveIllustration(button) {
      if (saving || !imageData) return;
      saving = button.disabled = true;
      try {
        const result = await VOS.dialog.saveAs({
          title: 'Зберегти ілюстрацію', name: fs.uniqueName('pics', ASSET.title + '.png'),
          folder: 'pics', defaultFolder: 'pics', ext: 'png',
        });
        if (!result || closed) return;
        const folder = fs.get(result.folder);
        if (!folder || folder.type !== 'folder' || result.folder === 'trash' || fs.isInTrash(result.folder)) {
          throw new Error('Обери місце для збереження ще раз.');
        }
        const replacement = result.replaceId ? fs.get(result.replaceId) : null;
        if (result.replaceId && (!replacement || replacement.parent !== result.folder
          || replacement.name.toLocaleLowerCase('uk') !== result.name.toLocaleLowerCase('uk'))) {
          throw new Error('Файл для заміни змінився. Обери, куди зберегти ілюстрацію.');
        }
        const node = replacement ? fs.write(replacement.id, imageData) : fs.createFile(result.folder, result.name, imageData);
        await fs.flush();
        if (closed) return;
        const saved = fs.get(node.id);
        if (!saved || saved.content !== imageData || saved.parent !== result.folder) {
          throw new Error('Ілюстрація змінилася під час збереження. Спробуй ще раз.');
        }
        VOS.toast('Ілюстрацію «' + ASSET.title + '» збережено', 'save');
        bus.emit('browser:save', { node: saved, pageId: ASSET.pageId, assetId: ASSET.id, winId: win.id });
      } catch (error) {
        if (!closed) VOS.dialog.error('Не вдалося зберегти ілюстрацію. ' + (error?.message || 'Спробуй ще раз.'));
      } finally {
        saving = button.disabled = false;
        const currentButton = root.querySelector('[data-hint="browser-save"]');
        if (currentButton) currentButton.disabled = false;
      }
    }

    function citeIllustration() {
      const draft = VOS.apps.launch('notepad', { text: source });
      if (draft) bus.emit('browser:cite', {
        pageId: ASSET.pageId, assetId: ASSET.id, source, winId: win.id, draftWinId: draft.id,
      });
    }

    function galleryContent() {
      imageData ||= makeIllustration();
      const save = el('button.btn.btn-primary', {
        type: 'button', disabled: saving || !imageData,
        dataset: { hint: 'browser-save' }, on: { click: () => saveIllustration(save) },
      }, VOS.icon('download'), 'Зберегти малюнок');
      const cite = el('button.btn', {
        type: 'button', dataset: { hint: 'browser-source' }, on: { click: citeIllustration },
      }, VOS.icon('notebook'), 'Записати джерело');
      const illustration = imageData
        ? el('img.br-illustration', { src: imageData, width: 560, height: 320, alt: 'Помаранчевий паперовий змій літає над зеленими пагорбами' })
        : el('p', 'Не вдалося показати ілюстрацію.');
      return el('figure.br-gallery', illustration,
        el('figcaption.br-details', el('h3', ASSET.title), el('p.br-source', source),
          el('div.br-actions', save, cite)));
    }

    function render(focusHeading) {
      const pageId = history[position];
      const page = PAGES[pageId];
      const heading = el('h2.br-heading', { tabindex: '-1' }, page.title);
      const content = el('article.br-page.br-' + pageId, heading);
      if (pageId === 'home') {
        content.append(el('p', 'Це навчальний сайт вигаданої школи. У бібліотеці є матеріали про шкільні виставки.'),
          pageLink('library', 'Шкільна бібліотека', 'books'));
      } else if (pageId === 'library') {
        content.append(el('p', 'Для виставки «Вітер і небо» ми зібрали малюнки про те, що можна побачити надворі.'),
          pageLink('gallery', 'Галерея ілюстрацій', 'image'), pageLink('home', 'Сайт школи', 'monitor'));
      } else {
        content.append(galleryContent(), pageLink('library', 'Назад до бібліотеки', 'books'));
      }
      address.value = addressOf(pageId);
      back.disabled = position === 0;
      forward.disabled = position === history.length - 1;
      viewport.replaceChildren(content);
      viewport.scrollTop = 0;
      if (focusHeading) heading.focus({ preventScroll: true });
    }

    navigate(null, 'launch', false);
    return win;
  }

  VOS.apps.register({
    id: 'browser', name: 'Навчальний браузер', icon: 'monitor', color: '#0e7490',
    category: 'standard', desc: 'Подорож шкільним сайтом і бібліотекою', launch,
  });
})();
