import { API_PATHS } from "../constants/api";

type LoadPostsOptions = {
  cursor?: number;
  scope?: "all" | "me" | "following";
  period?: "month";
};

async function loadPosts({ cursor, scope, period }: LoadPostsOptions = {}) {
  const searchParams = new URLSearchParams();

  if (cursor !== undefined) {
    searchParams.set("cursor", String(cursor));
  }

  if (scope) {
    searchParams.set("scope", scope);
  }

  if (period) {
    searchParams.set("period", period);
  }

  const queryString = searchParams.toString();
  const response = await fetch(
    queryString ? `${API_PATHS.posts}?${queryString}` : API_PATHS.posts,
  );
  const result = await response.json();

  if (!response.ok) {
    throw new Response(result.error?.message ?? "Failed to load posts", {
      status: response.status,
    });
  }

  return result;
}

async function createPost(formData: FormData) {
  const response = await fetch(API_PATHS.posts, {
    method: "POST",
    credentials: "include",
    body: formData,
  });

  const result = await response.json();

  if (!response.ok) {
    return {
      error: true,
      errors: result,
      message: result.error?.message,
    };
  }

  return result.data;
}

async function deletePost(formData: FormData) {
  const postId = formData.get("postId");

  if (typeof postId !== "string") {
    return { error: true, message: "Missing post ID" };
  }

  const response = await fetch(API_PATHS.post(postId), {
    method: "DELETE",
  });

  const result = await response.json();

  if (!response.ok) {
    return {
      error: true,
      message: result.error?.message,
    };
  }

  return result.data;
}

async function getPostWithComments(
  postId: string | undefined,
  offset?: number,
) {
  if (!postId) {
    throw new Response("Missing post ID", { status: 400 });
  }

  const searchParams = new URLSearchParams();

  searchParams.set("include", "comments");

  if (offset !== undefined) {
    searchParams.set("offset", String(offset));
  }

  const response = await fetch(`${API_PATHS.post(postId)}?${searchParams}`);
  const result = await response.json();

  if (!response.ok) {
    throw new Response(result.error?.message ?? "Failed to load post", {
      status: response.status,
    });
  }

  return result;
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
