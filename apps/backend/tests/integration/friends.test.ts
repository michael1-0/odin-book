import {
  FRIEND_REQUEST_STATUS,
  FRIENDS_PAGE_SIZE,
  SOCKET_EVENTS,
} from "@repo/constants";
import {
  FriendExploreResponseSchema,
  FriendsGetResponseSchema,
} from "@repo/zod-validations";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { User } from "../../src/db/generated/prisma/client.ts";
import { emitToUser } from "../../src/socket/io.ts";
import type * as socketIoModule from "../../src/socket/io.ts";
import { api } from "../helpers/api.ts";
import { authCookie } from "../helpers/auth.ts";
import { expectContract } from "../helpers/contracts.ts";
import { resetDatabase } from "../helpers/db.ts";
import {
  createAcceptedFriendship,
  createFriendRequest,
  createMessage,
  createUser,
} from "../helpers/factories.ts";

vi.mock("../../src/socket/io.ts", async (importOriginal) => {
  const actual = await importOriginal<typeof socketIoModule>();

  return { ...actual, emitToUser: vi.fn() };
});

const emitToUserMock = vi.mocked(emitToUser);

let alice: User;
let bob: User;

beforeEach(async () => {
  await resetDatabase();
  vi.resetAllMocks();
  alice = await createUser({ username: "alice" });
  bob = await createUser({ username: "bob" });
});

function asAlice() {
  return authCookie(alice);
}

describe("GET /api/friends", () => {
  it("returns empty buckets for a new user", async () => {
    const response = await api().get("/api/friends").set("Cookie", asAlice());

    expect(response.status).toBe(200);
    expectContract(FriendsGetResponseSchema, response.body);
    expect(response.body).toEqual({
      data: { friends: [], incomingRequests: [], outgoingRequests: [] },
    });
  });

  it("returns friends with their last message", async () => {
    const friendship = await createAcceptedFriendship(alice.id, bob.id);
    await createMessage(bob.id, alice.id, "hello");

    const response = await api().get("/api/friends").set("Cookie", asAlice());

    expect(response.status).toBe(200);
    expectContract(FriendsGetResponseSchema, response.body);
    expect(response.body.data.friends).toHaveLength(1);
    expect(response.body.data.friends[0]).toMatchObject({
      id: bob.id,
      username: "bob",
      friendshipId: friendship.id,
      lastMessage: { content: "hello", senderId: bob.id },
    });
    expect(response.body.data.incomingRequests).toEqual([]);
    expect(response.body.data.outgoingRequests).toEqual([]);
  });

  it("splits pending requests into incoming and outgoing", async () => {
    const incoming = await createFriendRequest(bob.id, alice.id);
    const outgoing = await createFriendRequest(alice.id, bob.id);

    const response = await api().get("/api/friends").set("Cookie", asAlice());

    expect(
      response.body.data.incomingRequests.map(
        (request: { id: number }) => request.id,
      ),
    ).toEqual([incoming.id]);
    expect(
      response.body.data.outgoingRequests.map(
        (request: { id: number }) => request.id,
      ),
    ).toEqual([outgoing.id]);
    expect(response.body.data.friends).toEqual([]);
  });

  it("requires authentication", async () => {
    const response = await api().get("/api/friends");

    expect(response.status).toBe(401);
  });
});

