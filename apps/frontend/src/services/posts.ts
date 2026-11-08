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

async function getCurrentUserPosts() {
  return await loadPosts({ scope: "me" });
}

async function getFollowingPostsFromLastMonth() {
  return await loadPosts({ scope: "following", period: "month" });
}

export {
  loadPosts,
  createPost,
  deletePost,
  getPostWithComments,
  getCurrentUserPosts,
  getFollowingPostsFromLastMonth,
};
