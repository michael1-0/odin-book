import { USERS_PAGE_SIZE } from "@repo/constants";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { UsersGetResponseSchema } from "@repo/zod-validations";
import type { User } from "../../src/db/generated/prisma/client.ts";
import { prisma } from "../../src/db/prisma.ts";
import { uploadProfilePicture } from "../../src/utils/cloudinary.ts";
import { api } from "../helpers/api.ts";
import { authCookie } from "../helpers/auth.ts";
import { expectContract } from "../helpers/contracts.ts";
import { resetDatabase } from "../helpers/db.ts";
import { createFollow, createPost, createUser } from "../helpers/factories.ts";

vi.mock("../../src/utils/cloudinary.ts", () => ({
  uploadPostImage: vi.fn(),
  uploadProfilePicture: vi.fn(),
  deletePostImageUrls: vi.fn(),
  deleteUploadedPostImages: vi.fn(),
}));

const uploadProfilePictureMock = vi.mocked(uploadProfilePicture);

let user: User;

beforeEach(async () => {
  await resetDatabase();
  vi.resetAllMocks();
  user = await createUser({ username: "alice" });
});

function authed() {
  return authCookie(user);
}

describe("GET /api/users", () => {
  it("pages users by offset, excluding the caller", async () => {
    const others = [];
    for (let index = 0; index < USERS_PAGE_SIZE + 2; index += 1) {
      others.push(await createUser({ username: `user-${index}` }));
    }

    const firstPage = await api().get("/api/users").set("Cookie", authed());

    expect(firstPage.status).toBe(200);
    expectContract(UsersGetResponseSchema, firstPage.body);
    expect(firstPage.body.data).toHaveLength(USERS_PAGE_SIZE);
    expect(firstPage.body.data.map((row: { id: number }) => row.id)).toEqual(
      others.slice(0, USERS_PAGE_SIZE).map((row) => row.id),
    );
    expect(firstPage.body.nextCursor).toBe(USERS_PAGE_SIZE);

    const secondPage = await api()
      .get("/api/users")
      .query({ offset: USERS_PAGE_SIZE })
      .set("Cookie", authed());

    expect(secondPage.body.data.map((row: { id: number }) => row.id)).toEqual([
      others[USERS_PAGE_SIZE]!.id,
      others[USERS_PAGE_SIZE + 1]!.id,
    ]);
    expect(secondPage.body.nextCursor).toBeNull();
  });

  it("ends the users page exactly at one full page", async () => {
    for (let index = 0; index < USERS_PAGE_SIZE; index += 1) {
      await createUser({ username: `user-${index}` });
    }

    const response = await api().get("/api/users").set("Cookie", authed());

    expect(response.body.data).toHaveLength(USERS_PAGE_SIZE);
    expect(response.body.nextCursor).toBeNull();
  });

  it("reports follow status per user", async () => {
    const followed = await createUser({ username: "bob" });
    const stranger = await createUser({ username: "carol" });
    await createFollow(user.id, followed.id);

    const response = await api().get("/api/users").set("Cookie", authed());

    const byId = new Map(
      response.body.data.map((row: { id: number; isFollowing: boolean }) => [
        row.id,
        row,
      ]),
    );

    expect(byId.get(followed.id)).toMatchObject({ isFollowing: true });
    expect(byId.get(stranger.id)).toMatchObject({ isFollowing: false });
  });

  it("rejects a negative offset", async () => {
    const response = await api()
      .get("/api/users")
      .query({ offset: -1 })
      .set("Cookie", authed());

    expect(response.status).toBe(400);
  });

  it("requires authentication", async () => {
    const response = await api().get("/api/users");

    expect(response.status).toBe(401);
  });
});

