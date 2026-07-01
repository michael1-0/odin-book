import type { NextFunction, Request, Response } from "express";
import type {
  PostCreate,
  PostCreateParams,
  PostLikeParams,
} from "@repo/zod-validations";
import { prisma } from "../db/prisma.ts";

async function getPosts(req: Request, res: Response, next: NextFunction) {
  try {
    const posts = await prisma.post.findMany({
      select: {
        id: true,
        content: true,
        createdAt: true,
        _count: {
          select: {
            comments: true,
            likes: true,
          },
        },
        user: {
          select: {
            username: true,
            profileUrl: true,
          },
        },
        likes: {
          select: {
            userId: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 10,
    });

    return res.status(200).json({ data: posts });
  } catch (error) {
    next(error);
  }
}

async function postPost(
  req: Request<PostCreateParams, unknown, PostCreate>,
  res: Response,
  next: NextFunction,
) {
  try {
    const { content } = req.body;
    const { userId } = req.params;

    const newPost = await prisma.post.create({
      data: {
        content,
        posterId: userId,
      },
    });

    res.status(200).json({ data: newPost });
  } catch (error) {
    next(error);
  }
}

async function likePost(
  req: Request<PostLikeParams>,
  res: Response,
  next: NextFunction,
) {
  try {
    const { postId, userId } = req.params;

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
    const { postId, userId } = req.params;

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

export { getPosts, postPost, likePost, unlikePost };
