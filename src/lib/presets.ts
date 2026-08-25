import type { Priority } from '../types';

export type ImportPayload = {
  lists?: string[];
  tasks?: {
    title: string;
    list?: string;
    description?: string;
    priority?: Priority;
    dueDate?: string;
    dueTime?: string;
  }[];
  removeTasks?: string[];
  removeLists?: string[];
};

// Named setups reachable at /#apply=<name> — short links that survive
// copy-paste where a long base64 import link might get truncated.
export const PRESETS: Record<string, ImportPayload> = {
  setup1: {
    removeTasks: [
      'Send Q3 invoice to Meridian Press',
      'Review edition layout with Ana',
      'Reply to the print vendor',
      'Book dentist appointment',
      'Prepare notes for Monday standup',
      'Renew home insurance',
      'Pick up framed prints',
      'Plan weekend hike',
    ],
    removeLists: ['Work', 'Personal', 'Finance', 'Other', 'Errands'],
    lists: ['Menacom', 'USA'],
    tasks: [
      { title: 'Finalize and launch Menacom app', list: 'Menacom', priority: 'high' },
      { title: 'Finalize serial tracking', list: 'Menacom', priority: 'high' },
      { title: 'Deal with Reddington' },
      { title: 'Create price list', list: 'USA' },
      { title: 'Create Best Buy account', list: 'USA' },
    ],
  },
  setup2: {
    lists: ['Subscriptions'],
    tasks: [
      { title: 'Subscribe to Lebraa', list: 'Subscriptions', priority: 'medium', dueDate: '2026-08-27' },
    ],
  },
  setup3: {
    lists: ['Personal'],
    tasks: [{ title: 'Subscribe to Lebara', list: 'Personal', priority: 'medium' }],
  },
  // The single corrected Lebara task: one entry, right spelling, due Aug 27.
  setup4: {
    removeTasks: ['Subscribe to Lebraa', 'Subscribe to Lebara'],
    lists: ['Personal', 'Subscriptions'],
    tasks: [
      { title: 'Subscribe to Lebara', list: 'Personal', priority: 'medium', dueDate: '2026-08-27' },
    ],
  },
};
