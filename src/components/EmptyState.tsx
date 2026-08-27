import Icon from './Icon';

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
      <Icon name={icon} size={34} style={{ color: 'var(--ink-4)' }} />
      <div className="empty__title">{title}</div>
      <p className="empty__copy">{copy}</p>
      {actionLabel && onAction && (
        <button className="btn btn--md btn--outline" onClick={onAction}>
          <Icon name="plus" size={13} /> {actionLabel}
        </button>
      )}
    </div>
  );
}
