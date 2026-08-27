import { useEffect, useRef, useState } from 'react';
import type { Priority, Task, TaskList } from '../types';
import Icon from './Icon';

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
    listId: task?.listId ?? defaultListId ?? '',
    notes: task?.notes ?? '',
  }));
  const [titleError, setTitleError] = useState(false);
  const titleRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    titleRef.current?.focus();
  }, []);

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
      className="modal-overlay"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-label={mode === 'edit' ? 'Edit task' : 'New task'}
        onKeyDown={onDialogKeyDown}
      >
        <div className="modal__head">
          <span className="modal__title">{mode === 'edit' ? 'Edit task' : 'New task'}</span>
          <button className="icon-btn icon-btn--ghost" aria-label="Close" onClick={onClose}>
            <Icon name="close" size={15} />
          </button>
        </div>
        <div className="modal__body">
          <div className="field">
            <label className="field__label" htmlFor="tf-title">
              Title
            </label>
            <input
              id="tf-title"
              ref={titleRef}
              type="text"
              value={values.title}
              placeholder="What needs to happen?"
              aria-invalid={titleError || undefined}
              style={titleError ? { borderColor: 'var(--danger)' } : undefined}
              onChange={(e) => {
                set('title', e.target.value);
                if (titleError && e.target.value.trim()) setTitleError(false);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') submit();
              }}
            />
            {titleError && (
              <div style={{ fontSize: 12, color: 'var(--danger)' }}>A task needs a title.</div>
            )}
          </div>

          <div className="field">
            <label className="field__label" htmlFor="tf-desc">
              Description
            </label>
            <input
              id="tf-desc"
              type="text"
              value={values.description}
              placeholder="Optional — a short line of context"
              onChange={(e) => set('description', e.target.value)}
            />
          </div>

          <div className="field field--row">
            <div className="field">
              <label className="field__label" htmlFor="tf-due">
                Due date
              </label>
              <input id="tf-due" type="date" value={values.dueDate} onChange={(e) => set('dueDate', e.target.value)} />
            </div>
            <div className="field">
              <label className="field__label" htmlFor="tf-time">
                Due time
              </label>
              <input id="tf-time" type="time" value={values.dueTime} onChange={(e) => set('dueTime', e.target.value)} />
            </div>
          </div>

          <div className="field field--row">
            <div className="field">
              <label className="field__label" id="tf-pri-label">
                Priority
              </label>
              <div className="segmented" role="radiogroup" aria-labelledby="tf-pri-label">
                {(['low', 'medium', 'high'] as const).map((p) => (
                  <button
                    key={p}
                    type="button"
                    role="radio"
                    aria-checked={values.priority === p}
                    className={values.priority === p ? 'segmented__item is-active' : 'segmented__item'}
                    onClick={() => set('priority', p)}
                  >
                    {p[0].toUpperCase() + p.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            <div className="field">
              <label className="field__label" htmlFor="tf-list">
                Company
              </label>
              <select id="tf-list" value={values.listId} onChange={(e) => set('listId', e.target.value)}>
                <option value="">No company</option>
                {lists.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="field">
            <label className="field__label" htmlFor="tf-notes">
              Notes
            </label>
            <textarea
              id="tf-notes"
              value={values.notes}
              placeholder="Optional notes"
              style={{ minHeight: 64, resize: 'vertical' }}
              onChange={(e) => set('notes', e.target.value)}
            />
          </div>
        </div>
        <div className="modal__foot">
          <button className="btn btn--md btn--ghost" onClick={onClose}>
            Cancel
          </button>
          <button className="btn btn--md btn--primary" onClick={submit}>
            {mode === 'edit' ? 'Save changes' : 'Create task'}
          </button>
        </div>
      </div>
    </div>
  );
}
