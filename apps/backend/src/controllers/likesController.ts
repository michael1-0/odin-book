import type { Request, Response } from "express";
import type { PostIdParams } from "@repo/zod-validations";
import { prisma } from "../db/prisma.ts";
import { AppError } from "../errors/AppError.ts";
import { getPostFeedItem } from "../utils/postFeed.ts";
import { ERROR_MESSAGES } from "../constants/errors.ts";

async function likePost(req: Request<PostIdParams>, res: Response) {
  if (!req.user) {
    throw new AppError(ERROR_MESSAGES.unauthenticated, 401);
  }

  const userId = req.user.id;
  const { postId } = req.params;

  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: { id: true },
  });

  if (!post) {
    throw new AppError(ERROR_MESSAGES.postNotFound, 404);
  }

  await prisma.like.create({
    data: { userId, postId },
  });

  const feedPost = await getPostFeedItem(postId);

  return res.status(200).json({ data: feedPost });
}

async function unlikePost(req: Request<PostIdParams>, res: Response) {
  if (!req.user) {
    throw new AppError(ERROR_MESSAGES.unauthenticated, 401);
  }

  const userId = req.user.id;
  const { postId } = req.params;

  await prisma.like.deleteMany({
    where: {
      userId,
      postId,
    },
  });

  const feedPost = await getPostFeedItem(postId);

  if (!feedPost) {
    throw new AppError(ERROR_MESSAGES.postNotFound, 404);
  }

  return res.status(200).json({ data: feedPost });
}

export { likePost, unlikePost };
