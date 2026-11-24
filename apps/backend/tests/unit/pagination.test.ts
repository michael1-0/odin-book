import { describe, expect, it } from "vitest";
import { splitPage } from "../../src/utils/pagination.ts";

describe("splitPage", () => {
  it("returns an empty page", () => {
    expect(splitPage([], 3)).toEqual({ items: [], hasMore: false });
  });

  it("keeps a page shorter than the page size", () => {
    expect(splitPage([1, 2], 3)).toEqual({ items: [1, 2], hasMore: false });
  });

  it("keeps a page exactly at the page size", () => {
    expect(splitPage([1, 2, 3], 3)).toEqual({
      items: [1, 2, 3],
      hasMore: false,
    });
  });

  it("slices off the peek row and reports more pages", () => {
    expect(splitPage([1, 2, 3, 4], 3)).toEqual({
      items: [1, 2, 3],
      hasMore: true,
    });
  });

  it("does not mutate the input", () => {
    const rows = [1, 2, 3, 4];

    splitPage(rows, 3);

    expect(rows).toEqual([1, 2, 3, 4]);
  });
});
