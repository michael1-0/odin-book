import { describe, expect, it } from "vitest";
import * as validations from "./index.js";

// `express-zod-safe` silently ignores keys other than params/query/body, so a
// typo'd key (`querry`) compiles, ships, and then rejects every request. This
// table is the contract: every spec ships exactly its documented locations,
// and each value is a runnable zod schema.
const EXPECTED_SPECS: Record<string, string[]> = {
  postIdParamsSpec: ["params"],
  postsGetSpec: ["query"],
  postGetSpec: ["params", "query"],
  postCreateSpec: ["body"],
  commentCreateSpec: ["body"],
  followParamsSpec: ["params"],
  usersGetSpec: ["query"],
  userGetSpec: ["params", "query"],
  userUpdateSpec: ["params", "body"],
  friendExploreSpec: ["query"],
  targetUserIdParamsSpec: ["params"],
  friendRequestIdParamsSpec: ["params"],
  messagesGetSpec: ["params", "query"],
  messageCreateSpec: ["params", "body"],
};

const ALLOWED_SPEC_KEYS = new Set(["params", "query", "body"]);

function isZodSchema(value: unknown): boolean {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as { safeParse?: unknown }).safeParse === "function"
  );
}

describe("validation specs", () => {
  const exportedSpecs = Object.entries(validations).filter(([name]) =>
    name.endsWith("Spec"),
  );

  it("exports exactly the known specs", () => {
    expect(exportedSpecs.map(([name]) => name).sort()).toEqual(
      Object.keys(EXPECTED_SPECS).sort(),
    );
  });

  it.each(Object.entries(EXPECTED_SPECS))(
    "%s validates exactly %j",
    (specName, expectedKeys) => {
      const spec = (validations as Record<string, unknown>)[specName];

      expect(spec).toBeTypeOf("object");
      expect(spec).not.toBeNull();

      const entries = Object.entries(spec as Record<string, unknown>);

      expect(entries.map(([key]) => key).sort()).toEqual(
        [...expectedKeys].sort(),
      );

      for (const [location, schema] of entries) {
        expect(ALLOWED_SPEC_KEYS.has(location)).toBe(true);
        expect(isZodSchema(schema), `${specName}.${location}`).toBe(true);
      }
    },
  );
});
