import type { Test } from "supertest";
import {
  COMMENTS_PAGE_SIZE,
  FEED_PAGE_SIZE,
  MAX_POST_IMAGE_SIZE,
} from "@repo/constants";
import {
  PostFeedItemWithCommentsSchema,
  PostGetResponseSchema,
  PostsGetResponseSchema,
} from "@repo/zod-validations";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { User } from "../../src/db/generated/prisma/client.ts";
import { prisma } from "../../src/db/prisma.ts";
import {
  deletePostImageUrls,
  deleteUploadedPostImages,
  uploadPostImage,
} from "../../src/utils/cloudinary.ts";
import { api } from "../helpers/api.ts";
import { authCookie } from "../helpers/auth.ts";
import { expectContract } from "../helpers/contracts.ts";
import { resetDatabase } from "../helpers/db.ts";
import {
  createComment,
  createFollow,
  createPost,
  createPostImage,
  createUser,
} from "../helpers/factories.ts";

vi.mock("../../src/utils/cloudinary.ts", () => ({
  uploadPostImage: vi.fn(),
  uploadProfilePicture: vi.fn(),
  deletePostImageUrls: vi.fn(),
  deleteUploadedPostImages: vi.fn(),
}));

const uploadPostImageMock = vi.mocked(uploadPostImage);
const deletePostImageUrlsMock = vi.mocked(deletePostImageUrls);
const deleteUploadedPostImagesMock = vi.mocked(deleteUploadedPostImages);

let user: User;

beforeEach(async () => {
  await resetDatabase();
  vi.resetAllMocks();
  user = await createUser({ username: "alice" });
});

afterEach(() => {
  vi.restoreAllMocks();
});

function authed() {
  return authCookie(user);
}

describe("POST /api/posts", () => {
  it("creates a post and returns the feed item", async () => {
    const response = await api()
      .post("/api/posts")
      .set("Cookie", authed())
      .send({ content: "Hello world" });

    expect(response.status).toBe(201);
    expectContract(PostFeedItemWithCommentsSchema, response.body.data);
    expect(response.body.data).toMatchObject({
      content: "Hello world",
      user: { id: user.id, username: "alice" },
      comments: [],
      images: [],
      _count: { comments: 0, likes: 0 },
    });

    const stored = await prisma.post.findUnique({
      where: { id: response.body.data.id },
    });
    expect(stored?.posterId).toBe(user.id);
  });

  it("requires authentication", async () => {
    const response = await api().post("/api/posts").send({ content: "Hello" });

    expect(response.status).toBe(401);
  });

  it("rejects empty content", async () => {
    const response = await api()
      .post("/api/posts")
      .set("Cookie", authed())
      .send({ content: "" });

    expect(response.status).toBe(400);
    expect(response.body.error.message).toContain("Content cannot be empty");
    expect(await prisma.post.count()).toBe(0);
  });

  it("trims content before storing it", async () => {
    const response = await api()
      .post("/api/posts")
      .set("Cookie", authed())
      .send({ content: "  Hello world  " });

    expect(response.status).toBe(201);
    expect(response.body.data.content).toBe("Hello world");
    expect(
      (
        await prisma.post.findUnique({
          where: { id: response.body.data.id },
        })
      )?.content,
    ).toBe("Hello world");
  });

  it("rejects whitespace-only content", async () => {
    const response = await api()
      .post("/api/posts")
      .set("Cookie", authed())
      .send({ content: "   " });

    expect(response.status).toBe(400);
    expect(response.body.error.message).toContain("Content cannot be empty");
    expect(await prisma.post.count()).toBe(0);
  });

  it("rejects content over the limit", async () => {
    const response = await api()
      .post("/api/posts")
      .set("Cookie", authed())
      .send({ content: "a".repeat(201) });

    expect(response.status).toBe(400);
    expect(response.body.error.message).toContain("200 chars max");
  });
});

