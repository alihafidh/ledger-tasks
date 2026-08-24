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

export function seedData(): AppData {
  const now = Date.now();
  const lists: TaskList[] = [
    { id: 'work', name: 'Work', dot: LIST_DOTS[0], createdAt: now },
    { id: 'personal', name: 'Personal', dot: LIST_DOTS[1], createdAt: now },
    { id: 'finance', name: 'Finance', dot: LIST_DOTS[2], createdAt: now },
    { id: 'other', name: 'Other', dot: LIST_DOTS[3], createdAt: now },
  ];
  const iso = (off: number) => {
    const d = new Date();
    d.setDate(d.getDate() + off);
    return (
      d.getFullYear() +
      '-' +
      String(d.getMonth() + 1).padStart(2, '0') +
      '-' +
      String(d.getDate()).padStart(2, '0')
    );
  };
  let n = now;
  const mk = (
    title: string,
    description: string,
    dueDate: string,
    dueTime: string,
    priority: Task['priority'],
    listId: string,
    completed = false,
  ): Task => ({
    id: String(n++),
    title,
    description: description || undefined,
    notes: undefined,
    completed,
    completedAt: completed ? now : null,
    priority,
    listId,
    dueDate: dueDate || undefined,
    dueTime: dueTime || undefined,
    createdAt: n,
    updatedAt: n,
  });
  return {
    lists,
    tasks: [
      mk('Send Q3 invoice to Meridian Press', 'Include the September retainer line', iso(-1), '17:00', 'high', 'finance'),
      mk('Review edition layout with Ana', 'Front-page hierarchy and the two spreads', iso(0), '10:30', 'high', 'work', true),
      mk('Reply to the print vendor', 'Confirm paper stock for the November run', iso(0), '14:00', 'medium', 'work'),
      mk('Book dentist appointment', '', iso(0), '', 'low', 'personal'),
      mk('Prepare notes for Monday standup', 'Three items max — keep it short', iso(1), '09:00', 'medium', 'work'),
      mk('Renew home insurance', 'Compare the two quotes first', iso(3), '', 'medium', 'finance'),
      mk('Pick up framed prints', 'Framer closes at 6 on weekdays', iso(4), '16:00', 'low', 'personal'),
      mk('Plan weekend hike', 'Check the weather Thursday', iso(5), '', 'low', 'other', true),
    ],
  };
}

export function newId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}
