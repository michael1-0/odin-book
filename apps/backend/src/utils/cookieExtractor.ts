import type { Request } from "express";
import { AUTH_COOKIE_NAME } from "../constants/auth.ts";

// cookie-parser types every cookie value as `any`; narrow once here.
function readCookie(req: Request, name: string): string | undefined {
  const cookies: unknown = req.cookies;

  if (typeof cookies !== "object" || cookies === null) {
    return undefined;
  }

  const value = (cookies as Record<string, unknown>)[name];

  return typeof value === "string" ? value : undefined;
}

function cookieExtractor(req: Request): string | null {
  return readCookie(req, AUTH_COOKIE_NAME) ?? null;
}

export { readCookie };
export default cookieExtractor;
