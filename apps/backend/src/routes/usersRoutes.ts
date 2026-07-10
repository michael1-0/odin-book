import type { Router as RouterType } from "express";
import { Router } from "express";
import requireAuth from "../middlewares/authMiddleware.ts";
import {
  getUser,
  getUsersWithoutCurrentUser,
  updateCurrentUser,
} from "../controllers/usersController.ts";
import validate from "express-zod-safe";
import {
  UserGetParamsSchema,
  UserGetQuerySchema,
  UserUpdateBodySchema,
  UserUpdateParamsSchema,
} from "@repo/zod-validations";

const usersRouter: RouterType = Router();

usersRouter.use(requireAuth);

usersRouter.get("/", getUsersWithoutCurrentUser);
usersRouter.put(
  "/:userId",
  validate({ body: UserUpdateBodySchema, params: UserUpdateParamsSchema }),
  updateCurrentUser,
);
usersRouter.get(
  "/:userId",
  validate({ params: UserGetParamsSchema, query: UserGetQuerySchema }),
  getUser,
);

export default usersRouter;
