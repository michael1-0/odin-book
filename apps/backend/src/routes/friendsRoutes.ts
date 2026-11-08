import type { Router as RouterType } from "express";
import { Router } from "express";
import validate from "express-zod-safe";
import {
  friendExploreSpec,
  friendRequestIdParamsSpec,
  targetUserIdParamsSpec,
} from "@repo/zod-validations";
import requireAuth from "../middlewares/authMiddleware.ts";
import {
  acceptFriendRequest,
  cancelFriendRequest,
  declineFriendRequest,
  exploreFriends,
  getFriends,
  sendFriendRequest,
} from "../controllers/friendsController.ts";

const friendsRouter: RouterType = Router();

friendsRouter.use(requireAuth);

friendsRouter.get("/", getFriends);
friendsRouter.get("/explore", validate(friendExploreSpec), exploreFriends);
friendsRouter.post(
  "/requests/:targetUserId",
  validate(targetUserIdParamsSpec),
  sendFriendRequest,
);
friendsRouter.delete(
  "/requests/:targetUserId",
  validate(targetUserIdParamsSpec),
  cancelFriendRequest,
);
friendsRouter.post(
  "/requests/:requestId/accept",
  validate(friendRequestIdParamsSpec),
  acceptFriendRequest,
);
friendsRouter.post(
  "/requests/:requestId/decline",
  validate(friendRequestIdParamsSpec),
  declineFriendRequest,
);

export default friendsRouter;
