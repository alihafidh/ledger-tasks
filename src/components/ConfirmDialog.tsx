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
      className="dialog-backdrop"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="dialog" role="alertdialog" aria-modal="true" aria-label={title}>
        <div className="dialog-title">{title}</div>
        <p className="dialog-body" style={{ margin: 0 }}>
          {body}
        </p>
        <div className="dialog-actions">
          <button className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button ref={confirmRef} className="btn btn-primary" onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
