import { prisma } from "../prisma.ts";
import type { Prisma } from "../generated/prisma/client.ts";

function findLastMessageBetween(
  userId: number,
  friendId: number,
  client: Prisma.TransactionClient = prisma,
) {
  return client.message.findFirst({
    where: {
      OR: [
        { senderId: userId, recipientId: friendId },
        { senderId: friendId, recipientId: userId },
      ],
    },
    orderBy: {
      id: "desc",
    },
    select: {
      content: true,
      senderId: true,
      createdAt: true,
    },
  });
}

function getMessagesBetweenUsers(
  userId: number,
  friendId: number,
  options: { beforeId?: number | undefined; take: number },
  client: Prisma.TransactionClient = prisma,
) {
  return client.message.findMany({
    where: {
      OR: [
        { senderId: userId, recipientId: friendId },
        { senderId: friendId, recipientId: userId },
      ],
      ...(options.beforeId ? { id: { lt: options.beforeId } } : {}),
    },
    orderBy: {
      id: "desc",
    },
    take: options.take,
  });
}

function saveMessage(
  senderId: number,
  recipientId: number,
  content: string,
  client: Prisma.TransactionClient = prisma,
) {
  return client.message.create({
    data: {
      senderId,
      recipientId,
      content,
    },
  });
}

export { findLastMessageBetween, getMessagesBetweenUsers, saveMessage };
