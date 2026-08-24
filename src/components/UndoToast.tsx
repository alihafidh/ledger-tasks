type Props = { title: string; onUndo: () => void };

export default function UndoToast({ title, onUndo }: Props) {
  return (
    <div className="snackbar" role="status">
      <span className="snackbar-text">Task deleted — “{title}”</span>
      <button className="btn btn-ghost" onClick={onUndo}>
        Undo
      </button>
    </div>
  );
}
