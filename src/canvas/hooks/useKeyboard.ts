import { useEffect } from 'react';

type Options = {
  editingId: string | null;
  selectedId: string | null;
  selectedArrowId: string | null;
  onCommitEdit: () => void;
  onCancelEdit: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onDeleteBlock: (id: string) => void;
  onDeleteArrow: (id: string) => void;
};

export function useKeyboard({
  editingId,
  selectedId,
  selectedArrowId,
  onCommitEdit,
  onCancelEdit,
  onUndo,
  onRedo,
  onDeleteBlock,
  onDeleteArrow,
}: Options) {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (editingId) {
        if (e.key === 'Enter') {
          e.preventDefault();
          onCommitEdit();
        } else if (e.key === 'Escape') {
          e.preventDefault();
          onCancelEdit();
        }
        return;
      }

      const isUndo =
        (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !e.shiftKey;
      const isRedo =
        (e.ctrlKey || e.metaKey) &&
        (e.key.toLowerCase() === 'y' ||
          (e.key.toLowerCase() === 'z' && e.shiftKey));

      if (isUndo) {
        e.preventDefault();
        onUndo();
        return;
      }
      if (isRedo) {
        e.preventDefault();
        onRedo();
        return;
      }

      if (e.key !== 'Delete' && e.key !== 'Backspace') return;
      if (selectedId) {
        e.preventDefault();
        onDeleteBlock(selectedId);
        return;
      }
      if (selectedArrowId) {
        e.preventDefault();
        onDeleteArrow(selectedArrowId);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [
    editingId,
    selectedId,
    selectedArrowId,
    onCommitEdit,
    onCancelEdit,
    onUndo,
    onRedo,
    onDeleteBlock,
    onDeleteArrow,
  ]);
}
