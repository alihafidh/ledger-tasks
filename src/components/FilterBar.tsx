import type { RefObject } from 'react';
import type { Priority, SortKey, TaskList } from '../types';

type Props = {
  query: string;
  onQuery: (q: string) => void;
  searchRef: RefObject<HTMLInputElement | null>;
  priorityFilter: Priority | 'all';
  onPriorityFilter: (p: Priority | 'all') => void;
  listFilter: string; // '' = all
  onListFilter: (id: string) => void;
  showListFilter: boolean;
  lists: TaskList[];
  sort: SortKey;
  onSort: (s: SortKey) => void;
};

const PRIORITIES: (Priority | 'all')[] = ['all', 'high', 'medium', 'low'];

export default function FilterBar({
  query,
  onQuery,
  searchRef,
  priorityFilter,
  onPriorityFilter,
  listFilter,
  onListFilter,
  showListFilter,
  lists,
  sort,
  onSort,
}: Props) {
  return (
    <div className="toolbar">
      <div className="search-wrap">
        <i className="ph-duotone ph-magnifying-glass" aria-hidden="true" />
        <input
          ref={searchRef}
          className="input"
          value={query}
          placeholder="Search tasks…  ( / )"
          aria-label="Search tasks"
          onChange={(e) => onQuery(e.target.value)}
        />
      </div>
      <div className="chips" role="group" aria-label="Filter by priority">
        {PRIORITIES.map((p) => (
          <button
            key={p}
            className={priorityFilter === p ? 'chip active' : 'chip'}
            aria-pressed={priorityFilter === p}
            onClick={() => onPriorityFilter(p)}
          >
            {p === 'all' ? 'All' : p[0].toUpperCase() + p.slice(1)}
          </button>
        ))}
      </div>
      <div className="toolbar-selects">
        {showListFilter && (
          <select
            className="input"
            value={listFilter}
            aria-label="Filter by list"
            onChange={(e) => onListFilter(e.target.value)}
          >
            <option value="">List · All</option>
            {lists.map((l) => (
              <option key={l.id} value={l.id}>
                List · {l.name}
              </option>
            ))}
          </select>
        )}
        <select
          className="input"
          value={sort}
          aria-label="Sort tasks"
          onChange={(e) => onSort(e.target.value as SortKey)}
        >
          <option value="due">Sort · Due date</option>
          <option value="priority">Sort · Priority</option>
          <option value="created">Sort · Newest</option>
          <option value="alpha">Sort · A to Z</option>
        </select>
      </div>
    </div>
  );
}
