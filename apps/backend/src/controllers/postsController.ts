import type { NextFunction, Request, Response } from "express";
import type { PostCreate, PostCreateParams } from "@repo/zod-validations";
import { prisma } from "../db/prisma.ts";

async function getPosts(req: Request, res: Response, next: NextFunction) {
  try {
    const posts = await prisma.post.findMany({
      select: {
        id: true,
        content: true,
        createdAt: true,
        likes: true,
        _count: {
          select: {
            comments: true,
          },
        },
        user: {
          select: {
            username: true,
            profileUrl: true,
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

export { getPosts, postPost };
