import { useEffect } from "react";
import { createPortal } from "react-dom";

type ConfirmDeleteModalProps = {
  onCancel: () => void;
  onConfirm: () => void;
};

function ConfirmDeleteModal({ onCancel, onConfirm }: ConfirmDeleteModalProps) {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onCancel();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [onCancel]);

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Confirm post deletion"
      onClick={(e) => {
        e.stopPropagation();
        onCancel();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex flex-col gap-4 rounded-sm bg-white p-4 shadow-lg"
      >
        <div className="font-semibold">Delete post?</div>
        <div className="text-sm text-neutral-500">
          This action cannot be undone.
        </div>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-sm bg-neutral-100 px-4 py-2 text-black transition-colors hover:bg-neutral-200"
          >
            Cancel
          </button>
          <button
            type="button"
            autoFocus
            onClick={onConfirm}
            className="rounded-sm px-4 py-2 bg-black text-white transition-colors"
          >
            Delete
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

export default ConfirmDeleteModal;
