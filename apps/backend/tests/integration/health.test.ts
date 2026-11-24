import { describe, expect, it } from "vitest";
import { api } from "../helpers/api.ts";

describe("GET /api/health", () => {
  it("reports the service as healthy", async () => {
    const response = await api().get("/api/health");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: "ok" });
  });

  it("returns the error envelope for unknown routes", async () => {
    const response = await api().get("/api/does-not-exist");

    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      error: {
        code: 404,
        message: "Route /api/does-not-exist not found",
      },
    });
  });
});
