const STORAGE_KEY = 'aiBookProgress';

export function saveProgress(index) {
  sessionStorage.setItem(STORAGE_KEY, String(index));
}

export function loadSavedIndex(sectionCount) {
  const saved = sessionStorage.getItem(STORAGE_KEY);
  if (saved === null) return 0;
  const index = Number.parseInt(saved, 10);
  return Number.isInteger(index) && index >= 0 && index < sectionCount ? index : 0;
}
