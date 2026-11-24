import { describe, expect, it } from "vitest";
import {
  CommentCreateBodySchema,
  FriendExploreQuerySchema,
  FriendExploreResponseSchema,
  FriendsGetResponseSchema,
  MessageCreateBodySchema,
  MessagesGetResponseSchema,
  PostCreateBodySchema,
  PostGetQuerySchema,
  PostGetResponseSchema,
  PostsGetQuerySchema,
  PostsGetResponseSchema,
  UserUpdateBodySchema,
  UsersGetResponseSchema,
  coercedId,
} from "./index.js";

const createdAt = new Date("2026-01-01T00:00:00.000Z");
const author = { id: 1, username: "alice", profileUrl: null };

const feedItem = {
  id: 10,
  content: "Hello world",
  createdAt,
  user: author,
  _count: { comments: 0, likes: 0 },
  likes: [],
  images: [],
};

describe("input schemas", () => {
  describe("PostCreateBodySchema", () => {
    it("accepts 1 to 200 characters and strips unknown keys", () => {
      expect(PostCreateBodySchema.parse({ content: "a" })).toEqual({
        content: "a",
      });
      expect(PostCreateBodySchema.parse({ content: "a".repeat(200) })).toEqual({
        content: "a".repeat(200),
      });

      const parsed = PostCreateBodySchema.parse({
        content: "hi",
        posterId: 99,
      });

      expect(parsed).not.toHaveProperty("posterId");
    });

    it("rejects empty and whitespace-only content", () => {
      expect(PostCreateBodySchema.safeParse({ content: "" }).success).toBe(
        false,
      );
      expect(PostCreateBodySchema.safeParse({ content: " " }).success).toBe(
        false,
      );
      expect(
        PostCreateBodySchema.safeParse({ content: "a".repeat(201) }).success,
      ).toBe(false);
    });

    it("trims content before storing it", () => {
      expect(PostCreateBodySchema.parse({ content: "  hello  " })).toEqual({
        content: "hello",
      });
    });
  });

  describe("UserUpdateBodySchema", () => {
    it("defaults the note and enforces username/note limits", () => {
      expect(UserUpdateBodySchema.parse({ username: "bob" })).toEqual({
        username: "bob",
        noteToAll: "",
      });

      expect(
        UserUpdateBodySchema.safeParse({ username: "a".repeat(30) }).success,
      ).toBe(true);
      expect(
        UserUpdateBodySchema.safeParse({ username: "a".repeat(31) }).success,
      ).toBe(false);
      expect(UserUpdateBodySchema.safeParse({ username: "" }).success).toBe(
        false,
      );
      expect(
        UserUpdateBodySchema.safeParse({
          username: "bob",
          noteToAll: "a".repeat(280),
        }).success,
      ).toBe(true);
      expect(
        UserUpdateBodySchema.safeParse({
          username: "bob",
          noteToAll: "a".repeat(281),
        }).success,
      ).toBe(false);
    });
  });

  describe("CommentCreateBodySchema", () => {
    it("coerces postId from strings", () => {
      expect(
        CommentCreateBodySchema.parse({ postId: "7", content: "nice" }),
      ).toEqual({ postId: 7, content: "nice" });
    });

    it("rejects non-positive, fractional, and non-numeric ids", () => {
      for (const postId of [0, -1, 1.5, "abc", ""]) {
        expect(
          CommentCreateBodySchema.safeParse({ postId, content: "nice" })
            .success,
          `postId ${JSON.stringify(postId)}`,
        ).toBe(false);
      }
    });

    it("enforces comment content limits", () => {
      expect(
        CommentCreateBodySchema.safeParse({ postId: 1, content: "" }).success,
      ).toBe(false);
      expect(
        CommentCreateBodySchema.safeParse({ postId: 1, content: "   " })
          .success,
      ).toBe(false);
      expect(
        CommentCreateBodySchema.parse({ postId: 1, content: "  nice  " }),
      ).toEqual({ postId: 1, content: "nice" });
      expect(
        CommentCreateBodySchema.safeParse({
          postId: 1,
          content: "a".repeat(200),
        }).success,
      ).toBe(true);
      expect(
        CommentCreateBodySchema.safeParse({
          postId: 1,
          content: "a".repeat(201),
        }).success,
      ).toBe(false);
    });
  });

  describe("MessageCreateBodySchema", () => {
    it("trims and enforces message content limits", () => {
      expect(MessageCreateBodySchema.safeParse({ content: "" }).success).toBe(
        false,
      );
      expect(
        MessageCreateBodySchema.safeParse({ content: "   " }).success,
      ).toBe(false);
      expect(MessageCreateBodySchema.parse({ content: "  hi  " })).toEqual({
        content: "hi",
      });
      expect(
        MessageCreateBodySchema.safeParse({ content: "a".repeat(1000) })
          .success,
      ).toBe(true);
      expect(
        MessageCreateBodySchema.safeParse({ content: "a".repeat(1001) })
          .success,
      ).toBe(false);
    });
  });

  describe("query schemas", () => {
    it("PostsGetQuerySchema accepts known filters and coerces the cursor", () => {
      expect(
        PostsGetQuerySchema.parse({
          scope: "me",
          period: "month",
          cursor: "12",
        }),
      ).toEqual({ scope: "me", period: "month", cursor: 12 });

      expect(PostsGetQuerySchema.parse({})).toEqual({});

      for (const query of [
        { scope: "friends" },
        { period: "week" },
        { cursor: "0" },
        { cursor: "-1" },
        { cursor: "1.5" },
      ]) {
        expect(PostsGetQuerySchema.safeParse(query).success).toBe(false);
      }
    });

    it("PostGetQuerySchema coerces the nonnegative offset", () => {
      expect(
        PostGetQuerySchema.parse({ include: "comments", offset: "20" }),
      ).toEqual({ include: "comments", offset: 20 });
      expect(PostGetQuerySchema.parse({ offset: "" }).offset).toBe(0);

      expect(PostGetQuerySchema.safeParse({ offset: "-1" }).success).toBe(
        false,
      );
      expect(PostGetQuerySchema.safeParse({ offset: "1.5" }).success).toBe(
        false,
      );
      expect(PostGetQuerySchema.safeParse({ include: "likes" }).success).toBe(
        false,
      );
    });

    it("FriendExploreQuerySchema trims and caps the search term", () => {
      expect(FriendExploreQuerySchema.parse({ query: "  bob  " })).toEqual({
        query: "bob",
      });
      expect(FriendExploreQuerySchema.parse({ offset: "24" })).toEqual({
        offset: 24,
      });
      expect(
        FriendExploreQuerySchema.safeParse({ query: "a".repeat(30) }).success,
      ).toBe(true);
      expect(
        FriendExploreQuerySchema.safeParse({ query: "a".repeat(31) }).success,
      ).toBe(false);
      expect(FriendExploreQuerySchema.safeParse({ offset: "-1" }).success).toBe(
        false,
      );
    });
  });

  describe("coercedId", () => {
    it("accepts positive integers only", () => {
      expect(coercedId.parse("3")).toBe(3);
      expect(coercedId.parse(3)).toBe(3);
      expect(coercedId.safeParse(0).success).toBe(false);
      expect(coercedId.safeParse(-3).success).toBe(false);
      expect(coercedId.safeParse(3.5).success).toBe(false);
      expect(coercedId.safeParse("3.5").success).toBe(false);
    });
  });
});

