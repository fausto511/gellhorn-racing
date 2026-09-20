// Shared "compare" selection state, persisted in localStorage so marking a
// vehicle on the garage overview or on its own detail page stays in sync
// across page loads (Astro pages are separate documents, no shared JS state).
const KEY = 'gellhorn-compare-selected';

export function getSelected(): string[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

function setSelected(ids: string[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(ids));
  } catch {
    // storage unavailable (private browsing, disabled, quota) -- selection just won't persist
  }
}

export function isSelected(id: string): boolean {
  return getSelected().includes(id);
}

// Toggles membership and returns the new state (true = now selected).
export function toggleSelected(id: string): boolean {
  const current = getSelected();
  const idx = current.indexOf(id);
  const next = idx === -1 ? [...current, id] : current.filter((x) => x !== id);
  setSelected(next);
  return next.includes(id);
}
