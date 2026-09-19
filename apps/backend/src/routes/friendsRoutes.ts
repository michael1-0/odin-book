import type { Router as RouterType } from "express";
import { Router } from "express";
import validate from "express-zod-safe";
import {
  FriendExploreQuerySchema,
  FriendRequestIdParamsSchema,
  TargetUserIdParamsSchema,
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
friendsRouter.get(
  "/explore",
  validate({ query: FriendExploreQuerySchema }),
  exploreFriends,
);
friendsRouter.post(
  "/requests/:targetUserId",
  validate({ params: TargetUserIdParamsSchema }),
  sendFriendRequest,
);
friendsRouter.delete(
  "/requests/:targetUserId",
  validate({ params: TargetUserIdParamsSchema }),
  cancelFriendRequest,
);
friendsRouter.post(
  "/requests/:requestId/accept",
  validate({ params: FriendRequestIdParamsSchema }),
  acceptFriendRequest,
);
friendsRouter.post(
  "/requests/:requestId/decline",
  validate({ params: FriendRequestIdParamsSchema }),
  declineFriendRequest,
);

export default friendsRouter;
