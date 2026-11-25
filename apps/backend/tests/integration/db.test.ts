import { beforeEach, describe, expect, it } from "vitest";
import { prisma } from "../../src/db/prisma.ts";
import { testDatabaseName } from "../testDatabaseUrl.ts";
import { resetDatabase } from "../helpers/db.ts";
import {
  createAcceptedFriendship,
  createComment,
  createFollow,
  createLike,
  createMessage,
  createPost,
  createPostImage,
  createUser,
} from "../helpers/factories.ts";

beforeEach(resetDatabase);

describe("resetDatabase", () => {
  it("runs against the configured test database", async () => {
    const [database] = await prisma.$queryRaw<
      { current_database: string }[]
    >`SELECT current_database()`;

    expect(database?.current_database).toBe(testDatabaseName());
  });

  it("clears every table and restarts identities", async () => {
    const alice = await createUser();
    const bob = await createUser();
    const post = await createPost(alice.id);
    await createPostImage(post.id);
    await createComment(alice.id, post.id);
    await createLike(alice.id, post.id);
    await createFollow(alice.id, bob.id);
    await createAcceptedFriendship(alice.id, bob.id);
    await createMessage(alice.id, bob.id);

    await resetDatabase();

    const counts = await Promise.all([
      prisma.user.count(),
      prisma.post.count(),
      prisma.postImage.count(),
      prisma.comment.count(),
      prisma.like.count(),
      prisma.follow.count(),
      prisma.friendRequest.count(),
      prisma.message.count(),
    ]);

    expect(counts).toEqual([0, 0, 0, 0, 0, 0, 0, 0]);

    const firstUser = await createUser();
    expect(firstUser.id).toBe(1);
  });
});
