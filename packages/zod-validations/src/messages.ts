import { z } from "zod";
import { coercedId, createdAt, messageContent } from "./common.js";
import type { ValidationSpec } from "./common.js";

export const MessageSchema = z.object({
  id: z.number().int().positive(),
  senderId: z.number().int().positive(),
  recipientId: z.number().int().positive(),
  content: messageContent,
  createdAt,
});
export type Message = z.infer<typeof MessageSchema>;

export const FriendIdParamsSchema = z.object({
  friendId: coercedId,
});
export type FriendIdParams = z.infer<typeof FriendIdParamsSchema>;

export const MessagesGetQuerySchema = z.object({
  beforeId: z.coerce.number().int().positive().optional(),
});
export type MessagesGetQuery = z.infer<typeof MessagesGetQuerySchema>;

// Cursor is the id of the oldest returned message, passed back as `beforeId`
// to fetch the page of older messages preceding it.
export const MessagesGetResponseSchema = z.object({
  data: z.array(MessageSchema),
  nextCursor: z.number().int().positive().nullable(),
});
export type MessagesGetResponse = z.infer<typeof MessagesGetResponseSchema>;

export const MessageCreateBodySchema = z.object({
  content: messageContent,
});
export type MessageCreateBody = z.infer<typeof MessageCreateBodySchema>;

export const messagesGetSpec = {
  params: FriendIdParamsSchema,
  query: MessagesGetQuerySchema,
} satisfies ValidationSpec;
export type MessagesGetSpec = typeof messagesGetSpec;

export const messageCreateSpec = {
  params: FriendIdParamsSchema,
  body: MessageCreateBodySchema,
} satisfies ValidationSpec;
export type MessageCreateSpec = typeof messageCreateSpec;
