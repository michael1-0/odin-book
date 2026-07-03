import { Router } from "express";
import type { Router as RouterType } from "express";
import requireAuth from "../middlewares/authMiddleware.ts";
import validate from "express-zod-safe";
import { PostLikeParamsSchema } from "@repo/zod-validations";
import { likePost, unlikePost } from "../controllers/likesController.ts";

const likesRouter: RouterType = Router();

likesRouter.use(requireAuth);

likesRouter.post(
  "/:postId",
  validate({ params: PostLikeParamsSchema }),
  likePost,
);
likesRouter.delete(
  "/:postId",
  validate({ params: PostLikeParamsSchema }),
  unlikePost,
);

export default likesRouter;
