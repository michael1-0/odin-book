import type { Response } from "express";
import type { ValidatedRequest } from "express-zod-safe";
import { AppError } from "../errors/AppError.ts";
import { requireUser } from "../middlewares/authMiddleware.ts";
import type {
  MessageCreateSpec,
  MessagesGetResponse,
  MessagesGetSpec,
} from "@repo/zod-validations";
import { MESSAGES_PAGE_SIZE, SOCKET_EVENTS } from "@repo/constants";
import { emitToUser } from "../socket/io.ts";
import { findAcceptedFriendshipBetween } from "../db/queries/friends.ts";
import {
  getMessagesBetweenUsers,
  saveMessage,
} from "../db/queries/messages.ts";
import { splitPage } from "../utils/pagination.ts";

async function assertFriendship(userId: number, friendId: number) {
  const friendship = await findAcceptedFriendshipBetween(userId, friendId);

  if (!friendship) {
    throw new AppError("You can only chat with friends", 403);
  }
}

async function getMessages(
  req: ValidatedRequest<MessagesGetSpec>,
  res: Response,
) {
  requireUser(req);

  const currentUserId = req.user.id;
  const friendId = req.params.friendId;

  await assertFriendship(currentUserId, friendId);

  const messages = await getMessagesBetweenUsers(currentUserId, friendId, {
    beforeId: req.query.beforeId,
    take: MESSAGES_PAGE_SIZE + 1,
  });

  const { items: page, hasMore } = splitPage(messages, MESSAGES_PAGE_SIZE);
  page.reverse(); // return oldest-first for the chat UI

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
  req: ValidatedRequest<MessageCreateSpec>,
  res: Response,
) {
  requireUser(req);

  const senderId = req.user.id;
  const recipientId = req.params.friendId;

  await assertFriendship(senderId, recipientId);

  const message = await saveMessage(senderId, recipientId, req.body.content);

  // Each user's room contains only that user's sockets, so emitting to both
  // rooms individually delivers the message once per connection.
  emitToUser(senderId, SOCKET_EVENTS.messageNew, { message });
  emitToUser(recipientId, SOCKET_EVENTS.messageNew, { message });

  return res.status(201).json({ data: message });
}

export { getMessages, createMessage };
