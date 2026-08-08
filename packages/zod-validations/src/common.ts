import { z } from "zod";

export const MAX_USERNAME_LENGTH = 30;
export const MAX_NOTE_LENGTH = 200;
export const MAX_CONTENT_LENGTH = 200;

export const createdAt = z.date().default(() => new Date());
export const coercedId = z.coerce.number().int().positive();
