/* Віконце — браузер із навчальними сторінками. */
(function () {
  'use strict';
  const VOS = window.VOS;
  const { tr } = VOS.i18n;
  const { bus, el, fs } = VOS;

  const TITLE = tr('Навчальний браузер');
  const ICON = 'globe';
  const PORTAL = 'https://itnauka.org';
  const PAGES = {
    home: { title: TITLE },
    library: { title: tr('Шкільна бібліотека'), path: '/library' },
    gallery: { title: tr('Галерея шкільної бібліотеки'), path: '/gallery' },
  };
  const SITES = {
    hotkeys: { title: tr('Гарячі клавіші'), path: '/services/digital_literacy/typing_skills/typing_lesson/', icon: 'keyboard', description: tr('Інтерактивний урок про клавіатуру та сполучення клавіш.') },
    data: { title: tr('Дані та інформація'), path: '/services/digital_literacy/data-and-information/', icon: 'table', description: tr('Розпізнавай, групуй і читай дані в таблицях та діаграмах.') },
    search: { title: tr('Шукарик'), path: '/services/security_and_safety/search_engine/', icon: 'search', description: tr('Спробуй складати запити й обирати результати пошуку.') },
    addresses: { title: tr('Веселі адреси'), path: '/services/digital_literacy/typing_skills/urls_typing/', icon: 'globe', description: tr('Тренуйся вводити адреси вебсайтів.') },
    klavio: { title: tr('Клавіо'), path: '/services/digital_literacy/typing_skills/klavio/', icon: 'keyboard', description: tr('Уроки друку, вправи зі словами й спринт.') },
    drukaryk: { title: tr('Друкарик'), path: '/tools/drukaryk/', icon: 'type', description: tr('Напиши й оформи текст.') },
  };
  const ASSET = { id: 'paper-kite', title: tr('Паперовий змій'), pageId: 'gallery' };
  const addressOf = (pageId) => SITES[pageId] ? PORTAL + SITES[pageId].path
    : pageId === 'home' ? tr('Початкова сторінка Віконця') : 'school.test' + PAGES[pageId].path;
  const source = '«' + ASSET.title + '» — ' + PAGES.gallery.title + tr('. Адреса: ') + addressOf('gallery');

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
    const address = el('input.input.br-address', { type: 'text', readonly: true, 'aria-label': tr('Адреса навчальної сторінки') });
    const viewport = el('div.br-viewport');
    const toolbarButton = (icon, label, action, hint) => el('button.br-nav-btn', {
      type: 'button', 'aria-label': label, title: label,
      dataset: hint ? { hint } : {}, on: { click: action },
    }, VOS.icon(icon));
    const back = toolbarButton('chevron-left', tr('Назад'), () => travel(-1, 'back', back));
    const forward = toolbarButton('chevron-right', tr('Уперед'), () => travel(1, 'forward', forward));
    const home = toolbarButton('home', tr('Початкова сторінка'), () => go('home', 'home'), 'browser-home');
    const toolbar = el('div.br-toolbar', { role: 'group', 'aria-label': tr('Керування браузером') }, back, forward, home, address);
    const root = el('div.app-browser', toolbar, viewport);
    const win = VOS.wm.open({
      app: 'browser', title: TITLE, icon: ICON, content: root,
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
      if ((!Object.hasOwn(PAGES, pageId) && !Object.hasOwn(SITES, pageId)) || history[position] === pageId) return;
      const previous = history[position];
      position++;
      history.splice(position, history.length - position, pageId);
      navigate(previous, via, true);
    }

    function pageLink(pageId, label, icon, description) {
      const link = el('a.br-link', {
        href: SITES[pageId] ? addressOf(pageId) : '#' + pageId,
        dataset: { hint: 'browser-' + pageId },
        on: {
          click: (event) => { event.preventDefault(); go(pageId, 'link'); },
          auxclick: (event) => event.preventDefault(),
        },
      }, VOS.icon(icon), description ? el('span.br-card-label', el('strong', label), el('small', description)) : label);
      return link;
    }

    const externalLink = (url, label) => el('a.br-link', {
      href: url, target: '_blank', rel: 'noopener',
    }, label);

    function siteContent(site, heading) {
      const frame = el('iframe.br-frame', { title: site.title, src: '..' + site.path, allow: 'fullscreen' });
      frame.addEventListener('load', () => {
        if (!frame.isConnected) return;
        const doc = frame.contentDocument;
        if (!doc) return;
        // Посилання сервісів на головну ведуть до каталогу, а не до ще одного Віконця у фреймі.
        const location = new URL(doc.URL, window.location.href);
        const path = location.pathname;
        if (location.origin === window.location.origin && path.startsWith(site.path)) {
          address.value = PORTAL + path + location.search + location.hash;
        }
        for (const link of doc.links) {
          if (link.origin !== window.location.origin || !['/', '/index.html'].includes(link.pathname)) continue;
          link.href = PORTAL + '/' + link.search + link.hash;
          link.target = '_blank';
          link.rel = 'noopener';
        }
      });
      return el('section.br-site', el('div.br-site-bar', heading, externalLink(PORTAL + site.path, tr('Відкрити в новій вкладці'))), frame);
    }

    async function saveIllustration(button) {
      if (saving || !imageData) return;
      saving = button.disabled = true;
      try {
        const result = await VOS.dialog.saveAs({
          title: tr('Зберегти ілюстрацію'), name: fs.uniqueName('pics', ASSET.title + '.png'),
          folder: 'pics', defaultFolder: 'pics', ext: 'png',
        });
        if (!result || closed) return;
        const folder = fs.get(result.folder);
        if (!folder || folder.type !== 'folder' || result.folder === 'trash' || fs.isInTrash(result.folder)) {
          throw new Error(tr('Обери місце для збереження ще раз.'));
        }
        const replacement = result.replaceId ? fs.get(result.replaceId) : null;
        if (result.replaceId && (!replacement || replacement.parent !== result.folder
          || replacement.name.toLocaleLowerCase('uk') !== result.name.toLocaleLowerCase('uk'))) {
          throw new Error(tr('Файл для заміни змінився. Обери, куди зберегти ілюстрацію.'));
        }
        const node = replacement ? fs.write(replacement.id, imageData) : fs.createFile(result.folder, result.name, imageData);
        await fs.flush();
        if (closed) return;
        const saved = fs.get(node.id);
        if (!saved || saved.content !== imageData || saved.parent !== result.folder) {
          throw new Error(tr('Ілюстрація змінилася під час збереження. Спробуй ще раз.'));
        }
        VOS.toast(tr('Ілюстрацію «') + ASSET.title + tr('» збережено'), 'save');
        bus.emit('browser:save', { node: saved, pageId: ASSET.pageId, assetId: ASSET.id, winId: win.id });
      } catch (error) {
        if (!closed) VOS.dialog.error(tr('Не вдалося зберегти ілюстрацію. ') + (error?.message || tr('Спробуй ще раз.')));
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
      }, VOS.icon('download'), tr('Зберегти малюнок'));
      const cite = el('button.btn', {
        type: 'button', dataset: { hint: 'browser-source' }, on: { click: citeIllustration },
      }, VOS.icon('notebook'), tr('Записати джерело'));
      const illustration = imageData
        ? el('img.br-illustration', { src: imageData, width: 560, height: 320, alt: tr('Помаранчевий паперовий змій літає над зеленими пагорбами') })
        : el('p', tr('Не вдалося показати ілюстрацію.'));
      return el('figure.br-gallery', illustration,
        el('figcaption.br-details', el('h3', ASSET.title), el('p.br-source', source),
          el('div.br-actions', save, cite)));
    }

    function render(focusHeading) {
      const pageId = history[position];
      const site = SITES[pageId];
      const page = site || PAGES[pageId];
      const heading = el('h2.br-heading', { tabindex: '-1' }, page.title);
      const content = site ? siteContent(site, heading) : el('article.br-page.br-' + pageId, heading);
      if (pageId === 'home') {
        const cards = Object.entries(SITES).map(([id, item]) => pageLink(id, item.title, item.icon, item.description));
        content.append(el('h3.br-section-title', tr('Уроки й сервіси itnauka.org')), el('div.br-cards', cards),
          externalLink(PORTAL + '/', tr('Усі сервіси itnauka.org (нова вкладка)')),
          el('h3.br-section-title', tr('Сайт школи «Стежинка»')), pageLink('library', tr('Шкільна бібліотека'), 'books'));
      } else if (pageId === 'library') {
        content.append(el('p', tr('У бібліотеці вигаданої школи «Стежинка» зібрали малюнки для виставки «Вітер і небо».')),
          pageLink('gallery', tr('Галерея ілюстрацій'), 'image'), pageLink('home', tr('Початкова сторінка'), 'home'));
      } else if (pageId === 'gallery') {
        content.append(galleryContent(), pageLink('library', tr('Назад до бібліотеки'), 'books'));
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
    id: 'browser', name: 'Навчальний браузер', icon: ICON, color: '#0e7490',
    category: 'standard', desc: tr('Уроки, тренажери й шкільна бібліотека'), launch,
  });
})();
