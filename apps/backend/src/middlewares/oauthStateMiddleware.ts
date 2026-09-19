import crypto from "crypto";
import type { NextFunction, Request, Response } from "express";
import env from "../config/env.ts";

const OAUTH_STATE_COOKIE = "oauth_state";
const OAUTH_STATE_MAX_AGE_MS = 10 * 60 * 1000; // 10 minutes

function initiateOAuthState(req: Request, res: Response, next: NextFunction) {
  const state = crypto.randomBytes(32).toString("hex");

  res.cookie(OAUTH_STATE_COOKIE, state, {
    httpOnly: true,
    sameSite: "lax",
    secure: env.isProd,
    maxAge: OAUTH_STATE_MAX_AGE_MS,
  });
  res.locals.oauthState = state;

  next();
}

function verifyOAuthState(req: Request, res: Response, next: NextFunction) {
  const cookieState = req.cookies?.[OAUTH_STATE_COOKIE];
  const queryState =
    typeof req.query.state === "string" ? req.query.state : undefined;

  res.clearCookie(OAUTH_STATE_COOKIE, {
    httpOnly: true,
    sameSite: "lax",
    secure: env.isProd,
  });

  const isValid =
    typeof cookieState === "string" &&
    typeof queryState === "string" &&
    queryState.length === cookieState.length &&
    crypto.timingSafeEqual(
      Buffer.from(queryState, "utf8"),
      Buffer.from(cookieState, "utf8"),
    );

  if (!isValid) {
    return res.redirect(`${env.frontendUrl}/login?error=auth_failed`);
  }

  next();
}

export { initiateOAuthState, verifyOAuthState };
