import { useCallback, useEffect, useRef, useState } from "react";
import type { ChangeEvent } from "react";
import { MAX_POST_IMAGES, MAX_POST_IMAGE_SIZE } from "@repo/constants";

// Validation for a fresh batch of files, against what is already selected.
function getImageSelectionError(existingCount: number, files: File[]) {
  if (existingCount + files.length > MAX_POST_IMAGES) {
    return `Only up to ${MAX_POST_IMAGES} images can be uploaded`;
  }

  if (files.some((file) => file.size > MAX_POST_IMAGE_SIZE)) {
    return `Each image must be ${MAX_POST_IMAGE_SIZE / 1024 / 1024} MB or smaller`;
  }

  return null;
}

// State manager for a file picker with previews. The caller renders the
// (hidden) <input type="file"> and wires it up with `inputRef`, so the
// browser still submits the files natively while React state stays in sync.
function useImagePicker() {
  const imagesInputRef = useRef<HTMLInputElement | null>(null);

  // Blob URLs must be revoked manually; the ref gives every consumer of
  // the list (upcoming renders, cleanup effects) the same source of truth.
  const imagePreviewUrlsRef = useRef<string[]>([]);
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>([]);
  const [imageError, setImageError] = useState<string | null>(null);

  function syncInputFiles(files: File[]) {
    if (!imagesInputRef.current) {
      return;
    }

    const dataTransfer = new DataTransfer();
    files.forEach((file) => dataTransfer.items.add(file));
    imagesInputRef.current.files = dataTransfer.files;
  }

  // Full cleanup: revoke previews, clear state, clear the native input.
  const reset = useCallback(() => {
    imagePreviewUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    imagePreviewUrlsRef.current = [];
    setSelectedImages([]);
    setImagePreviewUrls([]);
    setImageError(null);
    if (imagesInputRef.current) {
      imagesInputRef.current.value = "";
    }
  }, []);

  // Revoke whatever survives when the picker unmounts.
  useEffect(() => {
    return () => {
      imagePreviewUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  function handleImagesChange(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.currentTarget.files ?? []);

    if (files.length === 0) {
      return;
    }

    const selectionError = getImageSelectionError(selectedImages.length, files);
    if (selectionError) {
      setImageError(selectionError);
      // Reset so re-selecting the same file fires change again.
      event.currentTarget.value = "";
      return;
    }

    const combined = [...selectedImages, ...files];
    const urls = files.map((file) => URL.createObjectURL(file));
    imagePreviewUrlsRef.current = [...imagePreviewUrlsRef.current, ...urls];
    syncInputFiles(combined);
    setImageError(null);
    setSelectedImages(combined);
    setImagePreviewUrls((current) => [...current, ...urls]);
  }

  function removeImage(index: number) {
    const removedUrl = imagePreviewUrlsRef.current[index];

    if (removedUrl) {
      URL.revokeObjectURL(removedUrl);
    }

    const remainingImages = selectedImages.filter((_, i) => i !== index);

    imagePreviewUrlsRef.current = imagePreviewUrlsRef.current.filter(
      (_, i) => i !== index,
    );
    syncInputFiles(remainingImages);
    setSelectedImages(remainingImages);
    setImagePreviewUrls((current) => current.filter((_, i) => i !== index));
    setImageError(null);
  }

  return {
    imagesInputRef,
    selectedImages,
    imagePreviewUrls,
    imageError,
    handleImagesChange,
    removeImage,
    reset,
  };
}

export default useImagePicker;
