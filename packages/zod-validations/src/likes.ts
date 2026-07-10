import z from "zod";
import { LikeSchema } from "./base.js";

const LikeFeedSchema = LikeSchema.pick({
  userId: true,
});

type LikeFeed = z.infer<typeof LikeFeedSchema>;

export { LikeFeedSchema };
export type { LikeFeed };
