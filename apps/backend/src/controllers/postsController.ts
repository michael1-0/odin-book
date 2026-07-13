import type { NextFunction, Request, Response } from "express";
import type {
  PostCreate,
  PostGetParams,
  PostGetQuery,
  PostsGetQuery,
} from "@repo/zod-validations";
import { prisma } from "../db/prisma.ts";
import { AppError } from "../errors/AppError.ts";
import type { PostWhereInput } from "../db/generated/prisma/models.ts";

async function getPosts(
  req: Request<unknown, unknown, unknown, PostsGetQuery>,
  res: Response,
  next: NextFunction,
) {
  try {
    if (!req.user) {
      throw new AppError("Unauthenticated", 401);
    }

    const scope = req.query.scope ?? "all";
    const where: PostWhereInput = {};

    if (req.query.period === "month") {
      where.createdAt = {
        gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      };
    }

    if (scope === "me") {
      where.user = { id: req.user.id };
    }

    if (scope === "following") {
      where.user = {
        following: {
          some: {
            followedById: req.user.id,
          },
        },
      };
    }

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
            id: true,
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
      where,
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

async function createPost(
  req: Request<unknown, unknown, PostCreate>,
  res: Response,
  next: NextFunction,
) {
  try {
    if (!req.user) {
      throw new AppError("Unauthenticated", 401);
    }

    const userId = req.user.id;
    const { content } = req.body;

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

async function getPost(
  req: Request<PostGetParams, unknown, unknown, PostGetQuery>,
  res: Response,
  next: NextFunction,
) {
  try {
    const { postId } = req.params;
    const { include } = req.query;

    const post = await prisma.post.findUnique({
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
            id: true,
            username: true,
            profileUrl: true,
          },
        },
        likes: {
          select: {
            userId: true,
          },
        },
        comments:
          include === "comments"
            ? {
                select: {
                  id: true,
                  user: {
                    select: {
                      id: true,
                      profileUrl: true,
                      username: true,
                    },
                  },
                  content: true,
                  createdAt: true,
                },
                orderBy: {
                  createdAt: "desc",
                },
              }
            : false,
      },
      where: {
        id: postId,
      },
    });

    return res.status(200).json({ data: post });
  } catch (error) {
    next(error);
  }
}

export { getPosts, createPost, getPost };
