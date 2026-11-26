import { afterEach, describe, expect, it, vi } from "vitest";
import type { NextFunction, Request, Response } from "express";
import { Prisma } from "../../../src/db/generated/prisma/client.ts";
import { AppError } from "../../../src/errors/AppError.ts";
import {
  errorHandler,
  notFound,
  validationErrorHandler,
} from "../../../src/middlewares/errorMiddleware.ts";

function createResponse() {
  const status = vi.fn();
  const json = vi.fn();
  const res = { status, json };

  status.mockReturnValue(res);

  return { res: res as unknown as Response, status, json };
}

function createRequest(url = "/api/posts") {
  return { method: "GET", originalUrl: url } as Request;
}

function prismaError(code: string) {
  return new Prisma.PrismaClientKnownRequestError("database error", {
    code,
    clientVersion: "test",
    meta: {},
  });
}

function runErrorHandler(error: unknown) {
  const { res, status, json } = createResponse();
  const next = vi.fn() as NextFunction;

  errorHandler(error, createRequest(), res, next);

  return { status, json };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("errorHandler", () => {
  it("uses the AppError status and message", () => {
    const { status, json } = runErrorHandler(new AppError("Forbidden", 403));

    expect(status).toHaveBeenCalledWith(403);
    expect(json).toHaveBeenCalledWith({
      error: { code: 403, message: "Forbidden" },
    });
  });

  it.each([
    ["P2025", 404, "Resource not found"],
    ["P2003", 404, "Referenced record not found"],
    ["P2002", 409, "Record already exists"],
  ])("maps Prisma %s to %i", (code, expectedStatus, message) => {
    const { status, json } = runErrorHandler(prismaError(code));

    expect(status).toHaveBeenCalledWith(expectedStatus);
    expect(json).toHaveBeenCalledWith({
      error: { code: expectedStatus, message },
    });
  });

  it("hides unknown errors behind a 500 and logs them", () => {
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    const { status, json } = runErrorHandler(new Error("secret internals"));

    expect(status).toHaveBeenCalledWith(500);
    expect(json).toHaveBeenCalledWith({
      error: { code: 500, message: "Internal server error" },
    });
    expect(consoleError).toHaveBeenCalledWith(
      "[errorHandler]",
      expect.objectContaining({ method: "GET", path: "/api/posts" }),
    );
  });

  it("leaves unmapped Prisma codes at 500", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});

    const { status } = runErrorHandler(prismaError("P1000"));

    expect(status).toHaveBeenCalledWith(500);
  });
});

describe("notFound", () => {
  it("forwards a 404 AppError with the requested route", () => {
    const next = vi.fn() as NextFunction;

    notFound(createRequest("/api/nope"), createResponse().res, next);

    expect(next).toHaveBeenCalledWith(expect.any(AppError));

    const error = vi.mocked(next).mock.calls[0]![0] as unknown as AppError;

    expect(error.statusCode).toBe(404);
    expect(error.message).toBe("Route /api/nope not found");
  });
});

describe("validationErrorHandler", () => {
  it("flattens issues per location and capitalizes the first one", async () => {
    const { res, status, json } = createResponse();
    const errors = [
      {
        type: "body",
        errors: {
          issues: [{ message: "Required" }, { message: "Too long" }],
        },
      },
      {
        type: "query",
        errors: { issues: [{ message: "Bad offset" }] },
      },
    ];

    await validationErrorHandler(
      errors as never,
      createRequest(),
      res,
      vi.fn() as NextFunction,
    );

    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith({
      error: {
        code: 400,
        message: "Body: Required, body: Too long, query: Bad offset",
      },
    });
  });
});
