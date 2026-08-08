import { z } from "zod";
import { coercedId } from "./common.js";

export const FollowParamsSchema = z.object({
  followingId: coercedId,
});
export type FollowParams = z.infer<typeof FollowParamsSchema>;
