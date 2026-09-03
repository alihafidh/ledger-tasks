import { useEffect, useMemo, useRef, useState } from 'react';
import type { Priority, SortKey, Task, TaskList, View } from './types';
import { LIST_DOTS, emptyData, loadData, newId, saveData } from './lib/storage';
import { formatLongDate, offsetStr, todayStr } from './lib/dates';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import HomeView from './components/HomeView';
import TaskTable from './components/TaskTable';
import FilterBar from './components/FilterBar';
import TaskModal, { type TaskFormValues } from './components/TaskModal';
import ConfirmDialog from './components/ConfirmDialog';
import EmptyState from './components/EmptyState';
import UndoToast from './components/UndoToast';
import AuthScreen from './components/AuthScreen';
import { currentUser, signOut, type User } from './lib/auth';
import { PRESETS, type ImportPayload } from './lib/presets';
import { initTheme } from './lib/theme';

type ModalState = { mode: 'add' } | { mode: 'edit'; task: Task } | null;
type UndoState = { task: Task; index: number } | null;

const PRIORITY_RANK: Record<Priority, number> = { high: 0, medium: 1, low: 2 };

export default function App() {
  const [user, setUser] = useState<User | null>(() => currentUser());
  useEffect(() => initTheme(), []);
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
    () => loadData(user.id) ?? persistAndReturn(user.id, emptyData()),
  );
  const [view, setView] = useState<View>({ kind: 'home' });
  const [query, setQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<Priority | 'all'>('all');
  const [listFilter, setListFilter] = useState('');
  const [sort, setSort] = useState<SortKey>('due');
  const [showDone, setShowDone] = useState(false);
  const [modal, setModal] = useState<ModalState>(null);
  const [undo, setUndo] = useState<UndoState>(null);
  const [notice, setNoticeRaw] = useState<string | null>(null);
  const [deleteListId, setDeleteListId] = useState<string | null>(null);
  const [narrow, setNarrow] = useState(() => window.matchMedia('(max-width: 920px)').matches);
  const [sbOpen, setSbOpen] = useState(false);

  const searchRef = useRef<HTMLInputElement>(null);
  const undoTimer = useRef<number | undefined>(undefined);
  const noticeTimer = useRef<number | undefined>(undefined);

  const setNotice = (msg: string) => {
    window.clearTimeout(noticeTimer.current);
    setNoticeRaw(msg);
    noticeTimer.current = window.setTimeout(() => setNoticeRaw(null), 6000);
  };

  const update = (next: { tasks?: Task[]; lists?: TaskList[] }) =>
    setData((prev) => {
      const merged = { tasks: next.tasks ?? prev.tasks, lists: next.lists ?? prev.lists };
      saveData(user.id, merged);
      return merged;
    });

  // Import links: /?apply=<preset> | /?import=<base64> (also #apply/#import).
  useEffect(() => {
    const processImport = () => {
      const params = new URLSearchParams(window.location.search);
      const hash = window.location.hash;
      const impHash = hash.match(/^#import=(.+)$/);
      const appHash = hash.match(/^#apply=([\w-]+)/);
      const imp = impHash ? [impHash[0], impHash[1]] : params.get('import') ? ['', params.get('import')!] : null;
      const app = appHash ? [appHash[0], appHash[1]] : params.get('apply') ? ['', params.get('apply')!] : null;
      if (!imp && !app) return;
      let payload: ImportPayload | undefined;
      if (app) {
        payload = PRESETS[app[1]];
        if (!payload) {
          const flag = 'ledger.reloaded.' + app[1];
          if (!sessionStorage.getItem(flag)) {
            sessionStorage.setItem(flag, '1');
            window.location.reload();
            return;
          }
          window.history.replaceState(null, '', window.location.pathname);
          setNotice('This link isn’t recognized — it may be newer than the app version you have open.');
          return;
        }
      } else {
        try {
          payload = JSON.parse(atob(decodeURIComponent(imp![1]))) as ImportPayload;
        } catch {
          window.history.replaceState(null, '', window.location.pathname);
          setNotice('That link looks broken — it may have been cut off when copied.');
          return;
        }
      }
      window.history.replaceState(null, '', window.location.pathname);
      setData((prev) => {
        const now = Date.now();
        const dropTasks = new Set((payload.removeTasks ?? []).map((t) => t.toLowerCase()));
        const keptTasks = prev.tasks.filter((t) => !dropTasks.has(t.title.toLowerCase()));
        const dropLists = new Set((payload.removeLists ?? []).map((n) => n.toLowerCase()));
        const lists = prev.lists.filter(
          (l) => !(dropLists.has(l.name.toLowerCase()) && !keptTasks.some((t) => t.listId === l.id)),
        );
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
        const tasksNext = [...keptTasks];
        for (const t of payload.tasks ?? []) {
          if (!t.title || tasksNext.some((x) => x.title.toLowerCase() === t.title.toLowerCase())) continue;
          tasksNext.push({
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
        const merged = { tasks: tasksNext, lists };
        saveData(user.id, merged);
        const added = tasksNext.length - keptTasks.length;
        const removed = prev.tasks.length - keptTasks.length;
        queueMicrotask(() =>
          setNotice(
            added || removed
              ? `Link applied — ${added} task${added === 1 ? '' : 's'} added, ${removed} removed.`
              : 'Link applied — everything was already up to date.',
          ),
        );
        return merged;
      });
    };
    processImport();
    window.addEventListener('hashchange', processImport);
    return () => window.removeEventListener('hashchange', processImport);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.id]);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 920px)');
    const onMq = () => {
      setNarrow(mq.matches);
      setSbOpen(false);
    };
    mq.addEventListener('change', onMq);
    return () => mq.removeEventListener('change', onMq);
  }, []);

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

  useEffect(
    () => () => {
      window.clearTimeout(undoTimer.current);
      window.clearTimeout(noticeTimer.current);
    },
    [],
  );

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
      case 'home':
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
        // Done tasks live in the Done view; elsewhere they only show on demand.
        (view.kind === 'completed' || showDone || !t.completed) &&
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
  }, [tasks, lists, view, query, priorityFilter, listFilter, sort, showDone]);

  // Table groups: Upcoming by horizon, All by company, others flat.
  const groups = useMemo(() => {
    if (view.kind === 'upcoming') {
      const weekEnd = offsetStr(7);
      const g = [
        { label: 'Tomorrow', tasks: [] as Task[] },
        { label: 'This Week', tasks: [] as Task[] },
        { label: 'Later', tasks: [] as Task[] },
      ];
      for (const t of visible) {
        if (t.dueDate === tomorrow) g[0].tasks.push(t);
        else if (t.dueDate! <= weekEnd) g[1].tasks.push(t);
        else g[2].tasks.push(t);
      }
      return g.filter((x) => x.tasks.length > 0);
    }
    if (view.kind === 'all' && !listFilter) {
      const g: { label: string; dot?: string; tasks: Task[] }[] = [];
      for (const l of lists) {
        const ts = visible.filter((t) => t.listId === l.id);
        if (ts.length) g.push({ label: l.name, dot: l.dot, tasks: ts });
      }
      const unlisted = visible.filter((t) => !t.listId || !listById.has(t.listId));
      if (unlisted.length) g.push({ label: 'No company', tasks: unlisted });
      if (g.length > 1) return g;
    }
    return visible.length ? [{ label: 'Tasks', tasks: visible }] : [];
  }, [view.kind, visible, tomorrow, lists, listById, listFilter]);

  const counts = useMemo(
    () => ({
      home: 0,
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

  const titles: Record<string, [string, string]> = {
    home: ['Home', "What's moving across your companies today."],
    today: ['Today', formatLongDate(new Date())],
    upcoming: ['Upcoming', 'What comes after today'],
    all: ['All Tasks', 'Every task, every company'],
    completed: ['Done', counts.completed + ' task' + (counts.completed === 1 ? '' : 's') + ' completed'],
  };
  const [title, sub] =
    view.kind === 'list'
      ? [activeList?.name ?? 'Company', (listCounts[view.listId] ?? 0) + ' open in this company']
      : titles[view.kind];

  const isFiltered = !!query.trim() || priorityFilter !== 'all' || !!listFilter;
  const emptyDef = isFiltered
    ? { icon: 'search', title: 'No matches', copy: 'Nothing fits the current search or filter. Try widening it.' }
    : view.kind === 'today'
      ? { icon: 'sparkle', title: "You're all clear for today", copy: 'Nothing due today. Press N to add a task.' }
      : view.kind === 'upcoming'
        ? { icon: 'calendar', title: 'An open calendar', copy: 'No upcoming tasks on the schedule yet.' }
        : view.kind === 'completed'
          ? { icon: 'checkCircle', title: 'Nothing done yet', copy: 'Completed tasks will be archived here.' }
          : view.kind === 'list'
            ? { icon: 'inbox', title: 'An empty list', copy: 'Nothing here yet. Press N to add a task.' }
            : { icon: 'inbox', title: 'No tasks yet', copy: 'Add your first task to get started.' };

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
          userName={user.name || user.email}
          onNavigate={navigate}
          onNewTask={() => {
            setModal({ mode: 'add' });
            setSbOpen(false);
          }}
          onCreateList={createList}
          onRenameList={renameList}
          onDeleteList={(id) => setDeleteListId(id)}
          onSignOut={onSignOut}
        />
      )}

      <div className="main">
        <TopBar
          title={title}
          sub={sub}
          narrow={narrow}
          query={query}
          onQuery={setQuery}
          searchRef={searchRef}
          onOpenMenu={() => setSbOpen(true)}
          onNewTask={() => setModal({ mode: 'add' })}
        />
        <div className="page">
          {view.kind === 'home' ? (
            <HomeView
              tasks={tasks}
              lists={lists}
              userName={user.name || user.email}
              onToggle={toggleTask}
              onOpenTask={(task) => setModal({ mode: 'edit', task })}
              onNewTask={() => setModal({ mode: 'add' })}
              onNavigateList={(listId) => navigate({ kind: 'list', listId })}
            />
          ) : (
            <>
              <FilterBar
                priorityFilter={priorityFilter}
                onPriorityFilter={setPriorityFilter}
                listFilter={listFilter}
                onListFilter={setListFilter}
                showListFilter={view.kind !== 'list'}
                lists={lists}
                sort={sort}
                onSort={setSort}
                count={visible.length}
                showDone={showDone}
                onShowDone={view.kind === 'completed' ? undefined : setShowDone}
              />
              {groups.length > 0 ? (
                <TaskTable
                  groups={groups}
                  listById={listById}
                  onToggle={toggleTask}
                  onEdit={(task) => setModal({ mode: 'edit', task })}
                  onDelete={deleteTask}
                />
              ) : (
                <EmptyState
                  icon={emptyDef.icon}
                  title={emptyDef.title}
                  copy={emptyDef.copy}
                  actionLabel={isFiltered ? undefined : 'Add a task'}
                  onAction={isFiltered ? undefined : () => setModal({ mode: 'add' })}
                />
              )}
            </>
          )}
        </div>
      </div>

      {undo && <UndoToast title={undo.task.title} onUndo={undoDelete} />}
      {!undo && notice && (
        <div className="snackbar" role="status">
          <span className="snackbar__text">{notice}</span>
        </div>
      )}

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
              ? `The company will be removed. Its ${deletingListTaskCount === 1 ? 'task stays' : deletingListTaskCount + ' tasks stay'} in All Tasks, unassigned.`
              : 'The company is empty and will be removed.'
          }
          confirmLabel="Delete"
          onConfirm={() => deleteList(deletingList.id)}
          onClose={() => setDeleteListId(null)}
        />
      )}
    </div>
  );
}

function persistAndReturn(userId: string, data: ReturnType<typeof emptyData>) {
  saveData(userId, data);
  return data;
}
