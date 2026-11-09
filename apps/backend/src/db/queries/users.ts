import { prisma } from "../prisma.ts";
import type { Prisma } from "../generated/prisma/client.ts";
import { postFeedSelect } from "./posts.ts";

async function userExists(
  userId: number,
  client: Prisma.TransactionClient = prisma,
) {
  const user = await client.user.findUnique({
    where: { id: userId },
    select: { id: true },
  });

  return user !== null;
}

function findUserById(
  userId: number,
  client: Prisma.TransactionClient = prisma,
) {
  return client.user.findUnique({
    where: { id: userId },
  });
}

function findUserByGithubId(
  githubId: string,
  client: Prisma.TransactionClient = prisma,
) {
  return client.user.findUnique({
    where: { githubId },
  });
}

function createUser(
  data: Prisma.UserCreateInput,
  client: Prisma.TransactionClient = prisma,
) {
  return client.user.create({ data });
}

function updateUser(
  userId: number,
  data: Prisma.UserUpdateInput,
  client: Prisma.TransactionClient = prisma,
) {
  return client.user.update({
    where: { id: userId },
    data,
  });
}

function getUsersExcept(
  excludeUserId: number,
  options: { offset: number; take: number },
  client: Prisma.TransactionClient = prisma,
) {
  return client.user.findMany({
    take: options.take,
    where: {
      id: {
        not: excludeUserId,
      },
    },
    select: {
      id: true,
      username: true,
      createdAt: true,
      profileUrl: true,
      following: {
        where: {
          followedById: excludeUserId, // rows where the follower is excludeUserId
        },
        select: {
          followedById: true,
        },
        take: 1,
      },
    },
    orderBy: {
      id: "asc",
    },
    skip: options.offset,
  });
}

function getUserProfile(
  userId: number,
  options: { currentUserId: number; includePosts: boolean },
  client: Prisma.TransactionClient = prisma,
) {
  return client.user.findUnique({
    select: {
      id: true,
      username: true,
      profileUrl: true,
      noteToAll: true,
      following: {
        where: {
          followedById: options.currentUserId,
        },
        select: {
          followedById: true,
        },
        take: 1,
      },
      posts: options.includePosts
        ? {
            select: postFeedSelect,
          }
        : false,
    },
    where: { id: userId },
  });
}

export {
  userExists,
  findUserById,
  findUserByGithubId,
  createUser,
  updateUser,
  getUsersExcept,
  getUserProfile,
};
