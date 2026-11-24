import { z } from "zod";
import { coercedId } from "./common.js";
import type { ValidationSpec } from "./common.js";
import { UserSchema } from "./entities.js";
import { PostFeedItemSchema } from "./posts.js";

export const UserIdParamsSchema = z.object({
  userId: coercedId,
});
export type UserIdParams = z.infer<typeof UserIdParamsSchema>;

export const UserWithFollowStatusSchema = UserSchema.pick({
  id: true,
  username: true,
  createdAt: true,
  profileUrl: true,
}).extend({
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

export const usersGetSpec = {
  query: UsersGetQuerySchema,
} satisfies ValidationSpec;
export type UsersGetSpec = typeof usersGetSpec;

// Cursor is the next offset into the id-ordered user list (see
// usersGetSpec), so it is nonnegative rather than a row id like the posts
// feed cursor.
export const UsersGetResponseSchema = z.object({
  data: z.array(UserWithFollowStatusSchema),
  nextCursor: z.number().int().nonnegative().nullable(),
});
export type UsersGetResponse = z.infer<typeof UsersGetResponseSchema>;

export const userGetSpec = {
  params: UserIdParamsSchema,
  query: UserGetQuerySchema,
} satisfies ValidationSpec;
export type UserGetSpec = typeof userGetSpec;

export const userUpdateSpec = {
  params: UserIdParamsSchema,
  body: UserUpdateBodySchema,
} satisfies ValidationSpec;
export type UserUpdateSpec = typeof userUpdateSpec;
