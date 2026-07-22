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
  isFollowing: z.boolean()
});

type UserWithFollowStatus = z.infer<typeof UserWithFollowStatusSchema>;
type UserUpdateBody = z.infer<typeof UserUpdateBodySchema>;
type UserUpdateParams = z.infer<typeof UserUpdateParamsSchema>;
type UserGetParams = z.infer<typeof UserGetParamsSchema>;
type UserGetQuery = z.infer<typeof UserGetQuerySchema>;
type UserWithPosts = z.infer<typeof UserWithPostsSchema>;

export {
  UserWithFollowStatusSchema,
  UserUpdateBodySchema,
  UserUpdateParamsSchema,
  UserGetParamsSchema,
  UserGetQuerySchema,
  UserWithPostsSchema,
};
export type {
  UserWithFollowStatus,
  UserUpdateBody,
  UserUpdateParams,
  UserGetParams,
  UserGetQuery,
  UserWithPosts,
};
