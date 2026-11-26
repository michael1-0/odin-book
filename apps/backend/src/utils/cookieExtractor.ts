import type { Request } from "express";
import { AUTH_COOKIE_NAME } from "../constants/auth.ts";

// cookie-parser types every cookie value as `any`; narrow at the boundary.
// Returns `null` when cookie-parser did not run, `undefined` when the cookie
// is absent — passport-jwt treats both as "no token".
function cookieExtractor(req: Request): string | null | undefined {
  const cookies = req.cookies as Record<string, string | undefined> | undefined;

  if (!cookies) {
    return null;
  }

  return cookies[AUTH_COOKIE_NAME];
}

export default cookieExtractor;
