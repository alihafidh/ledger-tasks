import type { Task, TaskList } from '../types';
import { CompanyChip, DueChip, PriorityMark, Cbx } from './primitives';
import Icon from './Icon';

const GRID = '28px minmax(220px,1fr) 130px 110px 64px 32px';

type Group = { label: string; dot?: string; tasks: Task[] };

type Props = {
  groups: Group[];
  listById: Map<string, TaskList>;
  onToggle: (t: Task) => void;
  onEdit: (t: Task) => void;
  onDelete: (t: Task) => void;
};

export default function TaskTable({ groups, listById, onToggle, onEdit, onDelete }: Props) {
  return (
    <div className="list">
      <div className="list__head" style={{ gridTemplateColumns: GRID }}>
        <span />
        <span>Title</span>
        <span>Company</span>
        <span>Due</span>
        <span>Prio</span>
        <span />
      </div>
      {groups.map((g) => (
        <div key={g.label}>
          {groups.length > 1 && (
            <div className="list__group-head">
              {g.dot && <span className="company-row__dot" style={{ background: g.dot }} />}
              {g.label}
              <span className="list__group-count">{g.tasks.length}</span>
            </div>
          )}
          {g.tasks.map((t) => {
            const list = t.listId ? listById.get(t.listId) : undefined;
            return (
              <div
                key={t.id}
                className={t.completed ? 'row is-done' : 'row'}
                style={{ gridTemplateColumns: GRID }}
                onClick={() => onEdit(t)}
              >
                <Cbx checked={t.completed} onToggle={() => onToggle(t)} />
                <span className="row__title-wrap">
                  <span className="row__title">{t.title}</span>
                  {t.description && !t.completed && <span className="row__desc">{t.description}</span>}
                </span>
                <span>{list ? <CompanyChip sm list={list} /> : <span className="row__id">—</span>}</span>
                <span>{t.dueDate ? <DueChip task={t} /> : <span className="row__id">—</span>}</span>
                <span>
                  <PriorityMark priority={t.priority} />
                </span>
                <button
                  className="row__delete"
                  aria-label="Delete task"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(t);
                  }}
                >
                  <Icon name="trash" size={14} />
                </button>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
