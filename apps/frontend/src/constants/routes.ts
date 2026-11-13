// react-router route paths used by the router config and navigation links.
export const APP_ROUTES = {
  home: "/",
  login: "/login",
  updates: "/updates",
  users: "/users",
  friends: "/friends",
  profile: "/profile",
} as const;

// Path patterns for pages with route params (see router.tsx).
export const ROUTE_PATTERNS = {
  userDetail: "/users/:userId",
  postDetail: "/posts/:postId",
} as const;

export function userPath(userId: number) {
  return `/users/${userId}`;
}

export function postPath(postId: number) {
  return `/posts/${postId}`;
}

// Id of the root loader in router.tsx that provides the current user.
export const ROUTE_ID = "user-data";

// Form action identifiers shared between page actions and the forms that
// submit them. Every intent lives here — single- or multi-consumer alike —
// so this file is the full registry of the app's form verbs.
export const FORM_INTENTS = {
  createPost: "create-post",
  likePost: "like-post",
  unlikePost: "unlike-post",
  deletePost: "delete-post",
  createComment: "create-comment",
  updateUser: "update-user",
  followUser: "follow-user",
  unfollowUser: "unfollow-user",
  sendRequest: "send-request",
  cancelRequest: "cancel-request",
  acceptRequest: "accept-request",
  declineRequest: "decline-request",
} as const;
