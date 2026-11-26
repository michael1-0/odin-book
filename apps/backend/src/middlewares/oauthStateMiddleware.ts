import crypto from "crypto";
import type { NextFunction, Request, Response } from "express";
import env from "../config/env.ts";
import {
  OAUTH_FAILURE_REDIRECT_PATH,
  OAUTH_STATE_BYTES,
  OAUTH_STATE_COOKIE_NAME,
  OAUTH_STATE_MAX_AGE_MS,
  SECURE_COOKIE_OPTIONS,
} from "../constants/auth.ts";
import { readCookie } from "../utils/cookieExtractor.ts";

// Issues the state cookie and returns the value for the strategy's `state`
// option, so no untyped `res.locals` contract is needed.
function issueOAuthState(res: Response): string {
  const state = crypto.randomBytes(OAUTH_STATE_BYTES).toString("hex");

  res.cookie(OAUTH_STATE_COOKIE_NAME, state, {
    ...SECURE_COOKIE_OPTIONS,
    maxAge: OAUTH_STATE_MAX_AGE_MS,
  });

  return state;
}

function verifyOAuthState(req: Request, res: Response, next: NextFunction) {
  const cookieState = readCookie(req, OAUTH_STATE_COOKIE_NAME);
  const queryState =
    typeof req.query.state === "string" ? req.query.state : undefined;

  res.clearCookie(OAUTH_STATE_COOKIE_NAME, SECURE_COOKIE_OPTIONS);

  const queryBuffer =
    queryState === undefined ? null : Buffer.from(queryState, "utf8");
  const cookieBuffer =
    cookieState === undefined ? null : Buffer.from(cookieState, "utf8");

  // Compare UTF-8 buffers, not JS string lengths: `timingSafeEqual` throws
  // when the byte lengths differ, and an empty state must never validate.
  const isValid =
    queryBuffer !== null &&
    cookieBuffer !== null &&
    queryBuffer.length > 0 &&
    queryBuffer.length === cookieBuffer.length &&
    crypto.timingSafeEqual(queryBuffer, cookieBuffer);

  if (!isValid) {
    res.redirect(`${env.frontendUrl}${OAUTH_FAILURE_REDIRECT_PATH}`);
    return;
  }

  next();
}

export { issueOAuthState, verifyOAuthState };
