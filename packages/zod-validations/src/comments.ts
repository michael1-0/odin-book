import z from "zod";
import { CommentSchema } from "./base.js";

const CommentCreateBodySchema = CommentSchema.pick({
  content: true,
}).extend({
  postId: z.coerce.number().int().positive(),
});

type CommentCreateBody = z.infer<typeof CommentCreateBodySchema>;

export { CommentCreateBodySchema };
export type { CommentCreateBody };
