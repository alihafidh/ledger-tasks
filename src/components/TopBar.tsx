import type { RefObject } from 'react';
import Icon from './Icon';
import ThemeToggle from './ThemeToggle';

type Props = {
  title: string;
  sub: string;
  narrow: boolean;
  query: string;
  onQuery: (q: string) => void;
  searchRef: RefObject<HTMLInputElement | null>;
  onOpenMenu: () => void;
  onNewTask: () => void;
};

export default function TopBar({ title, sub, narrow, query, onQuery, searchRef, onOpenMenu, onNewTask }: Props) {
  return (
    <div className="topbar">
      <div className="topbar__titles">
        <div className="topbar__crumbs">
          {narrow && (
            <button className="icon-btn icon-btn--ghost topbar__menu" aria-label="Open menu" onClick={onOpenMenu}>
              <Icon name="menu" size={16} />
            </button>
          )}
          Workspace <span aria-hidden="true">›</span> <span className="topbar__crumb-current">{title}</span>
        </div>
        <h1 className="topbar__title">{title}</h1>
        <div className="topbar__sub">{sub}</div>
      </div>
      <div className="topbar__tools">
        <div className="search-trigger search-trigger--live">
          <Icon name="search" size={14} />
          <input
            ref={searchRef}
            value={query}
            placeholder="Search tasks…"
            aria-label="Search tasks"
            onChange={(e) => onQuery(e.target.value)}
          />
          <kbd>/</kbd>
        </div>
        <ThemeToggle />
        <button className="btn btn--md btn--primary" onClick={onNewTask}>
          <Icon name="plus" size={14} /> New
        </button>
      </div>
    </div>
  );
}
