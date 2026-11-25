import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiMutation } from "./http";
import { API_PATHS } from "../constants/api";
import { serverFailure } from "../utils/actionResult";
import { createComment } from "./comments";

vi.mock("./http", () => ({
  apiMutation: vi.fn(),
}));

const mutationMock = vi.mocked(apiMutation);

beforeEach(() => {
  vi.resetAllMocks();
});

describe("comments service", () => {
  it("posts a JSON comment", async () => {
    const result = { ok: true as const, data: {} };
    mutationMock.mockResolvedValue(result as never);

    await expect(createComment("nice", 7)).resolves.toBe(result);

    expect(mutationMock).toHaveBeenCalledWith(API_PATHS.comments, {
      method: "POST",
      body: { json: { content: "nice", postId: 7 } },
      failureMessage: "Failed to create comment",
    });
  });

  it("createComment propagates the server failure", async () => {
    const failure = serverFailure("mutation failed");
    mutationMock.mockResolvedValue(failure as never);

    await expect(createComment("hi", 12)).resolves.toBe(failure);
  });
});
