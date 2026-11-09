import type { Response } from "express";
import type { ValidatedRequest } from "express-zod-safe";
import { AppError } from "../errors/AppError.ts";
import { requireUser } from "../middlewares/authMiddleware.ts";
import type {
  UserGetSpec,
  UsersGetSpec,
  UserUpdateSpec,
} from "@repo/zod-validations";
import { USERS_PAGE_SIZE } from "@repo/constants";
import { ERROR_MESSAGES } from "../constants/errors.ts";
import { uploadProfilePicture } from "../utils/cloudinary.ts";
import {
  getUsersExcept,
  getUserProfile,
  updateUser,
} from "../db/queries/users.ts";

async function getUsersWithoutCurrentUser(
  req: ValidatedRequest<UsersGetSpec>,
  res: Response,
) {
  requireUser(req);

  const offset = req.query.offset ?? 0;
  const currentUserId = req.user.id;
  const limit = USERS_PAGE_SIZE;

  const users = await getUsersExcept(currentUserId, {
    offset,
    take: limit + 1,
  });

  const hasNextPage = users.length > limit;
  if (hasNextPage) {
    users.pop();
  }

  const nextCursor = hasNextPage ? offset + limit : null;

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
}

async function updateCurrentUser(
  req: ValidatedRequest<UserUpdateSpec>,
  res: Response,
) {
  requireUser(req);

  const { userId } = req.params;

  if (req.user.id !== userId) {
    throw new AppError(ERROR_MESSAGES.forbidden, 403);
  }

  const { username, noteToAll } = req.body;
  let profileUrl: string | undefined;

  if (req.file) {
    try {
      profileUrl = await uploadProfilePicture(req.file.buffer, req.user.id);
    } catch (error) {
      console.error("[profilePictureUpload] Cloudinary upload failed", error);
      throw new AppError("Unable to upload profile picture", 502, false);
    }
  }

  const updatedUser = await updateUser(req.user.id, {
    username,
    noteToAll,
    ...(profileUrl ? { profileUrl } : {}),
  });

  return res.status(200).json({ data: updatedUser });
}

async function getUser(req: ValidatedRequest<UserGetSpec>, res: Response) {
  requireUser(req);

  const { userId } = req.params;
  const { include } = req.query;

  const currentUserId = req.user.id;

  const user = await getUserProfile(userId, {
    currentUserId,
    includePosts: include === "posts",
  });

  if (!user) {
    throw new AppError(ERROR_MESSAGES.userNotFound, 404);
  }

  const { following, ...userData } = user;

  const formattedUser = {
    ...userData,
    isFollowing: Array.isArray(following) && following.length > 0,
  };

  return res.status(200).json({ data: formattedUser });
}

export { getUsersWithoutCurrentUser, updateCurrentUser, getUser };
