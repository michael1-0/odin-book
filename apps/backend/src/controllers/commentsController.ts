import type { Response } from "express";
import type { ValidatedRequest } from "express-zod-safe";
import type { CommentCreateSpec } from "@repo/zod-validations";
import { prisma } from "../db/prisma.ts";
import { AppError } from "../errors/AppError.ts";
import { ERROR_MESSAGES } from "../constants/errors.ts";

async function createComment(
  req: ValidatedRequest<CommentCreateSpec>,
  res: Response,
) {
  if (!req.user) {
    throw new AppError(ERROR_MESSAGES.unauthenticated, 401);
  }

  const userId = req.user.id;
  const { postId, content } = req.body;

  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: { id: true },
  });

  if (!post) {
    throw new AppError(ERROR_MESSAGES.postNotFound, 404);
  }

  const comment = await prisma.comment.create({
    data: {
      content,
      userId,
      postId,
    },
  });

  return res.status(200).json({ data: comment });
}

export { createComment };
