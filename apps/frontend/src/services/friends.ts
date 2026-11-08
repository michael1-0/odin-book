import type {
  FriendExploreItem,
  FriendsGetResponse,
  Message,
  MessagesGetResponse,
} from "@repo/zod-validations";
import { API_PATHS } from "../constants/api";

async function getFriends(): Promise<FriendsGetResponse["data"]> {
  const response = await fetch(API_PATHS.friends);
  const result = (await response.json()) as FriendsGetResponse & {
    error?: { message?: string };
  };

  if (!response.ok) {
    throw new Response(result.error?.message ?? "Failed to load friends", {
      status: response.status,
    });
  }

  return result.data;
}

async function exploreFriends(
  query: string | null,
  offset?: number,
): Promise<{
  data: FriendExploreItem[];
  meta: { nextCursor: number | null; hasNextPage: boolean };
}> {
  const searchParams = new URLSearchParams();

  if (query) {
    searchParams.set("query", query);
  }

  if (offset !== undefined) {
    searchParams.set("offset", String(offset));
  }

  const queryString = searchParams.toString();
  const response = await fetch(
    queryString
      ? `${API_PATHS.friendExplore}?${queryString}`
      : API_PATHS.friendExplore,
  );
  const result = await response.json();

  if (!response.ok) {
    throw new Response(result.error?.message ?? "Failed to search users", {
      status: response.status,
    });
  }

  return result;
}

async function sendFriendRequest(formData: FormData) {
  const targetUserId = formData.get("targetUserId");

  if (typeof targetUserId !== "string") {
    return { error: true, message: "Missing target user ID" };
  }

  const response = await fetch(API_PATHS.friendRequest(targetUserId), {
    method: "POST",
  });
  const result = await response.json();

  if (!response.ok) {
    return {
      error: true,
      message: result.error?.message ?? "Failed to send friend request",
    };
  }

  return result.data;
}

async function cancelFriendRequest(formData: FormData) {
  const targetUserId = formData.get("targetUserId");

  if (typeof targetUserId !== "string") {
    return { error: true, message: "Missing target user ID" };
  }

  const response = await fetch(API_PATHS.friendRequest(targetUserId), {
    method: "DELETE",
  });
  const result = await response.json();

  if (!response.ok) {
    return {
      error: true,
      message: result.error?.message ?? "Failed to cancel friend request",
    };
  }

  return result.data;
}

async function acceptFriendRequest(formData: FormData) {
  const requestId = formData.get("requestId");

  if (typeof requestId !== "string") {
    return { error: true, message: "Missing request ID" };
  }

  const response = await fetch(API_PATHS.friendRequestAccept(requestId), {
    method: "POST",
  });
  const result = await response.json();

  if (!response.ok) {
    return {
      error: true,
      message: result.error?.message ?? "Failed to accept friend request",
    };
  }

  return result.data;
}

async function declineFriendRequest(formData: FormData) {
  const requestId = formData.get("requestId");

  if (typeof requestId !== "string") {
    return { error: true, message: "Missing request ID" };
  }

  const response = await fetch(API_PATHS.friendRequestDecline(requestId), {
    method: "POST",
  });
  const result = await response.json();

  if (!response.ok) {
    return {
      error: true,
      message: result.error?.message ?? "Failed to decline friend request",
    };
  }

  return result.data;
}

async function getMessages(
  friendId: number,
  beforeId?: number,
): Promise<MessagesGetResponse> {
  const searchParams = new URLSearchParams();

  if (beforeId !== undefined) {
    searchParams.set("beforeId", String(beforeId));
  }

  const queryString = searchParams.toString();
  const response = await fetch(
    `${API_PATHS.messages(friendId)}${queryString ? `?${queryString}` : ""}`,
  );
  const result = await response.json();

  if (!response.ok) {
    throw new Response(result.error?.message ?? "Failed to load messages", {
      status: response.status,
    });
  }

  return result;
}

async function sendMessage(
  friendId: number,
  content: string,
): Promise<Message> {
  const response = await fetch(API_PATHS.messages(friendId), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ content }),
  });
  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error?.message ?? "Failed to send message");
  }

  return result.data;
}

export {
  getFriends,
  exploreFriends,
  sendFriendRequest,
  cancelFriendRequest,
  acceptFriendRequest,
  declineFriendRequest,
  getMessages,
  sendMessage,
};
