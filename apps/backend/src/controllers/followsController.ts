import type { Response } from "express";
import type { ValidatedRequest } from "express-zod-safe";
import { AppError } from "../errors/AppError.ts";
import { requireUser } from "../middlewares/authMiddleware.ts";
import type { FollowParamsSpec } from "@repo/zod-validations";
import { ERROR_MESSAGES } from "../constants/errors.ts";
import { userExists } from "../db/queries/users.ts";
import { deleteFollow, upsertFollow } from "../db/queries/follows.ts";

async function followUser(
  req: ValidatedRequest<FollowParamsSpec>,
  res: Response,
) {
  requireUser(req);

  const followedById = req.user.id;
  const followingId = req.params.followingId;

  if (followedById == followingId) {
    throw new AppError("Can't follow yourself", 400);
  }

  if (!(await userExists(followingId))) {
    throw new AppError(ERROR_MESSAGES.userNotFound, 404);
  }

  const newFollow = await upsertFollow(followedById, followingId);

  return res.status(201).json({
    data: newFollow,
  });
}

async function unfollowUser(
  req: ValidatedRequest<FollowParamsSpec>,
  res: Response,
) {
  requireUser(req);

  const followedById = req.user.id;
  const followingId = req.params.followingId;

  await deleteFollow(followedById, followingId);

  return res.status(200).json({
    data: { followedById, followingId },
  });
}

export { followUser, unfollowUser };
