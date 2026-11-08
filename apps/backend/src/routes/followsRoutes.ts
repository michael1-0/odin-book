import type { Router as RouterType } from "express";
import { Router } from "express";
import validate from "express-zod-safe";
import { followUser, unfollowUser } from "../controllers/followsController.ts";
import { followParamsSpec } from "@repo/zod-validations";
import requireAuth from "../middlewares/authMiddleware.ts";

const followsRouter: RouterType = Router();

followsRouter.use(requireAuth);

followsRouter.post("/:followingId", validate(followParamsSpec), followUser);
followsRouter.delete("/:followingId", validate(followParamsSpec), unfollowUser);

export default followsRouter;
