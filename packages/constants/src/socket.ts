// Event names emitted by the backend socket server and listened for by
// the frontend — keep the two sides in sync through this constant.
export const SOCKET_EVENTS = {
  friendRequestNew: "friend-request:new",
  friendRequestAccepted: "friend-request:accepted",
  friendRequestDeclined: "friend-request:declined",
  messageNew: "message:new",
} as const;
