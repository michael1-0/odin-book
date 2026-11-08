import type { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { AppError } from "../errors/AppError.ts";
import env from "../config/env.ts";
import {
  AUTH_COOKIE_NAME,
  AUTH_TOKEN_TTL_MS,
  OAUTH_FAILURE_REDIRECT_PATH,
  SECURE_COOKIE_OPTIONS,
} from "../constants/auth.ts";
import { ERROR_MESSAGES } from "../constants/errors.ts";

function githubCallback(req: Request, res: Response) {
  if (!req.user) {
    return res.redirect(`${env.frontendUrl}${OAUTH_FAILURE_REDIRECT_PATH}`);
  }

  const user = req.user;

  const payload = {
    sub: user.id,
    githubId: user.githubId,
    username: user.username,
  };

  const token = jwt.sign(payload, env.jwtSecret, {
    expiresIn: AUTH_TOKEN_TTL_MS / 1000,
  });

  res.cookie(AUTH_COOKIE_NAME, token, {
    ...SECURE_COOKIE_OPTIONS,
    maxAge: AUTH_TOKEN_TTL_MS,
  });
  res.redirect(env.frontendUrl);
}

async function getMe(req: Request, res: Response) {
  if (!req.user) {
    throw new AppError(ERROR_MESSAGES.unauthorized, 401);
  }

  return res.json(req.user);
}

function postLogout(req: Request, res: Response) {
  res.clearCookie(AUTH_COOKIE_NAME, SECURE_COOKIE_OPTIONS);

  res.status(200).json({ success: true });
}

export { githubCallback, postLogout, getMe };
