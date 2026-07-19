async function createComment(content: string, postId: number) {
  const response = await fetch("/api/comments", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ content, postId }),
  });
  const result = await response.json();

  if (!response.ok) {
    return { error: true, errors: result };
  }

  return result.data;
}

export { createComment };
