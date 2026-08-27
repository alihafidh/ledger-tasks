import type { Priority, Task, TaskList } from '../types';
import { formatDate, nowTimeStr, offsetStr, todayStr } from '../lib/dates';
import Icon from './Icon';

export function CompanyChip({ list, sm = false }: { list: TaskList; sm?: boolean }) {
  return (
    <span className={sm ? 'company-chip company-chip--sm' : 'company-chip'}>
      <span className="company-chip__dot" style={{ background: list.dot }} />
      {list.name}
    </span>
  );
}

// Priority as a mini bar-chart glyph: four bars, filled up to the level.
const PRIO_LEVEL: Record<Priority, number> = { high: 4, medium: 3, low: 2 };
const PRIO_COLOR: Record<Priority, string> = {
  high: 'var(--danger)',
  medium: 'var(--warn)',
  low: 'var(--ink-4)',
};

export function PriorityMark({ priority }: { priority: Priority }) {
  const level = PRIO_LEVEL[priority];
  return (
    <span
      className="prio"
      title={priority[0].toUpperCase() + priority.slice(1) + ' priority'}
      aria-label={priority + ' priority'}
    >
      {[4, 6, 8, 10].map((h, i) => (
        <span
          key={h}
          className="prio__bar"
          style={{ height: h, background: i < level ? PRIO_COLOR[priority] : 'var(--border)' }}
        />
      ))}
    </span>
  );
}

export function taskOverdue(t: Task): boolean {
  const today = todayStr();
  return (
    !t.completed &&
    !!t.dueDate &&
    (t.dueDate < today || (t.dueDate === today && !!t.dueTime && t.dueTime < nowTimeStr()))
  );
}

export function DueChip({ task }: { task: Task }) {
  if (!task.dueDate) return null;
  const today = todayStr();
  let text: string;
  if (task.dueDate === today) text = 'Today';
  else if (task.dueDate === offsetStr(1)) text = 'Tomorrow';
  else if (task.dueDate === offsetStr(-1)) text = 'Yesterday';
  else text = formatDate(task.dueDate);
  let cls = 'due';
  if (task.completed) cls += ' due--muted';
  else if (taskOverdue(task)) cls += ' due--overdue';
  else if (task.dueDate <= offsetStr(2)) cls += ' due--soon';
  return (
    <span className={cls}>
      <Icon name="clock" size={12} />
      {text}
    </span>
  );
}

export function ProgressBar({ value, tint }: { value: number; tint?: string }) {
  return (
    <div className="progress">
      <div
        className="progress__fill"
        style={{
          width: Math.round(Math.min(1, Math.max(0, value)) * 100) + '%',
          background: tint ?? 'var(--accent)',
        }}
      />
    </div>
  );
}

export function Cbx({
  checked,
  onToggle,
  size = 16,
}: {
  checked: boolean;
  onToggle: () => void;
  size?: number;
}) {
  return (
    <button
      className={checked ? 'cbx is-checked' : 'cbx'}
      style={{ width: size, height: size }}
      aria-label={checked ? 'Mark incomplete' : 'Mark complete'}
      aria-pressed={checked}
      onClick={(e) => {
        e.stopPropagation();
        onToggle();
      }}
    >
      {checked && <Icon name="check" size={size - 5} style={{ color: 'var(--accent-ink)' }} />}
    </button>
  );
}
