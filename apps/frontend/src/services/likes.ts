async function likePost(formData: FormData) {
  const postId = formData.get("postId");

  const response = await fetch(`/api/likes/${postId}`, {
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

  const response = await fetch(`/api/likes/${postId}`, {
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
