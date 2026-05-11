import { buildQuizElement, checkAnswer } from './quiz.js';
import { buildClassifierActivity } from './activity-classifier.js';
import { buildTwentyQuestionsActivity } from './activity-20questions.js';

// ---------- BLOCK RENDERING ----------

function renderSegments(segments) {
  const frag = document.createDocumentFragment();
  segments.forEach(seg => {
    if (seg.link) {
      const a = document.createElement('a');
      a.href = seg.href;
      a.textContent = seg.text;
      a.className = 'inline-link';
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      frag.appendChild(a);
    } else if (seg.bold) {
      const strong = document.createElement('strong');
      strong.textContent = seg.text;
      frag.appendChild(strong);
    } else {
      frag.appendChild(document.createTextNode(seg.text));
    }
  });
  return frag;
}

function buildListItem(item) {
  const li = document.createElement('li');
  if (typeof item === 'string') {
    li.textContent = item;
  } else if (Array.isArray(item)) {
    li.appendChild(renderSegments(item));
  }
  return li;
}

function renderBlock(block) {
  switch (block.type) {
    case 'paragraph': {
      const p = document.createElement('p');
      p.className = 'block-paragraph' + (block.bold ? ' block-paragraph--bold' : '');
      p.textContent = block.text;
      return p;
    }
    case 'list': {
      const ul = document.createElement('ul');
      ul.className = 'block-list';
      block.items.forEach(item => ul.appendChild(buildListItem(item)));
      return ul;
    }
    case 'ordered-list': {
      const ol = document.createElement('ol');
      ol.className = 'block-ordered-list';
      block.items.forEach(item => ol.appendChild(buildListItem(item)));
      return ol;
    }
    case 'quote': {
      const div = document.createElement('div');
      div.className = 'block-quote';
      block.lines.forEach((line, i) => {
        div.appendChild(document.createTextNode(line));
        if (i < block.lines.length - 1) {
          div.appendChild(document.createElement('br'));
          div.appendChild(document.createElement('br'));
        }
      });
      return div;
    }
    case 'heading': {
      const h = document.createElement('h3');
      h.className = 'block-heading';
      h.textContent = block.text;
      return h;
    }
    case 'definition': {
      const p = document.createElement('p');
      const strong = document.createElement('strong');
      strong.textContent = block.term + ':';
      p.appendChild(strong);
      p.appendChild(document.createTextNode(' ' + block.text));
      return p;
    }
    case 'highlight': {
      const p = document.createElement('p');
      p.className = 'block-highlight';
      p.textContent = block.text;
      return p;
    }
    case 'table': {
      const wrapper = document.createElement('div');
      wrapper.className = 'block-table-wrap';
      const table = document.createElement('table');
      table.className = 'block-table';
      if (block.headers) {
        const thead = document.createElement('thead');
        const tr = document.createElement('tr');
        block.headers.forEach(h => {
          const th = document.createElement('th');
          th.textContent = h;
          tr.appendChild(th);
        });
        thead.appendChild(tr);
        table.appendChild(thead);
      }
      if (block.rows) {
        const tbody = document.createElement('tbody');
        block.rows.forEach(row => {
          const tr = document.createElement('tr');
          row.forEach(cell => {
            const td = document.createElement('td');
            td.textContent = cell;
            tr.appendChild(td);
          });
          tbody.appendChild(tr);
        });
        table.appendChild(tbody);
      }
      wrapper.appendChild(table);
      return wrapper;
    }
    default:
      return null;
  }
}

function renderBlocks(blocks) {
  const frag = document.createDocumentFragment();
  blocks.forEach(block => {
    const el = renderBlock(block);
    if (el) frag.appendChild(el);
  });
  return frag;
}

// ---------- MEDIA ----------

function buildImage(src, alt) {
  const img = document.createElement('img');
  img.src = src;
  img.alt = alt || '';
  img.className = 'msg__img';
  img.loading = 'lazy';
  img.addEventListener('error', () => { img.style.display = 'none'; });
  return img;
}

function buildAudio(src, description) {
  const wrapper = document.createElement('div');
  wrapper.className = 'msg__audio';

  const audio = document.createElement('audio');
  audio.controls = true;
  audio.preload = 'none';
  audio.className = 'msg__audio-player';
  audio.setAttribute('aria-label', description || 'Аудіо');
  audio.src = src;

  // Fallback when audio file is unavailable
  audio.addEventListener('error', () => {
    const fallback = document.createElement('p');
    fallback.className = 'audio-unavailable';
    fallback.textContent = '🎧 ' + (description || 'Аудіофайл недоступний');
    if (wrapper.contains(audio)) wrapper.replaceChild(fallback, audio);
  });

  wrapper.appendChild(audio);

  if (description) {
    const p = document.createElement('p');
    p.className = 'msg__audio-desc';
    p.textContent = description;
    wrapper.appendChild(p);
  }

  return wrapper;
}

// ---------- COVER ----------

