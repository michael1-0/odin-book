import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiMutation } from "../../../src/services/http";
import { FORM_FIELDS } from "../../../src/constants/fields";
import { API_PATHS } from "../../../src/constants/api";
import { serverFailure } from "../../../src/utils/actionResult";
import { followUser, unfollowUser } from "../../../src/services/follows";

vi.mock(import("../../../src/services/http"), () => ({
  apiMutation: vi.fn(),
}));

const mutationMock = vi.mocked(apiMutation);

function formDataWith(field: string, value: string) {
  const formData = new FormData();
  formData.set(field, value);
  return formData;
}

beforeEach(() => {
  vi.resetAllMocks();
});

describe("follows service", () => {
  it("returns the resulting follow state", async () => {
    mutationMock.mockResolvedValue({ ok: true, data: {} } as never);
    const formData = formDataWith(FORM_FIELDS.targetUserId, "9");

    await expect(followUser(formData)).resolves.toEqual({
      ok: true,
      data: { isFollowing: true },
    });
    await expect(unfollowUser(formData)).resolves.toEqual({
      ok: true,
      data: { isFollowing: false },
    });

    expect(mutationMock).toHaveBeenNthCalledWith(1, API_PATHS.follows(9), {
      method: "POST",
      failureMessage: "Failed to follow user",
    });
    expect(mutationMock).toHaveBeenNthCalledWith(2, API_PATHS.follows(9), {
      method: "DELETE",
      failureMessage: "Failed to unfollow user",
    });
  });

  it("rejects a follow without a target user ID", async () => {
    await expect(followUser(new FormData())).resolves.toEqual(
      serverFailure("Missing target user ID"),
    );
    await expect(unfollowUser(new FormData())).resolves.toEqual(
      serverFailure("Missing target user ID"),
    );
    expect(mutationMock).not.toHaveBeenCalled();
  });

  it("propagates server failures instead of reporting success", async () => {
    const failure = serverFailure("Failed to follow user");
    mutationMock.mockResolvedValue(failure as never);

    await expect(
      followUser(formDataWith(FORM_FIELDS.targetUserId, "9")),
    ).resolves.toBe(failure);
    await expect(
      unfollowUser(formDataWith(FORM_FIELDS.targetUserId, "9")),
    ).resolves.toBe(failure);
  });
});
