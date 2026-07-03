async function followUser(formData: FormData) {
  const targetUserId = formData.get("targetUserId");

  const response = await fetch(`/api/follows/${targetUserId}`, {
    method: "POST",
  });
  const follow = await response.json();

  return follow.data;
}

async function unfollowUser(formData: FormData) {
  const targetUserId = formData.get("targetUserId");

  const response = await fetch(`/api/follows/${targetUserId}`, {
    method: "DELETE",
  });
  const follow = await response.json();

  return follow.data;
}

export { followUser, unfollowUser };
