import type { ActionResult } from "./actionResult";
import { API_PATHS } from "../constants/api";
import { apiMutation } from "./http";

// The raw comment row POST /api/comments returns. `CommentSchema` in
// @repo/zod-validations matches this row but types `createdAt` as a
// Date; over the wire it is an ISO string, so this type is hand-rolled
// to stay wire-accurate.
type CommentRow = {
  id: number;
  userId: number;
  postId: number;
  content: string;
  createdAt: string;
};

async function createComment(
  content: string,
  postId: number,
): Promise<ActionResult<CommentRow>> {
  return await apiMutation<CommentRow>(API_PATHS.comments, {
    method: "POST",
    body: { json: { content, postId } },
    failureMessage: "Failed to create comment",
  });
}

export type { CommentRow };
export { createComment };
