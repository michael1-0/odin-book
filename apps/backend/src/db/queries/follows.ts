import { prisma } from "../prisma.ts";
import type { Prisma } from "../generated/prisma/client.ts";

function upsertFollow(
  followedById: number,
  followingId: number,
  client: Prisma.TransactionClient = prisma,
) {
  return client.follow.upsert({
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
}

function deleteFollow(
  followedById: number,
  followingId: number,
  client: Prisma.TransactionClient = prisma,
) {
  return client.follow.deleteMany({
    where: {
      followedById,
      followingId,
    },
  });
}

export { upsertFollow, deleteFollow };
