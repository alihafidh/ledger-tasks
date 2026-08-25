import type { Task, TaskList } from '../types';

// The one place the app touches persistence. Swap these four functions for
// API calls to move the data to a real backend.

export type AppData = { tasks: Task[]; lists: TaskList[] };

const LEGACY_KEY = 'ledger.tasks.v2';
const keyFor = (userId: string) => `ledger.tasks.v2.${userId}`;

function parse(raw: string | null): AppData | null {
  try {
    if (!raw) return null;
    const d = JSON.parse(raw);
    if (!d || !Array.isArray(d.tasks) || !Array.isArray(d.lists)) return null;
    for (const l of d.lists) l.dot = LEGACY_DOTS[l.dot] ?? l.dot;
    return d as AppData;
  } catch {
    return null;
  }
}

export function loadData(userId: string): AppData | null {
  const own = parse(localStorage.getItem(keyFor(userId)));
  if (own) return own;
  // First sign-in on a device that used the app before accounts existed:
  // adopt the pre-login data instead of starting the user from scratch.
  const legacy = parse(localStorage.getItem(LEGACY_KEY));
  if (legacy) {
    saveData(userId, legacy);
    localStorage.removeItem(LEGACY_KEY);
  }
  return legacy;
}

export function saveData(userId: string, data: AppData): void {
  try {
    localStorage.setItem(keyFor(userId), JSON.stringify(data));
  } catch {
    // storage full or unavailable — the app keeps working in memory
  }
}

export const LIST_DOTS = [
  '#2383e2', // blue
  '#c14c8a', // pink
  '#448361', // green
  '#9b9a97', // gray
  '#9065b0', // purple
  '#d9730d', // orange
];

// Dot values stored by the previous (newsprint) theme referenced CSS
// variables that no longer exist — map them onto the current palette.
const LEGACY_DOTS: Record<string, string> = {
  'var(--color-accent-500)': '#2383e2',
  'var(--color-accent-2-400)': '#c14c8a',
  'var(--color-neutral-700)': '#448361',
  'var(--color-neutral-400)': '#9b9a97',
  'var(--color-accent-700)': '#9065b0',
  'var(--color-accent-2-600)': '#d9730d',
  'var(--color-neutral-500)': '#9b9a97',
};

export function emptyData(): AppData {
  return { lists: [], tasks: [] };
}

export function newId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}
