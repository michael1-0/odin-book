import { z } from "zod";
import {
  MAX_CONTENT_LENGTH,
  MAX_NOTE_LENGTH,
  MAX_USERNAME_LENGTH,
  createdAt,
} from "./common.js";

export const UserSchema = z.object({
  id: z.number().int().positive(),
  githubId: z.string(),
  username: z
    .string()
    .min(1, "Username cannot be empty")
    .max(
      MAX_USERNAME_LENGTH,
      `Username cannot exceed ${MAX_USERNAME_LENGTH} chars`,
    ),
  noteToAll: z
    .string()
    .max(MAX_NOTE_LENGTH, `Note to all cannot exceed ${MAX_NOTE_LENGTH} chars`)
    .default(""),
  createdAt,
  profileUrl: z.string(),
});

export const FollowSchema = z.object({
  followedById: z.number().int().positive(),
  followingId: z.number().int().positive(),
});

export const LikeSchema = z.object({
  userId: z.number().int().positive(),
  postId: z.number().int().positive(),
  createdAt,
});

export const CommentSchema = z.object({
  id: z.number().int().positive(),
  userId: z.number().int().positive(),
  postId: z.number().int().positive(),
  content: z
    .string()
    .min(1, "Comment content cannot be empty")
    .max(
      MAX_CONTENT_LENGTH,
      `Comment too long, ${MAX_CONTENT_LENGTH} chars max`,
    ),
  createdAt,
});

export const PostSchema = z.object({
  id: z.number().int().positive(),
  content: z
    .string()
    .min(1, "Content cannot be empty")
    .max(
      MAX_CONTENT_LENGTH,
      `Content too long, ${MAX_CONTENT_LENGTH} chars max`,
    ),
  posterId: z.number().int().positive(),
  createdAt,
});
