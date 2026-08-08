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

async function updateUser(
  userId: FormDataEntryValue | null,
  username: string,
  noteToAll: string,
) {
  const response = await fetch(`/api/users/${userId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ username, noteToAll }),
  });
  const user = await response.json();

  return user.data;
}

async function getUserProfile(userId: string | undefined) {
  const response = await fetch(`/api/users/${userId}?include=posts`);
  const user = await response.json();

  return user.data;
}

export { getUsers, updateUser, getUserProfile };
