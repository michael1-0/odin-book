export { z } from "zod";

// Users
export {
  UserUpdateBodySchema,
  UserUpdateParamsSchema,
  UserGetParamsSchema,
  UserGetQuerySchema,
  UserWithFollowStatusSchema,
  UserWithPostsSchema,
  type UserUpdateBody,
  type UserUpdateParams,
  type UserGetParams,
  type UserGetQuery,
  type UserWithFollowStatus,
  type UserWithPosts,
} from "./users.js";

// Posts
export {
  PostCreateSchema,
  PostLikeParamsSchema,
  PostGetParamsSchema,
  PostsGetQuerySchema,
  PostsGetResponseSchema,
  PostGetQuerySchema,
  PostFeedItemSchema,
  PostFeedItemWithCommentsSchema,
  type PostCreate,
  type PostLikeParams,
  type PostGetParams,
  type PostsGetQuery,
  type PostsGetResponse,
  type PostGetQuery,
  type PostFeedItem,
  type PostFeedItemWithComments,
} from "./posts.js";

// Comments
export { CommentCreateBodySchema, type CommentCreateBody } from "./comments.js";

// Follows
export { FollowParamsSchema, type FollowParams } from "./follows.js";

// Likes
export { LikeFeedSchema, type LikeFeed } from "./likes.js";
