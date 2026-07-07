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
const UserUpdateBodySchema = UserSchema.pick({
  username: true,
  // profileUrl: true,
  noteToAll: true,
});
const UserUpdateParamsSchema = z.object({
  userId: z.coerce.number().int(),
});

type User = z.infer<typeof UserSchema>;
type UserWithFollowStatus = z.infer<typeof UserWithFollowStatusSchema>;
type UserUpdateBody = z.infer<typeof UserUpdateBodySchema>;
type UserUpdateParams = z.infer<typeof UserUpdateParamsSchema>;

export {
  UserSchema,
  UserWithFollowStatusSchema,
  UserUpdateBodySchema,
  UserUpdateParamsSchema,
};
export type { User, UserWithFollowStatus, UserUpdateBody, UserUpdateParams };

// Follows
const FollowSchema = z.object({
  followedById: z.number().int(),
  followingId: z.number().int(),
});
const FollowParamsSchema = z.object({
  followingId: z.coerce.number().int(),
});

type Follow = z.infer<typeof FollowSchema>;
type FollowParams = z.infer<typeof FollowParamsSchema>;

export { FollowSchema, FollowParamsSchema };
export type { Follow, FollowParams };

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

// Comments
const CommentSchema = z.object({
  id: z.number().int().positive().optional(),
  userId: z.number().int().positive(),
  postId: z.number().int().positive(),
  content: z.string().min(1, "Comment content cannot be empty"),
  createdAt: z.date().default(() => new Date()),
});
const CommentCreateBodySchema = z.object({
  content: z.string().min(1, "Comment content cannot be empty"),
  postId: z.coerce.number().int().positive(),
});

type Comment = z.infer<typeof CommentSchema>;
type CommentCreateBody = z.infer<typeof CommentCreateBodySchema>;

export { CommentSchema, CommentCreateBodySchema };
export type { Comment, CommentCreateBody };

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
    id: true,
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
const PostFeedItemWithCommentsSchema = PostFeedItemSchema.extend({
  comments: z.array(
    CommentSchema.pick({
      id: true,
      content: true,
      createdAt: true,
    }).extend({
      user: UserSchema.pick({
        username: true,
        profileUrl: true,
      }),
    }),
  ),
});
const PostCreateSchema = PostSchema.omit({
  id: true,
  createdAt: true,
  posterId: true,
});
const PostLikeParamsSchema = z.object({
  postId: z.coerce.number().int().positive(),
});
const PostGetParamsSchema = z.object({
  postId: z.coerce.number().int().positive(),
});
const PostGetQuerySchema = z.object({
  include: z.literal("comments"),
});

type Post = z.infer<typeof PostSchema>;
type PostFeedItem = z.infer<typeof PostFeedItemSchema>;
type PostFeedItemWithComments = z.infer<typeof PostFeedItemWithCommentsSchema>;
type PostCreate = z.infer<typeof PostCreateSchema>;
type PostLikeParams = z.infer<typeof PostLikeParamsSchema>;
type PostGetParams = z.infer<typeof PostGetParamsSchema>;
type PostGetQuery = z.infer<typeof PostGetQuerySchema>;

export {
  PostSchema,
  PostFeedItemSchema,
  PostFeedItemWithCommentsSchema,
  PostCreateSchema,
  PostLikeParamsSchema,
  PostGetParamsSchema,
  PostGetQuerySchema,
};
export type {
  Post,
  PostFeedItem,
  PostFeedItemWithComments,
  PostCreate,
  PostLikeParams,
  PostGetParams,
  PostGetQuery,
};

export default z;
