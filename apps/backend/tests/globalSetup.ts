import { execFileSync } from "node:child_process";
import path from "node:path";
import { testDatabaseName, testDatabaseUrl } from "./testDatabaseUrl.ts";

const backendDir = path.resolve(import.meta.dirname, "..");

function runPrisma(args: string[]) {
  execFileSync("pnpm", ["exec", "prisma", ...args], {
    cwd: backendDir,
    env: { ...process.env, DATABASE_URL: testDatabaseUrl() },
    stdio: "inherit",
  });
}

// Recreates the test database and applies the committed migrations to it.
// The name guard in testDatabaseUrl is the safety net that keeps this from
// ever touching the development database.
export default function setup() {
  console.log(`[integration] Recreating test database "${testDatabaseName()}"`);

  runPrisma(["migrate", "reset", "--force"]);

  // Fail before the tests if schema.prisma has changes that were never
  // captured in a migration.
  runPrisma([
    "migrate",
    "diff",
    "--from-config-datasource",
    "--to-schema",
    "prisma/schema.prisma",
    "--exit-code",
  ]);
}
