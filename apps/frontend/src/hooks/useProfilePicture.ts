import { useCallback, useEffect, useRef, useState } from "react";
import type { ChangeEvent } from "react";
import toast from "react-hot-toast";
import {
  ACCEPTED_IMAGE_MIME_TYPES,
  MAX_PROFILE_PICTURE_SIZE,
} from "@repo/constants";

// State manager for the profile picture: file validation, the crop flow,
// and the preview. The caller renders the (hidden) <input type="file">
// inside its form and wires it up with `inputRef`, so the browser still
// submits the file natively while React state stays in sync — confirmCrop
// swaps the picked file for the cropped blob in that same input.
//
// Blob URLs must be revoked manually; refs give every consumer of each URL
// (upcoming renders, replacements, cleanup effects) the same source of
// truth. `persistedUrlRef` tracks the URL the server last confirmed, so a
// failed update can roll the preview back instead of losing the picture.
//
// `initialUrl` seeds the preview at mount only; later server confirmations
// flow through `persist()`, never re-initialization.
function useProfilePicture(initialUrl: string | null) {
  const profilePictureInputRef = useRef<HTMLInputElement | null>(null);
  const persistedUrlRef = useRef<string | null>(initialUrl);
  const [profilePreviewUrl, setProfilePreviewUrl] = useState(initialUrl);
  const [cropImageUrl, setCropImageUrl] = useState<string | null>(null);
  // The live object URLs, for revoking on replacement and on unmount.
  const profileObjectUrlRef = useRef<string | null>(null);
  const cropObjectUrlRef = useRef<string | null>(null);

  // The hidden file input is uncontrolled; clear it alongside the state.
  const clearProfilePictureInput = useCallback(() => {
    if (profilePictureInputRef.current) {
      profilePictureInputRef.current.value = "";
    }
  }, []);

  const revokeProfileObjectUrl = useCallback(() => {
    if (profileObjectUrlRef.current) {
      URL.revokeObjectURL(profileObjectUrlRef.current);
      profileObjectUrlRef.current = null;
    }
  }, []);

  // Close the crop modal, revoking the picked file's blob URL.
  const closeCropModal = useCallback(() => {
    setCropImageUrl(null);

    if (cropObjectUrlRef.current) {
      URL.revokeObjectURL(cropObjectUrlRef.current);
      cropObjectUrlRef.current = null;
    }
  }, []);

  // Re-picking while a crop is open replaces the modal's image.
  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0];

    if (!file) {
      return;
    }

    const isAllowedType = ACCEPTED_IMAGE_MIME_TYPES.includes(file.type);

    if (!isAllowedType || file.size > MAX_PROFILE_PICTURE_SIZE) {
      toast.error(
        `Choose a JPEG, PNG, or WebP image up to ${
          MAX_PROFILE_PICTURE_SIZE / 1024 / 1024
        } MB`,
      );
      // Reset so re-selecting the same file fires change again.
      event.currentTarget.value = "";
      return;
    }

    closeCropModal();

    const objectUrl = URL.createObjectURL(file);
    cropObjectUrlRef.current = objectUrl;
    setCropImageUrl(objectUrl);
  }

  const cancelCrop = useCallback(() => {
    closeCropModal();
    clearProfilePictureInput();
  }, [closeCropModal, clearProfilePictureInput]);

  // Swap the native input's file for the cropped blob so the form submits
  // the crop, not the original pick, and preview it locally until the
  // server confirms its own URL.
  const confirmCrop = useCallback(
    (blob: Blob) => {
      closeCropModal();

      const croppedFile = new File([blob], "profile.png", {
        type: "image/png",
      });
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(croppedFile);

      if (profilePictureInputRef.current) {
        profilePictureInputRef.current.files = dataTransfer.files;
      }

      revokeProfileObjectUrl();
      const objectUrl = URL.createObjectURL(croppedFile);
      profileObjectUrlRef.current = objectUrl;
      setProfilePreviewUrl(objectUrl);
    },
    [closeCropModal, revokeProfileObjectUrl],
  );

  // Server rejected the update: drop the local preview and roll back to
  // the last confirmed picture. A no-op when nothing is pending locally —
  // a still-unconfirmed pick (crop modal open, input holding the original
  // file) survives a failed submit, as in the original implementation.
  const reset = useCallback(() => {
    if (!profileObjectUrlRef.current) {
      return;
    }
    revokeProfileObjectUrl();
    setProfilePreviewUrl(persistedUrlRef.current);
    clearProfilePictureInput();
  }, [revokeProfileObjectUrl, clearProfilePictureInput]);

  // Server accepted the update: adopt its URL as the confirmed picture.
  const persist = useCallback(
    (url: string) => {
      persistedUrlRef.current = url;
      setProfilePreviewUrl(url);
      revokeProfileObjectUrl();
      clearProfilePictureInput();
    },
    [revokeProfileObjectUrl, clearProfilePictureInput],
  );

  // Revoke whatever survives when the picker unmounts.
  useEffect(() => {
    return () => {
      if (profileObjectUrlRef.current) {
        URL.revokeObjectURL(profileObjectUrlRef.current);
      }
      if (cropObjectUrlRef.current) {
        URL.revokeObjectURL(cropObjectUrlRef.current);
      }
    };
  }, []);

  return {
    profilePictureInputRef,
    profilePreviewUrl,
    cropImageUrl,
    handleFileChange,
    cancelCrop,
    confirmCrop,
    reset,
    persist,
  };
}

export default useProfilePicture;
