import { describe, expect, it } from "vitest";
import { AppError } from "../../../src/errors/AppError.ts";

describe("AppError", () => {
  it("defaults to an operational 500", () => {
    const error = new AppError("Boom");

    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe("AppError");
    expect(error.message).toBe("Boom");
    expect(error.statusCode).toBe(500);
    expect(error.isOperational).toBe(true);
  });

  it("keeps the supplied status and operational flag", () => {
    const error = new AppError("Upload failed", 502, false);

    expect(error.statusCode).toBe(502);
    expect(error.isOperational).toBe(false);
  });
});
