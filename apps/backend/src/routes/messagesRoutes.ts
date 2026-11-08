import type { Router as RouterType } from "express";
import { Router } from "express";
import validate from "express-zod-safe";
import { messageCreateSpec, messagesGetSpec } from "@repo/zod-validations";
import requireAuth from "../middlewares/authMiddleware.ts";
import {
  createMessage,
  getMessages,
} from "../controllers/messagesController.ts";

const messagesRouter: RouterType = Router();

messagesRouter.use(requireAuth);

messagesRouter.get("/:friendId", validate(messagesGetSpec), getMessages);
messagesRouter.post("/:friendId", validate(messageCreateSpec), createMessage);

export default messagesRouter;
