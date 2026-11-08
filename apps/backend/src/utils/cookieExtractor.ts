import type { Request } from "express";
import { AUTH_COOKIE_NAME } from "../constants/auth.ts";

function cookieExtractor(req: Request) {
  let token = null;
  if (req && req.cookies) {
    token = req.cookies[AUTH_COOKIE_NAME];
  }
  return token;
}

export default cookieExtractor;
