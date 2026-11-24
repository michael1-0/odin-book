import { MESSAGES_PAGE_SIZE, SOCKET_EVENTS } from "@repo/constants";
import {
  MessageSchema,
  MessagesGetResponseSchema,
} from "@repo/zod-validations";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { User } from "../../src/db/generated/prisma/client.ts";
import { prisma } from "../../src/db/prisma.ts";
import { emitToUser } from "../../src/socket/io.ts";
import { api } from "../helpers/api.ts";
import { authCookie } from "../helpers/auth.ts";
import { expectContract } from "../helpers/contracts.ts";
import { resetDatabase } from "../helpers/db.ts";
import {
  createAcceptedFriendship,
  createMessage,
  createUser,
} from "../helpers/factories.ts";

vi.mock("../../src/socket/io.ts", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("../../src/socket/io.ts")>();

  return { ...actual, emitToUser: vi.fn() };
});

const emitToUserMock = vi.mocked(emitToUser);

let alice: User;
let bob: User;
let carol: User;

beforeEach(async () => {
  await resetDatabase();
  vi.resetAllMocks();
  alice = await createUser({ username: "alice" });
  bob = await createUser({ username: "bob" });
  carol = await createUser({ username: "carol" });
  await createAcceptedFriendship(alice.id, bob.id);
});

function asAlice() {
  return authCookie(alice);
}

describe("GET /api/messages/:friendId", () => {
  it("returns an empty page for friends without messages", async () => {
    const response = await api()
      .get(`/api/messages/${bob.id}`)
      .set("Cookie", asAlice());

    expect(response.status).toBe(200);
    expectContract(MessagesGetResponseSchema, response.body);
    expect(response.body).toEqual({ data: [], nextCursor: null });
  });

  it("returns messages oldest-first", async () => {
    await createMessage(alice.id, bob.id, "one");
    await createMessage(bob.id, alice.id, "two");
    await createMessage(alice.id, bob.id, "three");
    await createMessage(carol.id, bob.id, "not ours");

    const response = await api()
      .get(`/api/messages/${bob.id}`)
      .set("Cookie", asAlice());

    expect(
      response.body.data.map((message: { content: string }) => message.content),
    ).toEqual(["one", "two", "three"]);
    expect(response.body.nextCursor).toBeNull();
  });

  it("ends the message page exactly at one full page", async () => {
    await prisma.message.createMany({
      data: Array.from({ length: MESSAGES_PAGE_SIZE }, (_, index) => ({
        senderId: alice.id,
        recipientId: bob.id,
        content: `message-${index + 1}`,
      })),
    });

    const response = await api()
      .get(`/api/messages/${bob.id}`)
      .set("Cookie", asAlice());

    expect(response.body.data).toHaveLength(MESSAGES_PAGE_SIZE);
    expect(response.body.nextCursor).toBeNull();
  });

  it("pages older messages by beforeId cursor", async () => {
    await prisma.message.createMany({
      data: Array.from({ length: MESSAGES_PAGE_SIZE + 5 }, (_, index) => ({
        senderId: alice.id,
        recipientId: bob.id,
        content: `message-${index + 1}`,
      })),
    });

    const firstPage = await api()
      .get(`/api/messages/${bob.id}`)
      .set("Cookie", asAlice());

    expect(firstPage.body.data).toHaveLength(MESSAGES_PAGE_SIZE);
    expectContract(MessagesGetResponseSchema, firstPage.body);
    expect(firstPage.body.data[0].content).toBe("message-6");
    expect(firstPage.body.data[MESSAGES_PAGE_SIZE - 1].content).toBe(
      "message-55",
    );
    expect(firstPage.body.nextCursor).toBe(firstPage.body.data[0].id);

    const secondPage = await api()
      .get(`/api/messages/${bob.id}`)
      .query({ beforeId: firstPage.body.nextCursor })
      .set("Cookie", asAlice());

    expect(secondPage.body.data).toHaveLength(5);
    expect(secondPage.body.data[0].content).toBe("message-1");
    expect(secondPage.body.data[4].content).toBe("message-5");
    expect(secondPage.body.nextCursor).toBeNull();
  });

  it("works when the friendship was accepted in the other direction", async () => {
    await prisma.friendRequest.deleteMany();
    await createAcceptedFriendship(bob.id, alice.id);
    await createMessage(bob.id, alice.id, "hi");

    const response = await api()
      .get(`/api/messages/${bob.id}`)
      .set("Cookie", asAlice());

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(1);
  });

  it("forbids messaging non-friends", async () => {
    const response = await api()
      .get(`/api/messages/${carol.id}`)
      .set("Cookie", asAlice());

    expect(response.status).toBe(403);
    expect(response.body.error.message).toBe("You can only chat with friends");
  });

  it("rejects a malformed friend id", async () => {
    const response = await api()
      .get("/api/messages/not-a-number")
      .set("Cookie", asAlice());

    expect(response.status).toBe(400);
  });

  it("rejects a malformed beforeId", async () => {
    const response = await api()
      .get(`/api/messages/${bob.id}`)
      .query({ beforeId: "abc" })
      .set("Cookie", asAlice());

    expect(response.status).toBe(400);
  });

  it("requires authentication", async () => {
    const response = await api().get(`/api/messages/${bob.id}`);

    expect(response.status).toBe(401);
  });
});

