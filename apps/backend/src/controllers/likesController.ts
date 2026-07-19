import type { NextFunction, Request, Response } from "express";
import type { PostLikeParams } from "@repo/zod-validations";
import { prisma } from "../db/prisma.ts";
import { AppError } from "../errors/AppError.ts";
import { getPostFeedItem } from "../utils/postFeed.ts";

async function likePost(
  req: Request<PostLikeParams>,
  res: Response,
  next: NextFunction,
) {
  try {
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
  } catch (error) {
    next(error);
  }
}

async function unlikePost(
  req: Request<PostLikeParams>,
  res: Response,
  next: NextFunction,
) {
  try {
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
  } catch (error) {
    next(error);
  }
}

export { likePost, unlikePost };
