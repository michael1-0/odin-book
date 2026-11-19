import { API_PATHS } from "../constants/api";
import { apiFetch } from "./http";

// The user row GET /api/auth/me returns (raw — that endpoint skips the
// `{ data }` envelope) and the one PUT /api/users/:id echoes back: one
// shape, shared by both services. `createdAt` is an ISO string over the
// wire.
type AuthUser = {
  id: number;
  githubId: string;
  username: string;
  noteToAll: string;
  createdAt: string;
  profileUrl: string | null;
};

// Throws on any failure (expired session, backend down), so auth loaders
// decide for themselves whether that means "logged out" (App.checkAuth)
// or "skip the check" (UserDetail's self-profile redirect).
async function getMe(): Promise<AuthUser> {
  return await apiFetch<AuthUser>(API_PATHS.authMe, {
    failureMessage: "Failed to load current user",
  });
}

async function logout(): Promise<void> {
  // The endpoint clears the auth cookie; its `{ success: true }` body is
  // not consumed.
  await apiFetch<unknown>(API_PATHS.authLogout, {
    method: "POST",
    failureMessage: "Failed to log out",
  });
}

export type { AuthUser };
export { getMe, logout };
