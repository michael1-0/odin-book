import { API_PATHS } from "../constants/api";
import { FORM_FIELDS, QUERY_PARAMS } from "../constants/fields";

async function getUsers(offset?: number) {
  const searchParams = new URLSearchParams();

  if (offset !== undefined) {
    searchParams.set(QUERY_PARAMS.offset, String(offset));
  }

  const queryString = searchParams.toString();
  const response = await fetch(
    queryString ? `${API_PATHS.users}?${queryString}` : API_PATHS.users,
  );
  const result = await response.json();

  if (!response.ok) {
    throw new Response(result.error?.message ?? "Failed to load users", {
      status: response.status,
    });
  }

  return result;
}

async function updateUser(formData: FormData) {
  const userId = formData.get(FORM_FIELDS.userId);

  if (typeof userId !== "string") {
    return { error: true, message: "Missing user ID" };
  }

  const response = await fetch(API_PATHS.user(userId), {
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
  if (!userId) {
    throw new Response("Missing user ID", { status: 400 });
  }

  const searchParams = new URLSearchParams({
    [QUERY_PARAMS.include]: "posts",
  });
  const response = await fetch(`${API_PATHS.user(userId)}?${searchParams}`);
  const result = await response.json();

  if (!response.ok) {
    throw new Response(result.error?.message ?? "Failed to load profile", {
      status: response.status,
    });
  }

  return result.data;
}

export { getUsers, updateUser, getUserProfile };
