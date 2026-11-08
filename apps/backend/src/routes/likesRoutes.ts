import { Router } from "express";
import type { Router as RouterType } from "express";
import requireAuth from "../middlewares/authMiddleware.ts";
import validate from "express-zod-safe";
import { postIdParamsSpec } from "@repo/zod-validations";
import { likePost, unlikePost } from "../controllers/likesController.ts";

const likesRouter: RouterType = Router();

likesRouter.use(requireAuth);

likesRouter.post("/:postId", validate(postIdParamsSpec), likePost);
likesRouter.delete("/:postId", validate(postIdParamsSpec), unlikePost);

export default likesRouter;
