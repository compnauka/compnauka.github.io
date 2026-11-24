/* Віконце — реєстр програм і асоціації файлів. */
(function () {
  'use strict';
  const VOS = window.VOS;
  const { tr } = VOS.i18n;
  const registry = {};

  const CATEGORIES = [
    { id: 'standard', name: tr('Стандартні') },
    { id: 'creative', name: tr('Творчість') },
    { id: 'trainers', name: tr('Тренажери') },
    { id: 'games', name: tr('Ігри') },
    { id: 'system', name: tr('Система') },
  ];

  /** def: {id, name, icon, color, category, desc, launch(args), url, width, height, exts, hidden} */
  function register(def) {
    def.sourceName = def.name;
    def.name = tr(def.name);
    registry[def.id] = def;
    if (!def.launch && def.url) {
      def.launch = (args) => {
        const win = VOS.wm.open({
          app: def.id, title: def.name, icon: def.icon, url: def.url,
          width: def.width || 960, height: def.height || 640, minWidth: 320, minHeight: 240,
          singleton: def.singleton === false ? null : def.id,
        });
        if (args && args.file && VOS.bridge) VOS.bridge.feed(win, args.file); // файл з Віконця → у програму сайту
        return win;
      };
    }
    return def;
  }

  const get = (id) => registry[id] || null;
  const name = (id) => (registry[id] ? registry[id].name : tr('Невідома програма'));
  const list = (cat) => Object.values(registry).filter((a) => !a.hidden && (!cat || a.category === cat));

  function launch(id, args) {
    const a = registry[id];
    if (!a) {
      VOS.dialog.error(tr('Програму не знайдено. Можливо, її видалили.'));
      return null;
    }
    VOS.bus.emit('app:launch', { app: id, args: args || null });
    try {
      return a.launch(args || {});
    } catch (e) {
      console.error(e);
      VOS.dialog.error(tr('Програма «') + a.name + tr('» не змогла запуститися.'));
      return null;
    }
  }

  const ASSOC = { txt: 'notepad', png: 'photos', jpg: 'photos', jpeg: 'photos', csv: 'komirnyk', html: 'drukaryk', flow: 'flowchart' };

  function openNode(id) {
    const n = VOS.fs.get(id);
    if (!n) return;
    if (VOS.fs.isInTrash(id)) {
      VOS.dialog.alert(tr('Цей об\'єкт лежить у кошику. Щоб відкрити його, спочатку віднови: права кнопка → «Відновити».'), { title: tr('Кошик'), icon: 'trash' });
      return;
    }
    if (n.type === 'folder') return launch('explorer', { folder: id });
    if (n.type === 'link') {
      if (!n.targetId) return launch(n.app, n.args || {});
      const target = VOS.fs.get(n.targetId);
      if (!target || target.type === 'link' || VOS.fs.isInTrash(n.targetId)) {
        VOS.dialog.alert(tr('Не вдалося відкрити ярлик. Перевір, чи оригінал ще існує і чи його немає в кошику.'), { title: tr('Ярлик'), icon: 'link' });
        return;
      }
      const opened = openNode(target.id);
      const report = (result) => {
        if (result) VOS.bus.emit('file:shortcut-open', { id, targetId: target.id });
        return result;
      };
      return opened instanceof Promise ? opened.then(report) : report(opened);
    }
    if (VOS.fs.ext(n.name) === 'zip') return VOS.transfer.extractZip(id);
    const app = ASSOC[VOS.fs.ext(n.name)];
    if (app) {
      const win = launch(app, { file: id });
      if (win) VOS.bus.emit('file:open', { fileId: id, app, winId: win.id });
      return win;
    }
    VOS.dialog.alert(tr('Не знаю, якою програмою відкрити файл «') + n.name + '».', { title: tr('Невідомий тип файлу'), icon: 'file-unknown' });
  }

  VOS.apps = { CATEGORIES, register, get, name, list, launch, openNode, ASSOC };
})();
