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
  '#4a9eda', // steel blue
  '#8b98a8', // slate
  '#3aa99f', // teal
  '#6b7280', // graphite
  '#b08968', // bronze
  '#5f7fbf', // indigo
];

// Dot values stored by the previous (newsprint) theme referenced CSS
// variables that no longer exist — map them onto the current palette.
const LEGACY_DOTS: Record<string, string> = {
  'var(--color-accent-500)': '#4a9eda',
  'var(--color-accent-2-400)': '#8b98a8',
  'var(--color-neutral-700)': '#3aa99f',
  'var(--color-neutral-400)': '#6b7280',
  'var(--color-accent-700)': '#5f7fbf',
  'var(--color-accent-2-600)': '#b08968',
  'var(--color-neutral-500)': '#6b7280',
  // Previous flat palette → muted equivalents
  '#2383e2': '#4a9eda',
  '#c14c8a': '#8b98a8',
  '#448361': '#3aa99f',
  '#9b9a97': '#6b7280',
  '#9065b0': '#5f7fbf',
  '#d9730d': '#b08968',
};

export function emptyData(): AppData {
  return { lists: [], tasks: [] };
}

export function newId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}
