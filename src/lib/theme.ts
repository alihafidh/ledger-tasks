// Dark is the default (the token sheet's :root); light is the override.
export function applyTheme(theme: string | null) {
  if (theme === 'light') document.documentElement.dataset.theme = 'light';
  else delete document.documentElement.dataset.theme;
}

export function effectiveTheme(): 'light' | 'dark' {
  return document.documentElement.dataset.theme === 'light' ? 'light' : 'dark';
}

export function initTheme() {
  applyTheme(localStorage.getItem('ledger.theme'));
}

export function setTheme(theme: 'light' | 'dark') {
  localStorage.setItem('ledger.theme', theme);
  applyTheme(theme);
}
