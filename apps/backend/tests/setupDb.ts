import { afterAll } from "vitest";
import { prisma } from "../src/db/prisma.ts";

afterAll(async () => {
  await prisma.$disconnect();
});
