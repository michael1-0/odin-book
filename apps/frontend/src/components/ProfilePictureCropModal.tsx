import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Cropper, { type Area, type Point } from "react-easy-crop";
import getCroppedImageBlob from "../utils/cropImage";

type ProfilePictureCropModalProps = {
  imageUrl: string;
  onCancel: () => void;
  onConfirm: (blob: Blob) => void;
};

function ProfilePictureCropModal({
  imageUrl,
  onCancel,
  onConfirm,
}: ProfilePictureCropModalProps) {
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !isSaving) {
        onCancel();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [onCancel, isSaving]);

  const onCropComplete = useCallback(
    (_croppedArea: Area, nextCroppedAreaPixels: Area) => {
      setCroppedAreaPixels(nextCroppedAreaPixels);
    },
    [],
  );

  async function handleSave() {
    if (!croppedAreaPixels) {
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const blob = await getCroppedImageBlob(imageUrl, croppedAreaPixels);
      onConfirm(blob);
    } catch {
      setError("Couldn't crop the image. Try a different one.");
      setIsSaving(false);
    }
  }

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Crop profile picture"
      onClick={(e) => {
        e.stopPropagation();
        if (!isSaving) {
          onCancel();
        }
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex w-full max-w-md flex-col gap-4 rounded-sm bg-white p-4 shadow-lg"
      >
        <div className="relative h-80 w-full overflow-hidden rounded-sm bg-neutral-900">
          <Cropper
            image={imageUrl}
            crop={crop}
            zoom={zoom}
            aspect={1}
            cropShape="round"
            showGrid
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="crop-zoom" className="text-xs">
            Zoom
          </label>
          <input
            type="range"
            id="crop-zoom"
            min={1}
            max={3}
            step={0.05}
            value={zoom}
            onChange={(event) => setZoom(Number(event.currentTarget.value))}
            className="accent-black"
          />
        </div>
        {error && <div className="text-sm text-red-600">{error}</div>}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={isSaving}
            className="flex-1 rounded-sm bg-neutral-100 px-4 py-2 text-black transition-colors hover:bg-neutral-200 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={isSaving || !croppedAreaPixels}
            className="flex-1 rounded-sm bg-black px-4 py-2 text-white transition-colors disabled:opacity-50"
          >
            {isSaving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

export default ProfilePictureCropModal;
