import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { testDatabaseName, testDatabaseUrl } from "../testDatabaseUrl.ts";

const originalTestDatabaseUrl = process.env.TEST_DATABASE_URL;

beforeEach(() => {
  delete process.env.TEST_DATABASE_URL;
});

afterEach(() => {
  if (originalTestDatabaseUrl === undefined) {
    delete process.env.TEST_DATABASE_URL;
  } else {
    process.env.TEST_DATABASE_URL = originalTestDatabaseUrl;
  }
});

describe("testDatabaseUrl", () => {
  it("requires TEST_DATABASE_URL", () => {
    expect(() => testDatabaseUrl()).toThrow(/TEST_DATABASE_URL/);
  });

  it("returns TEST_DATABASE_URL and parses its database name", () => {
    process.env.TEST_DATABASE_URL =
      "postgresql://user:pass@localhost:5432/odin-book-test";

    expect(testDatabaseUrl()).toBe(
      "postgresql://user:pass@localhost:5432/odin-book-test",
    );
    expect(testDatabaseName()).toBe("odin-book-test");
  });
});
