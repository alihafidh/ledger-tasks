import type { Priority, SortKey, TaskList } from '../types';
import Icon from './Icon';

type Props = {
  priorityFilter: Priority | 'all';
  onPriorityFilter: (p: Priority | 'all') => void;
  listFilter: string; // '' = all
  onListFilter: (id: string) => void;
  showListFilter: boolean;
  lists: TaskList[];
  sort: SortKey;
  onSort: (s: SortKey) => void;
  count: number;
  showDone: boolean;
  onShowDone?: (v: boolean) => void; // absent on the Done view
  taskView: 'list' | 'calendar';
  onTaskView: (v: 'list' | 'calendar') => void;
};

const PRIORITIES: (Priority | 'all')[] = ['all', 'high', 'medium', 'low'];

export default function FilterBar({
  priorityFilter,
  onPriorityFilter,
  listFilter,
  onListFilter,
  showListFilter,
  lists,
  sort,
  onSort,
  count,
  showDone,
  onShowDone,
  taskView,
  onTaskView,
}: Props) {
  return (
    <div className="toolbar">
      <div className="segmented" role="group" aria-label="View">
        {(['list', 'calendar'] as const).map((v) => (
          <button
            key={v}
            className={taskView === v ? 'segmented__item is-active' : 'segmented__item'}
            aria-pressed={taskView === v}
            title={v === 'list' ? 'List view' : 'Calendar view'}
            onClick={() => onTaskView(v)}
          >
            <Icon name={v === 'list' ? 'list' : 'calendar'} size={13} />
          </button>
        ))}
      </div>
      <div className="segmented" role="group" aria-label="Filter by priority">
        {PRIORITIES.map((p) => (
          <button
            key={p}
            className={priorityFilter === p ? 'segmented__item is-active' : 'segmented__item'}
            aria-pressed={priorityFilter === p}
            onClick={() => onPriorityFilter(p)}
          >
            {p === 'all' ? 'All' : p[0].toUpperCase() + p.slice(1)}
          </button>
        ))}
      </div>
      {showListFilter && (
        <select
          className="chip-filter chip-filter--select"
          value={listFilter}
          aria-label="Filter by company"
          onChange={(e) => onListFilter(e.target.value)}
        >
          <option value="">Company · All</option>
          {lists.map((l) => (
            <option key={l.id} value={l.id}>
              Company · {l.name}
            </option>
          ))}
        </select>
      )}
      <select
        className="chip-filter chip-filter--select"
        value={sort}
        aria-label="Sort tasks"
        onChange={(e) => onSort(e.target.value as SortKey)}
      >
        <option value="due">Sort · Due date</option>
        <option value="priority">Sort · Priority</option>
        <option value="created">Sort · Newest</option>
        <option value="alpha">Sort · A to Z</option>
      </select>
      <div className="toolbar__spacer" />
      {onShowDone && (
        <button
          className={showDone ? 'btn btn--sm btn--outline is-active' : 'btn btn--sm btn--outline'}
          aria-pressed={showDone}
          onClick={() => onShowDone(!showDone)}
        >
          <Icon name="check" size={12} /> Show done
        </button>
      )}
      <span className="toolbar__count mono">
        {count} task{count === 1 ? '' : 's'}
      </span>
    </div>
  );
}
