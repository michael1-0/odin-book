import type { Request, Response } from "express";
import { prisma } from "../db/prisma.ts";
import { AppError } from "../errors/AppError.ts";
import type { FollowParams } from "@repo/zod-validations";
import { ERROR_MESSAGES } from "../constants/errors.ts";

async function followUser(req: Request<FollowParams>, res: Response) {
  if (!req.user) {
    throw new AppError(ERROR_MESSAGES.unauthenticated, 401);
  }

  const followedById = req.user.id;
  const followingId = req.params.followingId;

  if (followedById == followingId) {
    throw new AppError("Can't follow yourself", 400);
  }

  const targetUser = await prisma.user.findUnique({
    where: { id: followingId },
    select: { id: true },
  });

  if (!targetUser) {
    throw new AppError(ERROR_MESSAGES.userNotFound, 404);
  }

  const newFollow = await prisma.follow.upsert({
    where: {
      followedById_followingId: {
        followedById,
        followingId,
      },
    },
    update: {},
    create: {
      followedById,
      followingId,
    },
  });

  return res.status(200).json({
    data: newFollow,
  });
}

async function unfollowUser(req: Request<FollowParams>, res: Response) {
  if (!req.user) {
    throw new AppError(ERROR_MESSAGES.unauthenticated, 401);
  }
  const followedById = req.user.id;
  const followingId = req.params.followingId;

  await prisma.follow.deleteMany({
    where: {
      followedById,
      followingId,
    },
  });

  return res.status(200).json({
    data: { followedById, followingId },
  });
}

export { followUser, unfollowUser };
