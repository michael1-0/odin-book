import type { Router as RouterType } from "express";
import { Router } from "express";
import passport from "../middlewares/passportMiddleware.ts";
import { githubCallback, postLogout } from "../controllers/authController.ts";
import { getMe } from "../controllers/authController.ts";
import requireAuth from "../middlewares/authMiddleware.ts";

const authRouter: RouterType = Router();

authRouter.get("/github", passport.authenticate("github", { session: false }));
authRouter.get(
  "/github/callback",
  passport.authenticate("github", { session: false }),
  githubCallback,
);
authRouter.get("/me", requireAuth, getMe);
authRouter.post("/logout", requireAuth, postLogout);

export default authRouter;
