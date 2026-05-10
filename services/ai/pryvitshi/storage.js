const STORAGE_KEY = 'aiBookProgress';

export function saveProgress(index) {
  localStorage.setItem(STORAGE_KEY, index);
}

export function loadSavedIndex(sectionCount) {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved === null) return 0;
  const index = parseInt(saved, 10);
  return (index >= 0 && index < sectionCount) ? index : 0;
}
