import z from "zod";

//  Users
const UserSchema = z.object({
  id: z.number().int(),
  githubId: z.string(),
  username: z.string().max(30),
  noteToAll: z.string().max(280).default(""),
  createdAt: z.date().default(() => new Date()),
  profileUrl: z.string(),
});
const UserWithFollowStatusSchema = UserSchema.extend({
  isFollowing: z.boolean(),
});

type User = z.infer<typeof UserSchema>;
type UserWithFollowStatus = z.infer<typeof UserWithFollowStatusSchema>;

export { UserSchema, UserWithFollowStatusSchema };
export type { User, UserWithFollowStatus };

// Follows
const FollowSchema = z.object({
  followedById: z.coerce.number(),
  followingId: z.coerce.number(),
});

type Follow = z.infer<typeof FollowSchema>;

export { FollowSchema };
export type { Follow };

// Posts
const PostSchema = z.object({
  id: z.number().int().positive(),
  content: z.string().min(1, "Content cannot be empty"),
  likes: z.number().int().nonnegative().nullable().default(0),
  posterId: z.number().int().positive(),
  createdAt: z.date().default(() => new Date()),
});
const PostFeedItemSchema = PostSchema.pick({
  content: true,
  createdAt: true,
  id: true,
  likes: true,
}).extend({
  user: UserSchema.pick({
    profileUrl: true,
    username: true,
  }),
  _count: z.object({
    comments: z.number().int(),
  }),
});
const PostCreateSchema = PostSchema.omit({
  id: true,
  createdAt: true,
  posterId: true,
}).extend({
  likes: PostSchema.shape.likes.optional(),
});
const PostCreateParamsSchema = z.object({
  userId: z.coerce.number().int().positive(),
});

type Post = z.infer<typeof PostSchema>;
type PostFeedItem = z.infer<typeof PostFeedItemSchema>;
type PostCreate = z.infer<typeof PostCreateSchema>;
type PostCreateParams = z.infer<typeof PostCreateParamsSchema>;

export {
  PostSchema,
  PostFeedItemSchema,
  PostCreateSchema,
  PostCreateParamsSchema,
};
export type {
  Post,
  PostFeedItem,
  PostCreate,
  PostCreateParams,
};

export default z;
