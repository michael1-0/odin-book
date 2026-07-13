import z from "zod";
import {
  UserGetParamsSchema,
  UserGetQuerySchema,
  UserUpdateBodySchema,
  UserUpdateParamsSchema,
  UserWithFollowStatusSchema,
  UserWithPostsSchema,
} from "./users.js";
import { FollowParamsSchema } from "./follows.js";
import { LikeFeedSchema } from "./likes.js";
import { CommentCreateBodySchema } from "./comments.js";
import {
  PostCreateSchema,
  PostFeedItemSchema,
  PostFeedItemWithCommentsSchema,
  PostGetParamsSchema,
  PostsGetQuerySchema,
  PostGetQuerySchema,
  PostLikeParamsSchema,
} from "./posts.js";

// Users
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

// Follows
type FollowParams = z.infer<typeof FollowParamsSchema>;
export { FollowParamsSchema };
export type { FollowParams };

// Likes
type LikeFeed = z.infer<typeof LikeFeedSchema>;
export { LikeFeedSchema };
export type { LikeFeed };

// Comments
type CommentCreateBody = z.infer<typeof CommentCreateBodySchema>;
export { CommentCreateBodySchema };
export type { CommentCreateBody };

// Posts
type PostFeedItem = z.infer<typeof PostFeedItemSchema>;
type PostFeedItemWithComments = z.infer<typeof PostFeedItemWithCommentsSchema>;
type PostCreate = z.infer<typeof PostCreateSchema>;
type PostLikeParams = z.infer<typeof PostLikeParamsSchema>;
type PostGetParams = z.infer<typeof PostGetParamsSchema>;
type PostsGetQuery = z.infer<typeof PostsGetQuerySchema>;
type PostGetQuery = z.infer<typeof PostGetQuerySchema>;
export {
  PostFeedItemSchema,
  PostFeedItemWithCommentsSchema,
  PostCreateSchema,
  PostLikeParamsSchema,
  PostGetParamsSchema,
  PostsGetQuerySchema,
  PostGetQuerySchema,
};
export type {
  PostFeedItem,
  PostFeedItemWithComments,
  PostCreate,
  PostLikeParams,
  PostGetParams,
  PostsGetQuery,
  PostGetQuery,
};

export default z;
