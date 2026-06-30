import type { Router as RouterType } from "express";
import { Router } from "express";
import { getHealth } from "../controllers/indexController.ts";
import authRouter from "./authRoutes.ts";
import usersRouter from "./usersRoutes.ts";
import postsRouter from "./postsRoutes.ts";

const indexRouter: RouterType = Router();

indexRouter.use("/users", usersRouter);
indexRouter.use("/posts", postsRouter);
indexRouter.use("/auth", authRouter);

indexRouter.get("/health", getHealth);

export default indexRouter;
