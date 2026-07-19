import z from "zod";
import { CommentSchema, PostSchema, UserSchema } from "./base.js";
import { LikeFeedSchema } from "./likes.js";

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
        id: true,
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
const PostsGetQuerySchema = z.object({
  scope: z.enum(["all", "me", "following"]).optional(),
  period: z.enum(["month"]).optional(),
  cursor: z.coerce.number().int().positive().optional(),
});
const PostsGetResponseSchema = z.object({
  data: z.array(PostFeedItemSchema),
  nextCursor: z.number().int().positive().nullable(),
});
const PostGetQuerySchema = z.object({
  include: z.literal("comments"),
});

type PostFeedItem = z.infer<typeof PostFeedItemSchema>;
type PostFeedItemWithComments = z.infer<typeof PostFeedItemWithCommentsSchema>;
type PostCreate = z.infer<typeof PostCreateSchema>;
type PostLikeParams = z.infer<typeof PostLikeParamsSchema>;
type PostGetParams = z.infer<typeof PostGetParamsSchema>;
type PostsGetQuery = z.infer<typeof PostsGetQuerySchema>;
type PostsGetResponse = z.infer<typeof PostsGetResponseSchema>;
type PostGetQuery = z.infer<typeof PostGetQuerySchema>;

export {
  PostFeedItemSchema,
  PostFeedItemWithCommentsSchema,
  PostCreateSchema,
  PostLikeParamsSchema,
  PostGetParamsSchema,
  PostsGetQuerySchema,
  PostsGetResponseSchema,
  PostGetQuerySchema,
};
export type {
  PostFeedItem,
  PostFeedItemWithComments,
  PostCreate,
  PostLikeParams,
  PostGetParams,
  PostsGetQuery,
  PostsGetResponse,
  PostGetQuery,
};
