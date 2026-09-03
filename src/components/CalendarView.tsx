import { useState } from 'react';
import type { Task, TaskList } from '../types';
import { todayStr } from '../lib/dates';
import Icon from './Icon';

type Props = {
  tasks: Task[]; // already filtered by the toolbar
  listById: Map<string, TaskList>;
  onOpenTask: (t: Task) => void;
};

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function iso(d: Date): string {
  return (
    d.getFullYear() +
    '-' +
    String(d.getMonth() + 1).padStart(2, '0') +
    '-' +
    String(d.getDate()).padStart(2, '0')
  );
}

export default function CalendarView({ tasks, listById, onOpenTask }: Props) {
  const [cursor, setCursor] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const today = todayStr();

  const byDay = new Map<string, Task[]>();
  for (const t of tasks) {
    if (!t.dueDate) continue;
    const arr = byDay.get(t.dueDate) ?? [];
    arr.push(t);
    byDay.set(t.dueDate, arr);
  }

  // Monday-first 6-week grid
  const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
  const offset = (first.getDay() + 6) % 7;
  const start = new Date(first);
  start.setDate(first.getDate() - offset);
  const cells = Array.from({ length: 42 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });

  const monthLabel = cursor.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <div>
      <div className="cal-nav">
        <span className="cal-nav__label">{monthLabel}</span>
        <div className="cal-nav__btns">
          <button
            className="icon-btn"
            aria-label="Previous month"
            onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}
          >
            <Icon name="chevronL" size={15} />
          </button>
          <button
            className="btn btn--sm btn--outline"
            onClick={() => {
              const now = new Date();
              setCursor(new Date(now.getFullYear(), now.getMonth(), 1));
            }}
          >
            Today
          </button>
          <button
            className="icon-btn"
            aria-label="Next month"
            onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}
          >
            <Icon name="chevronR" size={15} />
          </button>
        </div>
      </div>
      <div className="cal">
        <div className="cal__head">
          {WEEKDAYS.map((d) => (
            <div key={d}>{d}</div>
          ))}
        </div>
        <div className="cal__grid">
          {cells.map((d) => {
            const key = iso(d);
            const muted = d.getMonth() !== cursor.getMonth();
            const isToday = key === today;
            const dayTasks = byDay.get(key) ?? [];
            return (
              <div
                key={key}
                className={
                  'cal__cell' + (muted ? ' is-muted' : '') + (isToday ? ' is-today' : '')
                }
              >
                <span className="cal__date">{d.getDate()}</span>
                {dayTasks.slice(0, 3).map((t) => {
                  const list = t.listId ? listById.get(t.listId) : undefined;
                  return (
                    <button
                      key={t.id}
                      className="cal__evt"
                      style={list ? { borderLeftColor: list.dot } : undefined}
                      title={t.title + (list ? ' · ' + list.name : '')}
                      onClick={() => onOpenTask(t)}
                    >
                      {t.completed ? <s>{t.title}</s> : t.title}
                    </button>
                  );
                })}
                {dayTasks.length > 3 && (
                  <span className="cal__more mono">+{dayTasks.length - 3} more</span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
