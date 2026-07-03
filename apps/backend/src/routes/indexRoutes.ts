import type { Router as RouterType } from "express";
import { Router } from "express";
import { getHealth } from "../controllers/indexController.ts";
import authRouter from "./authRoutes.ts";
import usersRouter from "./usersRoutes.ts";
import postsRouter from "./postsRoutes.ts";
import commentsRouter from "./commentsRoutes.ts";
import followsRouter from "./followsRoutes.ts";
import likesRouter from "./likesRoutes.ts";

const indexRouter: RouterType = Router();

indexRouter.use("/auth", authRouter);
indexRouter.use("/users", usersRouter);
indexRouter.use("/posts", postsRouter);
indexRouter.use("/comments", commentsRouter);
indexRouter.use("/follows", followsRouter);
indexRouter.use("/likes", likesRouter);

indexRouter.get("/health", getHealth);

export default indexRouter;
