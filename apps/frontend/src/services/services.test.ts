import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiFetch, apiMutation } from "./http";
import { FORM_FIELDS } from "../constants/fields";
import { API_PATHS } from "../constants/api";
import { serverFailure } from "../utils/actionResult";
import { getMe, logout } from "./auth";
import { createComment } from "./comments";
import { followUser, unfollowUser } from "./follows";
import {
  acceptFriendRequest,
  cancelFriendRequest,
  declineFriendRequest,
  exploreFriends,
  getFriends,
  getMessages,
  sendFriendRequest,
  sendMessage,
} from "./friends";
import { likePost, unlikePost } from "./likes";
import {
  createPost,
  deletePost,
  getCurrentUserPosts,
  getFollowingPostsFromLastMonth,
  getLatestPosts,
  getPostWithComments,
} from "./posts";
import { getUserProfile, getUsers, updateUser } from "./users";

vi.mock("./http", () => ({
  apiFetch: vi.fn(),
  apiMutation: vi.fn(),
}));

const fetchMock = vi.mocked(apiFetch);
const mutationMock = vi.mocked(apiMutation);

function formDataWith(field: string, value: string) {
  const formData = new FormData();
  formData.set(field, value);
  return formData;
}

beforeEach(() => {
  vi.resetAllMocks();
});

describe("auth service", () => {
  it("loads the current user", async () => {
    fetchMock.mockResolvedValue({ id: 1 } as never);

    await expect(getMe()).resolves.toEqual({ id: 1 });
    expect(fetchMock).toHaveBeenCalledWith(API_PATHS.authMe, {
      failureMessage: "Failed to load current user",
    });
  });

  it("logs out with a POST", async () => {
    fetchMock.mockResolvedValue(undefined as never);

    await logout();

    expect(fetchMock).toHaveBeenCalledWith(API_PATHS.authLogout, {
      method: "POST",
      failureMessage: "Failed to log out",
    });
  });
});

