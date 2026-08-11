import type { Request, Response } from "express";
import type { PostIdParams } from "@repo/zod-validations";
import { prisma } from "../db/prisma.ts";
import { AppError } from "../errors/AppError.ts";
import { getPostFeedItem } from "../utils/postFeed.ts";

async function likePost(req: Request<PostIdParams>, res: Response) {
  if (!req.user) {
    throw new AppError("Unauthenticated", 401);
  }

  const userId = req.user.id;
  const { postId } = req.params;

  await prisma.like.create({
    data: { userId, postId },
  });

  const feedPost = await getPostFeedItem(postId);

  return res.status(200).json({ data: feedPost });
}

async function unlikePost(req: Request<PostIdParams>, res: Response) {
  if (!req.user) {
    throw new AppError("Unauthenticated", 401);
  }

  const userId = req.user.id;
  const { postId } = req.params;

  await prisma.like.delete({
    where: {
      userId_postId: {
        userId,
        postId,
      },
    },
  });

  const feedPost = await getPostFeedItem(postId);

  return res.status(200).json({ data: feedPost });
}

export { likePost, unlikePost };
