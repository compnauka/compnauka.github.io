export function validateSaveTitle(rawTitle) {
  const trimmed = String(rawTitle ?? '').trim();
  if (trimmed.length < 2) {
    return {
      ok: false,
      message: 'Напиши назву (хоч 2 літери) 🙂',
      value: trimmed,
    };
  }
  return { ok: true, value: trimmed };
}

export function makeDownloadFileName(title) {
  const fallback = 'блок-схема';
  const safe = String(title ?? '').trim().replace(/[\\/:*?"<>|]+/g, '_').trim();
  return (safe || fallback) + '.png';
}
