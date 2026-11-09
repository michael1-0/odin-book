// Repeated AppError message strings used across controllers.
export const ERROR_MESSAGES = {
  unauthenticated: "Unauthenticated",
  forbidden: "Forbidden",
  userNotFound: "User not found",
  postNotFound: "Post not found",
  friendRequestNotFound: "Request not found",
  alreadyFriends: "You are already friends",
  friendRequestAlreadyHandled: "Request was already handled",
} as const;
