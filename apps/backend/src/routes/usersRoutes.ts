import type { Router as RouterType } from "express";
import { Router } from "express";
import requireAuth from "../middlewares/authMiddleware.ts";
import { getUsersWithoutCurrentUser } from "../controllers/usersController.ts";
import validate from "express-zod-safe";
import {
  PostCreateSchema,
  PostCreateParamsSchema,
  PostLikeParamsSchema,
} from "@repo/zod-validations";
import {
  likePost,
  postPost,
  unlikePost,
} from "../controllers/postsController.ts";

const usersRouter: RouterType = Router();

usersRouter.use(requireAuth);

usersRouter.get("/", getUsersWithoutCurrentUser);
usersRouter.post(
  "/:userId/posts",
  validate({
    params: PostCreateParamsSchema,
    body: PostCreateSchema,
  }),
  postPost,
);
usersRouter.post(
  "/:userId/posts/:postId/like",
  validate({ params: PostLikeParamsSchema }),
  likePost,
);
usersRouter.delete(
  "/:userId/posts/:postId/like",
  validate({
    params: PostLikeParamsSchema,
  }),
  unlikePost,
);

export default usersRouter;
