async function loadPosts() {
  const response = await fetch("/api/posts");
  const posts = await response.json();

  return posts.data;
}

async function createPost(formData: FormData) {
  const content = formData.get("content");

  const response = await fetch("/api/posts", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ content }),
  });
  const post = await response.json();

  return post.data;
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

export { loadPosts, createPost, getPostWithComments, getCurrentUserPosts };
