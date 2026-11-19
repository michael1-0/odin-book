import type { ActionResult } from "../utils/actionResult";
import type { AuthUser } from "./auth";
import type { PostFeedItem, UsersGetResponse } from "@repo/zod-validations";
import { serverFailure } from "../utils/actionResult";
import { API_PATHS } from "../constants/api";
import { FORM_FIELDS, QUERY_PARAMS } from "../constants/fields";
import { readFormField } from "../utils/formData";
import { apiFetch, apiMutation } from "./http";

async function getUsers(offset?: number): Promise<UsersGetResponse> {
  return await apiFetch<UsersGetResponse>(API_PATHS.users, {
    query: { [QUERY_PARAMS.offset]: offset },
    failureMessage: "Failed to load users",
  });
}

async function updateUser(formData: FormData): Promise<ActionResult<AuthUser>> {
  const userId = readFormField(formData, FORM_FIELDS.userId);

  if (userId === undefined) {
    return serverFailure("Missing user ID");
  }

  return await apiMutation<AuthUser>(API_PATHS.user(userId), {
    method: "PUT",
    body: { formData },
    failureMessage: "Failed to update profile",
  });
}

// What GET /api/users/:id actually ships: the backend's select covers
// exactly these fields (UserWithPostsSchema in @repo/zod-validations
// additionally asserts githubId/createdAt, which the endpoint never
// returns). Embedded posts ride on the shared PostFeedItem type.
type UserProfile = {
  id: number;
  username: string;
  profileUrl: string | null;
  noteToAll: string;
  isFollowing: boolean;
  posts: PostFeedItem[];
};

async function getUserProfile(
  userId: string | undefined,
): Promise<UserProfile> {
  if (!userId) {
    throw new Response("Missing user ID", { status: 400 });
  }

  const body = await apiFetch<{ data: UserProfile }>(API_PATHS.user(userId), {
    query: { [QUERY_PARAMS.include]: "posts" },
    failureMessage: "Failed to load profile",
  });

  return body.data;
}

export type { UserProfile };
export { getUsers, updateUser, getUserProfile };
