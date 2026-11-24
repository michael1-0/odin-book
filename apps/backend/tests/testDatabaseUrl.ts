import "dotenv/config";

const TEST_DATABASE_SUFFIX = /(-test|_test)$/;
const SAFE_DATABASE_NAME = /^[A-Za-z0-9_-]+$/;
const LOCAL_HOSTS = new Set([
  "localhost",
  "127.0.0.1",
  "0.0.0.0",
  "::1",
  "[::1]",
]);

export function isTestDatabaseName(database: string): boolean {
  return TEST_DATABASE_SUFFIX.test(database);
}

// Resolves the database integration tests may truncate:
// - TEST_DATABASE_URL wins (must already end in -test/_test).
// - Otherwise DATABASE_URL's database name gets a "-test" suffix, but only
//   on a local host — deriving from a production/remote DATABASE_URL must be
//   an explicit opt-in.
// The suffix guard makes it impossible to point a test run at dev data.
export function testDatabaseUrl(): string {
  const explicitUrl = process.env.TEST_DATABASE_URL;
  const baseUrl = explicitUrl ?? process.env.DATABASE_URL;

  if (!baseUrl) {
    throw new Error(
      "Set DATABASE_URL or TEST_DATABASE_URL before running integration tests.",
    );
  }

  const url = new URL(baseUrl);
  const baseDatabase = decodeURIComponent(url.pathname.replace(/^\//, ""));

  if (!baseDatabase) {
    throw new Error("DATABASE_URL must include a database name.");
  }

  if (!explicitUrl && !LOCAL_HOSTS.has(url.hostname)) {
    throw new Error(
      `Refusing to derive a test database on non-local host "${url.hostname}". Set TEST_DATABASE_URL explicitly.`,
    );
  }

  const database = explicitUrl
    ? baseDatabase
    : isTestDatabaseName(baseDatabase)
      ? baseDatabase
      : `${baseDatabase}-test`;

  if (!isTestDatabaseName(database)) {
    throw new Error(
      `Refusing to run integration tests against "${database}": the database name must end in -test or _test.`,
    );
  }

  if (!SAFE_DATABASE_NAME.test(database)) {
    throw new Error(`Unsafe test database name: "${database}".`);
  }

  url.pathname = `/${database}`;

  return url.toString();
}

export function testDatabaseName(): string {
  return decodeURIComponent(new URL(testDatabaseUrl()).pathname.slice(1));
}
