import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiFetch } from "./http";
import { API_PATHS } from "../constants/api";
import { getMe, logout } from "./auth";

vi.mock("./http", () => ({
  apiFetch: vi.fn(),
}));

const fetchMock = vi.mocked(apiFetch);

beforeEach(() => {
  vi.resetAllMocks();
});

describe("auth service", () => {
  it("loads the current user", async () => {
    fetchMock.mockResolvedValue({ id: 1 } as never);

    await expect(getMe()).resolves.toEqual({ id: 1 });
    expect(fetchMock).toHaveBeenCalledWith(API_PATHS.authMe, {
      failureMessage: "Failed to load current user",
    });
  });

  it("logs out with a POST", async () => {
    fetchMock.mockResolvedValue(undefined as never);

    await logout();

    expect(fetchMock).toHaveBeenCalledWith(API_PATHS.authLogout, {
      method: "POST",
      failureMessage: "Failed to log out",
    });
  });
});
