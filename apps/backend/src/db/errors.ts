import { Prisma } from "./generated/prisma/client.ts";

// Prisma error-class checks stay inside the data-access layer so controllers
// and middleware do not need to import the generated client.
function isPrismaKnownRequestError(
  error: unknown,
): error is Prisma.PrismaClientKnownRequestError {
  return error instanceof Prisma.PrismaClientKnownRequestError;
}

export { isPrismaKnownRequestError };
