// Values of the FriendRequest.status enum, mirrored by
// FriendRequestStatusSchema in @repo/zod-validations.
export const FRIEND_REQUEST_STATUS = {
  PENDING: "PENDING",
  ACCEPTED: "ACCEPTED",
  DECLINED: "DECLINED",
} as const;
