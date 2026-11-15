import { API_PATHS } from "../constants/api";
import { FORM_FIELDS } from "../constants/fields";

// Success responses report the resulting follow state (`{ isFollowing }`)
// instead of the raw follow row, so FollowButton can render its toggle
// straight from fetcher.data — the same contract as the like flow's
// updated-post response in PostItem.
async function followUser(formData: FormData) {
  const targetUserId = formData.get(FORM_FIELDS.targetUserId);

  if (typeof targetUserId !== "string") {
    return { error: true, message: "Missing target user ID" };
  }

  const response = await fetch(API_PATHS.follows(targetUserId), {
    method: "POST",
  });
  const result = await response.json();

  if (!response.ok) {
    return {
      error: true,
      message: result.error?.message ?? "Failed to follow user",
    };
  }

  return { isFollowing: true };
}

async function unfollowUser(formData: FormData) {
  const targetUserId = formData.get(FORM_FIELDS.targetUserId);

  if (typeof targetUserId !== "string") {
    return { error: true, message: "Missing target user ID" };
  }

  const response = await fetch(API_PATHS.follows(targetUserId), {
    method: "DELETE",
  });
  const result = await response.json();

  if (!response.ok) {
    return {
      error: true,
      message: result.error?.message ?? "Failed to unfollow user",
    };
  }

  return { isFollowing: false };
}

export { followUser, unfollowUser };