describe("GET /api/friends/explore", () => {
  it("excludes the caller and accepted friends", async () => {
    const carol = await createUser({ username: "carol" });
    await createAcceptedFriendship(alice.id, bob.id);

    const response = await api()
      .get("/api/friends/explore")
      .set("Cookie", asAlice());

    expect(response.body.data.map((row: { id: number }) => row.id)).toEqual([
      carol.id,
    ]);
  });

  it("attaches the pending request status and id", async () => {
    const carol = await createUser({ username: "carol" });
    const request = await createFriendRequest(alice.id, carol.id);

    const response = await api()
      .get("/api/friends/explore")
      .set("Cookie", asAlice());

    expectContract(FriendExploreResponseSchema, response.body);
    expect(
      response.body.data.find((row: { id: number }) => row.id === carol.id),
    ).toMatchObject({
      id: carol.id,
      requestStatus: FRIEND_REQUEST_STATUS.PENDING,
      requestId: request.id,
    });
  });

  it("finds requests in either direction", async () => {
    const carol = await createUser({ username: "carol" });
    const request = await createFriendRequest(carol.id, alice.id);

    const response = await api()
      .get("/api/friends/explore")
      .set("Cookie", asAlice());

    expect(
      response.body.data.find((row: { id: number }) => row.id === carol.id),
    ).toMatchObject({
      requestStatus: FRIEND_REQUEST_STATUS.PENDING,
      requestId: request.id,
    });
  });

  it("searches usernames case-insensitively", async () => {
    await createUser({ username: "Bobby" });
    await createUser({ username: "carol" });

    const response = await api()
      .get("/api/friends/explore")
      .query({ query: "bobby" })
      .set("Cookie", asAlice());

    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0].username).toBe("Bobby");
  });

  it("pages by offset", async () => {
    for (let index = 0; index < FRIENDS_PAGE_SIZE + 2; index += 1) {
      await createUser({ username: `user-${index}` });
    }

    const firstPage = await api()
      .get("/api/friends/explore")
      .set("Cookie", asAlice());

    expect(firstPage.body.data).toHaveLength(FRIENDS_PAGE_SIZE);
    expect(firstPage.body.nextCursor).toBe(FRIENDS_PAGE_SIZE);

    const secondPage = await api()
      .get("/api/friends/explore")
      .query({ offset: FRIENDS_PAGE_SIZE })
      .set("Cookie", asAlice());

    expect(secondPage.body.data).toHaveLength(3);
    expect(secondPage.body.nextCursor).toBeNull();
  });

  it("ends the explore page exactly at one full page", async () => {
    // The baseline bob is also discoverable, so fill the rest of the page.
    for (let index = 0; index < FRIENDS_PAGE_SIZE - 1; index += 1) {
      await createUser({ username: `user-${index}` });
    }

    const response = await api()
      .get("/api/friends/explore")
      .set("Cookie", asAlice());

    expect(response.body.data).toHaveLength(FRIENDS_PAGE_SIZE);
    expect(response.body.nextCursor).toBeNull();
  });

  it("rejects a negative offset", async () => {
    const response = await api()
      .get("/api/friends/explore")
      .query({ offset: -1 })
      .set("Cookie", asAlice());

    expect(response.status).toBe(400);
  });

  it("requires authentication", async () => {
    const response = await api().get("/api/friends/explore");

    expect(response.status).toBe(401);
  });
});

describe("POST /api/friends/requests/:targetUserId", () => {
  it("sends a friend request and notifies the receiver", async () => {
    const response = await api()
      .post(`/api/friends/requests/${bob.id}`)
      .set("Cookie", asAlice());

    expect(response.status).toBe(201);
    expect(response.body.data).toMatchObject({
      senderId: alice.id,
      receiverId: bob.id,
      status: FRIEND_REQUEST_STATUS.PENDING,
    });

    expect(emitToUserMock).toHaveBeenCalledWith(
      bob.id,
      SOCKET_EVENTS.friendRequestNew,
      {
        request: expect.objectContaining({
          senderId: alice.id,
          receiverId: bob.id,
          sender: expect.objectContaining({ id: alice.id }),
          receiver: expect.objectContaining({ id: bob.id }),
        }),
      },
    );
  });

  it("rejects sending a request to yourself", async () => {
    const response = await api()
      .post(`/api/friends/requests/${alice.id}`)
      .set("Cookie", asAlice());

    expect(response.status).toBe(400);
    expect(response.body.error.message).toBe("Can't add yourself as a friend");
  });

  it("rejects a duplicate pending request", async () => {
    await createFriendRequest(alice.id, bob.id);

    const response = await api()
      .post(`/api/friends/requests/${bob.id}`)
      .set("Cookie", asAlice());

    expect(response.status).toBe(400);
    expect(response.body.error.message).toBe("Request already sent");
  });

  it("rejects when the other user already sent a request", async () => {
    await createFriendRequest(bob.id, alice.id);

    const response = await api()
      .post(`/api/friends/requests/${bob.id}`)
      .set("Cookie", asAlice());

    expect(response.status).toBe(400);
    expect(response.body.error.message).toBe(
      "This user already sent you a request",
    );
  });

  it("rejects requests between existing friends", async () => {
    await createAcceptedFriendship(alice.id, bob.id);

    const response = await api()
      .post(`/api/friends/requests/${bob.id}`)
      .set("Cookie", asAlice());

    expect(response.status).toBe(400);
    expect(response.body.error.message).toBe("You are already friends");
  });

  it("allows re-requesting after a decline", async () => {
    await createFriendRequest(alice.id, bob.id, FRIEND_REQUEST_STATUS.DECLINED);

    const response = await api()
      .post(`/api/friends/requests/${bob.id}`)
      .set("Cookie", asAlice());

    expect(response.status).toBe(201);
    expect(response.body.data.status).toBe(FRIEND_REQUEST_STATUS.PENDING);
  });

  it("returns 404 for a missing target user", async () => {
    const response = await api()
      .post("/api/friends/requests/999999")
      .set("Cookie", asAlice());

    expect(response.status).toBe(404);
    expect(response.body.error.message).toBe("User not found");
  });

  it("rejects a malformed target id", async () => {
    const response = await api()
      .post("/api/friends/requests/not-a-number")
      .set("Cookie", asAlice());

    expect(response.status).toBe(400);
  });

  it("requires authentication", async () => {
    const response = await api().post(`/api/friends/requests/${bob.id}`);

    expect(response.status).toBe(401);
  });
});

