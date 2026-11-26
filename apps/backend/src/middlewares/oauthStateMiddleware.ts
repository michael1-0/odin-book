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

function initiateOAuthState(_req: Request, res: Response, next: NextFunction) {
  const state = crypto.randomBytes(OAUTH_STATE_BYTES).toString("hex");

  res.cookie(OAUTH_STATE_COOKIE_NAME, state, {
    ...SECURE_COOKIE_OPTIONS,
    maxAge: OAUTH_STATE_MAX_AGE_MS,
  });
  res.locals.oauthState = state;

  next();
}

function verifyOAuthState(req: Request, res: Response, next: NextFunction) {
  // cookie-parser types every cookie value as `any`.
  const cookies = req.cookies as Record<string, string | undefined> | undefined;
  const cookieState = cookies?.[OAUTH_STATE_COOKIE_NAME];
  const queryState =
    typeof req.query.state === "string" ? req.query.state : undefined;

  res.clearCookie(OAUTH_STATE_COOKIE_NAME, SECURE_COOKIE_OPTIONS);

  const queryBuffer =
    typeof queryState === "string" ? Buffer.from(queryState, "utf8") : null;
  const cookieBuffer =
    typeof cookieState === "string" ? Buffer.from(cookieState, "utf8") : null;

  // Compare UTF-8 buffers, not JS string lengths: `timingSafeEqual` throws
  // when the byte lengths differ, and an empty state must never validate.
  const isValid =
    queryBuffer !== null &&
    cookieBuffer !== null &&
    queryBuffer.length > 0 &&
    queryBuffer.length === cookieBuffer.length &&
    crypto.timingSafeEqual(queryBuffer, cookieBuffer);

  if (!isValid) {
    return res.redirect(`${env.frontendUrl}${OAUTH_FAILURE_REDIRECT_PATH}`);
  }

  next();
}

export { initiateOAuthState, verifyOAuthState };
