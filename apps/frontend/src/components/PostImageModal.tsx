import { useEffect } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

type PostImageModalProps = {
  imageUrl: string;
  onClose: () => void;
};

function PostImageModal({ imageUrl, onClose }: PostImageModalProps) {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Image preview"
      onClick={(e) => {
        e.stopPropagation();
        onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Close image preview"
        className="absolute right-4 top-4 rounded-full bg-black/60 p-2 text-white transition-colors hover:bg-black/80 focus:outline-none focus:ring-2"
      >
        <X size={24} />
      </button>
      <img
        src={imageUrl}
        alt="Post"
        onClick={(e) => e.stopPropagation()}
        className="max-h-[90vh] max-w-full rounded-sm object-contain"
      />
    </div>,
    document.body,
  );
}

export default PostImageModal;
