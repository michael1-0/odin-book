import jwt from "jsonwebtoken";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { NextFunction, Request, Response } from "express";
import env from "../../src/config/env.ts";
import { githubCallback } from "../../src/controllers/authController.ts";
import {
  AUTH_COOKIE_NAME,
  AUTH_TOKEN_TTL_MS,
  OAUTH_FAILURE_REDIRECT_PATH,
  OAUTH_STATE_BYTES,
  OAUTH_STATE_COOKIE_NAME,
  OAUTH_STATE_MAX_AGE_MS,
} from "../../src/constants/auth.ts";
import {
  issueOAuthState,
  verifyOAuthState,
} from "../../src/middlewares/oauthStateMiddleware.ts";

function createResponse() {
  const cookie = vi.fn();
  const clearCookie = vi.fn();
  const redirect = vi.fn();
  const json = vi.fn();
  const status = vi.fn();
  const res = {
    cookie,
    clearCookie,
    redirect,
    json,
    status,
  };

  status.mockReturnValue(res);

  return {
    res: res as unknown as Response,
    cookie,
    clearCookie,
    redirect,
    json,
    status,
  };
}

function createRequest(options: {
  cookies?: Record<string, string>;
  state?: string;
}) {
  return {
    cookies: options.cookies,
    query: options.state === undefined ? {} : { state: options.state },
  } as unknown as Request;
}

function next() {
  return vi.fn() as NextFunction;
}

function failureRedirect() {
  return `${env.frontendUrl}${OAUTH_FAILURE_REDIRECT_PATH}`;
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("issueOAuthState", () => {
  it("sets a random state cookie and returns it to the strategy", () => {
    const { res, cookie } = createResponse();

    const state = issueOAuthState(res);

    expect(state).toMatch(/^[0-9a-f]+$/);
    expect(state).toHaveLength(OAUTH_STATE_BYTES * 2);
    expect(cookie).toHaveBeenCalledWith(
      OAUTH_STATE_COOKIE_NAME,
      state,
      expect.objectContaining({
        httpOnly: true,
        sameSite: "lax",
        secure: false,
        maxAge: OAUTH_STATE_MAX_AGE_MS,
      }),
    );
  });
});

describe("verifyOAuthState", () => {
  it("clears the cookie and continues for matching state", () => {
    const state = "a".repeat(OAUTH_STATE_BYTES * 2);
    const { res, clearCookie, redirect } = createResponse();
    const nextHandler = next();

    verifyOAuthState(
      createRequest({
        cookies: { [OAUTH_STATE_COOKIE_NAME]: state },
        state,
      }),
      res,
      nextHandler,
    );

    expect(clearCookie).toHaveBeenCalledWith(
      OAUTH_STATE_COOKIE_NAME,
      expect.objectContaining({ httpOnly: true, sameSite: "lax" }),
    );
    expect(redirect).not.toHaveBeenCalled();
    expect(nextHandler).toHaveBeenCalledTimes(1);
  });

  it("redirects and does not continue when state differs", () => {
    const { res, redirect } = createResponse();
    const nextHandler = next();

    verifyOAuthState(
      createRequest({
        cookies: { [OAUTH_STATE_COOKIE_NAME]: "a".repeat(64) },
        state: "b".repeat(64),
      }),
      res,
      nextHandler,
    );

    expect(redirect).toHaveBeenCalledWith(failureRedirect());
    expect(nextHandler).not.toHaveBeenCalled();
  });

  it("redirects when the cookie or query state is missing", () => {
    const cookieMissing = createResponse();
    const queryMissing = createResponse();
    const cookieNext = next();
    const queryNext = next();
    const state = "a".repeat(64);

    verifyOAuthState(createRequest({ state }), cookieMissing.res, cookieNext);
    verifyOAuthState(
      createRequest({ cookies: { [OAUTH_STATE_COOKIE_NAME]: state } }),
      queryMissing.res,
      queryNext,
    );

    expect(cookieMissing.redirect).toHaveBeenCalledWith(failureRedirect());
    expect(queryMissing.redirect).toHaveBeenCalledWith(failureRedirect());
    expect(cookieNext).not.toHaveBeenCalled();
    expect(queryNext).not.toHaveBeenCalled();
  });

  it("redirects when equal-length strings have different byte lengths", () => {
    const { res, redirect } = createResponse();
    const nextHandler = next();

    verifyOAuthState(
      createRequest({
        cookies: { [OAUTH_STATE_COOKIE_NAME]: "a".repeat(64) },
        state: "é".repeat(64),
      }),
      res,
      nextHandler,
    );

    expect(redirect).toHaveBeenCalledWith(failureRedirect());
    expect(nextHandler).not.toHaveBeenCalled();
  });

  it("redirects on empty matching state", () => {
    const { res, redirect } = createResponse();
    const nextHandler = next();

    verifyOAuthState(
      createRequest({
        cookies: { [OAUTH_STATE_COOKIE_NAME]: "" },
        state: "",
      }),
      res,
      nextHandler,
    );

    expect(redirect).toHaveBeenCalledWith(failureRedirect());
    expect(nextHandler).not.toHaveBeenCalled();
  });
});

describe("githubCallback", () => {
  function requestAs(user: Express.User | undefined) {
    return { user } as unknown as Request;
  }

  it("signs a JWT cookie and redirects home", () => {
    const { res, cookie, redirect } = createResponse();

    githubCallback(
      requestAs({ id: 7, githubId: "gh-7", username: "alice" } as Express.User),
      res,
    );

    expect(redirect).toHaveBeenCalledWith(env.frontendUrl);
    expect(cookie).toHaveBeenCalledWith(
      AUTH_COOKIE_NAME,
      expect.any(String),
      expect.objectContaining({
        httpOnly: true,
        sameSite: "lax",
        secure: false,
        maxAge: AUTH_TOKEN_TTL_MS,
      }),
    );

    const token = cookie.mock.calls[0]?.[1] as string;
    const payload = jwt.verify(token, env.jwtSecret) as jwt.JwtPayload;

    expect(payload.sub).toBe(7);
    expect(payload.username).toBe("alice");
  });

  it("redirects to the login failure state without a user", () => {
    const { res, cookie, redirect } = createResponse();

    githubCallback(requestAs(undefined), res);

    expect(redirect).toHaveBeenCalledWith(failureRedirect());
    expect(cookie).not.toHaveBeenCalled();
  });
});
