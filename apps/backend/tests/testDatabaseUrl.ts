import "dotenv/config";

export function testDatabaseUrl(): string {
  const url = process.env.TEST_DATABASE_URL;

  if (!url) {
    throw new Error("Set TEST_DATABASE_URL before running integration tests.");
  }

  return url;
}

export function testDatabaseName(): string {
  return decodeURIComponent(
    new URL(testDatabaseUrl()).pathname.replace(/^\//, ""),
  );
}
