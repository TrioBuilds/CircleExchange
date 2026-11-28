export type Appearance = 'system' | 'light' | 'dark';

const key = 'circleexchange-appearance';
export const systemAppearance = window.matchMedia?.('(prefers-color-scheme: dark)');
let sessionAppearance: Appearance | undefined;

export function getAppearance(): Appearance {
  if (sessionAppearance) return sessionAppearance;
  try {
    const stored = window.localStorage.getItem(key);
    if (stored === 'light' || stored === 'dark') return stored;
  } catch {
    // Use the system preference if storage is unavailable.
  }
  return 'system';
}

export function applyAppearance(appearance: Appearance) {
  const dark = appearance === 'dark' || (appearance === 'system' && systemAppearance?.matches);
  document.documentElement.dataset.theme = dark ? 'dark' : 'light';
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute('content', dark ? '#1b171e' : '#fdfafb');
}

export function saveAppearance(appearance: Appearance) {
  try {
    if (appearance === 'system') window.localStorage.removeItem(key);
    else window.localStorage.setItem(key, appearance);
    sessionAppearance = undefined;
  } catch {
    sessionAppearance = appearance;
  }
  applyAppearance(appearance);
}
