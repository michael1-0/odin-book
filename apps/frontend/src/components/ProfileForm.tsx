import { useEffect } from "react";
import { useFetcher, useRevalidator } from "react-router";
import { MAX_NOTE_LENGTH } from "@repo/zod-validations";
import {
  ACCEPTED_IMAGE_MIME_TYPES,
  PROFILE_PICTURE_FIELD,
} from "@repo/constants";
import { FORM_INTENTS } from "../constants/routes";
import { FORM_FIELDS } from "../constants/fields";
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
// blob-URL transition. Validation failures carry an errors key and keep the
// cropped preview so the user can fix fields without re-picking the
// picture; server failures roll it back to the last confirmed picture.
function ProfileForm({ user }: ProfileFormProps) {
  const fetcher = useFetcher();
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
  const hasError = fetcher.data?.error;

  useEffect(() => {
    if (fetcher.state !== "idle" || !fetcher.data) {
      return;
    }

    if (hasError) {
      if (!fetcher.data.errors) {
        reset();
      }
      toast.error(fetcher.data.message ?? "Failed to update profile");
      return;
    }

    if (fetcher.data.profileUrl) {
      persist(fetcher.data.profileUrl);
    }
    toast.success("Profile updated");
    void revalidate();
  }, [fetcher.data, fetcher.state, hasError, reset, persist, revalidate]);

  const errors = fetcher.data?.errors;
  const usernameErrors = errors?.username;
  const noteToAllErrors = errors?.noteToAll;

  return (
    <>
      <section className="flex flex-col items-center gap-4 bg-neutral-100 rounded-sm p-4">
        <fetcher.Form
          className="flex flex-col w-full gap-4"
          method="POST"
          encType="multipart/form-data"
        >
          <input type="hidden" name={FORM_FIELDS.userId} value={user.id} />
          <div className="flex flex-col items-center gap-2">
            <img
              src={profilePreviewUrl ?? undefined}
              alt={`${user.username} profile image`}
              className="h-24 w-24 rounded-full object-cover"
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
            <label htmlFor="username" className="text-xs mb-1">
              Username
            </label>
            <input
              type="text"
              name={FORM_FIELDS.username}
              id="username"
              defaultValue={user.username}
              className="shadow-sm rounded-sm p-3 bg-white"
            />
            <div className="mt-2 text-xs text-red-600 min-h-4">
              {usernameErrors && usernameErrors[0]}
            </div>
          </div>
          <div className="flex flex-col">
            <label htmlFor="noteToAll" className="text-xs mb-1">
              Note to all
            </label>
            <textarea
              id="noteToAll"
              name={FORM_FIELDS.noteToAll}
              rows={4}
              required
              maxLength={MAX_NOTE_LENGTH}
              className="w-full p-3 shadow-sm rounded-sm resize-none focus:outline-none focus:ring-2 bg-white"
              defaultValue={user.noteToAll}
            />
            <div className="mt-2 text-xs text-red-600 min-h-8">
              {noteToAllErrors && noteToAllErrors[0]}
            </div>
          </div>
          <button
            type="submit"
            name={FORM_FIELDS.intent}
            value={FORM_INTENTS.updateUser}
            className="p-2 bg-black text-white rounded-sm disabled:opacity-50 transition-colors"
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
