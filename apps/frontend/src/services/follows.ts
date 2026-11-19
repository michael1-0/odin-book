import type { ActionResult } from "../utils/actionResult";
import { serverFailure } from "../utils/actionResult";
import { API_PATHS } from "../constants/api";
import { FORM_FIELDS } from "../constants/fields";
import { readFormField } from "../utils/formData";
import { apiMutation } from "./http";

// Success reports the resulting follow state rather than the backend's
// follow row, so FollowButton renders its toggle straight from the
// result data — the same contract as the like flow's updated post.
type FollowState = {
  isFollowing: boolean;
};

async function followUser(
  formData: FormData,
): Promise<ActionResult<FollowState>> {
  const targetUserId = readFormField(formData, FORM_FIELDS.targetUserId);

  if (targetUserId === undefined) {
    return serverFailure("Missing target user ID");
  }

  await apiMutation(API_PATHS.follows(targetUserId), {
    method: "POST",
    failureMessage: "Failed to follow user",
  });

  return { ok: true, data: { isFollowing: true } };
}

async function unfollowUser(
  formData: FormData,
): Promise<ActionResult<FollowState>> {
  const targetUserId = readFormField(formData, FORM_FIELDS.targetUserId);

  if (targetUserId === undefined) {
    return serverFailure("Missing target user ID");
  }

  await apiMutation(API_PATHS.follows(targetUserId), {
    method: "DELETE",
    failureMessage: "Failed to unfollow user",
  });

  return { ok: true, data: { isFollowing: false } };
}

export type { FollowState };
export { followUser, unfollowUser };
