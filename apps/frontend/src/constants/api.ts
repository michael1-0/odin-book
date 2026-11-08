// Relative fetch paths used by the services — the Vite dev proxy forwards
// these to the backend. Each API path stays single-sourced here.

// Builders only accept well-formed IDs; formData values must be
// string-guarded by the caller before being passed in.
type PathParam = string | number;

export const API_PATHS = {
  authMe: "/api/auth/me",
  authLogout: "/api/auth/logout",

  posts: "/api/posts",
  post: (postId: PathParam) => `/api/posts/${postId}`,

  users: "/api/users",
  user: (userId: PathParam) => `/api/users/${userId}`,

  comments: "/api/comments",

  likes: (postId: PathParam) => `/api/likes/${postId}`,

  follows: (targetUserId: PathParam) => `/api/follows/${targetUserId}`,

  friends: "/api/friends",
  friendExplore: "/api/friends/explore",
  friendRequest: (id: PathParam) => `/api/friends/requests/${id}`,
  friendRequestAccept: (id: PathParam) => `/api/friends/requests/${id}/accept`,
  friendRequestDecline: (id: PathParam) =>
    `/api/friends/requests/${id}/decline`,

  messages: (friendId: PathParam) => `/api/messages/${friendId}`,
} as const;
