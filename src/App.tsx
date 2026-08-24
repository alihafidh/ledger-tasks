import { useEffect, useMemo, useRef, useState } from 'react';
import type { Priority, SortKey, Task, TaskList, View } from './types';
import { LIST_DOTS, loadData, newId, saveData, seedData } from './lib/storage';
import { formatLongDate, offsetStr, todayStr } from './lib/dates';
import Sidebar from './components/Sidebar';
import PlateHeading from './components/PlateHeading';
import ProgressBar from './components/ProgressBar';
import FilterBar from './components/FilterBar';
import TaskItem from './components/TaskItem';
import TaskModal, { type TaskFormValues } from './components/TaskModal';
import ConfirmDialog from './components/ConfirmDialog';
import EmptyState from './components/EmptyState';
import UndoToast from './components/UndoToast';
import AuthScreen from './components/AuthScreen';
import { currentUser, signOut, type User } from './lib/auth';

type ModalState = { mode: 'add' } | { mode: 'edit'; task: Task } | null;
type UndoState = { task: Task; index: number } | null;

const PRIORITY_RANK: Record<Priority, number> = { high: 0, medium: 1, low: 2 };

export default function App() {
  const [user, setUser] = useState<User | null>(() => currentUser());
  if (!user) return <AuthScreen onAuthed={setUser} />;
  return (
    <TaskApp
      key={user.id}
      user={user}
      onSignOut={() => {
        signOut();
        setUser(null);
      }}
    />
  );
}

