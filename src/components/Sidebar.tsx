import { useEffect, useRef, useState } from 'react';
import type { TaskList, View } from '../types';
import Icon from './Icon';

type Counts = { home: number; today: number; upcoming: number; all: number; completed: number };

const NAV_VIEWS: { kind: 'home' | 'today' | 'upcoming' | 'all' | 'completed'; label: string; icon: string }[] = [
  { kind: 'home', label: 'Home', icon: 'home' },
  { kind: 'today', label: 'Today', icon: 'sparkle' },
  { kind: 'upcoming', label: 'Upcoming', icon: 'calendar' },
  { kind: 'all', label: 'All Tasks', icon: 'list' },
  { kind: 'completed', label: 'Done', icon: 'checkCircle' },
];

type Props = {
  lists: TaskList[];
  view: View;
  counts: Counts;
  listCounts: Record<string, number>;
  drawer: boolean;
  userName: string;
  onNavigate: (v: View) => void;
  onNewTask: () => void;
  onCreateList: (name: string) => void;
  onRenameList: (id: string, name: string) => void;
  onDeleteList: (id: string) => void;
  onSignOut: () => void;
};

export default function Sidebar({
  lists,
  view,
  counts,
  listCounts,
  drawer,
  userName,
  onNavigate,
  onNewTask,
  onCreateList,
  onRenameList,
  onDeleteList,
  onSignOut,
}: Props) {
  const [newListOpen, setNewListOpen] = useState(false);
  const [renamingId, setRenamingId] = useState<string | null>(null);

  return (
    <aside className={drawer ? 'sidebar sidebar--drawer' : 'sidebar'}>
      <div className="sidebar__top">
        <div className="brand">
          <span className="brand__mark" aria-hidden="true">
            <span />
            <span />
            <span />
            <span />
          </span>
          <span className="brand__text">
            <div className="brand__name">Ledger Tasks</div>
            <div className="brand__sub">workspace</div>
          </span>
        </div>
      </div>

      <button className="new-task" onClick={onNewTask}>
        <Icon name="plus" size={15} />
        <span>New task</span>
        <kbd>N</kbd>
      </button>

      <nav className="nav" aria-label="Views">
        {NAV_VIEWS.map((v) => {
          const active = view.kind === v.kind;
          const count =
            v.kind === 'today' ? counts.today : v.kind === 'all' ? counts.all : v.kind === 'upcoming' ? counts.upcoming : 0;
          return (
            <button
              key={v.kind}
              className={active ? 'nav__item is-active' : 'nav__item'}
              aria-current={active ? 'page' : undefined}
              onClick={() => onNavigate({ kind: v.kind } as View)}
            >
              <Icon name={v.icon} size={16} />
              <span className="nav__label">{v.label}</span>
              {count > 0 && <span className="nav__count">{count}</span>}
            </button>
          );
        })}
      </nav>

      <div className="sidebar__section">
        <div className="sidebar__section-title" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          Companies
          <button
            className="icon-btn icon-btn--ghost"
            style={{ width: 22, height: 22 }}
            aria-label="New list"
            onClick={() => setNewListOpen(true)}
          >
            <Icon name="plus" size={13} />
          </button>
        </div>
        {lists.map((l) => {
          const active = view.kind === 'list' && view.listId === l.id;
          if (renamingId === l.id) {
            return (
              <InlineNameInput
                key={l.id}
                defaultValue={l.name}
                placeholder="Rename — Enter to save"
                onSubmit={(name) => {
                  onRenameList(l.id, name);
                  setRenamingId(null);
                }}
                onClose={() => setRenamingId(null)}
              />
            );
          }
          return (
            <button
              key={l.id}
              className={active ? 'company-row nav__item is-active' : 'company-row'}
              aria-current={active ? 'page' : undefined}
              onClick={() => onNavigate({ kind: 'list', listId: l.id })}
              onDoubleClick={() => setRenamingId(l.id)}
            >
              <span className="company-row__dot" style={{ background: l.dot }} />
              <span className="company-row__name">{l.name}</span>
              <span className="company-row__tools">
                <span
                  role="button"
                  tabIndex={0}
                  className="company-row__tool"
                  aria-label={'Rename list ' + l.name}
                  onClick={(e) => {
                    e.stopPropagation();
                    setRenamingId(l.id);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      e.stopPropagation();
                      setRenamingId(l.id);
                    }
                  }}
                >
                  <Icon name="pencil" size={12} />
                </span>
                <span
                  role="button"
                  tabIndex={0}
                  className="company-row__tool company-row__tool--danger"
                  aria-label={'Delete list ' + l.name}
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteList(l.id);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      e.stopPropagation();
                      onDeleteList(l.id);
                    }
                  }}
                >
                  <Icon name="trash" size={12} />
                </span>
              </span>
              <span className="company-row__count nav__count">{listCounts[l.id] || ''}</span>
            </button>
          );
        })}
        {newListOpen && (
          <InlineNameInput
            placeholder="Company name — Enter"
            onSubmit={(name) => {
              onCreateList(name);
              setNewListOpen(false);
            }}
            onClose={() => setNewListOpen(false)}
          />
        )}
      </div>

      <div className="sidebar__foot">
        <div className="team">
          <span className="avatar" style={{ background: 'var(--bg-elev-2)', color: 'var(--ink-2)', borderColor: 'var(--border)' }}>
            {userName.slice(0, 2).toUpperCase()}
          </span>
          <span className="team__label" title={userName}>
            {userName}
          </span>
          <button
            className="icon-btn icon-btn--ghost"
            style={{ marginLeft: 'auto' }}
            aria-label="Sign out"
            title="Sign out"
            onClick={onSignOut}
          >
            <Icon name="logout" size={15} />
          </button>
        </div>
      </div>
    </aside>
  );
}

function InlineNameInput({
  defaultValue = '',
  placeholder,
  onSubmit,
  onClose,
}: {
  defaultValue?: string;
  placeholder: string;
  onSubmit: (name: string) => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    ref.current?.focus();
    ref.current?.select();
  }, []);
  return (
    <input
      ref={ref}
      className="sidebar__inline-input"
      defaultValue={defaultValue}
      placeholder={placeholder}
      aria-label={placeholder}
      onBlur={onClose}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          const name = e.currentTarget.value.trim();
          if (name) onSubmit(name);
          else onClose();
        }
        if (e.key === 'Escape') {
          e.stopPropagation();
          onClose();
        }
      }}
    />
  );
}
