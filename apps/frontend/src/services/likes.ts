async function likePost(formData: FormData) {
  const postId = formData.get("postId");

  const response = await fetch(`/api/likes/${postId}`, {
    method: "POST",
  });
  const likedPost = await response.json();

  return likedPost.data;
}

async function unlikePost(formData: FormData) {
  const postId = formData.get("postId");

  const response = await fetch(`/api/likes/${postId}`, {
    method: "DELETE",
  });
  const unlikedPost = await response.json();

  return unlikedPost.data;
}

export { likePost, unlikePost };
