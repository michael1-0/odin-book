import { describe, expect, it } from "vitest";
import { serverFailure } from "../../../src/utils/actionResult";

describe("serverFailure", () => {
  it("returns the server variant of ActionResult", () => {
    expect(serverFailure("Something broke")).toEqual({
      ok: false,
      kind: "server",
      message: "Something broke",
    });
  });
});
