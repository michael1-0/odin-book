import { describe, expect, it } from "vitest";
import type { Request } from "express";
import cookieExtractor from "../../src/utils/cookieExtractor.ts";

function requestWithCookies(cookies?: Record<string, string>) {
  return { cookies } as unknown as Request;
}

describe("cookieExtractor", () => {
  it("reads the auth cookie", () => {
    expect(cookieExtractor(requestWithCookies({ token: "jwt-value" }))).toBe(
      "jwt-value",
    );
  });

  it("returns undefined when the auth cookie is absent", () => {
    expect(cookieExtractor(requestWithCookies({}))).toBeUndefined();
  });

  it("returns null when cookie-parser did not run", () => {
    expect(cookieExtractor(requestWithCookies(undefined))).toBeNull();
  });
});
