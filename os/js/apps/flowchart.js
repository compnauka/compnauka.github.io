/* Віконце — навчальний редактор блок-схем. */
(function () {
  'use strict';
  const VOS = window.VOS;
  const { tr } = VOS.i18n;
  const { el, fs } = VOS;
  const WIDTH = 920, HEIGHT = 620, BLOCK_W = 164, BLOCK_H = 68;
  const MAX_BLOCKS = 30, MAX_TEXT = 64;
  const TYPES = {
    start: tr('Початок'), action: tr('Дія'), decision: tr('Умова'), end: tr('Кінець'),
  };
  const LABELS = { next: tr('Далі'), yes: tr('Так'), no: tr('Ні') };
  const branches = (type) => type === 'decision' ? ['yes', 'no'] : type === 'end' ? [] : ['next'];
  const empty = () => ({ version: 1, blocks: [], links: [] });
  const limitX = (x) => VOS.clamp(x, 10, WIDTH - BLOCK_W - 10);
  const limitY = (y) => VOS.clamp(y, 10, HEIGHT - BLOCK_H - 10);

  function read(content) {
    const graph = JSON.parse(content);
    if (graph?.version !== 1 || !Array.isArray(graph.blocks) || !Array.isArray(graph.links)
      || graph.blocks.length > MAX_BLOCKS || graph.links.length > MAX_BLOCKS * 2) throw Error();
    const blocks = new Map();
    let starts = 0;
    for (const { id, type, text, x, y } of graph.blocks) {
      if (!Number.isSafeInteger(id) || id < 1 || id > 1e9 || blocks.has(id) || !Object.hasOwn(TYPES, type)
        || typeof text !== 'string' || text.length > MAX_TEXT || !Number.isFinite(x) || !Number.isFinite(y)) throw Error();
      if (type === 'start' && ++starts > 1) throw Error();
      blocks.set(id, { id, type, text, x: limitX(x), y: limitY(y) });
    }
    const outlets = new Set();
    const links = graph.links.map(({ from, to, branch }) => {
      const key = from + '/' + branch;
      if (!blocks.has(from) || !blocks.has(to) || from === to || outlets.has(key)
        || !branches(blocks.get(from).type).includes(branch)) throw Error();
      outlets.add(key);
      return { from, to, branch };
    });
    return { version: 1, blocks: [...blocks.values()], links };
  }

  function example() {
    const blocks = [
      [1, 'start', TYPES.start, 30, 15],
      [2, 'decision', tr('На вулиці дощ?'), 30, 110],
      [3, 'action', tr('Візьми парасолю'), 196, 208],
      [4, 'action', tr('Виходь на прогулянку'), 30, 308],
      [5, 'end', TYPES.end, 30, 403],
    ].map(([id, type, text, x, y]) => ({ id, type, text, x, y }));
    const links = [[1, 2, 'next'], [2, 3, 'yes'], [2, 4, 'no'], [3, 4, 'next'], [4, 5, 'next']]
      .map(([from, to, branch]) => ({ from, to, branch }));
    return { version: 1, blocks, links };
  }

  function anchor(node, dx, dy) {
    const x = Math.abs(dx) / (BLOCK_W / 2);
    const y = Math.abs(dy) / (BLOCK_H / 2);
    const scale = node.type === 'decision' ? x + y : Math.max(x, y);
    return { x: node.x + BLOCK_W / 2 + dx / (scale || 1), y: node.y + BLOCK_H / 2 + dy / (scale || 1) };
  }

  function drawLinks(ctx, graph, color, paper) {
    ctx.clearRect(0, 0, WIDTH, HEIGHT);
    ctx.strokeStyle = ctx.fillStyle = color;
    ctx.lineWidth = 2;
    ctx.font = '700 13px system-ui';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const blocks = new Map(graph.blocks.map((block) => [block.id, block]));
    for (const link of graph.links) {
      const shared = link.branch !== 'next' && graph.links.some((other) => other.from === link.from && other.to === link.to && other !== link);
      if (shared && link.branch === 'no') continue;
      const from = blocks.get(link.from), to = blocks.get(link.to);
      const dx = to.x - from.x, dy = to.y - from.y;
      if (Math.hypot(dx, dy) < 20) continue;
      const a = anchor(from, dx, dy), b = anchor(to, -dx, -dy);
      if ((b.x - a.x) * dx + (b.y - a.y) * dy <= 0) continue;
      const angle = Math.atan2(b.y - a.y, b.x - a.x);
      ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(b.x, b.y);
      for (const side of [-1, 1]) ctx.lineTo(b.x - 11 * Math.cos(angle + side * .48), b.y - 11 * Math.sin(angle + side * .48));
      ctx.fill();
      if (link.branch === 'next') continue;
      const x = (a.x + b.x) / 2, y = (a.y + b.y) / 2;
      const label = shared ? LABELS.yes + ' / ' + LABELS.no : LABELS[link.branch];
      const w = ctx.measureText(label).width + 12;
      ctx.fillStyle = paper;
      ctx.fillRect(x - w / 2, y - 9, w, 18);
      ctx.fillStyle = color;
      ctx.fillText(label, x, y);
    }
  }

  function launch(args) {
    let graph = empty(), fileId = null, saved = JSON.stringify(graph);
    let selected = null, linking = null, walking = null, drag = null, saving = null;
    const history = [];
    const nodes = () => graph.blocks;
    const getBlock = (id) => nodes().find((block) => block.id === id);
    const linkFor = (id, branch) => graph.links.find((link) => link.from === id && link.branch === branch);
    const dirty = () => saved !== JSON.stringify(graph);
    const canvas = el('canvas.fc-arrows', { width: WIDTH, height: HEIGHT, 'aria-hidden': 'true' });
    const layer = el('div.fc-blocks');
    const paper = el('div.fc-paper', { style: { width: WIDTH + 'px', height: HEIGHT + 'px' } }, canvas, layer);
    const viewport = el('div.fc-view', { tabindex: '0', 'aria-label': tr('Поле блок-схеми') }, paper);
    const inspector = el('div.fc-inspector');
    const status = el('div.fc-status', { role: 'status' });
    const button = (label, action, primary = false) => el('button.btn.fc-button' + (primary ? '.btn-primary' : ''),
      { type: 'button', on: { click: action } }, label);
    const saveBtn = button(tr('Зберегти'), () => save(), true);
    const undoBtn = button(tr('Скасувати дію'), () => {
      const previous = history.pop();
      if (previous) replace(previous);
    });
    const walkBtn = button(tr('Пройти схему'), () => {
      linking = null;
      walking = nodes().find((block) => block.type === 'start')?.id || null;
      selected = walking;
      render();
      if (walking) reveal(walking);
    });
    const tools = el('div.fc-tools',
      el('div.fc-tool-group', button(tr('Створити'), () => changeDocument(empty())),
        button(tr('Відкрити'), open), saveBtn, undoBtn),
      el('div.fc-tool-group', button(tr('Приклад'), () => changeDocument(example())), walkBtn));
    const addButtons = Object.entries(TYPES).map(([type, label]) => button(label, () => add(type)));
    const root = el('div.app-flowchart', tools,
      el('div.fc-palette', { role: 'group', 'aria-label': tr('Додати блок') }, el('span', tr('Додати блок')), addButtons),
      el('div.fc-work', viewport, inspector), status);

    function snapshot() {
      history.push(structuredClone(graph));
      if (history.length > 40) history.shift();
    }

    function replace(next) {
      graph = next;
      selected = linking = walking = null;
      render();
    }

    function updateTitle() {
      win.setTitle((dirty() ? '• ' : '') + (fs.get(fileId)?.name || tr('Блок-схема')));
    }

    function save() {
      if (saving) return saving;
      const content = JSON.stringify(graph);
      const pending = (async () => {
        try {
          const current = fs.get(fileId);
          if (current && !fs.isInTrash(fileId)) fs.write(fileId, content);
          else {
            const choice = await VOS.dialog.saveAs({ ext: 'flow', name: current?.name || tr('Моя схема.flow'), folder: 'docs' });
            if (!choice) return false;
            fileId = choice.replaceId || fs.createFile(choice.folder, choice.name, content).id;
            if (choice.replaceId) fs.write(fileId, content);
          }
          await fs.flush();
          saved = content;
          updateTitle();
          VOS.toast(tr('Збережено: ') + fs.get(fileId).name, 'save');
          return true;
        } catch (error) {
          VOS.dialog.error(error.message || tr('Не вдалося зберегти файл.'));
          return false;
        }
      })();
      saving = pending;
      return pending.finally(() => { if (saving === pending) saving = null; });
    }

    async function canLeave() {
      if (saving) await saving;
      if (!dirty()) return true;
      const answer = await VOS.dialog.choice(tr('Зберегти зміни у схемі?'), [
        { label: tr('Зберегти'), value: 'save', primary: true },
        { label: tr('Не зберігати'), value: 'discard' },
        { label: tr('Скасувати'), value: 'cancel' },
      ]);
      return answer === 'discard' || (answer === 'save' && await save() && !dirty());
    }

    function load(id) {
      const file = fs.get(id);
      if (!file || fs.isInTrash(id)) return;
      let next;
      try { next = read(file.content); }
      catch { VOS.dialog.error(tr('Не вдалося відкрити цю блок-схему.')); return; }
      fileId = id;
      saved = JSON.stringify(next);
      history.length = 0;
      replace(next);
    }

    async function open() {
      if (!await canLeave()) return;
      const id = await VOS.dialog.openFile({ exts: ['flow'], folder: fs.get(fileId)?.parent || 'docs' });
      if (id) load(id);
    }

    async function changeDocument(next) {
      if (!await canLeave()) return;
      fileId = null;
      saved = JSON.stringify(empty());
      history.length = 0;
      viewport.scrollTo(0, 0);
      replace(next);
    }

    function reveal(id) {
      const element = layer.querySelector('[data-block="' + id + '"]');
      element?.focus({ preventScroll: true });
      element?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    }

    function add(type) {
      if (nodes().length >= MAX_BLOCKS) return;
      snapshot();
      const id = Array.from({ length: MAX_BLOCKS }, (_, index) => index + 1).find((candidate) => !getBlock(candidate));
      const i = nodes().length;
      const spot = Array.from({ length: 30 }, (_, j) => ({ x: 24 + ((i + j) % 4) * 212, y: 25 + (Math.floor((i + j) / 4) % 6) * 100 }))
        .find(({ x, y }) => !nodes().some((block) => Math.abs(block.x - x) < BLOCK_W && Math.abs(block.y - y) < BLOCK_H));
      nodes().push({ id, type, text: TYPES[type], x: spot?.x ?? 24, y: spot?.y ?? 25 });
      selected = id;
      render();
      reveal(id);
    }

    function choose(id) {
      if (walking) return;
      if (linking && linking.from !== id) {
        snapshot();
        graph.links = graph.links.filter((link) => link.from !== linking.from || link.branch !== linking.branch);
        graph.links.push({ ...linking, to: id });
        linking = null;
      } else if (!linking) selected = id;
      const focus = selected;
      render();
      if (focus) reveal(focus);
    }

    function repaint() {
      const css = getComputedStyle(root);
      drawLinks(canvas.getContext('2d'), graph, css.getPropertyValue('--fc-ink'), css.getPropertyValue('--fc-paper'));
    }

    function positionBlock(element, block) {
      element.style.left = block.x + 'px';
      element.style.top = block.y + 'px';
    }

    function renderBlocks() {
      layer.replaceChildren(...nodes().map((block) => {
        const item = el('button.fc-node.fc-' + block.type, {
          type: 'button', dataset: { block: block.id },
          'aria-label': TYPES[block.type] + ': ' + block.text, 'aria-pressed': String(selected === block.id),
          on: { click: () => { if (!drag?.moved) choose(block.id); }, pointerdown: (event) => beginDrag(event, block, item) },
        }, el('span', block.text));
        item.classList.toggle('fc-current', walking === block.id);
        positionBlock(item, block);
        return item;
      }));
      repaint();
    }

    function beginDrag(event, block, item) {
      if (event.button !== 0 || linking || walking || drag) return;
      const { pointerId, clientX, clientY } = event;
      const { x, y } = block;
      const state = drag = { moved: false };
      item.setPointerCapture(pointerId);
      const move = (next) => {
        if (next.pointerId !== pointerId) return;
        const dx = next.clientX - clientX, dy = next.clientY - clientY;
        if (!state.moved && Math.hypot(dx, dy) < 5) return;
        if (!state.moved) { snapshot(); state.moved = true; }
        block.x = limitX(x + dx);
        block.y = limitY(y + dy);
        positionBlock(item, block);
        repaint();
      };
      const finish = (next) => {
        if (next.pointerId !== pointerId) return;
        item.removeEventListener('pointermove', move);
        item.removeEventListener('pointerup', finish);
        item.removeEventListener('pointercancel', finish);
        if (state.moved) {
          selected = block.id;
          render();
          reveal(block.id);
        }
        setTimeout(() => { if (drag === state) drag = null; }, 0);
      };
      item.addEventListener('pointermove', move);
      item.addEventListener('pointerup', finish);
      item.addEventListener('pointercancel', finish);
    }

    function renderInspector() {
      const block = getBlock(walking || selected);
      inspector.replaceChildren();
      if (!block) {
        inspector.append(el('p', nodes().length
          ? tr('Вибери блок, щоб змінити текст або додати стрілку.')
          : tr('Додай блок або відкрий приклад.')));
        return;
      }
      if (walking) {
        inspector.append(el('strong', block.text));
        for (const branch of branches(block.type)) {
          const step = linkFor(block.id, branch);
          const next = button(LABELS[branch], () => { selected = walking = step.to; render(); reveal(walking); });
          next.disabled = !step;
          inspector.append(next);
        }
        if (block.type === 'end') inspector.append(el('p', tr('Ти дійшов до кінця схеми.')));
        else if (branches(block.type).some((branch) => !linkFor(block.id, branch))) inspector.append(el('p', tr('У цьому блоці бракує стрілки.')));
        inspector.append(button(tr('Завершити перевірку'), () => { walking = null; render(); }));
        return;
      }
      const field = el('input.input', { maxlength: MAX_TEXT, value: block.text, 'aria-label': tr('Текст блока') });
      field.addEventListener('change', () => {
        const text = field.value.trim() || TYPES[block.type];
        if (text === block.text) return;
        snapshot();
        block.text = text;
        renderBlocks();
        updateTitle();
        undoBtn.disabled = false;
      });
      inspector.append(el('label.fc-field', TYPES[block.type], field));
      for (const branch of branches(block.type)) {
        const link = linkFor(block.id, branch);
        const connect = button(tr('Стрілка · ') + LABELS[branch], () => {
          linking = { from: block.id, branch };
          render();
          reveal(block.id);
        });
        const remove = link ? button(tr('Прибрати'), () => {
          snapshot();
          graph.links = graph.links.filter((edge) => edge !== link);
          linking = null;
          render();
        }) : null;
        inspector.append(el('div.fc-outlet', connect, remove,
          link ? el('small', '→ ' + getBlock(link.to).text) : null));
      }
      inspector.append(button(tr('Видалити блок'), removeBlock));
    }

    function removeBlock() {
      if (!selected || walking) return;
      snapshot();
      graph.blocks = nodes().filter((block) => block.id !== selected);
      graph.links = graph.links.filter((link) => link.from !== selected && link.to !== selected);
      selected = linking = null;
      render();
    }

    function render() {
      renderBlocks();
      renderInspector();
      paper.classList.toggle('fc-connecting', !!linking);
      addButtons.forEach((control, i) => {
        control.disabled = !!walking || nodes().length >= MAX_BLOCKS || (i === 0 && nodes().some((block) => block.type === 'start'));
      });
      undoBtn.disabled = !history.length || !!walking;
      walkBtn.disabled = !!walking || !nodes().some((block) => block.type === 'start');
      status.replaceChildren(linking ? el('span', tr('Вибери блок, до якого має вести стрілка.')) : '',
        linking ? button(tr('Скасувати'), () => { linking = null; render(); }) : '');
      status.hidden = !linking;
      updateTitle();
    }

    root.addEventListener('keydown', (event) => {
      if ((event.ctrlKey || event.metaKey) && event.code === 'KeyS') {
        event.preventDefault();
        if (event.target.matches('input')) event.target.blur();
        save();
      } else if (event.key === 'Escape' && linking) {
        linking = null;
        render();
      } else if (event.key === 'Delete' && !event.target.matches('input')) removeBlock();
    });
    paper.addEventListener('click', (event) => {
      if (event.target === layer && !linking && !walking) { selected = null; render(); }
    });

    const offTheme = VOS.bus.on('settings:change', ({ key }) => { if (key === 'theme') repaint(); });
    const win = VOS.wm.open({
      app: 'flowchart', title: tr('Блок-схема'), icon: 'layout', content: root, width: 860, height: 640,
      minWidth: 320, minHeight: 310, beforeClose: canLeave, onClose: offTheme,
    });
    render();
    if (args.file) load(args.file);
    return win;
  }

  VOS.apps.register({ id: 'flowchart', name: 'Блок-схема', icon: 'layout', color: '#0f766e',
    category: 'creative', desc: tr('Малюй алгоритми, додавай стрілки й перевіряй маршрути'), launch });
})();
