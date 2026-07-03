import type { Router as RouterType } from "express";
import { Router } from "express";
import validate from "express-zod-safe";
import { followUser, unfollowUser } from "../controllers/followsController.ts";
import { FollowParamsSchema } from "@repo/zod-validations";
import requireAuth from "../middlewares/authMiddleware.ts";

const followsRouter: RouterType = Router();

followsRouter.use(requireAuth);

followsRouter.post(
  "/:followingId",
  validate({ params: FollowParamsSchema }),
  followUser,
);
followsRouter.delete(
  "/:followingId",
  validate({ params: FollowParamsSchema }),
  unfollowUser,
);

export default followsRouter;
