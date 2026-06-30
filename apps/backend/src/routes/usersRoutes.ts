import type { Router as RouterType } from "express";
import { Router } from "express";
import requireAuth from "../middlewares/authMiddleware.ts";
import {
  deleteUserFollowsUser,
  getUsersWithoutCurrentUser,
  postUserFollowsUser,
} from "../controllers/usersController.ts";
import validate from "express-zod-safe";
import {
  FollowSchema,
  PostCreateSchema,
  PostCreateParamsSchema,
} from "@repo/zod-validations";
import { postPost } from "../controllers/postsController.ts";

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
usersRouter.post(
  "/:userId/posts",
  validate({
    params: PostCreateParamsSchema,
    body: PostCreateSchema,
  }),
  postPost,
);

export default usersRouter;
