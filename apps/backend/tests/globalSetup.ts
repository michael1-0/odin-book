import { execFileSync } from "node:child_process";
import path from "node:path";
import { Client } from "pg";
import { testDatabaseName, testDatabaseUrl } from "./testDatabaseUrl.ts";

// Creates the test database on the same server as DATABASE_URL, then resets
// and pushes the Prisma schema into it. The name guard in testDatabaseUrl is
// the safety net that keeps this from ever touching the development database.
export default async function setup() {
  const databaseName = testDatabaseName();
  const adminUrl = new URL(testDatabaseUrl());
  adminUrl.pathname = "/postgres";

  const admin = new Client({ connectionString: adminUrl.toString() });

  await admin.connect();

  try {
    const existing = await admin.query(
      "SELECT 1 FROM pg_database WHERE datname = $1",
      [databaseName],
    );

    if (existing.rowCount === 0) {
      await admin.query(`CREATE DATABASE "${databaseName}"`);
    }
  } finally {
    await admin.end();
  }

  console.log(`[integration] Resetting test database "${databaseName}"`);

  execFileSync("pnpm", ["exec", "prisma", "db", "push", "--force-reset"], {
    cwd: path.resolve(import.meta.dirname, ".."),
    env: { ...process.env, DATABASE_URL: testDatabaseUrl() },
    stdio: "inherit",
  });
}
