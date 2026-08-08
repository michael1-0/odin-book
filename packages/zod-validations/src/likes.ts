import { z } from "zod";
import { LikeSchema } from "./entities.js";

export const PostLikeSchema = LikeSchema.pick({
  userId: true,
});
export type PostLike = z.infer<typeof PostLikeSchema>;