function TaskApp({ user, onSignOut }: { user: User; onSignOut: () => void }) {
  const [{ tasks, lists }, setData] = useState(
    () => loadData(user.id) ?? persistAndReturn(user.id, seedData()),
  );
  const [view, setView] = useState<View>({ kind: 'today' });
  const [query, setQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<Priority | 'all'>('all');
  const [listFilter, setListFilter] = useState('');
  const [sort, setSort] = useState<SortKey>('due');
  const [modal, setModal] = useState<ModalState>(null);
  const [undo, setUndo] = useState<UndoState>(null);
  const [deleteListId, setDeleteListId] = useState<string | null>(null);
  const [narrow, setNarrow] = useState(() => window.matchMedia('(max-width: 920px)').matches);
  const [sbOpen, setSbOpen] = useState(false);

  const searchRef = useRef<HTMLInputElement>(null);
  const undoTimer = useRef<number | undefined>(undefined);

  const update = (next: { tasks?: Task[]; lists?: TaskList[] }) =>
    setData((prev) => {
      const merged = { tasks: next.tasks ?? prev.tasks, lists: next.lists ?? prev.lists };
      saveData(user.id, merged);
      return merged;
    });

  // Import link: opening /#import=<base64 JSON> adds lists and tasks to the
  // signed-in account, then cleans the URL. Tasks whose title already exists
  // are skipped, so opening the same link twice doesn't duplicate anything.
  useEffect(() => {
    const m = window.location.hash.match(/^#import=(.+)$/);
    if (!m) return;
    window.history.replaceState(null, '', window.location.pathname);
    try {
      const payload = JSON.parse(atob(decodeURIComponent(m[1]))) as {
        lists?: string[];
        tasks?: { title: string; list?: string; description?: string; priority?: Priority; dueDate?: string; dueTime?: string }[];
      };
      setData((prev) => {
        const now = Date.now();
        const lists = [...prev.lists];
        const listIdByName = (name: string) => {
          const existing = lists.find((l) => l.name.toLowerCase() === name.toLowerCase());
          if (existing) return existing.id;
          const created: TaskList = {
            id: newId(),
            name,
            dot: LIST_DOTS[lists.length % LIST_DOTS.length],
            createdAt: now,
          };
          lists.push(created);
          return created.id;
        };
        for (const name of payload.lists ?? []) listIdByName(name);
        const tasks = [...prev.tasks];
        for (const t of payload.tasks ?? []) {
          if (!t.title || tasks.some((x) => x.title.toLowerCase() === t.title.toLowerCase())) continue;
          tasks.push({
            id: newId(),
            title: t.title,
            description: t.description || undefined,
            notes: undefined,
            completed: false,
            completedAt: null,
            priority: t.priority ?? 'medium',
            listId: t.list ? listIdByName(t.list) : undefined,
            dueDate: t.dueDate || undefined,
            dueTime: t.dueTime || undefined,
            createdAt: now,
            updatedAt: now,
          });
        }
        const merged = { tasks, lists };
        saveData(user.id, merged);
        return merged;
      });
    } catch {
      // malformed link — ignore
    }
  }, [user.id]);

  // Responsive breakpoint — the sidebar becomes a drawer below 920px.
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 920px)');
    const onMq = () => {
      setNarrow(mq.matches);
      setSbOpen(false);
    };
    mq.addEventListener('change', onMq);
    return () => mq.removeEventListener('change', onMq);
  }, []);

  // Keyboard shortcuts: N adds a task, / focuses search, Escape closes layers.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setModal(null);
        setDeleteListId(null);
        setSbOpen(false);
        return;
      }
      const target = e.target as HTMLElement;
      const tag = (target.tagName || '').toUpperCase();
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target.isContentEditable) return;
      if (e.key === 'n' || e.key === 'N') {
        e.preventDefault();
        setModal({ mode: 'add' });
        setSbOpen(false);
      }
      if (e.key === '/') {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => () => window.clearTimeout(undoTimer.current), []);

  // — task operations —

  const addTask = (v: TaskFormValues) => {
    const now = Date.now();
    const task: Task = {
      id: newId(),
      title: v.title,
      description: v.description || undefined,
      notes: v.notes || undefined,
      completed: false,
      completedAt: null,
      priority: v.priority,
      listId: v.listId || undefined,
      dueDate: v.dueDate || undefined,
      dueTime: v.dueTime || undefined,
      createdAt: now,
      updatedAt: now,
    };
    update({ tasks: [...tasks, task] });
  };

  const editTask = (id: string, v: TaskFormValues) => {
    update({
      tasks: tasks.map((t) =>
        t.id === id
          ? {
              ...t,
              title: v.title,
              description: v.description || undefined,
              notes: v.notes || undefined,
              priority: v.priority,
              listId: v.listId || undefined,
              dueDate: v.dueDate || undefined,
              dueTime: v.dueTime || undefined,
              updatedAt: Date.now(),
            }
          : t,
      ),
    });
  };

  const toggleTask = (task: Task) => {
    update({
      tasks: tasks.map((t) =>
        t.id === task.id
          ? { ...t, completed: !t.completed, completedAt: !t.completed ? Date.now() : null, updatedAt: Date.now() }
          : t,
      ),
    });
  };

  const deleteTask = (task: Task) => {
    const index = tasks.findIndex((t) => t.id === task.id);
    update({ tasks: tasks.filter((t) => t.id !== task.id) });
    window.clearTimeout(undoTimer.current);
    setUndo({ task, index });
    undoTimer.current = window.setTimeout(() => setUndo(null), 6000);
  };

  const undoDelete = () => {
    if (!undo) return;
    setData((prev) => {
      const next = [...prev.tasks];
      next.splice(Math.min(undo.index, next.length), 0, undo.task);
      const merged = { ...prev, tasks: next };
      saveData(user.id, merged);
      return merged;
    });
    window.clearTimeout(undoTimer.current);
    setUndo(null);
  };

  // — list operations —

  const createList = (name: string) => {
    if (lists.some((l) => l.name.toLowerCase() === name.toLowerCase())) return;
    const list: TaskList = {
      id: newId(),
      name,
      dot: LIST_DOTS[lists.length % LIST_DOTS.length],
      createdAt: Date.now(),
    };
    update({ lists: [...lists, list] });
    setView({ kind: 'list', listId: list.id });
  };

  const renameList = (id: string, name: string) => {
    if (lists.some((l) => l.id !== id && l.name.toLowerCase() === name.toLowerCase())) return;
    update({ lists: lists.map((l) => (l.id === id ? { ...l, name } : l)) });
  };

  const deleteList = (id: string) => {
    // Tasks are kept — they simply lose their list assignment.
    update({
      lists: lists.filter((l) => l.id !== id),
      tasks: tasks.map((t) => (t.listId === id ? { ...t, listId: undefined } : t)),
    });
    if (view.kind === 'list' && view.listId === id) setView({ kind: 'all' });
    if (listFilter === id) setListFilter('');
    setDeleteListId(null);
  };

  // — derived view data —

  const today = todayStr();
  const tomorrow = offsetStr(1);
  const listById = useMemo(() => new Map(lists.map((l) => [l.id, l])), [lists]);
  const activeList = view.kind === 'list' ? listById.get(view.listId) : undefined;

  const inView = (t: Task): boolean => {
    switch (view.kind) {
      case 'today':
        return !!t.dueDate && t.dueDate <= today;
      case 'upcoming':
        return !!t.dueDate && t.dueDate > today;
      case 'completed':
        return t.completed;
      case 'list':
        return t.listId === view.listId;
      case 'all':
        return true;
    }
  };

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const matches = (t: Task) => {
      if (!q) return true;
      const listName = t.listId ? listById.get(t.listId)?.name ?? '' : '';
      return (t.title + ' ' + (t.description ?? '') + ' ' + (t.notes ?? '') + ' ' + listName)
        .toLowerCase()
        .includes(q);
    };
    const filtered = tasks.filter(
      (t) =>
        inView(t) &&
        matches(t) &&
        (priorityFilter === 'all' || t.priority === priorityFilter) &&
        (!listFilter || t.listId === listFilter),
    );
    return [...filtered].sort((a, b) => {
      if (view.kind !== 'completed' && a.completed !== b.completed) return a.completed ? 1 : -1;
      if (view.kind === 'completed') return (b.completedAt ?? 0) - (a.completedAt ?? 0);
      if (sort === 'priority')
        return (
          PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority] ||
          (a.dueDate ?? '9999').localeCompare(b.dueDate ?? '9999')
        );
      if (sort === 'created') return b.createdAt - a.createdAt;
      if (sort === 'alpha') return a.title.localeCompare(b.title, undefined, { sensitivity: 'base' });
      return (
        ((a.dueDate ?? '9999') + (a.dueTime ?? '23:59')).localeCompare(
          (b.dueDate ?? '9999') + (b.dueTime ?? '23:59'),
        ) || PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority]
      );
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tasks, lists, view, query, priorityFilter, listFilter, sort]);

  // Upcoming groups tasks into Tomorrow / This Week / Later.
  const grouped = useMemo(() => {
    if (view.kind !== 'upcoming') return null;
    const weekEnd = offsetStr(7);
    const groups: { label: string; tasks: Task[] }[] = [
      { label: 'Tomorrow', tasks: [] },
      { label: 'This Week', tasks: [] },
      { label: 'Later', tasks: [] },
    ];
    for (const t of visible) {
      if (t.dueDate === tomorrow) groups[0].tasks.push(t);
      else if (t.dueDate! <= weekEnd) groups[1].tasks.push(t);
      else groups[2].tasks.push(t);
    }
    return groups.filter((g) => g.tasks.length > 0);
  }, [view.kind, visible, tomorrow]);

  const total = visible.length;
  const doneCount = visible.filter((t) => t.completed).length;
  const isFiltered = !!query.trim() || priorityFilter !== 'all' || !!listFilter;

  const counts = useMemo(
    () => ({
      today: tasks.filter((t) => !t.completed && t.dueDate && t.dueDate <= today).length,
      upcoming: tasks.filter((t) => !t.completed && t.dueDate && t.dueDate > today).length,
      all: tasks.filter((t) => !t.completed).length,
      completed: tasks.filter((t) => t.completed).length,
    }),
    [tasks, today],
  );
  const listCounts = useMemo(() => {
    const m: Record<string, number> = {};
    for (const t of tasks) if (!t.completed && t.listId) m[t.listId] = (m[t.listId] ?? 0) + 1;
    return m;
  }, [tasks]);

  const heading =
    view.kind === 'list'
      ? activeList?.name ?? 'List'
      : { today: 'Today', upcoming: 'Upcoming', all: 'All Tasks', completed: 'Completed' }[view.kind];
  const subline =
    view.kind === 'today'
      ? formatLongDate(new Date())
      : view.kind === 'upcoming'
        ? 'What comes after today'
        : view.kind === 'all'
          ? 'Every task, every list'
          : view.kind === 'completed'
            ? counts.completed === 1
              ? '1 task completed'
              : counts.completed + ' tasks completed'
            : (listCounts[view.kind === 'list' ? view.listId : ''] ?? 0) + ' open in this list';

  const emptyDef = isFiltered
    ? { icon: 'ph-magnifying-glass', title: 'No matches', copy: 'Nothing fits the current search or filter. Try widening it.' }
    : view.kind === 'today'
      ? { icon: 'ph-sun-horizon', title: "You're all clear for today", copy: 'Nothing due today. Press N to add a task.' }
      : view.kind === 'upcoming'
        ? { icon: 'ph-calendar-blank', title: 'An open calendar', copy: 'No upcoming tasks on the schedule yet.' }
        : view.kind === 'all'
          ? { icon: 'ph-tray', title: 'No tasks yet', copy: 'Add your first task to get started.' }
          : view.kind === 'completed'
            ? { icon: 'ph-check-circle', title: 'No completed tasks yet', copy: 'Completed tasks will be archived here.' }
            : { icon: 'ph-list-checks', title: 'An empty list', copy: 'Nothing here yet. Press N to add a task to this list.' };

  const navigate = (v: View) => {
    setView(v);
    setSbOpen(false);
    setPriorityFilter('all');
    setListFilter('');
    setQuery('');
  };

  const deletingList = deleteListId ? listById.get(deleteListId) : undefined;
  const deletingListTaskCount = deleteListId ? tasks.filter((t) => t.listId === deleteListId).length : 0;

  const showSidebar = !narrow || sbOpen;

  return (
    <div className="app">
      {narrow && sbOpen && <button className="backdrop" aria-label="Close menu" onClick={() => setSbOpen(false)} />}
      {showSidebar && (
        <Sidebar
          lists={lists}
          view={view}
          counts={counts}
          listCounts={listCounts}
          drawer={narrow}
          onNavigate={navigate}
          onCreateList={createList}
          onRenameList={renameList}
          onDeleteList={(id) => setDeleteListId(id)}
          userName={user.name || user.email}
          onSignOut={onSignOut}
        />
      )}

      <main className={narrow ? 'main main--narrow' : 'main'}>
        <div className="main-inner">
          <header className="page-head">
            <div style={{ minWidth: 0 }}>
              {narrow && (
                <button
                  className="btn btn-icon btn-secondary"
                  aria-label="Open menu"
                  style={{ marginBottom: 14 }}
                  onClick={() => setSbOpen(true)}
                >
                  <i className="ph-duotone ph-list" style={{ fontSize: 18 }} aria-hidden="true" />
                </button>
              )}
              <PlateHeading text={heading} />
              <p className="text-muted page-subline">{subline}</p>
            </div>
            <button
              className="btn btn-primary"
              style={{ flex: 'none', marginTop: 6 }}
              onClick={() => setModal({ mode: 'add' })}
            >
              <i className="ph-duotone ph-plus" style={{ fontSize: 15 }} aria-hidden="true" /> Add Task
            </button>
          </header>

          {view.kind !== 'completed' && total > 0 && <ProgressBar done={doneCount} total={total} />}

          <FilterBar
            query={query}
            onQuery={setQuery}
            searchRef={searchRef}
            priorityFilter={priorityFilter}
            onPriorityFilter={setPriorityFilter}
            listFilter={listFilter}
            onListFilter={setListFilter}
            showListFilter={view.kind !== 'list'}
            lists={lists}
            sort={sort}
            onSort={setSort}
          />

          <div className="task-list">
            {grouped
              ? grouped.map((g) => (
                  <section key={g.label}>
                    <h2 className="group-head">{g.label}</h2>
                    {g.tasks.map((t) => (
                      <TaskItem
                        key={t.id}
                        task={t}
                        list={t.listId ? listById.get(t.listId) : undefined}
                        onToggle={toggleTask}
                        onEdit={(task) => setModal({ mode: 'edit', task })}
                        onDelete={deleteTask}
                      />
                    ))}
                  </section>
                ))
              : visible.map((t) => (
                  <TaskItem
                    key={t.id}
                    task={t}
                    list={t.listId ? listById.get(t.listId) : undefined}
                    onToggle={toggleTask}
                    onEdit={(task) => setModal({ mode: 'edit', task })}
                    onDelete={deleteTask}
                  />
                ))}
          </div>

          {total === 0 && (
            <EmptyState
              icon={emptyDef.icon}
              title={emptyDef.title}
              copy={emptyDef.copy}
              actionLabel={isFiltered ? undefined : 'Add a task'}
              onAction={isFiltered ? undefined : () => setModal({ mode: 'add' })}
            />
          )}
        </div>
      </main>

      {undo && <UndoToast title={undo.task.title} onUndo={undoDelete} />}

      {modal && (
        <TaskModal
          mode={modal.mode}
          task={modal.mode === 'edit' ? modal.task : undefined}
          lists={lists}
          defaultListId={view.kind === 'list' ? view.listId : undefined}
          onClose={() => setModal(null)}
          onSubmit={(v) => {
            if (modal.mode === 'edit') editTask(modal.task.id, v);
            else addTask(v);
            setModal(null);
          }}
        />
      )}

      {deletingList && (
        <ConfirmDialog
          title={'Delete “' + deletingList.name + '”?'}
          body={
            deletingListTaskCount > 0
              ? `The list will be removed. Its ${deletingListTaskCount === 1 ? 'task stays' : deletingListTaskCount + ' tasks stay'} in All Tasks, unassigned.`
              : 'The list is empty and will be removed.'
          }
          confirmLabel="Delete List"
          onConfirm={() => deleteList(deletingList.id)}
          onClose={() => setDeleteListId(null)}
        />
      )}
    </div>
  );
}

function persistAndReturn(userId: string, data: ReturnType<typeof seedData>) {
  saveData(userId, data);
  return data;
}
