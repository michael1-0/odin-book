import type { Router as RouterType } from "express";
import { Router } from "express";
import requireAuth from "../middlewares/authMiddleware.ts";
import { getPosts } from "../controllers/postsController.ts";

const postsRouter: RouterType = Router();

postsRouter.use(requireAuth);

postsRouter.get("/", getPosts);

export default postsRouter;
