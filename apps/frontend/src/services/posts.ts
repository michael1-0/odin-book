async function loadPosts() {
  const response = await fetch("/api/posts");
  const posts = await response.json();

  return posts.data;
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
  const response = await fetch("/api/posts?scope=me");
  const posts = await response.json();

  return posts.data;
}

async function getFollowingPostsFromLastMonth() {
  const response = await fetch("/api/posts?scope=following&period=month");
  const posts = await response.json();

  return posts.data;
}

export {
  loadPosts,
  createPost,
  getPostWithComments,
  getCurrentUserPosts,
  getFollowingPostsFromLastMonth,
};
