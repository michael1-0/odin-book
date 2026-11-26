import { useEffect } from "react";
import { useFetcher, useRevalidator } from "react-router";
import { MAX_NOTE_LENGTH } from "@repo/zod-validations";
import {
  ACCEPTED_IMAGE_MIME_TYPES,
  PROFILE_PICTURE_FIELD,
} from "@repo/constants";
import { FORM_INTENTS } from "../constants/routes";
import { FORM_FIELDS } from "../constants/fields";
import type { ActionResult } from "../utils/actionResult";
import type { AuthUser } from "../services/auth";
import useProfilePicture from "../hooks/useProfilePicture";
import ProfilePictureCropModal from "./ProfilePictureCropModal";
import toast from "react-hot-toast";

type ProfileFormProps = {
  user: {
    id: number;
    username: string;
    noteToAll: string;
    profileUrl: string | null;
  };
};

// The "update profile" form: avatar preview with the crop flow, username,
// and noteToAll. Submits via useFetcher to the current route's action (no
// navigation), which forwards the multipart body — including the picked or
// cropped file — to updateUser.
//
// The fetcher effect only reacts to outcomes; the picture hook owns every
// blob-URL transition. Validation failures keep the cropped preview so
// the user can fix fields without re-picking the picture; server failures
// roll it back to the last confirmed picture.
function ProfileForm({ user }: ProfileFormProps) {
  const fetcher = useFetcher<ActionResult<AuthUser>>();
  const { revalidate } = useRevalidator();
  const {
    profilePictureInputRef,
    profilePreviewUrl,
    cropImageUrl,
    handleFileChange,
    cancelCrop,
    confirmCrop,
    reset,
    persist,
  } = useProfilePicture(user.profileUrl);

  const isUpdating = fetcher.state === "submitting";
  const result = fetcher.data;

  useEffect(() => {
    if (fetcher.state !== "idle" || !result) {
      return;
    }

    if (!result.ok) {
      if (result.kind === "server") {
        // Server failures roll the preview back to the last confirmed
        // picture; validation failures keep the cropped preview so the
        // user can fix fields without re-picking it.
        reset();
        toast.error(result.message);
      } else {
        toast.error("Failed to update profile");
      }
      return;
    }

    if (result.data.profileUrl) {
      persist(result.data.profileUrl);
    }
    toast.success("Profile updated");
    void revalidate();
  }, [result, fetcher.state, reset, persist, revalidate]);

  const usernameErrors =
    result?.ok === false && result.kind === "validation"
      ? result.fieldErrors.username
      : undefined;
  const noteToAllErrors =
    result?.ok === false && result.kind === "validation"
      ? result.fieldErrors.noteToAll
      : undefined;

  return (
    <>
      <section className="flex flex-col items-center gap-4 rounded-sm bg-neutral-100 p-4">
        <fetcher.Form
          className="flex w-full flex-col gap-4"
          method="POST"
          encType="multipart/form-data"
        >
          <input type="hidden" name={FORM_FIELDS.userId} value={user.id} />
          <div className="flex flex-col items-center gap-2">
            <img
              src={profilePreviewUrl ?? undefined}
              alt={`${user.username} profile image`}
              className="size-24 rounded-full object-cover"
            />
            <label
              htmlFor="profilePicture"
              className="cursor-pointer text-sm font-semibold underline underline-offset-4 transition-colors hover:text-neutral-500"
            >
              Change picture
            </label>
            <input
              type="file"
              name={PROFILE_PICTURE_FIELD}
              id="profilePicture"
              ref={profilePictureInputRef}
              accept={ACCEPTED_IMAGE_MIME_TYPES.join(",")}
              onChange={handleFileChange}
              className="sr-only"
            />
          </div>
          <div className="flex flex-col">
            <label htmlFor="username" className="mb-1 text-xs">
              Username
            </label>
            <input
              type="text"
              name={FORM_FIELDS.username}
              id="username"
              defaultValue={user.username}
              className="rounded-sm bg-white p-3 shadow-sm"
            />
            <div className="mt-2 min-h-4 text-xs text-red-600">
              {usernameErrors?.[0]}
            </div>
          </div>
          <div className="flex flex-col">
            <label htmlFor="noteToAll" className="mb-1 text-xs">
              Note to all
            </label>
            <textarea
              id="noteToAll"
              name={FORM_FIELDS.noteToAll}
              rows={4}
              required
              maxLength={MAX_NOTE_LENGTH}
              className="w-full resize-none rounded-sm bg-white p-3 shadow-sm focus:ring-2 focus:outline-none"
              defaultValue={user.noteToAll}
            />
            <div className="mt-2 min-h-8 text-xs text-red-600">
              {noteToAllErrors?.[0]}
            </div>
          </div>
          <button
            type="submit"
            name={FORM_FIELDS.intent}
            value={FORM_INTENTS.updateUser}
            className="rounded-sm bg-black p-2 text-white transition-colors disabled:opacity-50"
            disabled={isUpdating}
          >
            {isUpdating ? "Updating..." : "Update"}
          </button>
        </fetcher.Form>
      </section>
      {cropImageUrl !== null && (
        <ProfilePictureCropModal
          imageUrl={cropImageUrl}
          onCancel={cancelCrop}
          onConfirm={confirmCrop}
        />
      )}
    </>
  );
}

export default ProfileForm;