describe("GET /api/posts", () => {
  it("pages the feed newest-first by id cursor", async () => {
    const posts = [];
    for (let index = 0; index < FEED_PAGE_SIZE + 2; index += 1) {
      posts.push(await createPost(user.id, { content: `Post ${index}` }));
    }

    const firstPage = await api().get("/api/posts").set("Cookie", authed());

    expect(firstPage.status).toBe(200);
    expectContract(PostsGetResponseSchema, firstPage.body);
    expect(firstPage.body.data).toHaveLength(FEED_PAGE_SIZE);
    expect(firstPage.body.data.map((post: { id: number }) => post.id)).toEqual(
      posts
        .slice()
        .reverse()
        .slice(0, FEED_PAGE_SIZE)
        .map((post) => post.id),
    );
    expect(firstPage.body.nextCursor).toBe(
      firstPage.body.data[FEED_PAGE_SIZE - 1].id,
    );

    const secondPage = await api()
      .get("/api/posts")
      .query({ cursor: firstPage.body.nextCursor })
      .set("Cookie", authed());

    expect(secondPage.status).toBe(200);
    expectContract(PostsGetResponseSchema, secondPage.body);
    expect(secondPage.body.data.map((post: { id: number }) => post.id)).toEqual(
      [posts[1]!.id, posts[0]!.id],
    );
    expect(secondPage.body.nextCursor).toBeNull();
  });

  it("ends the feed exactly at one full page", async () => {
    for (let index = 0; index < FEED_PAGE_SIZE; index += 1) {
      await createPost(user.id, { content: `Post ${index}` });
    }

    const response = await api().get("/api/posts").set("Cookie", authed());

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(FEED_PAGE_SIZE);
    expect(response.body.nextCursor).toBeNull();
  });

  it("filters to the current user's posts with scope=me", async () => {
    const other = await createUser({ username: "bob" });
    const mine = await createPost(user.id, { content: "Mine" });
    await createPost(other.id, { content: "Theirs" });

    const response = await api()
      .get("/api/posts")
      .query({ scope: "me" })
      .set("Cookie", authed());

    expect(response.body.data.map((post: { id: number }) => post.id)).toEqual([
      mine.id,
    ]);
  });

  it("filters to followed authors with scope=following", async () => {
    const followed = await createUser({ username: "bob" });
    const stranger = await createUser({ username: "carol" });
    await createFollow(user.id, followed.id);
    const followedPost = await createPost(followed.id, { content: "Followed" });
    await createPost(stranger.id, { content: "Stranger" });
    await createPost(user.id, { content: "Mine" });

    const response = await api()
      .get("/api/posts")
      .query({ scope: "following" })
      .set("Cookie", authed());

    expect(response.body.data.map((post: { id: number }) => post.id)).toEqual([
      followedPost.id,
    ]);
  });

  it("filters to the last 30 days with period=month", async () => {
    const oldPost = await createPost(user.id, {
      content: "Old",
      createdAt: new Date(Date.now() - 31 * 24 * 60 * 60 * 1000),
    });
    const newPost = await createPost(user.id, { content: "New" });

    const response = await api()
      .get("/api/posts")
      .query({ period: "month" })
      .set("Cookie", authed());

    expect(response.body.data.map((post: { id: number }) => post.id)).toEqual([
      newPost.id,
    ]);
    expect(response.body.data).not.toContainEqual(
      expect.objectContaining({ id: oldPost.id }),
    );
  });

  it("rejects an unknown scope", async () => {
    const response = await api()
      .get("/api/posts")
      .query({ scope: "friends" })
      .set("Cookie", authed());

    expect(response.status).toBe(400);
  });

  it("requires authentication", async () => {
    const response = await api().get("/api/posts");

    expect(response.status).toBe(401);
  });
});

