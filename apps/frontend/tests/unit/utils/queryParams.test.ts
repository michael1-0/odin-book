import { describe, expect, it } from "vitest";
import { readOffsetParam } from "../../../src/utils/queryParams";

function requestWith(search: string) {
  return new Request(`http://localhost/posts?${search}`);
}

describe("readOffsetParam", () => {
  it("reads a nonnegative integer", () => {
    expect(readOffsetParam(requestWith("offset=20"))).toBe(20);
    expect(readOffsetParam(requestWith("offset=0"))).toBe(0);
  });

  it("returns undefined when the param is absent", () => {
    expect(readOffsetParam(requestWith(""))).toBeUndefined();
  });

  it("treats an empty value as offset zero", () => {
    expect(readOffsetParam(requestWith("offset="))).toBe(0);
  });

  it("ignores malformed values instead of surfacing a 400", () => {
    for (const value of ["abc", "1.5", "-1"]) {
      expect(readOffsetParam(requestWith(`offset=${value}`))).toBeUndefined();
    }
  });
});
