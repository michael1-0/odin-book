import type { Router as RouterType } from "express";
import { Router } from "express";
import validate from "express-zod-safe";
import {
  FriendIdParamsSchema,
  MessageCreateBodySchema,
  MessagesGetQuerySchema,
} from "@repo/zod-validations";
import requireAuth from "../middlewares/authMiddleware.ts";
import {
  createMessage,
  getMessages,
} from "../controllers/messagesController.ts";

const messagesRouter: RouterType = Router();

messagesRouter.use(requireAuth);

messagesRouter.get(
  "/:friendId",
  validate({ params: FriendIdParamsSchema, query: MessagesGetQuerySchema }),
  getMessages,
);
messagesRouter.post(
  "/:friendId",
  validate({ params: FriendIdParamsSchema, body: MessageCreateBodySchema }),
  createMessage,
);

export default messagesRouter;
