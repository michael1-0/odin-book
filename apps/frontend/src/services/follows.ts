async function followUser(formData: FormData) {
  const targetUserId = formData.get("targetUserId");

  const response = await fetch(`/api/follows/${targetUserId}`, {
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

  const response = await fetch(`/api/follows/${targetUserId}`, {
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
