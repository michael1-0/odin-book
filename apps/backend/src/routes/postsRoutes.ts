import type { Router as RouterType } from "express";
import { Router } from "express";
import requireAuth from "../middlewares/authMiddleware.ts";
import postImagesUploadMiddleware from "../middlewares/postImagesMiddleware.ts";
import {
  createPost,
  deletePost,
  getPost,
  getPosts,
} from "../controllers/postsController.ts";
import validate from "express-zod-safe";
import {
  postCreateSpec,
  postGetSpec,
  postIdParamsSpec,
  postsGetSpec,
} from "@repo/zod-validations";

const postsRouter: RouterType = Router();

postsRouter.use(requireAuth);

postsRouter.get("/", validate(postsGetSpec), getPosts);
postsRouter.get("/:postId", validate(postGetSpec), getPost);
postsRouter.post(
  "/",
  postImagesUploadMiddleware,
  validate(postCreateSpec),
  createPost,
);
postsRouter.delete("/:postId", validate(postIdParamsSpec), deletePost);

export default postsRouter;
