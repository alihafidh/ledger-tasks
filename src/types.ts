export type Priority = 'low' | 'medium' | 'high';

export type Task = {
  id: string;
  title: string;
  description?: string;
  notes?: string;
  completed: boolean;
  completedAt?: number | null;
  priority: Priority;
  listId?: string;
  dueDate?: string; // YYYY-MM-DD
  dueTime?: string; // HH:MM
  createdAt: number;
  updatedAt: number;
};

export type TaskList = {
  id: string;
  name: string;
  dot: string; // CSS color for the sidebar dot
  createdAt: number;
};

export type View =
  | { kind: 'home' }
  | { kind: 'today' }
  | { kind: 'upcoming' }
  | { kind: 'all' }
  | { kind: 'completed' }
  | { kind: 'list'; listId: string };

export type SortKey = 'due' | 'priority' | 'created' | 'alpha';
