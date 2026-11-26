import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { FORM_FIELDS } from "../../../src/constants/fields";
import { FORM_INTENTS } from "../../../src/constants/routes";
import { createComment } from "../../../src/services/comments";
import { followUser, unfollowUser } from "../../../src/services/follows";
import { likePost, unlikePost } from "../../../src/services/likes";
import {
  createPost,
  deletePost,
  getCurrentUserPosts,
  getLatestPosts,
  getPostWithComments,
} from "../../../src/services/posts";
import { updateUser } from "../../../src/services/users";
import Home from "../../../src/pages/Home";
import PostDetail from "../../../src/pages/PostDetail";
import Profile from "../../../src/pages/Profile";
import UserDetail from "../../../src/pages/UserDetail";
import Users from "../../../src/pages/Users";

vi.mock(import("../../../src/services/posts"), () => ({
  createPost: vi.fn(),
  deletePost: vi.fn(),
  getCurrentUserPosts: vi.fn(),
  getLatestPosts: vi.fn(),
  getPostWithComments: vi.fn(),
}));
vi.mock(import("../../../src/services/likes"), () => ({
  likePost: vi.fn(),
  unlikePost: vi.fn(),
}));
vi.mock(import("../../../src/services/users"), () => ({
  updateUser: vi.fn(),
  getUsers: vi.fn(),
  getUserProfile: vi.fn(),
}));
vi.mock(import("../../../src/services/follows"), () => ({
  followUser: vi.fn(),
  unfollowUser: vi.fn(),
}));
vi.mock(import("../../../src/services/auth"), () => ({
  getMe: vi.fn(),
}));
vi.mock(import("../../../src/services/comments"), () => ({
  createComment: vi.fn(),
}));

const createPostMock = vi.mocked(createPost);
const deletePostMock = vi.mocked(deletePost);
const getCurrentUserPostsMock = vi.mocked(getCurrentUserPosts);
const getLatestPostsMock = vi.mocked(getLatestPosts);
const getPostWithCommentsMock = vi.mocked(getPostWithComments);
const likePostMock = vi.mocked(likePost);
const unlikePostMock = vi.mocked(unlikePost);
const updateUserMock = vi.mocked(updateUser);
const followUserMock = vi.mocked(followUser);
const unfollowUserMock = vi.mocked(unfollowUser);
const createCommentMock = vi.mocked(createComment);

type PageAction = (args: ActionFunctionArgs) => Promise<unknown>;
type PageLoader = (args: LoaderFunctionArgs) => Promise<unknown>;

function formData(fields: Record<string, string>) {
  const data = new FormData();

  for (const [key, value] of Object.entries(fields)) {
    data.set(key, value);
  }

  return data;
}

function formEntries(data: FormData) {
  return Object.fromEntries(data.entries());
}

function firstCallArg<T>(mock: { mock: { calls: T[][] } }): T {
  const arg = mock.mock.calls[0]?.[0];

  if (arg === undefined) {
    throw new Error("Expected the mock to have been called");
  }

  return arg;
}

async function runAction(
  action: PageAction | undefined,
  data: FormData,
  url = "http://localhost/",
) {
  if (!action) {
    throw new Error("Page has no action");
  }

  return await action({
    request: new Request(url, { method: "POST", body: data }),
    params: {},
  } as ActionFunctionArgs);
}

async function runLoader(
  loader: PageLoader | undefined,
  url: string,
  params: Record<string, string> = {},
) {
  if (!loader) {
    throw new Error("Page has no loader");
  }

  return await loader({
    request: new Request(url),
    params,
  } as LoaderFunctionArgs);
}

async function catchResponse(promise: Promise<unknown>) {
  const error = await promise.catch((caught: unknown) => caught);

  expect(error).toBeInstanceOf(Response);
  return error as Response;
}

beforeEach(() => {
  vi.resetAllMocks();
});