describe("GET /api/posts/:postId", () => {
  it("returns post detail without comments by default", async () => {
    const post = await createPost(user.id, { content: "Detail" });
    await createComment(user.id, post.id);

    const response = await api()
      .get(`/api/posts/${post.id}`)
      .set("Cookie", authed());

    expect(response.status).toBe(200);
    expectContract(PostGetResponseSchema, response.body);
    expect(response.body.data.id).toBe(post.id);
    expect(response.body.data.comments).toEqual([]);
    expect(response.body.nextCursor).toBeNull();
  });

  it("pages embedded comments cumulatively by offset", async () => {
    const post = await createPost(user.id);
    for (let index = 0; index < 30; index += 1) {
      await createComment(user.id, post.id, `Comment ${index}`);
    }

    const firstPage = await api()
      .get(`/api/posts/${post.id}`)
      .query({ include: "comments" })
      .set("Cookie", authed());

    expect(firstPage.status).toBe(200);
    expectContract(PostGetResponseSchema, firstPage.body);
    expect(firstPage.body.data.comments).toHaveLength(COMMENTS_PAGE_SIZE);
    expect(firstPage.body.nextCursor).toBe(COMMENTS_PAGE_SIZE);

    const secondPage = await api()
      .get(`/api/posts/${post.id}`)
      .query({ include: "comments", offset: COMMENTS_PAGE_SIZE })
      .set("Cookie", authed());

    expect(secondPage.body.data.comments).toHaveLength(COMMENTS_PAGE_SIZE * 2);
    expect(secondPage.body.nextCursor).toBe(COMMENTS_PAGE_SIZE * 2);

    const lastPage = await api()
      .get(`/api/posts/${post.id}`)
      .query({ include: "comments", offset: COMMENTS_PAGE_SIZE * 2 })
      .set("Cookie", authed());

    expect(lastPage.body.data.comments).toHaveLength(30);
    expect(lastPage.body.nextCursor).toBeNull();
  });

  it("orders embedded comments newest-first", async () => {
    const post = await createPost(user.id);
    await createComment(
      user.id,
      post.id,
      "oldest",
      new Date("2026-01-01T00:00:00.000Z"),
    );
    await createComment(
      user.id,
      post.id,
      "middle",
      new Date("2026-01-02T00:00:00.000Z"),
    );
    await createComment(
      user.id,
      post.id,
      "newest",
      new Date("2026-01-03T00:00:00.000Z"),
    );

    const response = await api()
      .get(`/api/posts/${post.id}`)
      .query({ include: "comments" })
      .set("Cookie", authed());

    expect(
      response.body.data.comments.map(
        (comment: { content: string }) => comment.content,
      ),
    ).toEqual(["newest", "middle", "oldest"]);
  });

  it("ends the comment page exactly at one full page", async () => {
    const post = await createPost(user.id);
    for (let index = 0; index < COMMENTS_PAGE_SIZE; index += 1) {
      await createComment(user.id, post.id, `Comment ${index}`);
    }

    const response = await api()
      .get(`/api/posts/${post.id}`)
      .query({ include: "comments" })
      .set("Cookie", authed());

    expect(response.body.data.comments).toHaveLength(COMMENTS_PAGE_SIZE);
    expect(response.body.nextCursor).toBeNull();
  });

  it("returns 404 for a missing post", async () => {
    const response = await api()
      .get("/api/posts/999999")
      .set("Cookie", authed());

    expect(response.status).toBe(404);
    expect(response.body.error.message).toBe("Post not found");
  });

  it("rejects a malformed post id", async () => {
    const response = await api()
      .get("/api/posts/not-a-number")
      .set("Cookie", authed());

    expect(response.status).toBe(400);
  });

  it("rejects an unknown include value", async () => {
    const post = await createPost(user.id);

    const response = await api()
      .get(`/api/posts/${post.id}`)
      .query({ include: "likes" })
      .set("Cookie", authed());

    expect(response.status).toBe(400);
  });
});

