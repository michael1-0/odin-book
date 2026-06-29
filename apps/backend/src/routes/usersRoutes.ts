import type { Router as RouterType } from "express";
import { Router } from "express";
import requireAuth from "../middlewares/authMiddleware.ts";
import {
  deleteUserFollowsUser,
  getUsersWithoutCurrentUser,
  postUserFollowsUser,
} from "../controllers/usersController.ts";
import validate from "express-zod-safe";
import { FollowSchema } from "@repo/zod-validations";

const usersRouter: RouterType = Router();

usersRouter.use(requireAuth);

usersRouter.get("/", getUsersWithoutCurrentUser);
usersRouter.post(
  "/:followedById/following/:followingId",
  validate({ params: FollowSchema }),
  postUserFollowsUser,
);
usersRouter.delete(
  "/:followedById/following/:followingId",
  validate({ params: FollowSchema }),
  deleteUserFollowsUser,
);

export default usersRouter;
