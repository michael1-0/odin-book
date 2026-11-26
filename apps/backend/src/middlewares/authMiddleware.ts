import { AppError } from "../errors/AppError.ts";
import { ERROR_MESSAGES } from "../constants/errors.ts";
import passport from "./passportMiddleware.ts";

import type { NextFunction, Request, RequestHandler, Response } from "express";

function requireAuth(req: Request, res: Response, next: NextFunction) {
  // passport's `authenticate()` is typed as `any`; pin the middleware shape.
  const authenticate = passport.authenticate(
    "jwt",
    { session: false },
    (err: unknown, user?: false | Express.User | null) => {
      if (err) {
        next(err);
        return;
      }

      if (!user) {
        next(new AppError(ERROR_MESSAGES.unauthenticated, 401));
        return;
      }

      req.user = user;
      next();
    },
  ) as RequestHandler;

  authenticate(req, res, next);
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
