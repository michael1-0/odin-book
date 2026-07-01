async function loadPosts() {
  const response = await fetch("/api/posts");
  const posts = await response.json();

  return posts.data;
}

async function createPost(formData: FormData) {
  const userId = formData.get("currentUserId");
  const content = formData.get("content");

  const response = await fetch(`/api/users/${userId}/posts`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ content }),
  });
  const post = await response.json();

  return post.data;
}

async function likePost(formData: FormData) {
  const userId = formData.get("currentUserId");
  const postId = formData.get("postId");

  const response = await fetch(`/api/users/${userId}/posts/${postId}/like`, {
    method: "POST",
  });
  const likedPost = await response.json();

  return likedPost.data;
}

async function unlikePost(formData: FormData) {
  const userId = formData.get("currentUserId");
  const postId = formData.get("postId");

  const response = await fetch(`/api/users/${userId}/posts/${postId}/like`, {
    method: "DELETE",
  });
  const unlikedPost = await response.json();

  return unlikedPost.data;
}

export { loadPosts, createPost, likePost, unlikePost };
