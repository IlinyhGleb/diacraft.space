const KEY = 'block-diagram-state-v1';

export function loadState<T>(fallback: T): T {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return fallback;
    return parsed as T;
  } catch {
    return fallback;
  }
}

export function saveState(state: unknown) {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // ignore quota / privacy errors
  }
}
