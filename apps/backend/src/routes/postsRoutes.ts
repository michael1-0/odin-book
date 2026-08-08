import type { Router as RouterType } from "express";
import { Router } from "express";
import requireAuth from "../middlewares/authMiddleware.ts";
import {
  createPost,
  getPost,
  getPosts,
} from "../controllers/postsController.ts";
import validate from "express-zod-safe";
import {
  PostCreateBodySchema,
  PostIdParamsSchema,
  PostGetQuerySchema,
  PostsGetQuerySchema,
} from "@repo/zod-validations";

const postsRouter: RouterType = Router();

postsRouter.use(requireAuth);

postsRouter.get("/", validate({ query: PostsGetQuerySchema }), getPosts);
postsRouter.get(
  "/:postId",
  validate({ params: PostIdParamsSchema, query: PostGetQuerySchema }),
  getPost,
);
postsRouter.post("/", validate({ body: PostCreateBodySchema }), createPost);

export default postsRouter;
