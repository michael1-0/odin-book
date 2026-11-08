import env from "../config/env.ts";

export const AUTH_COOKIE_NAME = "token";
export const AUTH_TOKEN_TTL_MS = 24 * 60 * 60 * 1000; // 1 day; JWT expiresIn derives from this
export const SECURE_COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: env.isProd,
};
export const OAUTH_STATE_COOKIE_NAME = "oauth_state";
export const OAUTH_STATE_MAX_AGE_MS = 10 * 60 * 1000; // 10 minutes
export const OAUTH_STATE_BYTES = 32;
export const OAUTH_FAILURE_REDIRECT_PATH = "/login?error=auth_failed";
