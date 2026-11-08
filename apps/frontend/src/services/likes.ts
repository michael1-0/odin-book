import { API_PATHS } from "../constants/api";

async function likePost(formData: FormData) {
  const postId = formData.get("postId");

  if (typeof postId !== "string") {
    return { error: true, message: "Missing post ID" };
  }

  const response = await fetch(API_PATHS.likes(postId), {
    method: "POST",
  });
  const result = await response.json();

  if (!response.ok) {
    return {
      error: true,
      message: result.error?.message ?? "Failed to like post",
    };
  }

  return result.data;
}

async function unlikePost(formData: FormData) {
  const postId = formData.get("postId");

  if (typeof postId !== "string") {
    return { error: true, message: "Missing post ID" };
  }

  const response = await fetch(API_PATHS.likes(postId), {
    method: "DELETE",
  });
  const result = await response.json();

  if (!response.ok) {
    return {
      error: true,
      message: result.error?.message ?? "Failed to unlike post",
    };
  }

  return result.data;
}

export { likePost, unlikePost };
