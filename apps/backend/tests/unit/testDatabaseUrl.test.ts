import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { testDatabaseName, testDatabaseUrl } from "../testDatabaseUrl.ts";

const originalDatabaseUrl = process.env.DATABASE_URL;
const originalTestDatabaseUrl = process.env.TEST_DATABASE_URL;

function setEnv(name: string, value: string | undefined) {
  if (value === undefined) {
    delete process.env[name];
  } else {
    process.env[name] = value;
  }
}

beforeEach(() => {
  setEnv("DATABASE_URL", undefined);
  setEnv("TEST_DATABASE_URL", undefined);
});

afterEach(() => {
  setEnv("DATABASE_URL", originalDatabaseUrl);
  setEnv("TEST_DATABASE_URL", originalTestDatabaseUrl);
});

describe("testDatabaseUrl", () => {
  it("suffixes DATABASE_URL with -test", () => {
    setEnv("DATABASE_URL", "postgresql://user:pass@localhost:5432/odin-book");

    expect(testDatabaseUrl()).toBe(
      "postgresql://user:pass@localhost:5432/odin-book-test",
    );
    expect(testDatabaseName()).toBe("odin-book-test");
  });

  it("keeps an already suffixed database name", () => {
    setEnv(
      "DATABASE_URL",
      "postgresql://user:pass@localhost:5432/odin-book_test",
    );

    expect(testDatabaseName()).toBe("odin-book_test");
  });

  it("prefers TEST_DATABASE_URL", () => {
    setEnv("DATABASE_URL", "postgresql://user:pass@localhost:5432/odin-book");
    setEnv(
      "TEST_DATABASE_URL",
      "postgresql://other:secret@db.example.com:5432/custom-test",
    );

    expect(testDatabaseUrl()).toBe(
      "postgresql://other:secret@db.example.com:5432/custom-test",
    );
  });

  it("preserves URL query parameters", () => {
    setEnv(
      "TEST_DATABASE_URL",
      "postgresql://user:pass@localhost:5432/odin-book-test?schema=public&sslmode=require",
    );

    expect(testDatabaseUrl()).toBe(
      "postgresql://user:pass@localhost:5432/odin-book-test?schema=public&sslmode=require",
    );
  });

  it("requires a database name in the URL", () => {
    setEnv("DATABASE_URL", "postgresql://user:pass@localhost:5432");

    expect(() => testDatabaseUrl()).toThrow(/must include a database name/);
  });

  it("refuses to derive from a non-local DATABASE_URL", () => {
    setEnv(
      "DATABASE_URL",
      "postgresql://user:pass@db.example.com:5432/odin-book",
    );

    expect(() => testDatabaseUrl()).toThrow(/non-local host/);
  });

  it("allows an explicit non-local TEST_DATABASE_URL", () => {
    setEnv(
      "DATABASE_URL",
      "postgresql://user:pass@db.example.com:5432/odin-book",
    );
    setEnv(
      "TEST_DATABASE_URL",
      "postgresql://user:pass@db.example.com:5432/odin-book-test",
    );

    expect(testDatabaseName()).toBe("odin-book-test");
  });

  it("refuses an explicitly named non-test database", () => {
    setEnv(
      "TEST_DATABASE_URL",
      "postgresql://user:pass@localhost:5432/odin-book",
    );

    expect(() => testDatabaseUrl()).toThrow(/must end in -test or _test/);
  });

  it("refuses unsafe database names", () => {
    setEnv(
      "TEST_DATABASE_URL",
      'postgresql://user:pass@localhost:5432/evil"; DROP DATABASE x; --_test',
    );

    expect(() => testDatabaseUrl()).toThrow(/Unsafe test database name/);
  });

  it("requires a base URL", () => {
    expect(() => testDatabaseUrl()).toThrow(/Set DATABASE_URL/);
  });
});
