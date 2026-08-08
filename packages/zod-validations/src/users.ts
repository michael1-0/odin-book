import { z } from "zod";
import { coercedId } from "./common.js";
import { UserSchema } from "./entities.js";
import { PostFeedItemSchema } from "./posts.js";

export const UserIdParamsSchema = z.object({
  userId: coercedId,
});
export type UserIdParams = z.infer<typeof UserIdParamsSchema>;

export const UserWithFollowStatusSchema = UserSchema.extend({
  isFollowing: z.boolean(),
});
export type UserWithFollowStatus = z.infer<typeof UserWithFollowStatusSchema>;

export const UserUpdateBodySchema = UserSchema.pick({
  username: true,
  noteToAll: true,
});
export type UserUpdateBody = z.infer<typeof UserUpdateBodySchema>;

export const UserGetQuerySchema = z.object({
  include: z.literal("posts").optional(),
});
export type UserGetQuery = z.infer<typeof UserGetQuerySchema>;

export const UserWithPostsSchema = UserSchema.extend({
  posts: z.array(PostFeedItemSchema),
  isFollowing: z.boolean(),
});
export type UserWithPosts = z.infer<typeof UserWithPostsSchema>;

export const UsersGetQuerySchema = z.object({
  offset: z.coerce.number().int().nonnegative().optional(),
});
export type UsersGetQuery = z.infer<typeof UsersGetQuerySchema>;
