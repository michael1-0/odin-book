import { z } from "zod";
import { coercedId, createdAt } from "./common.js";
import { UserSchema } from "./entities.js";
import { MessageSchema } from "./messages.js";

export const FriendUserSchema = UserSchema.pick({
  id: true,
  username: true,
  profileUrl: true,
  createdAt: true,
}).extend({
  profileUrl: z.string().nullable(),
});
export type FriendUser = z.infer<typeof FriendUserSchema>;

export const FriendRequestStatusSchema = z.enum([
  "PENDING",
  "ACCEPTED",
  "DECLINED",
]);
export type FriendRequestStatus = z.infer<typeof FriendRequestStatusSchema>;

export const FriendRequestSchema = z.object({
  id: z.number().int().positive(),
  senderId: z.number().int().positive(),
  receiverId: z.number().int().positive(),
  status: FriendRequestStatusSchema,
  createdAt,
});
export type FriendRequest = z.infer<typeof FriendRequestSchema>;

export const FriendRequestWithUsersSchema = FriendRequestSchema.extend({
  sender: FriendUserSchema,
  receiver: FriendUserSchema,
});
export type FriendRequestWithUsers = z.infer<
  typeof FriendRequestWithUsersSchema
>;

export const FriendSchema = FriendUserSchema.extend({
  friendshipId: z.number().int().positive(),
  lastMessage: MessageSchema.pick({
    content: true,
    senderId: true,
    createdAt: true,
  }).nullable(),
});
export type Friend = z.infer<typeof FriendSchema>;

export const FriendsGetResponseSchema = z.object({
  data: z.object({
    friends: z.array(FriendSchema),
    incomingRequests: z.array(FriendRequestWithUsersSchema),
    outgoingRequests: z.array(FriendRequestWithUsersSchema),
  }),
});
export type FriendsGetResponse = z.infer<typeof FriendsGetResponseSchema>;

export const TargetUserIdParamsSchema = z.object({
  targetUserId: coercedId,
});
export type TargetUserIdParams = z.infer<typeof TargetUserIdParamsSchema>;

export const FriendRequestIdParamsSchema = z.object({
  requestId: coercedId,
});
export type FriendRequestIdParams = z.infer<typeof FriendRequestIdParamsSchema>;

export const FriendExploreQuerySchema = z.object({
  query: z.string().trim().max(30).optional(),
  offset: z.coerce.number().int().nonnegative().optional(),
});
export type FriendExploreQuery = z.infer<typeof FriendExploreQuerySchema>;

export const FriendExploreItemSchema = FriendUserSchema.extend({
  requestStatus: FriendRequestStatusSchema.nullable(),
  requestId: z.number().int().positive().nullable(),
});
export type FriendExploreItem = z.infer<typeof FriendExploreItemSchema>;
