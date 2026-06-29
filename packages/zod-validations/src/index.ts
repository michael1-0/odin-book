import z from "zod";

//  Users
const UserSchema = z.object({
  id: z.number().int(),
  githubId: z.string(),
  username: z.string().max(30),
  noteToAll: z.string().max(280).default(""),
  createdAt: z.date().default(() => new Date()),
  profileUrl: z.string(),
});
const UserWithFollowStatusSchema = UserSchema.extend({
  isFollowing: z.boolean(),
});

type User = z.infer<typeof UserSchema>;
type UserWithFollowStatus = z.infer<typeof UserWithFollowStatusSchema>;

export { UserSchema, UserWithFollowStatusSchema };
export type { User, UserWithFollowStatus };

// Follows
const FollowSchema = z.object({
  followedById: z.coerce.number(),
  followingId: z.coerce.number(),
});

type Follow = z.infer<typeof FollowSchema>;

export { FollowSchema };
export type { Follow };

export default z;
