import type { RequestHandler, Router as RouterType } from "express";
import { Router } from "express";
import passport from "../middlewares/passportMiddleware.ts";
import { githubCallback, postLogout } from "../controllers/authController.ts";
import { getMe } from "../controllers/authController.ts";
import requireAuth from "../middlewares/authMiddleware.ts";
import {
  initiateOAuthState,
  verifyOAuthState,
} from "../middlewares/oauthStateMiddleware.ts";

const authRouter: RouterType = Router();

// passport's `authenticate()` is typed as `any`; pin the middleware shape.
function githubAuth(options: {
  session: boolean;
  state?: string;
}): RequestHandler {
  return passport.authenticate("github", options) as RequestHandler;
}

authRouter.get("/github", initiateOAuthState, (req, res, next) => {
  const state = res.locals.oauthState as string;

  githubAuth({ session: false, state })(req, res, next);
});
authRouter.get(
  "/github/callback",
  verifyOAuthState,
  githubAuth({ session: false }),
  githubCallback,
);
authRouter.get("/me", requireAuth, getMe);
authRouter.post("/logout", requireAuth, postLogout);

export default authRouter;
