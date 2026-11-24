import { beforeEach, describe, expect, it } from "vitest";
import { PostFeedItemSchema } from "@repo/zod-validations";
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
  const other = await createUser({ username: "bob" });
  const post = await createPost(other.id, { content: "Like me" });
  postId = post.id;
});

function authed() {
  return authCookie(user);
}

describe("POST /api/likes/:postId", () => {
  it("likes a post and returns the updated feed item", async () => {
    const response = await api()
      .post(`/api/likes/${postId}`)
      .set("Cookie", authed());

    expect(response.status).toBe(201);
    expectContract(PostFeedItemSchema, response.body.data);
    expect(response.body.data.id).toBe(postId);
    expect(response.body.data.likes).toEqual([{ userId: user.id }]);
    expect(response.body.data._count.likes).toBe(1);
    expect(await prisma.like.count({ where: { postId } })).toBe(1);
  });

  it("rejects a duplicate like with 409", async () => {
    await api().post(`/api/likes/${postId}`).set("Cookie", authed());

    const response = await api()
      .post(`/api/likes/${postId}`)
      .set("Cookie", authed());

    expect(response.status).toBe(409);
    expect(response.body.error.message).toBe("Record already exists");
  });

  it("returns 404 for a missing post", async () => {
    const response = await api()
      .post("/api/likes/999999")
      .set("Cookie", authed());

    expect(response.status).toBe(404);
    expect(response.body.error.message).toBe("Post not found");
  });

  it("rejects a malformed post id", async () => {
    const response = await api()
      .post("/api/likes/not-a-number")
      .set("Cookie", authed());

    expect(response.status).toBe(400);
  });

  it("requires authentication", async () => {
    const response = await api().post(`/api/likes/${postId}`);

    expect(response.status).toBe(401);
  });
});

describe("DELETE /api/likes/:postId", () => {
  it("removes a like and returns the updated feed item", async () => {
    await api().post(`/api/likes/${postId}`).set("Cookie", authed());

    const response = await api()
      .delete(`/api/likes/${postId}`)
      .set("Cookie", authed());

    expect(response.status).toBe(200);
    expect(response.body.data.likes).toEqual([]);
    expect(response.body.data._count.likes).toBe(0);
    expect(await prisma.like.count({ where: { postId } })).toBe(0);
  });

  it("is idempotent when the post was never liked", async () => {
    const response = await api()
      .delete(`/api/likes/${postId}`)
      .set("Cookie", authed());

    expect(response.status).toBe(200);
    expect(response.body.data.likes).toEqual([]);
  });

  it("returns 404 for a missing post", async () => {
    const response = await api()
      .delete("/api/likes/999999")
      .set("Cookie", authed());

    expect(response.status).toBe(404);
  });

  it("requires authentication", async () => {
    const response = await api().delete(`/api/likes/${postId}`);

    expect(response.status).toBe(401);
  });
});
