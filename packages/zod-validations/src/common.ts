import { z } from "zod";

export const MAX_USERNAME_LENGTH = 30;
export const MAX_NOTE_LENGTH = 280;
export const MAX_CONTENT_LENGTH = 200;
export const MAX_MESSAGE_LENGTH = 1000;

// Date fields appear as ISO strings on the wire and as Date objects in
// Prisma results; `coerce` lets the shared response schemas parse either.
export const createdAt = z.coerce.date().default(() => new Date());
export const coercedId = z.coerce.number().int().positive();

export const messageContent = z
  .string()
  .trim()
  .min(1, "Message cannot be empty")
  .max(MAX_MESSAGE_LENGTH, `Message cannot exceed ${MAX_MESSAGE_LENGTH} chars`);

// `satisfies ValidationSpec` on every endpoint spec turns a typo'd
// location into a compile error; `express-zod-safe` silently ignores keys
// other than these three.
export type ValidationSpec = Partial<
  Record<"params" | "query" | "body", z.ZodType>
>;
