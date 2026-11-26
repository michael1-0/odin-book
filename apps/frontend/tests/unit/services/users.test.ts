import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiFetch, apiMutation } from "../../../src/services/http";
import { FORM_FIELDS } from "../../../src/constants/fields";
import { API_PATHS } from "../../../src/constants/api";
import { serverFailure } from "../../../src/utils/actionResult";
import {
  getUserProfile,
  getUsers,
  updateUser,
} from "../../../src/services/users";

vi.mock(import("../../../src/services/http"), () => ({
  apiFetch: vi.fn(),
  apiMutation: vi.fn(),
}));

const fetchMock = vi.mocked(apiFetch);
const mutationMock = vi.mocked(apiMutation);

function formDataWith(field: string, value: string) {
  const formData = new FormData();
  formData.set(field, value);
  return formData;
}

beforeEach(() => {
  vi.resetAllMocks();
});

describe("users service", () => {
  it("loads users with an optional offset", async () => {
    fetchMock.mockResolvedValue({ data: [], nextCursor: null } as never);

    await getUsers(24);
    expect(fetchMock).toHaveBeenCalledWith(API_PATHS.users, {
      query: { offset: 24 },
      failureMessage: "Failed to load users",
    });
  });

  it("requires a user ID to update the profile", async () => {
    await expect(updateUser(new FormData())).resolves.toEqual(
      serverFailure("Missing user ID"),
    );
    expect(mutationMock).not.toHaveBeenCalled();
  });

  it("updates the profile with FormData", async () => {
    const result = { ok: true as const, data: {} };
    mutationMock.mockResolvedValue(result as never);
    const formData = formDataWith(FORM_FIELDS.userId, "5");

    await expect(updateUser(formData)).resolves.toBe(result);

    expect(mutationMock).toHaveBeenCalledWith(API_PATHS.user(5), {
      method: "PUT",
      body: { formData },
      failureMessage: "Failed to update profile",
    });
  });

  it("loads a profile with its posts and unwraps the envelope", async () => {
    const profile = { id: 5, username: "bob" };
    fetchMock.mockResolvedValue({ data: profile } as never);

    await expect(getUserProfile("5")).resolves.toBe(profile);
    expect(fetchMock).toHaveBeenCalledWith(API_PATHS.user(5), {
      query: { include: "posts" },
      failureMessage: "Failed to load profile",
    });
  });

  it("rejects a profile load without a user ID", async () => {
    await expect(getUserProfile(undefined)).rejects.toBeInstanceOf(Response);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("updateUser propagates the server failure", async () => {
    const failure = serverFailure("mutation failed");
    mutationMock.mockResolvedValue(failure as never);

    await expect(
      updateUser(formDataWith(FORM_FIELDS.userId, "5")),
    ).resolves.toBe(failure);
  });
});
