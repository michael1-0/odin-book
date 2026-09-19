import type { Request, Response } from "express";
import { prisma } from "../db/prisma.ts";
import { AppError } from "../errors/AppError.ts";
import type {
  FriendIdParams,
  MessageCreateBody,
  MessagesGetQuery,
  MessagesGetResponse,
} from "@repo/zod-validations";
import { getIo, userRoom } from "../socket/io.ts";

const PAGE_SIZE = 50;

async function assertFriendship(userId: number, friendId: number) {
  const request = await prisma.friendRequest.findFirst({
    where: {
      status: "ACCEPTED",
      OR: [
        { senderId: userId, receiverId: friendId },
        { senderId: friendId, receiverId: userId },
      ],
    },
  });

  if (!request) {
    throw new AppError("You can only chat with friends", 403);
  }
}

async function getMessages(
  req: Request<FriendIdParams, unknown, unknown, MessagesGetQuery>,
  res: Response,
) {
  if (!req.user) {
    throw new AppError("Unauthenticated", 401);
  }

  const currentUserId = req.user.id;
  const friendId = req.params.friendId;

  await assertFriendship(currentUserId, friendId);

  const messages = await prisma.message.findMany({
    where: {
      OR: [
        { senderId: currentUserId, recipientId: friendId },
        { senderId: friendId, recipientId: currentUserId },
      ],
      ...(req.query.beforeId ? { id: { lt: req.query.beforeId } } : {}),
    },
    orderBy: {
      id: "desc",
    },
    take: PAGE_SIZE + 1,
  });

  const hasMore = messages.length > PAGE_SIZE;
  const page = hasMore ? messages.slice(0, PAGE_SIZE) : messages;
  page.reverse();

  const response: MessagesGetResponse = {
    data: page,
    meta: {
      hasMore,
      nextCursor: hasMore ? (page[0]?.id ?? null) : null,
    },
  };

  return res.status(200).json(response);
}

async function createMessage(
  req: Request<FriendIdParams, unknown, MessageCreateBody>,
  res: Response,
) {
  if (!req.user) {
    throw new AppError("Unauthenticated", 401);
  }

  const senderId = req.user.id;
  const recipientId = req.params.friendId;

  await assertFriendship(senderId, recipientId);

  const message = await prisma.message.create({
    data: {
      senderId,
      recipientId,
      content: req.body.content,
    },
  });

  getIo()
    .to(userRoom(senderId))
    .to(userRoom(recipientId))
    .emit("message:new", { message });

  return res.status(201).json({ data: message });
}

export { getMessages, createMessage };