function buildCover(msg, onStart) {
  const wrapper = document.createElement('div');
  wrapper.className = 'cover fade-in';

  const imgContainer = document.createElement('div');
  imgContainer.className = 'cover__img-wrap';

  const img = document.createElement('img');
  img.src = msg.image;
  img.alt = msg.alt || '';
  img.className = 'cover__img';
  img.style.maxHeight = '350px';
  img.setAttribute('fetchpriority', 'high');
  imgContainer.appendChild(img);
  wrapper.appendChild(imgContainer);

  const h1 = document.createElement('h1');
  h1.className = 'cover__title';
  h1.textContent = msg.title;
  wrapper.appendChild(h1);

  const subtitle = document.createElement('p');
  subtitle.className = 'cover__subtitle';
  subtitle.textContent = msg.subtitle;
  wrapper.appendChild(subtitle);

  if (msg.author) {
    const author = document.createElement('p');
    author.className = 'cover__subtitle';
    author.textContent = msg.author;
    wrapper.appendChild(author);
  }

  const btn = document.createElement('button');
  btn.className = 'cover__btn';
  btn.textContent = msg.action;

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('class', 'cover__btn-icon');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('aria-hidden', 'true');
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('stroke-linecap', 'round');
  path.setAttribute('stroke-linejoin', 'round');
  path.setAttribute('stroke-width', '2');
  path.setAttribute('d', 'M14 5l7 7m0 0l-7 7m7-7H3');
  svg.appendChild(path);
  btn.appendChild(svg);

  btn.addEventListener('click', onStart);
  wrapper.appendChild(btn);

  return wrapper;
}

// ---------- DIALOG BUBBLE ----------

function buildAvatar(type) {
  const div = document.createElement('div');
  div.className = 'msg__avatar ' + (type === 'user' ? 'msg__avatar--user' : 'msg__avatar--ai');
  div.textContent = type === 'user' ? 'Т' : 'ШІ';
  return div;
}

function buildContentNode(msg) {
  const div = document.createElement('div');
  div.className = 'msg__content';

  if (msg.blocks) {
    div.appendChild(renderBlocks(msg.blocks));
  } else if (msg.content) {
    const p = document.createElement('p');
    p.textContent = msg.content;
    div.appendChild(p);
  }

  if (msg.image) div.appendChild(buildImage(msg.image, msg.alt));
  if (msg.audio) div.appendChild(buildAudio(msg.audio, msg.audioDescription));

  return div;
}

function buildDialogBubble(msg) {
  const isUser = msg.type === 'user';
  const isNote = msg.type === 'note';

  const wrapper = document.createElement('div');
  wrapper.className = 'msg fade-in-up ' + (isUser ? 'msg--user' : isNote ? 'msg--note' : 'msg--ai');

  const contentDiv = document.createElement('div');
  contentDiv.className = 'msg__col' + (isNote ? ' msg__col--note' : '');

  if (isNote) {
    const bubble = document.createElement('div');
    bubble.className = 'msg-note';

    const iconWrapper = document.createElement('div');
    iconWrapper.className = 'msg-note__icon-wrap';
    const iconSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    iconSvg.setAttribute('class', 'msg-note__icon');
    iconSvg.setAttribute('fill', 'none');
    iconSvg.setAttribute('viewBox', '0 0 24 24');
    iconSvg.setAttribute('stroke', 'currentColor');
    const iconPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    iconPath.setAttribute('stroke-linecap', 'round');
    iconPath.setAttribute('stroke-linejoin', 'round');
    iconPath.setAttribute('stroke-width', '2');
    iconPath.setAttribute('d', 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z');
    iconSvg.appendChild(iconPath);
    iconWrapper.appendChild(iconSvg);

    const inner = document.createElement('div');
    inner.className = 'msg-note__body';
    inner.appendChild(buildContentNode(msg));

    bubble.appendChild(iconWrapper);
    bubble.appendChild(inner);
    contentDiv.appendChild(bubble);
  } else {
    const row = document.createElement('div');
    row.className = 'msg__row' + (isUser ? ' msg__row--user' : '');

    const bubble = document.createElement('div');
    bubble.className = 'msg__bubble ' + (isUser ? 'msg__bubble--user' : 'msg__bubble--ai');
    bubble.appendChild(buildContentNode(msg));

    if (!isUser) row.appendChild(buildAvatar('ai'));
    row.appendChild(bubble);
    if (isUser) row.appendChild(buildAvatar('user'));

    contentDiv.appendChild(row);
  }

  wrapper.appendChild(contentDiv);
  return wrapper;
}

// ---------- NARRATOR ----------

function buildNarrator(msg) {
  const div = document.createElement('div');
  div.className = 'msg-narrator fade-in-up';

  if (msg.blocks) {
    div.appendChild(renderBlocks(msg.blocks));
  } else if (msg.content) {
    const p = document.createElement('p');
    p.textContent = msg.content;
    div.appendChild(p);
  }

  if (msg.image) div.appendChild(buildImage(msg.image, msg.alt));

  return div;
}

// ---------- PUBLIC API ----------

export function appendMessage(msg, chatWindow, onStart) {
  if (msg.type === 'cover') {
    chatWindow.appendChild(buildCover(msg, onStart));
    return;
  }

  if (msg.type === 'quiz') {
    chatWindow.appendChild(buildQuizElement(msg.content, checkAnswer));
    return;
  }

  if (msg.type === 'narrator') {
    chatWindow.appendChild(buildNarrator(msg));
    return;
  }

  if (msg.type === 'activity') {
    const builders = {
      classifier:    buildClassifierActivity,
      '20questions': buildTwentyQuestionsActivity,
    };
    const build = builders[msg.activityType];
    if (build) chatWindow.appendChild(build(msg.content));
    return;
  }

  chatWindow.appendChild(buildDialogBubble(msg));
}
