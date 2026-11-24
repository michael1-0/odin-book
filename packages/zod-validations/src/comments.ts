import { z } from "zod";
import { coercedId } from "./common.js";
import type { ValidationSpec } from "./common.js";
import { CommentSchema } from "./entities.js";

export { CommentSchema };

export const CommentCreateBodySchema = CommentSchema.pick({
  content: true,
}).extend({
  postId: coercedId,
});
export type CommentCreateBody = z.infer<typeof CommentCreateBodySchema>;

export const commentCreateSpec = {
  body: CommentCreateBodySchema,
} satisfies ValidationSpec;
export type CommentCreateSpec = typeof commentCreateSpec;
