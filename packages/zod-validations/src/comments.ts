import { z } from "zod";
import { coercedId } from "./common.js";
import { CommentSchema } from "./entities.js";

export const CommentCreateBodySchema = CommentSchema.pick({
  content: true,
}).extend({
  postId: coercedId,
});
export type CommentCreateBody = z.infer<typeof CommentCreateBodySchema>;
