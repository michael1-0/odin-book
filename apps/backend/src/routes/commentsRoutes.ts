import { Router } from "express";
import type { Router as RouterType } from "express";
import { createComment } from "../controllers/commentsController.ts";
import requireAuth from "../middlewares/authMiddleware.ts";
import validate from "express-zod-safe";
import { commentCreateSpec } from "@repo/zod-validations";

const commentsRouter: RouterType = Router();

commentsRouter.use(requireAuth);

commentsRouter.post("/", validate(commentCreateSpec), createComment);

export default commentsRouter;
