import { prisma } from "../../src/db/prisma.ts";

// Truncates every table in the database configured by TEST_DATABASE_URL.
export async function resetDatabase() {
  const tables = await prisma.$queryRaw<
    { tablename: string }[]
  >`SELECT tablename
    FROM pg_tables
    WHERE schemaname = current_schema()
      AND tablename <> '_prisma_migrations'
    ORDER BY tablename`;

  if (tables.length === 0) {
    throw new Error("No tables found in the test database.");
  }

  const tableList = tables
    .map(({ tablename }) => `"${tablename.replaceAll('"', '""')}"`)
    .join(", ");

  await prisma.$executeRawUnsafe(
    `TRUNCATE TABLE ${tableList} RESTART IDENTITY CASCADE`,
  );
}
