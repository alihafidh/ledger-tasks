import type { Task, TaskList } from '../types';
import { formatLongDate, offsetStr, todayStr } from '../lib/dates';
import { CompanyChip, DueChip, PriorityMark, ProgressBar, Cbx, taskOverdue } from './primitives';
import Icon from './Icon';

type Props = {
  tasks: Task[];
  lists: TaskList[];
  userName: string;
  onToggle: (t: Task) => void;
  onOpenTask: (t: Task) => void;
  onNewTask: () => void;
  onNavigateList: (listId: string) => void;
};

export default function HomeView({ tasks, lists, userName, onToggle, onOpenTask, onNewTask, onNavigateList }: Props) {
  const today = todayStr();
  const open = tasks.filter((t) => !t.completed);
  const done = tasks.filter((t) => t.completed);
  const overdue = open.filter(taskOverdue);
  const dueToday = open.filter((t) => t.dueDate === today);
  const weekEnd = offsetStr(7);
  const thisWeek = open
    .filter((t) => t.dueDate && t.dueDate > today && t.dueDate <= weekEnd)
    .sort((a, b) => (a.dueDate! + (a.dueTime ?? '')).localeCompare(b.dueDate! + (b.dueTime ?? '')))
    .slice(0, 6);
  const focus = open
    .filter((t) => t.dueDate)
    .sort((a, b) => (a.dueDate! + (a.dueTime ?? '')).localeCompare(b.dueDate! + (b.dueTime ?? '')))
    .slice(0, 5);

  const hour = new Date().getHours();
  const greet = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const listById = new Map(lists.map((l) => [l.id, l]));

  return (
    <div className="home">
      <div className="home__left">
        <div className="hero">
          <div>
            <div className="hero__eyebrow">{formatLongDate(new Date())}</div>
            <div className="hero__greet">
              {greet}, {userName}.
            </div>
            <div className="hero__line">
              {overdue.length > 0 ? (
                <>
                  <b style={{ color: 'var(--warn)' }}>
                    {overdue.length} task{overdue.length === 1 ? ' is' : 's are'} overdue
                  </b>{' '}
                  — worth a look first.
                </>
              ) : dueToday.length > 0 ? (
                <>
                  {dueToday.length} task{dueToday.length === 1 ? '' : 's'} due today. Steady as she goes.
                </>
              ) : (
                <>You're on top of things — nothing due today.</>
              )}
            </div>
          </div>
          <div className="hero__stats">
            <div className="hero__stat">
              <div className="hero__stat-n">{open.length}</div>
              <div className="hero__stat-k">Open</div>
            </div>
            <div className="hero__stat">
              <div className="hero__stat-n">{done.length}</div>
              <div className="hero__stat-k">Done</div>
            </div>
          </div>
        </div>

        <div className="stat-row">
          <div className="stat">
            <div className="flex--between">
              <span className="stat__k">Completed</span>
              <Icon name="check" size={14} style={{ color: 'var(--accent-strong)' }} />
            </div>
            <div className="stat__n">
              {done.length}/{tasks.length}
            </div>
            <ProgressBar value={tasks.length ? done.length / tasks.length : 0} />
            <div className="stat__foot">across all companies</div>
          </div>
          <div className="stat">
            <div className="flex--between">
              <span className="stat__k">Due today</span>
              <Icon name="target" size={14} style={{ color: 'var(--accent-strong)' }} />
            </div>
            <div className="stat__n">{dueToday.length}</div>
            <ProgressBar value={open.length ? dueToday.length / open.length : 0} />
            <div className="stat__foot">of {open.length} open tasks</div>
          </div>
          <div className="stat">
            <div className="flex--between">
              <span className="stat__k">Overdue</span>
              <Icon name="flag" size={14} style={{ color: overdue.length ? 'var(--warn)' : 'var(--ink-4)' }} />
            </div>
            <div className="stat__n" style={overdue.length ? { color: 'var(--warn)' } : undefined}>
              {overdue.length}
            </div>
            <ProgressBar value={open.length ? overdue.length / open.length : 0} tint="var(--warn)" />
            <div className="stat__foot">{overdue.length ? 'needs attention' : 'all clear'}</div>
          </div>
        </div>

        <div className="card">
          <div className="card__head">
            <div>
              <div className="card__title">Today's focus</div>
              <div className="card__sub">5 closest due dates</div>
            </div>
            <button className="btn btn--sm btn--ghost" onClick={onNewTask}>
              <Icon name="plus" size={13} /> New task
            </button>
          </div>
          <div className="card__body">
            {focus.length === 0 ? (
              <div className="home-empty">Nothing scheduled. Add a task with a due date and it shows up here.</div>
            ) : (
              focus.map((t) => (
                <div key={t.id} className="row row--compact" onClick={() => onOpenTask(t)}>
                  <Cbx checked={t.completed} onToggle={() => onToggle(t)} size={14} />
                  <span className="row__title">{t.title}</span>
                  <span className="row__right" style={{ gap: 8 }}>
                    {t.listId && listById.get(t.listId) && <CompanyChip sm list={listById.get(t.listId)!} />}
                    <DueChip task={t} />
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="home__right">
        <div className="card">
          <div className="card__head">
            <div>
              <div className="card__title">Companies</div>
              <div className="card__sub">open tasks by list</div>
            </div>
          </div>
          <div className="card__body">
            {lists.length === 0 ? (
              <div className="home-empty">No companies yet — add one from the sidebar.</div>
            ) : (
              lists.map((l) => {
                const listOpen = open.filter((t) => t.listId === l.id);
                const listAll = tasks.filter((t) => t.listId === l.id);
                return (
                  <button key={l.id} className="plan-card plan-card--btn" onClick={() => onNavigateList(l.id)}>
                    <div className="plan-card__top">
                      <CompanyChip sm list={l} />
                      <span className="mono plan-card__pct">
                        {listAll.length ? Math.round(((listAll.length - listOpen.length) / listAll.length) * 100) : 0}%
                      </span>
                    </div>
                    <ProgressBar value={listAll.length ? (listAll.length - listOpen.length) / listAll.length : 0} />
                    <div className="plan-card__meta">
                      <span>{listOpen.length} open</span>
                      <span>{listAll.length} total</span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        <div className="card">
          <div className="card__head">
            <div>
              <div className="card__title">This week</div>
              <div className="card__sub">next 7 days</div>
            </div>
          </div>
          <div className="card__body">
            {thisWeek.length === 0 ? (
              <div className="home-empty">An open calendar — nothing due this week yet.</div>
            ) : (
              thisWeek.map((t) => (
                <div key={t.id} className="row row--compact" onClick={() => onOpenTask(t)}>
                  <PriorityMark priority={t.priority} />
                  <span className="row__title">{t.title}</span>
                  <span className="row__right">
                    <DueChip task={t} />
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
