async function createComment(formdata: FormData) {
  const content = formdata.get("content");
  const postId = formdata.get("postId");

  console.log(JSON.stringify({ content, postId }));

  const response = await fetch("/api/comments", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ content, postId }),
  });
  const comment = await response.json();

  return comment.data;
}

export { createComment };
