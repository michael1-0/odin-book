import z from "zod";

const CommentCreateBodySchema = z.object({
  content: z.string().min(1, "Comment content cannot be empty"),
  postId: z.coerce.number().int().positive(),
});

type CommentCreateBody = z.infer<typeof CommentCreateBodySchema>;

export { CommentCreateBodySchema };
export type { CommentCreateBody };
