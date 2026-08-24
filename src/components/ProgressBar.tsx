type Props = { done: number; total: number };

export default function ProgressBar({ done, total }: Props) {
  const pct = total ? Math.round((done / total) * 100) : 0;
  return (
    <div className="progress">
      <div className="progress-label">
        {done} of {total} completed
      </div>
      <div
        className="progress-track"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={done}
        aria-label="Tasks completed"
      >
        <div className="progress-fill" style={{ width: pct + '%' }} />
      </div>
    </div>
  );
}
