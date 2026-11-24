import jwt from "jsonwebtoken";
import { beforeEach, describe, expect, it } from "vitest";
import { api } from "../helpers/api.ts";
import { authCookie } from "../helpers/auth.ts";
import { resetDatabase } from "../helpers/db.ts";
import { createUser } from "../helpers/factories.ts";

beforeEach(async () => {
  await resetDatabase();
});

describe("authentication", () => {
  it("rejects requests without a token", async () => {
    const response = await api().get("/api/auth/me");

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      error: { code: 401, message: "Unauthenticated" },
    });
  });

  it("returns the authenticated user", async () => {
    const user = await createUser({ username: "alice" });

    const response = await api()
      .get("/api/auth/me")
      .set("Cookie", authCookie(user));

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      id: user.id,
      githubId: user.githubId,
      username: "alice",
    });
  });

  it("rejects a malformed token", async () => {
    const response = await api()
      .get("/api/auth/me")
      .set("Cookie", "token=not-a-jwt");

    expect(response.status).toBe(401);
  });

  it("rejects a token whose user no longer exists", async () => {
    const user = await createUser();
    const cookie = authCookie(user);

    await resetDatabase();

    const response = await api().get("/api/auth/me").set("Cookie", cookie);

    expect(response.status).toBe(401);
  });

  it("rejects a token with a non-integer subject", async () => {
    const token = jwt.sign({ sub: "not-an-id" }, "test-jwt-secret");

    const response = await api()
      .get("/api/auth/me")
      .set("Cookie", `token=${token}`);

    expect(response.status).toBe(401);
  });

  it("clears the auth cookie on logout", async () => {
    const user = await createUser();

    const response = await api()
      .post("/api/auth/logout")
      .set("Cookie", authCookie(user));

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ success: true });
    expect(response.headers["set-cookie"]?.[0]).toContain("token=;");
  });
});
