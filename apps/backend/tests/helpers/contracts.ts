import { z } from "@repo/zod-validations";

// Parses a real HTTP response body (JSON, so dates are strings) through the
// same schema the frontend types consume. A mismatch fails the test instead
// of silently passing a `toMatchObject` subset.
export function expectContract<T extends z.ZodType>(
  schema: T,
  body: unknown,
): z.output<T> {
  const result = schema.safeParse(body);

  if (!result.success) {
    throw new Error(
      `Response contract failed:\n${JSON.stringify(result.error.issues, null, 2)}`,
    );
  }

  return result.data;
}