describe("Home action", () => {
  it("creates a post through form validation", async () => {
    const result = { ok: true as const, data: { id: 1 } };
    createPostMock.mockResolvedValue(result as never);
    const data = formData({
      [FORM_FIELDS.intent]: FORM_INTENTS.createPost,
      [FORM_FIELDS.content]: "Hello",
    });

    await expect(runAction(Home.action, data)).resolves.toBe(result);

    const call = createPostMock.mock.calls[0] as unknown as [
      FormData,
      { content: string },
    ];

    expect(formEntries(call[0])).toEqual(formEntries(data));
    expect(call[1]).toEqual({ content: "Hello" });
  });

  it("returns field errors and skips the service for invalid content", async () => {
    const data = formData({
      [FORM_FIELDS.intent]: FORM_INTENTS.createPost,
      [FORM_FIELDS.content]: "",
    });

    const result = await runAction(Home.action, data);

    expect(result).toMatchObject({
      ok: false,
      kind: "validation",
      fieldErrors: { content: ["Content cannot be empty"] },
    });
    expect(createPostMock).not.toHaveBeenCalled();
  });

  it("dispatches like and unlike intents", async () => {
    likePostMock.mockResolvedValue({ ok: true, data: {} } as never);
    unlikePostMock.mockResolvedValue({ ok: true, data: {} } as never);

    const likeData = formData({
      [FORM_FIELDS.intent]: FORM_INTENTS.likePost,
      [FORM_FIELDS.postId]: "4",
    });
    const unlikeData = formData({
      [FORM_FIELDS.intent]: FORM_INTENTS.unlikePost,
      [FORM_FIELDS.postId]: "4",
    });

    await runAction(Home.action, likeData);
    await runAction(Home.action, unlikeData);

    expect(formEntries(firstCallArg(likePostMock))).toEqual(
      formEntries(likeData),
    );
    expect(formEntries(firstCallArg(unlikePostMock))).toEqual(
      formEntries(unlikeData),
    );
  });

  it("rejects unknown intents with a 400", async () => {
    const response = await catchResponse(
      runAction(Home.action, formData({ [FORM_FIELDS.intent]: "nope" })),
    );

    expect(response.status).toBe(400);
  });
});

describe("Profile action", () => {
  it("updates the profile through form validation", async () => {
    const result = { ok: true as const, data: { id: 1 } };
    updateUserMock.mockResolvedValue(result as never);
    const data = formData({
      [FORM_FIELDS.intent]: FORM_INTENTS.updateUser,
      [FORM_FIELDS.username]: "alice",
      [FORM_FIELDS.noteToAll]: "hello",
    });

    await expect(runAction(Profile.action, data)).resolves.toBe(result);

    const call = updateUserMock.mock.calls[0] as unknown as [
      FormData,
      { username: string; noteToAll: string },
    ];

    expect(formEntries(call[0])).toEqual(formEntries(data));
    expect(call[1]).toEqual({ username: "alice", noteToAll: "hello" });
  });

  it("returns username validation errors", async () => {
    const data = formData({
      [FORM_FIELDS.intent]: FORM_INTENTS.updateUser,
      [FORM_FIELDS.username]: "a".repeat(31),
      [FORM_FIELDS.noteToAll]: "",
    });

    const result = await runAction(Profile.action, data);

    expect(result).toMatchObject({
      ok: false,
      kind: "validation",
      fieldErrors: {
        username: ["Username cannot exceed 30 chars"],
      },
    });
    expect(updateUserMock).not.toHaveBeenCalled();
  });

  it("deletes a post", async () => {
    const result = { ok: true as const, data: { id: 4 } };
    deletePostMock.mockResolvedValue(result as never);
    const data = formData({
      [FORM_FIELDS.intent]: FORM_INTENTS.deletePost,
      [FORM_FIELDS.postId]: "4",
    });

    await expect(runAction(Profile.action, data)).resolves.toBe(result);
    expect(formEntries(firstCallArg(deletePostMock))).toEqual(
      formEntries(data),
    );
  });
});

