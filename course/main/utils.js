export function clear(node) {
  while (node.firstChild) node.removeChild(node.firstChild);
}

export function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);

  for (const [k, v] of Object.entries(attrs)) {
    if (v === null || v === undefined) continue;
    if (k === 'class') node.className = String(v);
    else if (k === 'text') node.textContent = String(v);
    else if (k === 'style') node.style.cssText = String(v);
    else node.setAttribute(k, String(v));
  }

  for (const child of children) {
    if (child === null || child === undefined) continue;
    node.appendChild(typeof child === 'string' ? document.createTextNode(child) : child);
  }

  return node;
}

export function icon(className) {
  return el('i', { class: className, 'aria-hidden': 'true' });
}

export function focusMain(dom) {
  try { dom.content.focus({ preventScroll: true }); } catch {}
}

export function safeHttpUrl(url) {
  try {
    const u = new URL(url, window.location.href);
    return (u.protocol === 'http:' || u.protocol === 'https:') ? u.toString() : null;
  } catch {
    return null;
  }
}

export function debounce(fn, delayMs = 120) {
  let t = null;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), delayMs);
  };
}
