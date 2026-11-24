(function () {
  'use strict';
  const { $, el, icon, explain, i18n } = window.VOS;
  const { tr, locale, lang } = i18n;
  const articles = explain.articles().sort((a, b) => a.title.localeCompare(b.title, locale));
  const groups = {
    elements: phrase('Елементи комп’ютера', 'Computer basics'),
    apps: phrase('Програми', 'Apps'),
  };
  const text = {
    search: phrase('Пошук в енциклопедії', 'Search the encyclopedia'),
    placeholder: phrase('Шукати у Вікі Енциклопедії', 'Search Wiki Encyclopedia'),
    all: phrase('Усі статті', 'All articles'),
    home: phrase('Головна сторінка', 'Main page'),
    searchButton: phrase('Знайти статтю', 'Find an article'),
    results: phrase('Результати пошуку', 'Search results'),
    found: phrase('Знайдено статей', 'Articles found'),
    noResults: phrase('За цим запитом статей не знайдено.', 'No articles match this search.'),
    intro: phrase('Прості пояснення про комп’ютер і програми.', 'Simple articles about computers and apps.'),
    contents: phrase('Зміст', 'Contents'),
    description: phrase('Опис', 'Description'),
    how: phrase('Як користуватися', 'How to use it'),
    more: phrase('Дізнайся також', 'Related articles'),
    sources: phrase('Джерела', 'Sources'),
    source: phrase('Пояснення з довідки «Що це?» у навчальній системі Віконце.', 'Explanations from the “What is this?” help in the Vikontse learning system.'),
    sourceLabel: phrase('Джерело', 'Source'),
    back: phrase('Повернутися до всіх статей', 'Back to all articles'),
    pageTitle: phrase('Вікі Енциклопедія', 'Wiki Encyclopedia'),
  };
  const main = $('#wiki-main');
  const headerSearch = $('#wiki-search');
  let searchPreview = null;
  const headerLabel = document.querySelector('.wiki-top-search label');
  headerLabel.textContent = text.search;
  headerSearch.placeholder = text.placeholder;
  headerSearch.setAttribute('aria-label', text.search);
  const headerButton = $('#wiki-top-search button');
  headerButton.title = text.searchButton;
  headerButton.setAttribute('aria-label', text.searchButton);
  $('#wiki-brand').replaceChildren(icon('books'), el('span', text.pageTitle));
  $('#wiki-brand').setAttribute('aria-label', text.pageTitle);
  $('#wiki-all-link').textContent = text.all;
  const homeTab = document.querySelector('.wiki-tabs-inner a');
  if (homeTab) homeTab.textContent = text.home;
  document.documentElement.lang = lang;

  function phrase(uk, en) {
    return lang === 'en' ? en : uk;
  }

  function normalize(value) {
    return value.normalize('NFC').toLocaleLowerCase(locale).replace(/[’ʼ']/g, '').replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
  }

  const topicWords = {
    folder: ['folder', 'файл', 'документ', 'малюнок', 'коробка', 'папка'],
    docs: ['folder', 'folder', 'file', 'текст', 'документ'],
    pics: ['folder', 'image', 'photo', 'малюнок', 'фото'],
    desktop: ['folder', 'computer', 'icon', 'window', 'екран', 'значок', 'комп’ютер'],
    root: ['computer', 'folder', 'file', 'комп’ютер', 'папка', 'файл'],
    trash: ['file', 'folder', 'delete', 'відновити', 'кошик', 'видалити'],
    games: ['app', 'shortcut', 'гра', 'програма'],
    trainers: ['app', 'typing', 'mouse', 'клавіатур', 'мишка', 'тренажер'],
    shortcut: ['app', 'folder', 'file', 'програма', 'папка', 'файл'],
    app: ['shortcut', 'app', 'window', 'програма', 'ярлик', 'вікно'],
    background: ['folder', 'desktop', 'file', 'папка', 'створити'],
    taskbar: ['window', 'taskbtn', 'start', 'пуск', 'вікно', 'меню'],
    taskbtn: ['window', 'taskbar', 'вікно', 'панель задач'],
    start: ['taskbar', 'app', 'power', 'меню', 'програма'],
    power: ['start', 'session', 'start', 'вимкнути', 'перезавантажити'],
    pocket: ['copy', 'paste', 'file', 'clipboard', 'скопіювати', 'буфер обміну'],
    window: ['app', 'taskbar', 'taskbtn', 'програма', 'панель задач'],
    txt: ['docs', 'notepad', 'file', 'текст', 'блокнот'],
    img: ['pics', 'photos', 'paint', 'малюнок', 'фото'],
    csv: ['table', 'docs', 'файл', 'таблиця'],
    html: ['browser', 'drukaryk', 'web', 'браузер', 'вебсторінка'],
    flow: ['app-flowchart', 'algorithm', 'блок-схема', 'план'],
    zip: ['folder', 'file', 'архів', 'розпакувати'],
    file: ['folder', 'docs', 'pics', 'txt', 'файл', 'папка'],
    notepad: ['txt', 'docs', 'file', 'текст', 'файл'],
    paint: ['img', 'pics', 'фото', 'малюнок'],
    photos: ['img', 'pics', 'paint', 'малюнок', 'фото'],
    calculator: ['number', 'keyboard', 'обчислити', 'цифра'],
    explorer: ['folder', 'root', 'desktop', 'file', 'папка', 'комп’ютер'],
    settings: ['desktop', 'wallpaper', 'екран', 'шпалери'],
    help: ['explain', 'стаття', 'пояснення'],
    missions: ['app', 'start', 'owl', 'завдання'],
    flowchart: ['flow', 'algorithm', 'блок-схема', 'алгоритм'],
    browser: ['web', 'html', 'search', 'інтернет', 'сайт'],
  };

  function articleById(id) {
    return articles.find((article) => article.id === id);
  }

  function link(article, className = 'wiki-article-link') {
    return el('a.' + className, { href: '#' + encodeURIComponent(article.id) },
      icon(article.icon), el('span', article.title));
  }

  function matchingArticles(query) {
    const normalizedQuery = normalize(query);
    const words = normalizedQuery.split(/\s+/).filter(Boolean);
    if (!words.length) return articles;
    return articles.map((article) => {
      const value = normalize([article.title, ...article.lines, ...(topicWords[article.id.replace(/^app-/, '')] || [])].join(' '));
      const normalizedTitle = normalize(article.title);
      if (!words.every((word) => value.includes(word))) return null;
      const score = normalizedTitle === normalizedQuery ? 100
        : normalizedTitle.startsWith(normalizedQuery) ? 70
          : normalizedTitle.includes(normalizedQuery) ? 50
            : words.every((word) => normalizedTitle.includes(word)) ? 30 : 10;
      return { article, score };
    }).filter(Boolean).sort((a, b) => b.score - a.score
      || a.article.title.localeCompare(b.article.title, locale)).map((item) => item.article);
  }

  function sourceSection() {
    return el('section.wiki-source#sources',
      el('h2', text.sources),
      el('ol', el('li#source-note', text.source)));
  }

  function relatedArticles(article) {
    const topics = new Set(topicWords[article.id.replace(/^app-/, '')] || []);
    const articleWords = new Set(normalize([article.title, ...article.lines].join(' ')).split(' '));
    const related = articles.filter((candidate) => candidate.id !== article.id).map((candidate) => {
      const candidateTopics = new Set(topicWords[candidate.id.replace(/^app-/, '')] || []);
      let score = 0;
      for (const topic of candidateTopics) if (topics.has(topic)) score += 3;
      for (const topic of topics) if (normalize(candidate.title + ' ' + candidate.lines.join(' ')).includes(normalize(topic))) score += 1;
      const titleWords = normalize(candidate.title).split(' ');
      for (const word of titleWords) if (word.length > 3 && articleWords.has(word)) score += 1;
      if (candidate.group === article.group) score += 1;
      return { article: candidate, score };
    }).sort((a, b) => b.score - a.score || a.article.title.localeCompare(b.article.title, locale));
    return related.slice(0, 5).filter((item) => item.score > 0).map((item) => item.article);
  }

  function renderArticle(article) {
    const heading = el('h1#firstHeading', { tabindex: '-1' }, article.title);
    const intro = article.lines[0] || '';
    const body = article.lines.slice(1);
    const contents = el('ol',
      el('li', el('a', { href: '#description' }, text.description)),
      body.length > 1 ? el('li', el('a', { href: '#how-to-use' }, text.how)) : null,
      el('li', el('a', { href: '#sources' }, text.sources)));
    const sections = [
      el('nav.mw-toc', { 'aria-label': text.contents }, el('h2', text.contents), contents),
      el('section#description', el('h2', text.description), body[0] ? el('p', body[0]) : null),
    ];
    if (body.length > 1) {
      sections.push(el('section#how-to-use', el('h2', text.how), ...body.slice(1).map((line) => el('p', line))));
    }
    sections.push(sourceSection());
    const related = relatedArticles(article);
    const relatedList = related.length ? el('ul', related.map((item) => el('li', link(item)))) : el('p', text.noResults);
    const citation = el('sup.wiki-citation', el('a', { href: '#source-note', 'aria-label': text.sourceLabel + ' 1' }, '[1]'));
    const articleMain = el('div.mw-article-main', el('p.mw-intro', intro, ' ', citation), ...sections);
    const sidebar = el('aside.mw-sidebar',
      el('section.mw-card', el('h2', text.more), relatedList));
    const header = el('header.mw-article-heading',
      el('div.mw-title-line', heading, el('span.mw-article-icon', icon(article.icon))),
      el('div.mw-title-meta', groups[article.group]));
    const content = el('article.mw-body', header, el('div.mw-content', articleMain, sidebar));
    removeSearchPreview();
    headerSearch.value = '';
    main.replaceChildren(content);
    document.title = article.title + ' — ' + text.pageTitle;
    return heading;
  }

  function renderIndex(query = headerSearch.value) {
    const results = matchingArticles(query);
    const status = query.trim()
      ? el('p.mw-search-status', { role: 'status' }, text.found + ' · ' + results.length)
      : null;
    const sections = Object.entries(groups).flatMap(([id, label]) => {
      const items = results.filter((article) => article.group === id);
      return items.length ? [el('section.mw-index-group',
        el('h2', label, el('span', { className: 'mw-count' }, String(items.length))),
        el('ul', items.map((article) => el('li', link(article)))))] : [];
    });
    const noResults = results.length ? null : el('p.mw-empty', { role: 'status' }, text.noResults);
    const page = el('div.mw-index-page',
      el('div.mw-welcome', el('h1#firstHeading', { tabindex: '-1' }, text.pageTitle),
        el('p', text.intro),
        el('p.mw-help', phrase('Шукай назву або слово з пояснення статті.', 'Search by title or a word in an article.'))),
      status, noResults, el('div.mw-index-grid', sections));
    main.replaceChildren(page);
    document.title = text.pageTitle;
    return page.querySelector('h1');
  }

  function render(focus) {
    let id;
    try {
      id = decodeURIComponent(window.location.hash.slice(1));
    } catch {
      id = '';
    }
    const article = articleById(id);
    const heading = article ? renderArticle(article) : renderIndex();
    if (focus) {
      window.scrollTo(0, 0);
      heading.focus({ preventScroll: true });
    }
  }

  function showIndex() {
    if (location.hash) history.replaceState(null, '', location.pathname + location.search);
    removeSearchPreview();
    headerSearch.value = '';
    const heading = renderIndex('');
    headerSearch.focus({ preventScroll: true });
    return heading;
  }

  function removeSearchPreview() {
    searchPreview?.remove();
    searchPreview = null;
  }

  function submitSearch(event) {
    event.preventDefault();
    removeSearchPreview();
    const query = headerSearch.value.trim();
    if (location.hash) history.replaceState(null, '', location.pathname + location.search);
    renderIndex(query);
    const heading = main.querySelector('#firstHeading');
    heading?.focus({ preventScroll: true });
    main.scrollIntoView({ block: 'start' });
    headerSearch.focus({ preventScroll: true });
  }

  $('#wiki-top-search').addEventListener('submit', submitSearch);
  headerSearch.addEventListener('input', () => {
    removeSearchPreview();
    if (!location.hash) renderIndex();
    else {
      const results = matchingArticles(headerSearch.value);
      if (headerSearch.value.trim()) {
        searchPreview = el('div.mw-search-preview',
          el('span', { role: 'status' }, text.found + ' · ' + results.length),
          results.length ? el('ul', results.slice(0, 5).map((article) => el('li', link(article, 'mw-preview-link'))))
            : el('p', text.noResults));
        headerSearch.after(searchPreview);
      }
    }
  });
  $('#wiki-all-link').addEventListener('click', (event) => { event.preventDefault(); showIndex(); });
  document.querySelectorAll('.wiki-brand, .wiki-tabs-inner a').forEach((tab) => {
    tab.addEventListener('click', (event) => { event.preventDefault(); showIndex(); });
  });
  window.addEventListener('hashchange', () => {
    const fragment = decodeURIComponentSafe(window.location.hash.slice(1));
    const section = fragment && document.getElementById(fragment);
    if (section && main.contains(section) && section.tagName !== 'ARTICLE') {
      section.scrollIntoView({ block: 'start' });
      return;
    }
    removeSearchPreview();
    render(true);
  });
  render(false);

  function decodeURIComponentSafe(value) {
    try {
      return decodeURIComponent(value);
    } catch {
      return '';
    }
  }
})();
