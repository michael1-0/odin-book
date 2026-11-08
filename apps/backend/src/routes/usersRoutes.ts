import type { Router as RouterType } from "express";
import { Router } from "express";
import requireAuth from "../middlewares/authMiddleware.ts";
import {
  getUser,
  getUsersWithoutCurrentUser,
  updateCurrentUser,
} from "../controllers/usersController.ts";
import validate from "express-zod-safe";
import profilePictureUpload from "../middlewares/profilePictureMiddleware.ts";
import {
  userGetSpec,
  usersGetSpec,
  userUpdateSpec,
} from "@repo/zod-validations";

const usersRouter: RouterType = Router();

usersRouter.use(requireAuth);

usersRouter.get("/", validate(usersGetSpec), getUsersWithoutCurrentUser);
usersRouter.put(
  "/:userId",
  profilePictureUpload,
  validate(userUpdateSpec),
  updateCurrentUser,
);
usersRouter.get("/:userId", validate(userGetSpec), getUser);

export default usersRouter;
