import type { Router as RouterType } from "express";
import { Router } from "express";
import requireAuth from "../middlewares/authMiddleware.ts";
import { getPost, getPosts } from "../controllers/postsController.ts";
import validate from "express-zod-safe";
import { PostGetParamsSchema, PostGetQuerySchema } from "@repo/zod-validations";

const postsRouter: RouterType = Router();

postsRouter.use(requireAuth);

postsRouter.get("/", getPosts);
postsRouter.get(
  "/:postId",
  validate({ params: PostGetParamsSchema, query: PostGetQuerySchema }),
  getPost,
);

export default postsRouter;
