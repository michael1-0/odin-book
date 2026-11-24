import { beforeEach, describe, expect, it } from "vitest";
import { CommentSchema } from "@repo/zod-validations";
import type { User } from "../../src/db/generated/prisma/client.ts";
import { prisma } from "../../src/db/prisma.ts";
import { api } from "../helpers/api.ts";
import { authCookie } from "../helpers/auth.ts";
import { expectContract } from "../helpers/contracts.ts";
import { resetDatabase } from "../helpers/db.ts";
import { createPost, createUser } from "../helpers/factories.ts";

let user: User;
let postId: number;

beforeEach(async () => {
  await resetDatabase();
  user = await createUser({ username: "alice" });
  const post = await createPost(user.id);
  postId = post.id;
});

function authed() {
  return authCookie(user);
}

describe("POST /api/comments", () => {
  it("creates a comment", async () => {
    const response = await api()
      .post("/api/comments")
      .set("Cookie", authed())
      .send({ postId, content: "Nice post" });

    expect(response.status).toBe(201);
    expectContract(CommentSchema, response.body.data);
    expect(response.body.data).toMatchObject({
      userId: user.id,
      postId,
      content: "Nice post",
    });

    const stored = await prisma.comment.findUnique({
      where: { id: response.body.data.id },
    });
    expect(stored?.content).toBe("Nice post");
  });

  it("coerces a string post ID", async () => {
    const response = await api()
      .post("/api/comments")
      .set("Cookie", authed())
      .send({ postId: String(postId), content: "Coerced" });

    expect(response.status).toBe(201);
    expect(response.body.data.postId).toBe(postId);
  });

  it("rejects empty content", async () => {
    const response = await api()
      .post("/api/comments")
      .set("Cookie", authed())
      .send({ postId, content: "" });

    expect(response.status).toBe(400);
    expect(response.body.error.message).toContain(
      "Comment content cannot be empty",
    );
  });

  it("rejects whitespace-only content", async () => {
    const response = await api()
      .post("/api/comments")
      .set("Cookie", authed())
      .send({ postId, content: "   " });

    expect(response.status).toBe(400);
    expect(response.body.error.message).toContain(
      "Comment content cannot be empty",
    );
  });

  it("rejects content over the limit", async () => {
    const response = await api()
      .post("/api/comments")
      .set("Cookie", authed())
      .send({ postId, content: "a".repeat(201) });

    expect(response.status).toBe(400);
    expect(response.body.error.message).toContain("200 chars max");
  });

  it("returns 404 for a missing post", async () => {
    const response = await api()
      .post("/api/comments")
      .set("Cookie", authed())
      .send({ postId: 999999, content: "Orphan" });

    expect(response.status).toBe(404);
    expect(response.body.error.message).toBe("Post not found");
  });

  it("rejects a non-positive post ID", async () => {
    const response = await api()
      .post("/api/comments")
      .set("Cookie", authed())
      .send({ postId: 0, content: "Bad id" });

    expect(response.status).toBe(400);
  });

  it("requires authentication", async () => {
    const response = await api()
      .post("/api/comments")
      .send({ postId, content: "Anon" });

    expect(response.status).toBe(401);
  });
});
