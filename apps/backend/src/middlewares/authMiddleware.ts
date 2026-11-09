import { AppError } from "../errors/AppError.ts";
import { ERROR_MESSAGES } from "../constants/errors.ts";
import passport from "./passportMiddleware.ts";

import type { NextFunction, Request, Response } from "express";

function requireAuth(req: Request, res: Response, next: NextFunction) {
  passport.authenticate(
    "jwt",
    { session: false },
    (err: unknown, user?: false | Express.User | null | undefined) => {
      if (err) {
        return next(err);
      }

      if (!user) {
        return next(new AppError(ERROR_MESSAGES.unauthenticated, 401));
      }

      req.user = user;
      next();
    },
  )(req, res, next);
}

function requireUser(
  req: Express.Request,
): asserts req is Express.AuthenticatedRequest {
  if (!req.user) {
    throw new AppError(ERROR_MESSAGES.unauthenticated, 401);
  }
}

export default requireAuth;
export { requireUser };
