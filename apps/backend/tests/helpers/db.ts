import { prisma } from "../../src/db/prisma.ts";
import { isTestDatabaseName } from "../testDatabaseUrl.ts";

// The URL derivation already refuses non-test names, but this guard checks
// the database the Prisma client is actually connected to. It protects the
// destructive helper if setup ordering ever changes or it is imported from
// a differently configured suite.
export async function resetDatabase() {
  const [database] = await prisma.$queryRaw<
    { current_database: string }[]
  >`SELECT current_database()`;

  if (!database || !isTestDatabaseName(database.current_database)) {
    throw new Error(
      `Refusing to truncate non-test database "${database?.current_database ?? "unknown"}".`,
    );
  }

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
