import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiMutation } from "../../../src/services/http";
import { FORM_FIELDS } from "../../../src/constants/fields";
import { API_PATHS } from "../../../src/constants/api";
import { serverFailure } from "../../../src/utils/actionResult";
import { likePost, unlikePost } from "../../../src/services/likes";

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

describe("likes service", () => {
  const missingIdCases = [
    { name: "like", service: likePost },
    { name: "unlike", service: unlikePost },
  ];

  for (const { name, service } of missingIdCases) {
    it(`${name} requires a post ID`, async () => {
      await expect(service(new FormData())).resolves.toEqual(
        serverFailure("Missing post ID"),
      );
      expect(mutationMock).not.toHaveBeenCalled();
    });
  }

  it("likes and unlikes by post ID", async () => {
    const result = { ok: true as const, data: {} };
    mutationMock.mockResolvedValue(result as never);

    await expect(likePost(formDataWith(FORM_FIELDS.postId, "4"))).resolves.toBe(
      result,
    );
    expect(mutationMock).toHaveBeenLastCalledWith(API_PATHS.likes(4), {
      method: "POST",
      failureMessage: "Failed to like post",
    });

    await expect(
      unlikePost(formDataWith(FORM_FIELDS.postId, "4")),
    ).resolves.toBe(result);
    expect(mutationMock).toHaveBeenLastCalledWith(API_PATHS.likes(4), {
      method: "DELETE",
      failureMessage: "Failed to unlike post",
    });
  });

  it.each([
    {
      name: "likePost",
      run: () => likePost(formDataWith(FORM_FIELDS.postId, "12")),
    },
    {
      name: "unlikePost",
      run: () => unlikePost(formDataWith(FORM_FIELDS.postId, "12")),
    },
  ])("$name propagates the server failure", async ({ run }) => {
    const failure = serverFailure("mutation failed");
    mutationMock.mockResolvedValue(failure as never);

    await expect(run()).resolves.toBe(failure);
  });
});
