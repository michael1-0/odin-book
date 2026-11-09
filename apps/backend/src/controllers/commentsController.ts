import type { Response } from "express";
import type { ValidatedRequest } from "express-zod-safe";
import type { CommentCreateSpec } from "@repo/zod-validations";
import { postExists } from "../db/queries/posts.ts";
import { saveComment } from "../db/queries/comments.ts";
import { AppError } from "../errors/AppError.ts";
import { requireUser } from "../middlewares/authMiddleware.ts";
import { ERROR_MESSAGES } from "../constants/errors.ts";

async function createComment(
  req: ValidatedRequest<CommentCreateSpec>,
  res: Response,
) {
  requireUser(req);

  const userId = req.user.id;
  const { postId, content } = req.body;

  if (!(await postExists(postId))) {
    throw new AppError(ERROR_MESSAGES.postNotFound, 404);
  }

  const comment = await saveComment(userId, postId, content);

  return res.status(201).json({ data: comment });
}

export { createComment };
