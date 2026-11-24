/* Віконце — власний набір значків (SVG), щоб на всіх пристроях усе виглядало однаково.
   LINE — контурні значки 24×24 (колір = currentColor), ART — кольорові ілюстрації 48×48:
   логотип, Совеня, файли й папки, аватари, наліпки. */
(function () {
  'use strict';
  const VOS = window.VOS;

  /* ---------- Контурні значки ---------- */
  const DOTS = (pts) => pts.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.1" fill="currentColor" stroke="none"/>`).join('');
  const LINE = {
    folder: '<path d="M4 6.5A2.5 2.5 0 0 1 6.5 4H10l2 2h5.5A2.5 2.5 0 0 1 20 8.5v9a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 17.5z"/>',
    'folder-plus': '<path d="M4 6.5A2.5 2.5 0 0 1 6.5 4H10l2 2h5.5A2.5 2.5 0 0 1 20 8.5v9a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 17.5z"/><path d="M12 10v6M9 13h6"/>',
    'folder-open': '<path d="M4 18V6.5A2.5 2.5 0 0 1 6.5 4H10l2 2h5.5A2.5 2.5 0 0 1 20 8.5V10"/><path d="M4 18l2.6-6.6A1.5 1.5 0 0 1 8 10.5h13l-2.8 7.1a1.5 1.5 0 0 1-1.4.9H4.6"/>',
    file: '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/>',
    'file-text': '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h6"/>',
    'file-plus': '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M12 11v6M9 14h6"/>',
    image: '<rect x="3" y="4" width="18" height="16" rx="2.5"/><circle cx="9" cy="10" r="2"/><path d="M21 16l-5-5-9.5 9"/>',
    monitor: '<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8M12 16v4"/>',
    globe: '<circle cx="12" cy="12" r="9"/><ellipse cx="12" cy="12" rx="4" ry="9"/><path d="M3 12h18M5.5 6.5h13M5.5 17.5h13"/>',
    home: '<path d="M3 10.5 12 3l9 7.5M5 9v11h14V9M10 20v-6h4v6"/>',
    books: '<rect x="4" y="4" width="5" height="16" rx="1"/><rect x="9" y="6" width="5" height="14" rx="1"/><path d="M15.2 6.6l3-.8 3.3 12.8-3 .8z"/>',
    trash: '<path d="M4 7h16M10 11v6M14 11v6M5.5 7l1 12a2 2 0 0 0 2 2h7a2 2 0 0 0 2-2l1-12M9 7V4.5A.5.5 0 0 1 9.5 4h5a.5.5 0 0 1 .5.5V7"/>',
    'trash-x': '<path d="M4 7h16M5.5 7l1 12a2 2 0 0 0 2 2h7a2 2 0 0 0 2-2l1-12M9 7V4.5A.5.5 0 0 1 9.5 4h5a.5.5 0 0 1 .5.5V7M10 12l4 4M14 12l-4 4"/>',
    restore: '<path d="M9 14L4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H12"/>',
    undo: '<path d="M9 14L4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H12"/>',
    redo: '<path d="M15 14l5-5-5-5"/><path d="M20 9H9.5a5.5 5.5 0 0 0 0 11H12"/>',
    x: '<path d="M6 6l12 12M18 6L6 18"/>',
    minus: '<path d="M5 12h14"/>',
    square: '<rect x="5" y="5" width="14" height="14" rx="2"/>',
    squares: '<rect x="8" y="4" width="12" height="12" rx="2"/><path d="M16 16v2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2"/>',
    'chevron-left': '<path d="M15 6l-6 6 6 6"/>',
    'chevron-right': '<path d="M9 6l6 6-6 6"/>',
    'chevron-down': '<path d="M6 9l6 6 6-6"/>',
    'arrow-up': '<path d="M12 19V5M6 11l6-6 6 6"/>',
    'arrow-right': '<path d="M5 12h14M13 6l6 6-6 6"/>',
    list: '<path d="M9 6h11M9 12h11M9 18h11"/>' + DOTS([[4.5, 6], [4.5, 12], [4.5, 18]]),
    grid: '<rect x="4" y="4" width="6.5" height="6.5" rx="1.5"/><rect x="13.5" y="4" width="6.5" height="6.5" rx="1.5"/><rect x="4" y="13.5" width="6.5" height="6.5" rx="1.5"/><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.5"/>',
    download: '<path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2M7 11l5 5 5-5M12 4v12"/>',
    upload: '<path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2M7 9l5-5 5 5M12 4v12"/>',
    scissors: '<circle cx="6" cy="7" r="3"/><circle cx="6" cy="17" r="3"/><path d="M8.6 8.6L20 18M8.6 15.4L20 6"/>',
    copy: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/>',
    clipboard: '<path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/>',
    pocket: '<path d="M4 6a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v6a8 8 0 0 1-16 0z"/><path d="M4 9h16"/>',
    pencil:'<path d="M4 20h4L19 9a2.83 2.83 0 0 0-4-4L4 16z"/><path d="M13.5 6.5l4 4"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5"/>' + DOTS([[12, 8]]),
    help: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 0 1 4.9.7c0 1.7-2.4 2-2.4 3.8"/>' + DOTS([[12, 17]]),
    alert: '<path d="M10.3 4.6L2.9 17.5A2 2 0 0 0 4.6 20.5h14.8a2 2 0 0 0 1.7-3L13.7 4.6a2 2 0 0 0-3.4 0z"/><path d="M12 10v4"/>' + DOTS([[12, 17]]),
    check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    sparkles: '<path d="M11 3l1.8 4.7 4.7 1.8-4.7 1.8L11 16l-1.8-4.7L4.5 9.5l4.7-1.8z"/><path d="M18.5 14.5l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8z"/>',
    palette: '<path d="M12 21a9 9 0 1 1 9-9c0 2.5-2 4-4.5 4H15a2 2 0 0 0-1.5 3.3A1.5 1.5 0 0 1 12 21z"/>' + DOTS([[7.5, 11.5], [9.5, 7.5], [14.5, 7.5], [16.8, 11]]),
    settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/>',
    power: '<path d="M12 3v9"/><path d="M7 6.3a8 8 0 1 0 10 0"/>',
    refresh: '<path d="M20 11a8 8 0 0 0-14.9-3.5M4 4v4h4"/><path d="M4 13a8 8 0 0 0 14.9 3.5M20 20v-4h-4"/>',
    users: '<circle cx="9" cy="8" r="4"/><path d="M3 20a6 6 0 0 1 12 0"/><path d="M16 4.2a4 4 0 0 1 0 7.6M21 20a6 6 0 0 0-3.5-5.5"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M5 20a7 7 0 0 1 14 0"/>',
    star: '<path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z"/>',
    trophy: '<path d="M8 4h8v5a4 4 0 0 1-8 0z"/><path d="M8 6H5a3 3 0 0 0 3 4.5M16 6h3a3 3 0 0 1-3 4.5M12 13v4M8 21h8M9 17h6v4H9z"/>',
    printer: '<path d="M7 9V3h10v6"/><rect x="3" y="9" width="18" height="8" rx="2"/><path d="M7 14h10v7H7z"/>',
    bulb: '<path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 0-4 10.5c.7.7 1 1.5 1 2.5h6c0-1 .3-1.8 1-2.5A6 6 0 0 0 12 3z"/>',
    save: '<path d="M5 4h11l3 3v12a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1z"/><path d="M8 4v5h7V4M8 20v-6h8v6"/>',
    brush: '<path d="M15.5 3.5l5 5-8 8-5-5z"/><path d="M7.5 11.5c-2.5 0-3.5 2-3.5 4s-1 3-2 4c3.5.5 8-.5 8-5"/>',
    eraser: '<path d="M8 20h12"/><path d="M4.6 15.4l9-9a2 2 0 0 1 2.8 0l2.2 2.2a2 2 0 0 1 0 2.8L11 19H8.2z"/><path d="M9 11l5 5"/>',
    bucket: '<path d="M5 11l6-6 8 8-6 6a2 2 0 0 1-2.8 0L5 13.8a2 2 0 0 1 0-2.8z"/><path d="M5 12h14"/><path d="M20.5 16s1.5 2 1.5 3a1.5 1.5 0 0 1-3 0c0-1 1.5-3 1.5-3z"/>',
    line: '<path d="M5 19L19 5"/>',
    rect: '<rect x="4" y="6" width="16" height="12" rx="1.5"/>',
    circle: '<ellipse cx="12" cy="12" rx="8.5" ry="7.5"/>',
    mouse: '<rect x="6" y="3" width="12" height="18" rx="6"/><path d="M12 7v4"/>',
    'mouse-buttons': '<rect x="6" y="3" width="12" height="18" rx="6"/><path d="M6 11h12M12 3v8"/>',
    keyboard: '<rect x="2" y="5" width="20" height="14" rx="2.5"/><path d="M7 15.5h10"/>' + DOTS([[6, 9], [10, 9], [14, 9], [18, 9], [8, 12.2], [12, 12.2], [16, 12.2]]),
    puzzle: '<path d="M5 7h3a2 2 0 1 1 4 0h3v3a2 2 0 1 1 0 4v3h-3a2 2 0 1 0-4 0H5v-3a2 2 0 1 0 0-4z"/>',
    table: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 10h18M3 15h18M9 4v16M15 4v16"/>',
    calculator: '<rect x="5" y="3" width="14" height="18" rx="2.5"/><path d="M8.5 7h7v3h-7z"/>' + DOTS([[8.5, 14], [12, 14], [15.5, 14], [8.5, 17.5], [12, 17.5], [15.5, 17.5]]),
    notebook: '<path d="M6 3h11a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6z"/><path d="M10 8h5M10 12h5M10 16h3M4 7h4M4 12h4M4 17h4"/>',
    pixels: '<path d="M4 4h4v4H4zM12 4h4v4h-4zM8 8h4v4H8zM16 8h4v4h-4zM4 12h4v4H4zM12 12h4v4h-4zM8 16h4v4H8zM16 16h4v4h-4z" fill="currentColor" stroke="none"/>',
    layout: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M7 8.5h5M7 12h5M7 15.5h3"/><rect x="14" y="8" width="4" height="8" rx="1"/>',
    letters: '<path d="M3 19l4-12 4 12M4.5 15h5"/><path d="M19 7h-5v12h3a3 3 0 0 0 0-6h-3"/>',
    type: '<path d="M4 7V5h12v2M10 5v14M8 19h4"/><path d="M14 21l.8-3 5-5 2.2 2.2-5 5z"/>',
    piano: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M8 5v9M12 5v9M16 5v9M3 14h18"/>',
    triangles: '<path d="M4 20L12 4l8 16z"/><path d="M12 4v16M8 12h8"/>',
    magic: '<rect x="4" y="4" width="16" height="16" rx="2"/><path d="M4 9.3h16M4 14.7h16M9.3 4v16M14.7 4v16"/>',
    math: '<path d="M5 7h5M7.5 4.5v5M14 7h5M5.5 15.5l4 4M9.5 15.5l-4 4M14 16h5M14 19.5h5"/>',
    gamepad: '<rect x="2" y="7" width="20" height="11" rx="5.5"/><path d="M7 10.5v4M5 12.5h4"/>' + DOTS([[15.5, 11.5], [18, 13.5]]),
    'first-aid': '<rect x="3" y="7" width="18" height="13" rx="2.5"/><path d="M9 7V5h6v2M12 10.5v6M9 13.5h6"/>',
    maze: '<rect x="3" y="3" width="18" height="18" rx="2.5"/><path d="M8 3v9h5M17 7v10H8M12 17v4"/>',
    window: '<rect x="3" y="4" width="18" height="16" rx="2.5"/><path d="M3 9h18"/>' + DOTS([[6.5, 6.5], [9.5, 6.5]]),
    windows: '<rect x="3" y="3" width="12" height="10" rx="2"/><rect x="9" y="11" width="12" height="10" rx="2"/>',
    calendar: '<rect x="4" y="5" width="16" height="16" rx="2.5"/><path d="M16 3v4M8 3v4M4 11h16"/>',
    moon: '<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2.5 12h2M19.5 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
    hand: '<path d="M8 13V5.5a1.5 1.5 0 0 1 3 0V12M11 11.5V4.5a1.5 1.5 0 0 1 3 0V12M14 11.5v-5a1.5 1.5 0 0 1 3 0V14a7 7 0 0 1-7 7h-.8a6 6 0 0 1-5.1-2.9l-2.4-4.2a1.5 1.5 0 0 1 2.5-1.6L8 15"/>',
    archive: '<rect x="3" y="4" width="18" height="4" rx="1"/><path d="M5 8v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8M10 12h4"/>',
    link: '<path d="M7 17L17 7M9 7h8v8"/>',
    sad: '<circle cx="12" cy="12" r="9"/><path d="M9 16.5a4 4 0 0 1 6 0"/>' + DOTS([[9, 10], [15, 10]]),
    smile: '<circle cx="12" cy="12" r="9"/><path d="M8.5 14a4.5 4.5 0 0 0 7 0"/>' + DOTS([[9, 10], [15, 10]]),
    bulb2: '<path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 0-4 10.5c.7.7 1 1.5 1 2.5h6c0-1 .3-1.8 1-2.5A6 6 0 0 0 12 3z"/>',
    pin: '<path d="M9 4h6l-1 5 3 3v2H7v-2l3-3z"/><path d="M12 14v6"/>',
    menu: '<rect x="4" y="4" width="6.5" height="6.5" rx="2"/><rect x="13.5" y="4" width="6.5" height="6.5" rx="2"/><rect x="4" y="13.5" width="6.5" height="6.5" rx="2"/><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="2"/>',
    drag: '<path d="M12 3v18M3 12h18M12 3l-3 3M12 3l3 3M12 21l-3-3M12 21l3-3M3 12l3-3M3 12l3 3M21 12l-3-3M21 12l-3 3"/>',
    resize: '<path d="M14 20h6v-6M20 20L4 4M10 4H4v6"/>',
    'text-size': '<path d="M3 19l5-14 5 14M4.8 14h6.4M15 12h6M18 9v6"/>',
    'text-small': '<path d="M3 19l5-14 5 14M4.8 14h6.4M15 12h6"/>',
    wrap: '<path d="M4 6h16M4 12h13a3 3 0 0 1 0 6h-4M15 16l-2 2 2 2M4 18h5"/>',
    'select-all': '<rect x="4" y="4" width="16" height="16" rx="2" stroke-dasharray="3 3"/><path d="M9 12l2 2 4-4"/>',
    'file-new': '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M12 11v6M9 14h6"/>',
    door: '<path d="M14 4H6a1 1 0 0 0-1 1v15h9"/><path d="M14 4l5 1.5V20l-5 1z"/>' + DOTS([[16.5, 12.5]]),
    camera: '<path d="M4 8h3l2-3h6l2 3h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z"/><circle cx="12" cy="13" r="3.5"/>',
    eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
    backspace: '<path d="M20 5H9l-6 7 6 7h11a1 1 0 0 0 1-1V6a1 1 0 0 0-1-1z"/><path d="M11.5 9.5l5 5M16.5 9.5l-5 5"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  };

  /* ---------- Кольорові ілюстрації (48×48) ---------- */
  const PAGE = '<path d="M11 4h19l11 11v27a3 3 0 0 1-3 3H11a3 3 0 0 1-3-3V7a3 3 0 0 1 3-3z" fill="#fff" stroke="#c3cfdd" stroke-width="1.5"/><path d="M30 4v8.5a2.5 2.5 0 0 0 2.5 2.5H41z" fill="#dde6f2"/>';
  const FOLDER = (front = '#ffc94a', back = '#eea21a') =>
    `<path d="M4 12.5A3.5 3.5 0 0 1 7.5 9h10.6l3.4 3.6h19a3.5 3.5 0 0 1 3.5 3.5V37a3.5 3.5 0 0 1-3.5 3.5h-33A3.5 3.5 0 0 1 4 37z" fill="${back}"/>` +
    `<path d="M4 19a3.5 3.5 0 0 1 3.5-3.5h33A3.5 3.5 0 0 1 44 19v19a3.5 3.5 0 0 1-3.5 3.5h-33A3.5 3.5 0 0 1 4 38z" fill="${front}"/>` +
    '<path d="M4.5 21a3 3 0 0 1 3-3h33a3 3 0 0 1 3 3" stroke="#fff" stroke-opacity=".45" stroke-width="1.5" fill="none"/>';
  const EMB = (inner) => `<g transform="translate(15 20) scale(.75)" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">${inner}</g>`;
  const BIN = '<path d="M11.5 16h25l-2.4 24.6a3.2 3.2 0 0 1-3.2 2.9H17.1a3.2 3.2 0 0 1-3.2-2.9z" fill="#9fb0c5"/><path d="M19 21.5v16M24 21.5v16M29 21.5v16" stroke="#e2e8f0" stroke-width="2.2" stroke-linecap="round"/>';
  const LID = '<rect x="8" y="11" width="32" height="5" rx="2.5" fill="#64748b"/><rect x="19" y="7.5" width="10" height="4.5" rx="2" fill="#64748b"/>';

  const ART = {
    logo:
      '<path d="M6 43V22a18 18 0 0 1 36 0v21z" fill="#ffbb57"/>' +
      '<path d="M10.5 42V22a13.5 13.5 0 0 1 27 0v20z" fill="#292369"/>' +
      '<path d="M13 22a11 11 0 0 1 22 0" fill="none" stroke="#6156bb" stroke-width="2" stroke-linecap="round"/>' +
      '<path d="M24 11l1.4 3.6L29 16l-3.6 1.4L24 21l-1.4-3.6L19 16l3.6-1.4z" fill="#fff19b"/>' +
      '<rect x="13.5" y="22" width="21" height="14" rx="2.5" fill="#87e8fb"/>' +
      '<rect x="15.5" y="24" width="17" height="10" rx="1" fill="#124780"/>' +
      '<path d="m19 26.5 3 2.5-3 2.5m6-1h4M24 36v3m-4 0h8" fill="none" stroke="#dafbff" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>' +
      '<path d="M43 8l1.1 2.9L47 12l-2.9 1.1L43 16l-1.1-2.9L39 12l2.9-1.1zM5 13l.9 2.1L8 16l-2.1.9L5 19l-.9-2.1L2 16l2.1-.9z" fill="#ffedaf"/>' +
      '<rect x="3" y="41" width="42" height="5" rx="2.5" fill="#ffd582"/>',
    'flag-ukraine':
      '<path d="M2 9h44v15H2z" fill="#0057b7"/><path d="M2 24h44v15H2z" fill="#ffd700"/>',
    'flag-united-kingdom':
      '<svg x="2" y="9" width="44" height="30" viewBox="0 0 60 40" preserveAspectRatio="none" overflow="hidden">' +
      '<path d="M0 0h60v40H0z" fill="#012169"/>' +
      '<path d="m0 0 60 40m0-40L0 40" fill="none" stroke="#fff" stroke-width="8"/>' +
      '<path d="M0 0h4l26 17v3L0 1zM60 0v3L30 23v-3zM60 40h-4L30 23v-3l30 19zM0 40v-3l30-20v3z" fill="#c8102e"/>' +
      '<path d="M30 0v40M0 20h60" fill="none" stroke="#fff" stroke-width="12"/>' +
      '<path d="M30 0v40M0 20h60" fill="none" stroke="#c8102e" stroke-width="7"/></svg>',
    owl:
      '<path d="M10 17l3.5-9.5L20 13h8l6.5-5.5L38 17v15a14 14 0 0 1-28 0z" fill="#9a6440"/>' +
      '<path d="M10.5 26c-3 2-4 7-2 11 1.5-3 3-4 5-4.5zM37.5 26c3 2 4 7 2 11-1.5-3-3-4-5-4.5z" fill="#7a4b2e"/>' +
      '<ellipse cx="24" cy="34" rx="9" ry="9.5" fill="#f5deb8"/>' +
      '<circle cx="18" cy="22" r="6.3" fill="#fff"/><circle cx="30" cy="22" r="6.3" fill="#fff"/>' +
      '<circle cx="18.6" cy="22.6" r="3.3" fill="#1e293b"/><circle cx="30.6" cy="22.6" r="3.3" fill="#1e293b"/>' +
      '<circle cx="19.8" cy="21.4" r="1.1" fill="#fff"/><circle cx="31.8" cy="21.4" r="1.1" fill="#fff"/>' +
      '<path d="M22 27h4l-2 3.2z" fill="#f59f00"/>' +
      '<path d="M20 33.5q1.2 1.2 2.4 0M25.6 33.5q1.2 1.2 2.4 0M22.8 37.5q1.2 1.2 2.4 0" stroke="#c99a68" stroke-width="1.5" fill="none" stroke-linecap="round"/>' +
      '<path d="M19.5 46.5h3M25.5 46.5h3" stroke="#f59f00" stroke-width="2.4" stroke-linecap="round"/>',
    computer:
      '<rect x="4" y="7" width="40" height="27" rx="3.5" fill="#475569"/><rect x="7" y="10" width="34" height="21" rx="1.8" fill="#74c0fc"/>' +
      '<path d="M7 26l9-7 7 5 6-4 12 8v1.2A1.8 1.8 0 0 1 39.2 31H8.8A1.8 1.8 0 0 1 7 29.2z" fill="#4dabf7"/>' +
      '<rect x="11" y="13.5" width="13" height="9" rx="1.5" fill="#fff" opacity=".9"/><path d="M11 16h13" stroke="#ff9f43" stroke-width="1.6"/>' +
      '<path d="M20 34h8l1.8 6h-11.6z" fill="#64748b"/><rect x="14" y="40" width="20" height="3.5" rx="1.75" fill="#475569"/>',
    trash: BIN + LID,
    'trash-full':
      BIN +
      '<circle cx="18" cy="12" r="5" fill="#fff" stroke="#cbd5e1" stroke-width="1.2"/><path d="M15.5 11l2 1.5 2.5-2" stroke="#cbd5e1" stroke-width="1.2" fill="none"/>' +
      '<rect x="24" y="6" width="10" height="11" rx="1" fill="#fff" stroke="#cbd5e1" stroke-width="1.2" transform="rotate(14 29 11)"/>' +
      '<g transform="rotate(-14 9 14)">' + LID + '</g>',
    folder: FOLDER(),
    'folder-docs': FOLDER('#74c0fc', '#3d9be0') + EMB('<rect x="4" y="2" width="6" height="16" rx="1"/><rect x="11" y="4" width="6" height="14" rx="1"/><path d="M18.5 4.6l3-.8 3.3 12.8-3 .8z"/>'),
    'folder-pics': FOLDER('#8ce99a', '#40c057') + EMB('<rect x="2" y="2" width="20" height="16" rx="2.5"/><circle cx="8" cy="8" r="2"/><path d="M22 14l-5-5-9.5 9"/>'),
    'folder-desktop': FOLDER('#b197fc', '#845ef7') + EMB('<rect x="2" y="2" width="20" height="13" rx="2"/><path d="M8 19h8M12 15v4"/>'),
    txt: PAGE + '<path d="M14 22h20M14 28h20M14 34h13" stroke="#4dabf7" stroke-width="2.6" stroke-linecap="round"/>',
    img: PAGE + '<rect x="13" y="19" width="22" height="18" rx="2.5" fill="#c5f6fa"/><circle cx="19" cy="24.5" r="2.6" fill="#ffd43b"/><path d="M13 34.5l7-7 5 5 4-3 6 5v.5a2.5 2.5 0 0 1-2.5 2.5h-17A2.5 2.5 0 0 1 13 35z" fill="#51cf66"/>',
    'file-unknown': PAGE + '<path d="M20.5 24a3.6 3.6 0 0 1 7 1c0 2.6-3.5 3-3.5 5.5" stroke="#94a3b8" stroke-width="2.6" fill="none" stroke-linecap="round"/><circle cx="24" cy="35" r="1.6" fill="#94a3b8"/>',
    csv: PAGE + '<rect x="13" y="20" width="22" height="16" rx="2" fill="#d3f9d8" stroke="#40c057" stroke-width="1.6"/><path d="M13 25.5h22M13 31h22M20.5 20v16M28 20v16" stroke="#40c057" stroke-width="1.6" fill="none"/>',
    html: PAGE + '<circle cx="24" cy="29" r="8.5" fill="#e7f5ff" stroke="#4dabf7" stroke-width="1.6"/><ellipse cx="24" cy="29" rx="3.6" ry="8.5" fill="none" stroke="#4dabf7" stroke-width="1.4"/><path d="M15.5 29h17" stroke="#4dabf7" stroke-width="1.4"/>',
    zip: PAGE + '<path d="M22 6v4h4V6M22 10v4h4M26 14v4h-4M22 18v4h4" stroke="#868e96" stroke-width="2" fill="none"/><rect x="20.5" y="24" width="7" height="8" rx="1.5" fill="#868e96"/>',

    /* Наліпки для «Малюнка» й конфеті */
    'st-star': '<path d="M24 4l6 12.4 13.6 2-9.8 9.6 2.3 13.6L24 35.2l-12.1 6.4 2.3-13.6-9.8-9.6 13.6-2z" fill="#ffd43b" stroke="#f59f00" stroke-width="2" stroke-linejoin="round"/>',
    'st-heart': '<path d="M24 42S6 31 6 18a9.5 9.5 0 0 1 18-4.3A9.5 9.5 0 0 1 42 18c0 13-18 24-18 24z" fill="#ff6b6b" stroke="#e03131" stroke-width="2" stroke-linejoin="round"/>',
    'st-flower': [0, 72, 144, 216, 288].map((a) => `<ellipse cx="24" cy="12.5" rx="7" ry="10" fill="#f783ac" transform="rotate(${a} 24 24)"/>`).join('') + '<circle cx="24" cy="24" r="7" fill="#ffd43b"/>',
    'st-sun': [0, 45, 90, 135, 180, 225, 270, 315].map((a) => `<path d="M24 2v7" stroke="#fab005" stroke-width="3.5" stroke-linecap="round" transform="rotate(${a} 24 24)"/>`).join('') + '<circle cx="24" cy="24" r="11" fill="#ffd43b"/><circle cx="20" cy="22" r="1.5" fill="#5c3d00"/><circle cx="28" cy="22" r="1.5" fill="#5c3d00"/><path d="M19.5 27a6 6 0 0 0 9 0" stroke="#5c3d00" stroke-width="1.8" fill="none" stroke-linecap="round"/>',
    'st-rainbow': ['#ff6b6b', '#ffa94d', '#ffd43b', '#69db7c', '#4dabf7', '#9775fa'].map((c, i) => `<path d="M${4 + i * 3} 38a${20 - i * 3} ${20 - i * 3} 0 0 1 ${40 - i * 6} 0" stroke="${c}" stroke-width="3.2" fill="none"/>`).join('') + '<ellipse cx="9" cy="38" rx="7" ry="4" fill="#fff"/><ellipse cx="39" cy="38" rx="7" ry="4" fill="#fff"/>',
    'st-butterfly': '<ellipse cx="14" cy="17" rx="10" ry="11" fill="#74c0fc"/><ellipse cx="34" cy="17" rx="10" ry="11" fill="#74c0fc"/><ellipse cx="15" cy="33" rx="8" ry="8" fill="#b197fc"/><ellipse cx="33" cy="33" rx="8" ry="8" fill="#b197fc"/><circle cx="14" cy="17" r="3.5" fill="#fff"/><circle cx="34" cy="17" r="3.5" fill="#fff"/><rect x="22" y="10" width="4" height="30" rx="2" fill="#495057"/><path d="M23 10l-4-6M25 10l4-6" stroke="#495057" stroke-width="1.8" stroke-linecap="round"/>',
    'st-apple': '<path d="M24 14c-4-3-14-3-15 8-1 9 5 21 11 21 2 0 2.5-1 4-1s2 1 4 1c6 0 12-12 11-21-1-11-11-11-15-8z" fill="#ff6b6b"/><path d="M24 14c0-4 1-7 4-9" stroke="#8d5524" stroke-width="2.5" fill="none" stroke-linecap="round"/><path d="M26 9c3-4 8-4 10-2-2 3-6 4-10 2z" fill="#51cf66"/><ellipse cx="16" cy="22" rx="2.5" ry="4" fill="#fff" opacity=".5"/>',
    'st-car': '<path d="M5 30v-5l5-1 5-8h16l6 8 6 1v5z" fill="#ff922b"/><path d="M16.5 17.5h7v6.5H13zM26 17.5h4.5l4.5 6.5h-9z" fill="#c5f6fa"/><circle cx="14" cy="31" r="5" fill="#343a40"/><circle cx="34" cy="31" r="5" fill="#343a40"/><circle cx="14" cy="31" r="2" fill="#dee2e6"/><circle cx="34" cy="31" r="2" fill="#dee2e6"/>',
    'st-house': '<path d="M8 22L24 8l16 14z" fill="#e03131"/><rect x="11" y="22" width="26" height="20" fill="#ffd8a8"/><rect x="20" y="30" width="8" height="12" rx="1" fill="#8d5524"/><rect x="14" y="26" width="6" height="6" fill="#74c0fc"/><rect x="29" y="26" width="6" height="6" fill="#74c0fc"/>',
    'st-balloon': '<ellipse cx="24" cy="18" rx="12" ry="14" fill="#cc5de8"/><path d="M22 31.5h4l-2 2.5z" fill="#ae3ec9"/><path d="M24 34c-3 4 3 6 0 12" stroke="#868e96" stroke-width="1.5" fill="none"/><ellipse cx="19" cy="13" rx="3" ry="4.5" fill="#fff" opacity=".45"/>',
  };

  /* ---------- Аватари: тваринки, зібрані з простих форм ---------- */
  function animal(o) {
    const parts = [`<circle cx="24" cy="24" r="24" fill="${o.bg}"/>`];
    const ear = o.earColor || o.head, inner = o.earInner;
    if (o.ears === 'tri') parts.push(`<path d="M10 20L12 5l11 9zM38 20L36 5l-11 9z" fill="${ear}"/>` + (inner ? `<path d="M13 15l1-6 5 4zM35 15l-1-6-5 4z" fill="${inner}"/>` : ''));
    if (o.ears === 'round') parts.push(`<circle cx="12" cy="13" r="${o.earR || 6}" fill="${ear}"/><circle cx="36" cy="13" r="${o.earR || 6}" fill="${ear}"/>` + (inner ? `<circle cx="12" cy="13" r="${(o.earR || 6) / 2}" fill="${inner}"/><circle cx="36" cy="13" r="${(o.earR || 6) / 2}" fill="${inner}"/>` : ''));
    if (o.ears === 'long') parts.push(`<ellipse cx="17" cy="9" rx="4.5" ry="11" fill="${ear}"/><ellipse cx="31" cy="9" rx="4.5" ry="11" fill="${ear}"/><ellipse cx="17" cy="9" rx="2" ry="7" fill="${inner}"/><ellipse cx="31" cy="9" rx="2" ry="7" fill="${inner}"/>`);
    if (o.mane) parts.push(`<circle cx="24" cy="27" r="19" fill="${o.mane}"/>`);
    parts.push(`<ellipse cx="24" cy="27" rx="${o.rx || 15}" ry="${o.ry || 14}" fill="${o.head}"/>`);
    if (o.ears === 'floppy') parts.push(`<path d="M10 18c-5 1-6 10-3 15 3-1 5-5 6-9zM38 18c5 1 6 10 3 15-3-1-5-5-6-9z" fill="${ear}"/>`);
    if (o.patches) parts.push('<ellipse cx="18" cy="25" rx="4.5" ry="5.5" fill="#212529" transform="rotate(-20 18 25)"/><ellipse cx="30" cy="25" rx="4.5" ry="5.5" fill="#212529" transform="rotate(20 30 25)"/>');
    if (o.face) parts.push(`<ellipse cx="24" cy="30" rx="${o.faceRx || 11}" ry="${o.faceRy || 10}" fill="${o.face}"/>`);
    if (o.muzzle) parts.push(`<ellipse cx="24" cy="32" rx="7" ry="5.5" fill="${o.muzzle}"/>`);
    const eyeC = o.patches ? '#fff' : '#212529';
    parts.push(`<circle cx="18.5" cy="25" r="2.2" fill="${eyeC}"/><circle cx="29.5" cy="25" r="2.2" fill="${eyeC}"/>`);
    if (o.patches) parts.push('<circle cx="18.5" cy="25" r="1.1" fill="#212529"/><circle cx="29.5" cy="25" r="1.1" fill="#212529"/>');
    if (o.beak) parts.push(`<path d="M21 30h6l-3 4z" fill="${o.beak}"/>`);
    else parts.push(`<ellipse cx="24" cy="30.5" rx="${o.noseR || 2.2}" ry="${(o.noseR || 2.2) * 0.75}" fill="${o.nose || '#212529'}"/><path d="M21 33.5q1.5 1.5 3 0q1.5 1.5 3 0" stroke="#212529" stroke-width="1.2" fill="none" stroke-linecap="round"/>`);
    if (o.cheeks) parts.push('<circle cx="15" cy="30" r="2.2" fill="#ff8fab" opacity=".6"/><circle cx="33" cy="30" r="2.2" fill="#ff8fab" opacity=".6"/>');
    if (o.extra) parts.push(o.extra);
    return parts.join('');
  }
  const AVATARS = {
    fox: animal({ bg: '#ffe8cc', head: '#ff922b', ears: 'tri', earInner: '#fff4e6', face: '#fff', faceRy: 8, faceRx: 10, cheeks: true }),
    cat: animal({ bg: '#e9ecef', head: '#adb5bd', ears: 'tri', earInner: '#ffc9c9', muzzle: '#f1f3f5', cheeks: true, extra: '<path d="M10 30h6M10 33l6-1M38 30h-6M38 33l-6-1" stroke="#495057" stroke-width="1" stroke-linecap="round"/>' }),
    dog: animal({ bg: '#fff3bf', head: '#d9a066', ears: 'floppy', earColor: '#8d5524', muzzle: '#f8e3c8' }),
    panda: animal({ bg: '#d3f9d8', head: '#fff', ears: 'round', earColor: '#212529', patches: true }),
    frog: animal({ bg: '#e6fcf5', head: '#69db7c', rx: 17, ry: 12, extra: '<circle cx="16" cy="17" r="6" fill="#69db7c"/><circle cx="32" cy="17" r="6" fill="#69db7c"/><circle cx="16" cy="17" r="3.5" fill="#fff"/><circle cx="32" cy="17" r="3.5" fill="#fff"/><circle cx="16.5" cy="17.5" r="2" fill="#212529"/><circle cx="32.5" cy="17.5" r="2" fill="#212529"/><rect x="0" y="22" width="48" height="5" fill="#69db7c" opacity="0"/>', cheeks: true, nose: '#2b8a3e', noseR: 1 }),
    lion: animal({ bg: '#fff9db', head: '#ffd43b', mane: '#e8590c', ears: 'round', earColor: '#ffd43b', earR: 4, muzzle: '#fff3bf' }),
    rabbit: animal({ bg: '#fff0f6', head: '#fff', ears: 'long', earInner: '#ffc9c9', cheeks: true, nose: '#f06595', noseR: 1.8 }),
    bear: animal({ bg: '#fff4e6', head: '#a0673f', ears: 'round', earInner: '#d9a066', muzzle: '#d9a066' }),
    koala: animal({ bg: '#e7f5ff', head: '#adb5bd', ears: 'round', earR: 8, earInner: '#f1f3f5', noseR: 3.6, nose: '#343a40' }),
    unicorn: animal({ bg: '#f3f0ff', head: '#fff', ears: 'tri', earInner: '#ffd6e7', cheeks: true, nose: '#e599f7', noseR: 1.6, extra: '<path d="M24 2l3.5 13h-7z" fill="#ffd43b"/><path d="M21 7l6 1.5M21.8 10.5l4.8 1.2" stroke="#fab005" stroke-width="1"/><path d="M33 14c5 2 7 7 6 13-2-3-4-5-7-6zM15 14c-3 0-6 3-6 6 2-1 4-1 6 0z" fill="#da77f2"/>' }),
    owl: '<circle cx="24" cy="24" r="24" fill="#fff3bf"/><g transform="translate(4 4) scale(.833)">' + ART.owl + '</g>',
    penguin: animal({ bg: '#e7f5ff', head: '#343a40', face: '#fff', faceRx: 12, faceRy: 11, beak: '#ff922b', cheeks: true }),
    chick: animal({ bg: '#fff9db', head: '#ffd43b', beak: '#ff922b', cheeks: true, extra: '<path d="M22 13c0-4 2-6 4-6-1 2-1 4 0 6z" fill="#fab005"/>' }),
    robot: '<circle cx="24" cy="24" r="24" fill="#e3fafc"/><rect x="11" y="14" width="26" height="22" rx="6" fill="#74c0fc"/><path d="M24 14V8" stroke="#495057" stroke-width="2"/><circle cx="24" cy="7" r="2.5" fill="#ff6b6b"/><rect x="15" y="19" width="18" height="10" rx="4" fill="#1e293b"/><circle cx="20" cy="24" r="2.2" fill="#69db7c"/><circle cx="28" cy="24" r="2.2" fill="#69db7c"/><path d="M19 32h10" stroke="#1971c2" stroke-width="2" stroke-linecap="round"/><rect x="7" y="21" width="4" height="8" rx="2" fill="#4dabf7"/><rect x="37" y="21" width="4" height="8" rx="2" fill="#4dabf7"/>',
  };
  for (const [k, v] of Object.entries(AVATARS)) ART['av-' + k] = v;
  const AVATAR_IDS = Object.keys(AVATARS);
  // Старі профілі зберігали емодзі — переводимо в нові аватари
  const EMOJI_TO_AVATAR = { '🦊': 'fox', '🐱': 'cat', '🐶': 'dog', '🐼': 'panda', '🐸': 'frog', '🦁': 'lion', '🐰': 'rabbit', '🐻': 'bear', '🐨': 'koala', '🦄': 'unicorn', '🐙': 'robot', '🐢': 'frog', '🦉': 'owl', '🐝': 'chick', '🐧': 'penguin', '🚀': 'robot' };
  const avatarId = (a) => (AVATARS[a] ? a : EMOJI_TO_AVATAR[a] || 'owl');

  /* ---------- Побудова ---------- */
  const NS = 'http://www.w3.org/2000/svg';
  const has = (name) => typeof name === 'string' && (name in LINE || name in ART);

  /** Значок як SVG-елемент. size — у px (за замовчуванням успадковує розмір шрифту: 1em). */
  function icon(name, size, cls) {
    const art = name in ART;
    const svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('viewBox', art ? '0 0 48 48' : '0 0 24 24');
    svg.setAttribute('class', 'ic' + (art ? ' ic-art' : '') + (cls ? ' ' + cls : ''));
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('focusable', 'false');
    if (size) { svg.setAttribute('width', size); svg.setAttribute('height', size); }
    if (!art) {
      svg.setAttribute('fill', 'none');
      svg.setAttribute('stroke', 'currentColor');
      svg.setAttribute('stroke-width', '2');
      svg.setAttribute('stroke-linecap', 'round');
      svg.setAttribute('stroke-linejoin', 'round');
    }
    svg.innerHTML = art ? ART[name] : LINE[name] || LINE.file;
    return svg;
  }

  /** Значок за назвою, готовий вузол або звичайний текст (напр. «A+»). */
  function ico(x, size, cls) {
    if (x instanceof Node) return x;
    if (has(x)) return icon(x, size, cls);
    return document.createTextNode(x == null ? '' : String(x));
  }

  /** SVG-рядок (для canvas, favicon тощо). */
  function svgString(name, size = 48) {
    const art = name in ART;
    const attrs = art ? '' : ' fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"';
    return `<svg xmlns="${NS}" viewBox="${art ? '0 0 48 48' : '0 0 24 24'}" width="${size}" height="${size}"${attrs}>${art ? ART[name] : LINE[name]}</svg>`;
  }
  const dataUrl = (name, size) => 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgString(name, size));

  const avatar = (a, size, cls) => icon('av-' + avatarId(a), size, 'avatar-svg' + (cls ? ' ' + cls : ''));

  VOS.icon = icon;
  VOS.ico = ico;
  VOS.icons = { LINE, ART, has, svgString, dataUrl, avatar, avatarId, AVATAR_IDS };
})();
