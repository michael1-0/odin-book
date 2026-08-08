import { z } from "zod";
import { coercedId } from "./common.js";
import { CommentSchema, PostSchema, UserSchema } from "./entities.js";
import { PostLikeSchema } from "./likes.js";

const PostAuthorSchema = UserSchema.pick({
  id: true,
  profileUrl: true,
  username: true,
});

const PostCommentSchema = CommentSchema.pick({
  id: true,
  content: true,
  createdAt: true,
}).extend({
  user: PostAuthorSchema,
});

export const PostFeedItemSchema = PostSchema.pick({
  content: true,
  createdAt: true,
  id: true,
}).extend({
  user: PostAuthorSchema,
  _count: z.object({
    comments: z.number().int(),
    likes: z.number().int(),
  }),
  likes: z.array(PostLikeSchema),
});
export type PostFeedItem = z.infer<typeof PostFeedItemSchema>;

export const PostFeedItemWithCommentsSchema = PostFeedItemSchema.extend({
  comments: z.array(PostCommentSchema),
});
export type PostFeedItemWithComments = z.infer<
  typeof PostFeedItemWithCommentsSchema
>;

export const PostCreateBodySchema = PostSchema.omit({
  id: true,
  createdAt: true,
  posterId: true,
});
export type PostCreateBody = z.infer<typeof PostCreateBodySchema>;

export const PostIdParamsSchema = z.object({
  postId: coercedId,
});
export type PostIdParams = z.infer<typeof PostIdParamsSchema>;

export const PostsGetQuerySchema = z.object({
  scope: z.enum(["all", "me", "following"]).optional(),
  period: z.enum(["month"]).optional(),
  cursor: coercedId.optional(),
});
export type PostsGetQuery = z.infer<typeof PostsGetQuerySchema>;

export const PostsGetResponseSchema = z.object({
  data: z.array(PostFeedItemSchema),
  nextCursor: z.number().int().positive().nullable(),
});
export type PostsGetResponse = z.infer<typeof PostsGetResponseSchema>;

export const PostGetQuerySchema = z.object({
  include: z.literal("comments").optional(),
});
export type PostGetQuery = z.infer<typeof PostGetQuerySchema>;
