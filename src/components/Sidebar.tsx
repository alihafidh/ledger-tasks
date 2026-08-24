import { useEffect, useRef, useState } from 'react';
import type { TaskList, View } from '../types';

type Counts = { today: number; upcoming: number; all: number; completed: number };

const NAV_VIEWS: { kind: 'today' | 'upcoming' | 'all' | 'completed'; label: string; icon: string }[] = [
  { kind: 'today', label: 'Today', icon: 'ph-sun' },
  { kind: 'upcoming', label: 'Upcoming', icon: 'ph-calendar-blank' },
  { kind: 'all', label: 'All Tasks', icon: 'ph-tray' },
  { kind: 'completed', label: 'Completed', icon: 'ph-check-circle' },
];

type Props = {
  lists: TaskList[];
  view: View;
  counts: Counts;
  listCounts: Record<string, number>;
  drawer: boolean;
  onNavigate: (v: View) => void;
  onCreateList: (name: string) => void;
  onRenameList: (id: string, name: string) => void;
  onDeleteList: (id: string) => void;
  userName: string;
  onSignOut: () => void;
};

export default function Sidebar({
  lists,
  view,
  counts,
  listCounts,
  drawer,
  onNavigate,
  onCreateList,
  onRenameList,
  onDeleteList,
  userName,
  onSignOut,
}: Props) {
  const [newListOpen, setNewListOpen] = useState(false);
  const [renamingId, setRenamingId] = useState<string | null>(null);

  return (
    <aside className={drawer ? 'sidebar sidebar--drawer' : 'sidebar'}>
      <div className="brand">
        <span className="brand-mark" aria-hidden="true">
          <i className="ph-duotone ph-check-fat" />
        </span>
        <span className="brand-name">Ledger Tasks</span>
      </div>

      <nav className="side-nav" aria-label="Views">
        {NAV_VIEWS.map((v) => {
          const active = view.kind === v.kind;
          const count = counts[v.kind];
          return (
            <button
              key={v.kind}
              className={active ? 'nav-btn active' : 'nav-btn'}
              aria-current={active ? 'page' : undefined}
              onClick={() => onNavigate({ kind: v.kind })}
            >
              <i className={'ph-duotone ' + v.icon} aria-hidden="true" />
              <span className="nav-label">{v.label}</span>
              <span className="nav-count">{count || ''}</span>
            </button>
          );
        })}
      </nav>

      <h6 className="side-head">Lists</h6>
      <nav className="side-nav" aria-label="Lists">
        {lists.map((l) => {
          const active = view.kind === 'list' && view.listId === l.id;
          if (renamingId === l.id) {
            return (
              <InlineNameInput
                key={l.id}
                defaultValue={l.name}
                placeholder="Rename list — Enter to save"
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
              className={active ? 'nav-btn active' : 'nav-btn'}
              aria-current={active ? 'page' : undefined}
              onClick={() => onNavigate({ kind: 'list', listId: l.id })}
            >
              <span className="list-dot" style={{ background: l.dot }} aria-hidden="true" />
              <span className="nav-label">{l.name}</span>
              <span className="nav-count">{listCounts[l.id] || ''}</span>
              <span className="list-tools">
                <span
                  role="button"
                  tabIndex={0}
                  className="list-tool"
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
                  <i className="ph-duotone ph-pencil-simple" aria-hidden="true" />
                </span>
                <span
                  role="button"
                  tabIndex={0}
                  className="list-tool danger"
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
                  <i className="ph-duotone ph-trash" aria-hidden="true" />
                </span>
              </span>
            </button>
          );
        })}
      </nav>

      <div className="new-list-zone">
        {newListOpen ? (
          <InlineNameInput
            placeholder="List name — Enter to add"
            onSubmit={(name) => {
              onCreateList(name);
              setNewListOpen(false);
            }}
            onClose={() => setNewListOpen(false)}
          />
        ) : (
          <button
            className="btn btn-ghost"
            style={{ fontSize: '13.5px', fontWeight: 400, padding: '6px 10px' }}
            onClick={() => setNewListOpen(true)}
          >
            <i className="ph-duotone ph-plus" style={{ fontSize: 14 }} aria-hidden="true" /> New List
          </button>
        )}
      </div>

      <div className="account">
        <span className="account-name" title={userName}>
          {userName}
        </span>
        <button className="btn btn-ghost" onClick={onSignOut}>
          <i className="ph-duotone ph-sign-out" style={{ fontSize: 14 }} aria-hidden="true" /> Sign out
        </button>
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
      className="input"
      style={{ fontSize: '13.5px' }}
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
