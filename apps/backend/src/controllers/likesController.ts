import type { Response } from "express";
import type { ValidatedRequest } from "express-zod-safe";
import type { PostIdParamsSpec } from "@repo/zod-validations";
import { getPostDetail, postExists } from "../db/queries/posts.ts";
import { createLike, deleteLike } from "../db/queries/likes.ts";
import { AppError } from "../errors/AppError.ts";
import { requireUser } from "../middlewares/authMiddleware.ts";
import { ERROR_MESSAGES } from "../constants/errors.ts";

async function likePost(
  req: ValidatedRequest<PostIdParamsSpec>,
  res: Response,
) {
  requireUser(req);

  const userId = req.user.id;
  const { postId } = req.params;

  if (!(await postExists(postId))) {
    throw new AppError(ERROR_MESSAGES.postNotFound, 404);
  }

  await createLike(userId, postId);

  const feedPost = await getPostDetail(postId);

  return res.status(201).json({ data: feedPost });
}

async function unlikePost(
  req: ValidatedRequest<PostIdParamsSpec>,
  res: Response,
) {
  requireUser(req);

  const userId = req.user.id;
  const { postId } = req.params;

  await deleteLike(userId, postId);

  const feedPost = await getPostDetail(postId);

  if (!feedPost) {
    throw new AppError(ERROR_MESSAGES.postNotFound, 404);
  }

  return res.status(200).json({ data: feedPost });
}

export { likePost, unlikePost };