describe("GET /api/users/:userId", () => {
  it("returns a profile without posts by default", async () => {
    const target = await createUser({ username: "bob", noteToAll: "Hi all" });
    await createPost(target.id);

    const response = await api()
      .get(`/api/users/${target.id}`)
      .set("Cookie", authed());

    expect(response.status).toBe(200);
    expect(response.body.data).toMatchObject({
      id: target.id,
      username: "bob",
      noteToAll: "Hi all",
      isFollowing: false,
    });
    expect(response.body.data).not.toHaveProperty("posts");
  });

  it("includes posts when requested", async () => {
    const target = await createUser({ username: "bob" });
    const first = await createPost(target.id, { content: "First" });
    const second = await createPost(target.id, { content: "Second" });
    const callerPost = await createPost(user.id, { content: "Caller" });

    const response = await api()
      .get(`/api/users/${target.id}`)
      .query({ include: "posts" })
      .set("Cookie", authed());

    const posts = response.body.data.posts as { id: number; content: string }[];

    expect(posts).toHaveLength(2);
    expect(posts.map((post) => post.id).sort()).toEqual(
      [first.id, second.id].sort(),
    );
    expect(posts.map((post) => post.id)).not.toContain(callerPost.id);
    expect(posts.find((post) => post.content === "First")).toMatchObject({
      content: "First",
      user: { id: target.id },
      likes: [],
      images: [],
    });
  });

  it("reports whether the caller follows the profile", async () => {
    const target = await createUser();
    await createFollow(user.id, target.id);

    const response = await api()
      .get(`/api/users/${target.id}`)
      .set("Cookie", authed());

    expect(response.body.data.isFollowing).toBe(true);
  });

  it("returns 404 for a missing user", async () => {
    const response = await api()
      .get("/api/users/999999")
      .set("Cookie", authed());

    expect(response.status).toBe(404);
    expect(response.body.error.message).toBe("User not found");
  });

  it("rejects a malformed user id", async () => {
    const response = await api()
      .get("/api/users/not-a-number")
      .set("Cookie", authed());

    expect(response.status).toBe(400);
  });

  it("rejects an unknown include value", async () => {
    const target = await createUser();

    const response = await api()
      .get(`/api/users/${target.id}`)
      .query({ include: "comments" })
      .set("Cookie", authed());

    expect(response.status).toBe(400);
  });
});

describe("PUT /api/users/:userId", () => {
  it("updates the caller's username and note", async () => {
    const response = await api()
      .put(`/api/users/${user.id}`)
      .set("Cookie", authed())
      .send({ username: "alice-renamed", noteToAll: "New note" });

    expect(response.status).toBe(200);
    expect(response.body.data).toMatchObject({
      id: user.id,
      username: "alice-renamed",
      noteToAll: "New note",
    });

    const stored = await prisma.user.findUnique({ where: { id: user.id } });
    expect(stored?.username).toBe("alice-renamed");
  });

  it("defaults a missing note to an empty string", async () => {
    const response = await api()
      .put(`/api/users/${user.id}`)
      .set("Cookie", authed())
      .send({ username: "alice-renamed" });

    expect(response.status).toBe(200);
    expect(response.body.data.noteToAll).toBe("");
  });

  it("forbids updating another user", async () => {
    const other = await createUser();

    const response = await api()
      .put(`/api/users/${other.id}`)
      .set("Cookie", authed())
      .send({ username: "hijacked" });

    expect(response.status).toBe(403);
  });

  it("rejects a username over 30 characters", async () => {
    const response = await api()
      .put(`/api/users/${user.id}`)
      .set("Cookie", authed())
      .send({ username: "a".repeat(31) });

    expect(response.status).toBe(400);
    expect(response.body.error.message).toContain(
      "Username cannot exceed 30 chars",
    );
  });

  it("uploads a profile picture", async () => {
    uploadProfilePictureMock.mockResolvedValue(
      "https://res.cloudinary.com/test/profile.png",
    );

    const response = await api()
      .put(`/api/users/${user.id}`)
      .set("Cookie", authed())
      .field("username", "alice")
      .field("noteToAll", "With picture")
      .attach("profilePicture", Buffer.from("image"), {
        filename: "profile.png",
        contentType: "image/png",
      });

    expect(response.status).toBe(200);
    expect(response.body.data.profileUrl).toBe(
      "https://res.cloudinary.com/test/profile.png",
    );
    expect(uploadProfilePictureMock).toHaveBeenCalledWith(
      expect.any(Buffer),
      user.id,
    );
  });

  it("requires authentication", async () => {
    const response = await api()
      .put(`/api/users/${user.id}`)
      .send({ username: "anon" });

    expect(response.status).toBe(401);
  });
});
