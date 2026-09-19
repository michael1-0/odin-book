import { z } from "zod";
import { coercedId, createdAt, MAX_MESSAGE_LENGTH } from "./common.js";

export const MessageSchema = z.object({
  id: z.number().int().positive(),
  senderId: z.number().int().positive(),
  recipientId: z.number().int().positive(),
  content: z
    .string()
    .min(1, "Message cannot be empty")
    .max(
      MAX_MESSAGE_LENGTH,
      `Message cannot exceed ${MAX_MESSAGE_LENGTH} chars`,
    ),
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

export const MessagesGetResponseSchema = z.object({
  data: z.array(MessageSchema),
  meta: z.object({
    hasMore: z.boolean(),
    nextCursor: z.number().int().positive().nullable(),
  }),
});
export type MessagesGetResponse = z.infer<typeof MessagesGetResponseSchema>;

export const MessageCreateBodySchema = z.object({
  content: z
    .string()
    .min(1, "Message cannot be empty")
    .max(
      MAX_MESSAGE_LENGTH,
      `Message cannot exceed ${MAX_MESSAGE_LENGTH} chars`,
    ),
});
export type MessageCreateBody = z.infer<typeof MessageCreateBodySchema>;
