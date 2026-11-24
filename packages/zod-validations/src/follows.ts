import { z } from "zod";
import { coercedId } from "./common.js";
import type { ValidationSpec } from "./common.js";

export const FollowParamsSchema = z.object({
  followingId: coercedId,
});
export type FollowParams = z.infer<typeof FollowParamsSchema>;

export const followParamsSpec = {
  params: FollowParamsSchema,
} satisfies ValidationSpec;
export type FollowParamsSpec = typeof followParamsSpec;