describe("DELETE /api/friends/requests/:targetUserId", () => {
  it("cancels a pending request", async () => {
    const request = await createFriendRequest(alice.id, bob.id);

    const response = await api()
      .delete(`/api/friends/requests/${bob.id}`)
      .set("Cookie", asAlice());

    expect(response.status).toBe(200);
    expect(response.body.data.id).toBe(request.id);
  });

  it("returns 404 when there is no outgoing pending request", async () => {
    await createFriendRequest(bob.id, alice.id);

    const response = await api()
      .delete(`/api/friends/requests/${bob.id}`)
      .set("Cookie", asAlice());

    expect(response.status).toBe(404);
    expect(response.body.error.message).toBe("No pending request found");
  });

  it("requires authentication", async () => {
    const response = await api().delete(`/api/friends/requests/${bob.id}`);

    expect(response.status).toBe(401);
  });
});

describe("POST /api/friends/requests/:requestId/accept", () => {
  it("accepts a request and notifies the sender", async () => {
    const request = await createFriendRequest(alice.id, bob.id);

    const response = await api()
      .post(`/api/friends/requests/${request.id}/accept`)
      .set("Cookie", authCookie(bob));

    expect(response.status).toBe(200);
    expect(response.body.data).toMatchObject({
      id: request.id,
      status: FRIEND_REQUEST_STATUS.ACCEPTED,
      sender: { id: alice.id },
      receiver: { id: bob.id },
    });

    expect(emitToUserMock).toHaveBeenCalledWith(
      alice.id,
      SOCKET_EVENTS.friendRequestAccepted,
      {
        friend: expect.objectContaining({
          id: bob.id,
          friendshipId: request.id,
          lastMessage: null,
        }),
      },
    );
  });

  it("forbids the sender from accepting their own request", async () => {
    const request = await createFriendRequest(alice.id, bob.id);

    const response = await api()
      .post(`/api/friends/requests/${request.id}/accept`)
      .set("Cookie", asAlice());

    expect(response.status).toBe(403);
    expect(response.body.error.message).toBe("Forbidden");
  });

  it("returns 404 for a missing request", async () => {
    const response = await api()
      .post("/api/friends/requests/999999/accept")
      .set("Cookie", authCookie(bob));

    expect(response.status).toBe(404);
    expect(response.body.error.message).toBe("Request not found");
  });

  it("rejects an already handled request", async () => {
    const request = await createFriendRequest(
      alice.id,
      bob.id,
      FRIEND_REQUEST_STATUS.ACCEPTED,
    );

    const response = await api()
      .post(`/api/friends/requests/${request.id}/accept`)
      .set("Cookie", authCookie(bob));

    expect(response.status).toBe(400);
    expect(response.body.error.message).toBe("Request was already handled");
  });
});

describe("POST /api/friends/requests/:requestId/decline", () => {
  it("declines a request and notifies the sender", async () => {
    const request = await createFriendRequest(alice.id, bob.id);

    const response = await api()
      .post(`/api/friends/requests/${request.id}/decline`)
      .set("Cookie", authCookie(bob));

    expect(response.status).toBe(200);
    expect(response.body.data.status).toBe(FRIEND_REQUEST_STATUS.DECLINED);
    expect(emitToUserMock).toHaveBeenCalledWith(
      alice.id,
      SOCKET_EVENTS.friendRequestDeclined,
      { requestId: request.id },
    );
  });

  it("forbids the sender from declining their own request", async () => {
    const request = await createFriendRequest(alice.id, bob.id);

    const response = await api()
      .post(`/api/friends/requests/${request.id}/decline`)
      .set("Cookie", asAlice());

    expect(response.status).toBe(403);
  });
});
