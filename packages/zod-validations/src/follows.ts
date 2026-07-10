import z from "zod";

const FollowParamsSchema = z.object({
  followingId: z.coerce.number().int(),
});

type FollowParams = z.infer<typeof FollowParamsSchema>;

export { FollowParamsSchema };
export type { FollowParams };
