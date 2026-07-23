import type { NextFunction, Request, Response } from "express";
import { prisma } from "../db/prisma.ts";
import { AppError } from "../errors/AppError.ts";
import type {
  UserGetParams,
  UserGetQuery,
  UsersGetQuery,
  UserUpdateBody,
  UserUpdateParams,
} from "@repo/zod-validations";

async function getUsersWithoutCurrentUser(
  req: Request<unknown, unknown, unknown, UsersGetQuery>,
  res: Response,
  next: NextFunction,
) {
  try {
    if (!req.user) {
      throw new AppError("Unauthenticated", 401);
    }

    const cursorId = req.query.cursor;
    const currentUserId = req.user.id;
    const limit = 10;

    const users = await prisma.user.findMany({
      take: limit + 1,
      where: {
        id: {
          not: currentUserId,
          ...(cursorId ? { gt: cursorId } : {}),
        },
      },
      select: {
        id: true,
        username: true,
        createdAt: true,
        profileUrl: true,
        following: currentUserId
          ? {
              where: {
                followedById: currentUserId, // Is the logged-in user the follower?
              },
              select: {
                followedById: true,
              },
              take: 1,
            }
          : false,
      },
    });

    const hasNextPage = users.length > limit;
    if (hasNextPage) {
      users.pop();
    }

    const lastUser = users.at(-1);
    const nextCursor = hasNextPage && lastUser ? lastUser.id : null;

    const formattedUsers = users.map((user) => {
      const { following, ...userData } = user;

      return {
        ...userData,
        isFollowing: Array.isArray(following) && following.length > 0,
      };
    });

    return res.status(200).json({
      data: formattedUsers,
      meta: {
        nextCursor,
        hasNextPage,
      },
    });
  } catch (error) {
    next(error);
  }
}

async function updateCurrentUser(
  req: Request<UserUpdateParams, unknown, UserUpdateBody>,
  res: Response,
  next: NextFunction,
) {
  try {
    if (!req.user) {
      throw new AppError("Unauthenticated", 401);
    }

    const { userId } = req.params;

    if (req.user.id !== userId) {
      throw new AppError("Unauthorized", 403);
    }

    const { username, noteToAll } = req.body;

    const updatedUser = await prisma.user.update({
      where: {
        id: req.user.id,
      },
      data: { username, noteToAll },
    });

    return res.status(200).json({ data: updatedUser });
  } catch (error) {
    next(error);
  }
}

async function getUser(
  req: Request<UserGetParams, unknown, UserGetQuery>,
  res: Response,
  next: NextFunction,
) {
  try {
    if (!req.user) {
      throw new AppError("Unauthenticated", 401);
    }

    const { userId } = req.params;
    const { include } = req.query;

    const currentUserId = req.user.id;

    const user = await prisma.user.findUnique({
      select: {
        id: true,
        username: true,
        profileUrl: true,
        noteToAll: true,
        following: currentUserId
          ? {
              select: {
                followedById: true,
              },
              where: {
                followedById: currentUserId,
              },
              take: 1,
            }
          : false,
        posts:
          include === "posts"
            ? {
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
              }
            : false,
      },
      where: { id: userId },
    });

    const { following, ...userData } = user!;

    const formattedUser = {
      ...userData,
      isFollowing: Array.isArray(following) && following.length > 0,
    };

    return res.status(200).json({ data: formattedUser });
  } catch (error) {
    next(error);
  }
}

export { getUsersWithoutCurrentUser, updateCurrentUser, getUser };
