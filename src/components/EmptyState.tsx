type Props = {
  icon: string;
  title: string;
  copy: string;
  actionLabel?: string;
  onAction?: () => void;
};

export default function EmptyState({ icon, title, copy, actionLabel, onAction }: Props) {
  return (
    <div className="empty">
      <i className={'ph-duotone ' + icon} aria-hidden="true" />
      <div className="empty-title">{title}</div>
      <p className="empty-copy">{copy}</p>
      {actionLabel && onAction && (
        <button className="btn btn-ghost" onClick={onAction}>
          <i className="ph-duotone ph-plus" style={{ fontSize: 14 }} aria-hidden="true" /> {actionLabel}
        </button>
      )}
    </div>
  );
}