describe("POST /api/messages/:friendId", () => {
  it("saves a message and emits it to both users", async () => {
    const response = await api()
      .post(`/api/messages/${bob.id}`)
      .set("Cookie", asAlice())
      .send({ content: "Hello Bob" });

    expect(response.status).toBe(201);
    expectContract(MessageSchema, response.body.data);
    expect(response.body.data).toMatchObject({
      senderId: alice.id,
      recipientId: bob.id,
      content: "Hello Bob",
    });

    expect(emitToUserMock).toHaveBeenCalledTimes(2);
    expect(emitToUserMock).toHaveBeenNthCalledWith(
      1,
      alice.id,
      SOCKET_EVENTS.messageNew,
      {
        message: expect.objectContaining({
          id: response.body.data.id,
          content: "Hello Bob",
        }),
      },
    );
    expect(emitToUserMock).toHaveBeenNthCalledWith(
      2,
      bob.id,
      SOCKET_EVENTS.messageNew,
      {
        message: expect.objectContaining({ id: response.body.data.id }),
      },
    );
  });

  it("forbids messaging non-friends", async () => {
    const response = await api()
      .post(`/api/messages/${carol.id}`)
      .set("Cookie", asAlice())
      .send({ content: "Nope" });

    expect(response.status).toBe(403);
    expect(emitToUserMock).not.toHaveBeenCalled();
  });

  it("rejects empty content", async () => {
    const response = await api()
      .post(`/api/messages/${bob.id}`)
      .set("Cookie", asAlice())
      .send({ content: "" });

    expect(response.status).toBe(400);
    expect(response.body.error.message).toContain("Message cannot be empty");
  });

  it("rejects whitespace-only content", async () => {
    const response = await api()
      .post(`/api/messages/${bob.id}`)
      .set("Cookie", asAlice())
      .send({ content: "   " });

    expect(response.status).toBe(400);
    expect(response.body.error.message).toContain("Message cannot be empty");
  });

  it("rejects content over 1000 characters", async () => {
    const response = await api()
      .post(`/api/messages/${bob.id}`)
      .set("Cookie", asAlice())
      .send({ content: "a".repeat(1001) });

    expect(response.status).toBe(400);
    expect(response.body.error.message).toContain(
      "Message cannot exceed 1000 chars",
    );
  });

  it("requires authentication", async () => {
    const response = await api()
      .post(`/api/messages/${bob.id}`)
      .send({ content: "Anon" });

    expect(response.status).toBe(401);
  });
});
