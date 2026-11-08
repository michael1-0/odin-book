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

// Form action identifiers shared between page actions and the buttons
// that submit them ("create-post", "update-user", ... are file-local).
export const FORM_INTENTS = {
  likePost: "like-post",
  unlikePost: "unlike-post",
  followUser: "follow-user",
  unfollowUser: "unfollow-user",
  sendRequest: "send-request",
  cancelRequest: "cancel-request",
  acceptRequest: "accept-request",
  declineRequest: "decline-request",
} as const;
