import { beforeEach, describe, expect, it } from "vitest";
import type { User } from "../../src/db/generated/prisma/client.ts";
import { prisma } from "../../src/db/prisma.ts";
import { api } from "../helpers/api.ts";
import { authCookie } from "../helpers/auth.ts";
import { resetDatabase } from "../helpers/db.ts";
import { createUser } from "../helpers/factories.ts";

let user: User;
let target: User;

beforeEach(async () => {
  await resetDatabase();
  user = await createUser({ username: "alice" });
  target = await createUser({ username: "bob" });
});

function authed() {
  return authCookie(user);
}

describe("POST /api/follows/:followingId", () => {
  it("follows a user", async () => {
    const response = await api()
      .post(`/api/follows/${target.id}`)
      .set("Cookie", authed());

    expect(response.status).toBe(201);
    expect(response.body.data).toEqual({
      followedById: user.id,
      followingId: target.id,
    });

    expect(
      await prisma.follow.findUnique({
        where: {
          followedById_followingId: {
            followedById: user.id,
            followingId: target.id,
          },
        },
      }),
    ).not.toBeNull();
  });

  it("is idempotent", async () => {
    await api().post(`/api/follows/${target.id}`).set("Cookie", authed());

    const response = await api()
      .post(`/api/follows/${target.id}`)
      .set("Cookie", authed());

    expect(response.status).toBe(201);
    expect(await prisma.follow.count()).toBe(1);
  });

  it("rejects following yourself", async () => {
    const response = await api()
      .post(`/api/follows/${user.id}`)
      .set("Cookie", authed());

    expect(response.status).toBe(400);
    expect(response.body.error.message).toBe("Can't follow yourself");
  });

  it("returns 404 for a missing user", async () => {
    const response = await api()
      .post("/api/follows/999999")
      .set("Cookie", authed());

    expect(response.status).toBe(404);
    expect(response.body.error.message).toBe("User not found");
  });

  it("rejects a malformed user id", async () => {
    const response = await api()
      .post("/api/follows/not-a-number")
      .set("Cookie", authed());

    expect(response.status).toBe(400);
  });

  it("requires authentication", async () => {
    const response = await api().post(`/api/follows/${target.id}`);

    expect(response.status).toBe(401);
  });
});

describe("DELETE /api/follows/:followingId", () => {
  it("unfollows a user", async () => {
    await api().post(`/api/follows/${target.id}`).set("Cookie", authed());

    const response = await api()
      .delete(`/api/follows/${target.id}`)
      .set("Cookie", authed());

    expect(response.status).toBe(200);
    expect(response.body.data).toEqual({
      followedById: user.id,
      followingId: target.id,
    });
    expect(await prisma.follow.count()).toBe(0);
  });

  it("is idempotent when not following", async () => {
    const response = await api()
      .delete(`/api/follows/${target.id}`)
      .set("Cookie", authed());

    expect(response.status).toBe(200);
  });

  it("requires authentication", async () => {
    const response = await api().delete(`/api/follows/${target.id}`);

    expect(response.status).toBe(401);
  });
});
