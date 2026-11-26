import type { ActionResult } from "../utils/actionResult";
import type {
  PostFeedItemWithComments,
  PostGetResponse,
  PostsGetResponse,
} from "@repo/zod-validations";
import { serverFailure } from "../utils/actionResult";
import { API_PATHS } from "../constants/api";
import { FORM_FIELDS, QUERY_PARAMS } from "../constants/fields";
import { readFormField } from "../utils/formData";
import { apiFetch, apiMutation } from "./http";

type LoadPostsOptions = {
  // undefined and absent both mean "omit the cursor query param".
  cursor?: number | undefined;
  scope?: "all" | "me" | "following";
  period?: "month";
};

async function loadPosts({
  cursor,
  scope,
  period,
}: LoadPostsOptions = {}): Promise<PostsGetResponse> {
  return await apiFetch<PostsGetResponse>(API_PATHS.posts, {
    query: {
      [QUERY_PARAMS.cursor]: cursor,
      [QUERY_PARAMS.scope]: scope,
      [QUERY_PARAMS.period]: period,
    },
    failureMessage: "Failed to load posts",
  });
}

async function createPost(
  formData: FormData,
): Promise<ActionResult<PostFeedItemWithComments>> {
  return await apiMutation<PostFeedItemWithComments>(API_PATHS.posts, {
    method: "POST",
    body: { formData },
    failureMessage: "Failed to create post",
  });
}

async function deletePost(
  formData: FormData,
): Promise<ActionResult<{ id: number }>> {
  const postId = readFormField(formData, FORM_FIELDS.postId);

  if (postId === undefined) {
    return serverFailure("Missing post ID");
  }

  return await apiMutation<{ id: number }>(API_PATHS.post(postId), {
    method: "DELETE",
    failureMessage: "Failed to delete post",
  });
}

async function getPostWithComments(
  postId: string | undefined,
  offset?: number,
): Promise<PostGetResponse> {
  if (!postId) {
    throw new Response("Missing post ID", { status: 400 });
  }

  return await apiFetch<PostGetResponse>(API_PATHS.post(postId), {
    query: {
      [QUERY_PARAMS.include]: "comments",
      [QUERY_PARAMS.offset]: offset,
    },
    failureMessage: "Failed to load post",
  });
}

// Named domain wrappers are the single home of a page's query options. They
// thread an optional cursor so the route loader (no cursor) and the
// cursor-paginated feed hook (with cursor) share one function.
async function getCurrentUserPosts(cursor?: number) {
  return await loadPosts({ cursor, scope: "me" });
}

async function getFollowingPostsFromLastMonth(cursor?: number) {
  return await loadPosts({ cursor, scope: "following", period: "month" });
}

// Default feed page: all users, newest first (see loadPosts).
async function getLatestPosts(cursor?: number) {
  return await loadPosts({ cursor });
}

export {
  createPost,
  deletePost,
  getPostWithComments,
  getLatestPosts,
  getCurrentUserPosts,
  getFollowingPostsFromLastMonth,
};
