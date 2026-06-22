import { AppError } from "../errors/AppError.ts";
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
        return next(new AppError("Unauthorized", 401));
      }

      req.user = user;
      next();
    },
  )(req, res, next);
}

export default requireAuth;
