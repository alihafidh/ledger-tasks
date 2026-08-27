import { useEffect, useRef } from 'react';

type Props = {
  title: string;
  body: string;
  confirmLabel: string;
  onConfirm: () => void;
  onClose: () => void;
};

export default function ConfirmDialog({ title, body, confirmLabel, onConfirm, onClose }: Props) {
  const confirmRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    confirmRef.current?.focus();
  }, []);
  return (
    <div
      className="modal-overlay"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal" role="alertdialog" aria-modal="true" aria-label={title} style={{ maxWidth: 420 }}>
        <div className="modal__head">
          <span className="modal__title">{title}</span>
        </div>
        <div className="modal__body">
          <p style={{ margin: 0, color: 'var(--ink-2)', fontSize: 13 }}>{body}</p>
        </div>
        <div className="modal__foot">
          <button className="btn btn--md btn--ghost" onClick={onClose}>
            Cancel
          </button>
          <button ref={confirmRef} className="btn btn--md btn--primary" onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
