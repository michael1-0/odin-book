import { Router } from "express";
import type { Router as RouterType } from "express";

import { getHealth } from "../controllers/indexController.ts";
import authRouter from "./authRoutes.ts";
import usersRouter from "./usersRoutes.ts";

const indexRouter: RouterType = Router();

indexRouter.use("/users", usersRouter);
indexRouter.use("/auth", authRouter);
indexRouter.get("/health", getHealth);

export default indexRouter;
