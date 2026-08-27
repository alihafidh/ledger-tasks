type Props = { title: string; onUndo: () => void };

export default function UndoToast({ title, onUndo }: Props) {
  return (
    <div className="snackbar" role="status">
      <span className="snackbar__text">Task deleted — “{title}”</span>
      <button className="btn btn--sm btn--primary" onClick={onUndo}>
        Undo
      </button>
    </div>
  );
}
