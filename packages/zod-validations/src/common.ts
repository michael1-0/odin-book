import { z } from "zod";

export const MAX_USERNAME_LENGTH = 30;
export const MAX_NOTE_LENGTH = 280;
export const MAX_CONTENT_LENGTH = 200;
export const MAX_MESSAGE_LENGTH = 1000;

export const createdAt = z.date().default(() => new Date());
export const coercedId = z.coerce.number().int().positive();

export const messageContent = z
  .string()
  .min(1, "Message cannot be empty")
  .max(MAX_MESSAGE_LENGTH, `Message cannot exceed ${MAX_MESSAGE_LENGTH} chars`);
