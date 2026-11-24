import { describe, expect, it } from "vitest";
import { FORM_FIELDS } from "../constants/fields";
import { readIntent, unknownIntent } from "./intent";

describe("readIntent", () => {
  it("reads the intent field", () => {
    const formData = new FormData();
    formData.set(FORM_FIELDS.intent, "create-post");

    expect(readIntent(formData)).toBe("create-post");
  });

  it("throws a 400 Response when the intent is missing", async () => {
    const formData = new FormData();

    try {
      readIntent(formData);
      expect.unreachable("readIntent should have thrown");
    } catch (error) {
      expect(error).toBeInstanceOf(Response);
      expect((error as Response).status).toBe(400);
      expect(await (error as Response).text()).toBe("Unknown intent");
    }
  });

  it("throws when the intent is not a string", () => {
    const formData = new FormData();
    formData.set(FORM_FIELDS.intent, new File(["x"], "x.txt"));

    expect(() => readIntent(formData)).toThrow(Response);
  });
});

describe("unknownIntent", () => {
  it("returns a 400 Response", async () => {
    const response = unknownIntent();

    expect(response.status).toBe(400);
    expect(await response.text()).toBe("Unknown intent");
  });
});