describe("posts service", () => {
  it("creates a post from FormData", async () => {
    const result = { ok: true as const, data: { id: 1 } };
    mutationMock.mockResolvedValue(result as never);
    const formData = formDataWith(FORM_FIELDS.content, "hello");

    await expect(createPost(formData)).resolves.toBe(result);
    expect(mutationMock).toHaveBeenCalledWith(API_PATHS.posts, {
      method: "POST",
      body: { formData },
      failureMessage: "Failed to create post",
    });
  });

  it("rejects a delete without a post ID", async () => {
    await expect(deletePost(new FormData())).resolves.toEqual(
      serverFailure("Missing post ID"),
    );
    expect(mutationMock).not.toHaveBeenCalled();
  });

  it("deletes by post ID", async () => {
    const result = { ok: true as const, data: { id: 12 } };
    mutationMock.mockResolvedValue(result as never);

    await expect(
      deletePost(formDataWith(FORM_FIELDS.postId, "12")),
    ).resolves.toBe(result);

    expect(mutationMock).toHaveBeenCalledWith(API_PATHS.post(12), {
      method: "DELETE",
      failureMessage: "Failed to delete post",
    });
  });

  it("rejects a post detail load without a post ID", async () => {
    await expect(getPostWithComments(undefined)).rejects.toBeInstanceOf(
      Response,
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("loads post detail with the comments page", async () => {
    fetchMock.mockResolvedValue({ data: {} } as never);

    await getPostWithComments("5", 10);

    expect(fetchMock).toHaveBeenCalledWith(API_PATHS.post(5), {
      query: { include: "comments", offset: 10 },
      failureMessage: "Failed to load post",
    });
  });

  it("threads cursors and scopes through the feed wrappers", async () => {
    fetchMock.mockResolvedValue({ data: [], nextCursor: null } as never);

    await getLatestPosts(3);
    expect(fetchMock).toHaveBeenLastCalledWith(API_PATHS.posts, {
      query: { cursor: 3, scope: undefined, period: undefined },
      failureMessage: "Failed to load posts",
    });

    await getCurrentUserPosts();
    expect(fetchMock).toHaveBeenLastCalledWith(API_PATHS.posts, {
      query: { cursor: undefined, scope: "me", period: undefined },
      failureMessage: "Failed to load posts",
    });

    await getFollowingPostsFromLastMonth(8);
    expect(fetchMock).toHaveBeenLastCalledWith(API_PATHS.posts, {
      query: { cursor: 8, scope: "following", period: "month" },
      failureMessage: "Failed to load posts",
    });
  });
});

describe("likes service", () => {
  const missingIdCases = [
    { name: "like", service: likePost },
    { name: "unlike", service: unlikePost },
  ];

  for (const { name, service } of missingIdCases) {
    it(`${name} requires a post ID`, async () => {
      await expect(service(new FormData())).resolves.toEqual(
        serverFailure("Missing post ID"),
      );
      expect(mutationMock).not.toHaveBeenCalled();
    });
  }

  it("likes and unlikes by post ID", async () => {
    const result = { ok: true as const, data: {} };
    mutationMock.mockResolvedValue(result as never);

    await expect(likePost(formDataWith(FORM_FIELDS.postId, "4"))).resolves.toBe(
      result,
    );
    expect(mutationMock).toHaveBeenLastCalledWith(API_PATHS.likes(4), {
      method: "POST",
      failureMessage: "Failed to like post",
    });

    await expect(
      unlikePost(formDataWith(FORM_FIELDS.postId, "4")),
    ).resolves.toBe(result);
    expect(mutationMock).toHaveBeenLastCalledWith(API_PATHS.likes(4), {
      method: "DELETE",
      failureMessage: "Failed to unlike post",
    });
  });
});

describe("comments service", () => {
  it("posts a JSON comment", async () => {
    const result = { ok: true as const, data: {} };
    mutationMock.mockResolvedValue(result as never);

    await expect(createComment("nice", 7)).resolves.toBe(result);

    expect(mutationMock).toHaveBeenCalledWith(API_PATHS.comments, {
      method: "POST",
      body: { json: { content: "nice", postId: 7 } },
      failureMessage: "Failed to create comment",
    });
  });
});

describe("follows service", () => {
  it("returns the resulting follow state", async () => {
    mutationMock.mockResolvedValue({ ok: true, data: {} } as never);
    const formData = formDataWith(FORM_FIELDS.targetUserId, "9");

    await expect(followUser(formData)).resolves.toEqual({
      ok: true,
      data: { isFollowing: true },
    });
    await expect(unfollowUser(formData)).resolves.toEqual({
      ok: true,
      data: { isFollowing: false },
    });

    expect(mutationMock).toHaveBeenNthCalledWith(1, API_PATHS.follows(9), {
      method: "POST",
      failureMessage: "Failed to follow user",
    });
    expect(mutationMock).toHaveBeenNthCalledWith(2, API_PATHS.follows(9), {
      method: "DELETE",
      failureMessage: "Failed to unfollow user",
    });
  });

  it("rejects a follow without a target user ID", async () => {
    await expect(followUser(new FormData())).resolves.toEqual(
      serverFailure("Missing target user ID"),
    );
    await expect(unfollowUser(new FormData())).resolves.toEqual(
      serverFailure("Missing target user ID"),
    );
    expect(mutationMock).not.toHaveBeenCalled();
  });

  it("propagates server failures instead of reporting success", async () => {
    const failure = serverFailure("Failed to follow user");
    mutationMock.mockResolvedValue(failure as never);

    await expect(
      followUser(formDataWith(FORM_FIELDS.targetUserId, "9")),
    ).resolves.toBe(failure);
    await expect(
      unfollowUser(formDataWith(FORM_FIELDS.targetUserId, "9")),
    ).resolves.toBe(failure);
  });
});

describe("friends service", () => {
  it("unwraps the friends payload", async () => {
    const data = {
      friends: [],
      incomingRequests: [],
      outgoingRequests: [],
    };
    fetchMock.mockResolvedValue({ data } as never);

    await expect(getFriends()).resolves.toBe(data);
    expect(fetchMock).toHaveBeenCalledWith(API_PATHS.friends, {
      failureMessage: "Failed to load friends",
    });
  });

  it("searches users with an optional query and offset", async () => {
    fetchMock.mockResolvedValue({ data: [], nextCursor: null } as never);

    await exploreFriends(null);
    expect(fetchMock).toHaveBeenLastCalledWith(API_PATHS.friendExplore, {
      query: { query: undefined, offset: undefined },
      failureMessage: "Failed to search users",
    });

    await exploreFriends("bob", 12);
    expect(fetchMock).toHaveBeenLastCalledWith(API_PATHS.friendExplore, {
      query: { query: "bob", offset: 12 },
      failureMessage: "Failed to search users",
    });
  });

  it("requires the right hidden ID for each request mutation", async () => {
    await expect(sendFriendRequest(new FormData())).resolves.toEqual(
      serverFailure("Missing target user ID"),
    );
    await expect(cancelFriendRequest(new FormData())).resolves.toEqual(
      serverFailure("Missing target user ID"),
    );
    await expect(acceptFriendRequest(new FormData())).resolves.toEqual(
      serverFailure("Missing request ID"),
    );
    await expect(declineFriendRequest(new FormData())).resolves.toEqual(
      serverFailure("Missing request ID"),
    );
    expect(mutationMock).not.toHaveBeenCalled();
  });

  it("calls the request endpoints with the expected verbs", async () => {
    const result = { ok: true as const, data: {} };
    mutationMock.mockResolvedValue(result as never);

    await expect(
      sendFriendRequest(formDataWith(FORM_FIELDS.targetUserId, "3")),
    ).resolves.toBe(result);
    expect(mutationMock).toHaveBeenLastCalledWith(API_PATHS.friendRequest(3), {
      method: "POST",
      failureMessage: "Failed to send friend request",
    });

    await expect(
      cancelFriendRequest(formDataWith(FORM_FIELDS.targetUserId, "3")),
    ).resolves.toBe(result);
    expect(mutationMock).toHaveBeenLastCalledWith(API_PATHS.friendRequest(3), {
      method: "DELETE",
      failureMessage: "Failed to cancel friend request",
    });

    await expect(
      acceptFriendRequest(formDataWith(FORM_FIELDS.requestId, "8")),
    ).resolves.toBe(result);
    expect(mutationMock).toHaveBeenLastCalledWith(
      API_PATHS.friendRequestAccept(8),
      {
        method: "POST",
        failureMessage: "Failed to accept friend request",
      },
    );

    await expect(
      declineFriendRequest(formDataWith(FORM_FIELDS.requestId, "8")),
    ).resolves.toBe(result);
    expect(mutationMock).toHaveBeenLastCalledWith(
      API_PATHS.friendRequestDecline(8),
      {
        method: "POST",
        failureMessage: "Failed to decline friend request",
      },
    );
  });

  it("loads messages with an optional beforeId and sends JSON messages", async () => {
    fetchMock.mockResolvedValue({ data: [], nextCursor: null } as never);
    const result = { ok: true as const, data: {} };
    mutationMock.mockResolvedValue(result as never);

    await getMessages(2, 40);
    expect(fetchMock).toHaveBeenLastCalledWith(API_PATHS.messages(2), {
      query: { beforeId: 40 },
      failureMessage: "Failed to load messages",
    });

    await expect(sendMessage(2, "hello")).resolves.toBe(result);
    expect(mutationMock).toHaveBeenLastCalledWith(API_PATHS.messages(2), {
      method: "POST",
      body: { json: { content: "hello" } },
      failureMessage: "Failed to send message",
    });
  });
});

describe("users service", () => {
  it("loads users with an optional offset", async () => {
    fetchMock.mockResolvedValue({ data: [], nextCursor: null } as never);

    await getUsers(24);
    expect(fetchMock).toHaveBeenCalledWith(API_PATHS.users, {
      query: { offset: 24 },
      failureMessage: "Failed to load users",
    });
  });

  it("requires a user ID to update the profile", async () => {
    await expect(updateUser(new FormData())).resolves.toEqual(
      serverFailure("Missing user ID"),
    );
    expect(mutationMock).not.toHaveBeenCalled();
  });

  it("updates the profile with FormData", async () => {
    const result = { ok: true as const, data: {} };
    mutationMock.mockResolvedValue(result as never);
    const formData = formDataWith(FORM_FIELDS.userId, "5");

    await expect(updateUser(formData)).resolves.toBe(result);

    expect(mutationMock).toHaveBeenCalledWith(API_PATHS.user(5), {
      method: "PUT",
      body: { formData },
      failureMessage: "Failed to update profile",
    });
  });

  it("loads a profile with its posts and unwraps the envelope", async () => {
    const profile = { id: 5, username: "bob" };
    fetchMock.mockResolvedValue({ data: profile } as never);

    await expect(getUserProfile("5")).resolves.toBe(profile);
    expect(fetchMock).toHaveBeenCalledWith(API_PATHS.user(5), {
      query: { include: "posts" },
      failureMessage: "Failed to load profile",
    });
  });

  it("rejects a profile load without a user ID", async () => {
    await expect(getUserProfile(undefined)).rejects.toBeInstanceOf(Response);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("mutation result propagation", () => {
  const failure = serverFailure("mutation failed");

  const cases: Array<{ name: string; run: () => Promise<unknown> }> = [
    {
      name: "createPost",
      run: () => createPost(formDataWith(FORM_FIELDS.content, "hi")),
    },
    {
      name: "deletePost",
      run: () => deletePost(formDataWith(FORM_FIELDS.postId, "12")),
    },
    {
      name: "likePost",
      run: () => likePost(formDataWith(FORM_FIELDS.postId, "12")),
    },
    {
      name: "unlikePost",
      run: () => unlikePost(formDataWith(FORM_FIELDS.postId, "12")),
    },
    { name: "createComment", run: () => createComment("hi", 12) },
    {
      name: "followUser",
      run: () => followUser(formDataWith(FORM_FIELDS.targetUserId, "3")),
    },
    {
      name: "unfollowUser",
      run: () => unfollowUser(formDataWith(FORM_FIELDS.targetUserId, "3")),
    },
    {
      name: "sendFriendRequest",
      run: () => sendFriendRequest(formDataWith(FORM_FIELDS.targetUserId, "3")),
    },
    {
      name: "cancelFriendRequest",
      run: () =>
        cancelFriendRequest(formDataWith(FORM_FIELDS.targetUserId, "3")),
    },
    {
      name: "acceptFriendRequest",
      run: () => acceptFriendRequest(formDataWith(FORM_FIELDS.requestId, "8")),
    },
    {
      name: "declineFriendRequest",
      run: () => declineFriendRequest(formDataWith(FORM_FIELDS.requestId, "8")),
    },
    { name: "sendMessage", run: () => sendMessage(2, "hi") },
    {
      name: "updateUser",
      run: () => updateUser(formDataWith(FORM_FIELDS.userId, "5")),
    },
  ];

  it.each(cases)("$name propagates the server failure", async ({ run }) => {
    mutationMock.mockResolvedValue(failure as never);

    await expect(run()).resolves.toBe(failure);
  });
});
