import z from "zod";
import { UserSchema } from "./base.js";
import { PostFeedItemSchema } from "./posts.js";

const UserWithFollowStatusSchema = UserSchema.extend({
  isFollowing: z.boolean(),
});
const UserUpdateBodySchema = UserSchema.pick({
  username: true,
  // profileUrl: true,
  noteToAll: true,
});
const UserUpdateParamsSchema = z.object({
  userId: z.coerce.number().int(),
});
const UserGetParamsSchema = z.object({
  userId: z.coerce.number().int(),
});
const UserGetQuerySchema = z.object({
  include: z.literal("posts").optional(),
});
const UserWithPostsSchema = UserSchema.extend({
  posts: z.array(PostFeedItemSchema),
  isFollowing: z.boolean(),
});
const UsersGetQuerySchema = z.object({
  cursor: z.coerce.number().int().optional(),
});

type UserWithFollowStatus = z.infer<typeof UserWithFollowStatusSchema>;
type UserUpdateBody = z.infer<typeof UserUpdateBodySchema>;
type UserUpdateParams = z.infer<typeof UserUpdateParamsSchema>;
type UserGetParams = z.infer<typeof UserGetParamsSchema>;
type UserGetQuery = z.infer<typeof UserGetQuerySchema>;
type UserWithPosts = z.infer<typeof UserWithPostsSchema>;
type UsersGetQuery = z.infer<typeof UsersGetQuerySchema>;

export {
  UserWithFollowStatusSchema,
  UserUpdateBodySchema,
  UserUpdateParamsSchema,
  UserGetParamsSchema,
  UserGetQuerySchema,
  UserWithPostsSchema,
  UsersGetQuerySchema,
};
export type {
  UserWithFollowStatus,
  UserUpdateBody,
  UserUpdateParams,
  UserGetParams,
  UserGetQuery,
  UserWithPosts,
  UsersGetQuery,
};