describe("response schemas", () => {
  it("PostsGetResponseSchema parses a feed page", () => {
    expect(
      PostsGetResponseSchema.parse({ data: [feedItem], nextCursor: null }),
    ).toEqual({ data: [feedItem], nextCursor: null });
    expect(PostsGetResponseSchema.parse({ data: [], nextCursor: 10 })).toEqual({
      data: [],
      nextCursor: 10,
    });
    expect(
      PostsGetResponseSchema.safeParse({ data: [], nextCursor: 0 }).success,
    ).toBe(false);
  });

  it("PostGetResponseSchema parses embedded comments and an offset cursor", () => {
    const comment = {
      id: 1,
      content: "first",
      createdAt,
      user: author,
    };

    expect(
      PostGetResponseSchema.parse({
        data: { ...feedItem, comments: [comment] },
        nextCursor: 0,
      }),
    ).toMatchObject({
      data: { id: feedItem.id, comments: [comment] },
      nextCursor: 0,
    });
  });

  it("parses JSON-serialized response payloads (wire dates)", () => {
    const payload = {
      data: {
        ...feedItem,
        comments: [
          {
            id: 1,
            content: "first",
            createdAt,
            user: author,
          },
        ],
      },
      nextCursor: 0,
    };

    const wirePayload = JSON.parse(JSON.stringify(payload));
    const parsed = PostGetResponseSchema.parse(wirePayload);

    expect(parsed.data.createdAt).toBeInstanceOf(Date);
    expect(parsed.data.comments[0]?.createdAt).toBeInstanceOf(Date);
  });

  it("UsersGetResponseSchema parses users with follow status", () => {
    const usersPage = {
      data: [
        {
          id: 2,
          username: "bob",
          createdAt,
          profileUrl: "https://example.com/bob.png",
          isFollowing: true,
        },
      ],
      nextCursor: 12,
    };

    expect(UsersGetResponseSchema.parse(usersPage)).toEqual(usersPage);
    expect(
      UsersGetResponseSchema.safeParse({ data: [], nextCursor: -1 }).success,
    ).toBe(false);
  });

  it("FriendsGetResponseSchema parses all three friendship buckets", () => {
    const friendRequest = {
      id: 5,
      senderId: 1,
      receiverId: 2,
      status: "PENDING",
      createdAt,
      sender: { ...author, createdAt },
      receiver: { id: 2, username: "bob", profileUrl: null, createdAt },
    };

    const payload = {
      data: {
        friends: [
          {
            ...author,
            createdAt,
            friendshipId: 9,
            lastMessage: { content: "hey", senderId: 1, createdAt },
          },
          {
            ...author,
            createdAt,
            friendshipId: 10,
            lastMessage: null,
          },
        ],
        incomingRequests: [friendRequest],
        outgoingRequests: [],
      },
    };

    expect(FriendsGetResponseSchema.parse(payload)).toEqual(payload);
  });

  it("MessagesGetResponseSchema parses a cursor page", () => {
    const message = {
      id: 1,
      senderId: 1,
      recipientId: 2,
      content: "hello",
      createdAt,
    };

    expect(
      MessagesGetResponseSchema.parse({
        data: [message],
        nextCursor: 4,
      }),
    ).toEqual({ data: [message], nextCursor: 4 });
  });

  it("FriendExploreResponseSchema parses request status and id", () => {
    const payload = {
      data: [
        {
          id: 2,
          username: "bob",
          profileUrl: null,
          createdAt,
          requestStatus: "PENDING",
          requestId: 8,
        },
        {
          id: 3,
          username: "carol",
          profileUrl: null,
          createdAt,
          requestStatus: null,
          requestId: null,
        },
      ],
      nextCursor: null,
    };

    expect(FriendExploreResponseSchema.parse(payload)).toEqual(payload);
  });
});
