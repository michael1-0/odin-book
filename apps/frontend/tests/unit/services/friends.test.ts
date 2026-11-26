import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiFetch, apiMutation } from "../../../src/services/http";
import { FORM_FIELDS } from "../../../src/constants/fields";
import { API_PATHS } from "../../../src/constants/api";
import { serverFailure } from "../../../src/utils/actionResult";
import {
  acceptFriendRequest,
  cancelFriendRequest,
  declineFriendRequest,
  exploreFriends,
  getFriends,
  getMessages,
  sendFriendRequest,
  sendMessage,
} from "../../../src/services/friends";

vi.mock(import("../../../src/services/http"), () => ({
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

  it.each([
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
  ])("$name propagates the server failure", async ({ run }) => {
    const failure = serverFailure("mutation failed");
    mutationMock.mockResolvedValue(failure as never);

    await expect(run()).resolves.toBe(failure);
  });
});
