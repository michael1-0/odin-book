import { describe, expect, it } from "vitest";
import { readFormField } from "../../../src/utils/formData";

describe("readFormField", () => {
  it("returns a non-empty string field", () => {
    const formData = new FormData();
    formData.set("postId", "42");

    expect(readFormField(formData, "postId")).toBe("42");
  });

  it("treats empty values as missing", () => {
    const formData = new FormData();
    formData.set("postId", "");

    expect(readFormField(formData, "postId")).toBeUndefined();
  });

  it("treats absent and non-string values as missing", () => {
    const formData = new FormData();
    formData.set("image", new File(["x"], "x.png"));

    expect(readFormField(formData, "absent")).toBeUndefined();
    expect(readFormField(formData, "image")).toBeUndefined();
  });
});
