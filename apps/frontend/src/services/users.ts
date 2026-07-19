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

export { updateUser, getUserProfile };
