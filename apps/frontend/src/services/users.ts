async function updateUser(formData: FormData) {
  const userId = formData.get("userId");
  const username = formData.get("username");
  const noteToAll = formData.get("noteToAll");

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

export { updateUser };
