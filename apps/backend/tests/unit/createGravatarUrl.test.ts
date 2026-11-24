import { describe, expect, it } from "vitest";
import createGravatarUrl from "../../src/utils/createGravatarUrl.ts";

// SHA-256 of the normalized address, per the Gravatar URL scheme used here.
const TEST_EMAIL_HASH =
  "973dfe463ec85785f5f95af5ba3906eedb2d931c24e69824a89ea65dba4e813b";

describe("createGravatarUrl", () => {
  it("returns an empty email unchanged", () => {
    expect(createGravatarUrl("")).toBe("");
  });

  it("hashes the trimmed, lowercased email", () => {
    expect(createGravatarUrl("test@example.com")).toBe(
      `https://www.gravatar.com/avatar/${TEST_EMAIL_HASH}`,
    );
    expect(createGravatarUrl("  Test@Example.COM  ")).toBe(
      `https://www.gravatar.com/avatar/${TEST_EMAIL_HASH}`,
    );
  });
});
