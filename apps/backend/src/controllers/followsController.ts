import type { Request, Response } from "express";
import { prisma } from "../db/prisma.ts";
import { AppError } from "../errors/AppError.ts";
import type { FollowParams } from "@repo/zod-validations";

async function followUser(req: Request<FollowParams>, res: Response) {
  if (!req.user) {
    throw new AppError("Unauthenticated", 401);
  }

  const followedById = req.user.id;
  const followingId = req.params.followingId;

  if (followedById == followingId) {
    throw new AppError("Can't follow yourself", 400);
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
    throw new AppError("Unauthenticated", 401);
  }
  const followedById = req.user.id;
  const followingId = req.params.followingId;

  const deletedFollow = await prisma.follow.delete({
    where: {
      followedById_followingId: {
        followedById,
        followingId,
      },
    },
  });

  return res.status(200).json({ data: deletedFollow });
}

export { followUser, unfollowUser };