describe("DELETE /api/posts/:postId", () => {
  it("deletes the caller's post", async () => {
    const post = await createPost(user.id);

    const response = await api()
      .delete(`/api/posts/${post.id}`)
      .set("Cookie", authed());

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ data: { id: post.id } });
    expect(await prisma.post.findUnique({ where: { id: post.id } })).toBeNull();
  });

  it("deletes post images from Cloudinary", async () => {
    const post = await createPost(user.id);
    const urls = [
      "https://res.cloudinary.com/test/one.png",
      "https://res.cloudinary.com/test/two.png",
    ];
    await createPostImage(post.id, urls[0], 0);
    await createPostImage(post.id, urls[1], 1);

    const response = await api()
      .delete(`/api/posts/${post.id}`)
      .set("Cookie", authed());

    expect(response.status).toBe(200);

    const deletedUrls = deletePostImageUrlsMock.mock.calls[0]?.[0] ?? [];
    expect([...deletedUrls].sort()).toEqual([...urls].sort());
  });

  it("forbids deleting someone else's post", async () => {
    const other = await createUser();
    const post = await createPost(other.id);

    const response = await api()
      .delete(`/api/posts/${post.id}`)
      .set("Cookie", authed());

    expect(response.status).toBe(403);
    expect(
      await prisma.post.findUnique({ where: { id: post.id } }),
    ).not.toBeNull();
  });

  it("returns 404 for a missing post", async () => {
    const response = await api()
      .delete("/api/posts/999999")
      .set("Cookie", authed());

    expect(response.status).toBe(404);
  });

  it("requires authentication", async () => {
    const post = await createPost(user.id);

    const response = await api().delete(`/api/posts/${post.id}`);

    expect(response.status).toBe(401);
  });
});

describe("post image uploads", () => {
  function attachImage(
    request: Test,
    buffer: Buffer,
    filename: string,
    contentType = "image/png",
  ) {
    return request.attach("images", buffer, { filename, contentType });
  }

  it("stores uploaded image URLs on the post", async () => {
    uploadPostImageMock.mockImplementation((_buffer, publicId) =>
      Promise.resolve(`https://res.cloudinary.com/test/${publicId}.png`),
    );

    const request = attachImage(
      api()
        .post("/api/posts")
        .set("Cookie", authed())
        .field("content", "With an image"),
      Buffer.from("image-bytes"),
      "photo.png",
    );

    const response = await request;

    expect(response.status).toBe(201);
    expectContract(PostFeedItemWithCommentsSchema, response.body.data);
    expect(response.body.data.images).toHaveLength(1);
    expect(response.body.data.images[0].url).toContain(
      "https://res.cloudinary.com/test/",
    );
    expect(uploadPostImageMock).toHaveBeenCalledTimes(1);
    expect(await prisma.postImage.count()).toBe(1);
  });

  it("rejects unsupported mime types", async () => {
    const response = await attachImage(
      api()
        .post("/api/posts")
        .set("Cookie", authed())
        .field("content", "Bad file"),
      Buffer.from("plain"),
      "notes.txt",
      "text/plain",
    );

    expect(response.status).toBe(415);
    expect(response.body.error.message).toContain(
      "Post images must be JPEG, PNG, or WebP",
    );
    expect(uploadPostImageMock).not.toHaveBeenCalled();
  });

  it("rejects more than three images", async () => {
    let request = api()
      .post("/api/posts")
      .set("Cookie", authed())
      .field("content", "Too many");

    for (let index = 0; index < 4; index += 1) {
      request = attachImage(
        request,
        Buffer.from("image"),
        `photo-${index}.png`,
      );
    }

    const response = await request;

    expect(response.status).toBe(400);
    expect(response.body.error.message).toContain("Only up to 3 post images");
  });

  it("rejects an oversized image", async () => {
    const response = await attachImage(
      api().post("/api/posts").set("Cookie", authed()).field("content", "Huge"),
      Buffer.alloc(MAX_POST_IMAGE_SIZE + 1),
      "huge.png",
    );

    expect(response.status).toBe(413);
    expect(response.body.error.message).toContain("MB or smaller");
  });

  it("cleans up successful uploads when a later upload fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    uploadPostImageMock
      .mockResolvedValueOnce("https://res.cloudinary.com/test/one.png")
      .mockRejectedValueOnce(new Error("upload failed"));

    let request = api()
      .post("/api/posts")
      .set("Cookie", authed())
      .field("content", "Partial failure");

    request = attachImage(request, Buffer.from("one"), "one.png");
    request = attachImage(request, Buffer.from("two"), "two.png");

    const response = await request;

    expect(response.status).toBe(502);
    expect(deleteUploadedPostImagesMock).toHaveBeenCalledTimes(1);
    expect(deleteUploadedPostImagesMock.mock.calls[0]?.[0]).toHaveLength(1);
    expect(await prisma.post.count()).toBe(0);
  });
});
