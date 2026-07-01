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

// Likes
const LikeSchema = z.object({
  userId: z.number().int(),
  postId: z.number().int(),
  createdAt: z.date().default(() => new Date()),
});
const LikeFeedSchema = LikeSchema.pick({
  userId: true,
});

type Like = z.infer<typeof LikeSchema>;
type LikeFeed = z.infer<typeof LikeFeedSchema>;

export { LikeSchema, LikeFeedSchema };
export type { Like, LikeFeed };

// Posts
const PostSchema = z.object({
  id: z.number().int().positive(),
  content: z.string().min(1, "Content cannot be empty"),
  posterId: z.number().int().positive(),
  createdAt: z.date().default(() => new Date()),
});
const PostFeedItemSchema = PostSchema.pick({
  content: true,
  createdAt: true,
  id: true,
}).extend({
  user: UserSchema.pick({
    profileUrl: true,
    username: true,
  }),
  _count: z.object({
    comments: z.number().int(),
    likes: z.number().int(),
  }),
  likes: z.array(
    LikeFeedSchema.pick({
      userId: true,
    }),
  ),
});
const PostCreateSchema = PostSchema.omit({
  id: true,
  createdAt: true,
  posterId: true,
});
const PostCreateParamsSchema = z.object({
  userId: z.coerce.number().int().positive(),
});
const PostLikeParamsSchema = z.object({
  userId: z.coerce.number().int().positive(),
  postId: z.coerce.number().int().positive(),
});

type Post = z.infer<typeof PostSchema>;
type PostFeedItem = z.infer<typeof PostFeedItemSchema>;
type PostCreate = z.infer<typeof PostCreateSchema>;
type PostCreateParams = z.infer<typeof PostCreateParamsSchema>;
type PostLikeParams = z.infer<typeof PostLikeParamsSchema>;

export {
  PostSchema,
  PostFeedItemSchema,
  PostCreateSchema,
  PostCreateParamsSchema,
  PostLikeParamsSchema,
};
export type {
  Post,
  PostFeedItem,
  PostCreate,
  PostCreateParams,
  PostLikeParams,
};

export default z;
