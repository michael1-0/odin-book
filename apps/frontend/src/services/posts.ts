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
    queryString ? `/api/posts?${queryString}` : "/api/posts",
  );
  const posts = await response.json();

  return posts;
}

async function createPost(content: string) {
  const response = await fetch("/api/posts", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ content }),
  });

  const result = await response.json();

  if (!response.ok) {
    return { error: true, errors: result };
  }

  return result.data;
}

async function getPostWithComments(postId: string | undefined) {
  const response = await fetch(`/api/posts/${postId}?include=comments`);
  const post = await response.json();

  return post.data;
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
  getPostWithComments,
  getCurrentUserPosts,
  getFollowingPostsFromLastMonth,
};
