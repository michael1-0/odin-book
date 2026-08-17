import type { Request, Response } from "express";
import { prisma } from "../db/prisma.ts";
import { AppError } from "../errors/AppError.ts";
import type {
  UserIdParams,
  UserGetQuery,
  UsersGetQuery,
  UserUpdateBody,
} from "@repo/zod-validations";
import uploadProfilePicture from "../utils/cloudinary.ts";

async function getUsersWithoutCurrentUser(
  req: Request<unknown, unknown, unknown, UsersGetQuery>,
  res: Response,
) {
  if (!req.user) {
    throw new AppError("Unauthenticated", 401);
  }

  const offset = req.query.offset ?? 0;
  const currentUserId = req.user.id;
  const limit = 12;

  const users = await prisma.user.findMany({
    take: offset + limit + 1,
    where: {
      id: {
        not: currentUserId,
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

  const hasNextPage = users.length > offset + limit;
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
  req: Request<UserIdParams, unknown, UserUpdateBody>,
  res: Response,
) {
  if (!req.user) {
    throw new AppError("Unauthenticated", 401);
  }

  const { userId } = req.params;

  if (req.user.id !== userId) {
    throw new AppError("Unauthorized", 403);
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

  const updatedUser = await prisma.user.update({
    where: {
      id: req.user.id,
    },
    data: {
      username,
      noteToAll,
      ...(profileUrl ? { profileUrl } : {}),
    },
  });

  return res.status(200).json({ data: updatedUser });
}

async function getUser(
  req: Request<UserIdParams, unknown, UserGetQuery>,
  res: Response,
) {
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
}

export { getUsersWithoutCurrentUser, updateCurrentUser, getUser };
