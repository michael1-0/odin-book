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

function initiateOAuthState(req: Request, res: Response, next: NextFunction) {
  const state = crypto.randomBytes(OAUTH_STATE_BYTES).toString("hex");

  res.cookie(OAUTH_STATE_COOKIE_NAME, state, {
    ...SECURE_COOKIE_OPTIONS,
    maxAge: OAUTH_STATE_MAX_AGE_MS,
  });
  res.locals.oauthState = state;

  next();
}

function verifyOAuthState(req: Request, res: Response, next: NextFunction) {
  const cookieState = req.cookies?.[OAUTH_STATE_COOKIE_NAME];
  const queryState =
    typeof req.query.state === "string" ? req.query.state : undefined;

  res.clearCookie(OAUTH_STATE_COOKIE_NAME, SECURE_COOKIE_OPTIONS);

  const isValid =
    typeof cookieState === "string" &&
    typeof queryState === "string" &&
    queryState.length === cookieState.length &&
    crypto.timingSafeEqual(
      Buffer.from(queryState, "utf8"),
      Buffer.from(cookieState, "utf8"),
    );

  if (!isValid) {
    return res.redirect(`${env.frontendUrl}${OAUTH_FAILURE_REDIRECT_PATH}`);
  }

  next();
}

export { initiateOAuthState, verifyOAuthState };
