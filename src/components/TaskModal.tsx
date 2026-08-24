import { useEffect, useRef, useState } from 'react';
import type { Priority, Task, TaskList } from '../types';

export type TaskFormValues = {
  title: string;
  description: string;
  dueDate: string;
  dueTime: string;
  priority: Priority;
  listId: string;
  notes: string;
};

type Props = {
  mode: 'add' | 'edit';
  task?: Task;
  lists: TaskList[];
  defaultListId?: string;
  onSubmit: (values: TaskFormValues) => void;
  onClose: () => void;
};

export default function TaskModal({ mode, task, lists, defaultListId, onSubmit, onClose }: Props) {
  const [values, setValues] = useState<TaskFormValues>(() => ({
    title: task?.title ?? '',
    description: task?.description ?? '',
    dueDate: task?.dueDate ?? '',
    dueTime: task?.dueTime ?? '',
    priority: task?.priority ?? 'medium',
    listId: task?.listId ?? defaultListId ?? lists[0]?.id ?? '',
    notes: task?.notes ?? '',
  }));
  const [titleError, setTitleError] = useState(false);
  const titleRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    titleRef.current?.focus();
  }, []);

  // Keep keyboard focus inside the dialog.
  const onDialogKeyDown = (e: React.KeyboardEvent) => {
    if (e.key !== 'Tab' || !dialogRef.current) return;
    const focusables = dialogRef.current.querySelectorAll<HTMLElement>(
      'input, textarea, select, button, [tabindex]:not([tabindex="-1"])',
    );
    if (!focusables.length) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  const set = <K extends keyof TaskFormValues>(key: K, v: TaskFormValues[K]) =>
    setValues((prev) => ({ ...prev, [key]: v }));

  const submit = () => {
    if (!values.title.trim()) {
      setTitleError(true);
      titleRef.current?.focus();
      return;
    }
    onSubmit({ ...values, title: values.title.trim(), description: values.description.trim() });
  };

  return (
    <div
      className="dialog-backdrop"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        className="dialog dialog--task"
        role="dialog"
        aria-modal="true"
        aria-label={mode === 'edit' ? 'Edit Task' : 'New Task'}
        onKeyDown={onDialogKeyDown}
      >
        <div className="dialog-title" style={{ marginBottom: 4 }}>
          {mode === 'edit' ? 'Edit Task' : 'New Task'}
        </div>

        <div className="field">
          <label htmlFor="tf-title">Title</label>
          <input
            id="tf-title"
            ref={titleRef}
            className="input"
            value={values.title}
            placeholder="What needs doing?"
            aria-invalid={titleError || undefined}
            style={titleError ? { borderColor: 'var(--color-accent-2-600)' } : undefined}
            onChange={(e) => {
              set('title', e.target.value);
              if (titleError && e.target.value.trim()) setTitleError(false);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') submit();
            }}
          />
          {titleError && (
            <div style={{ fontSize: 12, color: 'var(--color-accent-2-700)', marginTop: 5 }}>
              A task needs a title.
            </div>
          )}
        </div>

        <div className="field">
          <label htmlFor="tf-desc">Description</label>
          <input
            id="tf-desc"
            className="input"
            value={values.description}
            placeholder="Optional — a short line of context"
            onChange={(e) => set('description', e.target.value)}
          />
        </div>

        <div className="form-grid-2">
          <div className="field">
            <label htmlFor="tf-due">Due date</label>
            <input
              id="tf-due"
              className="input"
              type="date"
              value={values.dueDate}
              onChange={(e) => set('dueDate', e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="tf-time">Due time</label>
            <input
              id="tf-time"
              className="input"
              type="time"
              value={values.dueTime}
              onChange={(e) => set('dueTime', e.target.value)}
            />
          </div>
        </div>

        <div className="form-row">
          <div className="field">
            <label id="tf-pri-label">Priority</label>
            <div className="seg" role="radiogroup" aria-labelledby="tf-pri-label">
              {(['low', 'medium', 'high'] as const).map((p) => (
                <label key={p} className="seg-opt">
                  <input
                    type="radio"
                    name="priority"
                    value={p}
                    checked={values.priority === p}
                    onChange={() => set('priority', p)}
                  />
                  {p[0].toUpperCase() + p.slice(1)}
                </label>
              ))}
            </div>
          </div>
          <div className="field" style={{ flex: 1, minWidth: 140 }}>
            <label htmlFor="tf-list">List</label>
            <select
              id="tf-list"
              className="input"
              style={{ cursor: 'pointer' }}
              value={values.listId}
              onChange={(e) => set('listId', e.target.value)}
            >
              <option value="">No list</option>
              {lists.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="field">
          <label htmlFor="tf-notes">Notes</label>
          <textarea
            id="tf-notes"
            className="input"
            style={{ minHeight: 64 }}
            value={values.notes}
            placeholder="Optional notes"
            onChange={(e) => set('notes', e.target.value)}
          />
        </div>

        <div className="dialog-actions">
          <button className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={submit}>
            {mode === 'edit' ? 'Save Changes' : 'Add Task'}
          </button>
        </div>
      </div>
    </div>
  );
}
