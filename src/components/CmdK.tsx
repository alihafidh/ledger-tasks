import { useEffect, useMemo, useRef, useState } from 'react';
import type { Task, TaskList, View } from '../types';
import Icon from './Icon';

export type Command = {
  id: string;
  group: 'Actions' | 'Navigate' | 'Tasks';
  label: string;
  meta?: string;
  icon: string;
  run: () => void;
};

type Props = {
  lists: TaskList[];
  tasks: Task[];
  onClose: () => void;
  onNewTask: () => void;
  onNavigate: (v: View) => void;
  onEditTask: (t: Task) => void;
  onToggleTheme: () => void;
};

export default function CmdK({ lists, tasks, onClose, onNewTask, onNavigate, onEditTask, onToggleTheme }: Props) {
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const commands = useMemo<Command[]>(() => {
    const base: Command[] = [
      { id: 'new', group: 'Actions', label: 'New task', meta: 'N', icon: 'plus', run: () => { onClose(); onNewTask(); } },
      { id: 'theme', group: 'Actions', label: 'Toggle light / dark', icon: 'moon', run: () => { onToggleTheme(); onClose(); } },
      { id: 'nav-home', group: 'Navigate', label: 'Home', icon: 'home', run: () => { onNavigate({ kind: 'home' }); onClose(); } },
      { id: 'nav-today', group: 'Navigate', label: 'Today', icon: 'sparkle', run: () => { onNavigate({ kind: 'today' }); onClose(); } },
      { id: 'nav-upcoming', group: 'Navigate', label: 'Upcoming', icon: 'calendar', run: () => { onNavigate({ kind: 'upcoming' }); onClose(); } },
      { id: 'nav-all', group: 'Navigate', label: 'All Tasks', icon: 'list', run: () => { onNavigate({ kind: 'all' }); onClose(); } },
      { id: 'nav-done', group: 'Navigate', label: 'Done', icon: 'checkCircle', run: () => { onNavigate({ kind: 'completed' }); onClose(); } },
      ...lists.map<Command>((l) => ({
        id: 'nav-list-' + l.id,
        group: 'Navigate',
        label: l.name,
        meta: 'company',
        icon: 'inbox',
        run: () => { onNavigate({ kind: 'list', listId: l.id }); onClose(); },
      })),
    ];
    const q = query.trim().toLowerCase();
    if (!q) return base;
    const matchedBase = base.filter((c) => c.label.toLowerCase().includes(q));
    const matchedTasks = tasks
      .filter((t) => t.title.toLowerCase().includes(q))
      .slice(0, 6)
      .map<Command>((t) => ({
        id: 'task-' + t.id,
        group: 'Tasks',
        label: t.title,
        meta: t.completed ? 'done' : t.dueDate ?? undefined,
        icon: t.completed ? 'checkCircle' : 'circle',
        run: () => { onClose(); onEditTask(t); },
      }));
    return [...matchedBase, ...matchedTasks];
  }, [query, lists, tasks, onClose, onNewTask, onNavigate, onEditTask, onToggleTheme]);

  useEffect(() => {
    setActive(0);
  }, [query]);

  const groups: ('Actions' | 'Navigate' | 'Tasks')[] = ['Actions', 'Navigate', 'Tasks'];

  return (
    <div
      className="cmdk-overlay"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="cmdk" role="dialog" aria-modal="true" aria-label="Command palette">
        <div className="cmdk__input">
          <Icon name="search" size={15} style={{ color: 'var(--ink-4)' }} />
          <input
            ref={inputRef}
            value={query}
            placeholder="Type a command or search tasks…"
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') {
                e.preventDefault();
                setActive((a) => Math.min(a + 1, commands.length - 1));
              } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setActive((a) => Math.max(a - 1, 0));
              } else if (e.key === 'Enter') {
                e.preventDefault();
                commands[active]?.run();
              } else if (e.key === 'Escape') {
                e.stopPropagation();
                onClose();
              }
            }}
          />
          <kbd>esc</kbd>
        </div>
        <div className="cmdk__list">
          {commands.length === 0 && (
            <div className="cmdk__group-title" style={{ padding: '14px' }}>
              No matches
            </div>
          )}
          {groups.map((g) => {
            const items = commands.filter((c) => c.group === g);
            if (!items.length) return null;
            return (
              <div key={g}>
                <div className="cmdk__group-title">{g}</div>
                {items.map((c) => {
                  const idx = commands.indexOf(c);
                  return (
                    <button
                      key={c.id}
                      className={idx === active ? 'cmdk__item is-active' : 'cmdk__item'}
                      onMouseEnter={() => setActive(idx)}
                      onClick={() => c.run()}
                    >
                      <Icon name={c.icon} size={14} />
                      <span>{c.label}</span>
                      {c.meta && <span className="cmdk__item-meta">{c.meta}</span>}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
