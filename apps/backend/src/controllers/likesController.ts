import type { NextFunction, Request, Response } from "express";
import type { PostLikeParams } from "@repo/zod-validations";
import { prisma } from "../db/prisma.ts";
import { AppError } from "../errors/AppError.ts";

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

    const likedPost = await prisma.like.create({
      data: { userId, postId },
    });

    return res.status(200).json({ data: likedPost });
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

    const unlikedPost = await prisma.like.delete({
      where: {
        userId_postId: {
          userId,
          postId,
        },
      },
    });

    return res.status(200).json({ data: unlikedPost });
  } catch (error) {
    next(error);
  }
}

export { likePost, unlikePost };
