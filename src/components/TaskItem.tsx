import type { Task, TaskList } from '../types';
import { formatDate, formatTime12, nowTimeStr, offsetStr, todayStr } from '../lib/dates';

type Props = {
  task: Task;
  list?: TaskList;
  onToggle: (t: Task) => void;
  onEdit: (t: Task) => void;
  onDelete: (t: Task) => void;
};

export default function TaskItem({ task: t, list, onToggle, onEdit, onDelete }: Props) {
  const today = todayStr();
  const overdue =
    !t.completed &&
    !!t.dueDate &&
    (t.dueDate < today || (t.dueDate === today && !!t.dueTime && t.dueTime < nowTimeStr()));

  let dueText = '';
  let dueClass = 'task-due';
  if (t.dueDate) {
    const time = t.dueTime ? formatTime12(t.dueTime) : '';
    if (overdue) {
      dueText = 'Overdue · ' + formatDate(t.dueDate) + (time ? ', ' + time : '');
      dueClass += ' overdue';
    } else if (t.dueDate === today) {
      dueText = 'Today' + (time ? ' · ' + time : '');
      dueClass += ' today';
    } else if (t.dueDate === offsetStr(1)) {
      dueText = 'Tomorrow' + (time ? ' · ' + time : '');
    } else {
      dueText = formatDate(t.dueDate) + (time ? ' · ' + time : '');
    }
  }

  return (
    <div className={t.completed ? 'task-row done' : 'task-row'} onClick={() => onEdit(t)}>
      <button
        className={t.completed ? 'check checked' : 'check'}
        aria-label={t.completed ? 'Mark incomplete' : 'Mark complete'}
        aria-pressed={t.completed}
        onClick={(e) => {
          e.stopPropagation();
          onToggle(t);
        }}
      >
        {t.completed && (
          <svg width="11" height="11" viewBox="0 0 12 12" fill="none" aria-hidden="true">
            <path
              d="M2 6.5 L4.8 9.2 L10 2.8"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray="24"
            />
          </svg>
        )}
      </button>

      <div className="task-main">
        <div className="task-title">{t.title}</div>
        {t.description && !t.completed && <div className="task-desc">{t.description}</div>}
      </div>

      <div className="task-side">
        {t.priority !== 'low' && !t.completed && (
          <i
            className="ph-duotone ph-flag task-flag"
            title={t.priority === 'high' ? 'High priority' : 'Medium priority'}
            style={{ color: t.priority === 'high' ? 'var(--color-red)' : 'var(--color-orange)' }}
            aria-hidden="true"
          />
        )}
        {t.notes && !t.completed && (
          <i className="ph-duotone ph-note task-note-icon" title={t.notes} aria-hidden="true" />
        )}
        {dueText && <span className={dueClass}>{dueText}</span>}
        {list && (
          <span className="task-list-tag">
            <span className="list-dot" style={{ background: list.dot }} aria-hidden="true" />
            {list.name}
          </span>
        )}
        <div className="task-actions">
          <button
            className="btn btn-icon"
            aria-label="Edit task"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(t);
            }}
          >
            <i className="ph-duotone ph-pencil-simple" aria-hidden="true" />
          </button>
          <button
            className="btn btn-icon danger"
            aria-label="Delete task"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(t);
            }}
          >
            <i className="ph-duotone ph-trash" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
}
