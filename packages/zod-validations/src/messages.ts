import { z } from "zod";
import { coercedId, messageContent } from "./common.js";
import { MessageSchema } from "./entities.js";

export type Message = z.infer<typeof MessageSchema>;

export const FriendIdParamsSchema = z.object({
  friendId: coercedId,
});
export type FriendIdParams = z.infer<typeof FriendIdParamsSchema>;

export const MessagesGetQuerySchema = z.object({
  beforeId: z.coerce.number().int().positive().optional(),
});
export type MessagesGetQuery = z.infer<typeof MessagesGetQuerySchema>;

export const MessagesGetResponseSchema = z.object({
  data: z.array(MessageSchema),
  meta: z.object({
    hasMore: z.boolean(),
    nextCursor: z.number().int().positive().nullable(),
  }),
});
export type MessagesGetResponse = z.infer<typeof MessagesGetResponseSchema>;

export const MessageCreateBodySchema = z.object({
  content: messageContent,
});
export type MessageCreateBody = z.infer<typeof MessageCreateBodySchema>;

export const messagesGetSpec = {
  params: FriendIdParamsSchema,
  query: MessagesGetQuerySchema,
};
export type MessagesGetSpec = typeof messagesGetSpec;

export const messageCreateSpec = {
  params: FriendIdParamsSchema,
  body: MessageCreateBodySchema,
};
export type MessageCreateSpec = typeof messageCreateSpec;
