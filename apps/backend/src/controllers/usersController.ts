import type { NextFunction, Request, Response } from "express";
import { prisma } from "../db/prisma.ts";
import { AppError } from "../errors/AppError.ts";
import type { UserUpdateBody, UserUpdateParams } from "@repo/zod-validations";

async function getUsersWithoutCurrentUser(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    if (!req.user) {
      throw new AppError("Unauthenticated", 401);
    }

    const currentUserId = req.user.id;

    const users = await prisma.user.findMany({
      take: 10,
      ...(currentUserId && {
        where: {
          id: {
            not: currentUserId,
          },
        },
      }),
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

    const formattedUsers = users.map((user) => {
      const { following, ...userData } = user;

      return {
        ...userData,
        isFollowing: Array.isArray(following) && following.length > 0,
      };
    });

    return res.status(200).json({
      data: formattedUsers,
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

export { getUsersWithoutCurrentUser, updateCurrentUser };