describe("PostDetail action", () => {
  it("creates a comment with the validated post ID", async () => {
    const result = { ok: true as const, data: { id: 1 } };
    createCommentMock.mockResolvedValue(result as never);
    const data = formData({
      [FORM_FIELDS.intent]: FORM_INTENTS.createComment,
      [FORM_FIELDS.postId]: "7",
      [FORM_FIELDS.content]: "Nice",
    });

    await expect(
      runAction(PostDetail.action, data, "http://localhost/posts/7"),
    ).resolves.toBe(result);
    expect(createCommentMock).toHaveBeenCalledWith("Nice", 7);
  });

  it("returns validation errors for empty comments", async () => {
    const data = formData({
      [FORM_FIELDS.intent]: FORM_INTENTS.createComment,
      [FORM_FIELDS.postId]: "7",
      [FORM_FIELDS.content]: "",
    });

    const result = await runAction(PostDetail.action, data);

    expect(result).toMatchObject({
      ok: false,
      kind: "validation",
      fieldErrors: { content: ["Comment content cannot be empty"] },
    });
    expect(createCommentMock).not.toHaveBeenCalled();
  });
});

describe("Users action", () => {
  it("dispatches follow and unfollow intents", async () => {
    const result = { ok: true as const, data: { isFollowing: true } };
    followUserMock.mockResolvedValue(result as never);
    unfollowUserMock.mockResolvedValue(result as never);

    const followData = formData({
      [FORM_FIELDS.intent]: FORM_INTENTS.followUser,
      [FORM_FIELDS.targetUserId]: "2",
    });
    const unfollowData = formData({
      [FORM_FIELDS.intent]: FORM_INTENTS.unfollowUser,
      [FORM_FIELDS.targetUserId]: "2",
    });

    await expect(runAction(Users.action, followData)).resolves.toBe(result);
    await expect(runAction(Users.action, unfollowData)).resolves.toBe(result);

    expect(formEntries(firstCallArg(followUserMock))).toEqual(
      formEntries(followData),
    );
    expect(formEntries(firstCallArg(unfollowUserMock))).toEqual(
      formEntries(unfollowData),
    );
  });

  it("passes follow failures through unchanged", async () => {
    const failure = {
      ok: false as const,
      kind: "server" as const,
      message: "Failed to follow user",
    };
    followUserMock.mockResolvedValue(failure as never);

    const result = await runAction(
      Users.action,
      formData({
        [FORM_FIELDS.intent]: FORM_INTENTS.followUser,
        [FORM_FIELDS.targetUserId]: "2",
      }),
    );

    expect(result).toBe(failure);
  });
});

describe("UserDetail action", () => {
  it("dispatches follow and unfollow intents", async () => {
    const result = { ok: true as const, data: { isFollowing: true } };
    followUserMock.mockResolvedValue(result as never);
    unfollowUserMock.mockResolvedValue(result as never);

    const followData = formData({
      [FORM_FIELDS.intent]: FORM_INTENTS.followUser,
      [FORM_FIELDS.targetUserId]: "2",
    });

    await expect(
      runAction(UserDetail.action, followData, "http://localhost/users/2"),
    ).resolves.toBe(result);
    expect(formEntries(firstCallArg(followUserMock))).toEqual(
      formEntries(followData),
    );

    await expect(
      runAction(
        UserDetail.action,
        formData({
          [FORM_FIELDS.intent]: FORM_INTENTS.unfollowUser,
          [FORM_FIELDS.targetUserId]: "2",
        }),
        "http://localhost/users/2",
      ),
    ).resolves.toBe(result);
  });
});

describe("page loaders", () => {
  it("Home loads the latest posts", async () => {
    getLatestPostsMock.mockResolvedValue({ data: [], nextCursor: null });

    await expect(runLoader(Home.loader, "http://localhost/")).resolves.toEqual({
      data: [],
      nextCursor: null,
    });
    expect(getLatestPostsMock).toHaveBeenCalledWith();
  });

  it("Profile loads the current user's posts", async () => {
    getCurrentUserPostsMock.mockResolvedValue({
      data: [],
      nextCursor: null,
    });

    await runLoader(Profile.loader, "http://localhost/profile");
    expect(getCurrentUserPostsMock).toHaveBeenCalledWith();
  });

  it("PostDetail forwards the post ID and offset", async () => {
    getPostWithCommentsMock.mockResolvedValue({
      data: {},
      nextCursor: null,
    } as never);

    await runLoader(PostDetail.loader, "http://localhost/posts/5?offset=20", {
      postId: "5",
    });

    expect(getPostWithCommentsMock).toHaveBeenCalledWith("5", 20);
  });
});
