/* Віконце — браузер із навчальними сторінками. */
(function () {
  'use strict';
  const VOS = window.VOS;
  const { lang, tr } = VOS.i18n;
  const { bus, el } = VOS;

  const TITLE = tr('Навчальний браузер');
  const PORTAL = 'https://itnauka.org';
  const SEARCH_TITLE = tr('Шукарик');
  const SITES = {
    ravlyk: { title: tr('Равлик'), url: 'https://ravlyk.org/', icon: 'pencil', color: '#427530', description: tr('Малюй командами та вчися програмувати українською.'), terms: 'ravlyk равлик код команди цикли малюнок редактор програмування turtle' },
    fact: { title: tr('Факт чи думка?'), path: '/games/fact-or-opinion/index.html', icon: 'check', color: '#855092', description: tr('Відрізняй перевірені факти від суджень.'), terms: 'факти думки медіаграмотність твердження' },
    blockly: { title: 'Blockly Games', url: 'https://blockly.games/?lang=uk', icon: 'puzzle', color: '#136fa1', description: tr('Розв’язуй ігрові задачі за допомогою блоків коду.'), terms: 'блоклі програмування пазл лабіринт птах черепаха фільм музика цикли coding' },
    ai: { title: tr('Привіт, ШІ!'), path: '/services/ai/pryvitshi/index.html', icon: 'sparkles', color: '#6749ac', description: tr('Інтерактивна книга про штучний інтелект.'), terms: 'штучний інтелект запит промпт нейромережі ai' },
    safety: { title: tr('Кібербезпека для дітей'), path: '/services/security_and_safety/cybersecurity_for_kids/index.html', icon: 'first-aid', color: '#146e61', description: tr('Вчися захищати паролі й особисті дані.'), terms: 'безпека пароль паролі фішинг приватність захист інтернет' },
    crypto: { title: tr('Криптографія для дітей'), path: '/services/security_and_safety/cryptography_for_kids/index.html', icon: 'letters', color: '#a04e1f', description: tr('Шифруй і розшифровуй таємні повідомлення.'), terms: 'шифри шифр цезаря шифрування ключ код таємниця' },
    critical: { title: tr('Критичне мислення для дітей'), path: '/services/security_and_safety/critical_thinking_for_kids/index.html', icon: 'bulb', color: '#a13963', description: tr('Перевіряй джерела, новини й твердження.'), terms: 'фактчекінг джерело фейки новина медіаграмотність факти думки' },
    data: { title: tr('Дані та інформація'), path: '/services/digital_literacy/data-and-information/index.html', icon: 'table', color: '#0b766b', description: tr('Розпізнавай, групуй і читай дані в таблицях та діаграмах.'), terms: 'дані інформація числа таблиці діаграми графіки' },
    wiki: { title: tr('Вікі Енциклопедія'), local: 'wiki/?lang=' + lang, icon: 'books', color: '#39419a', description: tr('Статті про елементи та програми Віконця.'), terms: 'вікі довідник словник' },
  };

  const siteUrl = (site) => site.url || (site.local ? new URL(site.local, document.baseURI).href : PORTAL + site.path);
  const frameUrl = (site) => site.url || site.local || '..' + site.path;
  const index = new Map();
  const normalize = (value) => value.toLocaleLowerCase(lang).normalize('NFC').replace(/[’ʼ']/g, '').replace(/[^\p{L}\p{N}]+/gu, ' ').trim();

  function pageText(id, site) {
    if (id === 'wiki') return Promise.resolve(VOS.explain.articles().flatMap(({ title, lines }) => [title, ...lines]).join(' '));
    if (!site.path) return Promise.resolve('');
    if (!index.has(id)) {
      const url = frameUrl(site);
      const report = VOS.xray.request(url, SEARCH_TITLE);
      let status;
      const pending = fetch(url, { signal: AbortSignal.timeout(7000) }).then(async (response) => {
        status = response.status;
        if (!response.ok) throw new Error(String(status));
        const html = await response.text();
        report?.('loaded', status);
        const page = new DOMParser().parseFromString(html, 'text/html');
        page.querySelectorAll('script, style, noscript, nav, footer, template').forEach((part) => part.remove());
        return (page.querySelector('meta[name="description"]')?.content || '') + ' ' + page.body.innerText;
      }).catch(() => {
        report?.('error', status);
        index.delete(id);
        return '';
      });
      index.set(id, pending);
    }
    return index.get(id);
  }

  function keepCertificateInFrame(doc) {
    const button = doc.getElementById('btn-print');
    const certificate = doc.getElementById('certificate-content');
    if (!button || !certificate) return;
    const style = doc.createElement('style');
    style.textContent = `
      .br-print-certificate { display: none; }
      @media print {
        body > :not(.br-print-certificate) { display: none !important; }
        .br-print-certificate { display: block !important; }
      }
    `;
    doc.head.append(style);
    button.addEventListener('click', (event) => {
      event.stopImmediatePropagation();
      doc.querySelector('.br-print-certificate')?.remove();
      const copy = certificate.cloneNode(true);
      copy.removeAttribute('id');
      copy.classList.add('br-print-certificate');
      doc.body.append(copy);
      doc.defaultView.addEventListener('afterprint', () => copy.remove(), { once: true });
      doc.defaultView.print();
    }, { capture: true });
  }

  function constrainDocument(doc, url) {
    const lesson = new URL(url, document.baseURI);
    const directory = lesson.pathname.slice(0, lesson.pathname.lastIndexOf('/') + 1);
    const withinLesson = (target) => target.origin === lesson.origin
      && (target.pathname === directory.slice(0, -1) || target.pathname.startsWith(directory));
    VOS.wm.keepFrameLinks(doc, withinLesson);
    doc.querySelectorAll('.ss-back, .ss-brand, .ss-footer-socials').forEach((part) => { part.hidden = true; });

    doc.addEventListener('submit', (event) => {
      const form = event.target;
      const action = event.submitter?.getAttribute('formaction') ?? form.action;
      if (!withinLesson(new URL(action, doc.baseURI))) {
        event.preventDefault();
        event.stopImmediatePropagation();
      } else {
        form.target = '_self';
        if (event.submitter?.hasAttribute('formtarget')) event.submitter.formTarget = '_self';
      }
    }, { capture: true });
  }

  function launch() {
    const history = [{ id: 'home', query: '' }];
    let position = 0;
    let cancelLoad;
    const address = el('input.input.br-address', { type: 'text', readonly: true, 'aria-label': tr('Адреса навчальної сторінки') });
    const viewport = el('div.br-viewport');
    const toolbarButton = (icon, label, action, hint) => el('button.br-nav-btn', {
      type: 'button', 'aria-label': label, title: label, dataset: hint ? { hint } : {}, on: { click: action },
    }, VOS.icon(icon));
    const back = toolbarButton('chevron-left', tr('Назад'), () => travel(-1, back));
    const forward = toolbarButton('chevron-right', tr('Уперед'), () => travel(1, forward));
    const home = toolbarButton('home', tr('Початкова сторінка'), () => go('home', 'home'), 'browser-home');
    const toolbar = el('div.br-toolbar', { role: 'group', 'aria-label': tr('Керування браузером') }, back, forward, home, address);
    const win = VOS.wm.open({
      app: 'browser', title: TITLE, icon: 'globe', content: el('div.app-browser', toolbar, viewport),
      width: 760, height: 590, minWidth: 300, minHeight: 270, onClose: () => cancelLoad?.(),
    });

    function navigate(fromPageId, via, focusHeading) {
      render(focusHeading);
      bus.emit('browser:navigate', { pageId: history[position].id, fromPageId, via, winId: win.id });
    }

    function travel(offset, control) {
      const next = position + offset;
      if (next < 0 || next >= history.length) return;
      const previous = history[position].id;
      position = next;
      navigate(previous, offset < 0 ? 'back' : 'forward', next + offset < 0 || next + offset >= history.length);
      if (!control.disabled) control.focus();
    }

    function go(id, via, query = '') {
      const previous = history[position];
      if (previous.id === id && previous.query === query) return;
      position++;
      history.splice(position, history.length - position, { id, query });
      navigate(previous.id, via, true);
    }

    function siteLink(id, site, className, ...content) {
      return el('button.' + className, {
        type: 'button',
        dataset: { hint: 'browser-' + id }, style: { '--card-color': site.color },
        on: { click: () => go(id, 'link') },
      }, content);
    }

    function searchForm(query) {
      const queryLabel = tr('Пошук у Шукарику');
      const input = el('input.input', {
        type: 'search', name: 'q', maxlength: 200, required: true, placeholder: queryLabel, 'aria-label': queryLabel,
      });
      input.value = query;
      return el('form.br-search', { role: 'search', on: { submit: (event) => {
        event.preventDefault();
        const next = input.value.trim();
        if (normalize(next)) go('search', 'search', next);
      } } }, input, el('button.btn.btn-primary', { type: 'submit' }, VOS.icon('search'), tr('Шукати')));
    }

    function homeContent(heading) {
      const cards = Object.entries(SITES).map(([id, site]) => siteLink(id, site, 'br-link',
        el('span.br-card-icon', VOS.icon(site.icon)), el('span.br-card-label', el('strong', site.title))));
      return el('article.br-page.br-home',
        el('div.br-hero', el('div', heading, el('p.br-search-label', SEARCH_TITLE)), VOS.icon('owl', null, 'br-owl'), searchForm('')),
        el('div.br-cards', cards));
    }

    function searchContent(heading, query) {
      const finishSearch = VOS.xray.localSearch();
      const terms = [...new Set(normalize(query).split(' '))];
      const status = el('p.br-search-status', { role: 'status' }, tr('Шукаємо…'));
      const results = el('ul.br-results');
      Promise.all(Object.entries(SITES).map(async ([id, site]) => {
        const title = normalize(site.title);
        const summary = normalize([site.description, site.terms, siteUrl(site)].join(' '));
        let body = '';
        if (terms.some((term) => !title.includes(term) && !summary.includes(term))) body = normalize(await pageText(id, site));
        const scores = terms.map((term) => title.includes(term) ? 3 : summary.includes(term) ? 2 : Number(body.includes(term)));
        return { id, site, score: scores.every(Boolean) ? scores.reduce((total, score) => total + score, 0) : 0 };
      })).then((entries) => {
        if (!results.isConnected) return;
        const matches = entries.filter(({ score }) => score > 0).sort((a, b) => b.score - a.score);
        finishSearch?.(matches.length);
        status.textContent = matches.length ? tr('Знайдено сайтів') + ' · ' + matches.length : tr('Нічого не знайдено. Спробуй інші слова.');
        results.replaceChildren(...matches.map(({ id, site }) => el('li.br-result',
          el('small', siteUrl(site)), siteLink(id, site, 'br-result-link', site.title), el('p', site.description))));
      });
      return el('article.br-page.br-home.br-search-page', heading, searchForm(query), status, results);
    }

    function siteContent(site, heading) {
      const url = frameUrl(site);
      let report = VOS.xray.request(url, site.title);
      const sandbox = 'allow-scripts allow-same-origin allow-forms allow-downloads' + (site.url ? '' : ' allow-modals');
      const frame = el('iframe.br-frame', { title: site.title, src: url, sandbox });
      cancelLoad = () => report?.('canceled');
      frame.addEventListener('error', () => {
        if (!frame.isConnected) return;
        cancelLoad = null;
        report?.('error');
        report = null;
      });
      frame.addEventListener('load', () => {
        if (!frame.isConnected) return;
        cancelLoad = null;
        const doc = frame.contentDocument;
        const timing = doc && frame.contentWindow.performance.getEntriesByType('navigation')[0];
        const status = timing?.responseStatus;
        report?.((!doc && !site.url) || status >= 400 ? 'error' : 'loaded', status);
        report = null;
        if (!doc) return;
        constrainDocument(doc, url);
        keepCertificateInFrame(doc);
      });
      const returnHome = el('button.btn.br-site-return', {
        type: 'button', on: { click: () => go('home', 'home') },
      }, VOS.icon('home'), tr('Початкова сторінка'));
      return el('section.br-site', el('div.br-site-bar', heading, returnHome), frame);
    }

    function render(focusHeading) {
      cancelLoad?.();
      cancelLoad = null;
      const { id, query } = history[position];
      const site = SITES[id];
      const title = site?.title || (id === 'search' ? SEARCH_TITLE : tr('Куди вирушимо?'));
      const heading = el('h2.br-heading', { tabindex: '-1' }, title);
      address.value = site ? siteUrl(site) : id === 'search' ? SEARCH_TITLE : tr('Початкова сторінка');
      back.disabled = position === 0;
      forward.disabled = position === history.length - 1;
      viewport.replaceChildren(site ? siteContent(site, heading) : id === 'search' ? searchContent(heading, query) : homeContent(heading));
      viewport.scrollTop = 0;
      if (focusHeading) heading.focus({ preventScroll: true });
    }

    navigate(null, 'launch', false);
    return win;
  }

  VOS.apps.register({
    id: 'browser', name: 'Навчальний браузер', icon: 'globe', color: '#0e7490',
    category: 'computer', desc: tr('Навчальні сайти, пошук і енциклопедія'), launch,
  });
})();
