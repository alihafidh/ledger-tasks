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
};
