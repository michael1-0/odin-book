import z from "zod";

const UserSchema = z.object({
  id: z.number().int(),
  githubId: z.string(),
  username: z.string().max(30),
  noteToAll: z.string().max(280).default(""),
  createdAt: z.date().default(() => new Date()),
  profileUrl: z.string(),
});
const FollowSchema = z.object({
  followedById: z.number().int(),
  followingId: z.number().int(),
});
const LikeSchema = z.object({
  userId: z.number().int(),
  postId: z.number().int(),
  createdAt: z.date().default(() => new Date()),
});
const CommentSchema = z.object({
  id: z.number().int().positive().optional(),
  userId: z.number().int().positive(),
  postId: z.number().int().positive(),
  content: z.string().min(1, "Comment content cannot be empty"),
  createdAt: z.date().default(() => new Date()),
});
const PostSchema = z.object({
  id: z.number().int().positive(),
  content: z.string().min(1, "Content cannot be empty"),
  posterId: z.number().int().positive(),
  createdAt: z.date().default(() => new Date()),
});

export { UserSchema, FollowSchema, LikeSchema, CommentSchema, PostSchema };
