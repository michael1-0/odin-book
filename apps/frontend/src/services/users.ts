async function getUsers(offset?: number) {
  const searchParams = new URLSearchParams();

  if (offset !== undefined) {
    searchParams.set("offset", String(offset));
  }

  const queryString = searchParams.toString();
  const response = await fetch(
    queryString ? `/api/users?${queryString}` : "/api/users",
  );
  const users = await response.json();

  return users;
}

async function updateUser(formData: FormData) {
  const userId = formData.get("userId");
  const response = await fetch(`/api/users/${userId}`, {
    method: "PUT",
    credentials: "include",
    body: formData,
  });
  const result = await response.json();

  if (!response.ok) {
    return {
      error: true,
      message: result.error?.message ?? "Failed to update profile",
    };
  }

  return result.data;
}

async function getUserProfile(userId: string | undefined) {
  const response = await fetch(`/api/users/${userId}?include=posts`);
  const user = await response.json();

  return user.data;
}

export { getUsers, updateUser, getUserProfile };
