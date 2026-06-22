import { Router } from "express";
import type { Router as RouterType } from "express";

import { getHealth } from "../controllers/indexController.ts";
import authRouter from "./authRoutes.ts";

const indexRouter: RouterType = Router();

indexRouter.use("/auth", authRouter);
indexRouter.get("/health", getHealth);

export default indexRouter;
