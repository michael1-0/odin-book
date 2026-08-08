import { Router } from "express";
import type { Router as RouterType } from "express";
import requireAuth from "../middlewares/authMiddleware.ts";
import validate from "express-zod-safe";
import { PostIdParamsSchema } from "@repo/zod-validations";
import { likePost, unlikePost } from "../controllers/likesController.ts";

const likesRouter: RouterType = Router();

likesRouter.use(requireAuth);

likesRouter.post(
  "/:postId",
  validate({ params: PostIdParamsSchema }),
  likePost,
);
likesRouter.delete(
  "/:postId",
  validate({ params: PostIdParamsSchema }),
  unlikePost,
);

export default likesRouter;
