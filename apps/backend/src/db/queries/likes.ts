import { prisma } from "../prisma.ts";
import type { Prisma } from "../generated/prisma/client.ts";

function createLike(
  userId: number,
  postId: number,
  client: Prisma.TransactionClient = prisma,
) {
  return client.like.create({
    data: { userId, postId },
  });
}

function deleteLike(
  userId: number,
  postId: number,
  client: Prisma.TransactionClient = prisma,
) {
  return client.like.deleteMany({
    where: { userId, postId },
  });
}

export { createLike, deleteLike };
