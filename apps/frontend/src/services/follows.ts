import { API_PATHS } from "../constants/api";

async function followUser(formData: FormData) {
  const targetUserId = formData.get("targetUserId");

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

  return result.data;
}

async function unfollowUser(formData: FormData) {
  const targetUserId = formData.get("targetUserId");

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

  return result.data;
}

export { followUser, unfollowUser };
