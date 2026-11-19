import type { ActionResult } from "./actionResult";
import type {
  FriendExploreResponse,
  FriendRequest,
  FriendRequestWithUsers,
  FriendsGetResponse,
  Message,
  MessagesGetResponse,
} from "@repo/zod-validations";
import { serverFailure } from "./actionResult";
import { API_PATHS } from "../constants/api";
import { FORM_FIELDS, QUERY_PARAMS } from "../constants/fields";
import { readFormField } from "../utils/formData";
import { apiFetch, apiMutation } from "./http";

async function getFriends(): Promise<FriendsGetResponse["data"]> {
  const body = await apiFetch<FriendsGetResponse>(API_PATHS.friends, {
    failureMessage: "Failed to load friends",
  });

  return body.data;
}

async function exploreFriends(
  query: string | null,
  offset?: number,
): Promise<FriendExploreResponse> {
  return await apiFetch<FriendExploreResponse>(API_PATHS.friendExplore, {
    query: {
      [QUERY_PARAMS.query]: query ?? undefined,
      [QUERY_PARAMS.offset]: offset,
    },
    failureMessage: "Failed to search users",
  });
}

async function sendFriendRequest(
  formData: FormData,
): Promise<ActionResult<FriendRequest>> {
  const targetUserId = readFormField(formData, FORM_FIELDS.targetUserId);

  if (targetUserId === undefined) {
    return serverFailure("Missing target user ID");
  }

  return await apiMutation<FriendRequest>(
    API_PATHS.friendRequest(targetUserId),
    {
      method: "POST",
      failureMessage: "Failed to send friend request",
    },
  );
}

async function cancelFriendRequest(
  formData: FormData,
): Promise<ActionResult<FriendRequest>> {
  const targetUserId = readFormField(formData, FORM_FIELDS.targetUserId);

  if (targetUserId === undefined) {
    return serverFailure("Missing target user ID");
  }

  return await apiMutation<FriendRequest>(
    API_PATHS.friendRequest(targetUserId),
    {
      method: "DELETE",
      failureMessage: "Failed to cancel friend request",
    },
  );
}

async function acceptFriendRequest(
  formData: FormData,
): Promise<ActionResult<FriendRequestWithUsers>> {
  const requestId = readFormField(formData, FORM_FIELDS.requestId);

  if (requestId === undefined) {
    return serverFailure("Missing request ID");
  }

  return await apiMutation<FriendRequestWithUsers>(
    API_PATHS.friendRequestAccept(requestId),
    {
      method: "POST",
      failureMessage: "Failed to accept friend request",
    },
  );
}

async function declineFriendRequest(
  formData: FormData,
): Promise<ActionResult<FriendRequest>> {
  const requestId = readFormField(formData, FORM_FIELDS.requestId);

  if (requestId === undefined) {
    return serverFailure("Missing request ID");
  }

  return await apiMutation<FriendRequest>(
    API_PATHS.friendRequestDecline(requestId),
    {
      method: "POST",
      failureMessage: "Failed to decline friend request",
    },
  );
}

async function getMessages(
  friendId: number,
  beforeId?: number,
): Promise<MessagesGetResponse> {
  return await apiFetch<MessagesGetResponse>(API_PATHS.messages(friendId), {
    query: { [QUERY_PARAMS.beforeId]: beforeId },
    failureMessage: "Failed to load messages",
  });
}

async function sendMessage(
  friendId: number,
  content: string,
): Promise<ActionResult<Message>> {
  return await apiMutation<Message>(API_PATHS.messages(friendId), {
    method: "POST",
    body: { json: { content } },
    failureMessage: "Failed to send message",
  });
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
